"""
routers/orchestrator.py — Orchestrator endpoints (superadmin only).
Placeholder implementations that will be wired to the Google Ads engine later.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import asyncio
from typing import Sequence

from auth import require_superadmin
from database import get_db
from models import GoogleAdsCredential, OrchestratorLog, User, UserRole, UserTier
from schemas import OrchestratorResult, LogOut

from services.google_ads_service import (
    get_google_ads_client,
    fetch_campaign_metrics,
    apply_campaign_action,
)

router = APIRouter(prefix="/orchestrator", tags=["Orchestrator"])


async def _ensure_client_with_creds(
    client_id: str, db: AsyncSession
) -> Sequence[GoogleAdsCredential]:
    """Helper: verify the client exists and has credentials configured."""
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=404, detail="Client not found")

    cred_result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == client_id)
    )
    creds = cred_result.scalars().all()
    if not creds:
        raise HTTPException(
            status_code=400,
            detail="No Google Ads credentials configured for this client",
        )
    return creds


def evaluate_campaign(metrics: dict, target_cpa: float = 20.0, tier: UserTier = UserTier.none) -> dict | None:
    """
    Evaluates campaign metrics and returns a recommended action and reason.
    Rules:
    - Rule 1 (PAUSE): Spend > 1.5x target CPA and 0 conversions
    - Rule 2 (PAUSE): Conversions >= 3 and CPA > target_cpa * 1.5
    - Rule 3 (SCALE_HORIZONTAL): Conversions >= 3 and CPA < target_cpa * 0.5 (Scale/Growth only)
    - Rule 4 (SCALE_VERTICAL): Conversions >= 3 and CPA < target_cpa * 0.7 (Scale/Growth only)
    """
    cost = metrics["cost"]
    conversions = metrics["conversions"]
    cpa = cost / conversions if conversions > 0 else 0.0

    # Rule 1: Bleeding budget (Learning Phase Protection)
    if cost > (target_cpa * 1.5) and conversions == 0:
        return {
            "action": "PAUSE",
            "reason": f"APAGADO (Sangrado): Ha gastado ${cost:.2f} (más de 1.5x el CPA objetivo de ${target_cpa:.2f}) sin conversiones.",
            "details": {"cost": cost, "conversions": conversions, "target_cpa": target_cpa}
        }
    
    if conversions >= 3:
        if cpa > target_cpa * 1.5:
            return {
                "action": "PAUSE",
                "reason": f"APAGADO: CPA (${cpa:.2f}) supera el límite en un 50% (objetivo: ${target_cpa:.2f}).",
                "details": {"cost": cost, "conversions": conversions, "cpa": cpa, "target_cpa": target_cpa}
            }
        elif cpa < target_cpa * 0.5 and tier in [UserTier.scale, UserTier.growth]:
            return {
                "action": "SCALE_HORIZONTAL",
                "reason": f"ESCALADO HORIZONTAL: Mina de oro. CPA (${cpa:.2f}) es menor al 50% del objetivo. Sugerencia: Clonar estructura.",
                "details": {"cost": cost, "conversions": conversions, "cpa": cpa, "target_cpa": target_cpa}
            }
        elif cpa < target_cpa * 0.7 and tier in [UserTier.scale, UserTier.growth]:
            return {
                "action": "SCALE_VERTICAL",
                "reason": f"ESCALADO VERTICAL: Excelente performance. CPA (${cpa:.2f}) menor al 70% del objetivo. Sugerencia: Aumentar presupuesto un 25%.",
                "details": {"cost": cost, "conversions": conversions, "cpa": cpa, "target_cpa": target_cpa}
            }

    return None


# ── Dry-run ──────────────────────────────────────────────────────────────────


@router.post("/{client_id}/dry-run", response_model=OrchestratorResult)
async def dry_run(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """
    Dry-run: evaluates campaigns for a client without modifying Google Ads.
    """
    creds = await _ensure_client_with_creds(client_id, db)
    
    result = await db.execute(select(User).where(User.id == client_id))
    client_user = result.scalar_one_or_none()

    logs_out = []

    for cred in creds:
        try:
            from encryption import decrypt_value
            refresh_token = decrypt_value(cred.refresh_token)
            login_id = decrypt_value(cred.login_customer_id)
            target_id = decrypt_value(cred.target_customer_id)

            client = await asyncio.to_thread(
                get_google_ads_client, refresh_token, login_id
            )
            campaigns = await asyncio.to_thread(
                fetch_campaign_metrics, client, target_id
            )

            cred_logs = []
            for campaign in campaigns:
                try:
                    recommendation = evaluate_campaign(campaign, tier=client_user.tier)
                    if recommendation:
                        log = OrchestratorLog(
                            user_id=client_id,
                            campaign_id=campaign["campaign_id"],
                            campaign_name=campaign["campaign_name"],
                            action=recommendation["action"],
                            reason=recommendation["reason"],
                            details=recommendation["details"],
                            is_dry_run=True,
                        )
                        db.add(log)
                        cred_logs.append(log)
                except Exception as inner_e:
                    print(f"Error evaluating campaign {campaign['campaign_id']}: {inner_e}")

            if cred_logs:
                await db.commit()
                for log in cred_logs:
                    await db.refresh(log)
                logs_out.extend(cred_logs)

        except Exception as e:
            # For robustness, we catch exceptions per credential so one failure
            # doesn't completely break the endpoint for the client's other accounts.
            print(f"Error processing credentials for target {cred.target_customer_id}: {e}")

    return OrchestratorResult(
        status="success",
        message="Dry-run completed. No changes were made to Google Ads.",
        logs=[LogOut.model_validate(log) for log in logs_out],
    )


# ── Live run ─────────────────────────────────────────────────────────────────


@router.post("/{client_id}/run", response_model=OrchestratorResult)
async def run(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """
    Live run: evaluates campaigns and mutates Google Ads for a client.
    """
    creds = await _ensure_client_with_creds(client_id, db)
    
    result = await db.execute(select(User).where(User.id == client_id))
    client_user = result.scalar_one_or_none()

    logs_out = []

    for cred in creds:
        try:
            from encryption import decrypt_value
            refresh_token = decrypt_value(cred.refresh_token)
            login_id = decrypt_value(cred.login_customer_id)
            target_id = decrypt_value(cred.target_customer_id)

            client = await asyncio.to_thread(
                get_google_ads_client, refresh_token, login_id
            )
            campaigns = await asyncio.to_thread(
                fetch_campaign_metrics, client, target_id
            )

            cred_logs = []
            for campaign in campaigns:
                try:
                    recommendation = evaluate_campaign(campaign, tier=client_user.tier)
                    if recommendation:
                        action_type = recommendation["action"]
                        log_status = "pending"

                        # Apply the action ONLY if it's PAUSE (budget protection)
                        if action_type == "PAUSE":
                            await asyncio.to_thread(
                                apply_campaign_action,
                                client,
                                target_id,
                                campaign["campaign_id"],
                                action_type
                            )
                            log_status = "auto_applied"

                        log = OrchestratorLog(
                            user_id=client_id,
                            campaign_id=campaign["campaign_id"],
                            campaign_name=campaign["campaign_name"],
                            action=action_type,
                            reason=recommendation["reason"],
                            details=recommendation["details"],
                            is_dry_run=False,
                            status=log_status,
                        )
                        db.add(log)
                        cred_logs.append(log)
                except Exception as inner_e:
                    print(f"Error mutating campaign {campaign['campaign_id']}: {inner_e}")

            if cred_logs:
                await db.commit()
                for log in cred_logs:
                    await db.refresh(log)
                logs_out.extend(cred_logs)

        except Exception as e:
            # For robustness, we catch exceptions per credential so one failure
            # doesn't completely break the endpoint for the client's other accounts.
            print(f"Error processing credentials for target {cred.target_customer_id}: {e}")

    return OrchestratorResult(
        status="success",
        message="Live run completed. Google Ads campaigns have been modified according to recommendations.",
        logs=[LogOut.model_validate(log) for log in logs_out],
    )


# ── Cron Run ─────────────────────────────────────────────────────────────────


@router.post("/cron-run", response_model=OrchestratorResult)
async def cron_run(
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """
    Cron run: evaluates campaigns for ALL clients and applies automatic rules.
    Intended to be called by a scheduler (e.g. Railway cron) with a superadmin token.
    """
    # Fetch all clients
    result = await db.execute(select(User).where(User.role == UserRole.client))
    clients = result.scalars().all()

    logs_out = []

    for client_user in clients:
        try:
            # Re-use the existing `run` logic but call it programmatically 
            # Or just duplicate the credential loop here
            cred_result = await db.execute(
                select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == client_user.id)
            )
            creds = cred_result.scalars().all()
            if not creds:
                continue

            for cred in creds:
                try:
                    from encryption import decrypt_value
                    refresh_token = decrypt_value(cred.refresh_token)
                    login_id = decrypt_value(cred.login_customer_id)
                    target_id = decrypt_value(cred.target_customer_id)

                    client = await asyncio.to_thread(get_google_ads_client, refresh_token, login_id)
                    campaigns = await asyncio.to_thread(fetch_campaign_metrics, client, target_id)

                    cred_logs = []
                    for campaign in campaigns:
                        try:
                            recommendation = evaluate_campaign(campaign, tier=client_user.tier)
                            if recommendation:
                                action_type = recommendation["action"]
                                log_status = "pending"

                                if action_type == "PAUSE":
                                    await asyncio.to_thread(
                                        apply_campaign_action,
                                        client, target_id, campaign["campaign_id"], action_type
                                    )
                                    log_status = "auto_applied"

                                log = OrchestratorLog(
                                    user_id=client_user.id,
                                    campaign_id=campaign["campaign_id"],
                                    campaign_name=campaign["campaign_name"],
                                    action=action_type,
                                    reason=recommendation["reason"],
                                    details=recommendation["details"],
                                    is_dry_run=False,
                                    status=log_status,
                                )
                                db.add(log)
                                cred_logs.append(log)
                        except Exception as inner_e:
                            print(f"Error mutating campaign {campaign['campaign_id']}: {inner_e}")

                    if cred_logs:
                        await db.commit()
                        for log in cred_logs:
                            await db.refresh(log)
                        logs_out.extend(cred_logs)

                except Exception as e:
                    print(f"Error processing credentials for client {client_user.id}: {e}")

        except Exception as e:
            print(f"Error processing cron for client {client_user.id}: {e}")

    return OrchestratorResult(
        status="success",
        message=f"Cron run completed for {len(clients)} clients.",
        logs=[LogOut.model_validate(log) for log in logs_out],
    )
