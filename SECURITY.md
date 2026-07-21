# Security Policy

## Security Practices

Contextly implements multiple layers of security:

- **Database-level RLS**: All data access controlled by Row Level Security policies
- **Rate limiting**: Database-level rate limiting via `is_rate_limited()` RPC
- **Input sanitization**: All user inputs escaped before storage
- **Webhook verification**: GitHub webhook signatures verified with HMAC-SHA256
- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection on API routes
- **Token isolation**: Per-project MCP tokens, no cross-project data access
- **Auth middleware**: All dashboard routes protected by Supabase session validation
- **Audit logging**: Security events tracked in audit_logs table

## Reporting a Vulnerability

If you've found a security issue in Contextly, please report it privately rather than opening a public GitHub issue — this gives time to fix it before it's publicly known.

**Contact:** security@getcontextly.dev

Please include:
- A description of the issue and its potential impact
- Steps to reproduce, if possible
- Any suggested fix (optional, not required)

**Response expectations:** an initial response within 48-72 hours acknowledging the report, with a fix timeline communicated once the issue is understood. This is a solo-maintained project in its early stages — response times will be honest, not enterprise-SLA-fast, but every report will be taken seriously.

## Scope

This policy covers:
- The Contextly CLI, MCP server, and dashboard
- The Supabase-backed API and authentication flows
- The GitHub App/webhook integration

Out of scope: third-party services Contextly depends on (Supabase, Stripe, GitHub, Vercel) — report those directly to the respective provider.

## What Happens After a Report

1. Acknowledgment sent to the reporter
2. Issue triaged and, if confirmed, a fix developed and tested
3. Fix deployed
4. Reporter notified once resolved, and credited (if they'd like) in the changelog or a security acknowledgments note

## A Note on Good-Faith Research

Reasonable, good-faith security research — testing against your own account/test project, not attempting to access other users' real data — is welcomed and won't be treated as an attack. If in doubt about whether a test crosses a line, ask first via the contact above.
