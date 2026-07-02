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

from fastapi import APIRouter, Depends, Header, HTTPException, Request
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

    if payment_type == "consultation":
        lead.consultation_paid = True
        if amount:
            lead.consultation_amount = amount
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
        payment_type = metadata.get("payment_type", "consultation")
        amount_total = session_obj.get("amount_total")
        amount = (amount_total / 100) if amount_total else None

        if lead_id:
            await _update_lead_payment(db, lead_id, client_id, payment_type, amount)

    return {"received": True}


# ── Generic / Custom Webhook ─────────────────────────────────────────────────


@router.post("/generic/{client_id}")
async def generic_webhook(
    client_id: str,
    request: Request,
    x_webhook_secret: str | None = Header(None, alias="x-webhook-secret"),
    db: AsyncSession = Depends(get_db),
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
    payment_type = body.get("payment_type", "consultation")
    amount = body.get("amount")

    if not lead_id:
        raise HTTPException(status_code=400, detail="lead_id is required.")

    lead = await _update_lead_payment(db, lead_id, client_id, payment_type, amount)
    return {
        "ok": True,
        "lead_id": lead.id,
        "payment_type": payment_type,
        "consultation_paid": lead.consultation_paid,
        "full_case_paid": lead.full_case_paid,
    }

# ── YCloud ─────────────────────────────────────────────────────────────────

@router.post("/ycloud/webhook")
async def ycloud_master_webhook(
    request: Request,
    client_id: str,
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

    # Parsear t=timestamp, s=signature
    sig_parts = dict(kv.split("=") for kv in ycloud_signature.split(","))
    req_timestamp = sig_parts.get("t")
    req_sig = sig_parts.get("s")

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
        else:
            return {"ok": True, "detail": "Formato de payload no reconocido."}
    except (KeyError, IndexError, TypeError):
        return {"ok": True, "detail": "No text message found."}

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

        if chat_config and chat_config.is_enabled and client_user:
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
    ycloud_url = "https://api.ycloud.com/v2/whatsapp/messages/send"
    
    headers = {
        "X-API-Key": ycloud_api_key,
        "Content-Type": "application/json"
    }
    
    yc_payload = {
        "to": wa_id,
        "type": "text",
        "text": {
            "body": llm_reply_text
        }
    }
    
    async with httpx.AsyncClient() as client:
        yc_res = await client.post(ycloud_url, headers=headers, json=yc_payload)
        if yc_res.status_code >= 400:
            print(f"YCloud API Error: {yc_res.text}")

    return {"ok": True, "status": "processed"}


# ── Baileys (Experimental) ──────────────────────────────────────────────────

class BaileysPayload(BaseModel):
    wa_id: str
    text: str
    name: str | None = None

@router.post("/baileys")
async def baileys_webhook(
    payload: BaileysPayload,
    client_id: str,
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

    # 2. Llamada al Cerebro LLM
    try:
        session_result = await db.execute(
            select(ChatSession).where(
                ChatSession.session_id == payload.wa_id,
                ChatSession.client_id == client_id,
            )
        )
        chat_session = session_result.scalar_one_or_none()
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

        if chat_config and chat_config.is_enabled and client_user:
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

    # 3. Retornar la respuesta síncrona
    return {"ok": True, "reply": llm_reply_text}
