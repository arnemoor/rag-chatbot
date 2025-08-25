# Troubleshooting Guide

This guide helps you resolve common issues when deploying and using AutoRAG Clean.

## 🚨 Common Issues and Solutions

### Installation Issues

#### Issue: `npm install` fails with permission errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try with different registry
npm install --registry https://registry.npmjs.org/

# Or use sudo (not recommended)
sudo npm install --unsafe-perm
```

#### Issue: Node version incompatibility

**Solution:**
```bash
# Check your Node version
node --version

# Should be 18.0.0 or higher
# Install Node 18+ using nvm
nvm install 18
nvm use 18
```

### Deployment Issues

#### Issue: Wrangler deployment fails with "Authentication required"

**Solution:**
1. Check your API token permissions:
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Ensure token has: AutoRAG:Edit, Workers:Edit, R2:Edit

2. Verify environment variables:
   ```bash
   echo $CLOUDFLARE_ACCOUNT_ID
   echo $CLOUDFLARE_API_TOKEN
   ```

3. Re-authenticate:
   ```bash
   npx wrangler login
   ```

#### Issue: "AutoRAG instance not found"

**Solution:**
1. Create AutoRAG instance in Cloudflare Dashboard:
   - Go to AI → AutoRAG
   - Create new instance
   - Copy instance name to `.env`

2. Verify binding in `wrangler.toml`:
   ```toml
   [ai]
   binding = "AI"
   ```

#### Issue: R2 bucket errors

**Solution:**
1. Create R2 bucket:
   ```bash
   npx wrangler r2 bucket create library-docs-01
   ```

2. Verify bucket binding:
   ```toml
   [[r2_buckets]]
   binding = "R2_BUCKET"
   bucket_name = "library-docs-01"
   ```

### Runtime Issues

#### Issue: CORS errors in browser

**Symptoms:**
```
Access to fetch at 'https://your-worker.workers.dev' from origin 
'https://your-site.com' has been blocked by CORS policy
```

**Solution:**

1. For development (wildcard CORS):
   ```toml
   # wrangler.toml
   [vars]
   # Don't set ALLOWED_ORIGINS for wildcard
   ```

2. For production (specific origins):
   ```toml
   # wrangler.toml
   [vars]
   ALLOWED_ORIGINS = "https://your-site.com,https://app.your-site.com"
   ```

3. Redeploy:
   ```bash
   npm run deploy
   ```

#### Issue: "TypeError: env.AI.autorag is not a function"

**Solution:**
1. Ensure AutoRAG is enabled in your Cloudflare account
2. Check the binding name matches:
   ```typescript
   // Should be env.AI not env.AUTORAG
   const response = await env.AI.autorag(...)
   ```

#### Issue: Widget not loading

**Symptoms:**
- Blank widget
- Console errors about missing configuration

**Solution:**

1. Check script inclusion:
   ```html
   <!-- Correct -->
   <script src="https://your-pages.pages.dev/autorag-widget.min.js"></script>
   <autorag-widget></autorag-widget>
   
   <!-- Wrong -->
   <script src="/autorag-widget.min.js"></script> <!-- Missing domain -->
   ```

2. Verify configuration:
   ```javascript
   // Check browser console
   console.log(window.AUTORAG_CONFIG);
   ```

3. Check API URL:
   ```html
   <!-- Explicit configuration -->
   <autorag-widget api-url="https://your-worker.workers.dev"></autorag-widget>
   ```

### Testing Issues

#### Issue: Tests fail with "Cannot read file tsconfig.json"

**Solution:**
```bash
# Run tests from project root
cd /path/to/auto-rag-clean
npm test

# Not from subdirectories
# cd worker && npm test  # May fail
```

#### Issue: Coverage reports cause test failures

**Solution:**
```bash
# Run tests without coverage
npm test -- --no-coverage

