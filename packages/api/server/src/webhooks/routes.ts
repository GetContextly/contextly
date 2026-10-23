import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requirePermission } from '../middleware/auth.js';
import { 
  WebhookSubscription, 
  WebhookPayload, 
  WebhookEvent,
  APIError 
} from '../types.js';
import { 
  createWebhookSubscription, 
  getWebhookSubscriptions, 
  deleteWebhookSubscription,
  deliverWebhook,
  getWebhookDeliveries,
  WebhookDelivery 
} from '../webhooks/webhook-manager.js';

const router = Router();

// ============================================
// POST /v1/webhooks - Subscribe to webhooks
// ============================================
router.post(
  '/webhooks',
  requirePermission('webhooks', 'write'),
  asyncHandler(async (req: Request, res: Response) => {
    const { url, events, auth, retryConfig, idempotencyWindow } = req.body;
    
    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      throw new APIError('BAD_REQUEST', 'url and events[] required', 400);
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new APIError('BAD_REQUEST', 'Invalid URL', 400, { field: 'url' });
    }
    
    // Validate events
    const validEvents: WebhookEvent[] = [
      'context.created',
      'context.updated',
      'context.deleted',
      'conflict.detected',
      'conflict.resolved',
      'scope.forked',
      'scope.merged',
      'sync.completed',
      'sync.failed',
    ];
    
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e as WebhookEvent));
    if (invalidEvents.length > 0) {
      throw new APIError('BAD_REQUEST', 'Invalid events', 400, { invalidEvents });
    }
    
    const subscription = await createWebhookSubscription({
      url,
      events: events as WebhookEvent[],
      auth: auth || { secret: '', headers: {} },
      retryConfig: retryConfig || {
        maxRetries: 5,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      idempotencyWindow: idempotencyWindow || 3600000, // 1 hour default
    });
    
    res.status(201).json(subscription);
  })
);

// ============================================
// GET /v1/webhooks - List subscriptions
// ============================================
router.get(
  '/webhooks',
  requirePermission('webhooks', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const subscriptions = await getWebhookSubscriptions();
    res.json({ subscriptions });
  })
);

// ============================================
// GET /v1/webhooks/:id - Get subscription
// ============================================
router.get(
  '/webhooks/:id',
  requirePermission('webhooks', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const subscriptions = await getWebhookSubscriptions();
    const subscription = subscriptions.find(s => s.id === req.params.id);
    
    if (!subscription) {
      throw new APIError('NOT_FOUND', 'Webhook subscription not found', 404);
    }
    
    res.json(subscription);
  })
);

// ============================================
// DELETE /v1/webhooks/:id - Delete subscription
// ============================================
router.delete(
  '/webhooks/:id',
  requirePermission('webhooks', 'write'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteWebhookSubscription(id);
    res.status(204).send();
  })
);

// ============================================
// POST /v1/webhooks/:id/test - Test webhook delivery
// ============================================
router.post(
  '/webhooks/:id/test',
  requirePermission('webhooks', 'write'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const subscriptions = await getWebhookSubscriptions();
    const subscription = subscriptions.find(s => s.id === id);
    
    if (!subscription) {
      throw new APIError('NOT_FOUND', 'Webhook subscription not found', 404);
    }
    
    // Send test payload
    const testPayload = {
      id: `test_${Date.now()}`,
      event: 'test.ping' as any,
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from Contextly API' },
      idempotencyKey: `test_${Date.now()}`,
    };
    
    const delivery = await deliverWebhook(subscription, testPayload);
    
    res.json({ 
      message: 'Test webhook sent', 
      delivery: { 
        id: delivery.id, 
        status: delivery.status, 
        responseCode: delivery.responseCode 
      } 
    });
  })
);

// ============================================
// GET /v1/webhooks/:id/deliveries - Get delivery history
// ============================================
router.get(
  '/webhooks/:id/deliveries',
  requirePermission('webhooks', 'read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const deliveries = await getWebhookDeliveries(id, limit);
    res.json({ deliveries });
  })
);

// ============================================
// POST /v1/webhooks/receive - Receive webhook (for testing)
// ============================================
router.post(
  '/webhooks/receive',
  asyncHandler(async (req: Request, res: Response) => {
    // This endpoint receives webhooks from external services
    // In a real implementation, this would be used by other systems to send webhooks TO Contextly
    const payload = req.body;
    
    // Validate and process incoming webhook
    if (!payload.event || !payload.idempotencyKey) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'event and idempotencyKey required' } 
      });
    }
    
    // Process the webhook event
    console.log('[WEBHOOK RECEIVED]', payload);
    
    res.json({ received: true, id: payload.idempotencyKey });
  })
);

export { router as webhookRoute };