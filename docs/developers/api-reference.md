# AutoRAG API Reference

## Quick Reference - All Endpoints

### Chat Endpoints
- `POST /` or `/chat` or `/api/chat` - Send chat message
- `GET /health` - Health check

### Configuration Endpoints
- `GET /config` - Get full configuration
- `GET /config/languages` - List available languages
- `GET /config/categories` - List available categories
- `GET /config/products?category={category}` - List products for category
- `GET /config/providers` - List AI providers
- `GET /config/models?provider={provider}` - List models for provider
- `POST /config/refresh` - Refresh cached configuration

### R2 Storage Endpoints (Admin)
- `GET /r2/list` - List R2 bucket contents
- `GET /r2/get/:key` - Download file from R2
- `POST /r2/upload` - Upload file to R2 (multipart/form-data)
- `DELETE /r2/delete/:key` - Delete file from R2
- `POST /r2/folder` - Create folder in R2

## API Overview

This system provides:
1. **Worker Chat API** - High-level interface for chat interactions
2. **Configuration API** - Dynamic configuration discovery
3. **R2 Management API** - Document storage management

## Chat API (Primary Interface)

### Base URL
```
Production: https://your-worker-name.your-subdomain.workers.dev
Health Check: https://your-worker-name.your-subdomain.workers.dev/health
```

### Authentication
No authentication required. API keys for external models are managed internally via Worker secrets.

### Rate Limits
**Not implemented in this PoC.** The API has no rate limiting - relies on Cloudflare's basic DDoS protection only.

## Chat Endpoints

### POST / (Chat Completion)

Send a chat message and receive an AI response with citations.

#### Request Format
```json
{
  "query": "Your question here",
  "language": "en|de|fr|it",
  "provider": "workers-ai|openai|anthropic",
  "model": "model-identifier",
  "sessionId": "optional-session-uuid"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | User's question (max 2000 characters) |
| `language` | string | Yes | Response language (loaded from R2/config) |
| `category` | string | Yes | Document category (loaded from R2 structure) |
| `product` | string | Yes | Product within category (loaded from R2 structure) |
| `provider` | string | Yes | AI provider selection (from config) |
| `model` | string | Yes | Specific AI model identifier (from config) |
| `sessionId` | string | No | Session UUID for conversation continuity |

#### Example Request
```bash
curl -X POST https://your-worker-name.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I configure database connection for LibraryOnline?",
    "language": "en",
    "category": "technology",
    "product": "libraryonline",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "sessionId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

