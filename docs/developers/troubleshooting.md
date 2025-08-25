# AutoRAG Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting information for common AutoRAG issues, from basic setup problems to complex deployment challenges. Each section includes symptoms, root causes, step-by-step solutions, and prevention strategies.

## Quick Diagnostic Tools

### 1. Health Check Commands

```bash
# API Health Check
curl https://your-autorag-api.workers.dev/health

# Widget Script Availability
curl -I https://autorag-widget.pages.dev/autorag-widget.min.js

# R2 Bucket Access
npx wrangler r2 object list your-bucket-name

# Note: AutoRAG status can only be checked via Cloudflare Dashboard
# No API endpoint found for programmatic status checks
```

### 2. Basic Debugging Approach

Since this PoC has no built-in debug mode, use these manual debugging techniques:

```javascript
// Simple console logging for debugging
async function debugAPICall(query) {
  console.log('Sending request:', query);
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://your-api.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    
    const data = await response.json();
    console.log('Response received in', Date.now() - startTime, 'ms');
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

For server-side debugging, use:
```bash
# View Worker logs in real-time
wrangler tail

# Check recent errors in Cloudflare Dashboard
# Workers & Pages → your-worker → Logs
```

## Common Issues and Solutions

### 1. Widget Not Loading

#### Symptoms
- Widget does not appear on the page
- JavaScript console shows errors
- Network requests failing

#### Troubleshooting Steps

**Step 1: Verify Script Loading**
```javascript
// Check if script loaded
if (typeof window.customElements === 'undefined') {
  console.error('Custom elements not supported');
}

// Check for AutoRAG widget definition
if (!window.customElements.get('autorag-widget')) {
  console.error('AutoRAG widget not registered');
}

// Manual script verification
const script = document.querySelector('script[src*="autorag-widget"]');
if (!script) {
  console.error('AutoRAG script tag not found');
} else {
  console.log('Script source:', script.src);
}
```

**Step 2: Check Network Connectivity**
```bash
# Test script accessibility
curl -I https://autorag-widget.pages.dev/autorag-widget.min.js

# Expected response
HTTP/2 200 
content-type: application/javascript
```

**Step 3: Validate HTML Integration**
```html
<!-- Correct integration -->
<script src="https://autorag-widget.pages.dev/autorag-widget.min.js"></script>
<autorag-widget
  language="en"
  dignity="librarian"
  product="libraryonline"
></autorag-widget>

<!-- Common mistakes to avoid -->
<!-- Missing script tag -->
<autorag-widget></autorag-widget>

<!-- Incorrect attribute names -->
<autorag-widget lang="en" role="librarian"></autorag-widget>

<!-- Self-closing tag (incorrect for custom elements) -->
<autorag-widget />
```

**Step 4: Check Content Security Policy (CSP)**
```html
<!-- Required CSP permissions -->
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' https://autorag-widget.pages.dev;
  connect-src 'self' https://*.workers.dev;
  style-src 'self' 'unsafe-inline';
">
```

**Common Solutions:**

1. **Script Loading Issues**
   ```javascript
   // Load script dynamically if needed
   function loadAutoRAGWidget() {
     return new Promise((resolve, reject) => {
       const script = document.createElement('script');
       script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
       script.onload = resolve;
       script.onerror = reject;
       document.head.appendChild(script);
     });
   }
   
   loadAutoRAGWidget().then(() => {
     console.log('Widget loaded successfully');
   }).catch(() => {
     console.error('Failed to load widget');
   });
   ```

2. **CSP Issues**
   ```html
   <!-- Add to your CSP -->
   Content-Security-Policy: script-src 'self' https://autorag-widget.pages.dev; connect-src 'self' https://*.workers.dev
   ```

3. **Framework Integration Issues**
   ```jsx
   // React - use useEffect for dynamic loading
   useEffect(() => {
     const script = document.createElement('script');
     script.src = 'https://autorag-widget.pages.dev/autorag-widget.min.js';
     script.async = true;
     document.head.appendChild(script);
     
     return () => {
       document.head.removeChild(script);
     };
   }, []);
   ```

### 2. API Connectivity Issues

#### Symptoms
- 500 Internal Server Error
- Connection timeouts
- CORS errors
- Rate limiting errors

#### Troubleshooting Steps

**Step 1: Basic Connectivity Test**
```bash
# Test API health endpoint
curl -v https://your-api.workers.dev/health

