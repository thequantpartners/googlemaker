"""
services/google_ads_service.py
"""
import os
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.api_core import protobuf_helpers

def get_google_ads_client(refresh_token: str, login_customer_id: str) -> GoogleAdsClient:
    """
    Initialize and return a GoogleAdsClient using credentials from DB/Env.
    """
    credentials = {
        "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
        "client_id": os.getenv("GOOGLE_ADS_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_ADS_CLIENT_SECRET", ""),
        "refresh_token": refresh_token,
        "use_proto_plus": True
    }
    if login_customer_id:
        credentials["login_customer_id"] = login_customer_id.replace("-", "")
        
    return GoogleAdsClient.load_from_dict(credentials)

def fetch_accessible_customers(refresh_token: str) -> list[dict]:
    """
    Fetch accessible customers for a given refresh token.
    Returns a list of dicts containing login_customer_id and target_customer_id
    to properly handle MCC (Manager) accounts.
    """
    credentials = {
        "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
        "client_id": os.getenv("GOOGLE_ADS_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_ADS_CLIENT_SECRET", ""),
        "refresh_token": refresh_token,
        "use_proto_plus": True
    }
    client = GoogleAdsClient.load_from_dict(credentials)
    customer_service = client.get_service("CustomerService")
    response = customer_service.list_accessible_customers()
    accessible_ids = [resource_name.split("/")[-1] for resource_name in response.resource_names]
    
    valid_accounts = []
    
    for login_id in accessible_ids:
        try:
            creds_with_login = credentials.copy()
            creds_with_login["login_customer_id"] = login_id
            client_with_login = GoogleAdsClient.load_from_dict(creds_with_login)
            ga_service = client_with_login.get_service("GoogleAdsService")
            
            # Query all linked clients (this includes the manager itself if it's in the hierarchy)
            query = """
                SELECT customer_client.id, customer_client.manager 
                FROM customer_client 
                WHERE customer_client.status = 'ENABLED'
            """
            search_response = ga_service.search(customer_id=login_id, query=query)
            for row in search_response:
                # We only want leaf accounts (non-managers) to fetch metrics
                if not row.customer_client.manager:
                    valid_accounts.append({
                        "login_customer_id": login_id,
                        "target_customer_id": str(row.customer_client.id)
                    })
        except Exception as e:
            print(f"Failed to query hierarchy for {login_id}: {e}")
            # Fallback: just add the accessible_id itself if we can't query hierarchy
            valid_accounts.append({
                "login_customer_id": login_id,
                "target_customer_id": login_id
            })
            
    # Remove duplicates based on target_customer_id to avoid creating duplicate credentials
    seen_targets = set()
    unique_accounts = []
    for acc in valid_accounts:
        if acc["target_customer_id"] not in seen_targets:
            seen_targets.add(acc["target_customer_id"])
            unique_accounts.append(acc)
            
    return unique_accounts

def fetch_campaign_metrics(client: GoogleAdsClient, target_customer_id: str) -> list[dict]:
    """
    Fetch aggregated campaign metrics for the last 30 days.
    """
    ga_service = client.get_service("GoogleAdsService")
    
    query = """
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """
    
    try:
        customer_id_clean = target_customer_id.replace("-", "")
        response = ga_service.search(customer_id=customer_id_clean, query=query)
        
        campaigns = []
        for row in response:
            campaigns.append({
                "campaign_id": str(row.campaign.id),
                "campaign_name": row.campaign.name,
                "status": row.campaign.status.name,
                "impressions": int(row.metrics.impressions),
                "clicks": int(row.metrics.clicks),
                "cost": float(row.metrics.cost_micros / 1_000_000.0),
                "conversions": float(row.metrics.conversions)
            })
            
        return campaigns
    except GoogleAdsException as ex:
        print(f"GoogleAdsException: {ex}")
        for error in ex.failure.errors:
            print(f"Error: {error.message}")
        raise ValueError(f"Failed to fetch campaigns: {ex.failure.errors[0].message if ex.failure.errors else str(ex)}")




# ── Conversion Tracking ──────────────────────────────────────────────────────

