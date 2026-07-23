"""
routers/clients.py — Client-facing endpoints (require client role).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import require_client
from database import get_db
from models import User
from schemas import UserOut, ClientUpdateMe

router = APIRouter(prefix="/clients", tags=["Clients"])


# ── Get own profile ─────────────────────────────────────────────────────────


@router.get("/me", response_model=UserOut)
async def get_my_profile(
    user: User = Depends(require_client),
):
    return user

@router.patch("/me", response_model=UserOut)
async def update_my_profile(
    data: ClientUpdateMe,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    phone_updated = False
    new_phone = None

    if data.whatsapp_phone is not None and data.whatsapp_phone.strip() != "":
        cleaned_phone = data.whatsapp_phone.strip()
        if user.whatsapp_phone != cleaned_phone:
            user.whatsapp_phone = cleaned_phone
            phone_updated = True
            new_phone = cleaned_phone

    if data.industry_niche is not None:
        user.industry_niche = data.industry_niche
    await db.commit()
    await db.refresh(user)

    if phone_updated and new_phone:
        import asyncio
        from services.baileys_service import send_master_notification

        welcome_msg = (
            f"🚀 *¡Hola {user.full_name or 'Emprendedor'}! Bienvenido a QSS (Quant Sales System).*\n\n"
            "Tu número de WhatsApp ha sido vinculado exitosamente con el **Autopiloto de Ads**.\n\n"
            "A partir de ahora, recibirás alertas automáticas y podrás operarlo directamente desde este chat.\n\n"
            "💡 *Puedes probar enviándome comandos como:*\n"
            "• _\"¿Cuál es el saldo de mis campañas?\"_\n"
            "• _\"Analiza el CTR de mis anuncios\"_"
        )
        asyncio.create_task(send_master_notification(new_phone, welcome_msg))

    return user

import uuid

@router.post("/me/telegram-link-token")
async def generate_telegram_link_token(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Generates a temporary token to link a Telegram account."""
    token = str(uuid.uuid4()).split('-')[0] # Short token
    user.telegram_link_token = token
    await db.commit()
    return {"token": token}

@router.delete("/me/telegram")
async def disconnect_telegram(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Disconnects the user's Telegram account."""
    user.telegram_chat_id = None
    user.telegram_link_token = None
    await db.commit()
    return {"status": "success"}


# ── Get own calendar events ─────────────────────────────────────────────────────

@router.get("/me/calendar/events")
async def get_my_calendar_events(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    from models import ClientPaymentConfig
    from encryption import decrypt_value
    from fastapi import HTTPException
    
    result = await db.execute(select(ClientPaymentConfig).where(ClientPaymentConfig.user_id == user.id))
    config = result.scalar_one_or_none()
    if not config or not config.provider_keys:
        return []
    
    refresh_token_enc = config.provider_keys.get("google_calendar_refresh_token")
    if not refresh_token_enc:
        return []
        
    try:
        refresh_token = decrypt_value(refresh_token_enc)
    except:
        return []
        
    import httpx
    import datetime
    from services.ai_tools import get_google_access_token
    
    access_token = await get_google_access_token(refresh_token)
    if not access_token:
        raise HTTPException(status_code=401, detail="No se pudo refrescar el token de Google Calendar")
        
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": now,
                "maxResults": 10,
                "singleEvents": "true",
                "orderBy": "startTime"
            }
        )
        if res.is_success:
            return res.json().get("items", [])
        else:
            raise HTTPException(status_code=res.status_code, detail="Error fetching calendar events")


# ── Get own campaigns from Google Ads API ─────────────────────────────────────


from fastapi import HTTPException
from services.google_ads_service import get_google_ads_client, fetch_campaign_metrics

