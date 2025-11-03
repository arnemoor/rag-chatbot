/**
 * Security Middleware Module
 * 
 * FRAMEWORK NOTE: This is an open-source framework designed for evaluation and showcase.
 * Security features are OPTIONAL and can be enabled via environment variables.
 * By default, the framework runs in permissive mode to facilitate testing and evaluation.
 * 
 * Available security options (all disabled by default):
 * - Rate limiting: Set ENABLE_RATE_LIMITING=true
 * - Strict CSP: Set ENABLE_STRICT_CSP=true
 * - CORS restrictions: Set ALLOWED_ORIGINS
 * 
 * For production deployments, review and enable appropriate security features.
 */

import { Env } from '../types';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message: string; // Error message when limit exceeded
}

// Request tracking for rate limiting
const requestCounts = new Map<string, { count: number; timestamp: number }>();

// Security headers configuration
export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Get client identifier for rate limiting
 * Uses CF-Connecting-IP header or falls back to a hash of request headers
 */
function getClientIdentifier(request: Request): string {
  // Try to get real IP from Cloudflare headers
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;
  
  // Fallback to a combination of headers for identification
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const acceptLanguage = request.headers.get('Accept-Language') || 'unknown';
  const sessionId = request.headers.get('X-Session-Id') || 'unknown';
  
  return `${userAgent}-${acceptLanguage}-${sessionId}`;
}

/**
 * Rate limiting middleware
 * Implements per-client request rate limiting (OPTIONAL - disabled by default)
 */
export async function checkRateLimit(
  request: Request,
  env: Env,
  config?: RateLimitConfig,
  corsHeaders?: Record<string, string>
): Promise<Response | null> {
  // Rate limiting is opt-in for this framework
  if (env.ENABLE_RATE_LIMITING !== 'true') {
    return null; // Skip rate limiting by default
  }

  // Use configured values or defaults
  const effectiveConfig = config || {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS || '120'),
    message: 'Too many requests, please try again later'
  };
  const clientId = getClientIdentifier(request);
  const now = Date.now();

  // Clean up old entries (older than 5 minutes)
  const cleanupThreshold = now - 5 * 60 * 1000;
  for (const [key, value] of requestCounts.entries()) {
    if (value.timestamp < cleanupThreshold) {
      requestCounts.delete(key);
    }
  }

  // Get or create client record
  const clientRecord = requestCounts.get(clientId);

  if (!clientRecord) {
    // First request from this client
    requestCounts.set(clientId, { count: 1, timestamp: now });
    return null;
  }

  // Check if window has expired
  if (now - clientRecord.timestamp > effectiveConfig.windowMs) {
    // Reset the window
    requestCounts.set(clientId, { count: 1, timestamp: now });
    return null;
  }

  // Increment request count
  clientRecord.count++;

  // Check if limit exceeded
  if (clientRecord.count > effectiveConfig.maxRequests) {
    return new Response(
      JSON.stringify({
        error: effectiveConfig.message,
        retryAfter: Math.ceil((clientRecord.timestamp + effectiveConfig.windowMs - now) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((clientRecord.timestamp + effectiveConfig.windowMs - now) / 1000)),
          'X-RateLimit-Limit': String(effectiveConfig.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(new Date(clientRecord.timestamp + effectiveConfig.windowMs).toISOString()),
          ...(corsHeaders || {})
        }
      }
    );
  }

  // Update the record
  requestCounts.set(clientId, clientRecord);

  return null;
}

/**
 * Check request size limits
 * Prevents DoS attacks via large payloads (always enabled for stability)
 */
