"""
routers/metrics.py — QSS Dashboard metrics endpoint.

GET /api/dashboard/metrics
  Returns:
    - ad_spend      : total Google Ads spend across all connected accounts
    - total_leads   : leads captured by the widget
    - paid counts   : consultation_paid, full_case_paid
    - lead_sources  : breakdown by utm_source / gclid
"""

from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import require_client
from database import get_db
from models import GoogleAdsCredential, Lead, User
from schemas import DashboardMetrics, LeadSourceStat

router = APIRouter(prefix="/api/dashboard", tags=["Metrics"])


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    user: User = Depends(require_client),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate KPIs for the QSS dashboard: ad spend, leads, payments, sources."""

    # ── 1. Total Ad Spend from Google Ads ────────────────────────────────────
    ad_spend = 0.0
    try:
        cred_result = await db.execute(
            select(GoogleAdsCredential).where(
                GoogleAdsCredential.user_id == user.id,
                GoogleAdsCredential.is_verified == True,
            )
        )
        credentials = cred_result.scalars().all()

        if credentials:
            from encryption import decrypt_value
            from services.google_ads_service import (
                fetch_campaign_metrics,
                get_google_ads_client,
            )

            for cred in credentials:
                try:
                    refresh_token = decrypt_value(cred.refresh_token)
                    login_id = decrypt_value(cred.login_customer_id)
                    target_id = decrypt_value(cred.target_customer_id)

                    if target_id in ("Unknown", "PENDING") or not target_id:
                        continue

                    ads_client = get_google_ads_client(refresh_token, login_id)
                    campaigns = await fetch_campaign_metrics(ads_client, target_id)
                    for camp in campaigns:
                        ad_spend += camp.get("cost", 0.0)
                except Exception as exc:
                    print(f"[metrics] Skipping credential {cred.id}: {exc}")
    except Exception as exc:
        print(f"[metrics] Google Ads fetch error: {exc}")

    # ── 2. Lead counts ───────────────────────────────────────────────────────
    lead_result = await db.execute(
        select(Lead).where(Lead.client_id == user.id)
    )
    leads = lead_result.scalars().all()

    total_leads = len(leads)
    consultation_paid_count = sum(1 for l in leads if l.consultation_paid)
    full_case_paid_count = sum(1 for l in leads if l.full_case_paid)
    
    total_revenue = sum((l.consultation_amount or 0.0) for l in leads if l.consultation_paid)
    total_revenue += sum((l.full_case_amount or 0.0) for l in leads if l.full_case_paid)

    # ── 3. Lead source breakdown ─────────────────────────────────────────────
    source_counter: Counter[str] = Counter()
    for lead in leads:
        if lead.gclid:
            source_counter["google_ads (gclid)"] += 1
        elif lead.utm_source:
            source_counter[lead.utm_source] += 1
        else:
            source_counter["direct / unknown"] += 1

    lead_sources = [
        LeadSourceStat(source=src, count=cnt)
        for src, cnt in source_counter.most_common(10)
    ]

    return DashboardMetrics(
        ad_spend=round(ad_spend, 2),
        total_leads_tracked=total_leads,
        consultation_paid_count=consultation_paid_count,
        full_case_paid_count=full_case_paid_count,
        total_revenue=round(total_revenue, 2),
        lead_sources=lead_sources,
    )
