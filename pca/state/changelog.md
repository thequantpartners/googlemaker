# Changelog

## 2026-06-17
- Initialized PCA context environment.
- Configured project as a Monorepo, integrating `dashboard`, `backend`, and `ads-orchestrator`.
- Connected project to GitHub repository (`thequantpartners/googlemaker.git`).
## 2026-06-18
- Migrated backend from SQLite to PostgreSQL hosted on Railway to guarantee data persistence.
- Implemented three-tier pricing model (Basic, Scale, Growth) replacing the free tier.
- Designed Paywall UI in the Next.js dashboard.
- Modified Google OAuth flow to allow connecting multiple Google Ads accounts per user based on plan limits.
- Updated Superadmin dashboard to manage the new pricing tiers.
- Injected SQL migration logic on application startup to fix invalid enum states.
- Fixed root `.gitignore` to allow tracking of Next.js route folders named `logs`.
- Integrated Dashboard "Historial del Orquestador" (`/dashboard/logs`) with Backend API.
- Integrated "Mis Campañas" (`/dashboard/campaigns`) module using the official `google-ads` Python client and GAQL to display real metrics (Cost, Clicks, CPA, Conversions).
- Fixed Railway build issue by pinning Python version to 3.11 in `backend/.python-version` to maintain `passlib` compatibility.
- Fixed UI edge case where suspended users could still access the connection button by forcing a full Suspended view when the backend returns 403 Forbidden.
- Fixed 500 Internal Server Error when normal users connect Google Ads: corrected env var names (`GOOGLE_ADS_CLIENT_ID`/`GOOGLE_ADS_CLIENT_SECRET`) in `google_ads_service.py`, upgraded `google-ads` library from v25 to v31 to resolve `501 GRPC target method can't be resolved` due to sunset API versions, added `fetch_accessible_customers` to auto-detect customer IDs on OAuth callback, and handled deactivated/not-enabled accounts gracefully.
