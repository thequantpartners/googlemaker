"""
services/chat_engine.py — Hybrid state-machine engine for the Chat Widget.

State flow:
  RULES_MODE → score options → if score >= threshold → AI_MODE → capture lead → CLOSED
                             → if rules exhausted    → CLOSED (no threshold reached)

Public interface:
  process_chat_message(session, config, user_message, db, client_user) → EngineResult
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession

from models import ChatSession, ChatSessionState, ChatWidgetConfig, Lead, User, ClientPaymentConfig
from services.telegram_service import send_telegram_message
from services.baileys_service import send_master_notification
from encryption import decrypt_value
from services.ai_tools import (
    execute_tool_call, get_openai_tools, get_anthropic_tools, get_gemini_tools
)

# Marker embedded by AI when it has collected lead data.
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
    lead_id: str | None = None


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


def _build_system_instruction(config: ChatWidgetConfig, enable_tools: bool = False, pay_cfg = None, session_id: str = None) -> str:
    """
    Assemble the full system instruction for Gemini by concatenating:
      1. The operator-defined system_prompt
      2. The security_protocol
      3. The goals protocol (cobrar/agendar)
      4. The immutable lead-capture protocol
    """
    parts: list[str] = []

    from datetime import datetime, timezone
    current_date = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')
    parts.append(f"[INFORMACIÓN DEL SISTEMA]\nHoy es: {current_date} UTC\n")

    if config.system_prompt:
        parts.append(config.system_prompt.strip())

    if config.security_protocol:
        parts.append(
            "--- PROTOCOLO DE SEGURIDAD (no negociable) ---\n"
            + config.security_protocol.strip()
        )

    goals = config.ai_goals or []
    has_cobrar = "cobrar" in goals
    has_agendar = "agendar" in goals

    if has_agendar and enable_tools:
        from datetime import datetime, timezone
        parts.append(
            "--- PROTOCOLO DE CALENDARIO (AGENDAMIENTO) ---\n"
            "Tienes acceso a herramientas de calendario. Si el lead muestra intención de agendar una reunión o llamada, "
            "SIEMPRE usa la herramienta 'get_availability' para ofrecerle horarios reales disponibles. "
            "NUNCA inventes horarios. Una vez que el lead elija un horario de los disponibles, usa 'book_meeting' para confirmar la cita."
        )

    if has_cobrar and pay_cfg:
        payment_url = ""
        if pay_cfg.provider == "custom" and pay_cfg.custom_payment_link:
            payment_url = pay_cfg.custom_payment_link
        elif pay_cfg.provider == "stripe" or pay_cfg.provider == "culqi" or pay_cfg.provider == "mercadopago":
            import os
            api_url = os.getenv("NEXT_PUBLIC_API_URL", "https://qss.thequantpartners.com/api")
            payment_url = f"{api_url}/widget/chat/{config.client_id}/pay/{session_id}"
            
        if payment_url:
            parts.append(
                "--- PROTOCOLO DE COBRO ---\n"
                "Tu objetivo principal es cobrar por la consulta o servicio. Cuando corresponda, debes enviar el siguiente "
                f"enlace exacto al usuario para que procese su pago en línea: {payment_url}"
            )
            
    if has_cobrar and has_agendar:
        parts.append(
            "--- REGLA DE ORO (Cobro antes de Agendar) ---\n"
            "Si no cobras, NO agendas. Es obligatorio que el usuario realice el pago ANTES de que utilices "
            "la herramienta de calendario para confirmar una cita. Coordina la hora deseada, pide el pago usando "
            "el enlace, y NO llames a la herramienta 'book_meeting' hasta recibir confirmación por parte del SISTEMA de "
            "que el pago fue exitoso."
        )

    # Injected last so it always overrides anything the operator might write.
    parts.append(
        "--- PROTOCOLO DE CONVERSACIÓN ---\n"
        "Mantén un tono empático y humano. Usa emojis con moderación para que la conversación no sea rígida (ej: 👋, 😊, 🎯), pero sin exagerar.\n\n"
        "--- PROTOCOLO DE CAPTURA DE LEAD ---\n"
        "Tu misión final es recopilar de forma natural los datos de contacto del visitante:\n"
        "  • Nombre completo\n"
        "  • Al menos uno de: email o teléfono\n\n"
        "Cuando el usuario haya proporcionado esos datos, añade al FINAL de tu respuesta "
        "(en una línea nueva, sin NADA después) el siguiente marcador exacto:\n"
        '[[LEAD:{"name":"NOMBRE","email":"EMAIL_O_null","phone":"TELEFONO_O_null"}]]\n\n'
        "Ejemplo de respuesta completa cuando ya tienes los datos:\n"
        "¡Perfecto, Juan! En breve nos pondremos en contacto contigo. 😊\n"
        '[[LEAD:{"name":"Juan Pérez","email":"juan@ejemplo.com","phone":null}]]\n\n'
        "REGLAS ESTRICTAS:\n"
        "- Nunca inventes datos. Si un campo falta, usa null (sin comillas).\n"
        "- El marcador solo aparece cuando tengas nombre + al menos un contacto.\n"
        "- Tu texto conversacional va ANTES del marcador, nunca después.\n"
        "- Nunca menciones al usuario que usas un marcador interno."
    )

    return "\n\n".join(parts)


# ── AI Provider Call ─────────────────────────────────────────────────────────


async def _call_ai_provider(
    session: ChatSession,
    config: ChatWidgetConfig,
    db: AsyncSession,
    client_user: User,
) -> dict:
    """
    Send session.history to the selected AI provider (OpenAI, Anthropic, Gemini).
    """
    history: list = list(session.history or [])

    # ── Business Hours Check ───────────────────────────────────────────────────
    # Only applies to WhatsApp/YCloud channels (which use the payment config keys).
    # We fetch ClientPaymentConfig to read the wa_business_hours properties.
    from sqlalchemy import select
    from zoneinfo import ZoneInfo
    pay_cfg_res = await db.execute(select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_user.id))
    pay_cfg = pay_cfg_res.scalars().first()
    
    if pay_cfg and pay_cfg.provider_keys:
        keys = pay_cfg.provider_keys
        if keys.get("wa_business_hours_enabled"):
            tz_str = keys.get("wa_timezone") or "UTC"
            try:
                tz = ZoneInfo(tz_str)
            except Exception:
                tz = ZoneInfo("UTC")
            
            now = datetime.now(tz)
            # e.g., "monday", "tuesday", etc.
            day_name = now.strftime("%A").lower()
            
            b_hours = keys.get("wa_business_hours") or {}
            day_config = b_hours.get(day_name) or {"enabled": False, "start": "09:00", "end": "18:00"}
            
            is_open = False
            if day_config.get("enabled"):
                start_str = day_config.get("start", "00:00")
                end_str = day_config.get("end", "23:59")
                try:
                    start_time = datetime.strptime(start_str, "%H:%M").time()
                    end_time = datetime.strptime(end_str, "%H:%M").time()
                    if start_time <= now.time() <= end_time:
                        is_open = True
                except ValueError:
                    pass
            
            if not is_open:
                tracking = session.tracking_data or {}
                # If we haven't sent the OOH message today, send it
                today_str = now.strftime("%Y-%m-%d")
                if tracking.get("ooh_sent_date") != today_str:
                    tracking["ooh_sent_date"] = today_str
                    session.tracking_data = tracking
                    
                    fallback = keys.get("wa_bhours_message") or "Estamos fuera de horario. Te contactaremos mañana."
                    return {
                        "reply": fallback,
                        "updated_history": _push(history, "bot", fallback),
                        "new_state": session.state,
                        "lead_captured": False,
                    }
                else:
                    # Silent mode: we already sent it, just return an empty reply (the webhook should ignore empty replies)
                    # For safety, we return a special empty string that the caller handles, or just silent text.
                    # Wait, if we return empty text, Baileys ignores it.
                    return {
                        "reply": "",
                        "updated_history": history,
                        "new_state": session.state,
                        "lead_captured": False,
                    }

    # Enforce BYOK (Bring Your Own Key)
    if not config.ai_api_key:
        fallback = "Por favor, configura tu propia API Key en el panel de control para activar el asistente de Inteligencia Artificial."
        return {
            "reply": fallback,
            "updated_history": _push(history, "bot", fallback),
            "new_state": session.state,
            "lead_captured": False,
        }

    try:
        api_key = decrypt_value(config.ai_api_key)
    except Exception as e:
        fallback = "Error de seguridad: La API Key configurada es inválida o no pudo ser desencriptada."
        return {
            "reply": fallback,
            "updated_history": _push(history, "bot", fallback),
            "new_state": session.state,
            "lead_captured": False,
        }

    cal_api_key = None
    cal_booking_link = None
    gcal_refresh_token = None
    if pay_cfg and pay_cfg.provider_keys:
        cal_api_key = pay_cfg.provider_keys.get("cal_api_key")
        cal_booking_link = pay_cfg.provider_keys.get("cal_booking_link")
        enc_token = pay_cfg.provider_keys.get("google_calendar_refresh_token")
        if enc_token:
            try:
                gcal_refresh_token = decrypt_value(enc_token)
            except Exception:
                pass
        
    enable_tools = bool((cal_api_key and cal_booking_link) or gcal_refresh_token)
    
    system_prompt = _build_system_instruction(
        config, 
        enable_tools=enable_tools, 
        pay_cfg=pay_cfg, 
        session_id=session.session_id
    )
    provider = config.ai_provider or "openai"
    raw_text = ""

    try:
        if provider == "openai":
            import openai
            client = openai.AsyncOpenAI(api_key=api_key)
            oai_history = [{"role": "system", "content": system_prompt}]
            for msg in history:
                content = (msg.get("content") or "").strip()
                if not content:
                    continue
                role = "assistant" if msg.get("role") == "bot" else "user"
                oai_history.append({"role": role, "content": content})
                
            tools = get_openai_tools() if enable_tools else None
            kwargs = {"tools": tools} if tools else {}
            
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=oai_history,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                **kwargs
            )
            msg = response.choices[0].message
            if getattr(msg, "tool_calls", None):
                # Append assistant message with tool_calls to history
                oai_history.append(msg)
                for tool_call in msg.tool_calls:
                    func_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)
                    result = await execute_tool_call(func_name, args, cal_api_key, cal_booking_link, gcal_refresh_token)
                    oai_history.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": func_name,
                        "content": result
                    })
                # Second call
                response2 = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=oai_history,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
                raw_text = response2.choices[0].message.content.strip()
            else:
                raw_text = msg.content.strip()

        elif provider == "anthropic":
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=api_key)
            ant_history = []
            for msg in history:
                content = (msg.get("content") or "").strip()
                if not content:
                    continue
                role = "assistant" if msg.get("role") == "bot" else "user"
                ant_history.append({"role": role, "content": content})
                
            tools = get_anthropic_tools() if enable_tools else []
            kwargs = {"tools": tools} if tools else {}
            
            response = await client.messages.create(
                model="claude-3-5-haiku-20241022",
                system=system_prompt,
                messages=ant_history,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                **kwargs
            )
            
            if response.stop_reason == "tool_use":
                ant_history.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = await execute_tool_call(block.name, block.input, cal_api_key, cal_booking_link, gcal_refresh_token)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result
                        })
                ant_history.append({"role": "user", "content": tool_results})
                response2 = await client.messages.create(
                    model="claude-3-5-haiku-20241022",
                    system=system_prompt,
                    messages=ant_history,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
                raw_text = response2.content[0].text.strip()
            else:
                raw_text = response.content[0].text.strip()

        elif provider == "gemini":
            genai.configure(api_key=api_key)
            gemini_history = _to_gemini_history(history)
            
            if gemini_history and gemini_history[-1]["role"] == "user":
                current_message = gemini_history[-1]["parts"][0]
                prior_history = gemini_history[:-1]
            else:
                current_message = "Hola"
                prior_history = gemini_history
                
            tools = get_gemini_tools() if enable_tools else None
            kwargs = {"tools": tools} if tools else {}
                
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=system_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=config.temperature,
                    max_output_tokens=config.max_tokens,
                ),
                **kwargs
            )
            chat = model.start_chat(history=prior_history)
            resp = await chat.send_message_async(current_message)
            
            # Check if there is a function call
            # In google-generativeai, resp.parts can contain function_call
            fc = None
            if resp.parts:
                for part in resp.parts:
                    if getattr(part, "function_call", None):
                        fc = part.function_call
                        break
            
            if fc:
                args = type(fc.args).to_dict(fc.args) if hasattr(fc.args, "to_dict") else dict(fc.args)
                result = await execute_tool_call(fc.name, args, cal_api_key, cal_booking_link, gcal_refresh_token)
                
                resp2 = await chat.send_message_async(
                    genai.types.Part.from_function_response(
                        name=fc.name,
                        response={"result": result}
                    )
                )
                raw_text = resp2.text.strip()
            else:
                raw_text = resp.text.strip()

        else:
            raw_text = "Proveedor de Inteligencia Artificial no soportado."

    except Exception as exc:
        err = str(exc)
        if "429" in err or "Too Many Requests" in err or "insufficient_quota" in err:
            raw_text = "El asistente está experimentando alta demanda o la cuota de la API se ha agotado. Intenta de nuevo más tarde."
        else:
            print(f"[chat_engine] {provider} error: {exc}")
            raw_text = "Lo siento, el asistente de IA no pudo procesar tu mensaje debido a un problema con la API configurada."

    # ── Lead extraction ───────────────────────────────────────────────────────
    lead_match = _LEAD_RE.search(raw_text)
    lead_captured = False
    new_state = session.state

    lead_id: str | None = None

    if lead_match:
        # Strip the marker from the visible reply
        clean_reply = _LEAD_RE.sub("", raw_text).strip()

        try:
            lead_data: dict = json.loads(lead_match.group(1))

            # Pull UTM attribution from the session (set during /start)
            tracking: dict = session.tracking_data or {}

            # If phone is not provided but the session_id looks like a WhatsApp number (all digits), auto-fill it
            extracted_phone = lead_data.get("phone")
            if not extracted_phone and session.session_id and session.session_id.isdigit():
                extracted_phone = "+" + session.session_id

            new_lead = Lead(
                client_id=session.client_id,
                session_id=session.session_id,
                name=lead_data.get("name") or None,
                email=lead_data.get("email") or None,
                phone=extracted_phone or None,
                source="chat_widget",
                chat_transcript=_push(history, "bot", clean_reply),
                gclid=tracking.get("gclid"),
                utm_source=tracking.get("utm_source"),
                utm_medium=tracking.get("utm_medium"),
                utm_campaign=tracking.get("utm_campaign"),
            )
            db.add(new_lead)
            await db.flush()  # populate UUID so we can return the id
            lead_id = new_lead.id
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
                print(f"[chat_engine] Client {client_user.id} has no telegram_chat_id for notifications.")
            
            # ── WhatsApp Master Bot alert ────────────────────────────────────
            if hasattr(client_user, "whatsapp_phone") and client_user.whatsapp_phone:
                name_str = lead_data.get("name") or "N/A"
                email_str = lead_data.get("email") or "N/A"
                phone_str = lead_data.get("phone") or "N/A"
                wa_message = (
                    "🔥 *¡Nuevo Lead Capturado!*\n\n"
                    f"👤 *Nombre:* {name_str}\n"
                    f"📧 *Email:* {email_str}\n"
                    f"📱 *Teléfono:* {phone_str}\n\n"
                    "📌 *Fuente:* Chat Widget"
                )
                asyncio.create_task(send_master_notification(client_user.whatsapp_phone, wa_message))

            # ── Handoff link logic ──────────────────────────────────────────
            if pay_cfg and pay_cfg.provider_keys:
                handoff_number = pay_cfg.provider_keys.get("wa_client_handoff_number")
                if handoff_number:
                    clean_reply += f"\n\nTe transfiero con un agente humano, presiona aquí: https://wa.me/{handoff_number}"

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
        "lead_id": lead_id,
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

    is_first_message = len(history) == 0

    # 1. Record the user's answer
    history = _push(history, "user", user_message)

    # 2. Score the user's answer
    idx = session.current_rule_index
    if not is_first_message:
        if idx < len(rules):
            current_rule = rules[idx]
            rtype = current_rule.get("response_type", "options")
            
            if rtype == "options":
                options_list = current_rule.get("options", [])
                for i, opt in enumerate(options_list, 1):
                    opt_text = opt.get("text", "").strip()
                    if user_message.strip().lower() == opt_text.lower() or user_message.strip() == str(i):
                        session.current_score += int(opt.get("points", 0))
                        # Update history with canonical text so LLM context is clear
                        history[-1]["content"] = opt_text
                        break
            else:
                # text, textarea, number, etc.
                if user_message.strip():
                    session.current_score += int(current_rule.get("points_if_answered", 0))
                    
            session.current_rule_index = idx + 1

    next_idx = session.current_rule_index

    # 3a. Threshold reached → hand off to AI immediately ─────────────────────
    if session.current_score >= config.intent_threshold:
        session.history = history
        session.state = ChatSessionState.ai_mode
        ai = await _call_ai_provider(session, config, db, client_user)
        session.history = ai["updated_history"]
        session.state = ai["new_state"]
        await db.commit()
        return EngineResult(
            messages=[{"content": ai["reply"], "type": "text", "options": None}],
            new_state=session.state,
            lead_captured=ai["lead_captured"],
            lead_id=ai.get("lead_id"),
        )

    # 3b. More questions remain ───────────────────────────────────────────────
    if next_idx < len(rules):
        next_rule = rules[next_idx]
        bot_reply = next_rule["question"]
        
        if is_first_message and config.welcome_message:
            bot_reply = config.welcome_message + "\n\n" + bot_reply
            
        rtype = next_rule.get("response_type", "options")
        
        if rtype == "options":
            options = [opt["text"] for opt in next_rule.get("options", [])]
            msg_type = "buttons"
        else:
            options = []
            msg_type = "text"
            
        history = _push(history, "bot", bot_reply)
        session.history = history
        await db.commit()
        return EngineResult(
            messages=[{"content": bot_reply, "type": msg_type, "options": options}],
            new_state=ChatSessionState.rules_mode,
        )

    # 3c. Rules exhausted, threshold not reached → polite close ──────────────
    bot_reply = config.rejection_message or "¡Muchas gracias por tus respuestas! Un asesor revisará tu caso y se pondrá en contacto contigo a la brevedad."
    
    msgs = [{"content": bot_reply, "type": "text", "options": None}]
    
    if getattr(config, "downsell_url", None):
        # Append link to text (useful for WhatsApp native preview)
        bot_reply_with_link = f"{bot_reply}\n\n👉 {config.downsell_url}"
        history = _push(history, "bot", bot_reply_with_link)
        # Add a special button-like message for the widget
        msgs = [
            {"content": bot_reply, "type": "text", "options": None},
            {"content": config.downsell_url, "type": "link", "options": ["Ver Oferta Especial"]}
        ]
    else:
        history = _push(history, "bot", bot_reply)
        
    session.history = history
    session.state = ChatSessionState.closed
    await db.commit()
    return EngineResult(
        messages=msgs,
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

    ai = await _call_ai_provider(session, config, db, client_user)
    session.history = ai["updated_history"]
    session.state = ai["new_state"]
    await db.commit()

    return EngineResult(
        messages=[{"content": ai["reply"], "type": "text", "options": None}],
        new_state=session.state,
        lead_captured=ai["lead_captured"],
        lead_id=ai.get("lead_id"),
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
    if user_message.startswith("[SISTEMA]"):
        session.state = ChatSessionState.ai_mode
        return await _handle_ai_mode(session, config, user_message, db, client_user)

    return EngineResult(
        messages=[{
            "content": "Esta conversación ya ha finalizado. ¡Gracias por tu interés!",
            "type": "text",
            "options": None,
        }],
        new_state=ChatSessionState.closed,
    )

async def process_async_payment_injection(
    db: AsyncSession,
    session_id: str,
    client_id: str,
    payment_type: str,
    amount: float = None
):
    """
    Inyecta un mensaje del sistema en el historial de chat para avisarle a la IA
    que el pago fue exitoso, forzándola a reaccionar (ej. confirmando la cita).
    Luego envía el mensaje de vuelta al usuario vía Baileys o YCloud.
    """
    from models import ChatSession, ChatWidgetConfig, User
    import httpx
    import os

    # 1. Cargar la sesión y configuración
    session_result = await db.execute(
        select(ChatSession).where(
            ChatSession.session_id == session_id,
            ChatSession.client_id == client_id
        )
    )
    chat_session = session_result.scalar_one_or_none()
    if not chat_session or chat_session.state == ChatSessionState.closed:
        return

    config_result = await db.execute(
        select(ChatWidgetConfig).where(ChatWidgetConfig.client_id == client_id)
    )
    chat_config = config_result.scalar_one_or_none()
    
    user_result = await db.execute(select(User).where(User.id == client_id))
    client_user = user_result.scalar_one_or_none()

    if not chat_config or not chat_config.is_enabled or not client_user:
        return

    # 2. Construir e inyectar el mensaje del sistema
    monto_str = f" (USD {amount})" if amount else ""
    sys_msg = f"[SISTEMA: El pago del lead{monto_str} ha sido procesado con ÉXITO. Procede INMEDIATAMENTE a usar tu herramienta de calendario para confirmar/agendar la cita (si habían coordinado un horario) y envíale un mensaje de felicitaciones/confirmación al usuario indicándole que su pago fue recibido exitosamente.]"
    
    # 3. Llamar al AI Provider
    # Reutilizamos la lógica de AI mode pasándole el mensaje del sistema
    engine_result = await process_chat_message(
        session=chat_session,
        config=chat_config,
        user_message=sys_msg,
        db=db,
        client_user=client_user
    )

    reply_lines = []
    for msg in engine_result.messages:
        reply_lines.append(msg["content"])
        if msg.get("options"):
            reply_lines.append("")
            for i, opt in enumerate(msg["options"], 1):
                reply_lines.append(f"{i}. {opt}")
    
    llm_reply_text = "\n".join(reply_lines)
    if not llm_reply_text.strip():
        return

    # 4. Enviar el mensaje por WhatsApp
    # Si el session_id parece un teléfono de WhatsApp (solo números o empieza con +, pero internamente guardamos sin el @s.whatsapp.net)
    # ycloud webhooks también envían a wa_id
    if any(c.isdigit() for c in session_id):
        # Intentamos enviar vía Baileys Master Setter
        baileys_url = os.getenv("BAILEYS_API_URL", "https://qss-baileys-server-production.up.railway.app")
        try:
            async with httpx.AsyncClient() as http_client:
                await http_client.post(
                    f"{baileys_url}/api/send",
                    json={"to": session_id, "text": llm_reply_text},
                    timeout=10.0
                )
        except Exception as e:
            print(f"[Async Injection] Error sending message via Baileys: {e}")