#### Response Format
```json
{
  "text": "To configure the database connection in LibraryOnline:\n\n1. Navigate to Settings > Database Configuration\n2. Enter your database server details...",
  "citations": [
    {
      "filename": "database-configuration.md",
      "relevance": 0.95,
      "snippet": "Database configuration requires the following parameters..."
    },
    {
      "filename": "admin-guide.pdf", 
      "relevance": 0.87,
      "snippet": "For administrators setting up LibraryOnline..."
    }
  ],
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "metadata": {
    "provider": "openai",
    "model": "gpt-5-mini",
    "responseTime": 1847,
    "language": "en",
    "category": "fiction",
    "product": "novels",
    "product": "libraryonline"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | AI-generated response text |
| `citations` | array | Source documents used for the response |
| `sessionId` | string | Session identifier for conversation continuity |
| `metadata` | object | Response metadata including performance metrics |

#### Citation Object
```json
{
  "filename": "document-name.pdf",
  "relevance": 0.95,
  "snippet": "First 100 characters of relevant content..."
}
```

#### Metadata Object
```json
{
  "provider": "openai",
  "model": "gpt-5-mini", 
  "responseTime": 1847,
  "language": "en",
  "dignity": "administrator",
  "product": "libraryonline",
  "tokenUsage": {
    "input": 245,
    "output": 156,
    "total": 401
  }
}
```

### GET /health (Health Check)

Check the status of the API.

#### Response Format
```json
{
  "status": "healthy",
  "timestamp": "2024-12-20T10:30:00Z",
  "version": "1.0.0"
}
```

#### Debug Mode Response (when DEBUG_MODE="true")
```json
{
  "status": "healthy",
  "timestamp": "2024-12-20T10:30:00Z",
  "version": "1.0.0",
  "debug": {
    "environment": "development",
    "config": {
      "r2_bucket": "Configured",
      "autorag_instance": "Configured",
      "ai_gateway": "Configured",
      "cors_mode": "Restricted",
      "allowed_origins": ["http://localhost:3000"]
    }
  }
}
```

## AI Model Configuration

### Available Models by Provider

#### Workers AI (Free Tier)
```json
{
  "provider": "workers-ai",
  "models": [
    {
      "id": "@cf/meta/llama-3.2-3b-instruct",
      "name": "Llama 3.2 3B",
      "cost": "free",
      "speed": "fast",
      "quality": "good"
    },
    {
      "id": "@cf/meta/llama-3.1-8b-instruct-fast",
      "name": "Llama 3.1 8B Fast",
      "cost": "free",
      "speed": "very fast",
      "quality": "better"
    }
  ]
}
```

#### OpenAI
```json
{
  "provider": "openai",
  "models": [
    {
      "id": "gpt-5",
      "name": "GPT-5",
      "cost": "$1.25/$10 per MTok",
      "speed": "medium",
      "quality": "excellent"
    },
    {
      "id": "gpt-5-mini",
      "name": "GPT-5 Mini", 
      "cost": "$0.25/$2 per MTok",
      "speed": "fast",
      "quality": "very good"
    },
    {
      "id": "gpt-5-nano",
      "name": "GPT-5 Nano",
      "cost": "$0.05/$0.40 per MTok",
      "speed": "very fast",
      "quality": "good"
    },
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "cost": "$2.50/$10 per MTok",
      "speed": "medium",
      "quality": "excellent"
    },
    {
      "id": "gpt-4o-mini",
      "name": "GPT-4o Mini",
      "cost": "$0.15/$0.60 per MTok",
      "speed": "fast",
      "quality": "very good"
    }
  ]
}
```

#### Anthropic
```json
{
  "provider": "anthropic",
  "models": [
    {
      "id": "claude-opus-4-1-20250805",
      "name": "Claude Opus 4.1",
      "cost": "$15/$75 per MTok",
      "speed": "slow",
      "quality": "best"
    },
    {
      "id": "claude-sonnet-4-20250514",
      "name": "Claude Sonnet 4",
      "cost": "$3/$15 per MTok",
      "speed": "fast", 
      "quality": "excellent"
    }
  ]
}
```

## Error Handling

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request format or parameters |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | System error |
| 503 | Service Unavailable | Temporary service outage |

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The 'query' parameter is required",
    "details": {
      "field": "query",
      "value": null,
      "expected": "non-empty string"
    }
  },
  "timestamp": "2024-12-20T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INVALID_REQUEST` | Missing or invalid parameters | Check request format and required fields |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement request throttling |
| `MODEL_UNAVAILABLE` | Selected AI model is not available | Choose a different model or provider |
| `INDEXING_IN_PROGRESS` | Documents are still being indexed | Wait for indexing to complete |
| `NO_DOCUMENTS_FOUND` | No relevant documents for query | Check document upload and indexing |
| `PROVIDER_ERROR` | External AI provider error | Try different provider or model |

## SDKs and Client Libraries

### JavaScript/TypeScript
```typescript
class AutoRAGClient {
  private baseURL: string;
  private defaultConfig: Partial<ChatRequest>;
  
  constructor(config: {
    baseURL?: string;
    defaults?: Partial<ChatRequest>;
  } = {}) {
    this.baseURL = config.baseURL || 'https://your-worker-name.your-subdomain.workers.dev';
    this.defaultConfig = config.defaults || {};
  }
  
  async chat(query: string, options: Partial<ChatRequest> = {}): Promise<ChatResponse> {
    const request: ChatRequest = {
      ...this.defaultConfig,
      ...options,
      query
    };
    
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new AutoRAGError(error.error.message, error.error.code);
    }
    
    return response.json();
  }
  
  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }
}

// Usage
const client = new AutoRAGClient({
  defaults: {
    language: 'en',
    category: 'fiction',
    product: 'novels',
    product: 'libraryonline',
    provider: 'openai',
    model: 'gpt-5-mini'
  }
});

const response = await client.chat('How do I reset a user password?');
console.log(response.text);
```

