"""
routers/auth_google_calendar.py — Google Calendar OAuth endpoints.
"""

import os
import urllib.parse
import httpx

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt

from database import get_db
from models import User, ClientPaymentConfig
from encryption import encrypt_value, decrypt_value
from auth import JWT_SECRET, JWT_ALGORITHM

router = APIRouter(prefix="/auth/google-calendar", tags=["OAuth Calendar"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_ADS_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_ADS_CLIENT_SECRET", "")


@router.get("/login")
async def google_calendar_login(token: str, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Initiate the Google Calendar OAuth flow.
    The frontend passes the user's JWT as a query param `?token=...`
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

    # Extract frontend origin from Referer header
    origin = request.headers.get("referer")
    if origin:
        parsed = urllib.parse.urlparse(origin)
        frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        frontend_path = parsed.path
    else:
        frontend_url = os.getenv("FRONTEND_ORIGINS", "https://qss.thequantpartners.com").split(",")[0]
        frontend_path = "/dashboard"

    # Encrypt user_id and frontend_url to use as state to prevent CSRF
    state_payload = f"{user_id}::{frontend_url}::{frontend_path}"
    state = encrypt_value(state_payload)

    # Determine redirect URI dynamically
    redirect_uri = str(request.base_url).rstrip("/") + "/auth/google-calendar/callback"
    if "localhost" not in redirect_uri and "127.0.0.1" not in redirect_uri:
        redirect_uri = redirect_uri.replace("http://", "https://")

    # Build Google OAuth URL
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar.events",
        "access_type": "offline",
        "prompt": "consent",  # Force consent to ensure we get a refresh token
        "state": state,
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)


@router.get("/callback")
async def google_calendar_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle the callback from Google OAuth for Calendar.
    """
    error = request.query_params.get("error")
    code = request.query_params.get("code")
    state = request.query_params.get("state")

    frontend_url = os.getenv("FRONTEND_ORIGINS", "https://qss.thequantpartners.com").split(",")[0]
    frontend_path = "/dashboard"

    if state:
        try:
            state_payload = decrypt_value(state)
            parts = state_payload.split("::")
            if len(parts) >= 3:
                user_id = parts[0]
                frontend_url = parts[1]
                frontend_path = parts[2]
            elif len(parts) == 2:
                user_id = parts[0]
                frontend_url = parts[1]
            else:
                user_id = parts[0]
        except Exception:
            user_id = None
    else:
        user_id = None

    if error or not code or not user_id:
        return RedirectResponse(f"{frontend_url}{frontend_path}?calendar_connected=error")

    # Determine redirect URI
    redirect_uri = str(request.base_url).rstrip("/") + "/auth/google-calendar/callback"
    if "localhost" not in redirect_uri and "127.0.0.1" not in redirect_uri:
        redirect_uri = redirect_uri.replace("http://", "https://")

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )

    if not token_res.is_success:
        return RedirectResponse(f"{frontend_url}{frontend_path}?calendar_connected=error")

    token_data = token_res.json()
    refresh_token = token_data.get("refresh_token")

    if not refresh_token:
        # If no refresh token is provided (e.g., user didn't re-consent), we redirect to error to try again.
        return RedirectResponse(f"{frontend_url}{frontend_path}?calendar_connected=no_refresh_token")

    # Save to ClientPaymentConfig.provider_keys
    result = await db.execute(select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == user_id))
    config = result.scalar_one_or_none()
    
    if not config:
        config = ClientPaymentConfig(user_id=user_id, provider="custom")
        db.add(config)
    
    keys = dict(config.provider_keys) if config.provider_keys else {}
    keys["google_calendar_refresh_token"] = encrypt_value(refresh_token)
    config.provider_keys = keys
    
    await db.commit()

    # If the user was in the setup guide, send them to step 5 with success
    if "setup-guide" in frontend_path:
        return RedirectResponse(f"{frontend_url}{frontend_path}?step=5&calendar_connected=success")

    return RedirectResponse(f"{frontend_url}{frontend_path}?calendar_connected=success")