# Test with sample request
curl -X POST https://your-api.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test query",
    "language": "en",
    "dignity": "librarian",
    "product": "libraryonline",
    "provider": "workers-ai",
    "model": "@cf/meta/llama-3.1-8b-instruct-fast"
  }'
```

**Step 2: Check Worker Status**
```bash
# Check Worker deployment status
npx wrangler deployments list

# View Worker logs
npx wrangler tail --format pretty
```

**Step 3: Validate Configuration**
```bash
# Check environment variables
npx wrangler secret list

# Verify bindings
cat wrangler.toml
```

**Common Solutions:**

1. **CORS Issues**
   ```typescript
   // Worker: Ensure CORS headers are set
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type',
   };
   
   // Handle OPTIONS preflight
   if (request.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
   
   // Add to all responses
   return new Response(JSON.stringify(result), {
     headers: { 
       'Content-Type': 'application/json',
       ...corsHeaders 
     }
   });
   ```

2. **Rate Limiting**
   ```typescript
   // Implement client-side rate limiting
   class RateLimiter {
     private requests: number[] = [];
     private limit = 60; // requests per minute
     
     canMakeRequest(): boolean {
       const now = Date.now();
       this.requests = this.requests.filter(time => now - time < 60000);
       
       if (this.requests.length >= this.limit) {
         return false;
       }
       
       this.requests.push(now);
       return true;
     }
   }
   ```

3. **Timeout Issues**
   ```javascript
   // Implement request timeout
   async function makeRequestWithTimeout(url, options, timeout = 10000) {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), timeout);
     
     try {
       const response = await fetch(url, {
         ...options,
         signal: controller.signal
       });
       clearTimeout(timeoutId);
       return response;
     } catch (error) {
       clearTimeout(timeoutId);
       if (error.name === 'AbortError') {
         throw new Error('Request timeout');
       }
       throw error;
     }
   }
   ```

### 3. No Search Results Returned

#### Symptoms
- Empty citations array
- Generic responses without specific information
- "I don't have information about..." messages

#### Troubleshooting Steps

**Step 1: Verify Document Indexing**
```bash
# Check AutoRAG indexing status
curl -X GET "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/autorag/rags/AUTORAG_ID" \
  -H "Authorization: Bearer API_TOKEN"

# Check for recent indexing jobs
curl -X GET "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/autorag/rags/AUTORAG_ID/jobs" \
  -H "Authorization: Bearer API_TOKEN"
```

**Step 2: Verify R2 Bucket Contents**
```bash
# List bucket contents
npx wrangler r2 object list your-bucket-name

# Check specific folder structure
npx wrangler r2 object list your-bucket-name --prefix="libraryonline/librarian/en/"
```

**Step 3: Test Search Directly**
```bash
# Test AutoRAG search endpoint directly
curl -X POST "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/autorag/rags/AUTORAG_ID/search" \
  -H "Authorization: Bearer API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "database configuration",
    "max_num_results": 5
  }'
```

**Common Solutions:**

1. **Missing Documents**
   ```bash
   # Upload test documents
   npx wrangler r2 object put your-bucket/libraryonline/librarian/en/test.md \
     --file=./test-document.md
   
   # Trigger re-indexing
   curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/autorag/rags/AUTORAG_ID/sync" \
     -H "Authorization: Bearer API_TOKEN"
   ```

2. **Incorrect Folder Structure**
   ```bash
   # Correct structure should be:
   # bucket/product/dignity/language/documents
   
   # Fix folder structure
   npx wrangler r2 object cp \
     your-bucket/wrong-path/document.pdf \
     your-bucket/libraryonline/librarian/en/document.pdf
   ```

3. **Indexing Issues**
   ```typescript
   // Wait for indexing to complete
   async function waitForIndexing(autoragId: string): Promise<void> {
     let attempts = 0;
     const maxAttempts = 30;
     
     while (attempts < maxAttempts) {
       const status = await checkIndexingStatus(autoragId);
       if (status === 'completed') {
         return;
       }
       
       console.log(`Indexing in progress... (${attempts + 1}/${maxAttempts})`);
       await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
       attempts++;
     }
     
     throw new Error('Indexing timeout');
   }
   ```

### 4. Poor Response Quality

#### Symptoms
- Irrelevant answers
- Responses without citations
- Incorrect information
- Generic or unhelpful responses

#### Troubleshooting Steps

**Step 1: Verify Query Parameters**
```javascript
// Check query construction
const query = {
  query: "How do I configure database settings?",
  language: "en",
  dignity: "administrator",  // Correct role
  product: "libraryonline",     // Correct product
  provider: "openai",
  model: "gpt-5-mini"
};

