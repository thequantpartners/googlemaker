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
- Implemented Hybrid Autopilot for Google Ads: Added Learning Phase protection heuristic, automated budget protection (PAUSE), manual pending UI for scaling (SCALE), and an automatic background CRON endpoint.
- Updated branding across dashboard layouts to use 'GoogleMaker' and 'G' icon instead of 'Mi Agencia'.
- Fixed 500 error on /clients/me/logs caused by PostgreSQL missing `status` and `is_dry_run` columns from Hybrid Autopilot update. Added auto-migration SQL in main.py.
- Fixed Vercel CORS blocking on backend by changing allow_origins to allow_origin_regex to accept all Vercel preview domains (`https://googlemaker-.*\.vercel\.app`).
-   F i x e d   G o o g l e   O A u t h   r e d i r e c t _ u r i   m a t c h i n g   a n d   C O R S   o r i g i n   i s s u e s   f o r   c u s t o m   d o m a i n   ( g o o g l e m a k e r . t h e q u a n t p a r t n e r s . c o m ) .  
 -   A d d e d   P l a n e s   ( / d a s h b o a r d / p l a n e s )   a n d   C o n f i g u r a c i o n   ( / d a s h b o a r d / c o n f i g u r a c i o n )   s e c t i o n s   t o   c l i e n t   d a s h b o a r d .  
 -   A d d e d   i n d i v i d u a l   G o o g l e   A d s   a c c o u n t   d e l e t i o n   e n d p o i n t   a n d   u p d a t e d   D a s h b o a r d   t o   s u p p o r t   d e l e t i n g   a c c o u n t s   o n e   b y   o n e .  
- Integrated Lemon Squeezy payment gateway with backend `/payments/create-checkout-session` and `/payments/webhook` for secure subscriptions. Removed old mock tier update endpoint.
- Migrated Landing Page and Dashboard UI to a premium dark-mode aesthetic using Tailwind CSS v3 and Recharts, recreating the Nano Banana/v0.dev reference designs while preserving backend logic.