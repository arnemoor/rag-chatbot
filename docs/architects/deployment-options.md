# AutoRAG Deployment Options

## Deployment Overview

AutoRAG is a simple proof-of-concept (PoC) designed for manual deployment to Cloudflare's platform. This guide outlines the basic deployment process and configuration options for this demonstration system.

## Single Deployment Option

### Standard Cloud Deployment (Only Option)

#### Simple Architecture
```
Standard PoC Architecture:
┌─────────────────────────────────────────────┐
│              Cloudflare Global              │
│                   Network                   │
└─────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────┐
│            Single Region Deployment        │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Worker    │  │      AutoRAG Instance   │ │
│  │    API      │  │   (your-autorag-instance)   │ │
│  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Pages Host  │  │     R2 Storage          │ │
│  │ (Widget)    │  │   (your-bucket-name)          │ │
│  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ AI Gateway  │  │     Vectorize DB        │ │
│  │(your-gateway)   │  │   (embeddings)          │ │
│  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Use Cases:**
- Proof-of-concept demonstration
- Simple RAG system testing
- Basic document Q&A functionality
- Learning Cloudflare AutoRAG

**Configuration:**
```toml
# wrangler.toml
name = "autorag-api"
main = "src/index.ts"
compatibility_date = "2024-01-15"

[env.production]
vars = { 
  AUTORAG_INSTANCE = "your-autorag-instance",
  GATEWAY_NAME = "your-gateway",
  ENVIRONMENT = "production"
}

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "your-bucket-name"

[[ai]]
binding = "AI"
```

## Deployment Process

### Manual Deployment Steps

#### 1. Prerequisites
```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler auth login

# Verify account access
wrangler whoami
```

#### 2. Worker Deployment
```bash
# Navigate to worker directory
cd worker

# Install dependencies
npm install

# Deploy to Cloudflare
wrangler deploy

# Set API keys (optional)
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

#### 3. Widget Deployment
```bash
# Navigate to widget directory
cd ../widget

# Install dependencies
npm install

# Build the widget
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=autorag-widget
```

#### 4. Document Upload
```bash
# Upload sample documents
./scripts/upload-pis-documents.sh

# Or upload custom documents
./scripts/upload-docs.sh /path/to/your/documents
```

#### 5. AutoRAG Indexing
- Go to Cloudflare Dashboard
- Navigate to AutoRAG section
- Find your instance (your-autorag-instance)
- Click "Index" to process uploaded documents
- Wait for indexing to complete

### Simple Deployment Script

The provided `deploy.sh` script automates the basic deployment:

```bash
#!/bin/bash
# Simple deployment script
set -e

echo "🚀 AutoRAG PoC Deployment"
echo "========================="

# Load API token from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ .env file not found!"
    echo "Please create .env file with: CLOUDFLARE_API_TOKEN=your-token"
    exit 1
fi

# Deploy Worker
echo "🔧 Deploying Worker to Cloudflare..."
cd worker && npm install && npx wrangler deploy && cd ..

# Deploy Widget
echo "🌐 Deploying Widget to Cloudflare Pages..."
cd widget && npm install && npm run build
npx wrangler pages deploy dist --project-name=autorag-widget && cd ..

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Upload documents: ./scripts/upload-pis-documents.sh"
echo "2. Add OpenAI key (optional): cd worker && npx wrangler secret put OPENAI_API_KEY"
echo "3. Index documents in Cloudflare dashboard"
echo "4. Test the widget at your Pages URL"
```

## Configuration Options

### Environment Variables
```toml
# Basic configuration variables
[env.production]
vars = { 
  AUTORAG_INSTANCE = "your-autorag-instance-id",
  GATEWAY_NAME = "your-ai-gateway-name",
  ENVIRONMENT = "production"
}
```

### API Keys (Optional)
```bash
# Set OpenAI API key for GPT-5 models
wrangler secret put OPENAI_API_KEY

# Set Anthropic API key for Claude models  
wrangler secret put ANTHROPIC_API_KEY
```

### Widget Configuration
```javascript
// Global configuration for widget
window.AutoRAGConfig = {
  apiUrl: 'https://your-worker-url.workers.dev',
  language: 'en',
  dignity: 'general', 
  product: 'libraryonline',
  provider: 'workers-ai',
  model: '@cf/meta/llama-3.1-8b-instruct-fast',
  theme: 'light'
};
```

