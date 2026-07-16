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

from sqlalchemy import select
from models import MagicForm

class MagicFormPublicOut(BaseModel):
    id: str
    client_id: str
    title: str
    subtitle: str | None
    questions: list
    min_score_to_qualify: int
    rejection_message: str

@router.get("/forms/{form_id}", response_model=MagicFormPublicOut)
async def get_public_form(form_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MagicForm).where(MagicForm.id == form_id))
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return {
        "id": form.id,
        "client_id": form.client_id,
        "title": form.title,
        "subtitle": form.subtitle,
        "questions": form.questions or [],
        "min_score_to_qualify": form.min_score_to_qualify,
        "rejection_message": form.rejection_message
    }

class MagicFormSubmitRequest(BaseModel):
    name: str
    email: str
    phone: str
    score: int
    answers: dict
    gclid: str | None = None

async def _send_client_welcome_whatsapp(name: str, phone: str, client_id: str):
    message = (
        f"¡Hola {name}! 👋\n\n"
        f"Tu perfil ha sido pre-calificado exitosamente por nuestro Magic Form.\n"
        f"Un asesor (IA) revisará tus respuestas y se pondrá en contacto pronto."
    )
    await send_master_notification(phone, message)

@router.post("/forms/{form_id}/submit")
async def submit_public_form(
    form_id: str,
    req: MagicFormSubmitRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MagicForm).where(MagicForm.id == form_id))
    form = result.scalar_one_or_none()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    if req.score < form.min_score_to_qualify:
        return {"ok": False, "rejected": True, "message": form.rejection_message}
        
    lead = Lead(
        client_id=form.client_id,
        name=req.name,
        email=req.email,
        phone=req.phone,
        source="magic_form",
        gclid=req.gclid,
    )
    db.add(lead)
    await db.commit()
    
    background_tasks.add_task(_send_client_welcome_whatsapp, req.name, req.phone, form.client_id)
    
    if req.gclid:
        background_tasks.add_task(_process_offline_conversion, form.client_id, req.gclid)
        
    return {"ok": True, "rejected": False, "message": "Lead qualified and WA initiated."}

async def _process_offline_conversion(client_id: str, gclid: str):
    from database import SessionLocal
    from models import GoogleAdsCredential
    from services.google_ads_service import get_google_ads_client, upload_offline_conversion, fetch_conversion_actions, create_offline_conversion_action
    from datetime import datetime, timezone
    
    async with SessionLocal() as db:
        result = await db.execute(select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == client_id))
        cred = result.scalars().first()
        if not cred or not cred.refresh_token:
            return
            
        try:
            client = get_google_ads_client(cred.refresh_token, cred.login_customer_id)
            actions = fetch_conversion_actions(client, cred.target_customer_id)
            
            # Find the offline conversion action
            offline_action = next((a for a in actions if a['type'] == 'UPLOAD_CLICKS'), None)
            if not offline_action:
                # Create it automatically
                rn = create_offline_conversion_action(client, cred.target_customer_id)
            else:
                customer_id_clean = cred.target_customer_id.replace("-", "")
                rn = f"customers/{customer_id_clean}/conversionActions/{offline_action['id']}"
                
            conversion_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S+00:00")
            upload_offline_conversion(client, cred.target_customer_id, rn, gclid, conversion_time)
        except Exception as e:
            print(f"Error processing offline conversion: {e}")
