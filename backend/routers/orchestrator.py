"""
routers/orchestrator.py — Orchestrator endpoints (superadmin only).
Placeholder implementations that will be wired to the Google Ads engine later.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import require_superadmin
from database import get_db
from models import GoogleAdsCredential, User, UserRole
from schemas import OrchestratorResult

router = APIRouter(prefix="/orchestrator", tags=["Orchestrator"])


async def _ensure_client_with_creds(
    client_id: str, db: AsyncSession
) -> GoogleAdsCredential:
    """Helper: verify the client exists and has credentials configured."""
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=404, detail="Client not found")

    cred_result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == client_id)
    )
    cred = cred_result.scalar_one_or_none()
    if not cred:
        raise HTTPException(
            status_code=400,
            detail="No Google Ads credentials configured for this client",
        )
    return cred


# ── Dry-run ──────────────────────────────────────────────────────────────────


@router.post("/{client_id}/dry-run", response_model=OrchestratorResult)
async def dry_run(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """
    Placeholder dry-run: validates that credentials exist, then returns a
    simulated result.  Real implementation will query Google Ads API.
    """
    cred = await _ensure_client_with_creds(client_id, db)

    return OrchestratorResult(
        status="success",
        message=(
            "Dry-run completed. No changes were made. "
            "This is a placeholder — real orchestration coming soon."
        ),
        logs=[],
    )


# ── Live run ─────────────────────────────────────────────────────────────────


@router.post("/{client_id}/run", response_model=OrchestratorResult)
async def run(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """
    Placeholder live run: validates that credentials exist, then returns a
    simulated result.  Real implementation will mutate Google Ads campaigns.
    """
    cred = await _ensure_client_with_creds(client_id, db)

    return OrchestratorResult(
        status="success",
        message=(
            "Live run completed. This is a placeholder — "
            "real orchestration coming soon."
        ),
        logs=[],
    )
