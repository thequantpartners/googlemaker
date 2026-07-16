# Changelog

## 2026-07-15
- Added a configuration toggle to the Master Setter dashboard to control if the Baileys bot should respond in WhatsApp groups.
- Added a dedicated Prompt configuration panel to the Master Setter dashboard for the Superadmin, integrated via `/api/chat-widget` so the bot's behavior can be updated directly from the admin panel.
- Modified `baileys-server/server.js` to expose a new `/api/config` endpoint that allows dynamic updates to the `RESPOND_TO_GROUPS` environment variable.

## 2026-07-14
- Instalado el fragmento de código del Pixel de Facebook en el layout de Next.js (`app/layout.tsx`) para el seguimiento global de eventos y PageView en la landing.
- Added Master AI configuration options (switches for Chat Widget and WhatsApp Virtual Setter).
- Implemented Goals detection (Agendar/Cobrar) based on connected Google Calendar and Payment systems.
- Updated Baileys master bot integration to default to the production URL, ensuring immediate WhatsApp message delivery for new leads.

## 2026-07-12
- Added Master Bot configuration options to the SuperAdmin UI (`/admin/master-bot`), allowing admins to configure the bot's response speed, the lead transfer WhatsApp number, and the Anti-Ban commercial hours schedule.

## 2026-07-11
- Migrated Autopilot notifications from Telegram to WhatsApp Master Bot (Baileys) via Text-Based Menus. Intercepts client WhatsApp messages to the Master Bot and executes Google Ads actions in the background.
- Integrated Native Google Calendar OAuth: Replaced Cal.com dependency con direct Google Calendar API integration via OAuth. Added `/auth/google-calendar` routes, secured refresh tokens, and exposed `get_gcal_availability` and `book_gcal_meeting` native AI tools to the Chat Engine for automatic AI scheduling.
- RediseÃ±o minimalista del Sidebar agrupando opciones por CategorÃ­a.
- Se implementÃ³ Setup Guide (Onboarding) forzado para usuarios nuevos sin conexiones activas.
- InstalaciÃ³n de la Arquitectura Master Bot en Baileys: Se integrÃ³ nuevo modelo `whatsapp_phone`, endpoint en backend, settings UI en frontend, y un endpoint `POST /api/send` en el microservicio Node para enviar notificaciones de Leads capturados directamente al WhatsApp personal del cliente.

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
- Integrated "Mis CampaÃ±as" (`/dashboard/campaigns`) module using the official `google-ads` Python client and GAQL to display real metrics (Cost, Clicks, CPA, Conversions).
- Fixed Railway build issue by pinning Python version to 3.11 in `backend/.python-version` to maintain `passlib` compatibility.
- Fixed UI edge case where suspended users could still access the connection button by forcing a full Suspended view when the backend returns 403 Forbidden.
- Fixed 500 Internal Server Error when normal users connect Google Ads: corrected env var names (`GOOGLE_ADS_CLIENT_ID`/`GOOGLE_ADS_CLIENT_SECRET`) in `google_ads_service.py`, upgraded `google-ads` library from v25 to v31 to resolve `501 GRPC target method can't be resolved` due to sunset API versions, added `fetch_accessible_customers` to auto-detect customer IDs on OAuth callback, and handled deactivated/not-enabled accounts gracefully.
- Implemented Hybrid Autopilot for Google Ads: Added Learning Phase protection heuristic, automated budget protection (PAUSE), manual pending UI for scaling (SCALE), and an automatic background CRON endpoint.
- Updated branding across dashboard layouts to use 'GoogleMaker' and 'G' icon instead of 'Mi Agencia'.
- Fixed 500 error on /clients/me/logs caused by PostgreSQL missing `status` and `is_dry_run` columns from Hybrid Autopilot update. Added auto-migration SQL in main.py.
- Fixed Vercel CORS blocking on backend by changing allow_origins to allow_origin_regex to accept all Vercel preview domains (`https://googlemaker-.*\.vercel\.app`).
- Fixed Google OAuth redirect_uri matching and CORS origin issues for custom domain (googlemaker.thequantpartners.com).
- Added Planes (`/dashboard/planes`) and Configuracion (`/dashboard/configuracion`) sections to client dashboard.
- Added individual Google Ads account deletion endpoint and updated Dashboard to support deleting accounts one by one.
- Enforced pricing tier limits in backend: Restricted Google Ads accounts connection limits, limited custom CPA strategies to Growth tier, and restricted hybrid scaling actions to Scale and Growth tiers in the orchestrator.
- Integrated Lemon Squeezy payment gateway with backend `/payments/create-checkout-session` and `/payments/webhook` for secure subscriptions. Removed old mock tier update endpoint.
- Configured Lemon Squeezy Store ID, Variant IDs, and Webhook Secret in backend, and verified end-to-end payment flow using Test Mode.
- Created and linked mandatory legal pages (Terms of Service, Privacy Policy, Refund Policy) required by Lemon Squeezy for live store activation.
- Implemented "Delete Client" feature in the SuperAdmin dashboard table (3-dots menu) with an explicit confirmation modal and strict protection to prevent superadmin deletion.
- Migrated Landing Page and Dashboard UI to a premium dark-mode aesthetic using Tailwind CSS v3 and Recharts, recreating the Nano Banana/v0.dev reference designs while preserving backend logic.
- Upgraded the Landing Page into a high-conversion B2B marketing funnel targeted at US/LatAm agencies, adding Problem Agitation, How It Works, Social Proof, exposed Pricing, and FAQ sections.
- Adapted the entire application (Landing Page, Client Dashboard, and SuperAdmin Dashboard) for mobile devices, introducing slide-in sidebars, hamburger menus, and responsive tables.
- Re-ordered Dashboard UI components for better UX (Connected Accounts module placed at the top) and fixed plan tier badge.
- Added dynamic language translation toggle (EN/ES) and UI avatars to the Landing Page.
- Integrated Google Ads Conversion Pixel generation with Backend GAQL logic (`google_ads_service.py` & `/clients.py`) and Frontend Modal UI.
- Fixed 500 API login error caused by missing `tier` column in production database by injecting explicit ALTER TABLE migration in `main.py` lifespan and pushing to Railway.
- Fixed Google Ads API 400 Validation Error on pixel generation by safely omitting `login_customer_id` from GoogleAdsClient config when the user connects directly to a client account instead of an MCC.
- Changed default pixel creation category from `LEAD` (which threw KeyError in some API versions) to `DEFAULT`.
- Built the "Pixel Manager" UI inside the Dashboard, allowing users to view, copy, and delete (status = REMOVED) all conversion actions linked to their Google Ads account.
- Upgraded the Pixel Manager to automatically map and display "Active Campaigns" for each pixel by cross-referencing conversion metrics segmented by conversion action over the last 30 days.
- Rebranded the entire application from GoogleMaker to GMaker to avoid trademark infringement issues with Google.
- Updated CORS backend policies to accept gmaker.thequantpartners.com.
- Updated Landing Page SEO metadata (Title and Description) with a professional English slogan.
- Strategically pivoted product definition: Defined "Autopilot" as the core value proposition, Immigration Lawyers (US Latinos) as the target ICP, and planned the migration to Ad-Spend based pricing tiers with a "Soft Pause" limit enforcement.
- Executed Autopilot Pivot Implementation Plan: Ad Spend pricing limits (Starter, Growth, Pro, Elite), Soft Pause orchestrator logic, and Immigration Lawyer Templates.
- Transitioned Lemon Squeezy integration from Test Mode to Live Mode. Queried real live products via API, updated backend `VARIANT_MAP` to match the new Starter ($49), Growth ($199), and Pro ($499) plans, and synchronized the frontend `PricingCards.tsx` UI. Guided user on configuring production Webhook with the correct URL, Secret, and Events.
- Refined Landing Page (ES and EN) copywriting to specifically target US Immigration Lawyers, emphasizing the "Piloto AutomÃ¡tico" core benefit and addressing niche pain points (bad clicks, lack of time, high CPA).
- Overhauled Legal Pages (Terms of Service, Privacy Policy, Refund Policy) to include robust liability waivers, indemnification, mandatory arbitration, no-refunds for Ad Spend, and client confidentiality clauses specifically tailored to protect against litigious markets.
- Upgraded the AI Campaign Generator to the "AI Marketing Strategist" using `gemini-2.0-flash`. Replaced simple description input with automated website scraping (via `read_url_content`) and competitor market positioning analysis.
- Redesigned the AI Campaign Generator UI into a premium 4-step wizard with micro-animations and transparent "Smart Targeting" UX text.
- Implemented the "Saved Strategies Vault". Replaced automatic saving with a manual "Save Strategy" button. Added the `SavedStrategy` backend models and corresponding API endpoints. Displayed saved strategies in an interactive grid in the dashboard.
- Integrated Telegram Autopilot: Added a 1-click connection UI (Deep Linking) in the dashboard settings to link a user's Telegram account. Upgraded the Orchestrator to dispatch real-time, interactive notifications (with Inline Keyboards/Buttons) for "Bleeding Campaigns" (PAUSE) and "Scaling Opportunities" (SCALE). Users can now approve or reject actions directly from Telegram, with background webhook handlers automatically mutating Google Ads state.
- Built Setup/Onboarding page (`/onboarding`) using premium Tailwind CSS UI and custom micro-animations. Replaced Lemon Squeezy-style mock with GMaker-specific setup steps (Google Ads, Campaigns, Telegram).
- Fixed Railway PostgreSQL asyncpg connection URL parsing and added backend Dockerfile for stable deployment.
- Configured 14-day free trial on the frontend UI and updated backend Lemon Squeezy webhook to handle `subscription_cancelled`, `subscription_expired`, and `subscription_payment_failed` to automatically revoke access.
- Fixed sidebar order by moving Setup Guide to the top.

