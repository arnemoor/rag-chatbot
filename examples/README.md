# Example Configurations

This directory contains example configurations for different deployment scenarios.

## 📁 Available Examples

### 1. Basic Setup
- `.env.basic` - Minimal configuration for getting started
- `wrangler.basic.toml` - Basic Worker configuration

### 2. Production Setup
- `.env.production` - Production-ready configuration
- `wrangler.production.toml` - Production Worker with optimizations

### 3. Multi-Language Support
- `.env.multilang` - Configuration for multi-language deployment
- `config/languages.json` - Language configuration

### 4. Enterprise Setup
- `.env.enterprise` - Enterprise features with external AI providers
- `wrangler.enterprise.toml` - Advanced Worker configuration

### 5. Development Setup
- `.env.development` - Local development configuration
- `wrangler.dev.toml` - Development Worker configuration

## 🚀 Quick Start

1. Choose an example that matches your use case
2. Copy the example files to your project root:
   ```bash
   cp examples/.env.production .env
   cp examples/wrangler.production.toml wrangler.toml
   ```
3. Update the values with your credentials
4. Deploy:
   ```bash
   ./scripts/deploy.sh
   ```

## 📝 Configuration Details

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Your Cloudflare account ID | `abc123...` |
| `CLOUDFLARE_API_TOKEN` | Yes | API token with necessary permissions | `xyz789...` |
| `AUTORAG_INSTANCE_ID` | Yes | Your AutoRAG instance name | `my-instance` |
| `R2_BUCKET_NAME` | Yes | R2 bucket for documents | `library-docs-01` |
| `DEBUG_MODE` | No | Enable debug information | `true` or `false` |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed origins | `https://site1.com,https://site2.com` |
| `OPENAI_API_KEY` | No | For OpenAI model support | `sk-...` |
| `ANTHROPIC_API_KEY` | No | For Anthropic model support | `sk-ant-...` |

### Widget Integration

#### Basic Integration
```html
<script src="https://your-widget.pages.dev/autorag-widget.min.js"></script>
<autorag-widget></autorag-widget>
```

#### Advanced Integration
```html
<autorag-widget 
  api-url="https://your-worker.workers.dev"
  language="en"
  category="technology"
  theme="dark"
  position="bottom-right"
  button-text="Ask AI">
</autorag-widget>
```

#### Programmatic Control
```javascript
const widget = document.querySelector('autorag-widget');

// Listen for events
widget.addEventListener('message-sent', (e) => {
  console.log('User sent:', e.detail.message);
});

widget.addEventListener('response-received', (e) => {
  console.log('AI responded:', e.detail.response);
});

// Control widget
widget.show();
widget.hide();
widget.clearChat();
widget.setTheme('dark');
widget.setLanguage('de');
```

## 🎯 Use Case Examples

### Customer Support Bot
```html
<!-- Customer support configuration -->
<autorag-widget 
  api-url="https://support-api.company.com"
  category="support"
  language="en"
  greeting="Hi! How can I help you today?"
  placeholder="Type your question..."
  button-text="Get Help">
</autorag-widget>
```

### Documentation Assistant
```html
<!-- Documentation helper configuration -->
<autorag-widget 
  api-url="https://docs-api.company.com"
  category="documentation"
  language="en"
  greeting="Welcome to our docs! What would you like to know?"
  placeholder="Search documentation..."
  theme="light">
</autorag-widget>
```

### Multi-Language Educational Platform
```html
<!-- Educational platform configuration -->
<autorag-widget 
  api-url="https://edu-api.school.com"
  category="education"
  language="auto"
  greeting-en="Welcome to our learning platform!"
  greeting-de="Willkommen auf unserer Lernplattform!"
  greeting-fr="Bienvenue sur notre plateforme d'apprentissage!"
  greeting-it="Benvenuto sulla nostra piattaforma di apprendimento!">
</autorag-widget>
```

## 📚 Configuration Files

### languages.json
```json
{
  "languages": [
    { "code": "en", "name": "English", "available": true },
    { "code": "de", "name": "Deutsch", "available": true },
    { "code": "fr", "name": "Français", "available": true },
    { "code": "it", "name": "Italiano", "available": true }
  ]
}
```

### categories.json
```json
{
  "categories": [
    { 
      "id": "general", 
      "name": "General", 
      "description": "All categories",
      "available": true 
    },
    { 
      "id": "technology", 
      "name": "Technology", 
      "description": "Tech documentation",
      "available": true 
    }
  ]
}
```

### models.json
```json
{
  "models": [
    {
      "id": "@cf/meta/llama-3-8b-instruct",
      "name": "Llama 3 8B",
      "provider": "workers-ai",
      "available": true,
      "isDefault": true
    },
    {
      "id": "gpt-4-turbo",
      "name": "GPT-4 Turbo",
      "provider": "openai",
      "available": true,
      "requiresApiKey": true
    }
  ]
}
```

## 🔧 Deployment Scenarios

### Scenario 1: Simple Blog Integration
Perfect for personal blogs or small websites.
- Use `.env.basic`
- Minimal configuration
- Wildcard CORS for easy testing

### Scenario 2: Corporate Website
For company websites with specific security requirements.
- Use `.env.production`
- Restricted CORS origins
- Custom branding

### Scenario 3: SaaS Platform
For multi-tenant SaaS applications.
- Use `.env.enterprise`
- Multiple AI providers
- Advanced configuration

### Scenario 4: Educational Platform
For schools and universities.
- Use `.env.multilang`
- Multi-language support
- Category-based content

## 📝 Notes

- Always test configuration in development before production
- Keep API keys secure and never commit them
- Update CORS origins for production deployments
- Monitor usage to stay within Cloudflare limits

For more details, see the [main documentation](../README.md).