// Validate all required fields are present
const requiredFields = ['query', 'language', 'dignity', 'product', 'provider', 'model'];
const missingFields = requiredFields.filter(field => !query[field]);
if (missingFields.length > 0) {
  console.error('Missing required fields:', missingFields);
}
```

**Step 2: Test Different Models**
```javascript
// Compare responses from different models
const models = [
  { provider: "workers-ai", model: "@cf/meta/llama-3.1-8b-instruct-fast" },
  { provider: "openai", model: "gpt-5-mini" },
  { provider: "anthropic", model: "claude-sonnet-4-20250514" }
];

for (const modelConfig of models) {
  const response = await testQuery({
    ...baseQuery,
    ...modelConfig
  });
  console.log(`${modelConfig.provider}/${modelConfig.model}:`, response.text.substring(0, 100));
}
```

**Step 3: Analyze Citation Quality**
```javascript
// Check citation relevance
function analyzeCitations(citations) {
  return citations.map(citation => ({
    filename: citation.filename,
    relevance: citation.relevance,
    hasContent: citation.snippet && citation.snippet.length > 10,
    isRelevant: citation.relevance > 0.7
  }));
}
```

**Common Solutions:**

1. **Improve Query Specificity**
   ```javascript
   // Instead of vague queries
   const vague = "help with system";
   
   // Use specific queries
   const specific = "How do I configure SMTP settings in LibraryOnline for sending patron appointment reminders?";
   ```

2. **Optimize System Prompts**
   ```typescript
   const improvedSystemPrompt = `You are a technical support specialist for academic IT systems.
   
   ALWAYS:
   - Provide step-by-step instructions with numbered lists
   - Include specific menu paths and button names
   - Reference exact file locations and configuration options
   - Ask clarifying questions if the request is ambiguous
   
   NEVER:
   - Give generic advice without specific steps
   - Assume user's technical level without asking
   - Provide information not found in the documentation
   
   When responding about ${product}, focus on:
   - ${dignity}-specific features and workflows
   - Current version capabilities and limitations
   - Integration requirements and compatibility`;
   ```

3. **Document Quality Improvement**
   ```markdown
   <!-- Good document structure -->
   # Database Configuration for LibraryOnline
   
   ## Overview
   This guide covers database configuration for administrators.
   
   ## Prerequisites
   - Administrator access to LibraryOnline
   - Database server credentials
   - Network connectivity to database server
   
   ## Step-by-Step Configuration
   1. Open LibraryOnline Admin Console
   2. Navigate to Settings > Database Configuration
   3. Enter the following details:
      - Server: [your-database-server]
      - Port: [usually 1433 for SQL Server]
      - Database: [database-name]
   ```

### 5. Performance Issues

#### Symptoms
- Slow response times (>5 seconds)
- Timeouts
- High latency
- Poor user experience

#### Troubleshooting Steps

**Step 1: Measure Performance**
```javascript
class PerformanceMonitor {
  async measureAPICall(query) {
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log('Performance metrics:', {
        duration: duration + 'ms',
        status: response.status,
        query: query.query.substring(0, 50)
      });
      
      return await response.json();
    } catch (error) {
      const endTime = performance.now();
      console.error('Request failed after', endTime - startTime + 'ms');
      throw error;
    }
  }
}
```

**Step 2: Analyze Bottlenecks**
```bash
# Check Worker execution time
npx wrangler tail --format pretty | grep "Duration:"

# Monitor R2 response times
curl -w "@curl-format.txt" https://your-bucket.r2.cloudflarestorage.com/test-file.pdf

