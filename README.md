> [!IMPORTANT]
> **AI AGENT NOTICE**: If you are an AI agent, you **MUST** read AGENTS.md first to understand the workspace operating rules and context requirements.

# GoogleMaker

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

## Features

*   **Google Ads Orchestrator**: Uses a Hybrid Autopilot logic.
    *   **Automated Protection**: Automatically pauses campaigns bleeding budget (Learning Phase heuristics implemented).
    *   **Manual Scaling**: Generates scaling recommendations for high-performing campaigns, requiring manual approval via the dashboard.
    *   **Multi-Account Support**: Supports multiple Google Ads customer IDs mapped to subscription limits.