@router.get("/me/campaigns")
async def get_my_campaigns(
    customer_id: str | None = None,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch campaigns and metrics from Google Ads API for the given customer_id,
    or default to the first available credential.
    """
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    creds = result.scalars().all()
    if not creds:
        return []
    
    if customer_id and (customer_id.startswith("Unknown") or customer_id.startswith("PENDING")):
        raise HTTPException(status_code=400, detail="Credenciales inválidas. Por favor desconecta y vuelve a conectar tu cuenta de Google Ads.")

    selected_cred = None
    if customer_id:
        for c in creds:
            try:
                target = decrypt_value(c.target_customer_id)
                if target == customer_id or target.replace("-", "") == customer_id.replace("-", ""):
                    selected_cred = c
                    break
            except:
                pass
    else:
        selected_cred = creds[0]

    if not selected_cred:
        raise HTTPException(status_code=404, detail="Customer ID not found in your connected accounts")

    try:
        refresh_token = decrypt_value(selected_cred.refresh_token)
        target = decrypt_value(selected_cred.target_customer_id)
        login = decrypt_value(selected_cred.login_customer_id)
        
        import asyncio
        client = get_google_ads_client(refresh_token, login)
        # Run the synchronous Google Ads gRPC call in a thread pool 
        # so it doesn't block the entire FastAPI event loop for 3-5 seconds.
        campaigns = await asyncio.to_thread(fetch_campaign_metrics, client, target)
        return campaigns
    except Exception as e:
        error_msg = str(e).lower()
        # Account not enabled or deactivated — return empty campaigns, not a 500
        if "not yet enabled" in error_msg or "deactivated" in error_msg:
            return []
        raise HTTPException(status_code=500, detail=f"Google Ads error: {type(e).__name__} - {str(e)}")

from schemas import GenerateCampaignCopyRequest, GenerateCampaignCopyResponse, FindCompetitorsRequest, FindCompetitorsResponse
from services.ai_service import generate_campaign_copy, find_competitors

@router.post("/me/campaigns/competitors", response_model=FindCompetitorsResponse)
async def auto_find_competitors(
    request: FindCompetitorsRequest,
    user: User = Depends(require_client),
):
    """
    Uses AI to scrape the provided URL and suggest 5 top competitors.
    """
    try:
        competitors = await find_competitors(request.url)
        return {"competitors": competitors}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/me/campaigns/generate", response_model=GenerateCampaignCopyResponse)
async def generate_my_campaign_copy(
    request: GenerateCampaignCopyRequest,
    user: User = Depends(require_client),
):
    """
    Generates optimized Google Ads campaign copy using Gemini AI.
    Does not interact with Google Ads API.
    """
    try:
        result = await generate_campaign_copy(
            url=request.url,
            competitors=request.competitors,
            campaign_type=request.campaign_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/me/credentials", status_code=204)
async def delete_my_credentials(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Allows a client to delete all their connected Google Ads accounts."""
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    creds = result.scalars().all()
    for c in creds:
        await db.delete(c)
    await db.commit()

@router.delete("/me/credentials/{credential_id}", status_code=204)
async def delete_single_credential(
    credential_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Allows a client to delete a specific connected Google Ads account by ID."""
    result = await db.execute(
        select(GoogleAdsCredential).where(
            GoogleAdsCredential.id == credential_id,
            GoogleAdsCredential.user_id == user.id
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    await db.delete(cred)
    await db.commit()


@router.post("/me/credentials/{credential_id}/pixel")
async def generate_tracking_pixel(
    credential_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Generates a Google Ads Conversion Action (Pixel) and returns the gtag snippet."""
    result = await db.execute(
        select(GoogleAdsCredential).where(
            GoogleAdsCredential.id == credential_id,
            GoogleAdsCredential.user_id == user.id
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    try:
        refresh_token = decrypt_value(cred.refresh_token)
        target = decrypt_value(cred.target_customer_id)
        login = decrypt_value(cred.login_customer_id)
        
        from services.google_ads_service import get_google_ads_client, create_conversion_action
        client = get_google_ads_client(refresh_token, login)
        
        # We run this in a thread since it's blocking
        import asyncio
        pixel_data = await asyncio.to_thread(
            create_conversion_action,
            client,
            target,
            "GMaker Lead Conversion"
        )
        return pixel_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me/credentials/{credential_id}/pixels")
async def list_tracking_pixels(
    credential_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Lists all active and hidden conversion actions (pixels) for a specific credential."""
    result = await db.execute(
        select(GoogleAdsCredential).where(
            GoogleAdsCredential.id == credential_id,
            GoogleAdsCredential.user_id == user.id
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    try:
        refresh_token = decrypt_value(cred.refresh_token)
        target = decrypt_value(cred.target_customer_id)
        login = decrypt_value(cred.login_customer_id)
        
        from services.google_ads_service import get_google_ads_client, fetch_conversion_actions
        client = get_google_ads_client(refresh_token, login)
        
        import asyncio
        pixels = await asyncio.to_thread(
            fetch_conversion_actions,
            client,
            target
        )
        return pixels
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/me/credentials/{credential_id}/pixels/{pixel_id}")
async def delete_tracking_pixel(
    credential_id: str,
    pixel_id: str,
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Removes a tracking pixel by setting its status to REMOVED."""
    result = await db.execute(
        select(GoogleAdsCredential).where(
            GoogleAdsCredential.id == credential_id,
            GoogleAdsCredential.user_id == user.id
        )
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    try:
        refresh_token = decrypt_value(cred.refresh_token)
        target = decrypt_value(cred.target_customer_id)
        login = decrypt_value(cred.login_customer_id)
        
        from services.google_ads_service import get_google_ads_client, remove_conversion_action
        client = get_google_ads_client(refresh_token, login)
        
        import asyncio
        success = await asyncio.to_thread(
            remove_conversion_action,
            client,
            target,
            pixel_id
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



# ── Get own credential status ───────────────────────────────────────────────


from models import GoogleAdsCredential, UserTier, get_plan_limit, get_ad_spend_limit
from schemas import CredentialsStatus, ConnectedAccount
from encryption import decrypt_value

@router.get("/me/credentials/status", response_model=CredentialsStatus)
async def get_my_credentials_status(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user.id)
    )
    creds = result.scalars().all()
    limit = get_plan_limit(user.tier)
    spend_limit = float(get_ad_spend_limit(user.tier))
    
    accounts = []
    for c in creds:
        try:
            target = decrypt_value(c.target_customer_id)
        except:
            target = "Unknown"
        accounts.append(ConnectedAccount(
            id=c.id,
            target_customer_id=target,
            is_verified=c.is_verified
        ))
        
    return CredentialsStatus(
        is_configured=len(accounts) > 0,
        connected_accounts=accounts,
        plan_limit=limit,
        ad_spend_limit=spend_limit,
        user_status=user.status.value if hasattr(user.status, 'value') else user.status
    )


