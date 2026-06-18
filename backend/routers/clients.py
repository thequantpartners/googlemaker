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


from models import GoogleAdsCredential
from schemas import CredentialsStatus

@router.get("/me/credentials/status", response_model=CredentialsStatus)
async def get_my_credentials_status(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        return CredentialsStatus(is_configured=False, is_verified=False)
    return CredentialsStatus(
        is_configured=True,
        is_verified=cred.is_verified,
        last_verified_at=cred.last_verified_at,
    )
