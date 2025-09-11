export interface Env {
  // Bindings
  AI: any; // Cloudflare AI binding
  R2_BUCKET: R2Bucket;
  SESSIONS?: KVNamespace;

  // Environment variables
  AUTORAG_INSTANCE: string;
  AUTORAG_INSTANCE_ID?: string; // Alternative name for AUTORAG_INSTANCE
  GATEWAY_NAME?: string;
  ENVIRONMENT: string;
  CLOUDFLARE_ACCOUNT_ID?: string; // Cloudflare account ID for API calls
  CLOUDFLARE_API_TOKEN?: string; // Cloudflare API token for management operations

  // Security Configuration (all optional - framework defaults to permissive for showcase)
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins for CORS (empty = allow all)
  ENABLE_RATE_LIMITING?: string; // 'true' to enable rate limiting (default: false for showcase)
  RATE_LIMIT_WINDOW_MS?: string; // Rate limit window in milliseconds (default: 60000)
  RATE_LIMIT_MAX_REQUESTS?: string; // Max requests per window (default: 120)
  ENABLE_STRICT_CSP?: string; // 'true' to enable strict Content Security Policy (default: false)
  MAX_REQUEST_SIZE_KB?: string; // Max request size in KB (default: 100)
  
  // Debug & Monitoring
  DEBUG_MODE?: string; // 'true' to enable debug info in health endpoint
  
  // Runtime flags (internal use)
  CORS_WARNING_LOGGED?: string; // Internal flag to prevent repeated CORS logs

  // Secrets
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

export interface ChatRequest {
  query: string;
  language?: 'de' | 'fr' | 'it' | 'en';
  category?: string;
  product?: string;
  provider?: string;
  model?: string;
  sessionId?: string;
}

export interface ChatResponse {
  text: string;
  citations: Citation[];
  sessionId: string;
  metadata?: {
    provider: string;
    model: string;
    responseTime: number;
    language: string;
  };
}

export interface Citation {
  filename: string;
  relevance: number;
  snippet?: string;
}

export interface SessionData {
  id: string;
  language: string;
  category: string;
  product: string;
  history: Array<{
    query: string;
    response: string;
    timestamp: number;
  }>;
}