def create_conversion_action(client: GoogleAdsClient, customer_id: str, name: str = "GMaker Conversion") -> dict:
    """
    Creates a WEBPAGE conversion action and fetches the global tag and event snippet.
    Returns a dict with 'snippet' and 'event_snippet'.
    """
    customer_id_clean = customer_id.replace("-", "")
    
    # 1. Create Conversion Action
    conversion_action_service = client.get_service("ConversionActionService")
    conversion_action_operation = client.get_type("ConversionActionOperation")
    
    conversion_action = conversion_action_operation.create
    conversion_action.name = f"{name} ({uuid.uuid4().hex[:4]})"
    conversion_action.type_ = client.enums.ConversionActionTypeEnum.WEBPAGE
    conversion_action.status = client.enums.ConversionActionStatusEnum.ENABLED
    conversion_action.category = client.enums.ConversionActionCategoryEnum.DEFAULT
    
    conversion_action.value_settings.default_value = 1.0
    conversion_action.value_settings.always_use_default_value = True

    try:
        response = conversion_action_service.mutate_conversion_actions(
            customer_id=customer_id_clean, operations=[conversion_action_operation]
        )
        resource_name = response.results[0].resource_name
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error creando conversión: {'; '.join(errors)}")
        
    # 2. Fetch the Snippets via GAQL
    ga_service = client.get_service("GoogleAdsService")
    query = f"""
        SELECT
            conversion_action.id,
            conversion_action.tag_snippets
        FROM conversion_action
        WHERE conversion_action.resource_name = '{resource_name}'
    """
    
    try:
        search_response = ga_service.search(customer_id=customer_id_clean, query=query)
        for row in search_response:
            snippets = row.conversion_action.tag_snippets
            if snippets:
                # The snippets list typically contains the global tag and the event tag
                return {
                    "global_site_tag": snippets[0].global_site_tag,
                    "event_snippet": snippets[0].event_snippet,
                    "conversion_action_id": row.conversion_action.id
                }
        return {"error": "Snippet not generated"}
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error obteniendo snippet: {'; '.join(errors)}")

def fetch_conversion_actions(client: GoogleAdsClient, customer_id: str) -> list[dict]:
    """Fetches all enabled or hidden conversion actions."""
    customer_id_clean = customer_id.replace("-", "")
    ga_service = client.get_service("GoogleAdsService")
    query = """
        SELECT
            conversion_action.id,
            conversion_action.name,
            conversion_action.status,
            conversion_action.category,
            conversion_action.type,
            conversion_action.tag_snippets
        FROM conversion_action
        WHERE conversion_action.status IN ('ENABLED', 'HIDDEN')
    """
    
    try:
        # First query: fetch campaigns with recent conversions
        campaigns_query = """
            SELECT
                campaign.name,
                segments.conversion_action
            FROM campaign
            WHERE segments.date DURING LAST_30_DAYS AND metrics.conversions > 0
        """
        active_campaigns_map = {}
        try:
            campaigns_response = ga_service.search(customer_id=customer_id_clean, query=campaigns_query)
            for row in campaigns_response:
                action_rn = row.segments.conversion_action
                if action_rn:
                    action_id = action_rn.split("/")[-1]
                    if action_id not in active_campaigns_map:
                        active_campaigns_map[action_id] = set()
                    active_campaigns_map[action_id].add(row.campaign.name)
        except GoogleAdsException:
            # If the account has no metrics or segments error, we just silently continue
            pass

        results = []
        search_response = ga_service.search(customer_id=customer_id_clean, query=query)
        for row in search_response:
            ca = row.conversion_action
            snippet = None
            if ca.tag_snippets:
                # Store the full HTML block
                snippet = f"<!-- Google tag (gtag.js) -->\n{ca.tag_snippets[0].global_site_tag}\n\n<!-- Event snippet -->\n{ca.tag_snippets[0].event_snippet}"
                
            active_camps = list(active_campaigns_map.get(str(ca.id), []))
            
            results.append({
                "id": ca.id,
                "name": ca.name,
                "status": ca.status.name,
                "category": ca.category.name,
                "type": ca.type_.name,
                "snippet": snippet,
                "active_campaigns": active_camps
            })
        return results
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error fetching conversions: {'; '.join(errors)}")

def remove_conversion_action(client: GoogleAdsClient, customer_id: str, conversion_action_id: str) -> bool:
    """Sets a conversion action status to REMOVED."""
    customer_id_clean = customer_id.replace("-", "")
    conversion_action_service = client.get_service("ConversionActionService")
    conversion_action_operation = client.get_type("ConversionActionOperation")
    
    conversion_action = conversion_action_operation.update
    conversion_action.resource_name = conversion_action_service.conversion_action_path(
        customer_id_clean, conversion_action_id
    )
    conversion_action.status = client.enums.ConversionActionStatusEnum.REMOVED
    
    # We must construct a field mask so the API knows what to update
    client.copy_from(
        conversion_action_operation.update_mask,
        protobuf_helpers.field_mask(None, conversion_action._pb),
    )
    
    try:
        conversion_action_service.mutate_conversion_actions(
            customer_id=customer_id_clean, operations=[conversion_action_operation]
        )
        return True
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error removing conversion: {'; '.join(errors)}")

