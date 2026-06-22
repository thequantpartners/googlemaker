# Roadmap

## In Process

- [Define upcoming work]

## Pending

- [Define upcoming work]

## Done

- [x] Execute Autopilot Pivot Implementation Plan (Ad Spend pricing, Soft Pause logic, Immigration Lawyer Templates).
- [x] Conceptual Alignment on Autopilot Pivot (Immigration Lawyer ICP, Ad Spend pricing).
- [x] Set up PCA, GitHub Monorepo, and configure Railway backend deployment.
- [x] Migrate to PostgreSQL on Railway for persistent storage.
- [x] Implement 3 pricing tiers (Basic, Scale, Growth) and Paywall UI.
- [x] Implement multi-credential limits per plan.
- [x] Integrate Dashboard Orchestrator Logs frontend with Backend API.
- [x] Integrate "Mis Campañas" module using the real Google Ads API.
- [x] Fix Railway build errors and handle frontend UI for suspended accounts.
- [x] Fix 500 error on Google Ads connection for normal users (env vars, google-ads lib upgrade, graceful error handling).
- [x] Implement Hybrid Autopilot (Learning Phase heuristic, automated PAUSE, pending UI for SCALE, backend CRON).
- [x] Integrate real payment gateway (Lemon Squeezy) with checkout sessions and webhook for automatic tier assignment.
- [x] Configure Lemon Squeezy Store ID, Variant IDs, and Webhook Secret in backend and verify end-to-end payment flow.
- [x] Transition Lemon Squeezy integration from Test Mode to Live Mode with real Variant IDs mapped to UI and Backend.
- [x] Add mandatory legal pages (Terms, Privacy, Refunds) and update footer links for Lemon Squeezy store approval.
- [x] Migrated Landing Page and Dashboard UI to a premium dark-mode aesthetic using Tailwind CSS and Recharts.
- [x] Upgraded Landing Page to a High-Conversion B2B Funnel with marketing psychology, Social Proof, and exposed Pricing tiers.
- [x] Adapted Landing Page, Client Dashboard, and Admin Dashboard for Mobile devices (hamburger menus, sliding sidebars, responsive tables).
- [x] Redesigned SuperAdmin Dashboard removing legacy CSS in favor of a premium Tailwind aesthetic (Neon Orange accents).
- [x] Translated Client Dashboard to English and refactored plan benefits to focus on DIY automation features.
- [x] Implemented real global metrics calculation on the main dashboard and dynamically rendered the AreaChart based on aggregated campaign data.
- [x] Implemented logic to strictly enforce plan limits in backend and updated the landing page UI accordingly.
- [x] Integrated Google Ads Conversion Pixel generation with Backend GAQL logic and Frontend Modal UI.
- [x] Rebranding to GMaker, CORS domain updates, and SEO metadata update.
- [x] Refined Landing Page copy for Immigration Lawyers ICP and reinforced Legal Pages (Terms, Privacy, Refunds) to mitigate liability.
- [x] Translated and refined the English landing page copy to specifically target US Immigration Law Firms.
- [x] Overhauled the AI Campaign Generator into an AI Marketing Strategist with web scraping capabilities.
- [x] Implemented Saved Strategies Vault with manual save functionality to curate high-value AI generation results.
- [x] Integrated Telegram Autopilot for real-time notifications and one-click manual approvals.
- [x] Implemented Setup/Onboarding page (`/onboarding`) to guide users through GMaker configuration steps (Google Ads, Campaigns, Telegram).
- [x] Fix Railway PostgreSQL asyncpg connection and add backend Dockerfile.