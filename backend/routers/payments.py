import os
import hmac
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database import get_db
from models import User, UserTier
from auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

CULQI_PRIVATE_KEY = os.getenv("CULQI_PRIVATE_KEY")

# Mapping our system tiers to Culqi Plan IDs (These must be created in Culqi Panel)
CULQI_PLAN_MAP = {
    "starter": "pln_test_starter_97",
    "growth": "pln_test_growth_199",
    "pro": "pln_test_scale_499"
}

class SubscriptionRequest(BaseModel):
    token_id: str
    tier: UserTier


@router.post("/create-subscription")
async def create_subscription(
    request: SubscriptionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a Culqi Customer, adds the Card (Token), and subscribes them to a Plan.
    """
    if not CULQI_PRIVATE_KEY:
        raise HTTPException(status_code=500, detail="Culqi credentials not configured")

    plan_id = CULQI_PLAN_MAP.get(request.tier.value)
    if not plan_id:
        raise HTTPException(status_code=400, detail="Invalid tier selected")

    headers = {
        "Authorization": f"Bearer {CULQI_PRIVATE_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        # 1. Create Customer
        customer_payload = {
            "first_name": user.name.split(" ")[0] if user.name else "Cliente",
            "last_name": user.name.split(" ")[1] if len(user.name.split(" ")) > 1 else "QSS",
            "email": user.email,
            "address": "Lima, Peru",
            "address_city": "Lima",
            "phone_number": "999999999", # Can be extracted from Lead or Profile later
            "country_code": "PE"
        }
        res_cust = await client.post("https://api.culqi.com/v2/customers", headers=headers, json=customer_payload)
        if res_cust.status_code >= 400:
            raise HTTPException(status_code=400, detail=f"Culqi Customer Error: {res_cust.text}")
        customer_id = res_cust.json().get("id")

        # 2. Create Card using the Token
        card_payload = {
            "customer_id": customer_id,
            "token_id": request.token_id
        }
        res_card = await client.post("https://api.culqi.com/v2/cards", headers=headers, json=card_payload)
        if res_card.status_code >= 400:
            raise HTTPException(status_code=400, detail=f"Culqi Card Error: {res_card.text}")
        card_id = res_card.json().get("id")

        # 3. Create Subscription
        sub_payload = {
            "card_id": card_id,
            "plan_id": plan_id,
            "metadata": {
                "user_id": str(user.id)
            }
        }
        res_sub = await client.post("https://api.culqi.com/v2/subscriptions", headers=headers, json=sub_payload)
        if res_sub.status_code >= 400:
            raise HTTPException(status_code=400, detail=f"Culqi Subscription Error: {res_sub.text}")
        
        # Optimistically update user tier
        user.tier = request.tier
        await db.commit()

        return {"status": "success", "subscription_id": res_sub.json().get("id")}


@router.post("/webhook")
async def culqi_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Listens to Culqi Webhook events (e.g., subscription.created, charge.failed).
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("type")
    data = payload.get("data", {})
    print(f"Culqi webhook received: {event_type}")

    # The metadata contains our internal user_id
    metadata = data.get("metadata", {})
    user_id = metadata.get("user_id")

    if not user_id:
        # If it's a charge event, metadata might be nested or we might need to look up the customer
        print("Webhook missing user_id in metadata, ignoring.")
        return {"status": "ignored", "reason": "missing user_id"}

    if event_type in ("subscription.creation.succeeded", "charge.succeeded"):
        # Payment successful, ensure user has the correct tier based on plan_id
        # Note: In a robust implementation, you fetch the user and ensure they are active.
        pass 

    elif event_type in ("subscription.deleted", "charge.failed"):
        # Downgrade user if payment fails
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user:
            print(f"Downgrading user {user_id} tier to none due to {event_type}")
            user.tier = UserTier.none
            await db.commit()
        else:
            print(f"User {user_id} not found")

    return {"status": "success"}
