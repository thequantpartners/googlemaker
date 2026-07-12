import httpx
import json
from datetime import datetime, timedelta, timezone

# ─────────────────────────────────────────────────────────────────────────────
# Core API Functions
# ─────────────────────────────────────────────────────────────────────────────

async def get_cal_availability(cal_api_key: str, cal_booking_link: str, date_from: str, date_to: str) -> str:
    """
    Fetch availability from Cal.com API.
    """
    # Handle both public booking links (cal.com/username/slug) 
    # and admin dashboard links (app.cal.com/event-types/123456)
    link = cal_booking_link.replace("https://", "").replace("http://", "").strip("/")
    
    event_type_id = None
    
    if "app.cal.com/event-types/" in link:
        # User provided the internal admin link, which directly contains the eventTypeId!
        try:
            event_type_id = int(link.split("app.cal.com/event-types/")[1].split("/")[0])
        except ValueError:
            return json.dumps({"error": "Link de app.cal.com inválido. No se pudo extraer el ID del evento."})
    else:
        # Parse public link cal.com/username/slug
        parts = link.split("/")
        if len(parts) < 3 or parts[0] != "cal.com":
            return json.dumps({"error": "Link inválido. Debe ser cal.com/username/event o app.cal.com/event-types/ID"})
        
        username = parts[1]
        event_slug = parts[2]
        
        async with httpx.AsyncClient() as client:
            users_url = f"https://api.cal.com/v1/users/{username}?apiKey={cal_api_key}"
            user_res = await client.get(users_url)
            if not user_res.is_success:
                return json.dumps({"error": "No se pudo obtener el usuario de Cal.com. Verifica el token."})
            
            user_data = user_res.json()
            user_id = user_data.get("user", {}).get("id")
            if not user_id:
                return json.dumps({"error": "Usuario de Cal.com no encontrado."})

            events_url = f"https://api.cal.com/v1/event-types?userId={user_id}&apiKey={cal_api_key}"
            events_res = await client.get(events_url)
            if events_res.is_success:
                events = events_res.json().get("event_types", [])
                for ev in events:
                    if ev.get("slug") == event_slug:
                        event_type_id = ev.get("id")
                        break
                        
            if not event_type_id:
                return json.dumps({"error": f"No se encontró el evento '{event_slug}' para el usuario."})

    async with httpx.AsyncClient() as client:

        # Step 2: Fetch slots
        slots_url = f"https://api.cal.com/v1/slots?eventTypeId={event_type_id}&startTime={date_from}&endTime={date_to}&apiKey={cal_api_key}"
        slots_res = await client.get(slots_url)
        if slots_res.is_success:
            return json.dumps(slots_res.json())
        else:
            return json.dumps({"error": f"Error obteniendo slots: {slots_res.text}"})

async def book_cal_meeting(cal_api_key: str, cal_booking_link: str, start_time: str, name: str, email: str, timezone_str: str = "America/Lima") -> str:
    """
    Book a meeting via Cal.com API.
    """
    link = cal_booking_link.replace("https://", "").replace("http://", "").strip("/")
    event_type_id = None
    
    if "app.cal.com/event-types/" in link:
        try:
            event_type_id = int(link.split("app.cal.com/event-types/")[1].split("/")[0])
        except ValueError:
            return json.dumps({"error": "Link de app.cal.com inválido."})
    else:
        parts = link.split("/")
        if len(parts) < 3 or parts[0] != "cal.com":
            return json.dumps({"error": "cal_booking_link inválido."})
        
        username = parts[1]
        event_slug = parts[2]
        
        async with httpx.AsyncClient() as client:
            users_url = f"https://api.cal.com/v1/users/{username}?apiKey={cal_api_key}"
            user_res = await client.get(users_url)
            if not user_res.is_success:
                return json.dumps({"error": "No se pudo autenticar con Cal.com."})
            user_id = user_res.json().get("user", {}).get("id")
            
            events_url = f"https://api.cal.com/v1/event-types?userId={user_id}&apiKey={cal_api_key}"
            events_res = await client.get(events_url)
            if events_res.is_success:
                for ev in events_res.json().get("event_types", []):
                    if ev.get("slug") == event_slug:
                        event_type_id = ev.get("id")
                        break
            if not event_type_id:
                return json.dumps({"error": "Evento no encontrado."})

    async with httpx.AsyncClient() as client:

        # Book
        payload = {
            "eventTypeId": event_type_id,
            "start": start_time,
            "responses": {
                "name": name,
                "email": email,
                "location": {"value": "inPerson", "optionValue": ""}
            },
            "timeZone": timezone_str,
            "language": "es",
            "metadata": {}
        }
        book_url = f"https://api.cal.com/v1/bookings?apiKey={cal_api_key}"
        book_res = await client.post(book_url, json=payload)
        
        if book_res.is_success:
            data = book_res.json()
            return json.dumps({
                "success": True, 
                "message": "Reunión agendada exitosamente.", 
                "booking_uid": data.get("booking", {}).get("uid")
            })
        else:
            return json.dumps({"error": f"Fallo al agendar: {book_res.text}"})

import os

