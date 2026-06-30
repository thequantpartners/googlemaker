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

# ── Manychat ─────────────────────────────────────────────────────────────────

class ManychatConversionPayload(BaseModel):
    client_id: str
    manychat_user_id: str
    cuf_qss_payload: str  # e.g., "EAIaIQob...--google--promo-verano"
    conversion_value: float
    currency: str = "PEN"

@router.post("/manychat/conversion")
async def manychat_conversion_webhook(
    payload: ManychatConversionPayload,
    x_manychat_secret: str | None = Header(None, alias="x-manychat-secret"),
    db: AsyncSession = Depends(get_db)
):
    """
    Manychat webhook for offline conversions (Upsert).
    Parses the concatenated GCLID and creates the lead if it doesn't exist.
    """
    # 1. Validación de Seguridad Multi-tenant
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == payload.client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    
    if not pay_cfg or not pay_cfg.generic_webhook_secret:
        raise HTTPException(status_code=404, detail="Webhook no configurado.")
        
    if not x_manychat_secret or not hmac.compare_digest(x_manychat_secret, pay_cfg.generic_webhook_secret):
        raise HTTPException(status_code=401, detail="Secreto de webhook inválido.")

    # 2. Parseo Nativo del Payload
    payload_parts = payload.cuf_qss_payload.split('--')
    gclid_value = payload_parts[0] if len(payload_parts) > 0 else ""
    utm_source = payload_parts[1] if len(payload_parts) > 1 else ""
    utm_campaign = payload_parts[2] if len(payload_parts) > 2 else ""

    if not gclid_value:
        raise HTTPException(status_code=400, detail="GCLID no encontrado en el payload.")

    # 3. Lógica de Upsert del Lead
    lead_result = await db.execute(
        select(Lead).where(
            Lead.gclid == gclid_value, 
            Lead.client_id == payload.client_id
        )
    )
    lead = lead_result.scalar_one_or_none()
    
    if not lead:
        # El lead no existe (flujo directo a WhatsApp sin form web). Lo creamos.
        lead = Lead(
            id=str(uuid.uuid4()),
            client_id=payload.client_id,
            gclid=gclid_value,
            utm_source=utm_source,
            utm_campaign=utm_campaign,
            name=f"WA Lead {payload.manychat_user_id}",
            email="no-email@whatsapp.local"
        )
        db.add(lead)

    # 4. Marcar como venta real
    lead.full_case_paid = True
    lead.full_case_amount = payload.conversion_value
    
    await db.commit()
    
    return {
        "ok": True, 
        "lead_id": lead.id, 
        "action": "upsert_and_convert",
        "gclid": gclid_value
    }


class ManychatChatPayload(BaseModel):
    client_id: str
    manychat_user_id: str
    message_text: str

@router.post("/manychat/chat")
async def manychat_chat_webhook(
    payload: ManychatChatPayload,
    x_manychat_secret: str | None = Header(None, alias="x-manychat-secret"),
    db: AsyncSession = Depends(get_db)
):
    """
    Manychat conversational bridge.
    Acts as LLM brain to process messages and reply via Manychat API.
    """
    result = await db.execute(
        select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == payload.client_id)
    )
    pay_cfg = result.scalar_one_or_none()
    
    if not pay_cfg or not pay_cfg.generic_webhook_secret:
        raise HTTPException(status_code=404, detail="Webhook no configurado.")
        
    if not x_manychat_secret or not hmac.compare_digest(x_manychat_secret, pay_cfg.generic_webhook_secret):
        raise HTTPException(status_code=401, detail="Secreto de webhook inválido.")
    
    # 2. Recuperar la configuración LLM del cliente
    llm_keys = pay_cfg.provider_keys or {}
    # openai_api_key = llm_keys.get("openai_api_key")
    manychat_api_token = llm_keys.get("manychat_api_token")

    if not manychat_api_token:
        # Log this internally but don't fail for the user, maybe we just echo?
        # For this implementation, we require the token.
        raise HTTPException(status_code=400, detail="Token de Manychat API no configurado.")

    # 3. Llamada simulada al LLM
    try:
        llm_reply_text = f"[QSS AI Brain] Entendido. Recibí tu mensaje: '{payload.message_text}'"
    except Exception:
        llm_reply_text = "Lo siento, estamos experimentando dificultades técnicas."

    # 4. Enviar la respuesta de vuelta a WhatsApp vía API de Manychat
    manychat_url = "https://api.manychat.com/fb/sending/sendContent"
    
    headers = {
        "Authorization": f"Bearer {manychat_api_token}",
        "Content-Type": "application/json"
    }
    
    mc_payload = {
        "subscriber_id": payload.manychat_user_id,
        "data": {
            "version": "v2",
            "content": {
                "messages": [
                    {
                        "type": "text",
                        "text": llm_reply_text
                    }
                ]
            }
        }
    }
    
    async with httpx.AsyncClient() as client:
        mc_res = await client.post(manychat_url, headers=headers, json=mc_payload)
        # Log output for debugging if needed, ignoring failures for this PoC
        if mc_res.status_code != 200:
            print(f"Manychat API Error: {mc_res.text}")

    return {"ok": True, "status": "message_dispatched"}
