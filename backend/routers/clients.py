"""
routers/clients.py — Client-facing endpoints (require client role).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import require_client
from database import get_db
from models import OrchestratorLog, User
from schemas import LogOut, UserOut
from services.google_ads_service import apply_campaign_action

router = APIRouter(prefix="/clients", tags=["Clients"])


# ── Get own profile ─────────────────────────────────────────────────────────


@router.get("/me", response_model=UserOut)
async def get_my_profile(
    user: User = Depends(require_client),
):
    return user


# ── Get own campaigns from Google Ads API ─────────────────────────────────────


from fastapi import HTTPException
from services.google_ads_service import get_google_ads_client, fetch_campaign_metrics

@router.get("/me/campaigns")
async def get_my_campaigns(
    customer_id: str | None = None,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch campaigns and metrics from Google Ads API for the given customer_id,
    or default to the first available credential.
    """
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    creds = result.scalars().all()
    if not creds:
        return []
    
    if customer_id and (customer_id.startswith("Unknown") or customer_id.startswith("PENDING")):
        raise HTTPException(status_code=400, detail="Credenciales inválidas. Por favor desconecta y vuelve a conectar tu cuenta de Google Ads.")

    selected_cred = None
    if customer_id:
        for c in creds:
            try:
                target = decrypt_value(c.target_customer_id)
                if target == customer_id or target.replace("-", "") == customer_id.replace("-", ""):
                    selected_cred = c
                    break
            except:
                pass
    else:
        selected_cred = creds[0]

    if not selected_cred:
        raise HTTPException(status_code=404, detail="Customer ID not found in your connected accounts")

    try:
        refresh_token = decrypt_value(selected_cred.refresh_token)
        target = decrypt_value(selected_cred.target_customer_id)
        login = decrypt_value(selected_cred.login_customer_id)
        
        client = get_google_ads_client(refresh_token, login)
        campaigns = fetch_campaign_metrics(client, target)
        return campaigns
    except Exception as e:
        error_msg = str(e).lower()
        # Account not enabled or deactivated — return empty campaigns, not a 500
        if "not yet enabled" in error_msg or "deactivated" in error_msg:
            return []
        raise HTTPException(status_code=500, detail=f"Google Ads error: {type(e).__name__} - {str(e)}")

from schemas import CreateCampaignRequest
from services.google_ads_service import create_full_search_campaign

