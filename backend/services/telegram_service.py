import os
import httpx

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

async def send_telegram_message(chat_id: str, text: str, inline_keyboard: list = None):
    """
    Sends a message to a Telegram chat.
    inline_keyboard is a list of lists of dictionaries, e.g.:
    [
        [{"text": "Pausar", "callback_data": "pause_123"}, {"text": "Ignorar", "callback_data": "ignore_123"}]
    ]
    """
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        return

    url = f"{TELEGRAM_API_URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    if inline_keyboard:
        payload["reply_markup"] = {
            "inline_keyboard": inline_keyboard
        }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[Telegram Service] Error sending message: {e}")
            return None

async def edit_telegram_message_text(chat_id: str, message_id: int, text: str, inline_keyboard: list = None):
    """
    Edits an existing Telegram message. Useful for removing buttons after they are clicked.
    """
    if not TELEGRAM_BOT_TOKEN or not chat_id or not message_id:
        return

    url = f"{TELEGRAM_API_URL}/editMessageText"
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML"
    }

    if inline_keyboard is not None:
        payload["reply_markup"] = {
            "inline_keyboard": inline_keyboard
        }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[Telegram Service] Error editing message: {e}")
            return None

async def answer_callback_query(callback_query_id: str, text: str = None, show_alert: bool = False):
    """
    Answers a callback query (required by Telegram API to stop the loading spinner on the button).
    """
    if not TELEGRAM_BOT_TOKEN or not callback_query_id:
        return
    
    url = f"{TELEGRAM_API_URL}/answerCallbackQuery"
    payload = {
        "callback_query_id": callback_query_id
    }
    if text:
        payload["text"] = text
        payload["show_alert"] = show_alert

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[Telegram Service] Error answering callback query: {e}")
            return None