- **2026-06-23**
- Fixed project name capitalization to GMAKER in README.md.
- Added delete option for saved strategies (backend API and frontend UI).
- Upgraded the AI Competitor Auto-Find functionality: it now uses Gemini to deduce the optimal search query, performs a live web search (via DuckDuckGo scraping), and extracts the most relevant direct competitors from the search results.
- Strategically rejected the implementation of an Inbound SMS Acquisition Widget to prevent feature creep and maintain focus on the core Telegram Autopilot loop.
- Diagnosed and fixed the Telegram Webhook integration in production by manually registering the Railway webhook URL via the Telegram API and injecting the missing `TELEGRAM_BOT_TOKEN` using the Railway CLI.

- **2026-06-24**
- Pivoted the business model from pure B2B SaaS to a Growth Partner / Tech-Enabled Agency model for "The Quant Partners".
- GMaker will now be positioned as an internal/core tool to manage client acquisition (Ads + Chat Widget + Web).
- Implemented the AI Chat Widget MVP: Added `ChatWidgetConfig`, `ChatSession`, and `Lead` models using SQLAlchemy without Alembic.
- Built the `chat_engine.py` state machine handling `RULES_MODE` and `AI_MODE` (Gemini 2.0 Flash).
- Created a CORS-isolated FastAPI sub-app mounted at `/widget` for public script endpoints, keeping `/clients` endpoints secure.
- Desarrollado el Vanilla JS `gmaker-widget.js` embed script con configuraciÃ³n dinÃ¡mica y persistencia de sesiÃ³n en local storage.
- Built the Next.js Configuration Dashboard `/dashboard/chat-widget` with Rule Builder, Appearance Editor, and AI Prompts settings.

