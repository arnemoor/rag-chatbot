# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the MIT-licensed production version of the AutoRAG chatbot, migrated from the auto-rag-clean prototype. It provides a multilingual support chatbot using Cloudflare AutoRAG and AI Gateway with retrieval-augmented generation (RAG) capabilities for answering user questions based on internal documentation stored in Cloudflare R2.

## Migration Status from auto-rag-clean

### Completed
- Initial project structure setup with MIT license
- Core dependencies and configuration files
- Base directory structure (widget/, worker/, scripts/, docs/, examples/)
- Sample documents directory for testing

### In Progress
- Migrating widget implementation to production-ready code
- Worker API implementation with clean architecture
- Documentation consolidation and cleanup
- Security hardening and XSS prevention

### Pending
- Full test suite implementation
- CI/CD pipeline setup
- Production deployment configuration
- Performance optimization
- Accessibility compliance (WCAG 2.1 AA)

## Key Technologies

- **Cloudflare AutoRAG**: Fully managed RAG solution for document ingestion, indexing, and retrieval
- **Cloudflare R2**: Object storage for documents (PDFs, Markdown, CSV, DOCX, XLSX, HTML, images)
- **Cloudflare Workers**: Serverless compute for the backend API
- **Cloudflare AI Gateway**: Routing layer for multiple LLM providers with caching, rate limiting, and fallbacks
- **Cloudflare Vectorize**: Vector database for storing document embeddings
- **Workers AI**: Default LLM provider for embeddings and generation
- **DOMPurify**: XSS prevention and content sanitization

## Architecture Components

### Document Ingestion Flow
1. Documents are uploaded to R2 bucket organized by product/dignity folders
2. AutoRAG automatically indexes new/updated files
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

# Development
npm run dev:widget    # Start widget dev server
npm run dev:worker    # Start worker dev server

# Build
npm run build         # Build both widget and worker
npm run build:widget  # Build widget only
npm run build:worker  # Build worker only

# Deploy
npm run deploy        # Deploy to Cloudflare
npm run deploy:worker # Deploy worker to Cloudflare Workers
npm run deploy:widget # Deploy widget to Cloudflare Pages

# Testing
npm test              # Run all tests
npm run test:unit     # Run unit tests
npm run test:e2e      # Run end-to-end tests

# Linting and Formatting
npm run lint          # Run ESLint
npm run format        # Run Prettier
```

## Project Structure

```
rag-chatbot/
├── widget/              # Embeddable chat widget
│   ├── src/            # Source code
│   ├── dist/           # Built files
│   └── public/         # Static assets
├── worker/             # Cloudflare Worker API
│   ├── src/            # Source code
│   └── dist/           # Built files
├── scripts/            # Build and deployment scripts
├── docs/               # Documentation
├── examples/           # Integration examples
├── sample-documents/   # Test documents for development
└── tests/              # Test suites
```

## Key Configuration Points

### AutoRAG Configuration
- Chunk size: 1000 characters with 200 character overlap
- Query rewrite prompts for multilingual support
- Generation system prompts per dignity/product
- Metadata filters for multitenancy

### AI Gateway Setup
- Provider configurations (OpenAI, Anthropic, Workers AI)
- Caching: 5 minutes for identical queries
- Rate limiting: 100 requests per minute per session
- Fallback chain: Workers AI → OpenAI → Anthropic

### Worker Environment Variables
```env
OPENAI_API_KEY=<key>
ANTHROPIC_API_KEY=<key>
AUTORAG_INSTANCE=<binding>
AI_GATEWAY_BINDING=<binding>
R2_BUCKET=<binding>
```

## Security Considerations

- **XSS Prevention**: All user input sanitized with DOMPurify
- **Content Security Policy**: Strict CSP headers
- **CORS**: Configured for specific allowed origins
- **API Keys**: Never exposed to client, stored in Worker environment
- **Rate Limiting**: Per-session and per-IP limits
- **Input Validation**: All inputs validated and sanitized
- **Secure Communication**: HTTPS only, no mixed content

## Testing Strategy

### Unit Tests
- Component isolation tests
- API endpoint tests
- Utility function tests

### Integration Tests
- AutoRAG integration
- R2 storage operations
- AI Gateway communication

### End-to-End Tests
- Full chat flow testing
- Multi-language support
- Document retrieval accuracy
- Citation verification

## Performance Targets

- Initial load: < 2 seconds
- First response: < 3 seconds
- Subsequent responses: < 2 seconds
- Widget bundle size: < 50KB gzipped
- Worker cold start: < 50ms

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Deployment Strategy

### Staging
- Branch: `staging`
- URL: https://rag-chatbot-staging.pages.dev
- Auto-deploy on push

### Production
- Branch: `main`
- URL: https://rag-chatbot.pages.dev
- Manual deploy with approval

## Code Quality Standards

- ESLint configuration enforced
- Prettier formatting required
- Pre-commit hooks via Husky
- Minimum 80% test coverage
- TypeScript strict mode

## Documentation Requirements

All code changes must include:
- JSDoc comments for public APIs
- README updates for new features
- CHANGELOG entries for releases
- Migration guides for breaking changes

## Important Notes

1. This is a production-ready MIT-licensed project - maintain professional code quality
2. Security is paramount - always sanitize inputs and validate data
3. Performance matters - optimize for fast initial load and response times
4. Accessibility is required - ensure all features are accessible
5. Documentation is essential - keep it current and comprehensive

## Contact

- Project Lead: Arne Moor (arne@moor-service.ch)
- Repository: https://github.com/[TBD]/rag-chatbot
- License: MIT