## What This PoC Does NOT Include

### No Complex Deployment Options
This simple PoC does NOT support:

- ❌ **Multi-Region Deployment**: Single region only
- ❌ **Enterprise Configuration**: No dedicated infrastructure
- ❌ **Hybrid Deployment**: Cloud-only deployment
- ❌ **Air-Gapped Deployment**: Requires internet connectivity
- ❌ **Infrastructure as Code**: No Terraform/CloudFormation
- ❌ **CI/CD Pipelines**: Manual deployment only
- ❌ **Blue-Green Deployment**: Single environment
- ❌ **Canary Deployment**: No gradual rollout
- ❌ **Staging Environments**: Direct to production
- ❌ **Automated Testing**: No test automation

### No Advanced Features
- ❌ **Custom Domains**: Uses Cloudflare-provided domains
- ❌ **SSL Certificate Management**: Uses Cloudflare Universal SSL
- ❌ **Load Balancing**: Relies on Cloudflare's automatic distribution
- ❌ **Health Checks**: Basic endpoint only
- ❌ **Monitoring Integration**: No external monitoring systems
- ❌ **Backup/Recovery**: Relies on Cloudflare's built-in redundancy
- ❌ **Security Scanning**: No automated security testing
- ❌ **Performance Testing**: No load testing framework
- ❌ **Documentation Generation**: Manual documentation only

## Troubleshooting

### Common Deployment Issues

#### 1. Authentication Errors
```bash
# Re-authenticate with Cloudflare
wrangler auth login

# Verify account access
wrangler whoami
```

#### 2. Deployment Failures
```bash
# Check wrangler.toml configuration
cat worker/wrangler.toml

# Verify R2 bucket exists
wrangler r2 bucket list

# Check AutoRAG instance
wrangler ai autorag list
```

#### 3. Document Upload Issues
```bash
# Verify R2 bucket permissions
wrangler r2 bucket list

# Check upload script permissions
chmod +x scripts/upload-pis-documents.sh

# Manual document upload
wrangler r2 object put your-bucket-name/test.md --file=test.md
```

#### 4. Widget Loading Issues
- Check browser console for JavaScript errors
- Verify widget URL is accessible
- Ensure API URL is correct in widget configuration
- Test with browser developer tools

### Testing Deployment

#### 1. Worker API Test
```bash
# Test health endpoint
curl https://your-worker-url.workers.dev/health

# Test chat endpoint
curl -X POST https://your-worker-url.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"query":"What is LibraryOnline?","language":"en","dignity":"general","product":"libraryonline"}'
```

#### 2. Widget Test
- Load the demo page in browser
- Open widget and send test message
- Check for proper response and citations
- Test different language options

#### 3. Document Search Test
- Upload a test document
- Index in AutoRAG dashboard
- Query for content from that document
- Verify citations reference the correct file

## Limitations

### PoC Deployment Limitations

1. **Manual Process**: All deployment steps are manual
2. **No Rollback**: No automated rollback capability  
3. **Single Environment**: No staging/testing environments
4. **Basic Monitoring**: Limited to Cloudflare dashboard
5. **No Automation**: No CI/CD or automated testing
6. **Simple Configuration**: Basic environment variables only
7. **No Secrets Management**: Basic Wrangler secrets only
8. **Limited Scaling**: Relies on Cloudflare auto-scaling
9. **Basic Error Handling**: Simple error messages only
10. **No SLA**: Best-effort availability

### Production Readiness

This PoC deployment is NOT suitable for production use without significant enhancements:

- **Security**: Would need proper authentication, authorization, and audit logging
- **Monitoring**: Would need comprehensive monitoring and alerting
- **Backup**: Would need proper backup and disaster recovery procedures
- **Testing**: Would need automated testing and validation
- **CI/CD**: Would need proper deployment pipelines
- **Documentation**: Would need comprehensive operational procedures
- **Support**: Would need on-call support and incident response
- **Compliance**: Would need compliance validation for academic use

This deployment guide provides the basic steps needed to get the AutoRAG PoC running on Cloudflare, but is intended for demonstration and learning purposes only.