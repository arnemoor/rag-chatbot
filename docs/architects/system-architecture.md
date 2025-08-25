# AutoRAG System Architecture

## Architecture Overview

AutoRAG is a simple proof-of-concept (PoC) implementation using Cloudflare's edge computing platform. This is a basic RAG system designed to demonstrate the core functionality of document-based AI assistance for library and academic collections.

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Global Network                │
│                    (275+ Edge Locations)                    │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────┐      ┌──────────▼──────┐      ┌─────────────────┐
│   Web UI    │─────▶│  CF Workers     │─────▶│  AutoRAG API    │
│  (Static)   │      │   (Backend)     │      │  (Managed RAG)  │
│             │      │                 │      │                 │
│ - Chat Widget      │ - Request Router       │ - Document Index      │
│ - Demo Pages       │ - Session Mgmt         │ - Vector Search       │
│ - Integration      │ - Model Selection      │ - Query Processing    │
└─────────────┘      └─────────────────┘      └─────────────────┘
                               │                       │
                               ▼                       ▼
                   ┌──────────────────┐      ┌─────────────────┐
                   │   AI Gateway     │      │   R2 Storage    │
                   │  (Multi-LLM)     │      │   (Documents)   │
                   │                  │      │                 │
                   │ - Model Routing        │ - File Storage        │
                   │ - OpenAI GPT-5         │ - Folder Organization │
                   │ - Anthropic Claude     │ - Library Documents   │
                   │ - Workers AI           │ - Multi-language      │
                   └──────────────────┘      └─────────────────┘
```

## Core Components

### 1. Frontend Layer (Cloudflare Pages)

#### Chat Widget
- **Web Component**: Embeddable `autorag-widget.js` with Shadow DOM isolation
- **Demo Page**: Simple test interface at `autorag-widget.pages.dev`
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility

#### Key Features
- Shadow DOM isolation preventing CSS conflicts
- LocalStorage for conversation persistence
- Mobile-responsive design
- Multi-language support (EN, DE, FR, IT)

### 2. API Layer (Cloudflare Workers)

#### Simple Request Processing
```typescript
// Core request flow
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CORS      │───▶│  Model      │───▶│  AutoRAG    │
│  Handling   │    │ Selection   │    │ Integration │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Response   │◀───│   Query     │◀───│  Document   │
│ Formatting  │    │ Processing  │    │  Retrieval  │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### Supported Models
- **Workers AI**: `@cf/meta/llama-3.1-8b-instruct-fast`, `@cf/meta/llama-3.2-3b-instruct`
- **OpenAI**: GPT-5 series via new Responses API
- **Anthropic**: Claude 4 Opus and Sonnet models

### 3. RAG Engine (Cloudflare AutoRAG)

#### Document Processing
- **Supported Formats**: Markdown (.md), PDF, DOCX, HTML
- **Chunking**: 512-token chunks with 50-token overlap
- **Embeddings**: BGE-base-en-v1.5 model
- **Languages**: English and German documents

#### Query Processing
Two processing paths:

**Path A: Workers AI (Integrated RAG)**
```typescript
async function processWithWorkersAI(query: string, context: Context) {
  const response = await env.AI.autorag(AUTORAG_ID).aiSearch({
    query: languageInstruction + query,
    system_prompt: buildSystemPrompt(context),
    filters: buildFilters(context),
    max_num_results: 5
  });
  
  return response;
}
```

**Path B: External Models (Separate Retrieval + Generation)**
```typescript
async function processWithExternalModel(query: string, context: Context) {
  // Step 1: Search documents
  const searchResults = await env.AI.autorag(AUTORAG_ID).search({
    query: query,
    filters: buildFilters(context),
    max_num_results: 5
  });
  
  // Step 2: Generate with external model
  const response = await callExternalModel(
    context.provider,
    context.model,
    systemPrompt,
    contextChunks,
    query
  );
  
  return response;
}
```

### 4. Document Organization

#### R2 Bucket Structure
```
R2 Bucket Structure:
your-bucket-name/
├── libraryonline/          # Library Management System
│   ├── librarian/          # Role-specific content
│   │   ├── en/
│   │   └── de/
│   ├── general/            # Shared content
│   │   ├── en/
│   │   └── de/
├── librarywin/          # Another Library Management System product
├── knowledgehub/           # Digital Library Portal
├── scholaraccess/          # Cloud-based Library System
└── general/                # Cross-product content
```

#### Access Control
Simple compound OR filter for multi-folder search:
```typescript
const filter = dignity === 'general' 
  ? {
      type: 'eq',
      key: 'folder',
      value: `${product}/general/${language}/`
    }
  : {
      type: 'or',
      filters: [
        {
          type: 'eq',
          key: 'folder',
          value: `${product}/${dignity}/${language}/`
        },
        {
          type: 'eq', 
          key: 'folder',
          value: `${product}/general/${language}/`
        }
      ]
    };
```

### 5. AI Gateway Integration

