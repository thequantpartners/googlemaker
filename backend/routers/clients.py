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

router = APIRouter(prefix="/clients", tags=["Clients"])


# ── Get own profile ─────────────────────────────────────────────────────────


@router.get("/me", response_model=UserOut)
async def get_my_profile(
    user: User = Depends(require_client),
):
    return user

from models import UserTier

@router.patch("/me/tier", response_model=UserOut)
async def update_my_tier(
    tier: UserTier,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Simulates a checkout process by updating the user's tier directly."""
    user.tier = tier
    await db.commit()
    await db.refresh(user)
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
        raise HTTPException(status_code=500, detail=f"Google Ads error: {type(e).__name__} - {str(e)}")

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


# ── Get own orchestrator logs ────────────────────────────────────────────────


@router.get("/me/logs", response_model=list[LogOut])
async def get_my_logs(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrchestratorLog)
        .where(OrchestratorLog.user_id == user.id)
        .order_by(OrchestratorLog.executed_at.desc())
        .limit(100)
    )
    return result.scalars().all()


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
