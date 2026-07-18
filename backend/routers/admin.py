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
from models import GoogleAdsCredential, User, UserRole, UserStatus
from schemas import (
    ClientCreate,
    ClientOut,
    CredentialsCreate,
    CredentialsStatus,
    LogOut,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Dashboard Stats ────────────────────────────────────────────────────────


@router.get("/stats")
async def get_admin_stats(
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    # Total Clients
    result = await db.execute(select(User).where(User.role == UserRole.client))
    total_clients = len(result.scalars().all())

    return {
        "total_clients": total_clients,
        "active_campaigns": 0,  # Placeholder until Google Ads integration is complete
    }


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


# ── Update client status / tier ─────────────────────────────────────────────


from models import UserTier

@router.patch("/clients/{client_id}/status", response_model=ClientOut)
async def update_client_status(
    client_id: str,
    status: UserStatus,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=404, detail="Client not found")
    user.status = status
    await db.commit()
    await db.refresh(user)
    return user

@router.patch("/clients/{client_id}/tier", response_model=ClientOut)
async def update_client_tier(
    client_id: str,
    tier: UserTier,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.client:
        raise HTTPException(status_code=404, detail="Client not found")
    user.tier = tier
    await db.commit()
    await db.refresh(user)
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


from models import get_plan_limit
from schemas import ConnectedAccount
from encryption import decrypt_value

@router.get("/clients/{client_id}/credentials/status", response_model=CredentialsStatus)
async def get_credentials_status(
    client_id: str,
    _admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    # Get user to know tier
    user_result = await db.execute(select(User).where(User.id == client_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")

    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == client_id)
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
