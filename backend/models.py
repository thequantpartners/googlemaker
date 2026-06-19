"""
models.py — SQLAlchemy 2.0 ORM models.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


# ── Enums ────────────────────────────────────────────────────────────────────


class UserRole(str, enum.Enum):
    superadmin = "superadmin"
    client = "client"


class UserStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"


class UserTier(str, enum.Enum):
    none = "none"
    starter = "starter"
    growth = "growth"
    pro = "pro"
    elite = "elite"

# ── Helpers ──────────────────────────────────────────────────────────────────

def get_ad_spend_limit(tier: UserTier) -> int:
    if tier == UserTier.starter: return 2500
    if tier == UserTier.growth: return 10000
    if tier == UserTier.pro: return 25000
    if tier == UserTier.elite: return 1000000 # Virtually unlimited or $1M
    return 0  # none

def get_plan_limit(tier: UserTier) -> int | None:
    # Under the new model, all tiers can connect unlimited accounts, 
    # they are only gated by total ad spend.
    if tier == UserTier.none: return 0
    return None

def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Models ───────────────────────────────────────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=20),
        nullable=False,
        default=UserRole.client,
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, native_enum=False, length=20),
        nullable=False,
        default=UserStatus.active,
    )
    tier: Mapped[UserTier] = mapped_column(
        Enum(UserTier, native_enum=False, length=20),
        nullable=False,
        default=UserTier.none,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    credentials: Mapped[list["GoogleAdsCredential"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    logs: Mapped[list["OrchestratorLog"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role}>"


class GoogleAdsCredential(Base):
    __tablename__ = "google_ads_credentials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # In centralized OAuth, these fields are not needed per user, but to bypass
    # SQLite's NOT NULL constraint without dropping the table, we provide a default empty string.
    developer_token: Mapped[str] = mapped_column(Text, nullable=False, default="")
    oauth_client_id: Mapped[str] = mapped_column(Text, nullable=False, default="")
    oauth_client_secret: Mapped[str] = mapped_column(Text, nullable=False, default="")
    
    # These are specific to the client
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    login_customer_id: Mapped[str] = mapped_column(Text, nullable=False)
    target_customer_id: Mapped[str] = mapped_column(Text, nullable=False)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="credentials")

    def __repr__(self) -> str:
        return f"<GoogleAdsCredential user_id={self.user_id} verified={self.is_verified}>"


class OrchestratorLog(Base):
    __tablename__ = "orchestrator_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    campaign_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    campaign_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_dry_run: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="auto_applied")
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="logs")

    def __repr__(self) -> str:
        return f"<OrchestratorLog action={self.action} campaign={self.campaign_name}>"
