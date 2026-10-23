//!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClientRoute } from './routes/index.js';
import { setupWebhooks } from './webhooks/index.js';
import { initDatabase } from './db/init.js';
import { logger, errorHandler } from './middleware/error.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(logger);

// Rate limiting
app.use(rateLimitMiddleware);

// Authentication middleware
app.use(authMiddleware);

// Initialize database
initDatabase().catch(console.error);

// API Routes - V1 Version (Protocol primitives)
app.use('/v1', createClientRoute());

// Webhook endpoints
app.use('/v1/webhooks', setupWebhooks());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Contextly API v1.0.0 running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});