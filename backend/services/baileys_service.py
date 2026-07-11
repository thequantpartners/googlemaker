import os
import httpx

# If Baileys is running locally with docker-compose or similar, use localhost:3000
# But usually it's injected via env var. Fallback to localhost:3000
BAILEYS_SERVER_URL = os.getenv("BAILEYS_SERVER_URL", "http://localhost:3000")

async def send_master_notification(phone: str, message: str) -> bool:
    """
    Sends a message to a WhatsApp number using the Agency's Baileys Master Bot.
    This triggers the POST /api/send endpoint on the Baileys Node.js server.
    """
    if not phone:
        return False

    url = f"{BAILEYS_SERVER_URL}/api/send"
    payload = {
        "to": phone,
        "text": message
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            if response.status_code == 200:
                return True
            else:
                print(f"[!] Baileys API responded with {response.status_code}: {response.text}")
                return False
    except Exception as e:
        print(f"Error sending Baileys notification: {e}")
        return False
