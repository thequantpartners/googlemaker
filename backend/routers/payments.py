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
    "starter": 99.00,
    "growth": 99.00,
    "pro": 99.00
}

class SubscriptionRequest(BaseModel):
    tier: UserTier

MP_PLAN_INIT_POINTS = {
    "starter": "https://www.mercadopago.com.pe/subscriptions/checkout?preapproval_plan_id=e7a857ce5c7842249497861b725e8210",
    "growth": "https://www.mercadopago.com.pe/subscriptions/checkout?preapproval_plan_id=66d940c577894065b42c36dcd1ef132b",
    "pro": "https://www.mercadopago.com.pe/subscriptions/checkout?preapproval_plan_id=c0ff7e942eef4f5d98877ae599a21a10"
}


@router.post("/create-subscription")
async def create_subscription(
    request: SubscriptionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the init_point URL for the corresponding fixed Mercado Pago Plan.
    """
    if not MERCADOPAGO_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Mercado Pago token not configured")

    init_point = MP_PLAN_INIT_POINTS.get(request.tier.value)
    if not init_point:
        raise HTTPException(status_code=400, detail="Invalid tier selected")

    return {"status": "success", "init_point": init_point}


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
                
                payer_email = data.get("payer_email")
                
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

                # If still no tier_str, infer from reason
                if not tier_str and "QSS Plan " in reason:
                    tier_str = reason.replace("QSS Plan ", "").strip().lower()

                if not user_id and payer_email:
                    result = await db.execute(select(User).where(User.email == payer_email))
                    matched_user = result.scalar_one_or_none()
                    if matched_user:
                        user_id = matched_user.id

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

class LinkSubscriptionRequest(BaseModel):
    preapproval_id: str

@router.post("/link-subscription")
async def link_subscription(
    request: LinkSubscriptionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Links a Mercado Pago subscription to the current user (used when they return via back_url).
    """
    if not MERCADOPAGO_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="Mercado Pago token not configured")
        
    headers = {"Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}"}
    async with httpx.AsyncClient() as client:
        res = await client.get(f"https://api.mercadopago.com/preapproval/{request.preapproval_id}", headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "authorized":
                reason = data.get("reason", "")
                tier_str = None
                if "QSS Plan " in reason:
                    tier_str = reason.replace("QSS Plan ", "").strip().lower()
                    
                if tier_str:
                    user.tier = UserTier(tier_str)
                    await db.commit()
                    return {"status": "success", "tier": tier_str}
            
            raise HTTPException(status_code=400, detail="Subscription is not authorized or not found.")
        else:
            raise HTTPException(status_code=400, detail="Invalid preapproval ID.")
