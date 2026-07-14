import os
import hmac
import hashlib
import httpx
import base64
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid
import json

from database import get_db
from models import User, UserTier
from auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

IZIPAY_USERNAME = os.getenv("IZIPAY_USERNAME")
IZIPAY_PASSWORD = os.getenv("IZIPAY_PASSWORD")
IZIPAY_HMAC_KEY = os.getenv("IZIPAY_HMAC_KEY")

IZIPAY_PRICES = {
    "starter": 9700,   # 97.00 PEN (amount in cents)
    "growth": 19900,  # 199.00 PEN
    "pro": 49900      # 499.00 PEN
}

class FormTokenRequest(BaseModel):
    tier: UserTier


@router.post("/create-form-token")
async def create_form_token(
    request: FormTokenRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calls Izipay (Lyra) API to generate a formToken for the Pop-In checkout.
    """
    if not IZIPAY_USERNAME or not IZIPAY_PASSWORD:
        raise HTTPException(status_code=500, detail="Izipay credentials not configured")

    amount = IZIPAY_PRICES.get(request.tier.value)
    if not amount:
        raise HTTPException(status_code=400, detail="Invalid tier selected")

    auth_str = f"{IZIPAY_USERNAME}:{IZIPAY_PASSWORD}"
    auth_b64 = base64.b64encode(auth_str.encode()).decode("utf-8")

    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/json",
    }

    payload = {
        "amount": amount,
        "currency": "PEN",
        "orderId": f"order_{uuid.uuid4().hex[:8]}",
        "customer": {
            "email": user.email,
            "reference": str(user.id)
        },
        "metadata": {
            "tier": request.tier.value,
            "user_id": str(user.id)
        },
        "formAction": "ASK_REGISTER_PAY", 
        "paymentRule": "RRULE:FREQ=MONTHLY" 
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment", headers=headers, json=payload, timeout=10.0)
            
            if res.status_code == 200:
                data = res.json()
                if data.get("status") == "SUCCESS":
                    return {"status": "success", "formToken": data["answer"]["formToken"]}
                else:
                    raise HTTPException(status_code=400, detail=f"Izipay Error: {data}")
            else:
                raise HTTPException(status_code=400, detail=f"Izipay API Error: {res.text}")
    except Exception as e:
        print(f"Error connecting to Izipay: {e}")
        raise HTTPException(status_code=500, detail="Payment gateway unavailable")


@router.post("/webhook")
async def izipay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Izipay IPN (Instant Payment Notification).
    Validates the HMAC-SHA-256 signature and updates user tier.
    """
    try:
        form_data = await request.form()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid form data")

    kr_answer = form_data.get("kr-answer")
    kr_hash = form_data.get("kr-hash")
    kr_hash_algorithm = form_data.get("kr-hash-algorithm")

    if not kr_answer or not kr_hash:
        raise HTTPException(status_code=400, detail="Missing Izipay parameters")

    # Validate signature
    if not IZIPAY_HMAC_KEY:
        print("Webhook error: IZIPAY_HMAC_KEY not set")
        return {"status": "error"}

    calculated_hash = hmac.new(
        IZIPAY_HMAC_KEY.encode("utf-8"),
        kr_answer.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if calculated_hash != kr_hash:
        print("Webhook error: Invalid signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    answer_data = json.loads(kr_answer)
    order_status = answer_data.get("orderStatus")
    
    metadata = answer_data.get("metadata", {})
    user_id = metadata.get("user_id")
    tier_str = metadata.get("tier")

    if not user_id:
        print("Webhook missing user_id")
        return {"status": "ignored"}

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        print(f"User {user_id} not found for webhook")
        return {"status": "ignored"}

    if order_status == "PAID":
        print(f"Payment successful for user {user.email}. Upgrading to {tier_str}")
        user.tier = UserTier(tier_str) if tier_str else UserTier.pro
        await db.commit()
    elif order_status in ["UNPAID", "REJECTED", "CANCELLED"]:
        print(f"Payment failed/cancelled for user {user.email}. Downgrading to none.")
        user.tier = UserTier.none
        await db.commit()

    return {"status": "success"}
