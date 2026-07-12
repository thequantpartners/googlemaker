from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from database import get_db
from models import Lead
from services.baileys_service import send_master_notification

router = APIRouter(prefix="/public", tags=["Public"])

class PublicLeadSubmitRequest(BaseModel):
    name: str
    email: str
    phone: str
    consent: bool

async def _send_welcome_whatsapp(name: str, phone: str):
    message = (
        f"¡Hola {name}! 👋 Soy el asistente virtual de QSS.\n\n"
        f"Vi que dejaste tus datos en nuestra web para conocer el sistema automatizado.\n\n"
        f"Para empezar a ayudarte, ¿de qué trata principalmente tu firma de abogados (penal, civil, corporativo...)?"
    )
    await send_master_notification(phone, message)

@router.post("/leads/submit")
async def submit_public_lead(
    req: PublicLeadSubmitRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    if not req.consent:
        raise HTTPException(status_code=400, detail="El consentimiento de WhatsApp es obligatorio.")
        
    # We can use a generic superadmin/internal client_id for internal QSS leads
    # For now, we just trigger the background task to send the message.
    
    # Send the WhatsApp message asynchronously so we don't block the frontend
    background_tasks.add_task(_send_welcome_whatsapp, req.name, req.phone)
    
    return {"ok": True, "message": "Lead submitted and WA initiated."}