- **2026-06-25**
- Rebranded GMaker to QSS (Quant SaaS System).
- Implemented Lightweight CRM for tracking Google Ads Leads (gclid, UTMs).
- Added dynamic `ClientPaymentConfig` to support Stripe, PayPal, and Custom payment links (e.g., LawPay).
- Integrated Lead Payment tracking (`consultation_paid`, `full_case_paid`) via webhooks (Stripe and Generic HMAC).
- Developed Dashboard Metrics endpoint integrating Google Ads API to calculate Ad Spend and Lead Conversion KPIs.
- Upgraded Chat Widget to automatically capture UTM parameters from URL/localStorage and trigger Stripe Checkout or Custom Link redirection.

- **2026-06-26**
- Fixed React rendering crash ("This page couldn't load") in the Chat Widget configuration dashboard caused by FastAPI returning 422 validation errors as an array instead of a string, and safely normalized `rules_config` JSON string to array.
- Fixed public Chat Widget CORS blocking ("El chat no estÃ¡ disponible ahora mismo") by injecting a custom `WidgetCORSMiddleware` to bypass the restrictive global FastAPI `CORSMiddleware`, allowing the widget to be embedded on any external website.

- **2026-06-27**
- Implemented Multi-LLM support in `chat_engine.py` (OpenAI GPT-4o Mini, Anthropic Claude 3.5 Haiku, Gemini 2.0 Flash) and enforced a strict Bring Your Own Key (BYOK) policy.
- Integrated AES-256 encryption using `cryptography.fernet` to securely store user API keys in PostgreSQL.
- Updated `dashboard/app/dashboard/chat-widget/page.tsx` with a secure UI to input and manage the AI Provider and API Key, including visual indicators (`â Configurada`) and blocked inputs to prevent accidental overwrites.
- Rebranded the entire application from "GMaker" to "QSS" (Quant System Sales) and "Chat Widget" to "Leads Widget", replacing textual references and logos across the frontend and backend.
- Updated hardcoded CORS origins and Google OAuth redirect URIs from `gmaker.thequantpartners.com` to `qss.thequantpartners.com`.
- Updated Railway `FRONTEND_ORIGINS` environment variable to accept the new `qss` domain via CLI.
- Fixed 401 session expiration errors when resuming the app after 24 hours: Extended FastAPI backend JWT validity to 30 days to match the NextAuth session, and added an automatic logout interceptor in the Next.js dashboard layout to securely redirect to the login page upon encountering any 401 response.
## 2026-06-29
- Added Manychat WhatsApp conversion webhook with native gclid split and Upsert logic in  ackend/routers/webhooks.py.
- Added Manychat conversational bridge endpoint /manychat/chat with LLM integration to act as Dumb Router.
- Built independent WhatsApp Sales System UI section in Dashboard allowing users to connect Manychat via API Token in a 1-click modal simulation.

