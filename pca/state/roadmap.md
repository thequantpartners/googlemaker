# Roadmap

## In Process

- [Define upcoming work]

## Pending

- [ ] Add more snapshots and templates for specific industries.

## Done

- [x] Migrated Autopilot notifications from Telegram to WhatsApp Master Bot (Baileys) via Text-Based Menus.
- [x] Integrate Native Google Calendar OAuth and AI Tools for zero-touch automatic scheduling.
- [x] Refactored UX: Sidebar minimalista, Setup Guide forzado, y arquitectura Master Bot (Baileys) para notificaciones de WhatsApp.
- [x] Migrate Subscription Billing from Lemon Squeezy to Culqi (Webhook handlers, Checkouts).
- [x] Implement GoHighLevel-style Onboarding (Industry Snapshot selection, Branding, WhatsApp QR).
- [x] Refactor Database to track `monthly_message_count` and `industry_niche` for usage-based billing.
- [x] Redesign primary Landing Page to pitch the AI WhatsApp Receptionist SaaS instead of Google Ads.
- [x] Plan and implement Chat Widget in GMaker (Rules + Heuristics for intent detection, then AI handoff).
- [x] Pivoted business strategy to Growth Partner / Tech-Enabled Agency model ("The Quant Partners" offering 360 acquisition systems).
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
- [x] Implement 14-day free trial requiring an upfront credit card, handle subscription cancellation webhook logic, and fix sidebar menu order.
- [x] Fixed project name capitalization to GMAKER in README.md.
- [x] Added delete option for saved strategies.
- [x] Upgraded AI Competitor Auto-Find to perform real web scraping using DuckDuckGo search to extract direct competitors.
- [x] Fixed React rendering crashes in the Chat Widget configuration dashboard and resolved global CORS blocking issues for the public widget API.
- [x] Integrated Multi-LLM support (OpenAI, Anthropic, Gemini) with strict BYOK (Bring Your Own Key) enforcement for the Chat Widget.
- [x] Rebranded Chat Widget to Leads Widget and GMaker to QSS.
- [x] Fixed 401 session expiration errors by extending backend JWT validity and adding a frontend automatic logout interceptor.
- [x] Integrate WhatsApp-First Manychat Conversion & Chat Bridge (2026-06-29)
- [x] Migrate WhatsApp Integration from Manychat to YCloud (2026-07-01)
- [x] Refactor YCloud integration to use a single unified Webhook endpoint and implement strict HMAC-SHA256 signature verification (2026-07-01)
- [x] Integrate standalone WhatsApp Microservice using Baileys to eliminate YCloud dependency (2026-07-01)
- [x] Implement WhatsApp Anti-Baneo mechanisms (human typing delays, read receipts) and fix Rules Engine first-message skip bug (2026-07-01)
- [x] Resolve Baileys Railway persistent volume detachment issue and rename project to QSS (2026-07-02)
- [x] Evaluate OpenWA Gateway and subsequently revert to maintain focus on the lightweight Baileys server architecture (2026-07-03)
- [x] Implement dynamic bot behavior scheduling (Business Hours, configurable Response Delays) across YCloud and Baileys (2026-07-03)
- [x] Implement Agentic Booking with Cal.com (Function Calling, Multi-LLM, Asynchronous Webhook Interceptor) (2026-07-04)
- [x] Redesign Client Dashboard to focus on 5 Business KPIs (Spend, Leads, Sales, Revenue, ROI) and group Sidebar Navigation (2026-07-04)
- [x] Refine ICP to Abogados Penalistas (Peru) and implement Downsell URL feature (2026-07-04)
- [x] Redesigned Landing Page WhatsApp copy to reflect the dedicated QSS WhatsApp filter architecture (2026-07-04)
- [x] Generated enterprise-grade M&A-ready SOP documentation covering the entire QSS lifecycle (2026-07-05)
- [x] Overhauled Landing Page UI/UX for extreme conversion: Removed navigation, simplified copy, applied glassmorphic grid design to benefits, and optimized mobile CTA behavior (2026-07-06)
- [x] Integrated optimized Lead Form on Landing Page to register Google Ads conversions prior to WhatsApp handoff (2026-07-11)
- [x] Developed internal Onboarding Creator to generate stateless, customized welcome portals (SOPs) for new agency clients (2026-07-11)
- [x] Developed internal Landing Generator utilizing `jszip` to instantly compile and download static HTML/Tailwind templates for rapid deployment (2026-07-11)
- [x] Added Master Bot configuration options (Response Speed, Lead Transfer Number, Anti-Ban Schedule) to the SuperAdmin UI (2026-07-12)
- [x] Rediseño de Landing Page enfocado a beneficios (arquitectura GHL) `2026-07-12` `QSS` `Frontend`
