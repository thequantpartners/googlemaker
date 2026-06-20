from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from database import get_db
from models import User, OrchestratorLog, GoogleAdsCredential
from services.telegram_service import send_telegram_message, edit_telegram_message_text, answer_callback_query
from services.google_ads_service import get_google_ads_client, apply_campaign_action

router = APIRouter(prefix="/telegram", tags=["Telegram"])

async def process_start_command(db: AsyncSession, chat_id: str, text: str):
    parts = text.split(" ")
    if len(parts) == 2 and parts[0] == "/start":
        token = parts[1]
        result = await db.execute(select(User).where(User.telegram_link_token == token))
        user = result.scalar_one_or_none()
        
        if user:
            user.telegram_chat_id = str(chat_id)
            user.telegram_link_token = None
            await db.commit()
            
            await send_telegram_message(
                chat_id=str(chat_id),
                text=f"🤖 <b>¡Hola {user.name}!</b>\n\nTu cuenta de Telegram ha sido conectada exitosamente al <b>GMaker Autopilot</b>.\n\nA partir de ahora, te notificaré por aquí sobre el rendimiento de tus campañas y podrás tomar decisiones con un solo clic."
            )
        else:
            await send_telegram_message(
                chat_id=str(chat_id),
                text="❌ Token de conexión inválido o expirado. Genera uno nuevo desde el Dashboard."
            )

async def execute_action_background(log_id: str, chat_id: str, message_id: int):
    """Background task to execute the Google Ads action."""
    from database import async_session
    
    async with async_session() as db:
        result = await db.execute(select(OrchestratorLog).where(OrchestratorLog.id == log_id))
        log = result.scalar_one_or_none()
        
        if not log:
            return
            
        try:
            # We need the user's credentials
            cred_result = await db.execute(
                select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == log.user_id)
            )
            creds = cred_result.scalars().all()
            if not creds:
                raise Exception("Credentials not found")
                
            cred = creds[0] # Try the first one, or ideally we should save target_customer_id in the log
            
            from encryption import decrypt_value
            refresh_token = decrypt_value(cred.refresh_token)
            login_id = decrypt_value(cred.login_customer_id)
            target_id = decrypt_value(cred.target_customer_id)

            client = await asyncio.to_thread(get_google_ads_client, refresh_token, login_id)
            
            # Execute action
            await asyncio.to_thread(
                apply_campaign_action,
                client,
                target_id,
                log.campaign_id,
                log.action
            )
            
            log.status = "approved"
            await db.commit()
            
            # Edit the message to show success
            await edit_telegram_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=f"✅ <b>Acción Ejecutada:</b> {log.action}\nCampaña: {log.campaign_name}"
            )
        except Exception as e:
            print(f"Error executing action from Telegram: {e}")
            await edit_telegram_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=f"❌ <b>Error al ejecutar la acción:</b>\n{str(e)}"
            )

@router.post("/webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """
    Webhook endpoint to receive updates from Telegram.
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Handle standard messages
    if "message" in data:
        message = data["message"]
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")
        
        if chat_id and text.startswith("/start"):
            await process_start_command(db, str(chat_id), text)
            
    # Handle callback queries (button clicks)
    elif "callback_query" in data:
        callback_query = data["callback_query"]
        query_id = callback_query.get("id")
        callback_data = callback_query.get("data")
        message = callback_query.get("message", {})
        chat_id = str(message.get("chat", {}).get("id"))
        message_id = message.get("message_id")
        
        if callback_data and callback_data.startswith("approve_"):
            log_id = callback_data.split("_")[1]
            
            # Answer the query so the button stops loading
            await answer_callback_query(query_id, text="Ejecutando acción...")
            
            # Edit message to show loading state
            await edit_telegram_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text="⏳ <b>Ejecutando acción en Google Ads...</b>"
            )
            
            # Dispatch background task to actually run the action
            background_tasks.add_task(execute_action_background, log_id, chat_id, message_id)
            
        elif callback_data and callback_data.startswith("reject_"):
            log_id = callback_data.split("_")[1]
            
            result = await db.execute(select(OrchestratorLog).where(OrchestratorLog.id == log_id))
            log = result.scalar_one_or_none()
            if log:
                log.status = "rejected"
                await db.commit()
            
            await answer_callback_query(query_id, text="Acción rechazada.")
            await edit_telegram_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=f"🚫 <b>Acción Rechazada (Manual):</b> {log.action if log else 'Desconocida'}\nCampaña: {log.campaign_name if log else ''}"
            )

    return {"ok": True}
