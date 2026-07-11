# Contextly ◈

**Persistent Memory for AI Coding Agents.**

Contextly gives Claude Code, Cursor, and GitHub Copilot a living project brief — auto-updated from git — so you never lose context when switching tools or starting new sessions.

[![Dashboard Deployment](https://github.com/GetContextly/contextly/actions/workflows/dashboard-deploy.yml/badge.svg)](https://github.com/GetContextly/contextly/actions/workflows/dashboard-deploy.yml)
[![CLI Release](https://github.com/GetContextly/contextly/actions/workflows/cli-release.yml/badge.svg)](https://github.com/GetContextly/contextly/actions/workflows/cli-release.yml)

---

## 🏗️ Architecture

Contextly consists of three core components:

1.  **Semantic CLI**: Analyzes git history to extract architectural intent and syncs it to the cloud.
2.  **MCP Server**: A standardized bridge that allows AI agents to query the project's memory semantically.
3.  **Cloud Dashboard**: A high-end interface for managing projects, team access, and GitHub App integrations.

## 🚀 Getting Started (Developers)

### 1. Global Installation
```bash
npm install -g @contextly/cli
```

### 2. Authentication
```bash
contextly auth
```

### 3. Initialize Project
```bash
cd your-project-root
contextly init
```

### 4. Sync Context
```bash
contextly sync
```

## 🛠️ Development

### Prerequisites
- Node.js v20+
- Docker (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [GitHub CLI](https://cli.github.com/)

### Local Setup
Run the automated setup script:
```bash
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh
```

### Running the Stack
- **Dashboard**: `npm run dev -w @contextly/dashboard`
- **MCP Server**: `npm run dev -w @contextly/mcp-server`
- **CLI (Dev)**: `cd packages/cli && npm run dev`

## 🛡️ Security & Privacy
Contextly treats your code as a first-class secret. 
- **Local Analysis**: Diff parsing happens locally on your machine.
- **End-to-End Encryption**: Architectural decisions are encrypted at rest.
- **Zero-Trust MCP**: Agents connect via cryptographically secure, per-project tokens.

## 📄 License
ISC © [GetContextly](https://getcontextly.dev)
