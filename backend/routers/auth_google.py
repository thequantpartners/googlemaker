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
from models import GoogleAdsCredential, User
from encryption import encrypt_value, decrypt_value
from auth import JWT_SECRET, JWT_ALGORITHM

router = APIRouter(prefix="/auth/google-ads", tags=["OAuth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_ADS_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_ADS_CLIENT_SECRET", "")


@router.get("/login")
async def google_ads_login(token: str, request: Request):
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

    # Encrypt user_id to use as state to prevent CSRF and identify the user in the callback
    state = encrypt_value(user_id)

    # Determine redirect URI dynamically
    redirect_uri = str(request.base_url).rstrip("/") + "/auth/google-ads/callback"
    # Ensure https in production
    if "railway.app" in redirect_uri:
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
        user_id = decrypt_value(state)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    # Get the user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    redirect_uri = str(request.base_url).rstrip("/") + "/auth/google-ads/callback"
    if "railway.app" in redirect_uri:
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
    old = await db.execute(select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id))
    old_cred = old.scalar_one_or_none()
    if old_cred:
        await db.delete(old_cred)
        await db.flush()

    cred = GoogleAdsCredential(
        user_id=user.id,
        developer_token="",  # Handled by system env variables now
        oauth_client_id="",
        oauth_client_secret="",
        refresh_token=encrypt_value(refresh_token),
        login_customer_id=encrypt_value("PENDING"),
        target_customer_id=encrypt_value("PENDING"),
        is_verified=True,
    )
    db.add(cred)
    await db.commit()

    # Redirect back to the frontend dashboard
    frontend_url = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")[0]
    return RedirectResponse(f"{frontend_url}/dashboard?connected=success")
