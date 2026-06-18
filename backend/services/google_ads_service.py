"""
services/google_ads_service.py
"""
import os
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

def get_google_ads_client(refresh_token: str, login_customer_id: str) -> GoogleAdsClient:
    """
    Initialize and return a GoogleAdsClient using credentials from DB/Env.
    """
    credentials = {
        "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
        "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
        "refresh_token": refresh_token,
        "login_customer_id": login_customer_id.replace("-", ""),
        "use_proto_plus": True
    }
    return GoogleAdsClient.load_from_dict(credentials)

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
