"""
schemas.py — Pydantic v2 request / response schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ── Auth ─────────────────────────────────────────────────────────────────────


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class GoogleLoginRequest(BaseModel):
    token: str = Field(..., description="Google OAuth ID token or access token")


# ── Users ────────────────────────────────────────────────────────────────────


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None = None
    role: str
    status: str
    tier: str
    telegram_chat_id: str | None = None
    telegram_link_token: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Clients (admin-managed) ─────────────────────────────────────────────────


class ClientCreate(BaseModel):
    email: str = Field(..., description="Client email address")
    name: str = Field(..., min_length=1, max_length=255)


class ClientOut(UserOut):
    """Same as UserOut but explicit for client context."""
    pass


# ── Google Ads Credentials ───────────────────────────────────────────────────


class CredentialsCreate(BaseModel):
    developer_token: str
    oauth_client_id: str
    oauth_client_secret: str
    refresh_token: str
    login_customer_id: str
    target_customer_id: str


class ConnectedAccount(BaseModel):
    id: str
    target_customer_id: str
    is_verified: bool

class CredentialsStatus(BaseModel):
    is_configured: bool
    connected_accounts: list[ConnectedAccount] = []
    plan_limit: int | None = None
    ad_spend_limit: float = 0.0
    user_status: str | None = None


# ── Orchestrator Logs ────────────────────────────────────────────────────────


class LogOut(BaseModel):
    id: str
    action: str
    campaign_id: Any | None = None
    campaign_name: str | None = None
    reason: str | None = None
    details: Any | None = None
    is_dry_run: Any = None
    status: str
    executed_at: Any = None

    model_config = {"from_attributes": True}


# ── Orchestrator Run ─────────────────────────────────────────────────────────


class OrchestratorResult(BaseModel):
    status: str
    message: str
    logs: list[LogOut] = []


# ── Campaign Creation ────────────────────────────────────────────────────────


class CreateCampaignRequest(BaseModel):
    campaign_name: str = Field(..., min_length=1, max_length=255, description="Nombre de la campaña")
    daily_budget: float = Field(..., gt=0, description="Presupuesto diario en USD")
    keywords: list[str] = Field(..., min_length=1, description="Lista de keywords (mín 1)")
    headlines: list[str] = Field(..., min_length=3, max_length=15, description="Títulos del anuncio (3-15, max 30 chars c/u)")
    descriptions: list[str] = Field(..., min_length=2, max_length=4, description="Descripciones (2-4, max 90 chars c/u)")
    final_url: str = Field(..., min_length=1, description="URL de destino del anuncio")
    target_cpa: float | None = Field(None, gt=0, description="CPA objetivo en USD (Requiere plan Growth)")

class CampaignActionRequest(BaseModel):
    action: str  # "PAUSAR" (and later "ACTIVAR", "AUMENTAR_PRESUPUESTO")

class GenerateCampaignCopyRequest(BaseModel):
    url: str
    competitors: str | None = None
    campaign_type: str = "Search"
    
class GenerateCampaignCopyResponse(BaseModel):
    campaign_name: str
    keywords: list[str]
    headlines: list[str]
    descriptions: list[str]

class FindCompetitorsRequest(BaseModel):
    url: str

class FindCompetitorsResponse(BaseModel):
    competitors: list[str]

class SavedStrategyCreate(BaseModel):
    campaign_name: str
    keywords: list[str]
    headlines: list[str]
    descriptions: list[str]

class SavedStrategyOut(BaseModel):
    id: str
    campaign_name: str
    keywords: list[str]
    headlines: list[str]
    descriptions: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Chat Widget ───────────────────────────────────────────────────────────────


class RuleOption(BaseModel):
    text: str = Field(..., min_length=1, max_length=200)
    points: int = Field(..., ge=0, le=1000)


class RuleQuestion(BaseModel):
    id: str = Field(..., min_length=1, max_length=50)
    question: str = Field(..., min_length=1, max_length=500)
    response_type: str = Field(default="options", max_length=50)
    points_if_answered: int = Field(default=0, ge=0, le=1000)
    options: list[RuleOption] = Field(default_factory=list, max_length=10)


class ChatWidgetConfigUpdate(BaseModel):
    is_enabled: bool | None = None
    widget_name: str | None = Field(None, max_length=255)
    welcome_message: str | None = Field(None, max_length=1000)
    rejection_message: str | None = Field(None, max_length=1000)
    allowed_domains: str | None = Field(None, max_length=1000)
    theme_color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    rules_config: list[RuleQuestion] | None = Field(None, max_length=20)
    intent_threshold: int | None = Field(None, ge=0, le=10_000)
    ai_provider: str | None = Field(None, max_length=50)
    ai_api_key: str | None = Field(None)
    system_prompt: str | None = None
    security_protocol: str | None = None
    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=64, le=8192)


class ChatWidgetConfigOut(BaseModel):
    id: str
    client_id: str
    is_enabled: bool
    widget_name: str
    welcome_message: str
    rejection_message: str
    allowed_domains: str | None
    theme_color: str
    rules_config: list | None = []
    intent_threshold: int
    ai_provider: str
    has_api_key: bool = False
    system_prompt: str | None = None
    security_protocol: str | None = None
    temperature: float
    max_tokens: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatBotMessage(BaseModel):
    """A single message bubble returned to the widget frontend."""
    content: str
    type: str  # "text" | "buttons"
    options: list[str] | None = None


class ChatStartResponse(BaseModel):
    session_id: str
    messages: list[ChatBotMessage]
    state: str
    # Widget appearance — sent once on start so the JS knows colors immediately
    theme_color: str = "#4F46E5"
    widget_name: str = "Chat con nosotros"


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1, max_length=2000)


class ChatStartRequest(BaseModel):
    """Optional tracking data sent by the widget on session open."""
    gclid: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None


class PaymentInfo(BaseModel):
    """Payment metadata returned alongside a lead-capture event."""
    required: bool = False
    amount: float | None = None
    provider: str | None = None
    payment_url: str | None = None  # pre-built link for "custom" provider


class ChatMessageResponse(BaseModel):
    messages: list[ChatBotMessage]
    state: str
    lead_captured: bool = False
    lead_id: str | None = None
    payment_info: PaymentInfo | None = None


class LeadOut(BaseModel):
    id: str
    client_id: str
    session_id: str | None = None
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    source: str
    gclid: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    consultation_paid: bool = False
    consultation_amount: float | None = None
    full_case_paid: bool = False
    full_case_amount: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Payment Config ────────────────────────────────────────────────────────────


class ClientPaymentConfigUpdate(BaseModel):
    provider: str | None = Field(None, pattern=r"^(stripe|paypal|custom)$")
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    paypal_client_id: str | None = None
    paypal_client_secret: str | None = None
    custom_payment_link: str | None = None
    consultation_fee: float | None = Field(None, ge=0)
    ycloud_api_key: str | None = None


class ClientPaymentConfigOut(BaseModel):
    id: str
    user_id: str
    provider: str
    custom_payment_link: str | None = None
    generic_webhook_secret: str | None = None
    consultation_fee: float | None = None
    ycloud_api_key: str | None = None
    has_stripe_key: bool = False
    has_paypal_key: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard Metrics ─────────────────────────────────────────────────────────


class LeadSourceStat(BaseModel):
    source: str
    count: int


class DashboardMetrics(BaseModel):
    ad_spend: float = 0.0
    total_leads_tracked: int = 0
    consultation_paid_count: int = 0
    full_case_paid_count: int = 0
    lead_sources: list[LeadSourceStat] = []


# ── Stripe Checkout ───────────────────────────────────────────────────────────


class CreateCheckoutRequest(BaseModel):
    lead_id: str
    payment_type: str = "consultation"
    return_url: str = Field(..., description="Page URL to redirect after payment")
