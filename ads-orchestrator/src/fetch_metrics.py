from src.google_ads_client import get_google_ads_client, get_target_customer_id

def get_campaign_metrics(client=None, customer_id: str = None) -> list[dict]:
    """
    Obtiene las métricas principales de todas las campañas activas.
    Retorna una lista de diccionarios con la información de rendimiento (CPA, Gasto, Conversiones).

    Args:
        client: Optional pre-built GoogleAdsClient instance (multi-tenant).
        customer_id: Optional target customer ID string (multi-tenant).
            If either is None, they are obtained from the default .env-based helpers.
    """
    if client is None:
        client = get_google_ads_client()
    if customer_id is None:
        customer_id = get_target_customer_id()
    
    if not customer_id:
        return []

    ga_service = client.get_service("GoogleAdsService")

    query = """
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            metrics.cost_micros,
            metrics.conversions,
            metrics.clicks,
            metrics.impressions
        FROM campaign
        WHERE campaign.status = 'ENABLED'
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
    """

    request = client.get_type("SearchGoogleAdsRequest")
    request.customer_id = customer_id
    request.query = query

    try:
        response = ga_service.search(request=request)
        
        results = []
        for row in response:
            cost = row.metrics.cost_micros / 1_000_000
            conversions = row.metrics.conversions
            cpa = cost / conversions if conversions > 0 else 0.0
            
            results.append({
                "campaign_id": row.campaign.id,
                "campaign_name": row.campaign.name,
                "cost": round(cost, 2),
                "conversions": round(conversions, 2),
                "cpa": round(cpa, 2),
                "clicks": row.metrics.clicks,
                "impressions": row.metrics.impressions
            })
            
        return results
    except Exception as e:
        print(f"Error fetching campaign metrics: {e}")
        return []
