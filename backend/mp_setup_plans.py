import asyncio
import httpx
from dotenv import load_dotenv
import os

load_dotenv()
MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN")

MP_PRICES = {
    "starter": 97.00,
    "growth": 199.00,
    "pro": 499.00
}

async def main():
    headers = {
        "Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient() as client:
        # 1. Fetch all existing plans
        print("Fetching existing plans...")
        res = await client.get("https://api.mercadopago.com/preapproval_plan/search?limit=100&status=active", headers=headers)
        if res.status_code == 200:
            plans = res.json().get("results", [])
            print(f"Found {len(plans)} active plans to cancel...")
            
            # Cancel all active plans so they stop showing up
            for p in plans:
                plan_id = p["id"]
                # According to MP API, we update status to 'cancelled'
                update_res = await client.put(f"https://api.mercadopago.com/preapproval_plan/{plan_id}", headers=headers, json={"status": "cancelled"})
                if update_res.status_code == 200:
                    print(f"Cancelled plan: {plan_id}")
                else:
                    print(f"Failed to cancel {plan_id}: {update_res.text}")
        else:
            print("Failed to fetch plans")

        # 2. Create the 3 fixed plans
        print("\nCreating the 3 official plans...")
        new_plans = {}
        for tier, amount in MP_PRICES.items():
            payload = {
                "reason": f"QSS Plan {tier.capitalize()}",
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
                "back_url": "https://qss.thequantpartners.com/dashboard/onboarding"
            }
            create_res = await client.post("https://api.mercadopago.com/preapproval_plan", headers=headers, json=payload)
            if create_res.status_code == 201:
                data = create_res.json()
                print(f"Created {tier.capitalize()} Plan: ID={data['id']} | InitPoint={data['init_point']}")
                new_plans[tier] = {
                    "id": data["id"],
                    "init_point": data["init_point"]
                }
            else:
                print(f"Failed to create {tier} plan: {create_res.text}")

if __name__ == "__main__":
    asyncio.run(main())
