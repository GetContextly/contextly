# Contextly API Server

REST API for the Contextly protocol - AI agent memory and context sharing.

## Features

- **Complete Protocol Coverage**: All 6 Contextly primitives as REST endpoints
- **Authentication**: API Keys (X-API-Key) and JWT Bearer tokens
- **Authorization**: Scope-based permissions with fine-grained control
- **Rate Limiting**: Per-tenant and per-API-key limits with usage metering
- **Webhooks**: Event-driven architecture with retries, idempotency, and signed payloads
- **OpenAPI Spec**: Auto-generated from implementation (never drifts)
- **Swagger UI**: Interactive documentation at `/docs`
- **Comprehensive Testing**: Unit and integration tests

## Quick Start

### Installation

```bash
cd packages/api/server
npm install
```

### Development

```bash
npm run dev
```

Server starts on `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

### Test

```bash
npm test
npm run test:watch
```

## API Endpoints

### Core Context Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/read_context` | Read compiled context |
| POST | `/v1/commit` | Create context entry |
| POST | `/v1/query` | Query/filter entries |
| POST | `/v1/resolve` | Resolve conflict |
| POST | `/v1/fork` | Fork scope |
| POST | `/v1/merge` | Merge scopes |

### Scope Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/scopes/:scope/conflicts` | List conflicts |
| POST | `/v1/scopes/:scope/sync` | Sync scope |
| GET | `/v1/scopes/:scope/history` | Scope history |
| GET | `/v1/entries/:id` | Get entry by ID |

### Webhook Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/webhooks` | Create subscription |
| GET | `/v1/webhooks` | List subscriptions |
| GET | `/v1/webhooks/:id` | Get subscription |
| DELETE | `/v1/webhooks/:id` | Delete subscription |
| POST | `/v1/webhooks/:id/test` | Test webhook |
| GET | `/v1/webhooks/:id/deliveries` | Delivery history |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/openapi.json` | OpenAPI spec |
| GET | `/docs` | Swagger UI |

## Authentication

### API Key (Recommended)

```bash
curl -X POST http://localhost:3000/v1/read_context \
  -H "X-API-Key: ctx_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"scope": "project.myapp"}'
```

### JWT Bearer Token

```bash
curl -X POST http://localhost:3000/v1/read_context \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"scope": "project.myapp"}'
```

### Demo API Key

For testing: `ctx_d3m0k3y12345678901234567890`

## Example Requests

### Read Context

```bash
curl -X POST http://localhost:3000/v1/read_context \
  -H "X-API-Key: ctx_d3m0k3y12345678901234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "project.myapp",
    "budget": 5000,
    "kind": "decision",
    "cid": "auth.provider",
    "task": "implement authentication"
  }'
```

### Create Commitment

```bash
curl -X POST http://localhost:3000/v1/commit \
  -H "X-API-Key: ctx_d3m0k3y12345678901234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "project.myapp",
    "cid": "auth.provider",
    "message": "Use Supabase for authentication with JWT tokens",
    "kind": "decision",
    "supersedes": "sha256:old-entry-id",
    "parents": ["sha256:parent-entry-id"]
  }'
```

### Create Webhook

```bash
curl -X POST http://localhost:3000/v1/webhooks \
  -H "X-API-Key: ctx_d3m0k3y12345678901234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/contextly",
    "events": ["context.created", "conflict.detected", "conflict.resolved"],
    "auth": {
      "secret": "your-webhook-secret",
      "headers": {}
    },
    "retryConfig": {
      "maxRetries": 5,
      "baseDelayMs": 1000,
      "maxDelayMs": 60000,
      "backoffMultiplier": 2
    },
    "idempotencyWindowMs": 3600000
  }'
```

## Webhook Events

| Event | Description |
|-------|-------------|
| `context.created` | New context entry created |
| `context.updated` | Context entry updated/superseded |
| `context.deleted` | Context entry archived/deleted |
| `conflict.detected` | New conflict between entries |
| `conflict.resolved` | Conflict resolved |
| `scope.forked` | New scope forked |
| `scope.merged` | Scopes merged |
| `sync.completed` | Sync operation completed |
| `sync.failed` | Sync operation failed |

### Webhook Security

Webhooks are signed with HMAC-SHA256 using the subscription secret:

```
X-Contextly-Signature: sha256=<signature>
X-Contextly-Event: context.created
X-Contextly-ID: evt_abc123
X-Contextly-Timestamp: 2024-01-15T10:30:00Z
X-Contextly-Idempotency-Key: context.created_entry123_1705312200000
```

## Rate Limiting

| Tier | Requests/Minute | Window |
|------|-----------------|--------|
| Free | 100 | 1 minute |
| Pro | 1,000 | 1 minute |
| Enterprise | 10,000 | 1 minute |

Headers returned:
- `X-RateLimit-Limit`: Max requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp
- `Retry-After`: Seconds until reset (on 429)

## Usage Metering

All requests are metered for billing:
- Request count
- Token consumption
- Duration
- Error rates

## Postman Collection

Import `postman_collection.json` for a complete set of example requests.

## Environment Variables

```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment
JWT_SECRET=your-secret       # JWT signing secret
JWT_PUBLIC_KEY=...           # JWT public key (production)
ALLOWED_ORIGINS=*            # CORS origins
DATABASE_URL=postgresql://   # Database URL (production)
```

## Project Structure

```
src/
├── index.ts              # Entry point
├── routes/
│   ├── client.ts         # Protocol primitive routes
│   └── webhooks/         # Webhook routes
├── middleware/
│   ├── auth.ts           # Authentication
│   ├── rate-limit.ts     # Rate limiting
│   └── error.ts          # Error handling
├── store/
│   └── context-store.ts  # Data layer
├── webhooks/
│   ├── webhook-manager.ts
│   └── routes.ts
├── types/
│   └── index.ts          # Type definitions
└── tests/
    └── api.test.ts       # Integration tests
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/contextly
      - JWT_SECRET=your-secret
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=contextly
      - POSTGRES_USER=contextly
      - POSTGRES_PASSWORD=secret
```

## License

Apache-2.0