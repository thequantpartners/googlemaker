> [!IMPORTANT]
> **AI AGENT NOTICE**: If you are an AI agent, you **MUST** read AGENTS.md first to understand the workspace operating rules and context requirements.
# QSS (Quant Sales System)

QSS (antes GMaker) es el sistema operativo central (Core OS) diseñado exclusivamente para **The Quant Partners**.

This repository uses PCA (Persistent Context Architecture).

## Runtime Rule

Do not read the full `pca/` folder by default.
Read `PCA_INDEX.md`, then use `pca task "<task>"` to retrieve compact context.

## Local Commands

```bash
pca sync
pca query "project architecture"
pca task "current task"
```

## Target Audience (ICP)

- **Empresas y Agencias**: Horizontal SaaS providing pre-trained AI Receptionists (Snapshots) for various niches including Legal, Health, Real Estate, and general agencies.

## Features

*   **WhatsApp AI Receptionist (SaaS Core)**: An autonomous agent operating on WhatsApp to qualify leads 24/7.
    *   **Volume-Based Pricing Model**: 3 tiers (Starter, Growth, Scale) priced in Soles (PEN) based on `monthly_message_count`.
    *   **GoHighLevel-Style Onboarding**: Users select their industry snapshot, connect their WhatsApp via QR (Baileys) or official API (YCloud), and activate subscriptions immediately.
    *   **Dual WhatsApp Architecture**: 
        *   *Baileys (QR)*: Experimental mode for instant onboarding and Aha-moment testing without Meta Business verification.
        *   *YCloud (API)*: Production mode with strict HMAC-SHA256 signature verification for scalable deployments.
    *   **Multi-Account Support**: Supports multiple Google Ads customer IDs mapped to subscription limits.
*   **AI Chat Widget (Lead Capture)**: Native embeddable widget for client websites.
    *   **Rule-based Pre-qualification**: Deterministic state machine to evaluate user intent.
    *   **AI Handoff**: Gemini 2.0 Flash integration for autonomous lead closing.
    *   **CORS Sub-app Isolation**: Secure internal API separation from public widget endpoints.
*   **Lightweight CRM & Payments (QSS)**:
    *   **Lead Tracking**: Auto-captures `gclid` and UTM parameters for robust Google Ads attribution.
    *   **Dynamic Payments**: Configurable payment providers per client (`ClientPaymentConfig`), natively supporting Stripe checkouts or Custom redirect links (e.g., LawPay).
    *   **Conversion Metrics**: Centralized dashboard calculating Ad Spend vs Leads Captured vs Consultations Paid vs Full Cases Paid.
*   **Enterprise Operations (SOP Playbook)**: M&A-ready operational documentation structured with RACI matrices, defining the 8-phase agency lifecycle from "White-Glove" onboarding to technical deployment and client success.
