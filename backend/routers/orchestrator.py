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
from models import GoogleAdsCredential, OrchestratorLog, User, UserRole
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


def evaluate_campaign(metrics: dict, target_cpa: float = 50.0) -> dict | None:
    """
    Evaluates campaign metrics and returns a recommended action and reason.
    Rules:
    - Rule 1: Spend > 50 and 0 conversions -> PAUSAR
    - Rule 2: Conversions > 0 and CPA > target_cpa * 1.5 -> PAUSAR
    - Rule 3: Conversions > 5 and CPA < target_cpa * 0.8 -> AUMENTAR PRESUPUESTO
    """
    cost = metrics["cost"]
    conversions = metrics["conversions"]
    cpa = cost / conversions if conversions > 0 else 0.0

    if cost > 50.0 and conversions == 0:
        return {
            "action": "PAUSAR",
            "reason": "Gasto superior a 50 sin conversiones",
            "details": {"cost": cost, "conversions": conversions}
        }
    elif conversions > 0 and cpa > target_cpa * 1.5:
        return {
            "action": "PAUSAR",
            "reason": f"CPA ({cpa:.2f}) supera el límite en un 50% (objetivo: {target_cpa})",
            "details": {"cost": cost, "conversions": conversions, "cpa": cpa, "target_cpa": target_cpa}
        }
    elif conversions > 5 and cpa < target_cpa * 0.8:
        return {
            "action": "AUMENTAR PRESUPUESTO",
            "reason": f"Excelente performance: CPA ({cpa:.2f}) muy por debajo del objetivo ({target_cpa})",
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

    logs_out = []

    for cred in creds:
        try:
            client = await asyncio.to_thread(
                get_google_ads_client, cred.refresh_token, cred.login_customer_id
            )
            campaigns = await asyncio.to_thread(
                fetch_campaign_metrics, client, cred.target_customer_id
            )

            cred_logs = []
            for campaign in campaigns:
                try:
                    recommendation = evaluate_campaign(campaign)
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

    logs_out = []

    for cred in creds:
        try:
            client = await asyncio.to_thread(
                get_google_ads_client, cred.refresh_token, cred.login_customer_id
            )
            campaigns = await asyncio.to_thread(
                fetch_campaign_metrics, client, cred.target_customer_id
            )

            cred_logs = []
            for campaign in campaigns:
                try:
                    recommendation = evaluate_campaign(campaign)
                    if recommendation:
                        # Apply the action
                        await asyncio.to_thread(
                            apply_campaign_action,
                            client,
                            cred.target_customer_id,
                            campaign["campaign_id"],
                            recommendation["action"]
                        )

                        log = OrchestratorLog(
                            user_id=client_id,
                            campaign_id=campaign["campaign_id"],
                            campaign_name=campaign["campaign_name"],
                            action=recommendation["action"],
                            reason=recommendation["reason"],
                            details=recommendation["details"],
                            is_dry_run=False,
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
