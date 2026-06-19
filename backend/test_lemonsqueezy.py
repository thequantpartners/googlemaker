import asyncio
import json
import os
import hmac
import hashlib
from fastapi.testclient import TestClient
from main import app
from database import engine, Base, async_session
from models import User, UserTier
from auth import create_jwt
import sqlalchemy as sa
from dotenv import load_dotenv

load_dotenv()

client = TestClient(app)

async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        user = await session.scalar(sa.select(User).where(User.email == "test_lemon@example.com"))
        if not user:
            from models import _uuid
            user = User(
                id=_uuid(),
                email="test_lemon@example.com",
                name="Test Lemon User",
                role="client",
                tier=UserTier.none
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        else:
            # reset tier
            user.tier = UserTier.none
            await session.commit()
            await session.refresh(user)
        return user.id

async def verify_db(user_id):
    async with async_session() as session:
        user = await session.scalar(sa.select(User).where(User.id == user_id))
        return user.tier

def test_flow():
    # 1. Setup DB
    loop = asyncio.get_event_loop()
    user_id = loop.run_until_complete(setup_db())
    print(f"Test user ID: {user_id}")

    # 2. Generate JWT
    token = create_jwt(user_id, "test_lemon@example.com", "client")
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Checkout Session
    print("\n--- Testing /payments/create-checkout-session ---")
    resp = client.post("/payments/create-checkout-session", json={"tier": "basic"}, headers=headers)
    print("Response Status:", resp.status_code)
    print("Response JSON:", resp.json())
    assert resp.status_code == 200
    assert "url" in resp.json()
    print("[OK] Checkout Session created successfully.")

    # 4. Simulate Webhook
    print("\n--- Testing /payments/webhook ---")
    secret = os.getenv("LEMONSQUEEZY_WEBHOOK_SECRET")
    payload_dict = {
        "meta": {
            "event_name": "subscription_created",
            "custom_data": {
                "user_id": user_id
            }
        },
        "data": {
            "attributes": {
                "variant_id": 1811311,
                "customer_id": "cust_12345"
            }
        }
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    signature = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()

    webhook_headers = {
        "X-Signature": signature,
        "Content-Type": "application/json"
    }

    resp_webhook = client.post("/payments/webhook", content=payload_bytes, headers=webhook_headers)
    print("Response Status:", resp_webhook.status_code)
    print("Response JSON:", resp_webhook.json())
    assert resp_webhook.status_code == 200

    # 5. Verify DB Update
    new_tier = loop.run_until_complete(verify_db(user_id))
    print(f"\nUser tier in DB after webhook: {new_tier}")
    assert new_tier.value == "basic"
    print("[OK] Webhook processed correctly, user tier updated.")

if __name__ == "__main__":
    test_flow()
