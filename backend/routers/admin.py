"""
routers/admin.py — SuperAdmin endpoints for managing clients and their
Google Ads credentials.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import require_superadmin
from database import get_db
from encryption import encrypt_value
from models import GoogleAdsCredential, OrchestratorLog, User, UserRole, UserStatus
from schemas import (
    ClientCreate,
    ClientOut,
    CredentialsCreate,
    CredentialsStatus,
    LogOut,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── List all clients ────────────────────────────────────────────────────────


@router.get("/clients", response_model=list[ClientOut])
async def list_clients(
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.role == UserRole.client).order_by(User.created_at.desc())
    )
    return result.scalars().all()


# ── Create a new client ─────────────────────────────────────────────────────


@router.post("/clients", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientCreate,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    # Check uniqueness
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    user = User(
        email=body.email,
        name=body.name,
        role=UserRole.client,
        status=UserStatus.active,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


# ── Get client detail ───────────────────────────────────────────────────────


@router.get("/clients/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=404, detail="Client not found")
    return user


# ── Delete client ────────────────────────────────────────────────────────────


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=404, detail="Client not found")
    await db.delete(user)
    await db.flush()


# ── Save Google Ads credentials (encrypted) ─────────────────────────────────


@router.post(
    "/clients/{client_id}/credentials",
    response_model=CredentialsStatus,
    status_code=status.HTTP_201_CREATED,
)
async def save_credentials(
    client_id: str,
    body: CredentialsCreate,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    # Verify client exists
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Upsert: delete old credentials if any
    old = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == client_id)
    )
    old_cred = old.scalar_one_or_none()
    if old_cred:
        await db.delete(old_cred)
        await db.flush()

    cred = GoogleAdsCredential(
        user_id=client_id,
        developer_token=encrypt_value(body.developer_token),
        oauth_client_id=encrypt_value(body.oauth_client_id),
        oauth_client_secret=encrypt_value(body.oauth_client_secret),
        refresh_token=encrypt_value(body.refresh_token),
        login_customer_id=encrypt_value(body.login_customer_id),
        target_customer_id=encrypt_value(body.target_customer_id),
        is_verified=False,
    )
    db.add(cred)
    await db.flush()
    await db.refresh(cred)

    return CredentialsStatus(
        is_configured=True,
        is_verified=cred.is_verified,
        last_verified_at=cred.last_verified_at,
    )


# ── Get credential status ───────────────────────────────────────────────────


@router.get("/clients/{client_id}/credentials/status", response_model=CredentialsStatus)
async def get_credentials_status(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == client_id)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        return CredentialsStatus(is_configured=False, is_verified=False)
    return CredentialsStatus(
        is_configured=True,
        is_verified=cred.is_verified,
        last_verified_at=cred.last_verified_at,
    )


# ── Remove credentials ──────────────────────────────────────────────────────


@router.delete("/clients/{client_id}/credentials", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credentials(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == client_id)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="No credentials found for this client")
    await db.delete(cred)
    await db.flush()
