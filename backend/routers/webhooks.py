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
from models import ClientPaymentConfig, Lead

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

@router.post("/ycloud/conversion")
async def ycloud_conversion_webhook(
    request: Request,
    client_id: str,
    x_ycloud_secret: str | None = Header(None, alias="x-ycloud-secret"),
    db: AsyncSession = Depends(get_db)
):
    """
    YCloud webhook for offline conversions (Upsert).
    Parses the GCLID from the incoming WhatsApp message text.
    """
    payload = await request.json()
    
    # 1. Validación de Seguridad Multi-tenant
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    
    if not pay_cfg or not pay_cfg.generic_webhook_secret:
        raise HTTPException(status_code=404, detail="Webhook no configurado.")
        
    if not x_ycloud_secret or not hmac.compare_digest(x_ycloud_secret, pay_cfg.generic_webhook_secret):
        raise HTTPException(status_code=401, detail="Secreto de webhook inválido.")

    # 2. Parseo del Payload de YCloud
    try:
        message = payload["entry"][0]["changes"][0]["value"]["messages"][0]
        wa_id = message["from"]
        text_body = message.get("text", {}).get("body", "")
    except (KeyError, IndexError, TypeError):
        return {"ok": True, "detail": "No text message found to process."}

    # Buscar GCLID usando regex o split basico (ej. Ref: GCLID--SOURCE--CAMPAIGN)
    import re
    match = re.search(r'Ref:\s*([^\s]+)', text_body)
    if not match:
        return {"ok": True, "detail": "No GCLID reference found in message."}
        
    cuf_qss_payload = match.group(1)
    payload_parts = cuf_qss_payload.split('--')
    gclid_value = payload_parts[0] if len(payload_parts) > 0 else ""
    utm_source = payload_parts[1] if len(payload_parts) > 1 else ""
    utm_campaign = payload_parts[2] if len(payload_parts) > 2 else ""

    if not gclid_value:
        raise HTTPException(status_code=400, detail="GCLID vacío.")

    # 3. Lógica de Upsert del Lead
    lead_result = await db.execute(
        select(Lead).where(
            Lead.gclid == gclid_value, 
            Lead.client_id == client_id
        )
    )
    lead = lead_result.scalar_one_or_none()
    
    if not lead:
        # El lead no existe (flujo directo a WhatsApp sin form web). Lo creamos.
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

    # 4. Marcar como venta real (Simulada por conversión)
    lead.full_case_paid = True
    lead.full_case_amount = 150.00  # Default or extractable
    
    await db.commit()
    
    return {
        "ok": True, 
        "lead_id": lead.id, 
        "action": "upsert_and_convert",
        "gclid": gclid_value
    }


@router.post("/ycloud/chat")
async def ycloud_chat_webhook(
    request: Request,
    client_id: str,
    x_ycloud_secret: str | None = Header(None, alias="x-ycloud-secret"),
    db: AsyncSession = Depends(get_db)
):
    """
    YCloud conversational bridge.
    Acts as LLM brain to process messages and reply via YCloud API.
    """
    payload = await request.json()

    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    
    if not pay_cfg or not pay_cfg.generic_webhook_secret:
        raise HTTPException(status_code=404, detail="Webhook no configurado.")
        
    if not x_ycloud_secret or not hmac.compare_digest(x_ycloud_secret, pay_cfg.generic_webhook_secret):
        raise HTTPException(status_code=401, detail="Secreto de webhook inválido.")
    
    # 2. Recuperar la configuración de YCloud
    keys = pay_cfg.provider_keys or {}
    ycloud_api_key = keys.get("ycloud_api_key")

    if not ycloud_api_key:
        raise HTTPException(status_code=400, detail="YCloud API Key no configurado.")

    # 3. Parsear mensaje entrante de YCloud
    try:
        message = payload["entry"][0]["changes"][0]["value"]["messages"][0]
        wa_id = message["from"]
        text_body = message.get("text", {}).get("body", "")
    except (KeyError, IndexError, TypeError):
        return {"ok": True, "detail": "No text message found."}

    # 4. Llamada simulada al LLM
    try:
        llm_reply_text = f"[QSS AI Brain] Entendido. Recibí tu mensaje vía YCloud: '{text_body}'"
    except Exception:
        llm_reply_text = "Lo siento, estamos experimentando dificultades técnicas."

    # 5. Enviar la respuesta de vuelta a WhatsApp vía API de YCloud
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

    return {"ok": True, "status": "message_dispatched"}
