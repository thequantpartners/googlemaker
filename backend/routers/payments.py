import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid

from database import get_db
from models import User, UserTier
from auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN")

MP_PRICES = {
    "starter": 97.00,
    "growth": 199.00,
    "pro": 499.00
}

class SubscriptionRequest(BaseModel):
    tier: UserTier


@router.post("/create-subscription")
async def create_subscription(
    request: SubscriptionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a Mercado Pago Preapproval Plan and returns the init_point URL.
    """
    if not MERCADOPAGO_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Mercado Pago token not configured")

    amount = MP_PRICES.get(request.tier.value)
    if not amount:
        raise HTTPException(status_code=400, detail="Invalid tier selected")

    headers = {
        "Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }

    # Store user_id and tier in the external_reference and reason for webhook parsing
    payload = {
        "reason": f"QSS Plan {request.tier.value.capitalize()} - {user.id}",
        "auto_recurring": {
            "frequency": 1,
            "frequency_type": "months",
            "transaction_amount": amount,
            "currency_id": "PEN",
            "free_trial": {
                "frequency": 7,
                "frequency_type": "days"
            }
        },
        "back_url": "https://qss.thequantpartners.com/dashboard/onboarding",
        "payer_email": user.email,
        "external_reference": f"{user.id}|{request.tier.value}"
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://api.mercadopago.com/preapproval_plan", headers=headers, json=payload, timeout=10.0)
            
            if res.status_code == 201:
                data = res.json()
                return {"status": "success", "init_point": data["init_point"]}
            else:
                raise HTTPException(status_code=400, detail=f"MP API Error: {res.text}")
    except Exception as e:
        print(f"Error connecting to Mercado Pago: {e}")
        raise HTTPException(status_code=500, detail="Payment gateway unavailable")


@router.post("/webhook")
async def mercadopago_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Mercado Pago IPN Webhook.
    """
    if not MERCADOPAGO_ACCESS_TOKEN:
        return {"status": "ignored"}

    topic = request.query_params.get("topic") or request.query_params.get("type")
    
    # We can also receive id from query params or data.id from json body
    resource_id = request.query_params.get("id") or request.query_params.get("data.id")

    if not resource_id:
        try:
            body = await request.json()
            topic = body.get("type") or body.get("topic")
            resource_id = body.get("data", {}).get("id")
        except Exception:
            pass

    if not topic or not resource_id:
        return {"status": "ignored"}

    if topic == "subscription_preapproval":
        # Fetch the preapproval to see its status and external_reference
        headers = {"Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}"}
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://api.mercadopago.com/preapproval/{resource_id}", headers=headers)
            
            if res.status_code == 200:
                data = res.json()
                status = data.get("status")
                external_reference = data.get("external_reference") or ""
                reason = data.get("reason") or ""
                
                # Parse user_id and tier
                user_id = None
                tier_str = None
                
                if "|" in external_reference:
                    user_id, tier_str = external_reference.split("|", 1)
                elif " - " in reason:
                    # Fallback to parsing reason "QSS Plan Pro - <user_id>"
                    parts = reason.split(" - ")
                    if len(parts) >= 2:
                        user_id = parts[-1]
                        tier_str = parts[0].split(" ")[-1].lower()

                if user_id and tier_str:
                    result = await db.execute(select(User).where(User.id == user_id))
                    user = result.scalar_one_or_none()
                    if user:
                        if status == "authorized":
                            user.tier = UserTier(tier_str)
                            await db.commit()
                            print(f"MP Webhook: Upgraded {user.email} to {tier_str}")
                        elif status in ["cancelled", "paused"]:
                            user.tier = UserTier.none
                            await db.commit()
                            print(f"MP Webhook: Downgraded {user.email} to none")

    return {"status": "success"}
