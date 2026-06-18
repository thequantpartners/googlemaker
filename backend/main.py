"""
main.py — FastAPI application entry point.

Run with:
    uvicorn main:app --reload
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv()

from auth import create_jwt, get_current_user, verify_google_token
from database import Base, engine, get_db
from models import User, UserRole, UserStatus
from routers import admin, clients, orchestrator, auth_google
from schemas import GoogleLoginRequest, TokenResponse, UserOut

SUPERADMIN_EMAIL: str = os.getenv("SUPERADMIN_EMAIL", "thequantpartners@gmail.com")
FRONTEND_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,https://googlemaker-pdf.vercel.app").split(",")
    if o.strip()
]


# ── Lifespan (startup / shutdown) ────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables & seed superadmin
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed superadmin if not exists
    from database import async_session
    from sqlalchemy import text

    async with async_session() as session:
        # DB MIGRATION: Fix 'free' enum that breaks SQLAlchemy ORM mapping
        try:
            await session.execute(text("UPDATE users SET tier='none' WHERE tier='free' OR tier='pro' OR tier='enterprise';"))
            await session.commit()
            print("[OK] DB Migration: Fixed legacy tier enums.")
        except Exception as e:
            print(f"[WARN] DB Migration failed (might be ok): {e}")

        result = await session.execute(
            select(User).where(User.email == SUPERADMIN_EMAIL)
        )
        if result.scalar_one_or_none() is None:
            admin_user = User(
                email=SUPERADMIN_EMAIL,
                name="SuperAdmin",
                role=UserRole.superadmin,
                status=UserStatus.active,
            )
            session.add(admin_user)
            await session.commit()
            print(f"[OK] Seeded superadmin user: {SUPERADMIN_EMAIL}")
        else:
            print(f"[INFO] Superadmin already exists: {SUPERADMIN_EMAIL}")

    yield

    # Shutdown: dispose of engine
    await engine.dispose()


# ── App ──────────────────────────────────────────────────────────────────────


app = FastAPI(
    title="Google Ads Orchestrator API",
    description="SaaS backend for automated Google Ads campaign management",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin.router)
app.include_router(clients.router)
app.include_router(orchestrator.router)
app.include_router(auth_google.router)


# ── Health check ─────────────────────────────────────────────────────────────


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "google-ads-orchestrator"}


# ── Auth endpoints ───────────────────────────────────────────────────────────


@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(
    body: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive a Google OAuth token, verify it with Google, then check if the
    email exists in the users table.  If it does, return a signed JWT.
    """
    google_info = await verify_google_token(body.token)
    email: str = google_info["email"]

    if not email:
        raise HTTPException(status_code=400, detail="Google token did not contain an email")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        # Auto-create new users as active clients (Open Registration)
        user = User(
            email=email,
            name=google_info.get("name", ""),
            avatar_url=google_info.get("picture", ""),
            role=UserRole.client,
            status=UserStatus.active,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    if user.status != UserStatus.active:
        raise HTTPException(status_code=403, detail="Account is suspended")

    # Update avatar if missing
    if not user.avatar_url and google_info.get("picture"):
        user.avatar_url = google_info["picture"]
    # Update name if still default
    if user.name in ("", "SuperAdmin") and google_info.get("name"):
        if user.role != UserRole.superadmin or user.name == "":
            user.name = google_info["name"]

    await db.flush()

    token = create_jwt(user_id=user.id, email=user.email, role=user.role.value)
    return TokenResponse(access_token=token, role=user.role.value)


@app.get("/auth/me", response_model=UserOut, tags=["Auth"])
async def get_me(
    user: User = Depends(get_current_user),
):
    """Return the currently authenticated user's profile."""
    return user