export async function checkRequestSize(
  request: Request,
  env: Env,
  maxSizeBytes?: number,
  corsHeaders?: Record<string, string>
): Promise<Response | null> {
  // Use configured value or default (request size check is always enabled for stability)
  const maxSize = maxSizeBytes || parseInt(env.MAX_REQUEST_SIZE_KB || '100') * 1024;
  const contentLength = request.headers.get('Content-Length');

  if (contentLength && parseInt(contentLength) > maxSize) {
    return new Response(
      JSON.stringify({
        error: 'Request body too large',
        maxSize: `${Math.floor(maxSize / 1024 / 1024)}MB`,
        actualSize: `${Math.floor(parseInt(contentLength) / 1024 / 1024)}MB`
      }),
      {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
          ...(corsHeaders || {})
        }
      }
    );
  }

  // For requests without Content-Length header, check the actual body size
  if (request.body) {
    try {
      const bodyText = await request.clone().text();
      if (bodyText.length > maxSize) {
        return new Response(
          JSON.stringify({
            error: 'Request body too large',
            maxSize: `${Math.floor(maxSize / 1024 / 1024)}MB`
          }),
          {
            status: 413,
            headers: {
              'Content-Type': 'application/json',
              ...(corsHeaders || {})
            }
          }
        );
      }
    } catch (error) {
      console.error('Error checking request size:', error);
      // Continue processing if we can't determine size
    }
  }

  return null;
}

/**
 * Build security headers
 * By default, provides basic security headers suitable for a framework/showcase.
 * Enable ENABLE_STRICT_CSP for production-grade security headers.
 */
export function buildSecurityHeaders(env: Env): SecurityHeaders {
  const headers: SecurityHeaders = {
    // Basic security headers (always enabled for good practice)
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  
  // Check if strict security is enabled
  if (env.ENABLE_STRICT_CSP === 'true') {
    // Production-grade security headers (opt-in)
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // Allow CDN for DOMPurify
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ');
    
    // Strict Transport Security (HSTS)
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    
    // Prevent clickjacking
    headers['X-Frame-Options'] = 'DENY';
    
    // Permissions Policy
    headers['Permissions-Policy'] = [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()'
    ].join(', ');
    
    // Additional strict headers
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['X-Download-Options'] = 'noopen';
    headers['X-DNS-Prefetch-Control'] = 'off';
  } else {
    // Permissive CSP for framework/showcase (default)
    // This allows the widget to be embedded anywhere and work with various setups
    headers['Content-Security-Policy'] = [
      "default-src 'self' *",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
      "style-src 'self' 'unsafe-inline' *",
      "img-src 'self' data: *",
      "font-src 'self' data: *",
      "connect-src 'self' *",
      "frame-ancestors *" // Allow embedding anywhere
    ].join('; ');
    
    // Allow framing for showcase/demo purposes
    headers['X-Frame-Options'] = 'ALLOWALL';
  }
  
  return headers;
}

/**
 * Validate and sanitize request headers
 * Removes potentially dangerous headers
 */
export function sanitizeRequestHeaders(headers: Headers): Headers {
  const sanitized = new Headers();
  const dangerousHeaders = [
    'x-forwarded-host',
    'x-forwarded-server',
    'x-rewrite-url'
  ];
  
  headers.forEach((value, key) => {
    // Skip dangerous headers
    if (dangerousHeaders.includes(key.toLowerCase())) {
      return;
    }
    
    // Limit header value length
    if (value.length > 8192) {
      console.warn(`Header ${key} exceeds maximum length, truncating`);
      sanitized.set(key, value.substring(0, 8192));
    } else {
      sanitized.set(key, value);
    }
  });
  
  return sanitized;
}

/**
 * Apply security middleware checks
 * By default, only applies minimal checks for stability.
 * Enable specific security features via environment variables.
 */
export async function applySecurityChecks(
  request: Request,
  env: Env,
  corsHeaders?: Record<string, string>
): Promise<Response | null> {
  // Rate limiting is optional (disabled by default for showcase)
  if (env.ENABLE_RATE_LIMITING === 'true' && !request.url.includes('/health')) {
    const rateLimitResponse = await checkRateLimit(request, env, undefined, corsHeaders);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Request size check with higher limit for file uploads
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const url = new URL(request.url);
    // Use larger limit for file uploads (100MB default), smaller for other requests (100KB default)
    const maxSize = url.pathname === '/r2/upload'
      ? parseInt(env.MAX_UPLOAD_SIZE_MB || '100') * 1024 * 1024
      : parseInt(env.MAX_REQUEST_SIZE_KB || '100') * 1024;

    const sizeResponse = await checkRequestSize(request, env, maxSize, corsHeaders);
    if (sizeResponse) {
      return sizeResponse;
    }
  }

  return null;
}

