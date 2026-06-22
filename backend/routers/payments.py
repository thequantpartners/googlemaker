import os
import hmac
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database import get_db
from models import User, UserTier
from auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

LEMONSQUEEZY_API_KEY = os.getenv("LEMONSQUEEZY_API_KEY")
LEMONSQUEEZY_STORE_ID = os.getenv("LEMONSQUEEZY_STORE_ID")
LEMONSQUEEZY_WEBHOOK_SECRET = os.getenv("LEMONSQUEEZY_WEBHOOK_SECRET")

# Example variant mapping (we can adjust these if needed or mock them for now)
# We map the tiers to dummy variant IDs for the mock
VARIANT_MAP = {
    "starter": "1811311",
    "growth": "1811312",
    "pro": "1811313",
    "elite": "dummy_elite_1"
}

class CheckoutRequest(BaseModel):
    tier: UserTier


@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CheckoutRequest,
    user: User = Depends(get_current_user)
):
    if not LEMONSQUEEZY_API_KEY or not LEMONSQUEEZY_STORE_ID:
        raise HTTPException(status_code=500, detail="Lemon Squeezy credentials not configured")

    variant_id = VARIANT_MAP.get(request.tier.value)
    if not variant_id:
        raise HTTPException(status_code=400, detail="Invalid tier selected")

    url = "https://api.lemonsqueezy.com/v1/checkouts"
    headers = {
        "Authorization": f"Bearer {LEMONSQUEEZY_API_KEY}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    }

    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "custom": {
                        "user_id": str(user.id)
                    }
                }
            },
            "relationships": {
                "store": {
                    "data": {
                        "type": "stores",
                        "id": str(LEMONSQUEEZY_STORE_ID)
                    }
                },
                "variant": {
                    "data": {
                        "type": "variants",
                        "id": variant_id
                    }
                }
            }
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)

        if response.status_code != 201:
            print(f"Lemon Squeezy API Error: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to create checkout session")

        data = response.json()
        checkout_url = data["data"]["attributes"]["url"]
        return {"url": checkout_url}


from sqlalchemy import select

@router.post("/webhook")
async def lemon_squeezy_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    raw_body = await request.body()
    signature = request.headers.get("X-Signature")

    if not signature or not LEMONSQUEEZY_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Firma inválida")

    # Verify HMAC signature
    digest = hmac.new(
        LEMONSQUEEZY_WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(digest, signature):
        print("Webhook signature mismatch")
        raise HTTPException(status_code=400, detail="Firma inválida")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_name = payload.get("meta", {}).get("event_name")
    print(f"Lemon Squeezy webhook received: {event_name}")

    if event_name in ("subscription_created", "subscription_updated"):
        custom_data = payload.get("meta", {}).get("custom_data", {})
        user_id = custom_data.get("user_id")

        if not user_id:
            print("Webhook missing user_id in custom_data")
            return {"status": "ignored", "reason": "missing user_id"}

        # We also need to know the tier. Since the event does not explicitly give the tier name,
        # but provides the variant_id, we can map it back to our tier.
        variant_id = str(payload.get("data", {}).get("attributes", {}).get("variant_id"))

        # Reverse mapping from variant ID to tier
        tier_name = None
        for t, v in VARIANT_MAP.items():
            if str(v) == variant_id:
                tier_name = t
                break

        if not tier_name:
            print(f"Webhook unrecognized variant_id: {variant_id}")
            return {"status": "ignored", "reason": "unrecognized variant"}

        try:
            tier_enum = UserTier(tier_name)
        except ValueError:
            print(f"Webhook unrecognized tier: {tier_name}")
            return {"status": "ignored", "reason": "invalid tier"}

        # Update the user
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user:
            print(f"Updating user {user_id} tier to {tier_name}")
            user.tier = tier_enum
            await db.commit()
        else:
            print(f"User {user_id} not found")

    elif event_name in ("subscription_cancelled", "subscription_expired", "subscription_payment_failed"):
        custom_data = payload.get("meta", {}).get("custom_data", {})
        user_id = custom_data.get("user_id")

        if not user_id:
            print(f"Webhook missing user_id in custom_data for {event_name}")
            return {"status": "ignored", "reason": "missing user_id"}

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user:
            print(f"Downgrading user {user_id} tier to none due to {event_name}")
            user.tier = UserTier.none
            await db.commit()
        else:
            print(f"User {user_id} not found")

    return {"status": "success"}
