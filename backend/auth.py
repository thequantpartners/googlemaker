"""
auth.py — Google OAuth token verification, JWT creation, and FastAPI
auth dependencies.
"""

import os
from datetime import datetime, timedelta, timezone

import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User

load_dotenv()

JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-jwt-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 720  # 30 days to match NextAuth session

GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

_bearer_scheme = HTTPBearer()


# ── Google Token Verification ────────────────────────────────────────────────


async def verify_google_token(token: str) -> dict:
    """
    Verify a Google OAuth token by calling Google's tokeninfo endpoint.
    Returns a dict with at least: email, name (or ""), picture (or "").
    """
    # Try the OAuth2 v3 tokeninfo endpoint (works for both access & ID tokens)
    async with httpx.AsyncClient(timeout=10.0) as client:
        # First try as ID token
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": token},
        )
        if resp.status_code == 200:
            data = resp.json()
            return {
                "email": data.get("email", ""),
                "name": data.get("name", data.get("email", "")),
                "picture": data.get("picture", ""),
            }

        # Fallback: try as access token via userinfo
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code == 200:
            data = resp.json()
            return {
                "email": data.get("email", ""),
                "name": data.get("name", data.get("email", "")),
                "picture": data.get("picture", ""),
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Google token",
    )


# ── JWT Creation ─────────────────────────────────────────────────────────────


def create_jwt(user_id: str, email: str, role: str) -> str:
    """Create a signed JWT containing user_id, email, and role."""
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ── Dependencies ─────────────────────────────────────────────────────────────


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT, then return the corresponding User object."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account suspended")

    return user


async def require_superadmin(
    user: User = Depends(get_current_user),
) -> User:
    """Dependency that ensures the user has the superadmin role."""
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return user


async def require_client(
    user: User = Depends(get_current_user),
) -> User:
    """Dependency that ensures the user has the client role."""
    if user.role != "client":
        raise HTTPException(status_code=403, detail="Client access required")
    return user
