# Active Decisions

- **Architecture**: Adopted a Monorepo structure to simplify version control and deployment pipelines.
- **Backend Hosting**: Selected Railway's $5/mo plan to avoid cold starts and ensure high availability for the Python API.
- **Frontend Hosting**: Vercel selected for the Next.js dashboard due to optimized global edge performance.
- **Database Engine**: Transitioned to PostgreSQL on Railway to guarantee data persistence, replacing ephemeral SQLite.
- **Business Model / Pricing**: Adopted a 3-tier structure (Basic, Scale, Growth). Removed the free tier to monetize immediately.
- **Credential Architecture**: A single user account can now hold multiple distinct Google Ads credentials (Customer IDs), restricted by their subscription tier (1, 3, or Unlimited).
- **Python Constraints**: Pinned backend Python version to 3.11 for Railway deployments to retain the `crypt` module required by `passlib`.
- **Google Ads API Versioning**: `google-ads` library must be kept at v31+ to avoid `501 GRPC` errors from sunset API versions. Env vars for OAuth in `google_ads_service.py` must use `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` (matching `auth_google.py`).