# curl-format.txt content:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#       time_redirect:  %{time_redirect}\n
#    time_starttransfer: %{time_starttransfer}\n
#                       ---------------\n
#        time_total:    %{time_total}\n
```

**Common Solutions:**

1. **Implement Caching**
   ```typescript
   class ResponseCache {
     private cache = new Map();
     private ttl = 3600000; // 1 hour
     
     async get(key: string) {
       const entry = this.cache.get(key);
       if (entry && Date.now() - entry.timestamp < this.ttl) {
         return entry.data;
       }
       return null;
     }
     
     set(key: string, data: any) {
       this.cache.set(key, {
         data,
         timestamp: Date.now()
       });
     }
     
     generateKey(query: any): string {
       return `${query.query}:${query.language}:${query.product}:${query.dignity}`;
     }
   }
   ```

2. **Optimize Model Selection**
   ```typescript
   // Use faster models for simple queries
   function selectOptimalModel(query: string): ModelConfig {
     const complexity = analyzeQueryComplexity(query);
     
     if (complexity === 'simple') {
       return {
         provider: "workers-ai",
         model: "@cf/meta/llama-3.1-8b-instruct-fast"
       };
     } else if (complexity === 'medium') {
       return {
         provider: "openai",
         model: "gpt-5-nano"
       };
     } else {
       return {
         provider: "openai",
         model: "gpt-5-mini"
       };
     }
   }
   ```

3. **Request Optimization**
   ```typescript
   // Batch similar requests
   class RequestBatcher {
     private batch: BatchedRequest[] = [];
     private batchSize = 5;
     private flushInterval = 1000; // 1 second
     
     async addRequest(request: ChatRequest): Promise<ChatResponse> {
       return new Promise((resolve, reject) => {
         this.batch.push({ request, resolve, reject });
         
         if (this.batch.length >= this.batchSize) {
           this.flush();
         }
       });
     }
     
     private async flush() {
       if (this.batch.length === 0) return;
       
       const currentBatch = this.batch.splice(0, this.batchSize);
       
       try {
         const responses = await this.processBatch(currentBatch);
         currentBatch.forEach((item, index) => {
           item.resolve(responses[index]);
         });
       } catch (error) {
         currentBatch.forEach(item => item.reject(error));
       }
     }
   }
   ```

### 6. Authentication and Authorization Issues

#### Symptoms
- Access denied errors
- Authentication failures
- Permission errors
- SSO integration problems

#### Troubleshooting Steps

**Step 1: Verify API Keys**
```bash
# Check if secrets are set
npx wrangler secret list

# Test API key validity
curl -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  https://api.openai.com/v1/models

curl -H "Authorization: Bearer YOUR_ANTHROPIC_KEY" \
  https://api.anthropic.com/v1/models
```

**Step 2: Check Cloudflare Authentication**
```bash
# Verify Cloudflare API token
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_CF_TOKEN" \
  -H "Content-Type: application/json"
```

**Common Solutions:**

1. **API Key Management**
   ```bash
   # Set API keys securely
   npx wrangler secret put OPENAI_API_KEY
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put CLOUDFLARE_API_TOKEN
   ```

2. **Access Control Implementation**
   ```typescript
   class AccessController {
     validateRequest(request: Request): AuthResult {
       const dignity = request.headers.get('x-user-dignity');
       const product = request.headers.get('x-user-product');
       
       if (!this.isValidDignity(dignity)) {
         return { valid: false, error: 'Invalid user role' };
       }
       
       if (!this.hasProductAccess(dignity, product)) {
         return { valid: false, error: 'No access to this product' };
       }
       
       return { valid: true };
     }
     
     private hasProductAccess(dignity: string, product: string): boolean {
       const accessMatrix = {
         'librarian': ['libraryonline', 'knowledgehub', 'scholaraccess'],
         'researcher': ['libraryonline', 'knowledgehub'],
         'administrator': ['libraryonline', 'librarywin', 'knowledgehub', 'scholaraccess'],
         'general': ['general']
       };
       
       return accessMatrix[dignity]?.includes(product) || false;
     }
   }
   ```

## Environment-Specific Troubleshooting

### Development Environment

```bash
# Common development issues
echo "Checking development environment..."

# 1. Verify local setup
npx wrangler dev --local

# 2. Check for local conflicts
lsof -i :8787  # Default Wrangler port

# 3. Clear local cache
rm -rf .wrangler/state

