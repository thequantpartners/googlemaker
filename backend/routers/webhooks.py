"""
routers/webhooks.py — Unified payment webhook handlers.

Endpoints:
  POST /webhooks/stripe/{client_id}    — Stripe webhook (validates signature per client)
  POST /webhooks/generic/{client_id}   — Generic webhook (HMAC secret in header)
"""

from __future__ import annotations

import hashlib
import hmac
import json
import uuid
import httpx
from pydantic import BaseModel

from fastapi import APIRouter, Depends, Header, HTTPException, Request, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import ClientPaymentConfig, Lead, ChatSession, ChatWidgetConfig, User
from services.chat_engine import process_chat_message

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


async def _update_lead_payment(
    db: AsyncSession,
    lead_id: str,
    client_id: str,
    payment_type: str,
    amount: float | None = None,
) -> Lead:
    result = await db.execute(
        select(Lead).where(Lead.id == lead_id, Lead.client_id == client_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    import httpx
    import asyncio

    if payment_type == "consultation" and lead.session_id:
        lead.consultation_paid = True
        if amount:
            lead.consultation_amount = amount

        # Fetch session and trigger AI Agent
        session_result = await db.execute(select(ChatSession).where(ChatSession.session_id == lead.session_id))
        chat_session = session_result.scalar_one_or_none()
        
        user_result = await db.execute(select(User).where(User.id == client_id))
        client_user = user_result.scalar_one_or_none()
        
        config_result = await db.execute(select(ChatWidgetConfig).where(ChatWidgetConfig.client_id == client_id))
        chat_config = config_result.scalar_one_or_none()
        
        if chat_session and client_user and chat_config and chat_config.is_enabled:
            # Check if this is a WhatsApp session (typically phone number format for YCloud)
            # Not foolproof, but valid for our YCloud setup
            is_whatsapp = chat_session.session_id.startswith("51") or len(chat_session.session_id) > 10

            async def _background_ai_task():
                # We need a new session context for the background task
                from database import async_session_maker
                async with async_session_maker() as bg_db:
                    bg_session_result = await bg_db.execute(select(ChatSession).where(ChatSession.session_id == lead.session_id))
                    bg_chat_session = bg_session_result.scalar_one_or_none()
                    bg_user_result = await bg_db.execute(select(User).where(User.id == client_id))
                    bg_client_user = bg_user_result.scalar_one_or_none()
                    
                    if bg_chat_session and bg_client_user:
                        engine_result = await process_chat_message(
                            session=bg_chat_session,
                            config=chat_config,
                            user_message="[SISTEMA] El usuario acaba de realizar el pago exitosamente. Felicítalo brevemente e inmediatamente ofrécele opciones de horarios leyendo tu disponibilidad con la API de Cal.com.",
                            db=bg_db,
                            client_user=bg_client_user
                        )
                        await bg_db.commit()
                        
                        if is_whatsapp and engine_result.messages:
                            # Send via YCloud
                            reply_lines = []
                            for msg in engine_result.messages:
                                reply_lines.append(msg["content"])
                                if msg.get("options"):
                                    reply_lines.append("")
                                    for opt in msg["options"]:
                                        reply_lines.append(f"• {opt}")
                            llm_reply_text = "\n".join(reply_lines).strip()
                            
                            if llm_reply_text:
                                pay_cfg_res = await bg_db.execute(select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id))
                                pay_cfg = pay_cfg_res.scalar_one_or_none()
                                if pay_cfg and pay_cfg.provider_keys:
                                    ycloud_api_key = pay_cfg.provider_keys.get("ycloud_api_key")
                                    if ycloud_api_key:
                                        ycloud_url = "https://api.ycloud.com/v2/whatsapp/messages/send"
                                        headers = {"X-API-Key": ycloud_api_key, "Content-Type": "application/json"}
                                        yc_payload = {"to": bg_chat_session.session_id, "type": "text", "text": {"body": llm_reply_text}}
                                        async with httpx.AsyncClient() as client:
                                            await client.post(ycloud_url, headers=headers, json=yc_payload)
            
            asyncio.create_task(_background_ai_task())

    elif payment_type == "full_case":
        lead.full_case_paid = True
        if amount:
            lead.full_case_amount = amount

    await db.commit()
    return lead


# ── Stripe ────────────────────────────────────────────────────────────────────


@router.post("/stripe/{client_id}")
async def stripe_webhook(
    client_id: str,
    request: Request,
    stripe_signature: str | None = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Stripe webhook endpoint (per-client).
    Validates the webhook signature using the client's stored stripe_webhook_secret.
    Marks the corresponding lead as paid on checkout.session.completed events.
    """
    try:
        import stripe
    except ImportError:
        raise HTTPException(status_code=500, detail="Stripe SDK not installed.")

    # Load client payment config
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    if not pay_cfg:
        raise HTTPException(status_code=404, detail="Payment config not found.")

    keys = pay_cfg.provider_keys or {}
    webhook_secret = keys.get("stripe_webhook_secret")
    if not webhook_secret:
        raise HTTPException(status_code=400, detail="Stripe webhook secret not configured.")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature.")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Webhook parse error: {exc}")

    if event["type"] == "checkout.session.completed":
        session_obj = event["data"]["object"]
        metadata = session_obj.get("metadata", {})
        lead_id = metadata.get("lead_id")
        chat_session_id = metadata.get("session_id")
        payment_type = metadata.get("payment_type", "consultation")
        amount_total = session_obj.get("amount_total")
        amount = (amount_total / 100) if amount_total else None

        if lead_id:
            await _update_lead_payment(db, lead_id, client_id, payment_type, amount)

        if chat_session_id:
            from services.chat_engine import process_async_payment_injection
            background_tasks.add_task(
                process_async_payment_injection, 
                db, chat_session_id, client_id, payment_type, amount
            )

    return {"received": True}


# ── Generic / Custom Webhook ─────────────────────────────────────────────────


@router.post("/generic/{client_id}")
async def generic_webhook(
    client_id: str,
    request: Request,
    x_webhook_secret: str | None = Header(None, alias="x-webhook-secret"),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Generic webhook for any payment provider (LawPay, Square, custom, etc.).

    The caller must include the client's generic_webhook_secret in the
    'X-Webhook-Secret' header.

    Expected JSON body:
    {
      "lead_id": "uuid",
      "payment_type": "consultation" | "full_case",
      "amount": 150.00   (optional)
    }
    """
    # Load and validate secret
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    if not pay_cfg or not pay_cfg.generic_webhook_secret:
        raise HTTPException(status_code=404, detail="Webhook not configured for this client.")

    if not x_webhook_secret or not hmac.compare_digest(
        x_webhook_secret, pay_cfg.generic_webhook_secret
    ):
        raise HTTPException(status_code=401, detail="Invalid webhook secret.")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    lead_id = body.get("lead_id")
    chat_session_id = body.get("session_id")
    payment_type = body.get("payment_type", "consultation")
    amount = body.get("amount")

    if not lead_id and not chat_session_id:
        raise HTTPException(status_code=400, detail="lead_id or session_id is required.")

    if lead_id:
        lead = await _update_lead_payment(db, lead_id, client_id, payment_type, amount)
        
    if chat_session_id:
        from services.chat_engine import process_async_payment_injection
        background_tasks.add_task(
            process_async_payment_injection, 
            db, chat_session_id, client_id, payment_type, amount
        )
        
    return {
        "ok": True,
        "payment_type": payment_type,
    }

# ── YCloud ─────────────────────────────────────────────────────────────────

@router.post("/ycloud/webhook")
async def ycloud_master_webhook(
    request: Request,
    client_id: str,
    background_tasks: BackgroundTasks,
    ycloud_signature: str | None = Header(None, alias="YCloud-Signature"),
    db: AsyncSession = Depends(get_db)
):
    """
    YCloud master webhook for Chat and Conversions.
    Verifies HMAC-SHA256 signature, then processes the incoming message.
    """
    raw_body = await request.body()
    payload = await request.json()
    
    # 1. Validación de Seguridad Multi-tenant y Firma
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    
    if not pay_cfg:
        raise HTTPException(status_code=404, detail="Webhook no configurado.")
        
    keys = pay_cfg.provider_keys or {}
    ycloud_webhook_secret = keys.get("ycloud_webhook_secret")
    ycloud_api_key = keys.get("ycloud_api_key")

    if not ycloud_webhook_secret or not ycloud_api_key:
        raise HTTPException(status_code=400, detail="YCloud secrets no configurados.")

    if not ycloud_signature:
        raise HTTPException(status_code=401, detail="Firma de YCloud requerida.")

    # Parsear t=timestamp, v1=signature (YCloud v2 format)
    sig_parts = dict(kv.split("=") for kv in ycloud_signature.split(","))
    req_timestamp = sig_parts.get("t")
    req_sig = sig_parts.get("v1") or sig_parts.get("s")

    if not req_timestamp or not req_sig:
        raise HTTPException(status_code=401, detail="Firma de YCloud mal formada.")

    # Calcular HMAC
    signed_payload = f"{req_timestamp}.{raw_body.decode('utf-8')}"
    expected_sig = hmac.new(
        key=ycloud_webhook_secret.encode("utf-8"),
        msg=signed_payload.encode("utf-8"),
        digestmod="sha256"
    ).hexdigest()

    if not hmac.compare_digest(req_sig, expected_sig):
        raise HTTPException(status_code=401, detail="Secreto de webhook YCloud inválido.")

    # 2. Parseo del Payload de YCloud
    try:
        if "data" in payload and "messages" in payload["data"]:
            message = payload["data"]["messages"][0]
            wa_id = message["from"]
            text_body = message.get("text", {}).get("body", "")
        elif "entry" in payload:
            message = payload["entry"][0]["changes"][0]["value"]["messages"][0]
            wa_id = message["from"]
            text_body = message.get("text", {}).get("body", "")
        elif "whatsappInboundMessage" in payload:
            msg_obj = payload["whatsappInboundMessage"]
            wa_id = msg_obj.get("from", "")
            if wa_id and not wa_id.startswith("+"):
                wa_id = f"+{wa_id}"
                
            biz_number = msg_obj.get("to", "")
            if biz_number and not biz_number.startswith("+"):
                biz_number = f"+{biz_number}"
                
            msg_type = msg_obj.get("type", "text")
            
            if msg_type == "text":
                raw_text = msg_obj.get("text", "")
                if isinstance(raw_text, dict):
                    text_body = raw_text.get("body", "")
                else:
                    text_body = str(raw_text)
            elif msg_type == "interactive":
                interactive_obj = msg_obj.get("interactive", {})
                inter_type = interactive_obj.get("type", "")
                if inter_type == "button_reply":
                    text_body = interactive_obj.get("button_reply", {}).get("title", "")
                elif inter_type == "list_reply":
                    text_body = interactive_obj.get("list_reply", {}).get("title", "")
                else:
                    text_body = ""
            else:
                text_body = ""
                
            if not text_body:
                return {"ok": True, "detail": "Formato de mensaje no soportado o vacío."}
        else:
            return {"ok": True, "detail": "Formato de payload no reconocido."}
    except Exception as e:
        print(f"Webhook parse error: {e}")
        return {"ok": True, "detail": "Error en el parseo del mensaje."}

    # 3. Lógica Combinada (Conversión Upsert + Chat)
    
    # 3a. Buscar GCLID usando regex (Conversión)
    import re
    match = re.search(r'Ref:\s*([^\s]+)', text_body)
    if match:
        cuf_qss_payload = match.group(1)
        payload_parts = cuf_qss_payload.split('--')
        gclid_value = payload_parts[0] if len(payload_parts) > 0 else ""
        utm_source = payload_parts[1] if len(payload_parts) > 1 else ""
        utm_campaign = payload_parts[2] if len(payload_parts) > 2 else ""

        if gclid_value:
            lead_result = await db.execute(
                select(Lead).where(Lead.gclid == gclid_value, Lead.client_id == client_id)
            )
            lead = lead_result.scalar_one_or_none()
            
            if not lead:
                lead = Lead(
                    id=str(uuid.uuid4()),
                    client_id=client_id,
                    gclid=gclid_value,
                    utm_source=utm_source,
                    utm_campaign=utm_campaign,
                    name=f"WA Lead {wa_id}",
                    email="no-email@whatsapp.local"
                )
                db.add(lead)

            lead.full_case_paid = True
            lead.full_case_amount = 150.00
            await db.commit()

    # 3b. Llamada real al LLM (Chat Brain) usando chat_engine.py
    try:
        # Recuperar o crear la sesión de chat atada al número de teléfono
        session_result = await db.execute(
            select(ChatSession).where(
                ChatSession.session_id == wa_id,
                ChatSession.client_id == client_id,
            )
        )
        chat_session = session_result.scalar_one_or_none()
        if not chat_session:
            chat_session = ChatSession(
                id=str(uuid.uuid4()),
                session_id=wa_id,
                client_id=client_id,
                origin="whatsapp"
            )
            db.add(chat_session)
            await db.commit()
            await db.refresh(chat_session)

        # Recuperar la configuración del bot del cliente
        config_result = await db.execute(
            select(ChatWidgetConfig).where(ChatWidgetConfig.client_id == client_id)
        )
        chat_config = config_result.scalar_one_or_none()
        
        # Recuperar el Client User para desencriptar llaves
        user_result = await db.execute(select(User).where(User.id == client_id))
        client_user = user_result.scalar_one_or_none()

        if chat_config and chat_config.is_enabled and getattr(chat_config, 'ai_apply_whatsapp', True) and client_user:
            # Enviar el mensaje al cerebro QSS (Reglas + IA)
            engine_result = await process_chat_message(
                session=chat_session,
                config=chat_config,
                user_message=text_body,
                db=db,
                client_user=client_user
            )
            
            # WhatsApp es texto plano, así que concatenamos todos los mensajes generados
            reply_lines = []
            for msg in engine_result.messages:
                reply_lines.append(msg["content"])
                if msg.get("options"):
                    reply_lines.append("") # Espaciador
                    for opt in msg["options"]:
                        reply_lines.append(f"• {opt}")
            
            llm_reply_text = "\n".join(reply_lines)
        else:
            llm_reply_text = "El asistente virtual no está activado en este momento."
            
    except Exception as e:
        print(f"Error procesando mensaje en chat_engine: {e}")
        llm_reply_text = "Lo siento, estamos experimentando dificultades técnicas."

    # 4. Enviar la respuesta de vuelta a WhatsApp vía API de YCloud
    if llm_reply_text.strip():
        ycloud_url = "https://api.ycloud.com/v2/whatsapp/messages/sendDirectly"
        
        headers = {
            "X-API-Key": ycloud_api_key,
            "Content-Type": "application/json"
        }
        
        yc_payload = {
            "from": locals().get("biz_number", ""),  # Ensure we pass the biz number if extracted
            "to": wa_id,
            "type": "text",
            "text": {
                "body": llm_reply_text
            }
        }
        
        # If biz_number wasn't extracted (Meta meta payload), fallback or remove
        if not yc_payload["from"]:
            # Maybe it's generic, but YCloud v2 REQUIRES 'from'. 
            # If the user only has 1 number, YCloud might accept it without 'from' in /messages endpoint?
            # Actually we must just send it and hope they have extracted it, or remove it so we don't send empty strings.
            del yc_payload["from"]
        
        wa_delay_mode = pay_cfg.provider_keys.get("wa_delay_mode", "human") if pay_cfg and pay_cfg.provider_keys else "human"
        if wa_delay_mode == "instant":
            delay_sec = 0.0
        elif wa_delay_mode == "fast":
            delay_sec = 2.0
        elif wa_delay_mode == "medium":
            delay_sec = 5.0
        else: # human
            delay_sec = 8.0

        async def _delayed_ycloud_send(d_sec: float, url: str, hdrs: dict, p_load: dict):
            if d_sec > 0:
                await asyncio.sleep(d_sec)
            async with httpx.AsyncClient() as client:
                yc_res = await client.post(url, headers=hdrs, json=p_load)
                if yc_res.status_code >= 400:
                    print(f"YCloud API Error: {yc_res.text}")

        import asyncio
        background_tasks.add_task(_delayed_ycloud_send, delay_sec, ycloud_url, headers, yc_payload)

    return {"ok": True, "status": "processed"}


async def execute_whatsapp_action_background(log_id: str, wa_id: str):
    """Background task to execute the Google Ads action."""
    from database import async_session
    from models import OrchestratorLog, GoogleAdsCredential
    from sqlalchemy import select
    import asyncio
    
    async with async_session() as db:
        result = await db.execute(select(OrchestratorLog).where(OrchestratorLog.id == log_id))
        log = result.scalar_one_or_none()
        
        if not log:
            return
            
        try:
            # We need the user's credentials
            cred_result = await db.execute(
                select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == log.user_id)
            )
            creds = cred_result.scalars().all()
            if not creds:
                raise Exception("Credentials not found")
                
            cred = creds[0]
            
            from encryption import decrypt_value
            from services.google_ads_service import get_google_ads_client, apply_campaign_action
            from services.baileys_service import send_master_notification
            
            refresh_token = decrypt_value(cred.refresh_token)
            login_id = decrypt_value(cred.login_customer_id)
            target_id = decrypt_value(cred.target_customer_id)

            client = await asyncio.to_thread(get_google_ads_client, refresh_token, login_id)
            
            # Execute action
            await asyncio.to_thread(
                apply_campaign_action,
                client,
                target_id,
                log.campaign_id,
                log.action
            )
            
            log.status = "approved"
            await db.commit()
            
            await send_master_notification(wa_id, f"✅ *Acción Ejecutada Exitosamente:*\n{log.action} en la campaña '{log.campaign_name}'.")
        except Exception as e:
            print(f"Error executing action from WhatsApp: {e}")
            from services.baileys_service import send_master_notification
            await send_master_notification(wa_id, f"❌ *Error al ejecutar la acción:*\n{str(e)}")


async def handle_autopilot_command(text: str, client_user: User, db: AsyncSession, background_tasks: BackgroundTasks):
    from sqlalchemy import select
    from models import OrchestratorLog
    from services.baileys_service import send_master_notification
    
    text = text.strip()
    if text not in ["1", "2"]:
        await send_master_notification(client_user.whatsapp_phone, "⚠️ Opción inválida. Responde '1' para aceptar la sugerencia del Autopiloto o '2' para ignorar.")
        return {"ok": True, "reply": "Comando inválido de autopiloto."}
        
    # Get latest pending log for this user
    result = await db.execute(
        select(OrchestratorLog)
        .where(OrchestratorLog.user_id == client_user.id, OrchestratorLog.status == "pending")
        .order_by(OrchestratorLog.created_at.desc())
        .limit(1)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        await send_master_notification(client_user.whatsapp_phone, "✅ No tienes acciones pendientes de Autopiloto en este momento.")
        return {"ok": True, "reply": "Sin acciones pendientes."}
        
    if text == "1":
        await send_master_notification(client_user.whatsapp_phone, "⏳ Ejecutando acción en Google Ads...")
        # Dispatch background task
        background_tasks.add_task(execute_whatsapp_action_background, log.id, client_user.whatsapp_phone)
    else:
        log.status = "rejected"
        await db.commit()
        await send_master_notification(client_user.whatsapp_phone, f"🚫 Acción ignorada manualmente:\n{log.action} en la campaña '{log.campaign_name}'.")

    return {"ok": True, "reply": "Comando de autopiloto procesado."}

# ── Baileys (Experimental) ──────────────────────────────────────────────────

class BaileysPayload(BaseModel):
    wa_id: str
    text: str
    name: str | None = None

@router.post("/baileys")
async def baileys_webhook(
    payload: BaileysPayload,
    client_id: str,
    background_tasks: BackgroundTasks,
    x_webhook_secret: str | None = Header(None, alias="x-webhook-secret"),
    db: AsyncSession = Depends(get_db)
):
    """
    Experimental Webhook for Baileys (Synchronous Request-Reply).
    Returns the LLM generated response directly in the HTTP body.
    """
    # 1. Validación de Seguridad usando el generic_webhook_secret
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    
    if not pay_cfg or not pay_cfg.generic_webhook_secret:
        raise HTTPException(status_code=404, detail="Webhook genérico no configurado.")

    if not x_webhook_secret or not hmac.compare_digest(
        x_webhook_secret, pay_cfg.generic_webhook_secret
    ):
        raise HTTPException(status_code=401, detail="Secreto de webhook inválido.")

    # 1.5. Check if this is an Admin/Client trying to use Autopilot
    user_result = await db.execute(select(User).where(User.whatsapp_phone == payload.wa_id))
    client_user = user_result.scalar_one_or_none()
    
    if client_user:
        # This is a platform client sending a message to the Master Bot!
        return await handle_autopilot_command(payload.text, client_user, db, background_tasks)

    # 2. Llamada al Cerebro LLM (Para leads normales)
    try:
        session_result = await db.execute(
            select(ChatSession).where(
                ChatSession.session_id == payload.wa_id,
                ChatSession.client_id == client_id,
            )
        )
        chat_session = session_result.scalar_one_or_none()
        
        # --- COMANDO DE RESET PARA PRUEBAS ---
        if payload.text.strip().lower() in ["/reset", "/reiniciar"]:
            if chat_session:
                await db.delete(chat_session)
                await db.commit()
            return {"ok": True, "reply": "🔄 Tu sesión ha sido reiniciada. Envía un 'hola' para empezar desde cero."}

        if not chat_session:
            chat_session = ChatSession(
                session_id=payload.wa_id,
                client_id=client_id
            )
            db.add(chat_session)
            await db.commit()
            await db.refresh(chat_session)

        config_result = await db.execute(
            select(ChatWidgetConfig).where(ChatWidgetConfig.client_id == client_id)
        )
        chat_config = config_result.scalar_one_or_none()
        
        user_result = await db.execute(select(User).where(User.id == client_id))
        client_user = user_result.scalar_one_or_none()

        if chat_config and chat_config.is_enabled and getattr(chat_config, 'ai_apply_whatsapp', True) and client_user:
            engine_result = await process_chat_message(
                session=chat_session,
                config=chat_config,
                user_message=payload.text,
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
        else:
            llm_reply_text = "El asistente virtual no está activado en este momento."
            
    except Exception as e:
        print(f"Error procesando mensaje en chat_engine (Baileys): {e}")
        llm_reply_text = "Lo siento, estamos experimentando dificultades técnicas."

    # Determinar delays según configuración
    wa_delay_mode = pay_cfg.provider_keys.get("wa_delay_mode", "human") if pay_cfg.provider_keys else "human"
    if wa_delay_mode == "instant":
        base_delay, char_delay, max_delay = 0, 0, 0
    elif wa_delay_mode == "fast":
        base_delay, char_delay, max_delay = 1000, 20, 4000
    elif wa_delay_mode == "medium":
        base_delay, char_delay, max_delay = 2000, 40, 8000
    else: # human
        base_delay, char_delay, max_delay = 4000, 80, 15000

    # 3. Retornar la respuesta síncrona
    return {
        "ok": True, 
        "reply": llm_reply_text,
        "base_delay": base_delay,
        "char_delay": char_delay,
        "max_delay": max_delay
    }


