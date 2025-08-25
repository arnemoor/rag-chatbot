# AutoRAG Development Guide

<!-- Consolidated from /CLAUDE.md, /IMPLEMENTATION_PLAN.md, /QUICKSTART.md -->

## Project Overview

This is a proof-of-concept (PoC) for a multilingual support chatbot using Cloudflare AutoRAG and AI Gateway. The system provides retrieval-augmented generation (RAG) capabilities for answering user questions based on internal documentation stored in Cloudflare R2.

## Key Technologies

- **Cloudflare AutoRAG**: Fully managed RAG solution for document ingestion, indexing, and retrieval
- **Cloudflare R2**: Object storage for documents (PDFs, Markdown, CSV, DOCX, XLSX, HTML, images)
- **Cloudflare Workers**: Serverless compute for the backend API
- **Cloudflare AI Gateway**: Routing layer for multiple LLM providers
- **Cloudflare Vectorize**: Vector database for storing document embeddings
- **Workers AI**: Default LLM provider for embeddings and generation

## Quick Start Setup

### 🚀 One-Command Setup

```bash
./scripts/setup.sh
```

This will:
1. Install dependencies
2. Deploy the Worker
3. Deploy the frontend
4. Create sample documents
5. Upload them to R2

### Manual Setup

#### 1. Install Dependencies
```bash
cd worker
npm install
```

#### 2. Deploy Worker
```bash
cd worker
wrangler deploy
```

#### 3. Deploy Frontend (Widget)
```bash
cd widget
npm install
npm run build
npm run deploy
```

#### 4. Add API Keys (for External Models)
```bash
cd worker
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

## Architecture Components

### Document Ingestion Flow
1. Documents are uploaded to R2 bucket organized by product/dignity folders
2. AutoRAG automatically indexes new/updated files (manual trigger required)
3. Files are converted to Markdown, chunked, and embedded
4. Embeddings stored in Vectorize with metadata (folder path, filename)

### Query Processing Flow
1. User selects dignity, product, and language
2. Session-specific system prompts are constructed
3. Retrieval via either:
   - `aiSearch()` for Workers AI models (single call)
   - `search()` + external model via AI Gateway for other providers
4. Multitenancy filtering by folder metadata
5. Response generation with citations

## Development Commands

```bash
# Install dependencies
npm install

# Run local development server
wrangler dev

# Deploy to Cloudflare
wrangler deploy

# Tail logs
wrangler tail

# Upload documents to R2
wrangler r2 object put your-bucket-name/product/role/language/file.md \
  --file=./sample-documents/product/role/language/file.md
```

## Project Structure

```
cf-chatbot-widget/
├── worker/                 # Cloudflare Worker backend
│   ├── src/
│   │   ├── index.ts       # Main worker entry
│   │   ├── models.ts      # Model configurations
│   │   ├── prompts.ts     # Prompt templates
│   │   └── types.ts       # TypeScript types
│   ├── wrangler.toml      # Worker config
│   └── package.json
│
├── widget/                # Web Component widget
│   ├── src/
│   │   └── autorag-widget.js  # Shadow DOM component
│   ├── dist/              # Built files
│   └── demo/              # Demo page
│
├── sample-documents/      # PIS documentation
│   ├── libraryonline/
│   ├── librarywin/
│   ├── knowledgehub/
│   ├── scholaraccess/
│   └── general/
│
└── scripts/              # Automation scripts
    ├── setup.sh          # One-click setup
    └── upload-pis-documents.sh  # Bulk document upload
```

## Implementation Phases (Completed)

### Phase 1: Core Infrastructure ✓
- Set up R2 bucket with folder structure for products/dignities
- Configure AutoRAG instance
- Implement basic Worker with AutoRAG binding

### Phase 2: Session Management ✓
- Implement session-based system prompts
- Add language selection (DE, EN)
- Add dignity/product filtering

### Phase 3: Multi-Model Support ✓
- Integrate AI Gateway
- Implement model selection
- Add external provider support (OpenAI GPT-5, Anthropic Claude 4)

### Phase 4: UI Development ✓
- Create embeddable widget with Shadow DOM
- Add model/language/dignity selectors
- Implement "New Session" functionality
- Display citations with responses

## Key Configuration Points

### AutoRAG Configuration
- Chunk size and overlap settings
- Query rewrite prompts
- Generation system prompts
- Metadata filters for multitenancy

### Worker Environment Variables
```toml
# wrangler.toml
[vars]
AUTORAG_INSTANCE = "your-autorag-instance"

# Secrets (add via wrangler secret put)
OPENAI_API_KEY = "sk-..."
ANTHROPIC_API_KEY = "sk-ant-..."
```

### Your Cloudflare Resources
Based on your setup:
- **R2 Bucket**: `your-bucket-name`
- **AutoRAG Instance**: `your-autorag-instance`
- **AI Gateway**: `your-gateway`
- **Vector DB**: `autorag-your-autorag-instance`

## Testing Approach

1. **Document Ingestion**: Verify all file types are properly indexed
2. **Multitenancy**: Test folder-based filtering works correctly
3. **Language Support**: Validate responses in all supported languages
4. **Model Comparison**: Test latency and accuracy across different providers
5. **Citation Accuracy**: Ensure all responses include proper document references

## Common Issues & Solutions

### AutoRAG not indexing
```bash
# Solution: Manual trigger in dashboard
# Navigate to AI > AutoRAG > Index Documents
```

### CORS errors
```typescript
// Solution: Add headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

### GPT-5 not working
```typescript
// Solution: Use the Responses API, not Chat Completions
const url = 'https://api.openai.com/v1/responses'; // NOT /v1/chat/completions
const body = {
  model: 'gpt-5',
  input: prompt,  // NOT messages
  reasoning: { effort: 'low' },
  text: { verbosity: 'medium' }
};
```

## Security Considerations

- No API keys or secrets exposed on client side
- Use Worker environment variables for sensitive data
- Implement least-privilege access for R2 and AutoRAG
- Ensure AI Gateway logs don't store PII

## Demo Script

1. **Basic Query**: "What are the features of LibraryOnline?"
2. **Language Switch**: Change to German, ask same question
3. **Dignity Filter**: Switch between librarian/researcher, show different results
4. **Model Switch**: Compare Workers AI vs GPT-5 response
5. **Citations**: Click source to show document name

## Pro Tips for Development

1. **Use Wrangler Tail**: Real-time logs for debugging
   ```bash
   wrangler tail --format pretty
   ```

2. **Test in Dashboard**: Use AutoRAG Playground for quick tests

3. **Deploy Often**: Get public URL early for testing

4. **Manual Indexing**: Remember to trigger indexing after uploading docs

5. **Check AI Gateway Logs**: Monitor model usage and costs

## What This PoC Does NOT Include

- Authentication system
- Admin interface
- Document upload UI
- Usage analytics dashboard
- Production error handling
- Automated testing
- CI/CD pipelines
- Monitoring/alerting
- Automated backups