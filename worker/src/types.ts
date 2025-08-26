export interface Env {
  // Bindings
  AI: any; // Cloudflare AI binding
  R2_BUCKET: R2Bucket;
  SESSIONS?: KVNamespace;

  // Environment variables
  AUTORAG_INSTANCE: string;
  GATEWAY_NAME?: string;
  ENVIRONMENT: string;

  // Optional configuration
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins for CORS
  DEBUG_MODE?: string; // 'true' to enable debug info in health endpoint

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
