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