def create_offline_conversion_action(client: GoogleAdsClient, customer_id: str, name: str = "QSS Offline Conversion") -> str:
    """
    Creates an offline conversion action (Import from Clicks).
    Returns the conversion action resource name.
    """
    customer_id_clean = customer_id.replace("-", "")
    
    conversion_action_service = client.get_service("ConversionActionService")
    conversion_action_operation = client.get_type("ConversionActionOperation")
    
    conversion_action = conversion_action_operation.create
    conversion_action.name = f"{name} ({uuid.uuid4().hex[:4]})"
    conversion_action.type_ = client.enums.ConversionActionTypeEnum.UPLOAD_CLICKS
    conversion_action.status = client.enums.ConversionActionStatusEnum.ENABLED
    conversion_action.category = client.enums.ConversionActionCategoryEnum.LEAD
    
    conversion_action.value_settings.default_value = 1.0
    conversion_action.value_settings.always_use_default_value = True

    try:
        response = conversion_action_service.mutate_conversion_actions(
            customer_id=customer_id_clean, operations=[conversion_action_operation]
        )
        return response.results[0].resource_name
    except GoogleAdsException as ex:
        errors = [error.message for error in ex.failure.errors]
        raise ValueError(f"Error creando conversión offline: {'; '.join(errors)}")

def upload_offline_conversion(client: GoogleAdsClient, customer_id: str, conversion_action_resource_name: str, gclid: str, conversion_time: str, conversion_value: float = 1.0) -> bool:
    """
    Uploads an offline conversion using GCLID.
    conversion_time format: yyyy-mm-dd hh:mm:ss+|-hh:mm
    """
    customer_id_clean = customer_id.replace("-", "")
    conversion_upload_service = client.get_service("ConversionUploadService")
    
    click_conversion = client.get_type("ClickConversion")
    click_conversion.conversion_action = conversion_action_resource_name
    click_conversion.gclid = gclid
    click_conversion.conversion_date_time = conversion_time
    click_conversion.conversion_value = conversion_value
    click_conversion.currency_code = "PEN"
    
    request = client.get_type("UploadClickConversionsRequest")
    request.customer_id = customer_id_clean
    request.conversions.append(click_conversion)
    request.partial_failure = True
    
    try:
        response = conversion_upload_service.upload_click_conversions(request=request)
        if response.partial_failure_error.message:
            print(f"Partial failure uploading conversion: {response.partial_failure_error.message}")
            return False
        return True
    except GoogleAdsException as ex:
        print(f"Failed to upload conversion: {ex}")
        return False

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def trigger_offline_conversion(db: AsyncSession, user_id: str, gclid: str, amount: float = 1.0):
    """
    Asynchronously finds credentials, fetches/creates the Offline Conversion action,
    and uploads the click conversion.
    Safe to use as a background task.
    """
    try:
        from models import GoogleAdsCredential
        from encryption import decrypt_value
        from datetime import datetime
        import pytz

        # 1. Fetch credentials
        result = await db.execute(select(GoogleAdsCredential).where(GoogleAdsCredential.user_id == user_id))
        creds = result.scalars().all()
        if not creds:
            print(f"[trigger_offline_conversion] No Google Ads creds for user {user_id}")
            return

        cred = creds[0] # Pick the first one (or we could loop if multiple, but usually 1 per user)
        
        refresh_token = decrypt_value(cred.refresh_token)
        login_id = decrypt_value(cred.login_customer_id)
        target_id = decrypt_value(cred.target_customer_id)
        
        # 2. Init client
        client = await asyncio.to_thread(get_google_ads_client, refresh_token, login_id)
        
        # 3. Find or Create Conversion Action
        actions = await asyncio.to_thread(fetch_conversion_actions, client, target_id)
        
        action_rn = None
        for action in actions:
            if action["name"] == "QSS Offline Conversion" and action["type"] == "UPLOAD_CLICKS":
                # GAQL returns id, we need resource name
                customer_id_clean = target_id.replace("-", "")
                action_rn = f"customers/{customer_id_clean}/conversionActions/{action['id']}"
                break
                
        if not action_rn:
            action_rn = await asyncio.to_thread(create_offline_conversion_action, client, target_id, "QSS Offline Conversion")
            
        # 4. Upload Conversion
        # Format time: yyyy-mm-dd hh:mm:ss+|-hh:mm. We use current time in Lima/UTC
        lima_tz = pytz.timezone("America/Lima")
        now = datetime.now(lima_tz)
        conversion_time = now.strftime('%Y-%m-%d %H:%M:%S%z')
        # Insert a colon in timezone offset to match required format (e.g., -05:00)
        conversion_time = conversion_time[:-2] + ':' + conversion_time[-2:]
        
        success = await asyncio.to_thread(
            upload_offline_conversion,
            client,
            target_id,
            action_rn,
            gclid,
            conversion_time,
            float(amount)
        )
        
        if success:
            print(f"[trigger_offline_conversion] Success for user {user_id}, gclid {gclid[:8]}...")
        else:
            print(f"[trigger_offline_conversion] Failed for user {user_id}")
            
    except Exception as e:
        print(f"[trigger_offline_conversion] Error: {str(e)}")