async def get_google_access_token(refresh_token: str) -> str | None:
    client_id = os.getenv("GOOGLE_ADS_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_ADS_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        if res.is_success:
            return res.json().get("access_token")
    return None

async def get_gcal_availability(refresh_token: str, date_from: str, date_to: str) -> str:
    access_token = await get_google_access_token(refresh_token)
    if not access_token:
        return json.dumps({"error": "No se pudo obtener el access token de Google Calendar."})

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://www.googleapis.com/calendar/v3/freeBusy",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json={
                "timeMin": date_from,
                "timeMax": date_to,
                "items": [{"id": "primary"}]
            }
        )
        if res.is_success:
            data = res.json()
            busy_slots = data.get("calendars", {}).get("primary", {}).get("busy", [])
            # For simplicity we return the busy slots, the LLM will infer availability
            # In a real app we'd invert this to free slots between 9am and 5pm.
            return json.dumps({"busy_slots": busy_slots, "message": "Los slots devueltos indican horas OCUPADAS. Debes agendar en un horario que NO esté en esta lista (asumiendo horario de oficina 9am a 6pm)."})
        return json.dumps({"error": f"Error de Google Calendar: {res.text}"})

async def book_gcal_meeting(refresh_token: str, start_time: str, name: str, email: str, timezone_str: str = "America/Lima") -> str:
    access_token = await get_google_access_token(refresh_token)
    if not access_token:
        return json.dumps({"error": "No se pudo obtener el access token de Google Calendar."})

    # Calculate end time (30 mins default)
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    end_dt = start_dt + timedelta(minutes=30)

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json={
                "summary": f"Reunión con {name}",
                "description": f"Agendado vía IA para {name} ({email})",
                "start": {"dateTime": start_dt.isoformat(), "timeZone": timezone_str},
                "end": {"dateTime": end_dt.isoformat(), "timeZone": timezone_str},
                "attendees": [{"email": email}],
                "reminders": {"useDefault": True}
            }
        )
        if res.is_success:
            return json.dumps({"success": True, "message": "Reunión agendada exitosamente en Google Calendar."})
        return json.dumps({"error": f"Error al agendar en Google Calendar: {res.text}"})

# ─────────────────────────────────────────────────────────────────────────────
# Tool Router
# ─────────────────────────────────────────────────────────────────────────────

async def execute_tool_call(tool_name: str, arguments: dict, cal_api_key: str, cal_booking_link: str, google_calendar_refresh_token: str = None) -> str:
    if tool_name == "get_availability":
        if google_calendar_refresh_token:
            return await get_gcal_availability(
                google_calendar_refresh_token,
                arguments.get("date_from"),
                arguments.get("date_to")
            )
        else:
            return await get_cal_availability(
                cal_api_key, 
                cal_booking_link, 
                arguments.get("date_from"), 
                arguments.get("date_to")
            )
    elif tool_name == "book_meeting":
        if google_calendar_refresh_token:
            return await book_gcal_meeting(
                google_calendar_refresh_token,
                arguments.get("start_time"),
                arguments.get("name", "Cliente"),
                arguments.get("email", "cliente@example.com"),
                arguments.get("timezone", "America/Lima")
            )
        else:
            return await book_cal_meeting(
                cal_api_key, 
                cal_booking_link, 
                arguments.get("start_time"), 
                arguments.get("name", "Cliente"), 
                arguments.get("email", "cliente@example.com"),
                arguments.get("timezone", "America/Lima")
            )
    return json.dumps({"error": f"Tool '{tool_name}' no existe."})

# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

TOOLS_DEF = [
    {
        "name": "get_availability",
        "description": "Obtiene los horarios disponibles en el calendario para agendar una reunión. Se requiere un rango de fechas ISO 8601.",
        "parameters": {
            "type": "object",
            "properties": {
                "date_from": {
                    "type": "string",
                    "description": "Fecha y hora de inicio en formato ISO 8601 (ej. 2026-07-04T00:00:00Z)"
                },
                "date_to": {
                    "type": "string",
                    "description": "Fecha y hora de fin en formato ISO 8601 (ej. 2026-07-10T23:59:59Z)"
                }
            },
            "required": ["date_from", "date_to"]
        }
    },
    {
        "name": "book_meeting",
        "description": "Agenda definitivamente la reunión en el horario elegido por el cliente.",
        "parameters": {
            "type": "object",
            "properties": {
                "start_time": {
                    "type": "string",
                    "description": "Fecha y hora de la reunión en formato ISO 8601 (ej. 2026-07-05T15:00:00Z)"
                },
                "name": {
                    "type": "string",
                    "description": "Nombre del cliente (si no lo sabes, pregúntale antes de agendar)."
                },
                "email": {
                    "type": "string",
                    "description": "Correo electrónico del cliente (si no lo sabes, pídelo o usa cliente@qss.com como fallback temporal)."
                },
                "timezone": {
                    "type": "string",
                    "description": "Zona horaria del cliente, por defecto America/Lima."
                }
            },
            "required": ["start_time", "name", "email"]
        }
    }
]

def get_openai_tools():
    return [{"type": "function", "function": tool} for tool in TOOLS_DEF]

def get_anthropic_tools():
    anthropic_tools = []
    for tool in TOOLS_DEF:
        anthropic_tools.append({
            "name": tool["name"],
            "description": tool["description"],
            "input_schema": tool["parameters"]
        })
    return anthropic_tools

def get_gemini_tools():
    return [{"function_declarations": TOOLS_DEF}]
