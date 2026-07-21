# Changelog

All notable changes to Contextly will be documented in this file.

## [1.0.0] - 2025-07-21

### Added
- **CLI**: GitHub Device Flow authentication (`contextly login`)
- **CLI**: Auto-login on `contextly init` — no separate login step required
- **CLI**: `contextly whoami` command to show current user
- **CLI**: Improved heuristic analyzer with 34 keywords, file path detection, confidence scoring
- **CLI**: Better error messages with suggested fixes
- **MCP Server**: 5 contract-matching tools (`get_context`, `explain_file`, `recent_changes`, `log_decision`, `get_project_brief`)
- **MCP Server**: Request timeouts (30s) on all Supabase queries
- **MCP Server**: Startup token validation with clear error messages
- **Dashboard**: Auth middleware protecting all dashboard and admin routes
- **Dashboard**: Conditional Navbar — hidden on authenticated routes
- **Dashboard**: Project creation and deletion with confirmation
- **Dashboard**: MCP configuration panel with copy-to-clipboard
- **Dashboard**: Plan & usage display with progress bars
- **Dashboard**: Admin panel with real audit logs
- **Dashboard**: Documentation page with CLI commands, MCP tools, setup guide
- **Dashboard**: 404 and global error pages
- **Dashboard**: SEO metadata, robots.txt, sitemap.xml
- **Dashboard**: Login page redesigned with Tailwind
- **Webhooks**: Auto-sync on push events with heuristic decision extraction
- **Webhooks**: PR merge tracking as architectural decisions
- **Webhooks**: GitHub App installation event handling
- **Shared**: `parseSince()` utility for time window queries
- **Shared**: Billing limits aligned across all packages
- **Shared**: 46 tests across 7 test files
- **CI/CD**: GitHub Actions for test, lint, build on PR
- **CI/CD**: Vercel auto-deploy on push to main

### Fixed
- Pricing page buttons — Free plan redirects to login, Team plan shows appropriate action
- Welcome email — removed lodash dependency, added auth check, dynamic Resend import
- Dashboard settings — removed duplicate handleCopy, wired up delete account
- Shared utils — removed 37 dead `api_*` files and 16 unused modules

### Security
- Database-level rate limiting via RPC
- Input sanitization on all user-facing fields
- Webhook signature verification (HMAC-SHA256)
- Audit log table for security events
- Security headers on all API routes