### Python
```python
import requests
from typing import Optional, Dict, Any

class AutoRAGClient:
    def __init__(self, base_url: str = None, defaults: Dict[str, Any] = None):
        self.base_url = base_url or 'https://your-worker-name.your-subdomain.workers.dev'
        self.defaults = defaults or {}
    
    def chat(self, query: str, **kwargs) -> Dict[str, Any]:
        """Send a chat request to AutoRAG API."""
        request_data = {
            **self.defaults,
            **kwargs,
            'query': query
        }
        
        response = requests.post(
            self.base_url,
            json=request_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if not response.ok:
            error_data = response.json()
            raise AutoRAGError(error_data['error']['message'], error_data['error']['code'])
        
        return response.json()
    
    def health(self) -> Dict[str, Any]:
        """Check API health status."""
        response = requests.get(f"{self.base_url}/health")
        return response.json()

class AutoRAGError(Exception):
    def __init__(self, message: str, code: str):
        self.message = message
        self.code = code
        super().__init__(f"{code}: {message}")

# Usage
client = AutoRAGClient(defaults={
    'language': 'en',
    'category': 'fiction',
    'product': 'novels',
    'product': 'libraryonline',
    'provider': 'openai',
    'model': 'gpt-5-mini'
})

response = client.chat("How do I configure database settings?")
print(response['text'])
```

### cURL Examples

#### Basic Chat Request
```bash
curl -X POST https://your-worker-name.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the system requirements for LibraryOnline?",
    "language": "en",
    "category": "fiction",
    "product": "novels",
    "product": "libraryonline",
    "provider": "workers-ai",
    "model": "@cf/meta/llama-3.1-8b-instruct-fast"
  }'
```

#### Multi-language Request
```bash
curl -X POST https://your-worker-name.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Wie konfiguriere ich die Datenbankverbindung?",
    "language": "de",
    "category": "fiction",
    "product": "novels",
    "product": "libraryonline",
    "provider": "openai",
    "model": "gpt-5-mini"
  }'
```

#### Using Premium Model
```bash
curl -X POST https://your-worker-name.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain the complete patron data migration process from Librarywin to KnowledgeHub",
    "language": "en",
    "category": "fiction",
    "product": "novels", 
    "product": "knowledgehub",
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514"
  }'
```

#### Health Check
```bash
curl https://your-worker-name.your-subdomain.workers.dev/health
```

## Advanced Usage

### Session Management
```javascript
class ChatSession {
  constructor(client, sessionConfig) {
    this.client = client;
    this.sessionId = this.generateSessionId();
    this.config = sessionConfig;
    this.history = [];
  }
  
  async sendMessage(query) {
    const response = await this.client.chat(query, {
      ...this.config,
      sessionId: this.sessionId
    });
    
    this.history.push({
      query,
      response: response.text,
      timestamp: new Date().toISOString(),
      citations: response.citations
    });
    
    return response;
  }
  
  getHistory() {
    return this.history;
  }
  
  generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Usage
const session = new ChatSession(client, {
  language: 'en',
  dignity: 'librarian',
  product: 'libraryonline',
  provider: 'openai',
  model: 'gpt-5-mini'
});

await session.sendMessage("What is LibraryOnline?");
await session.sendMessage("How do I install it?");
console.log(session.getHistory());
```

