# Contextly Security Whitepaper

**Status**: Production / Hardened
**Version**: 1.0

## Introduction

At Contextly, we treat architectural memory as a first-class secret. This document outlines our approach to data privacy, codebase security, and zero-trust infrastructure.

## 1. Local-First Analysis

Contextly's core intelligence engine, the **Semantic Analyzer**, runs locally on the developer's machine. 

- **No Source Code Uploads**: We never ingest, upload, or store your raw source code.
- **Intent Extraction**: The CLI parses git diffs locally and only transmits the extracted "Intent" (metadata, summary, and reasoning) to our cloud.
- **Data Reduction**: 99% of the codebase stays on your machine; only the 1% that defines "The Why" is synced.

## 2. Zero-Trust MCP Protocol

Communication between AI agents (Claude, Cursor) and the Contextly memory hub happens via the **Model Context Protocol (MCP)**.

- **Per-Project Tokens**: Every project is assigned a unique, cryptographically secure token (`ctx_...`).
- **Isolation**: Tokens are scoped to specific project IDs. Even if a token is leaked, it cannot be used to access other projects within the same account.
- **Revocation**: Tokens can be instantly rotated via the Cloud Dashboard.

## 3. Database Security (Supabase Hardening)

Our backend utilizes Supabase with a multi-layered security model:

- **Row Level Security (RLS)**: Every table has strict RLS policies. Even authenticated users cannot query data that doesn't belong to a project where they have an explicit `owner` or `member` role.
- **Audit Logs**: All sensitive operations (token generation, project deletion) are logged for compliance.
- **Encryption at Rest**: All architectural decisions and embeddings are encrypted using AES-256.

## 4. Vulnerability Mitigation

- **SQL Injection**: We use parameterized queries via PostgREST and RPCs, neutralizing the risk of injection attacks.
- **XSS Protection**: All user-provided strings are sanitized before being rendered in the Dashboard or Transactional Emails.
- **CSRF & Auth**: Next.js 15 Server Components and Supabase SSR are used to ensure secure session management.

---

For security inquiries or bug bounties, please contact security@getcontextly.dev.
