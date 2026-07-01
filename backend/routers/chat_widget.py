"""
routers/chat_widget.py — Chat Widget endpoints.

PRIVATE  (JWT required, prefix /clients/me):
  GET  /clients/me/chat-widget              → get or create config
  PUT  /clients/me/chat-widget              → update config
  GET  /clients/me/chat-widget/leads        → list captured leads
  GET  /clients/me/payment-config           → get payment configuration
  PUT  /clients/me/payment-config           → update payment configuration

PUBLIC   (open CORS, mounted under /widget via a separate FastAPI sub-app):
  POST /widget/chat/{client_id}/start       → create session, return first messages
  POST /widget/chat/{client_id}/message     → process user message, return bot reply
  GET  /widget/chat/{client_id}/payment-info → safe payment info (no secret keys)
  POST /widget/chat/{client_id}/create-checkout → create Stripe checkout session
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Body, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import require_client
from database import get_db
from encryption import decrypt_value, encrypt_value
from models import (
    ChatSession,
    ChatSessionState,
    ChatWidgetConfig,
    ClientPaymentConfig,
    Lead,
    User,
)
from schemas import (
    ChatBotMessage,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatStartRequest,
    ChatStartResponse,
    ChatWidgetConfigOut,
    ChatWidgetConfigUpdate,
    ClientPaymentConfigOut,
    ClientPaymentConfigUpdate,
    CreateCheckoutRequest,
    LeadOut,
    PaymentInfo,
)
from services.chat_engine import process_chat_message


# ─────────────────────────────────────────────────────────────────────────────
# Private router  (registered on the main FastAPI app under /clients)
# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/clients", tags=["Chat Widget"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _get_or_create_config(
    user: User, db: AsyncSession
) -> ChatWidgetConfig:
    result = await db.execute(
        select(ChatWidgetConfig).where(ChatWidgetConfig.client_id == user.id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        config = ChatWidgetConfig(client_id=user.id)
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


async def _get_or_create_payment_config(
    user: User, db: AsyncSession
) -> ClientPaymentConfig:
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == user.id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        config = ClientPaymentConfig(
            user_id=user.id,
            provider="custom",
            generic_webhook_secret=secrets.token_urlsafe(32),
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


@router.get("/me/chat-widget", response_model=ChatWidgetConfigOut)
async def get_chat_widget_config(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    return await _get_or_create_config(user, db)


@router.put("/me/chat-widget", response_model=ChatWidgetConfigOut)
async def update_chat_widget_config(
    body: ChatWidgetConfigUpdate,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    config = await _get_or_create_config(user, db)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "rules_config" and value is not None:
            value = [
                rq.model_dump() if hasattr(rq, "model_dump") else rq
                for rq in value
            ]
        
        if field == "ai_api_key" and value:
            # Encrypt the API key before saving
            value = encrypt_value(value)
            
        setattr(config, field, value)
    config.updated_at = _now()
    await db.commit()
    await db.refresh(config)
    return config


@router.get("/me/chat-widget/leads", response_model=list[LeadOut])
async def get_my_leads(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lead)
        .where(Lead.client_id == user.id)
        .order_by(Lead.created_at.desc())
        .limit(500)
    )
    return result.scalars().all()


@router.get("/me/payment-config", response_model=ClientPaymentConfigOut)
async def get_payment_config(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    config = await _get_or_create_payment_config(user, db)
    keys = config.provider_keys or {}
    return ClientPaymentConfigOut(
        id=config.id,
        user_id=config.user_id,
        provider=config.provider,
        custom_payment_link=config.custom_payment_link,
        generic_webhook_secret=config.generic_webhook_secret,
        consultation_fee=config.consultation_fee,
        ycloud_api_key=keys.get("ycloud_api_key"),
        ycloud_webhook_secret=keys.get("ycloud_webhook_secret"),
        has_stripe_key=bool(keys.get("stripe_secret_key")),
        has_paypal_key=bool(keys.get("paypal_client_id")),
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


@router.put("/me/payment-config", response_model=ClientPaymentConfigOut)
async def update_payment_config(
    body: ClientPaymentConfigUpdate,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    config = await _get_or_create_payment_config(user, db)
    data = body.model_dump(exclude_unset=True)

    if "provider" in data:
        config.provider = data["provider"]
    if "custom_payment_link" in data:
        config.custom_payment_link = data["custom_payment_link"]
    if "consultation_fee" in data:
        config.consultation_fee = data["consultation_fee"]

    # Merge provider keys without overwriting unrelated providers
    keys = dict(config.provider_keys or {})
    if data.get("stripe_secret_key") is not None:
        keys["stripe_secret_key"] = data["stripe_secret_key"]
    if data.get("stripe_webhook_secret") is not None:
        keys["stripe_webhook_secret"] = data["stripe_webhook_secret"]
    if data.get("paypal_client_id") is not None:
        keys["paypal_client_id"] = data["paypal_client_id"]
    if data.get("paypal_client_secret") is not None:
        keys["paypal_client_secret"] = data["paypal_client_secret"]
    if data.get("ycloud_api_key") is not None:
        keys["ycloud_api_key"] = data["ycloud_api_key"]
    if data.get("ycloud_webhook_secret") is not None:
        keys["ycloud_webhook_secret"] = data["ycloud_webhook_secret"]
    config.provider_keys = keys

    config.updated_at = _now()
    await db.commit()
    await db.refresh(config)

    return ClientPaymentConfigOut(
        id=config.id,
        user_id=config.user_id,
        provider=config.provider,
        custom_payment_link=config.custom_payment_link,
        generic_webhook_secret=config.generic_webhook_secret,
        consultation_fee=config.consultation_fee,
        ycloud_api_key=keys.get("ycloud_api_key"),
        ycloud_webhook_secret=keys.get("ycloud_webhook_secret"),
        has_stripe_key=bool(keys.get("stripe_secret_key")),
        has_paypal_key=bool(keys.get("paypal_client_id")),
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Public router  (mounted on its own sub-app with allow_origins=["*"])
# ─────────────────────────────────────────────────────────────────────────────

public_router = APIRouter(prefix="/chat", tags=["Chat Widget — Public"])


async def _require_active_config(
    client_id: str, db: AsyncSession
) -> ChatWidgetConfig:
    result = await db.execute(
        select(ChatWidgetConfig).where(ChatWidgetConfig.client_id == client_id)
    )
    config = result.scalar_one_or_none()
    if config is None or not config.is_enabled:
        raise HTTPException(
            status_code=404, detail="Widget not found or not enabled for this client."
        )
    return config


async def _require_client_user(client_id: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=403, detail="Client account not active.")
    return user


def _validate_origin(request: Request, config: ChatWidgetConfig):
    """Verifies that the request Origin matches the allowed domains."""
    if not config.allowed_domains:
        return
        
    allowed = [d.strip().lower() for d in config.allowed_domains.split(",") if d.strip()]
    if not allowed:
        return

    origin = request.headers.get("origin") or request.headers.get("referer")
    if not origin:
        raise HTTPException(status_code=403, detail="Origin header missing.")
        
    # Extract hostname from origin (e.g. https://example.com -> example.com)
    from urllib.parse import urlparse
    parsed = urlparse(origin)
    hostname = parsed.hostname or origin.lower()
    
    # Check exact match or subdomains
    is_allowed = False
    for domain in allowed:
        if hostname == domain or hostname.endswith(f".{domain}"):
            is_allowed = True
            break
            
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Domain not allowed by client configuration.")


@public_router.post("/{client_id}/start", response_model=ChatStartResponse)
async def start_chat_session(
    client_id: str,
    request: Request,
    body: Optional[ChatStartRequest] = Body(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Initialise a new chat session for a visitor.
    Accepts optional UTM / gclid tracking data in the request body.
    """
    config = await _require_active_config(client_id, db)
    _validate_origin(request, config)
    rules: list[dict] = config.rules_config or []

    initial_state = (
        ChatSessionState.ai_mode
        if not rules
        else ChatSessionState.rules_mode
    )

    # Store UTM tracking data from the visitor's page URL
    tracking_data: dict | None = None
    if body:
        tracking_data = {
            k: v for k, v in body.model_dump().items() if v is not None
        } or None

    session = ChatSession(
        client_id=client_id,
        state=initial_state,
        current_score=0,
        current_rule_index=0,
        history=[],
        tracking_data=tracking_data,
    )
    db.add(session)

    messages: list[ChatBotMessage] = []
    now_iso = datetime.now(timezone.utc).isoformat()
    history: list[dict] = []

    history.append({"role": "bot", "content": config.welcome_message, "timestamp": now_iso})
    messages.append(ChatBotMessage(content=config.welcome_message, type="text"))

    if rules:
        first_rule = rules[0]
        first_question = first_rule.get("question", "")
        rtype = first_rule.get("response_type", "options")
        
        if rtype == "options":
            options = [opt["text"] for opt in first_rule.get("options", [])]
            msg_type = "buttons"
        else:
            options = []
            msg_type = "text"
            
        history.append({
            "role": "bot",
            "content": first_question,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        messages.append(ChatBotMessage(content=first_question, type=msg_type, options=options))

    session.history = history
    await db.commit()
    await db.refresh(session)

    return ChatStartResponse(
        session_id=session.session_id,
        messages=messages,
        state=session.state.value,
        theme_color=config.theme_color,
        widget_name=config.widget_name,
    )


@public_router.post("/{client_id}/message", response_model=ChatMessageResponse)
async def send_chat_message(
    client_id: str,
    request: Request,
    body: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """Process a visitor's message. Returns bot reply, state, and payment info on lead capture."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == body.session_id,
            ChatSession.client_id == client_id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    config = await _require_active_config(client_id, db)
    _validate_origin(request, config)
    client_user = await _require_client_user(client_id, db)

    result_obj = await process_chat_message(
        session=session,
        config=config,
        user_message=body.message,
        db=db,
        client_user=client_user,
    )

    # Build payment info when a lead was just captured
    payment_info: PaymentInfo | None = None
    if result_obj.lead_captured and result_obj.lead_id:
        pay_result = await db.execute(
            select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
        )
        pay_cfg = pay_result.scalar_one_or_none()

        if pay_cfg and pay_cfg.consultation_fee and pay_cfg.consultation_fee > 0:
            payment_url = None
            if pay_cfg.provider == "custom" and pay_cfg.custom_payment_link:
                payment_url = (
                    f"{pay_cfg.custom_payment_link}"
                    f"?lead_id={result_obj.lead_id}&type=consultation"
                )
            payment_info = PaymentInfo(
                required=True,
                amount=pay_cfg.consultation_fee,
                provider=pay_cfg.provider,
                payment_url=payment_url,
            )

    return ChatMessageResponse(
        messages=[
            ChatBotMessage(
                content=msg["content"],
                type=msg["type"],
                options=msg.get("options"),
            )
            for msg in result_obj.messages
        ],
        state=result_obj.new_state.value,
        lead_captured=result_obj.lead_captured,
        lead_id=result_obj.lead_id,
        payment_info=payment_info,
    )


@public_router.get("/{client_id}/payment-info")
async def get_public_payment_info(
    client_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Return safe payment metadata for the widget (no secret keys exposed)."""
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
    )
    config = result.scalar_one_or_none()

    if not config or not config.consultation_fee:
        return {"has_payment": False, "amount": 0, "provider": None}

    return {
        "has_payment": bool(config.consultation_fee > 0),
        "amount": config.consultation_fee,
        "provider": config.provider,
    }


@public_router.post("/{client_id}/create-checkout")
async def create_stripe_checkout(
    client_id: str,
    body: CreateCheckoutRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session and return the redirect URL."""
    try:
        import stripe
    except ImportError:
        raise HTTPException(status_code=500, detail="Stripe SDK not installed.")

    # Load payment config
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    if not pay_cfg or pay_cfg.provider != "stripe":
        raise HTTPException(status_code=400, detail="Stripe not configured for this client.")

    keys = pay_cfg.provider_keys or {}
    stripe_secret = keys.get("stripe_secret_key")
    if not stripe_secret:
        raise HTTPException(status_code=400, detail="Stripe secret key not set.")

    # Load lead to verify and get amount
    lead_result = await db.execute(
        select(Lead).where(Lead.id == body.lead_id, Lead.client_id == client_id)
    )
    lead = lead_result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    amount = pay_cfg.consultation_fee if body.payment_type == "consultation" else None
    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="Consultation fee not configured.")

    stripe.api_key = stripe_secret
    checkout_session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": "Consultation"},
                "unit_amount": int(amount * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        metadata={
            "lead_id": body.lead_id,
            "payment_type": body.payment_type,
            "client_id": client_id,
        },
        success_url=f"{body.return_url}?payment_success=1&lead_id={body.lead_id}",
        cancel_url=f"{body.return_url}?payment_cancelled=1",
    )

    return {"checkout_url": checkout_session.url}


# ─────────────────────────────────────────────────────────────────────────────
# Public sub-app factory (called from main.py)
# ─────────────────────────────────────────────────────────────────────────────

def create_widget_app() -> FastAPI:
    app = FastAPI(
        title="GMaker Chat Widget — Public API",
        docs_url=None,
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    app.include_router(public_router)
    return app
