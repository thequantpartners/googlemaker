"""
services/chat_engine.py — Hybrid state-machine engine for the Chat Widget.

State flow:
  RULES_MODE → score options → if score >= threshold → AI_MODE → capture lead → CLOSED
                             → if rules exhausted    → CLOSED (no threshold reached)

Public interface:
  process_chat_message(session, config, user_message, db, client_user) → EngineResult
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession

from models import ChatSession, ChatSessionState, ChatWidgetConfig, Lead, User
from services.telegram_service import send_telegram_message

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Marker embedded by Gemini when it has collected lead data.
# Format: [[LEAD:{"name":"...","email":"...","phone":"..."}]]
_LEAD_RE = re.compile(r"\[\[LEAD:(.*?)\]\]", re.DOTALL)


# ── Value object ──────────────────────────────────────────────────────────────


@dataclass
class EngineResult:
    """Returned by process_chat_message to the router layer."""

    # Ordered list of messages to display in the widget.
    # Each item: {"content": str, "type": "text"|"buttons", "options": list[str]|None}
    messages: list[dict] = field(default_factory=list)
    new_state: ChatSessionState = ChatSessionState.rules_mode
    lead_captured: bool = False


# ── Internal helpers ──────────────────────────────────────────────────────────


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _push(history: list, role: str, content: str) -> list:
    """Return a *new* list with the entry appended (never mutates in place)."""
    return history + [{"role": role, "content": content, "timestamp": _now_iso()}]


def _to_gemini_history(history: list) -> list[dict]:
    """
    Convert session history → Gemini SDK format.
    Roles:  bot → model,  user → user.
    Empty-content entries are silently skipped.
    """
    result: list[dict] = []
    for msg in history:
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        role = "model" if msg.get("role") == "bot" else "user"
        result.append({"role": role, "parts": [content]})
    return result


def _build_system_instruction(config: ChatWidgetConfig) -> str:
    """
    Assemble the full system instruction for Gemini by concatenating:
      1. The operator-defined system_prompt
      2. The security_protocol
      3. The immutable lead-capture protocol
    """
    parts: list[str] = []

    if config.system_prompt:
        parts.append(config.system_prompt.strip())

    if config.security_protocol:
        parts.append(
            "--- PROTOCOLO DE SEGURIDAD (no negociable) ---\n"
            + config.security_protocol.strip()
        )

    # Injected last so it always overrides anything the operator might write.
    parts.append(
        "--- PROTOCOLO DE CAPTURA DE LEAD ---\n"
        "Tu misión final es recopilar de forma natural los datos de contacto del visitante:\n"
        "  • Nombre completo\n"
        "  • Al menos uno de: email o teléfono\n\n"
        "Cuando el usuario haya proporcionado esos datos, añade al FINAL de tu respuesta "
        "(en una línea nueva, sin NADA después) el siguiente marcador exacto:\n"
        '[[LEAD:{"name":"NOMBRE","email":"EMAIL_O_null","phone":"TELEFONO_O_null"}]]\n\n'
        "Ejemplo de respuesta completa cuando ya tienes los datos:\n"
        "¡Perfecto, Juan! En breve nos pondremos en contacto contigo.\n"
        '[[LEAD:{"name":"Juan Pérez","email":"juan@ejemplo.com","phone":null}]]\n\n'
        "REGLAS ESTRICTAS:\n"
        "- Nunca inventes datos. Si un campo falta, usa null (sin comillas).\n"
        "- El marcador solo aparece cuando tengas nombre + al menos un contacto.\n"
        "- Tu texto conversacional va ANTES del marcador, nunca después.\n"
        "- Nunca menciones al usuario que usas un marcador interno."
    )

    return "\n\n".join(parts)


# ── Gemini call ───────────────────────────────────────────────────────────────


async def _call_gemini(
    session: ChatSession,
    config: ChatWidgetConfig,
    db: AsyncSession,
    client_user: User,
) -> dict:
    """
    Send session.history to Gemini 2.0 Flash and handle the response.

    Precondition: session.history already includes the latest user message as the
    last entry (role="user"). This is set by the caller before invoking this function.

    Returns:
        {
            "reply":           str,                  # clean text for the widget
            "updated_history": list,                 # history with AI reply appended
            "new_state":       ChatSessionState,
            "lead_captured":   bool,
        }
    """
    history: list = list(session.history or [])

    # ── Graceful degradation when no API key ─────────────────────────────────
    if not GEMINI_API_KEY:
        fallback = (
            "El asistente de IA no está disponible en este momento. "
            "Por favor, contáctenos directamente."
        )
        return {
            "reply": fallback,
            "updated_history": _push(history, "bot", fallback),
            "new_state": session.state,
            "lead_captured": False,
        }

    # ── Build Gemini history, separating the last user turn ──────────────────
    gemini_history = _to_gemini_history(history)

    if gemini_history and gemini_history[-1]["role"] == "user":
        current_message = gemini_history[-1]["parts"][0]
        prior_history = gemini_history[:-1]
    else:
        # Edge case: history ended with a bot message or is empty.
        current_message = "Hola"
        prior_history = gemini_history

    # ── Gemini model call ─────────────────────────────────────────────────────
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=_build_system_instruction(config),
        generation_config=genai.types.GenerationConfig(
            temperature=config.temperature,
            max_output_tokens=config.max_tokens,
        ),
    )

    try:
        chat = model.start_chat(history=prior_history)
        response = await chat.send_message_async(current_message)
        raw_text = response.text.strip()
    except Exception as exc:
        err = str(exc)
        if "429" in err:
            raw_text = (
                "El asistente está experimentando alta demanda en este momento. "
                "Intenta de nuevo en unos segundos."
            )
        else:
            print(f"[chat_engine] Gemini error: {exc}")
            raw_text = (
                "Lo siento, estoy teniendo dificultades técnicas. "
                "Por favor, contáctanos directamente."
            )

    # ── Lead extraction ───────────────────────────────────────────────────────
    lead_match = _LEAD_RE.search(raw_text)
    lead_captured = False
    new_state = session.state

    if lead_match:
        # Strip the marker from the visible reply
        clean_reply = _LEAD_RE.sub("", raw_text).strip()

        try:
            lead_data: dict = json.loads(lead_match.group(1))

            new_lead = Lead(
                client_id=session.client_id,
                session_id=session.session_id,
                name=lead_data.get("name") or None,
                email=lead_data.get("email") or None,
                phone=lead_data.get("phone") or None,
                source="chat_widget",
                # Persist full transcript including this final bot message
                chat_transcript=_push(history, "bot", clean_reply),
            )
            db.add(new_lead)
            new_state = ChatSessionState.closed
            lead_captured = True

            # ── Telegram alert to the GMaker client ──────────────────────────
            if client_user.telegram_chat_id:
                name_str = lead_data.get("name") or "N/A"
                email_str = lead_data.get("email") or "N/A"
                phone_str = lead_data.get("phone") or "N/A"
                await send_telegram_message(
                    chat_id=client_user.telegram_chat_id,
                    text=(
                        "🎯 <b>¡Nuevo Lead Capturado!</b>\n\n"
                        f"👤 <b>Nombre:</b> {name_str}\n"
                        f"📧 <b>Email:</b> {email_str}\n"
                        f"📱 <b>Teléfono:</b> {phone_str}\n\n"
                        "📌 <b>Fuente:</b> Chat Widget"
                    ),
                )
            else:
                # TODO: add email/webhook notification as alternative to Telegram
                print(
                    f"[chat_engine] Lead captured for client {session.client_id} "
                    f"(no Telegram configured): {lead_data}"
                )

        except (json.JSONDecodeError, Exception) as exc:
            print(f"[chat_engine] Lead parse error — treating as plain reply: {exc}")
            clean_reply = raw_text  # keep the raw text if parse fails
    else:
        clean_reply = raw_text

    updated_history = _push(history, "bot", clean_reply)
    return {
        "reply": clean_reply,
        "updated_history": updated_history,
        "new_state": new_state,
        "lead_captured": lead_captured,
    }


# ── RULES_MODE handler ────────────────────────────────────────────────────────


async def _handle_rules_mode(
    session: ChatSession,
    config: ChatWidgetConfig,
    user_message: str,
    db: AsyncSession,
    client_user: User,
) -> EngineResult:
    rules: list[dict] = config.rules_config or []
    history: list = list(session.history or [])

    # 1. Record the user's answer
    history = _push(history, "user", user_message)

    # 2. Score the selected option (exact text match)
    idx = session.current_rule_index
    if idx < len(rules):
        for opt in rules[idx].get("options", []):
            if opt.get("text", "").strip() == user_message.strip():
                session.current_score += int(opt.get("points", 0))
                break
        session.current_rule_index = idx + 1

    next_idx = session.current_rule_index

    # 3a. Threshold reached → hand off to AI immediately ─────────────────────
    if session.current_score >= config.intent_threshold:
        session.history = history
        session.state = ChatSessionState.ai_mode
        ai = await _call_gemini(session, config, db, client_user)
        session.history = ai["updated_history"]
        session.state = ai["new_state"]
        await db.commit()
        return EngineResult(
            messages=[{"content": ai["reply"], "type": "text", "options": None}],
            new_state=session.state,
            lead_captured=ai["lead_captured"],
        )

    # 3b. More questions remain ───────────────────────────────────────────────
    if next_idx < len(rules):
        next_rule = rules[next_idx]
        bot_reply = next_rule["question"]
        options = [opt["text"] for opt in next_rule.get("options", [])]
        history = _push(history, "bot", bot_reply)
        session.history = history
        await db.commit()
        return EngineResult(
            messages=[{"content": bot_reply, "type": "buttons", "options": options}],
            new_state=ChatSessionState.rules_mode,
        )

    # 3c. Rules exhausted, threshold not reached → polite close ──────────────
    bot_reply = (
        "¡Muchas gracias por tus respuestas! Un asesor revisará tu caso "
        "y se pondrá en contacto contigo a la brevedad."
    )
    history = _push(history, "bot", bot_reply)
    session.history = history
    session.state = ChatSessionState.closed
    await db.commit()
    return EngineResult(
        messages=[{"content": bot_reply, "type": "text", "options": None}],
        new_state=ChatSessionState.closed,
    )


# ── AI_MODE handler ───────────────────────────────────────────────────────────


async def _handle_ai_mode(
    session: ChatSession,
    config: ChatWidgetConfig,
    user_message: str,
    db: AsyncSession,
    client_user: User,
) -> EngineResult:
    # Append user message before calling Gemini
    history = list(session.history or [])
    session.history = _push(history, "user", user_message)

    ai = await _call_gemini(session, config, db, client_user)
    session.history = ai["updated_history"]
    session.state = ai["new_state"]
    await db.commit()

    return EngineResult(
        messages=[{"content": ai["reply"], "type": "text", "options": None}],
        new_state=session.state,
        lead_captured=ai["lead_captured"],
    )


# ── Public interface ──────────────────────────────────────────────────────────


async def process_chat_message(
    session: ChatSession,
    config: ChatWidgetConfig,
    user_message: str,
    db: AsyncSession,
    client_user: User,
) -> EngineResult:
    """
    Main entry point for the chat router.

    Routes to the correct state handler and always persists changes to the DB
    before returning.
    """
    if session.state == ChatSessionState.rules_mode:
        return await _handle_rules_mode(session, config, user_message, db, client_user)

    if session.state == ChatSessionState.ai_mode:
        return await _handle_ai_mode(session, config, user_message, db, client_user)

    # Already CLOSED
    return EngineResult(
        messages=[{
            "content": "Esta conversación ya ha finalizado. ¡Gracias por tu interés!",
            "type": "text",
            "options": None,
        }],
        new_state=ChatSessionState.closed,
    )
