# Active Decisions

- **Architecture**: Adopted a Monorepo structure to simplify version control and deployment pipelines.
- **Backend Hosting**: Selected Railway's $5/mo plan to avoid cold starts and ensure high availability for the Python API.
- **Frontend Hosting**: Vercel selected for the Next.js dashboard due to optimized global edge performance.
- **Database Engine**: Transitioned to PostgreSQL on Railway to guarantee data persistence, replacing ephemeral SQLite.
- **Business Model / Pricing**: Adopted a 3-tier structure (Basic, Scale, Growth). Removed the free tier to monetize immediately.
- **Credential Architecture**: A single user account can now hold multiple distinct Google Ads credentials (Customer IDs), restricted by their subscription tier (1, 3, or Unlimited).