## 2026-07-01
- Migrated WhatsApp integration from Manychat to YCloud (direct WhatsApp Business API).
- Refactored backend /webhooks/ycloud/conversion to parse GCLIDs directly via Regex from the standard WABA JSON payload, removing the dependency on Manychat Custom User Fields.
- Refactored backend /webhooks/ycloud/chat to act as LLM brain receiving YCloud payloads and sending responses to YCloud's /messages/send API.
- Updated frontend Dashboard (\/dashboard/whatsapp\) to securely handle \ycloud_api_key\ instead of \manychat_api_token\, and formatted Webhook URLs to include the \client_id\ query parameter for dynamic multi-tenant routing.
- Refactored YCloud integration to use a single unified Webhook endpoint and implemented strict HMAC-SHA256 signature verification matching YCloud's security model.
- Integrated standalone WhatsApp Microservice using Baileys to eliminate YCloud dependency, including custom backend Node.js QR polling, deployment to Railway, and React frontend integration with live status indicators.
- Implemented WhatsApp Anti-Ban Mechanisms: Addressed rapid response detection by injecting a minimum 4-second + dynamic length-based delay in `baileys-server/server.js`, and forced `available` presence right before `composing` to ensure the WhatsApp typing indicator actually displays on the client side.
- Fixed Rules Engine skipping the first message in WhatsApp by explicitly checking for empty `session.history` in `backend/services/chat_engine.py`.
- Auto-captured WhatsApp phone numbers for leads when no phone is provided by extracting the JID directly from the `session_id`.
- Handled Baileys Railway deployment failures by strictly configuring `railway.toml` to use `builder = "DOCKERFILE"` instead of `DOCKER`, resolving volume mount and continuous deployment issues.