# Or update vitest.config.ts
coverage: {
  enabled: false
}
```

### Widget Issues

#### Issue: Widget appears but doesn't respond

**Solution:**

1. Check API endpoint:
   ```javascript
   // Browser console
   const widget = document.querySelector('autorag-widget');
   console.log(widget.apiUrl);  // Should show your worker URL
   ```

2. Test API directly:
   ```bash
   curl https://your-worker.workers.dev/health
   ```

3. Check browser console for errors

#### Issue: Theme not switching

**Solution:**
```html
<!-- Explicit theme -->
<autorag-widget theme="dark"></autorag-widget>

<!-- Or programmatically -->
<script>
  const widget = document.querySelector('autorag-widget');
  widget.setAttribute('theme', 'dark');
</script>
```

#### Issue: Language not detected correctly

**Solution:**
```html
<!-- Force language -->
<autorag-widget language="de"></autorag-widget>

<!-- Or check browser language -->
<script>
  console.log(navigator.language);  // Should be 'de-DE', 'fr-FR', etc.
</script>
```

### Performance Issues

#### Issue: Slow response times

**Diagnosis:**
```bash
# Check Worker metrics
npx wrangler tail --format pretty

# Look for:
# - Response times > 1000ms
# - Memory usage issues
# - Rate limiting
```

**Solutions:**

1. **Enable caching:**
   ```typescript
   // Add cache headers
   return new Response(body, {
     headers: {
       'Cache-Control': 'public, max-age=3600',
     }
   });
   ```

2. **Optimize AutoRAG queries:**
   ```typescript
   // Reduce number of results
   const results = await env.AI.autorag({
     query: userQuery,
     topK: 3,  // Reduce from default 5
   });
   ```

3. **Use Workers KV for session storage:**
   ```toml
   [[kv_namespaces]]
   binding = "SESSIONS"
   id = "your-kv-namespace-id"
   ```

### Configuration Issues

#### Issue: Configuration not loading from R2

**Solution:**

1. Upload configuration files:
   ```bash
   ./scripts/upload-config.sh
   ```

2. Verify files in R2:
   ```bash
   npx wrangler r2 object list library-docs-01 --prefix config/
   ```

3. Check configuration endpoint:
   ```bash
   curl https://your-worker.workers.dev/config/languages
   ```

#### Issue: Environment variables not working

**Solution:**

1. For local development:
   ```bash
   # .dev.vars file in worker directory
   OPENAI_API_KEY=your-key
   ANTHROPIC_API_KEY=your-key
   ```

2. For production:
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

## 🔍 Debugging Tips

### Enable Debug Mode

```toml
# wrangler.toml
[vars]
DEBUG_MODE = "true"
```

Then check health endpoint:
```bash
curl https://your-worker.workers.dev/health
```

### Check Worker Logs

```bash
# Real-time logs
npx wrangler tail --format pretty

# Filter by status
npx wrangler tail --status error

# Search logs
npx wrangler tail --search "AutoRAG"
```

### Browser DevTools

1. Open Console (F12)
2. Check Network tab for failed requests
3. Look for CORS errors
4. Check localStorage for widget state:
   ```javascript
   localStorage.getItem('autorag_session')
   ```

### Test Individual Components

```bash
# Test Worker
curl -X POST https://your-worker.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"test","language":"en"}'

# Test R2
npx wrangler r2 object list library-docs-01

# Test AutoRAG
# Use Cloudflare Dashboard → AI → AutoRAG → Test
```

## 📞 Getting Help

If these solutions don't resolve your issue:

1. **Search existing issues**: [GitHub Issues](https://github.com/your-org/auto-rag-clean/issues)
2. **Ask the community**: [Discord](https://discord.gg/autorag)
3. **Create new issue** with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Wrangler version: `npx wrangler --version`
   - Node version: `node --version`

## 🔄 Quick Fixes

### Reset Everything

```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf worker/node_modules worker/package-lock.json
rm -rf widget/node_modules widget/package-lock.json
npm install

# Reset configuration
cp .env.example .env
# Edit .env with your credentials

# Redeploy
./scripts/deploy.sh
```

### Verify Deployment

```bash
# Check all endpoints
./scripts/verify-deployment.sh
```

---

Remember: Most issues are configuration-related. Double-check your `.env` file and Cloudflare settings first!