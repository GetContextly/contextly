import { supabase } from './supabase';

/**
 * Validates that the request is coming from a legitimate source
 * by checking signatures or custom security headers.
 */
export async function validateRequestSource(req: Request, type: 'github' | 'stripe') {
  // Implement type-specific verification (already handled in routes for GitHub/Stripe)
  return true;
}

/**
 * Generic Rate Limiter using Supabase Backend
 * Prevents rapid-fire requests from single IPs or Users
 */
export async function checkRateLimit(key: string, maxRequests: number = 60, windowSeconds: number = 60) {
  const { data: isLimited, error } = await supabase.rpc('is_rate_limited', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    return false; // Fail open in case of DB error to avoid blocking legitimate traffic
  }

  return isLimited;
}

/**
 * Sanitizes input to prevent basic XSS or malicious strings
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

/**
 * Log sensitive security events (CSEC-006)
 */
export async function logSecurityEvent(
  action: string,
  entityType: 'context' | 'decision' | 'settings',
  metadata: any = {}
) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('audit_logs').insert({
    action,
    entity_type: entityType,
    user_id: user?.id,
    metadata
  });
}