## 2026-07-02
- Resolved Baileys microservice persistent session disconnection issue on Railway by migrating from Nixpacks to Dockerfile builder and manually attaching a Railway Volume to /app/auth_info_baileys.
- Updated  aileys-server/server.js to use a relative  uth_info_baileys path instead of absolute /app/... to support hybrid local/Docker execution.
- Formally renamed the project from GMaker to QSS (Quant System Sales) across documentation (README.md, PCA_INDEX.md).

## 2026-07-03
- Explored integrating OpenWA Gateway natively into the QSS backend as a robust alternative to Baileys.
- Implemented and subsequently reverted the native OpenWA backend proxy and frontend dashboard UI (rolled back due to preference for maintaining the lightweight, already-working Baileys architecture for end-clients).
- Reorganized the Leads Widget configuration UI (`/dashboard/chat-widget`) for improved UX, logically grouping visual settings (Apariencia), AI Provider/API Keys (IntenciÃ³n IA), and Allowed Domains (InstalaciÃ³n).
- Implemented dynamic bot behavior scheduling (Business Hours & Configurable Response Delays) to strictly mimic human interaction patterns and mitigate Meta bans on unofficial WhatsApp APIs.
- Updated `chat_engine.py` to evaluate timezone-aware business hours exactly at the LLM transition point. Rules/qualification execute 24/7, but if out of hours, the bot captures the lead, sends a one-time "Out of Office" message, and safely goes silent.
- Added comprehensive Business Hours Matrix (7-day toggle/time UI) to the WhatsApp settings dashboard.

## 2026-07-04
- Integrated Agentic Booking with Cal.com using Function Calling for seamless appointment scheduling inside chat sessions.
- 2026-07-04 (pm): Redesigned the Client Dashboard into a Business Metrics view prioritizing Ad Spend, CRM Leads, Sales, Revenue, and ROI. Relocated Google Ads configuration logic to the Campaigns tab. Aggregated `total_revenue` on the backend for precise financial tracking. Reorganized the Sidebar Navigation by grouping items into logical categories (GENERAL, CRM & AI AGENTS, CONFIGURATION) to reduce cognitive overload and maintain a clean UI.
- 2026-07-04 (late night): Refined ICP to target Abogados Penalistas in Peru due to high transactional search intent and high-value ticket cases. Implemented Downsell URL feature for the Leads Widget. Disqualified leads are now seamlessly redirected to a custom URL. For WhatsApp, the link is appended to trigger a Native Rich Preview Card, whereas for the Web Chat Widget, it renders as an interactive Action Button. Integrated emoji guidelines into the AI system prompt and default widget messages. Updated Landing Page copy to explicitly reflect the new WhatsApp QSS-provided architecture (clarifying the 2-step QSS bot -> Lawyer handoff).
- 2026-07-05: Generated comprehensive, M&A-ready SOP documentation (`docs/sops/`). Added an 8-phase Standard Operating Procedure playbook with RACI matrices, checklists, and Mermaid flowcharts covering the entire agency operations from acquisition to offboarding.

## 2026-07-06
- Overhauled the Landing Page for high conversion: Removed the top navigation bar, deleted heavy components like `AnimatedTestimonials`, and redesigned the "Beneficios" section into a premium glassmorphic grid layout. Re-wrote the copy to focus on realistic revenue outcomes (+S/ 10,000 al mes) and prioritized a single Sticky Bottom CTA for mobile devices.

