# AutoRAG Developer Quick Start

## Get Started in 5 Minutes

### 🚀 Try the Live Demo First
Before diving into development, try our live demo to understand what you're building:

**Interactive Demo**: [https://autorag-widget.pages.dev/demo.html](https://autorag-widget.pages.dev/demo.html)

Test different languages, user categories, AI models, and see how the chat responds with real library and academic content.

## Option 1: Embed the Widget (Fastest)

### Basic Integration - 30 Seconds
Add these two lines to any website:

```html
<script src="https://autorag-widget.pages.dev/autorag-widget.min.js"></script>
<autorag-widget></autorag-widget>
```

**Done!** You now have a working AI chat widget.

### Customize the Widget - 2 Minutes
```html
<script src="https://autorag-widget.pages.dev/autorag-widget.min.js"></script>
<autorag-widget
  language="en"
  category="librarian"
  collection="bookcatalog"
  provider="workers-ai"
  model="@cf/meta/llama-3.1-8b-instruct-fast"
  theme="light"
  position="bottom-right"
  button-text="Need Help?"
  header-title="Library Assistant"
></autorag-widget>
```

### Widget Configuration Options

| Parameter | Options | Description |
|-----------|---------|-------------|
| `language` | `en`, `de`, `fr`, `it` | Interface and response language |
| `category` | `librarian`, `researcher`, `student`, `general` | User role for appropriate content |
| `collection` | `bookcatalog`, `librarywin`, `knowledgehub`, `scholarbase`, `general` | Collection documentation to search |
| `provider` | `workers-ai`, `openai`, `anthropic` | AI provider selection |
| `model` | See [model list](./model-configuration.md) | Specific AI model |
| `theme` | `light`, `dark` | Visual theme |
| `position` | `bottom-right`, `bottom-left`, `top-right`, `top-left` | Widget position |

## Option 2: Use the API Directly

### Basic API Call - 1 Minute
```javascript
const response = await fetch('https://your-worker-name.your-subdomain.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "How do I configure the database connection?",
    language: "en",
    category: "librarian",
    collection: "bookcatalog",
    provider: "workers-ai",
    model: "@cf/meta/llama-3.1-8b-instruct-fast"
  })
});

const data = await response.json();
console.log('Answer:', data.text);
console.log('Sources:', data.citations);
```

### API Response Format
```json
{
  "text": "To configure the database connection in BookCatalog...",
  "citations": [
    {
      "filename": "database-setup.md",
      "relevance": 0.95,
      "snippet": "Database configuration requires..."
    }
  ],
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "metadata": {
    "provider": "workers-ai",
    "model": "@cf/meta/llama-3.1-8b-instruct-fast",
    "responseTime": 1234,
    "language": "en"
  }
}
```

## Option 3: Deploy Your Own Instance

### Prerequisites
- [Cloudflare account](https://dash.cloudflare.com) with Workers enabled
- [Node.js 18+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) for cloning the repository

### Quick Setup Script - 3 Minutes
```bash
# Clone the repository
git clone https://github.com/your-org/cf-chatbot-widget.git
cd cf-chatbot-widget

# Install dependencies and deploy
./scripts/install-dependencies.sh
./scripts/deploy.sh
```

The deploy script will:
1. Generate configuration from templates
2. Deploy the Worker API with secrets
3. Deploy the frontend widget to Pages
4. Set up API keys if provided
5. Generate deployment configuration

### Manual Setup - 10 Minutes

#### 1. Install Dependencies
```bash
cd worker
npm install
```

#### 2. Configure Cloudflare
```bash
# Login to Cloudflare
npx wrangler login

# Create R2 bucket
npx wrangler r2 bucket create your-bucket-name

# Deploy Worker
npx wrangler deploy
```

#### 3. Set Up AutoRAG
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to AI → AutoRAG
3. Create new instance: "your-autorag-instance"
4. Connect R2 bucket: "your-bucket-name"
5. Note the instance ID for configuration

#### 4. Configure AI Gateway (Optional)
1. Navigate to AI → AI Gateway
2. Create gateway: "your-gateway-name"
3. Add providers (OpenAI, Anthropic) if you have API keys

#### 5. Upload Sample Documents
```bash
# Upload sample documents
./scripts/upload-docs.sh

# Trigger indexing
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/autorag/rags/YOUR_AUTORAG_ID/sync" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Testing Your Setup

### Test the API Endpoint
```bash
curl -X POST https://your-worker.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is BookCatalog?",
    "language": "en",
    "category": "librarian",
    "collection": "bookcatalog",
    "provider": "workers-ai",
    "model": "@cf/meta/llama-3.1-8b-instruct-fast"
  }'
```

### Test the Widget
```html
<!DOCTYPE html>
<html>
<head>
    <title>AutoRAG Test</title>
</head>
<body>
    <h1>My Library App</h1>
    
    <!-- Your AutoRAG widget -->
    <script src="https://autorag-widget.pages.dev/autorag-widget.min.js"></script>
    <autorag-widget 
      language="en" 
      category="librarian" 
      collection="bookcatalog"
    ></autorag-widget>
</body>
</html>
```

## Configuration Files

### Worker Configuration (wrangler.toml)
```toml
name = "autorag-api"
main = "src/index.ts"
compatibility_date = "2024-01-15"

[vars]
AUTORAG_INSTANCE = "your-autorag-instance"
GATEWAY_NAME = "your-gateway-name"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "your-bucket-name"

[[ai]]
binding = "AI"
```

### Environment Variables
```bash
# Set API keys for external providers (optional)
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
```

## Adding Your Own Content

### Document Organization
Organize documents in R2 with this folder structure:
```
your-bucket/
├── your-collection/
│   ├── librarian/
│   │   ├── en/
│   │   │   ├── cataloging-procedures.pdf
│   │   │   └── classification-guidelines.md
│   │   ├── de/
│   │   ├── fr/
│   │   └── it/
│   ├── researcher/
│   │   ├── en/
│   │   ├── de/
│   │   ├── fr/
│   │   └── it/
│   └── general/
│       ├── en/
│       ├── de/
│       ├── fr/
│       └── it/
```

### Upload Documents
```bash
# Upload a single document
npx wrangler r2 object put your-bucket/your-collection/librarian/en/guide.pdf \
  --file=./local-file.pdf

# Upload multiple documents
for file in ./docs/*.pdf; do
  npx wrangler r2 object put "your-bucket/your-collection/librarian/en/$(basename "$file")" \
    --file="$file"
done

# Trigger indexing after upload
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/autorag/rags/YOUR_AUTORAG_ID/sync" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Supported File Formats
- **Text**: Markdown (.md), Plain text (.txt), HTML (.html)
- **Documents**: PDF (.pdf), Word (.docx), Excel (.xlsx)
- **Data**: CSV (.csv), JSON (.json)
- **Images**: PNG, JPEG (with OCR text extraction)

## Framework Integration Examples

### React Integration
```jsx
import React, { useEffect } from 'react';

function ChatWidget() {
  useEffect(() => {
    // Load AutoRAG widget script
    const script = document.createElement('script');
    script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
    script.async = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      // Create widget element
      const widget = document.createElement('autorag-widget');
      widget.setAttribute('language', 'en');
      widget.setAttribute('category', 'librarian');
      widget.setAttribute('collection', 'bookcatalog');
      document.body.appendChild(widget);
    };
    
    return () => {
      // Cleanup on unmount
      const widget = document.querySelector('autorag-widget');
      if (widget) widget.remove();
    };
  }, []);
  
  return null; // Widget appends to body
}

export default ChatWidget;
```

### Vue.js Integration
```vue
<template>
  <div>
    <!-- Your app content -->
  </div>
</template>

<script>
export default {
  mounted() {
    this.loadWidget();
  },
  
  beforeUnmount() {
    const widget = document.querySelector('autorag-widget');
    if (widget) widget.remove();
  },
  
  methods: {
    async loadWidget() {
      const script = document.createElement('script');
      script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
      script.async = true;
      
      script.onload = () => {
        const widget = document.createElement('autorag-widget');
        widget.setAttribute('language', this.$i18n.locale);
        widget.setAttribute('category', 'librarian');
        widget.setAttribute('collection', 'bookcatalog');
        document.body.appendChild(widget);
      };
      
      document.head.appendChild(script);
    }
  }
}
</script>
```

### WordPress Integration
```php
// Add to functions.php
function add_autorag_widget() {
    ?>
    <script src="https://autorag-widget.pages.dev/autorag-widget.min.js"></script>
    <autorag-widget 
      language="<?php echo substr(get_locale(), 0, 2); ?>"
      category="general"
      collection="bookcatalog"
    ></autorag-widget>
    <?php
}
add_action('wp_footer', 'add_autorag_widget');
```

## Development Workflow

### Local Development
```bash
# Start local development server
cd worker
npx wrangler dev

# In another terminal, serve your frontend
cd frontend
python -m http.server 8000
# or
npx serve .
```

### Testing
```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Deployment
```bash
# Deploy to staging
npx wrangler deploy --env staging

# Deploy to production
npx wrangler deploy --env production
```

## Common Issues and Solutions

### Widget Not Loading
```javascript
// Check if script loaded correctly
if (typeof window.AutoRAGWidget === 'undefined') {
  console.error('AutoRAG widget script failed to load');
}

// Check for JavaScript errors in console
// Ensure CSP allows script from autorag-widget.pages.dev
```

### API Errors
```javascript
// Check API response
fetch('https://your-api.workers.dev/health')
  .then(r => r.json())
  .then(data => console.log('API Health:', data))
  .catch(err => console.error('API Error:', err));

// Common issues:
// - Wrong API endpoint URL
// - CORS errors (check if API allows your domain)
// - API key missing or invalid
```

### No Search Results
```bash
# Check if documents are indexed
# Go to Cloudflare Dashboard → AutoRAG → your-instance → Jobs
# Look for completed indexing jobs

# Trigger manual indexing
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/autorag/rags/YOUR_AUTORAG_ID/sync" \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Check R2 bucket has documents
npx wrangler r2 object list your-bucket
```

## Next Steps

### For Business Users
- Read the [Features Guide](../business/features.md) to understand all capabilities
- Try the [Evaluation Guide](../business/evaluation-guide.md) with your use cases
- Review [Use Cases](../business/use-cases.md) for implementation ideas

### For Architects
- Study the [System Architecture](../architects/system-architecture.md)
- Review [Integration Patterns](../architects/integration-patterns.md)
- Plan your [Deployment Strategy](../architects/deployment-options.md)

### For Developers
- Explore the [API Reference](./api-reference.md) for advanced usage
- Learn about [Widget Integration](./widget-integration.md) options
- Configure [AI Models](./model-configuration.md) for your needs
- Review [Troubleshooting](./troubleshooting.md) for common issues

## Support and Resources

### Documentation
- **API Reference**: Complete API documentation with examples
- **Widget Guide**: Advanced widget customization and integration
- **Model Configuration**: AI model selection and optimization
- **Troubleshooting**: Common issues and solutions

### Community
- **GitHub Issues**: Report bugs and request features
- **Discord**: Real-time community support
- **Stack Overflow**: Tag questions with `autorag`

### Professional Support
- **Enterprise Support**: 24/7 support for enterprise customers
- **Professional Services**: Implementation and custom development
- **Training**: User and developer training programs

Ready to get started? Choose your integration method above and start building AI-powered support in minutes!