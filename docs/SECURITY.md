# Security Configuration Guide

## Framework Philosophy

**AutoRAG is an open-source framework designed for evaluation, demonstration, and rapid deployment.** By default, the framework runs in a permissive mode to facilitate:

- Easy evaluation and testing
- Quick proof-of-concept deployments
- Cross-domain demonstrations
- Development and debugging

## Default Security Settings (Permissive Mode)

Out of the box, the framework operates with these defaults:

| Feature | Default | Reason |
|---------|---------|--------|
| CORS | Allow all origins (`*`) | Enable cross-domain testing and embedding |
| Rate Limiting | Disabled | Unrestricted evaluation and testing |
| CSP Headers | Permissive | Allow embedding anywhere, all resources |
| Frame Options | ALLOWALL | Widget can be embedded on any site |
| Request Size | 100KB limit | Basic stability protection (always on) |
| R2 Browser | Full CRUD operations | Test document management dynamically |

## Production Security Options

For production deployments, you can enable security features via environment variables:

### 1. CORS Restrictions

```env
# Restrict to specific origins (comma-separated)
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

When set, only listed origins can access the API. Requests from other origins will be blocked.

### 2. Rate Limiting

```env
# Enable rate limiting
ENABLE_RATE_LIMITING=true

# Configure limits (optional)
RATE_LIMIT_WINDOW_MS=60000    # Time window in ms (default: 60000 = 1 minute)
RATE_LIMIT_MAX_REQUESTS=120   # Max requests per window (default: 120)
```

Prevents abuse by limiting requests per client.

### 3. Strict Content Security Policy

```env
# Enable strict CSP headers
ENABLE_STRICT_CSP=true
```

When enabled:
- Restricts resource loading to same-origin and trusted CDNs
- Prevents clickjacking with X-Frame-Options: DENY
- Enables HSTS for HTTPS enforcement
- Sets strict Permissions Policy

### 4. Request Size Limits

```env
# Configure max request size in KB (default: 100)
MAX_REQUEST_SIZE_KB=50
```

Prevents DoS attacks via large payloads. This is always enabled for stability.

## Security Feature Matrix

| Environment Variable | Type | Default | Production Recommendation |
|---------------------|------|---------|--------------------------|
| `ALLOWED_ORIGINS` | String | (empty) = allow all | Set to your domains |
| `ENABLE_RATE_LIMITING` | Boolean | false | true |
| `RATE_LIMIT_WINDOW_MS` | Number | 60000 | 60000 or lower |
| `RATE_LIMIT_MAX_REQUESTS` | Number | 120 | 60 or lower |
| `ENABLE_STRICT_CSP` | Boolean | false | true |
| `MAX_REQUEST_SIZE_KB` | Number | 100 | 50 or lower |

## Deployment Scenarios

### Development/Testing
```env
# No security variables needed - defaults are permissive
```

### Staging/Demo
```env
# Light security for public demos
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=200
```

### Production - Internal Use
```env
# Moderate security for internal applications
ALLOWED_ORIGINS=https://internal.company.com
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
```

### Production - Public Facing
```env
# Maximum security for public applications
ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
ENABLE_STRICT_CSP=true
MAX_REQUEST_SIZE_KB=50
```

## R2 Browser Security

The R2 browser (`/r2/*` endpoints) provides full CRUD operations including DELETE. This is intentional for framework evaluation:

- **Development**: Full access for testing document management
- **Production**: Consider implementing authentication or disabling these endpoints

To disable R2 browser in production, remove the routes from `worker/src/index.ts`.

## Always-On Security Features

These features are always enabled regardless of configuration:

1. **Input Sanitization**: All user inputs are sanitized to prevent XSS
2. **Request Size Check**: Prevents memory exhaustion (configurable limit)
3. **Basic Security Headers**: X-Content-Type-Options, X-XSS-Protection
4. **Error Message Sanitization**: Internal errors never exposed to clients

## Security Checklist for Production

- [ ] Set `ALLOWED_ORIGINS` to your specific domains
- [ ] Enable rate limiting with `ENABLE_RATE_LIMITING=true`
- [ ] Enable strict CSP with `ENABLE_STRICT_CSP=true`
- [ ] Review and adjust rate limits for your use case
- [ ] Consider implementing authentication for R2 browser
- [ ] Set up monitoring and alerting for security events
- [ ] Regular security audits and dependency updates
- [ ] Use HTTPS exclusively (enforced by Cloudflare Workers)

## Framework vs Production

Remember: **AutoRAG is a framework, not a production application.** The permissive defaults are intentional to support:

- Rapid prototyping
- Cross-team collaboration
- Demo deployments
- Educational use
- Open-source contribution

When deploying to production, review this guide and enable appropriate security features for your use case.

## Questions or Concerns?

This is an open-source project. For security concerns:

1. Review the code - it's all open source
2. Enable the security features you need
3. Contribute improvements back to the community
4. Fork and customize for your specific requirements