- **2026-07-11**
- Integrated a highly optimized `LeadForm` into the Landing Page (`/`) to capture initial prospect data. This replaces the direct WhatsApp link, allowing Google Ads to properly register conversions upon successful form submission before seamlessly handing off the user to the WhatsApp channel.
- Developed an internal `OnboardingCreator` (`/admin/onboarding-creator`) for agency admins to define Custom SOP steps for new clients. Implemented a stateless architectural design that compiles the client data and steps into a base64-encoded URL, generating a secure and personalized welcome portal (`/welcome/[clientId]`) without requiring database storage.
- Built a `LandingGenerator` (`/admin/landing-generator`) tool enabling admins to rapidly spin up static landing pages for clients. The tool utilizes `jszip` and `file-saver` to dynamically inject form data into a pre-styled HTML/Tailwind template and downloads a ready-to-deploy `.zip` file entirely client-side.
- Completed the business model pivot from "Done For You" to a volume-based "WhatsApp AI Receptionist" SaaS.
- Refactored PostgreSQL Database to support `monthly_message_count` (integer limits) and `industry_niche` per client.
- Redesigned the Onboarding Flow (`/onboarding`) to a 4-step GoHighLevel-inspired architecture (Industry Snapshot Selection, WhatsApp Connection, Subscription Activation, Testing).
- Migrated payment infrastructure from Lemon Squeezy to Culqi, integrating `checkout.culqi.com/js/v4` directly into the frontend (`/dashboard/planes`) with background token processing via the new `payments` router.
- Fully redesigned the main Landing Page (`/`) from targeting "Abogados Penalistas" to a horizontal SaaS platform ("El Recepcionista IA para Empresas y Agencias").
-   * * 2 0 2 6 - 0 7 - 1 2 * * :   R e m o v e d   T e l e g r a m   f r o m   t h e   f r o n t e n d .   R e - o r g a n i z e d   t h e   D a s h b o a r d   s i d e b a r   l a y o u t   i n t o   3   c o r e   p i l l a r s :   A D Q U I S I C I Ó N ,   A T E R R I Z A J E ,   S E T T E R   V I R T U A L .   R e p l a c e d   t h e   s t a t i c   L a n d i n g   G e n e r a t o r   w i t h   a   d y n a m i c   " M a g i c   F o r m s "   m o d u l e ,   i m p l e m e n t i n g   b a c k e n d   e n d p o i n t s   a n d   f r o n t e n d   U I   f o r   m a n a g i n g   d y n a m i c   q u a l i f i c a t i o n   f o r m s .   R e s t r u c t u r e d   t h e   W h a t s A p p   B o t   C o n f i g u r a t i o n   p a g e   t o   u s e   a   t a b b e d   i n t e r f a c e   ( C o n e x i ó n ,   C o m p o r t a m i e n t o ,   H o r a r i o s )   a n d   f i x e d   m o b i l e   s i d e b a r   n a v i g a t i o n   U X .  
 - **2026-07-12**: RediseÃ±ada la Landing Page para centrarse 100% en los beneficios egoistas del cliente final, removiendo terminos tecnicos y adoptando la arquitectura GHL. Reemplazada la palabra 'bot' por 'setter virtual' en todo el sistema (UI y Dashboard) para aumentar el valor percibido del producto.
-   * * 2 0 2 6 - 0 7 - 1 4 * * :   M i g r a t e d   p a y m e n t   i n f r a s t r u c t u r e   f r o m   I z i p a y   t o   M e r c a d o   P a g o   S u b s c r i p t i o n s .   U p d a t e d   b a c k e n d   t o   c r e a t e   \ p r e a p p r o v a l _ p l a n \   i n s t a n c e s   a n d   h a n d l e   \ s u b s c r i p t i o n _ p r e a p p r o v a l \   w e b h o o k s .   R e f a c t o r e d   f r o n t e n d   t o   r e m o v e   K R G l u e   a n d   r e d i r e c t   d i r e c t l y   t o   M e r c a d o   P a g o   \ i n i t _ p o i n t \ .   P r o m o t e d   s e c o n d a r y   e m a i l   t o   s u p e r a d m i n   v i a   d e p l o y m e n t   s c r i p t .  
 -   A d d e d   i n d e p e n d e n t   A I   G o a l s   ( A g e n d a r / C o b r a r )   t o   C h a t   W i d g e t   a n d   M a s t e r   B o t ,   w i t h   a n   a s y n c h r o n o u s   w e b h o o k   i n j e c t i o n   l o o p   a l l o w i n g   t h e   A I   t o   s u c c e s s f u l l y   f o r c e   u p f r o n t   p a y m e n t s   v i a   S t r i p e / C u s t o m   p r o v i d e r s   b e f o r e   b o o k i n g   c a l e n d a r   m e e t i n g s .  
 