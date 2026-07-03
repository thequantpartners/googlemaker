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

- **US Immigration Lawyers (Latino Market)**: Optimized pre-loaded templates for Spanish keywords, negative keywords, and ad copies designed specifically for immigration law firms.

## Features

*   **Google Ads Autopilot (Core)**: A set-and-forget orchestrator.
    *   **Automated Budget Protection**: Automatically pauses wasteful keywords and bleeding campaigns (Learning Phase heuristics implemented).
    *   **Scaling Recommendations**: Generates horizontal and vertical scaling recommendations for high-performing campaigns.
    *   **Ad-Spend Pricing Model**: Pricing is tied to the volume of ad spend managed, not feature gating. All users get the full Autopilot.
    *   **Soft Pause Enforcement**: Limits are enforced safely by pausing the Autopilot optimization engine, without ever touching or pausing the client's live Google Ads campaigns.
    *   **Multi-Account Support**: Supports multiple Google Ads customer IDs mapped to subscription limits.
*   **AI Chat Widget (Lead Capture)**: Native embeddable widget for client websites.
    *   **Rule-based Pre-qualification**: Deterministic state machine to evaluate user intent.
    *   **AI Handoff**: Gemini 2.0 Flash integration for autonomous lead closing.
    *   **CORS Sub-app Isolation**: Secure internal API separation from public widget endpoints.
*   **Lightweight CRM & Payments (QSS)**:
    *   **Lead Tracking**: Auto-captures `gclid` and UTM parameters for robust Google Ads attribution.
    *   **Dynamic Payments**: Configurable payment providers per client (`ClientPaymentConfig`), natively supporting Stripe checkouts or Custom redirect links (e.g., LawPay).
    *   **Conversion Metrics**: Centralized dashboard calculating Ad Spend vs Leads Captured vs Consultations Paid vs Full Cases Paid.
