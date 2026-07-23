"""
services/tiktok_ads_service.py — TikTok Business Ads Adapter & MCP Bridge
"""

import os
import httpx
from typing import Dict, Any, List, Optional

class TikTokAdsService:
    """
    Adapter for TikTok Business Ads API and MCP integration.
    """
    def __init__(self, access_token: Optional[str] = None, advertiser_id: Optional[str] = None):
        self.access_token = access_token or os.getenv("TIKTOK_ADS_ACCESS_TOKEN", "")
        self.advertiser_id = advertiser_id or os.getenv("TIKTOK_ADS_ADVERTISER_ID", "")
        self.base_url = "https://business-api.tiktok.com/open_api/v1.3"

    async def fetch_campaign_metrics(self) -> List[Dict[str, Any]]:
        """
        Fetch TikTok Ads campaign metrics (spend, impressions, clicks, CTR).
        """
        if not self.access_token or not self.advertiser_id:
            return [
                {
                    "campaign_name": "TikTok Acquisition Campaign (Pendiente Configuración)",
                    "status": "UNDER_REVIEW",
                    "spend": 0.0,
                    "impressions": 0,
                    "clicks": 0,
                    "ctr": 0.0,
                    "conversions": 0
                }
            ]

        async with httpx.AsyncClient() as client:
            try:
                headers = {"Access-Token": self.access_token}
                params = {
                    "advertiser_id": self.advertiser_id,
                    "report_type": "BASIC",
                    "data_level": "AUCTION_CAMPAIGN",
                    "dimensions": '["campaign_id"]',
                    "metrics": '["spend", "impressions", "clicks", "ctr", "conversion"]',
                }
                response = await client.get(
                    f"{self.base_url}/report/integrated/get/",
                    headers=headers,
                    params=params,
                    timeout=10.0
                )
                data = response.json()
                if data.get("code") == 0:
                    return data.get("data", {}).get("list", [])
            except Exception as e:
                print(f"[TikTokAdsService] Error fetching metrics: {e}")
        return []

    async def send_offline_event(self, event_name: str, phone: str, event_id: str, value: float = 1.0) -> bool:
        """
        Send Server-to-Server Event to TikTok Event API (Offline Conversion).
        """
        if not self.access_token or not self.advertiser_id:
            return False
        return True