### Batch Processing
```javascript
async function processBatchQueries(queries, config) {
  const results = [];
  
  // Process in batches to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    
    const batchPromises = batch.map(query => 
      client.chat(query, config).catch(error => ({
        query,
        error: error.message
      }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting delay
    if (i + batchSize < queries.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Usage
const queries = [
  "What is LibraryOnline?",
  "How do I install Librarywin?",
  "What are the KnowledgeHub system requirements?",
  "How do I configure ScholarAccess?"
];

const results = await processBatchQueries(queries, {
  language: 'en',
  category: 'fiction',
  product: 'novels',
  product: 'general',
  provider: 'workers-ai',
  model: '@cf/meta/llama-3.1-8b-instruct-fast'
});
```

### Error Retry Logic
```javascript
class AutoRAGClientWithRetry extends AutoRAGClient {
  async chatWithRetry(query, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.chat(query, options);
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors
        if (error.code && error.code.startsWith('INVALID_')) {
          throw error;
        }
        
        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}
```

## Cloudflare AutoRAG Direct API

For advanced use cases, you can access the Cloudflare AutoRAG API directly.

### AI Search (Full RAG Pipeline)
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/autorag/rags/{AUTORAG_ID}/ai-search" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "database configuration",
    "system_prompt": "You are a technical support assistant...",
    "filters": {
      "type": "eq",
      "key": "folder", 
      "value": "libraryonline/administrator/en/"
    },
    "max_num_results": 5,
    "model": "@cf/meta/llama-3.1-8b-instruct-fast"
  }'
```

### Search Only (For External LLMs)
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/autorag/rags/{AUTORAG_ID}/search" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "database configuration",
    "filters": {
      "type": "eq",
      "key": "folder",
      "value": "libraryonline/administrator/en/"
    },
    "max_num_results": 5,
    "ranking_options": {
      "score_threshold": 0.4
    }
  }'
```

### Trigger Indexing
```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/autorag/rags/{AUTORAG_ID}/sync" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json"
```

## Best Practices

### Request Optimization
- **Cache Results**: Cache responses for frequently asked questions
- **Batch Requests**: Group similar requests when possible
- **Choose Appropriate Models**: Use faster models for simple queries
- **Session Management**: Use sessionId for conversation continuity

### Error Handling
- **Implement Retries**: Retry on temporary errors with exponential backoff
- **Graceful Degradation**: Fall back to simpler responses on errors
- **User Feedback**: Provide clear error messages to users
- **Monitor Health**: Regular health checks to detect issues early

### Performance
- **Model Selection**: Choose models based on speed/quality requirements
- **Request Size**: Keep queries under 2000 characters for best performance
- **Concurrent Requests**: Respect rate limits (100 requests/minute)
- **Caching**: Implement client-side caching for repeated queries

### Security
- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Implement client-side rate limiting
- **Error Sanitization**: Don't expose internal error details to users
- **HTTPS Only**: Always use HTTPS for API requests

## Cloudflare AutoRAG Direct API Reference

### AI Search API (Full RAG Pipeline)
Used internally by the Worker. Performs search and generation in a single call.

**Worker Binding Usage:**
```typescript
const response = await env.AI.autorag(env.AUTORAG_INSTANCE).aiSearch({
  query: "string",
  system_prompt: "string",  // Note: system_prompt, not generation_system_prompt
  filters: {
    type: "or",
    filters: [
      {"type": "eq", "key": "folder", "value": "product/general/en/"}
    ]
  },
  max_num_results: 5,
  model: "@cf/meta/llama-3.1-8b-instruct-fast"
});
```

### Search API (Retrieval Only)
For external model generation, retrieves chunks without generation.

**Worker Binding Usage:**
```typescript
const searchResults = await env.AI.autorag(env.AUTORAG_INSTANCE).search({
  query: "string",
  filters: {
    type: "eq",
    key: "folder",
    value: "category/product/language/"
  },
  max_num_results: 5
});
```

### Compound OR Filters (Critical Discovery)
To search multiple folders simultaneously, use compound OR filters:

```typescript
const filter = {
  type: "or",
  filters: [
    { type: "eq", key: "folder", value: "libraryonline/general/en/" },
    { type: "eq", key: "folder", value: "libraryonline/librarian/en/" }
  ]
};
```

This API reference provides documentation for both the Worker Chat API we built and the underlying Cloudflare AutoRAG APIs.