# 4. Reset environment
npx wrangler dev --var ENVIRONMENT=development
```

### Staging Environment

```bash
# Staging-specific checks
echo "Checking staging environment..."

# 1. Verify staging deployment
npx wrangler deployments list --env staging

# 2. Check staging-specific variables
npx wrangler secret list --env staging

# 3. Test staging endpoints
curl https://autorag-staging.workers.dev/health
```

### Production Environment

```bash
# Production troubleshooting
echo "Checking production environment..."

# 1. Monitor production metrics
npx wrangler metrics

# 2. Check error rates
npx wrangler analytics

# 3. Review recent deployments
npx wrangler deployments list --env production

# 4. Check domain configuration
dig your-domain.com
```

## Monitoring and Alerting

### 1. Health Check Automation

```typescript
class HealthChecker {
  async runHealthChecks(): Promise<HealthReport> {
    const checks = [
      this.checkAPIHealth(),
      this.checkWidgetAvailability(),
      this.checkR2Access(),
      this.checkAutoRAGStatus(),
      this.checkAIProviders()
    ];
    
    const results = await Promise.allSettled(checks);
    
    return {
      overall: results.every(r => r.status === 'fulfilled') ? 'healthy' : 'unhealthy',
      checks: results.map((result, index) => ({
        name: this.getCheckName(index),
        status: result.status,
        error: result.status === 'rejected' ? result.reason : null
      })),
      timestamp: new Date().toISOString()
    };
  }
  
  private async checkAPIHealth(): Promise<boolean> {
    const response = await fetch('https://your-api.workers.dev/health');
    return response.ok;
  }
  
  private async checkWidgetAvailability(): Promise<boolean> {
    const response = await fetch('https://autorag-widget.pages.dev/autorag-widget.min.js');
    return response.ok;
  }
}
```

### 2. Error Tracking

```typescript
class ErrorTracker {
  private errorCounts = new Map<string, number>();
  private alertThreshold = 10;
  
  logError(error: Error, context: any): void {
    const errorKey = `${error.name}:${error.message.substring(0, 50)}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    
    // Log to console
    console.error('Error occurred:', {
      error: error.message,
      stack: error.stack,
      context,
      count: count + 1,
      timestamp: new Date().toISOString()
    });
    
    // Alert if threshold exceeded
    if (count + 1 >= this.alertThreshold) {
      this.sendAlert(errorKey, count + 1);
    }
  }
  
  private sendAlert(errorKey: string, count: number): void {
    // Send to monitoring service
    console.warn(`ALERT: Error ${errorKey} occurred ${count} times`);
  }
}
```

## Getting Help

### 1. Collecting Debug Information

```bash
#!/bin/bash
# debug-info.sh - Collect comprehensive debug information

echo "AutoRAG Debug Information Collection"
echo "Generated at: $(date)"
echo "=================================="

echo "1. System Information"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Wrangler version: $(npx wrangler --version)"

echo "2. Environment Status"
npx wrangler whoami
echo "Current directory: $(pwd)"

echo "3. Configuration"
echo "wrangler.toml contents:"
cat wrangler.toml

echo "4. Recent Deployments"
npx wrangler deployments list | head -10

echo "5. Recent Logs"
npx wrangler tail --format pretty | head -20

echo "6. Health Checks"
curl -s https://your-api.workers.dev/health | jq .

echo "Debug information collection complete."
```

### 2. Support Contact Information

When contacting support, please include:

1. **Environment Details**
   - Node.js and npm versions
   - Wrangler version
   - Operating system

2. **Error Information**
   - Complete error messages
   - Stack traces
   - Request/response details

3. **Configuration**
   - Relevant portions of wrangler.toml
   - Environment variables (without sensitive data)
   - Model and provider settings

4. **Reproduction Steps**
   - Exact steps to reproduce the issue
   - Expected vs actual behavior
   - Frequency of occurrence

### 3. Community Resources

- **GitHub Issues**: Report bugs and search for solutions
- **Documentation**: Comprehensive guides and API reference
- **Discord Community**: Real-time help from other developers
- **Stack Overflow**: Tag questions with `autorag` and `cloudflare`

This troubleshooting guide should help resolve most common AutoRAG issues quickly and effectively. For persistent problems, don't hesitate to reach out to the community or support team with the debug information collected using the tools provided.