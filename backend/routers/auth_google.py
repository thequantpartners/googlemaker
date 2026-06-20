"""
routers/auth_google.py — Google Ads OAuth endpoints.
"""

import os
import urllib.parse
import httpx

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt

from database import get_db
from models import GoogleAdsCredential, User, get_plan_limit
from encryption import encrypt_value, decrypt_value
from auth import JWT_SECRET, JWT_ALGORITHM
from services.google_ads_service import fetch_accessible_customers

router = APIRouter(prefix="/auth/google-ads", tags=["OAuth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_ADS_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_ADS_CLIENT_SECRET", "")


@router.get("/login")
async def google_ads_login(token: str, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Initiate the Google Ads OAuth flow.
    The frontend passes the user's JWT as a query param `?token=...`
    so we can authenticate them and pass their ID in the `state`.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Missing GOOGLE_ADS_CLIENT_ID in env")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("No sub in token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Check user status
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.status.value == "suspended":
        raise HTTPException(status_code=403, detail="User account is suspended")

    # Check plan limit before starting OAuth
    from sqlalchemy import func
    limit = get_plan_limit(user.tier)
    if limit is not None:
        count_result = await db.execute(
            select(func.count(GoogleAdsCredential.id)).where(
                GoogleAdsCredential.user_id == user.id,
                GoogleAdsCredential.target_customer_id != encrypt_value("PENDING")
            )
        )
        current_count = count_result.scalar_one()
        if current_count >= limit:
            frontend_url = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")[0]
            error_msg = f"Has alcanzado el límite de {limit} cuenta(s) para tu plan {user.tier.value.capitalize()}."
            return RedirectResponse(f"{frontend_url}/dashboard?connected=error&message={urllib.parse.quote(error_msg)}")

    # Extract frontend origin from Referer header to redirect back to the correct environment
    origin = request.headers.get("referer")
    if origin:
        parsed = urllib.parse.urlparse(origin)
        frontend_url = f"{parsed.scheme}://{parsed.netloc}"
    else:
        frontend_url = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")[0]

    # Encrypt user_id and frontend_url to use as state to prevent CSRF and identify the user in the callback
    state_payload = f"{user_id}::{frontend_url}"
    state = encrypt_value(state_payload)

    # Determine redirect URI dynamically
    redirect_uri = str(request.base_url).rstrip("/") + "/auth/google-ads/callback"
    # Ensure https in production
    if "localhost" not in redirect_uri and "127.0.0.1" not in redirect_uri:
        redirect_uri = redirect_uri.replace("http://", "https://")

    # Build Google OAuth URL
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/adwords",
        "access_type": "offline",
        "prompt": "consent",  # Force consent to ensure we get a refresh token
        "state": state,
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)


@router.get("/callback")
async def google_ads_callback(request: Request, code: str, state: str, db: AsyncSession = Depends(get_db)):
    """
    Handle the callback from Google. Exchange code for refresh_token and save.
    """
    try:
        decrypted_state = decrypt_value(state)
        parts = decrypted_state.split("::")
        user_id = parts[0]
        frontend_url = parts[1] if len(parts) > 1 else os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")[0]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    # Get the user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    redirect_uri = str(request.base_url).rstrip("/") + "/auth/google-ads/callback"
    if "localhost" not in redirect_uri and "127.0.0.1" not in redirect_uri:
        redirect_uri = redirect_uri.replace("http://", "https://")

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange token: {resp.text}")
        
        token_data = resp.json()

    refresh_token = token_data.get("refresh_token")
    if not refresh_token:
        # If the user already authorized the app previously, Google might not return a refresh_token
        # without `prompt=consent`, but we enforce it. Just in case:
        raise HTTPException(status_code=400, detail="No refresh token returned. Try revoking app access in Google Account and try again.")

    # Upsert the GoogleAdsCredential
    # Delete any existing PENDING credential for this user so they don't stack up
    pending_old = await db.execute(
        select(GoogleAdsCredential).where(
            GoogleAdsCredential.user_id == user.id,
            GoogleAdsCredential.target_customer_id == encrypt_value("PENDING")
        )
    )
    for p_cred in pending_old.scalars().all():
        await db.delete(p_cred)
    await db.flush()

    # Fetch accessible customers
    try:
        accessible_customers = fetch_accessible_customers(refresh_token)
        if not accessible_customers:
            raise ValueError("NO_ADS_ACCOUNTS")
    except Exception as ex:
        error_str = str(ex)
        if "NOT_ADS_USER" in error_str or "NO_ADS_ACCOUNTS" in error_str:
            error_msg = "Esta cuenta de Google no tiene cuentas de Google Ads asociadas o accesibles. Crea una cuenta en ads.google.com o usa otra cuenta."
        else:
            error_msg = f"Error al conectar Google Ads: {error_str[:200]}"
        return RedirectResponse(f"{frontend_url}/dashboard?connected=error&message={urllib.parse.quote(error_msg)}")

    # Get existing credentials for this user to avoid duplicates
    existing_creds_result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    existing_creds = existing_creds_result.scalars().all()
    existing_targets = set()
    for c in existing_creds:
        try:
            existing_targets.add(decrypt_value(c.target_customer_id))
        except:
            pass

    # Insert new leaf accounts
    added_count = 0
    for acc in accessible_customers:
        target_id = acc["target_customer_id"]
        login_id = acc["login_customer_id"]
        
        if target_id not in existing_targets:
            cred = GoogleAdsCredential(
                user_id=user.id,
                developer_token="",  # Handled by system env variables now
                oauth_client_id="",
                oauth_client_secret="",
                refresh_token=encrypt_value(refresh_token),
                login_customer_id=encrypt_value(login_id),
                target_customer_id=encrypt_value(target_id),
                is_verified=True,
            )
            db.add(cred)
            existing_targets.add(target_id)
            added_count += 1

    await db.commit()

    # Redirect back to the frontend dashboard
    return RedirectResponse(f"{frontend_url}/dashboard?connected=success")
