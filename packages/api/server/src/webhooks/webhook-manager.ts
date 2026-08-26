import crypto from 'crypto';
import { 
  WebhookSubscription, 
  WebhookPayload, 
  WebhookEvent,
  WebhookDelivery,
  APIError 
} from '../types.js';

const subscriptions = new Map<string, WebhookSubscription>();
const deliveries = new Map<string, WebhookDelivery[]>();

// Initialize with demo subscription
function initializeDemoData() {
  const demoSub: WebhookSubscription = {
    id: 'sub_demo',
    url: 'https://example.com/webhook',
    events: ['context.created', 'conflict.detected', 'conflict.resolved'],
    auth: { secret: 'demo_secret', headers: {} },
    retryConfig: { maxRetries: 5, baseDelayMs: 1000, maxDelayMs: 60000, backoffMultiplier: 2 },
    idempotencyWindowMs: 3600000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  subscriptions.set(demoSub.id, demoSub);
}

initializeDemoData();

// Generate unique IDs
function genId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString('base64url')}`;
}

export async function createWebhookSubscription(data: Omit<WebhookSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookSubscription> {
  const subscription: WebhookSubscription = {
    ...data,
    id: genId('sub'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  subscriptions.set(subscription.id, subscription);
  deliveries.set(subscription.id, []);
  
  return subscription;
}

export async function getWebhookSubscriptions(): Promise<WebhookSubscription[]> {
  return Array.from(subscriptions.values()).filter(s => s.isActive);
}

export async function getWebhookSubscription(id: string): Promise<WebhookSubscription | undefined> {
  const sub = subscriptions.get(id);
  if (sub && sub.isActive) return sub;
  return undefined;
}

export async function deleteWebhookSubscription(id: string): Promise<boolean> {
  const sub = subscriptions.get(id);
  if (!sub) return false;
  sub.isActive = false;
  sub.updatedAt = new Date();
  return true;
}

export async function getWebhookDeliveries(subscriptionId: string, limit: number = 50): Promise<WebhookDelivery[]> {
  const subDeliveries = deliveries.get(subscriptionId) || [];
  return subDeliveries.slice(-limit);
}

export async function deliverWebhook(subscription: WebhookSubscription, payload: WebhookPayload): Promise<WebhookDelivery> {
  const idempotencyKey = payload.idempotencyKey;
  
  // Check idempotency
  const subDeliveries = deliveries.get(subscription.id) || [];
  const existing = subDeliveries.find(d => 
    d.idempotencyKey === idempotencyKey && 
    Date.now() - d.createdAt.getTime() < subscription.idempotencyWindowMs
  );
  
  if (existing) {
    console.log('[WEBHOOK] Duplicate detected, skipping:', idempotencyKey);
    return existing;
  }
  
  const delivery: WebhookDelivery = {
    id: genId('delivery'),
    subscriptionId: subscription.id,
    eventId: payload.id,
    attempt: 0,
    status: 'pending',
    idempotencyKey,
    createdAt: new Date(),
  };
  
  subDeliveries.push(delivery);
  deliveries.set(subscription.id, subDeliveries);
  
  // Attempt delivery with retries
  await attemptDelivery(subscription, delivery, payload);
  
  return delivery;
}

async function attemptDelivery(
  subscription: WebhookSubscription, 
  delivery: WebhookDelivery, 
  payload: WebhookPayload
): Promise<void> {
  const maxRetries = subscription.retryConfig.maxRetries;
  let delay = subscription.retryConfig.baseDelayMs;
  const maxDelay = subscription.retryConfig.maxDelayMs;
  const multiplier = subscription.retryConfig.backoffMultiplier;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    delivery.attempt = attempt + 1;
    
    try {
      const signature = signPayload(payload, subscription.auth.secret);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Contextly-Signature': signature,
        'X-Contextly-Event': payload.event,
        'X-Contextly-ID': payload.id,
        'X-Contextly-Timestamp': payload.timestamp,
        'X-Contextly-Idempotency-Key': payload.idempotencyKey,
        ...subscription.auth.headers,
      };
      
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        // In production, add timeout
      });
      
      delivery.responseCode = response.status;
      delivery.responseBody = await response.text().catch(() => '');
      delivery.completedAt = new Date();
      
      if (response.ok) {
        delivery.status = 'success';
        console.log('[WEBHOOK] Delivered successfully:', delivery.id);
        return;
      } else {
        throw new Error(`HTTP ${response.status}: ${delivery.responseBody}`);
      }
    } catch (error) {
      delivery.error = error instanceof Error ? error.message : String(error);
      
      if (attempt < maxRetries) {
        console.log(`[WEBHOOK] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
        await sleep(delay);
        delay = Math.min(delay * subscription.retryConfig.backoffMultiplier, subscription.retryConfig.maxDelayMs);
      } else {
        delivery.status = 'exhausted';
        delivery.completedAt = new Date();
        console.error('[WEBHOOK] All retries exhausted:', delivery.id);
      }
    }
  }
}

function signPayload(payload: WebhookPayload, secret: string): string {
  const payloadString = JSON.stringify(payload);
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Event Emitters - Called from context store
// ============================================

export async function emitContextCreated(entry: any, scope: string): Promise<void> {
  await emitEvent('context.created', { entry, scope });
}

export async function emitContextUpdated(entry: any, scope: string): Promise<void> {
  await emitEvent('context.updated', { entry, scope });
}

export async function emitContextDeleted(entryId: string, scope: string): Promise<void> {
  await emitEvent('context.deleted', { entryId, scope });
}

export async function emitConflictDetected(conflict: any, scope: string): Promise<void> {
  await emitEvent('conflict.detected', { conflict, scope });
}

export async function emitConflictResolved(resolution: any, scope: string): Promise<void> {
  await emitEvent('conflict.resolved', { resolution, scope });
}

export async function emitScopeForked(scope: string, parentScope: string): Promise<void> {
  await emitEvent('scope.forked', { scope, parentScope });
}

export async function emitScopeMerged(source: string, target: string, result: any): Promise<void> {
  await emitEvent('scope.merged', { source, target, result });
}

async function emitEvent(event: string, data: any): Promise<void> {
  const subscriptions = Array.from(subscriptions.values()).filter(s => 
    s.isActive && s.events.includes(event as any)
  );
  
  const payload: WebhookPayload = {
    id: `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    event: event as any,
    timestamp: new Date().toISOString(),
    data,
    idempotencyKey: `${event}_${data.entryId || data.scope || 'unknown'}_${Date.now()}`,
  };
  
  // Deliver to all matching subscriptions concurrently
  await Promise.allSettled(
    subscriptions.map(sub => deliverWebhook(sub, payload))
  );
}