import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { clientRoute } from './routes/client.js';
import { webhookRoute } from './webhooks/routes.js';
import { authMiddleware } from './middleware/auth.js';
import { tenantRateLimiter, apiKeyRateLimiter, writeOperationLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// ============================================
// Core Middleware
// ============================================
app.use(helmet({
  contentSecurityPolicy: false, // Allow Swagger UI
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID for tracing
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// ============================================
// Authentication & Rate Limiting
// ============================================
app.use(authMiddleware);
app.use(tenantRateLimiter);
app.use(apiKeyRateLimiter);
app.use(writeOperationLimiter);

// ============================================
// API Routes
// ============================================
app.use('/v1', clientRoute);
app.use('/v1', webhookRoute);

// ============================================
// OpenAPI Spec Endpoint
// ============================================
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(generateOpenAPISpec());
});

// ============================================
// Swagger UI
// ============================================
app.get('/docs', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Contextly API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; width: 100%; height: 100%; }
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      });
    };
  </script>
</body>
</html>
  `);
});

// ============================================
// Health Check (no auth required)
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// Error Handling
// ============================================
app.use(errorHandler);

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      requestId: req.headers['x-request-id'],
    },
  });
});

// ============================================
// Start Server
// ============================================
const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    Contextly API Server                    ║
╠════════════════════════════════════════════════════════════╣
║  Version: 1.0.0                                            ║
║  Port: ${PORT}                                               ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                     ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║  • POST   /v1/read_context   - Read compiled context       ║
║  • POST   /v1/commit         - Create context entry        ║
║  • POST   /v1/query          - Query entries               ║
║  • POST   /v1/resolve        - Resolve conflict            ║
║  • POST   /v1/fork           - Fork scope                  ║
║  • POST   /v1/merge          - Merge scopes                ║
║  • GET    /v1/webhooks       - Manage webhooks             ║
║  • GET    /openapi.json      - OpenAPI spec                ║
║  • GET    /docs              - Swagger UI                  ║
║  • GET    /health            - Health check                ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export { app };

// OpenAPI Specification Generator
function generateOpenAPISpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Contextly API',
      version: '1.0.0',
      description: 'REST API for the Contextly protocol - AI agent memory and context sharing',
      contact: {
        name: 'Contextly',
        url: 'https://contextly.dev',
      },
      license: {
        name: 'Apache-2.0',
        url: 'https://opensource.org/licenses/Apache-2.0',
      },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
      { url: 'https://api.contextly.dev', description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key authentication',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token authentication',
        },
      },
      schemas: {
        // Request/Response schemas
        ReadContextRequest: {
          type: 'object',
          required: ['scope'],
          properties: {
            scope: { type: 'string', example: 'project.myapp' },
            budget: { type: 'integer', minimum: 1, maximum: 100000, default: 5000 },
            kind: { type: 'string', enum: ['decision', 'rule', 'observation'] },
            cid: { type: 'string', example: 'auth.provider' },
            task: { type: 'string', example: 'implement authentication' },
          },
        },
        ReadContextResponse: {
          type: 'object',
          properties: {
            entries: { type: 'array', items: { $ref: '#/components/schemas/ContextEntry' } },
            conflicts: { type: 'array', items: { $ref: '#/components/schemas/Conflict' } },
            stats: { $ref: '#/components/schemas/CompileStats' },
            dropped: { type: 'array', items: { $ref: '#/components/schemas/DroppedEntry' } },
            logs: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
          },
        },
        ContextEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'sha256:abc123...' },
            cid: { type: 'string', example: 'auth.provider' },
            message: { type: 'string', example: 'Use Supabase for authentication' },
            kind: { type: 'string', enum: ['decision', 'rule', 'observation'] },
            scope: { type: 'string', example: 'project.myapp' },
            author: { type: 'string', example: 'user@example.com' },
            timestamp: { type: 'string', format: 'date-time' },
            parents: { type: 'array', items: { type: 'string' } },
            supersedes: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['active', 'superseded', 'archived', 'tombstoned'] },
            provenance: {
              type: 'object',
              properties: {
                sourceScope: { type: 'string' },
                inherited: { type: 'boolean' },
                fromParent: { type: 'string', nullable: true },
                supersedesChain: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        Conflict: {
          type: 'object',
          properties: {
            cid: { type: 'string' },
            existingEntry: { $ref: '#/components/schemas/ContextEntry' },
            incomingEntry: { $ref: '#/components/schemas/ContextEntry' },
          },
        },
        CompileStats: {
          type: 'object',
          properties: {
            totalActive: { type: 'integer' },
            inherited: { type: 'integer' },
            overridden: { type: 'integer' },
            conflicts: { type: 'integer' },
            dropped: { type: 'integer' },
            compressed: { type: 'integer' },
            tokenCount: { type: 'integer' },
            budget: { type: 'integer' },
          },
        },
        DroppedEntry: {
          type: 'object',
          properties: {
            cid: { type: 'string' },
            kind: { type: 'string' },
            message: { type: 'string' },
            sourceScope: { type: 'string' },
            reason: { type: 'string', enum: ['budget', 'compressed'] },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            scope: { type: 'string' },
            author: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            metadata: { type: 'object' },
          },
        },
        CommitRequest: {
          type: 'object',
          required: ['scope', 'cid', 'message', 'kind'],
          properties: {
            scope: { type: 'string' },
            cid: { type: 'string' },
            message: { type: 'string', maxLength: 5000 },
            kind: { type: 'string', enum: ['decision', 'rule', 'observation'] },
            supersedes: { type: 'string' },
            parents: { type: 'array', items: { type: 'string' } },
          },
        },
        CommitResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ['committed', 'conflict', 'already_exists'] },
            entry: { $ref: '#/components/schemas/ContextEntry' },
            conflict: { $ref: '#/components/schemas/Conflict' },
          },
        },
        QueryRequest: {
          type: 'object',
          properties: {
            scope: { type: 'string' },
            id: { type: 'string' },
            cid: { type: 'string' },
            kind: { type: 'string', enum: ['decision', 'rule', 'observation'] },
            status: { type: 'string', enum: ['active', 'superseded', 'archived', 'tombstoned'] },
          },
        },
        QueryResponse: {
          type: 'object',
          properties: {
            entries: { type: 'array', items: { $ref: '#/components/schemas/ContextEntry' } },
          },
        },
        ResolveRequest: {
          type: 'object',
          required: ['scope', 'cid', 'message', 'kind', 'supersedingId'],
          properties: {
            scope: { type: 'string' },
            cid: { type: 'string' },
            message: { type: 'string', maxLength: 5000 },
            kind: { type: 'string', enum: ['decision', 'rule', 'observation'] },
            supersedingId: { type: 'string' },
          },
        },
        ResolveResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ['resolved', 'conflict_persists'] },
            supersededId: { type: 'string' },
            entry: { $ref: '#/components/schemas/ContextEntry' },
          },
        },
        ForkRequest: {
          type: 'object',
          required: ['scope', 'parentScope'],
          properties: {
            scope: { type: 'string' },
            parentScope: { type: 'string' },
          },
        },
        ForkResponse: {
          type: 'object',
          properties: {
            scope: { type: 'string' },
            parentScope: { type: 'string' },
            status: { type: 'string', enum: ['forked'] },
            inheritedEntries: { type: 'integer' },
          },
        },
        MergeRequest: {
          type: 'object',
          required: ['source', 'target'],
          properties: {
            source: { type: 'string' },
            target: { type: 'string' },
          },
        },
        MergeResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['merged', 'conflict'] },
            adopted: { type: 'integer' },
            conflicts: { oneOf: [
              { type: 'integer' },
              { type: 'array', items: { $ref: '#/components/schemas/Conflict' } },
            ]},
            rejected: { type: 'integer' },
            entries: { type: 'array', items: { $ref: '#/components/schemas/ContextEntry' } },
          },
        },
        WebhookSubscription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            events: { type: 'array', items: { type: 'string', enum: ['context.created', 'context.updated', 'context.deleted', 'conflict.detected', 'conflict.resolved', 'scope.forked', 'scope.merged', 'sync.completed', 'sync.failed'] } },
            auth: {
              type: 'object',
              properties: {
                secret: { type: 'string' },
                headers: { type: 'object' },
              },
            },
            retryConfig: {
              type: 'object',
              properties: {
                maxRetries: { type: 'integer', default: 5 },
                baseDelayMs: { type: 'integer', default: 1000 },
                maxDelayMs: { type: 'integer', default: 60000 },
                backoffMultiplier: { type: 'number', default: 2 },
              },
            },
            idempotencyWindowMs: { type: 'integer', default: 3600000 },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        WebhookPayload: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            event: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            data: { type: 'object' },
            idempotencyKey: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' },
            requestId: { type: 'string' },
          },
        },
      },
      parameters: {
        requestId: {
          in: 'header',
          name: 'X-Request-ID',
          schema: { type: 'string' },
          required: false,
          description: 'Request ID for tracing',
        },
        apiKey: {
          in: 'header',
          name: 'X-API-Key',
          schema: { type: 'string' },
          required: false,
          description: 'API Key for authentication',
        },
      },
    },
    security: [
      { ApiKeyAuth: [] },
      { BearerAuth: [] },
    ],
    paths: {
      '/v1/read_context': {
        post: {
          summary: 'Read compiled context for a scope',
          operationId: 'readContext',
          tags: ['Context'],
          security: [{ ApiKeyAuth: [], BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReadContextRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Compiled context',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ReadContextResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        '/v1/commit': {
          post: {
            summary: 'Create a new context entry',
            operationId: 'commitEntry',
            tags: ['Context'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CommitRequest' },
                },
              },
            },
            responses: {
              '201': {
                description: 'Entry committed',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/CommitResponse' },
                  },
                },
              },
              '409': {
                description: 'Conflict detected',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/CommitResponse' },
                  },
                },
              },
              '400': { $ref: '#/components/responses/BadRequest' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
              '429': { $ref: '#/components/responses/RateLimited' },
            },
          },
        },
        '/v1/query': {
          post: {
            summary: 'Query context entries',
            operationId: 'queryEntries',
            tags: ['Context'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/QueryRequest' },
                },
              },
            },
            responses: {
              '200': {
                description: 'Query results',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/QueryResponse' },
                  },
                },
              },
              '400': { $ref: '#/components/responses/BadRequest' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
              '429': { $ref: '#/components/responses/RateLimited' },
            },
          },
        },
        '/v1/resolve': {
          post: {
            summary: 'Resolve a conflict by superseding',
            operationId: 'resolveConflict',
            tags: ['Context'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ResolveRequest' },
                },
              },
            },
            responses: {
              '200': {
                description: 'Resolution created',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ResolveResponse' },
                  },
                },
              },
              '409': { description: 'Conflict persists' },
              '400': { $ref: '#/components/responses/BadRequest' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
              '429': { $ref: '#/components/responses/RateLimited' },
            },
          },
        },
        '/v1/fork': {
          post: {
            summary: 'Fork a new scope from parent',
            operationId: 'forkScope',
            tags: ['Scopes'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ForkRequest' },
                },
              },
            },
            responses: {
              '201': {
                description: 'Scope forked',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ForkResponse' },
                  },
                },
              },
              '400': { $ref: '#/components/responses/BadRequest' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
              '429': { $ref: '#/components/responses/RateLimited' },
            },
          },
        },
        '/v1/merge': {
          post: {
            summary: 'Merge source scope into target',
            operationId: 'mergeScopes',
            tags: ['Scopes'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MergeRequest' },
                },
              },
            },
            responses: {
              '200': {
                description: 'Merge result',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/MergeResponse' },
                  },
                },
              },
              '400': { $ref: '#/components/responses/BadRequest' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
              '429': { $ref: '#/components/responses/RateLimited' },
            },
          },
        },
        '/webhooks': {
          post: {
            summary: 'Subscribe to webhook events',
            operationId: 'createWebhookSubscription',
            tags: ['Webhooks'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WebhookSubscription' },
                },
              },
            },
            responses: {
              '201': {
                description: 'Subscription created',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/WebhookSubscription' },
                  },
                },
              },
              '400': { $ref: '#/components/responses/BadRequest' },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
              '429': { $ref: '#/components/responses/RateLimited' },
            },
          },
          get: {
            summary: 'List webhook subscriptions',
            operationId: 'listWebhookSubscriptions',
            tags: ['Webhooks'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            responses: {
              '200': {
                description: 'List of subscriptions',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        subscriptions: { type: 'array', items: { $ref: '#/components/schemas/WebhookSubscription' } },
                      },
                    },
                  },
                },
              },
              '401': { $ref: '#/components/responses/Unauthorized' },
              '403': { $ref: '#/components/responses/Forbidden' },
            },
          },
        },
        '/webhooks/{id}': {
          get: {
            summary: 'Get webhook subscription',
            operationId: 'getWebhookSubscription',
            tags: ['Webhooks'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
              '200': { description: 'Subscription details' },
              '404': { $ref: '#/components/responses/NotFound' },
              '401': { $ref: '#/components/responses/Unauthorized' },
            },
          },
          delete: {
            summary: 'Delete webhook subscription',
            operationId: 'deleteWebhookSubscription',
            tags: ['Webhooks'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
              '204': { description: 'Subscription deleted' },
              '404': { $ref: '#/components/responses/NotFound' },
              '401': { $ref: '#/components/responses/Unauthorized' },
            },
          },
        },
        '/webhooks/{id}/test': {
          post: {
            summary: 'Test webhook delivery',
            operationId: 'testWebhook',
            tags: ['Webhooks'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
              '200': { description: 'Test sent' },
              '404': { $ref: '#/components/responses/NotFound' },
              '401': { $ref: '#/components/responses/Unauthorized' },
            },
          },
        },
        '/webhooks/{id}/deliveries': {
          get: {
            summary: 'Get webhook delivery history',
            operationId: 'listWebhookDeliveries',
            tags: ['Webhooks'],
            security: [{ ApiKeyAuth: [], BearerAuth: [] }],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
            ],
            responses: {
              '200': { description: 'Delivery history' },
              '404': { $ref: '#/components/responses/NotFound' },
            },
          },
        },
        '/health': {
          get: {
            summary: 'Health check',
            operationId: 'healthCheck',
            tags: ['System'],
            responses: {
              '200': {
                description: 'Service is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        timestamp: { type: 'string', format: 'date-time' },
                        version: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: { code: 'UNAUTHORIZED', message: 'Valid API key or JWT token required', requestId: 'req_abc123' } },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: { code: 'FORBIDDEN', message: 'Insufficient permissions', requestId: 'req_abc123' } },
            },
          },
        },
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: { code: 'BAD_REQUEST', message: 'Invalid request parameters', requestId: 'req_abc123' } },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: { code: 'NOT_FOUND', message: 'Resource not found', requestId: 'req_abc123' } },
            },
          },
        },
        RateLimited: {
          description: 'Rate Limited',
          headers: {
            'X-RateLimit-Limit': { schema: { type: 'integer' } },
            'X-RateLimit-Remaining': { schema: { type: 'integer' } },
            'X-RateLimit-Reset': { schema: { type: 'integer' } },
            'Retry-After': { schema: { type: 'integer' } },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded', requestId: 'req_abc123' } },
            },
          },
        },
      },
    },
  };
}