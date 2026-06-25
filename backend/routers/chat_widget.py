"""
routers/chat_widget.py — Chat Widget endpoints.

PRIVATE  (JWT required, prefix /clients/me):
  GET  /clients/me/chat-widget          → get or create config
  PUT  /clients/me/chat-widget          → update config
  GET  /clients/me/chat-widget/leads    → list captured leads

PUBLIC   (open CORS, mounted under /widget via a separate FastAPI sub-app):
  POST /widget/chat/{client_id}/start   → create session, return first messages
  POST /widget/chat/{client_id}/message → process user message, return bot reply
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import require_client
from database import get_db
from models import (
    ChatSession,
    ChatSessionState,
    ChatWidgetConfig,
    Lead,
    User,
)
from schemas import (
    ChatBotMessage,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatStartResponse,
    ChatWidgetConfigOut,
    ChatWidgetConfigUpdate,
    LeadOut,
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
    """Return the user's ChatWidgetConfig, creating a default one if needed."""
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


@router.get("/me/chat-widget", response_model=ChatWidgetConfigOut)
async def get_chat_widget_config(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Return the widget configuration for the authenticated client.
    A default config is auto-created on first access."""
    return await _get_or_create_config(user, db)


@router.put("/me/chat-widget", response_model=ChatWidgetConfigOut)
async def update_chat_widget_config(
    body: ChatWidgetConfigUpdate,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Update widget appearance, rules, and AI parameters."""
    config = await _get_or_create_config(user, db)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # rules_config arrives as list[RuleQuestion] Pydantic models → convert to plain dicts
        if field == "rules_config" and value is not None:
            value = [
                rq.model_dump() if hasattr(rq, "model_dump") else rq
                for rq in value
            ]
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
    """Return all leads captured by this client's widget (newest first)."""
    result = await db.execute(
        select(Lead)
        .where(Lead.client_id == user.id)
        .order_by(Lead.created_at.desc())
        .limit(500)
    )
    return result.scalars().all()


# ─────────────────────────────────────────────────────────────────────────────
# Public router  (mounted on its own sub-app with allow_origins=["*"])
# ─────────────────────────────────────────────────────────────────────────────

public_router = APIRouter(prefix="/chat", tags=["Chat Widget — Public"])


async def _require_active_config(
    client_id: str, db: AsyncSession
) -> ChatWidgetConfig:
    """Fetch widget config and guard against missing / disabled widgets."""
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
    """Load the owner User row (needed for Telegram notifications in the engine)."""
    result = await db.execute(select(User).where(User.id == client_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Client not found.")
    return user


@public_router.post("/{client_id}/start", response_model=ChatStartResponse)
async def start_chat_session(
    client_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Initialise a new chat session for a visitor.

    Returns the welcome message and the first rule question (with button options)
    so the widget can render them immediately without a second round-trip.
    """
    config = await _require_active_config(client_id, db)
    rules: list[dict] = config.rules_config or []

    # Decide initial state: if there are no rules → go straight to AI_MODE.
    initial_state = (
        ChatSessionState.ai_mode
        if not rules
        else ChatSessionState.rules_mode
    )

    session = ChatSession(
        client_id=client_id,
        state=initial_state,
        current_score=0,
        current_rule_index=0,
        history=[],
    )
    db.add(session)

    # ── Build the opening message sequence ───────────────────────────────────
    messages: list[ChatBotMessage] = []
    now_iso = datetime.now(timezone.utc).isoformat()
    history: list[dict] = []

    # 1. Welcome message (always shown)
    history.append({"role": "bot", "content": config.welcome_message, "timestamp": now_iso})
    messages.append(ChatBotMessage(content=config.welcome_message, type="text"))

    # 2a. First rule question (if rules exist)
    if rules:
        first_rule = rules[0]
        first_question = first_rule.get("question", "")
        options = [opt["text"] for opt in first_rule.get("options", [])]
        history.append({
            "role": "bot",
            "content": first_question,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        messages.append(ChatBotMessage(content=first_question, type="buttons", options=options))

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
    body: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Process a visitor's message and return the bot's reply.

    The engine handles the full state transition logic (RULES → AI → CLOSED).
    """
    # ── Validate session ──────────────────────────────────────────────────────
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == body.session_id,
            ChatSession.client_id == client_id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    # ── Load config and owner user ────────────────────────────────────────────
    config = await _require_active_config(client_id, db)
    client_user = await _require_client_user(client_id, db)

    # ── Run the state machine ─────────────────────────────────────────────────
    result_obj = await process_chat_message(
        session=session,
        config=config,
        user_message=body.message,
        db=db,
        client_user=client_user,
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
    )


# ─────────────────────────────────────────────────────────────────────────────
# Public sub-app factory (called from main.py)
# ─────────────────────────────────────────────────────────────────────────────

def create_widget_app() -> FastAPI:
    """
    Build an isolated FastAPI sub-application for the public widget endpoints.
    This sub-app has fully open CORS so any website can embed the widget.
    It shares the same DB engine (imported from database.py) as the main app.
    """
    app = FastAPI(
        title="GMaker Chat Widget — Public API",
        docs_url=None,   # hide docs from public
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,          # cannot use credentials=True with allow_origins=["*"]
        allow_methods=["POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    app.include_router(public_router)
    return app
