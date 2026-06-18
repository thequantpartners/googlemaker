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


# ── Get own metrics (placeholder) ───────────────────────────────────────────


@router.get("/me/metrics")
async def get_my_metrics(
    _user: User = Depends(require_client),
):
    """Placeholder — will connect to real metrics data source later."""
    return []


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
        plan_limit=limit
    )