@router.post("/me/campaigns")
async def create_my_campaign(
    request: CreateCampaignRequest,
    customer_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new Search campaign for the given customer_id.
    """
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    creds = result.scalars().all()
    if not creds:
        raise HTTPException(status_code=400, detail="No tienes cuentas conectadas.")

    selected_cred = None
    for c in creds:
        try:
            target = decrypt_value(c.target_customer_id)
            if target == customer_id or target.replace("-", "") == customer_id.replace("-", ""):
                selected_cred = c
                break
        except:
            pass

    if request.target_cpa and user.tier != UserTier.growth:
        raise HTTPException(status_code=403, detail="Custom CPA strategies are only available on the Growth plan.")

    if not selected_cred:
        raise HTTPException(status_code=404, detail="Customer ID not found in your connected accounts")

    try:
        refresh_token = decrypt_value(selected_cred.refresh_token)
        login = decrypt_value(selected_cred.login_customer_id)
        
        client = get_google_ads_client(refresh_token, login)
        
        # Build the config dict for the service
        config = {
            "campaign_name": request.campaign_name,
            "daily_budget": request.daily_budget,
            "keywords": request.keywords,
            "headlines": request.headlines,
            "descriptions": request.descriptions,
            "final_url": request.final_url
        }
        if request.target_cpa:
            config["target_cpa"] = request.target_cpa
        
        result = create_full_search_campaign(client, target, config)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/me/credentials", status_code=204)
async def delete_my_credentials(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Allows a client to delete all their connected Google Ads accounts."""
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    creds = result.scalars().all()
    for c in creds:
        await db.delete(c)
    await db.commit()

@router.delete("/me/credentials/{credential_id}", status_code=204)
async def delete_single_credential(
    credential_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Allows a client to delete a specific connected Google Ads account by ID."""
    result = await db.execute(
        select(GoogleAdsCredential).where(
            GoogleAdsCredential.id == credential_id,
            GoogleAdsCredential.user_id == user.id
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    await db.delete(cred)
    await db.commit()


@router.post("/me/credentials/{credential_id}/pixel")
async def generate_tracking_pixel(
    credential_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Generates a Google Ads Conversion Action (Pixel) and returns the gtag snippet."""
    result = await db.execute(
        select(GoogleAdsCredential).where(
            GoogleAdsCredential.id == credential_id,
            GoogleAdsCredential.user_id == user.id
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    try:
        refresh_token = decrypt_value(cred.refresh_token)
        target = decrypt_value(cred.target_customer_id)
        login = decrypt_value(cred.login_customer_id)
        
        from services.google_ads_service import get_google_ads_client, create_conversion_action
        client = get_google_ads_client(refresh_token, login)
        
        # We run this in a thread since it's blocking
        import asyncio
        pixel_data = await asyncio.to_thread(
            create_conversion_action,
            client,
            target,
            "GoogleMaker Lead Conversion"
        )
        return pixel_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



# ── Get own orchestrator logs ────────────────────────────────────────────────


@router.get("/me/logs", response_model=list[LogOut])
async def get_my_logs(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(OrchestratorLog)
            .where(OrchestratorLog.user_id == user.id)
            .order_by(OrchestratorLog.executed_at.desc())
            .limit(100)
        )
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/me/logs/{log_id}/approve")
async def approve_log(
    log_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrchestratorLog).where(
            OrchestratorLog.id == log_id,
            OrchestratorLog.user_id == user.id,
            OrchestratorLog.status == "pending"
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found or already processed")

    # Get credentials to apply action
    cred_result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    cred = cred_result.scalars().first()
    if not cred:
        raise HTTPException(status_code=400, detail="No Google Ads credentials")

    try:
        refresh_token = decrypt_value(cred.refresh_token)
        target = decrypt_value(cred.target_customer_id)
        login = decrypt_value(cred.login_customer_id)
        
        client = get_google_ads_client(refresh_token, login)
        
        import asyncio
        await asyncio.to_thread(
            apply_campaign_action,
            client,
            target,
            log.campaign_id,
            log.action
        )
        
        log.status = "approved"
        await db.commit()
        return {"status": "success", "message": "Action applied and approved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/me/logs/{log_id}/reject")
async def reject_log(
    log_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrchestratorLog).where(
            OrchestratorLog.id == log_id,
            OrchestratorLog.user_id == user.id,
            OrchestratorLog.status == "pending"
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found or already processed")

    log.status = "rejected"
    await db.commit()
    return {"status": "success", "message": "Action rejected"}


# ── Get own credential status ───────────────────────────────────────────────


from models import GoogleAdsCredential, UserTier, get_plan_limit
from schemas import CredentialsStatus, ConnectedAccount
from encryption import decrypt_value

@router.get("/me/credentials/status", response_model=CredentialsStatus)
async def get_my_credentials_status(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    creds = result.scalars().all()
    limit = get_plan_limit(user.tier)
    
    accounts = []
    for c in creds:
        try:
            target = decrypt_value(c.target_customer_id)
        except:
            target = "Unknown"
        accounts.append(ConnectedAccount(
            id=c.id,
            target_customer_id=target,
            is_verified=c.is_verified
        ))
        
    return CredentialsStatus(
        is_configured=len(accounts) > 0,
        connected_accounts=accounts,
        plan_limit=limit,
        user_status=user.status.value if hasattr(user.status, 'value') else user.status
    )
