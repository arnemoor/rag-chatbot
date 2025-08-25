# AutoRAG Integration Patterns

## Overview

AutoRAG is a simple proof-of-concept (PoC) that supports basic integration patterns for embedding a chat widget and making API calls. This document outlines the simple integration approaches available for this demonstration system.

## Basic Integration Patterns

### 1. Widget Embedding Pattern (Primary)

#### Simple Widget Embedding
The main integration method for this PoC - embedding the chat widget in existing websites.

```html
<!-- Basic widget embedding -->
<script src="https://autorag-widget.pages.dev/autorag-widget.js"></script>
<autorag-widget
  language="en"
  dignity="librarian"
  product="libraryonline"
  provider="workers-ai"
  model="@cf/meta/llama-3.1-8b-instruct-fast"
></autorag-widget>
```

#### Global Configuration
Configure the widget globally before loading the script:

```html
<script>
window.AutoRAGConfig = {
  // API endpoint
  apiUrl: 'https://your-worker-name.your-subdomain.workers.dev',
  
  // Content selection
  language: 'en',     // en, de, fr, it
  dignity: 'general', // general, librarian, researcher
  product: 'libraryonline', // libraryonline, librarywin, knowledgehub, scholaraccess
  
  // AI model selection
  provider: 'workers-ai',  // workers-ai, openai, anthropic
  model: '@cf/meta/llama-3.1-8b-instruct-fast',
  
  // Basic UI customization
  theme: 'light',          // light, dark
  position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
  buttonText: 'Chat with Support',
  headerTitle: 'Support Assistant',
  
  // Auto-initialization
  autoInit: true
};
</script>
<script src="https://autorag-widget.pages.dev/autorag-widget.js"></script>
```

#### Widget Attributes
Configure the widget via HTML attributes:

```html
<autorag-widget
  api-url="https://your-worker-url.workers.dev"
  language="de"
  dignity="librarian"
  product="libraryonline"
  provider="openai"
  model="gpt-5-mini"
  theme="dark"
  position="bottom-left"
  button-text="Hilfe benötigt?"
  header-title="Support-Assistent"
></autorag-widget>
```

### 2. Direct API Integration Pattern

#### Simple API Usage
For applications that need to build their own chat interface:

```typescript
// Basic API request
interface ChatRequest {
  query: string;
  language: 'en' | 'de' | 'fr' | 'it';
  dignity: string;
  product: string;
  provider: 'workers-ai' | 'openai' | 'anthropic';
  model: string;
  sessionId?: string;
}

interface ChatResponse {
  text: string;
  citations: Citation[];
  sessionId: string;
  metadata: {
    provider: string;
    model: string;
    responseTime: number;
    language: string;
  };
}

// Simple API call
async function askQuestion(query: string): Promise<ChatResponse> {
  const response = await fetch('https://your-worker-name.your-subdomain.workers.dev', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      language: 'en',
      dignity: 'general',
      product: 'libraryonline',
      provider: 'workers-ai',
      model: '@cf/meta/llama-3.1-8b-instruct-fast'
    })
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}
```

#### Basic JavaScript Client
Simple client for easier API usage:

```javascript
class SimpleAutoRAGClient {
  constructor(config) {
    this.apiUrl = config.apiUrl || 'https://your-worker-name.your-subdomain.workers.dev';
    this.defaultConfig = {
      language: config.language || 'en',
      dignity: config.dignity || 'general',
      product: config.product || 'libraryonline',
      provider: config.provider || 'workers-ai',
      model: config.model || '@cf/meta/llama-3.1-8b-instruct-fast'
    };
  }
  
  async ask(query, options = {}) {
    const request = {
      ...this.defaultConfig,
      ...options,
      query: query
    };
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    
    return response.json();
  }
}

// Usage
const client = new SimpleAutoRAGClient({
  language: 'en',
  dignity: 'librarian',
  product: 'libraryonline'
});

const answer = await client.ask("How do I configure user permissions?");
console.log(answer.text);
```

### 3. Demo Page Integration

#### Simple Demo Page
For testing and demonstration purposes:

```html
<!DOCTYPE html>
<html>
<head>
  <title>AutoRAG Demo</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>AutoRAG Support Demo</h1>
  <p>Click the chat widget to ask questions about our Patron Information Systems.</p>
  
  <script>
  window.AutoRAGConfig = {
    language: 'en',
    dignity: 'general',
    product: 'libraryonline',
    provider: 'workers-ai',
    model: '@cf/meta/llama-3.1-8b-instruct-fast'
  };
  </script>
  <script src="https://autorag-widget.pages.dev/autorag-widget.js"></script>
</body>
</html>
```

## Widget Events (Basic)

### Simple Event Handling
The widget dispatches basic custom events:

```javascript
// Listen for widget events
document.addEventListener('widget-opened', (event) => {
  console.log('Widget opened, session:', event.detail.sessionId);
});

document.addEventListener('widget-closed', (event) => {
  console.log('Widget closed, session:', event.detail.sessionId);
});

document.addEventListener('message-sent', (event) => {
  console.log('Message sent:', event.detail.message);
  console.log('Response received:', event.detail.response);
});

document.addEventListener('widget-error', (event) => {
  console.error('Widget error:', event.detail.error);
});
```

## Supported Configurations

### Language Options
```javascript
const languages = {
  'en': 'English',
  'de': 'German (Deutsch)'
  // fr and it are in the code but limited sample documents
};
```

### Role/Dignity Options
```javascript
const dignities = {
  'general': 'General (All content)',
  'librarian': 'Librarian/Physician role',
  'researcher': 'Researcher/Academic role'
  // Note: Limited actual content per role in this PoC
};
```

### Product Options
```javascript
const products = {
  'libraryonline': 'LibraryOnline (Web-based Library Information System)',
  'librarywin': 'LibraryWin (Desktop Library Information System)',
  'knowledgehub': 'KnowledgeHub (Digital Library Portal)',
  'scholaraccess': 'ScholarAccess (Cloud Library Information System)'
};
```

### AI Model Options
```javascript
const models = {
  // Workers AI (Free tier)
  'workers-ai': {
    '@cf/meta/llama-3.1-8b-instruct-fast': 'Llama 3.1 8B Fast',
    '@cf/meta/llama-3.2-3b-instruct': 'Llama 3.2 3B'
  },
  
  // OpenAI (Requires API key)
  'openai': {
    'gpt-5': 'GPT-5 (Latest)',
    'gpt-5-mini': 'GPT-5 Mini',
    'gpt-5-nano': 'GPT-5 Nano',
    'gpt-5-chat-latest': 'GPT-5 Chat Latest'
  },
  
  // Anthropic (Requires API key)
  'anthropic': {
    'claude-opus-4-1-20250805': 'Claude Opus 4.1',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4'
  }
};
```

## Simple Use Cases

### 1. Basic Website Integration
```html
<!-- Add to any existing website -->
<script src="https://autorag-widget.pages.dev/autorag-widget.js"></script>
<autorag-widget></autorag-widget>
```

### 2. Custom Chat Interface
```javascript
// Build your own chat UI
const client = new SimpleAutoRAGClient({
  product: 'libraryonline',
  dignity: 'librarian'
});

async function sendMessage(query) {
  try {
    const response = await client.ask(query);
    displayMessage('user', query);
    displayMessage('assistant', response.text);
    showCitations(response.citations);
  } catch (error) {
    displayError('Failed to get response: ' + error.message);
  }
}
```

### 3. Product Documentation Support
```html
<!-- Different product configurations -->
<script>
window.AutoRAGConfig = {
  product: 'librarywin',  // Change based on your product
  dignity: 'general',
  language: 'de'          // Match your user's language
};
</script>
<script src="https://autorag-widget.pages.dev/autorag-widget.js"></script>
```

## What This PoC Does NOT Support

### No Complex Integration Features
This simple PoC does NOT support:

- ❌ **SSO Integration**: No single sign-on or user authentication
- ❌ **Role-Based Permissions**: Basic role selection only
- ❌ **Custom Theming**: Limited to light/dark theme
- ❌ **Webhook Integration**: No real-time notifications
- ❌ **Analytics Integration**: No built-in analytics tracking
- ❌ **Multi-tenancy**: No organization separation
- ❌ **Custom Domains**: Uses Cloudflare-provided domains
- ❌ **API Authentication**: No API keys required for basic usage
- ❌ **Rate Limiting**: No custom rate limiting controls
- ❌ **Streaming Responses**: No real-time streaming of responses

### No Enterprise Features
- ❌ **Enterprise SSO**: No SAML, OIDC, or Active Directory integration
- ❌ **Custom Branding**: No white-label options
- ❌ **Advanced Analytics**: No usage analytics or reporting
- ❌ **Content Management**: No dynamic content updates
- ❌ **User Management**: No user accounts or profiles
- ❌ **Audit Logging**: No comprehensive audit trails
- ❌ **API Management**: No API versioning or governance
- ❌ **SLA Management**: No service level agreements
- ❌ **Custom Models**: No ability to train custom models
- ❌ **Data Export**: No data export capabilities

### No Advanced Customization
- ❌ **Custom CSS**: No extensive styling options
- ❌ **Custom Components**: No ability to add custom UI components
- ❌ **Ticketing Systems**: No help desk or ticketing integration
- ❌ **Knowledge Base**: No content management system integration
- ❌ **Multi-language UI**: Widget UI only in English
- ❌ **Accessibility**: No advanced accessibility features

## Testing Integration

### Basic Testing
```bash
# Test health endpoint
curl https://your-worker-name.your-subdomain.workers.dev/health

# Test basic API call
curl -X POST https://your-worker-name.your-subdomain.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is LibraryOnline?",
    "language": "en",
    "dignity": "general",
    "product": "libraryonline",
    "provider": "workers-ai",
    "model": "@cf/meta/llama-3.1-8b-instruct-fast"
  }'
```

### Widget Testing
```html
<!-- Test widget in browser -->
<script>
window.AutoRAGConfig = {
  language: 'en',
  dignity: 'general',
  product: 'libraryonline'
};
</script>
<script src="https://autorag-widget.pages.dev/autorag-widget.js"></script>
<autorag-widget></autorag-widget>
```

## Troubleshooting

### Common Issues

#### 1. Widget Not Loading
- Check browser console for JavaScript errors
- Verify the widget script URL is accessible
- Ensure the page allows JavaScript execution

#### 2. API Errors
- Verify the API endpoint URL is correct
- Check request format matches the expected schema
- Ensure network connectivity to Cloudflare Workers

#### 3. No Responses
- Check if documents are uploaded and indexed
- Verify the product/dignity/language combination has content
- Try with different query variations

#### 4. CORS Issues
- Widget should work from any domain
- API supports cross-origin requests
- Check browser developer tools for CORS errors

## Limitations

### PoC Integration Limitations

1. **Basic Functionality**: Simple chat widget and API only
2. **No Authentication**: Open access to anyone with the URL
3. **Limited Customization**: Basic theme and positioning options
4. **No Analytics**: No built-in usage tracking or analytics
5. **Manual Setup**: No automated provisioning or configuration
6. **Single Tenant**: No organization separation or multi-tenancy
7. **Basic Error Handling**: Simple error messages only
8. **No Persistence**: No conversation history or user profiles
9. **Limited Content**: Sample documents only for demonstration
10. **No SLA**: Best-effort availability and performance

### Production Requirements

For production use, this integration would need:

- **User Authentication**: Proper user authentication and session management
- **Access Controls**: Role-based access control and permissions
- **Analytics Integration**: Usage tracking and business intelligence
- **Custom Branding**: White-label options and custom styling
- **Enterprise SSO**: SAML, OIDC, and Active Directory integration
- **API Management**: Versioning, rate limiting, and governance
- **Monitoring**: Comprehensive monitoring and alerting
- **Content Management**: Dynamic content updates and versioning
- **Multi-tenancy**: Organization separation and data isolation
- **SLA**: Service level agreements and support contracts

This integration guide describes the basic patterns available for the AutoRAG PoC, which are suitable for demonstration and learning but would require significant enhancement for production use.