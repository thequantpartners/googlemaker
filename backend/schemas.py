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
