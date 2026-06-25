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

from fastapi.staticfiles import StaticFiles

from auth import create_jwt, get_current_user, verify_google_token
from database import Base, engine, get_db
from models import User, UserRole, UserStatus, ChatWidgetConfig, ChatSession, Lead  # noqa: F401 – registers new tables with Base.metadata
from routers import admin, clients, orchestrator, auth_google, payments, telegram
from routers.chat_widget import router as chat_widget_router, create_widget_app
from schemas import GoogleLoginRequest, TokenResponse, UserOut

SUPERADMIN_EMAIL: str = os.getenv("SUPERADMIN_EMAIL", "thequantpartners@gmail.com")
FRONTEND_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGINS", "https://gmaker.thequantpartners.com,http://localhost:3000,https://googlemaker-pdf.vercel.app,https://googlemaker-psi.vercel.app").split(",")
    if o.strip()
]

# Unconditionally add the main domain just in case FRONTEND_ORIGINS is overridden in Railway
if "https://gmaker.thequantpartners.com" not in FRONTEND_ORIGINS:
    FRONTEND_ORIGINS.append("https://gmaker.thequantpartners.com")


# ── Lifespan (startup / shutdown) ────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables & seed superadmin
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Run DB migrations using isolated connections (not the shared session)
    # This prevents PostgreSQL session corruption after rollbacks
    from sqlalchemy import text

    async def safe_add_column(table: str, column: str, col_type: str, default: str | None = None):
        """Add a column only if it doesn't already exist. Uses its own connection."""
        async with engine.begin() as conn:
            # Check if column exists using information_schema (works on both SQLite and PostgreSQL)
            result = await conn.execute(text(
                f"SELECT 1 FROM pragma_table_info('{table}') WHERE name='{column}'"
                if str(engine.url).startswith("sqlite")
                else f"SELECT 1 FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'"
            ))
            if result.first() is None:
                default_clause = f" DEFAULT {default}" if default else ""
                await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}{default_clause};"))

    try:
        await safe_add_column("users", "tier", "VARCHAR(50)", "'none'")
        await safe_add_column("users", "telegram_chat_id", "VARCHAR(100)")
        await safe_add_column("users", "telegram_link_token", "VARCHAR(100)")
        await safe_add_column("orchestrator_logs", "status", "VARCHAR(20)", "'auto_applied'")
        await safe_add_column("orchestrator_logs", "is_dry_run", "BOOLEAN", "true")
    except Exception as e:
        print(f"[WARN] Migration error (non-fatal): {e}")

    # Fix legacy tier enums
    try:
        async with engine.begin() as conn:
            await conn.execute(text("UPDATE users SET tier='none' WHERE tier='free' OR tier='enterprise';"))
            await conn.execute(text("UPDATE users SET tier='starter' WHERE tier='basic';"))
            await conn.execute(text("UPDATE users SET tier='growth' WHERE tier='scale';"))
            await conn.execute(text("UPDATE users SET tier='pro' WHERE tier='growth' AND email != 'superadmin@example.com';"))
    except Exception:
        pass

    print("[OK] DB Migrations completed.")

    # Seed superadmin if not exists
    from database import async_session
    async with async_session() as session:
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
    allow_origin_regex=r"https://googlemaker-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin.router)
app.include_router(clients.router)
app.include_router(orchestrator.router)
app.include_router(auth_google.router)
app.include_router(payments.router)
app.include_router(telegram.router)
app.include_router(chat_widget_router)   # private: GET/PUT /clients/me/chat-widget

# Public widget sub-app (open CORS — any origin may embed the widget)
# Accessible at /widget/chat/{client_id}/start and /widget/chat/{client_id}/message
app.mount("/widget", create_widget_app())

# Static files — serves gmaker-widget.js and any future assets
import pathlib as _pl
_static_dir = _pl.Path(__file__).parent / "static"
_static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


# ── Health check ─────────────────────────────────────────────────────────────


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "google-ads-orchestrator"}


@app.get("/test-logs", tags=["Test"])
async def test_logs(db: AsyncSession = Depends(get_db)):
    try:
        from models import OrchestratorLog
        result = await db.execute(select(OrchestratorLog).limit(1))
        logs = result.scalars().all()
        return {"status": "success", "count": len(logs), "logs": [{"id": l.id, "details": type(l.details).__name__} for l in logs]}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}


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
