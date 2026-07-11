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
    Float,
    ForeignKey,
    Integer,
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
    # Deprecated: Kept for backwards compatibility if needed during migration
    if tier == UserTier.starter: return 1000
    if tier == UserTier.growth: return 5000
    if tier == UserTier.pro: return 25000
    if tier == UserTier.elite: return 1000000 # Virtually unlimited or $1M
    return 0  # none

def get_message_limit(tier: UserTier) -> int:
    if tier == UserTier.starter: return 500
    if tier == UserTier.growth: return 2000
    if tier == UserTier.pro: return 10000
    if tier == UserTier.elite: return 1000000
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
    industry_niche: Mapped[str | None] = mapped_column(String(50), nullable=True)
    monthly_message_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    telegram_link_token: Mapped[str | None] = mapped_column(String(100), nullable=True)
    whatsapp_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    credentials: Mapped[list["GoogleAdsCredential"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    logs: Mapped[list["OrchestratorLog"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    saved_strategies: Mapped[list["SavedStrategy"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    chat_widget_config: Mapped["ChatWidgetConfig | None"] = relationship(
        back_populates="client",
        foreign_keys="ChatWidgetConfig.client_id",
        cascade="all, delete-orphan",
        uselist=False,
    )
    chat_sessions: Mapped[list["ChatSession"]] = relationship(
        back_populates="client",
        foreign_keys="ChatSession.client_id",
        cascade="all, delete-orphan",
    )
    leads: Mapped[list["Lead"]] = relationship(
        back_populates="client",
        foreign_keys="Lead.client_id",
        cascade="all, delete-orphan",
    )
    payment_config: Mapped["ClientPaymentConfig | None"] = relationship(
        back_populates="user",
        foreign_keys="ClientPaymentConfig.user_id",
        cascade="all, delete-orphan",
        uselist=False,
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


class SavedStrategy(Base):
    __tablename__ = "saved_strategies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    campaign_name: Mapped[str] = mapped_column(String(255), nullable=False)
    keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    headlines: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    descriptions: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="saved_strategies")

    def __repr__(self) -> str:
        return f"<SavedStrategy campaign={self.campaign_name}>"


# ── Chat Widget Enums ─────────────────────────────────────────────────────────


class ChatSessionState(str, enum.Enum):
    rules_mode = "RULES_MODE"
    ai_mode = "AI_MODE"
    closed = "CLOSED"


# ── Chat Widget Models ────────────────────────────────────────────────────────


class ChatWidgetConfig(Base):
    """
    One row per client. Stores all configuration for their embedded chat widget.

    rules_config shape (JSONB array):
    [
      {
        "id": "q1",
        "question": "¿Cuál es tu presupuesto mensual?",
        "options": [
          {"text": "Menos de $500", "points": 1},
          {"text": "$500 - $2,000", "points": 5},
          {"text": "Más de $2,000", "points": 10}
        ]
      }
    ]
    """

    __tablename__ = "chat_widget_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    # Appearance
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    widget_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Chat con nosotros")
    welcome_message: Mapped[str] = mapped_column(
        Text, nullable=False, default="¡Hola! ¿En qué podemos ayudarte hoy?"
    )
    theme_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#4F46E5")
    rejection_message: Mapped[str] = mapped_column(
        Text, nullable=False, default="¡Muchas gracias por tus respuestas! Un asesor revisará tu caso y se pondrá en contacto contigo a la brevedad."
    )
    downsell_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    allowed_domains: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_provider: Mapped[str] = mapped_column(String(50), nullable=False, default="openai")
    ai_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Rules engine — ordered list of questions with point-bearing options
    rules_config: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)

    # AI engine
    intent_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    security_protocol: Mapped[str | None] = mapped_column(Text, nullable=True)
    temperature: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=1024)

    @property
    def has_api_key(self) -> bool:
        return bool(self.ai_api_key)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    client: Mapped["User"] = relationship(back_populates="chat_widget_config")

    def __repr__(self) -> str:
        return f"<ChatWidgetConfig client_id={self.client_id} enabled={self.is_enabled}>"


class ChatSession(Base):
    """
    One row per visitor conversation. Tracks the state machine and accumulated score.

    history shape (JSONB array):
    [
      {"role": "bot",  "content": "¡Hola! ...", "timestamp": "2025-01-01T00:00:00Z"},
      {"role": "user", "content": "Quiero saber más", "timestamp": "2025-01-01T00:00:01Z"}
    ]
    """

    __tablename__ = "chat_sessions"

    session_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    state: Mapped[ChatSessionState] = mapped_column(
        Enum(ChatSessionState, native_enum=False, length=20),
        nullable=False,
        default=ChatSessionState.rules_mode,
    )
    current_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Index of the next rule question to ask (used in RULES_MODE)
    current_rule_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    history: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    # UTM / gclid tracking captured from the visitor's URL on widget open
    tracking_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    client: Mapped["User"] = relationship(back_populates="chat_sessions")
    lead: Mapped["Lead | None"] = relationship(back_populates="session", uselist=False)

    def __repr__(self) -> str:
        return f"<ChatSession session_id={self.session_id} state={self.state} score={self.current_score}>"


class Lead(Base):
    """Contact captured by the chat widget once the visitor provides their data."""

    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("chat_sessions.session_id", ondelete="SET NULL"), nullable=True, index=True
    )

    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False, default="chat_widget")
    chat_transcript: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # UTM / Google Ads attribution
    gclid: Mapped[str | None] = mapped_column(String(200), nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Payment tracking
    consultation_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    consultation_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    full_case_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    full_case_amount: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    client: Mapped["User"] = relationship(back_populates="leads")
    session: Mapped["ChatSession | None"] = relationship(back_populates="lead")

    def __repr__(self) -> str:
        return f"<Lead name={self.name} email={self.email} client_id={self.client_id}>"


# ── Payment Configuration ─────────────────────────────────────────────────────


class ClientPaymentConfig(Base):
    """
    One row per client. Stores payment provider configuration for their widget.

    provider_keys shape (JSON):
    - Stripe:  {"stripe_secret_key": "sk_live_...", "stripe_webhook_secret": "whsec_..."}
    - PayPal:  {"paypal_client_id": "...", "paypal_client_secret": "..."}
    """

    __tablename__ = "client_payment_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    # Payment provider: "stripe" | "paypal" | "custom"
    provider: Mapped[str] = mapped_column(String(20), nullable=False, default="custom")

    # Encrypted keys per provider (stripe_secret_key, paypal_client_secret, etc.)
    provider_keys: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # For custom/external payment pages (LawPay, Square, etc.)
    custom_payment_link: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Auto-generated secret for third-party webhook validation
    generic_webhook_secret: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Default fee charged at consultation (used to pre-fill the Lead amount)
    consultation_fee: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="payment_config")

    def __repr__(self) -> str:
        return f"<ClientPaymentConfig user_id={self.user_id} provider={self.provider}>"
