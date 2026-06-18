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


class CredentialsStatus(BaseModel):
    is_configured: bool
    is_verified: bool
    last_verified_at: datetime | None = None


# ── Orchestrator Logs ────────────────────────────────────────────────────────


class LogOut(BaseModel):
    id: str
    action: str
    campaign_id: str | None = None
    campaign_name: str | None = None
    reason: str | None = None
    details: dict[str, Any] | None = None
    is_dry_run: bool
    executed_at: datetime

    model_config = {"from_attributes": True}


# ── Orchestrator Run ─────────────────────────────────────────────────────────


class OrchestratorResult(BaseModel):
    status: str
    message: str
    logs: list[LogOut] = []