#### Provider Configuration
```typescript
const providers = {
  'workers-ai': {
    endpoint: 'Built-in via AI binding',
    models: ['@cf/meta/llama-3.1-8b-instruct-fast', '@cf/meta/llama-3.2-3b-instruct']
  },
  'openai': {
    endpoint: 'AI Gateway proxied',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-chat-latest']
  },
  'anthropic': {
    endpoint: 'AI Gateway proxied', 
    models: ['claude-opus-4-1-20250805', 'claude-sonnet-4-20250514']
  }
};
```

#### GPT-5 Integration
GPT-5 uses the new Responses API instead of Chat Completions:
```typescript
// GPT-5 uses different API structure
const response = await fetch(`${baseURL}/v1/responses`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: model,
    input: combinedInput,
    reasoning: {
      effort: 'low'
    },
    text: {
      verbosity: 'medium'
    }
  })
});
```

## Data Storage

### Cloudflare R2 (Document Storage)
- **Capacity**: Unlimited
- **Files**: PIS documentation in MD, PDF, DOCX formats
- **Organization**: Product/Role/Language hierarchy
- **Access**: Private bucket with Worker binding

### Vectorize (Vector Database)
- **Embeddings**: BGE-base-en-v1.5 (768 dimensions)
- **Search**: Cosine similarity with metadata filtering
- **Performance**: Sub-100ms query response
- **Filtering**: Support for compound OR filters

## Deployment Architecture

### Simple Deployment Model
This is a basic PoC with manual deployment:

1. **Worker Deployment**: `wrangler deploy` from `/worker` directory
2. **Widget Deployment**: `wrangler pages deploy` from `/widget` directory  
3. **Document Upload**: Manual upload via `upload-docs.sh` script
4. **Indexing**: Manual indexing through AutoRAG dashboard

### No Complex Infrastructure
This PoC does NOT include:
- ❌ CI/CD pipelines
- ❌ Staging environments
- ❌ Complex monitoring (Grafana, Prometheus)
- ❌ Automated testing frameworks
- ❌ Kubernetes or containerization
- ❌ Microservices architecture
- ❌ GraphQL APIs
- ❌ Analytics dashboards

## Performance Characteristics

### Response Times
```
Component Response Times:
├── Static Assets: 10-50ms (edge cache)
├── Worker Processing: 20-100ms (edge compute)
├── AutoRAG Search: 100-300ms (vector similarity)
├── Workers AI Generation: 200-500ms (on-device inference)
├── External AI Models: 500-2000ms (API latency)
└── Total E2E: 300ms-3s (depending on model)
```

### Scalability
- **Workers**: Automatically scale to handle concurrent requests
- **AutoRAG**: Managed service scaling
- **R2 Storage**: Unlimited capacity
- **Edge Distribution**: Global CDN automatically

## Security

### Basic Security Features
- **TLS**: All traffic encrypted via Cloudflare
- **API Keys**: Stored as Worker secrets
- **CORS**: Configured for widget access
- **Input Validation**: Basic sanitization in Worker
- **Private Storage**: R2 bucket not publicly accessible

### No Advanced Security
This PoC does NOT include:
- ❌ Complex authentication (SAML, OIDC)
- ❌ Rate limiting beyond basic Cloudflare protection
- ❌ Audit logging systems
- ❌ Advanced WAF rules
- ❌ Zero Trust architecture

## Monitoring

### Basic Monitoring
- **Health Check**: Simple `/health` endpoint
- **Cloudflare Analytics**: Built-in request metrics
- **Console Logging**: Basic error logging in Worker
- **Manual Monitoring**: Via Cloudflare dashboard

### No Complex Monitoring
This PoC does NOT include:
- ❌ Prometheus/Grafana stack
- ❌ Custom alerting systems  
- ❌ APM (Application Performance Monitoring)
- ❌ Log aggregation systems
- ❌ Business intelligence dashboards

## Document Content

### Library Management Systems (LMS)
The documents in this PoC are focused on library IT systems:

- **LibraryOnline**: Web-based library management system
- **Librarywin**: Desktop library software  
- **KnowledgeHub (Digital Library Portal)**: Integration platform
- **ScholarAccess**: Cloud-based Library Management System solution

### NOT Academic Content
The documents are about software systems, NOT:
- ❌ Research procedures
- ❌ Academic content
- ❌ Study guidelines
- ❌ Patron service protocols

## Limitations of this PoC

This is a simple proof-of-concept with the following limitations:

1. **Manual Operations**: No automation for deployment or maintenance
2. **Basic Error Handling**: Simple error messages, no sophisticated error recovery
3. **Limited Monitoring**: No proactive alerting or detailed analytics
4. **No Staging**: Direct deployment to production
5. **Simple Auth**: No user authentication or authorization
6. **Basic Caching**: Limited to Cloudflare's default caching
7. **No Backup Strategy**: Relies on Cloudflare's built-in redundancy
8. **Limited Testing**: No automated test suites
9. **Basic Documentation**: Minimal operational procedures
10. **No SLA**: Best-effort availability

This architecture provides a functional RAG system for demonstrating AI-powered support for Library Management Systems, but would require significant enhancement for production use in an academic environment.