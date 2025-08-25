# Dynamic Configuration System

## Overview

The AutoRAG system now supports fully dynamic configuration, eliminating hardcoded values and allowing runtime customization of all system parameters.

## Architecture

### Backend Configuration Service

The configuration service (`worker/src/config.ts`) provides:

1. **Dynamic Discovery**: Automatically discovers categories and languages from R2 structure
2. **Caching**: 5-minute cache for improved performance
3. **Fallback Mechanism**: Graceful degradation to defaults if configuration loading fails
4. **Hierarchical Loading**: Configuration loaded from multiple sources with proper precedence

### Configuration Endpoints

The worker exposes the following configuration endpoints:

#### Master Configuration
- **GET** `/config` - Returns complete configuration object
- **POST** `/config/refresh` - Clears cache and reloads configuration

#### Specific Configuration Sections
- **GET** `/config/languages` - Available languages
- **GET** `/config/categories` - Available categories
- **GET** `/config/providers` - AI providers
- **GET** `/config/models?provider={id}` - Models (optionally filtered by provider)
- **GET** `/config/products?category={id}` - Products for a category

### Frontend Configuration Service

The widget uses a configuration service (`widget/src/config-service.js`) that:

1. **Fetches Configuration**: Retrieves configuration from backend endpoints
2. **Caches Results**: Maintains 5-minute cache for performance
3. **Provides Fallbacks**: Returns sensible defaults if API is unavailable
4. **Type Safety**: Structured interfaces for all configuration objects

## Configuration Structure

```typescript
interface AppConfiguration {
  languages: Language[];
  categories: Category[];
  providers: Provider[];
  models: Record<string, ModelConfig>;
  defaultSettings: {
    language: string;
    category: string;
    product: string;
    provider: string;
    model: string;
  };
  features: {
    streaming: boolean;
    citations: boolean;
    sessionManagement: boolean;
    multiLanguage: boolean;
  };
  ui: {
    themes: string[];
    positions: string[];
    defaultTheme: string;
    defaultPosition: string;
  };
}
```

## Configuration Management

### Using the Management Script

The `scripts/manage-config.sh` script provides easy configuration management:

```bash
# View current configuration
./scripts/manage-config.sh get

# Create a sample configuration file
./scripts/manage-config.sh sample my-config.json

# Upload configuration to R2
./scripts/manage-config.sh upload my-config.json

# Refresh configuration cache
./scripts/manage-config.sh refresh

# Download current configuration from R2
./scripts/manage-config.sh download backup.json
```

### Manual Configuration Upload

Configuration can be stored in R2 at `_config/app-config.json`:

```bash
# Using wrangler
cd worker
wrangler r2 object put library-docs-01/_config/app-config.json --file=../config.json
```

### Configuration Priority

Configuration is loaded with the following precedence (highest to lowest):

1. **User Attributes**: HTML attributes on the widget element
2. **Global Config**: `window.AutoRAGConfig` object
3. **Dynamic Config**: Configuration from API
4. **Deployment Config**: Configuration from deployment-config.json
5. **Defaults**: Hardcoded fallback values

## Adding New Configuration Options

### 1. Update Types

Add new fields to the configuration interfaces in `worker/src/config.ts`:

```typescript
interface NewFeature {
  enabled: boolean;
  settings: Record<string, any>;
}
```

### 2. Update Backend

Modify the configuration building logic in `buildDynamicConfiguration()`:

```typescript
async function buildDynamicConfiguration(env: Env): Promise<AppConfiguration> {
  // ... existing code ...
  
  // Add new feature configuration
  const newFeature: NewFeature = {
    enabled: true,
    settings: {
      // Default settings
    }
  };
  
  return {
    // ... existing fields ...
    newFeature
  };
}
```

### 3. Update Frontend

Add support in the configuration service:

```javascript
async getNewFeature() {
  const config = await this.getConfiguration();
  return config.newFeature;
}
```

### 4. Use in Components

Access the configuration in your components:

```javascript
const newFeature = await configService.getNewFeature();
if (newFeature.enabled) {
  // Use the feature
}
```

## Dynamic Category and Language Discovery

The system automatically discovers available categories and languages by:

1. **Scanning R2 Structure**: Lists folders in R2 bucket
2. **Identifying Categories**: Top-level folders become categories
3. **Finding Languages**: Subfolders with 2-letter codes are languages
4. **Building Products**: Creates default products for each category

This allows adding new categories or languages by simply creating the appropriate folder structure in R2.

## Caching Strategy

### Backend Caching
- Configuration cached for 5 minutes
- Cache cleared on `/config/refresh` endpoint call
- Separate cache keys for different configuration sections

### Frontend Caching
- Configuration cached in memory for 5 minutes
- Cache automatically refreshed on expiry
- Manual refresh available via `refreshConfiguration()`

### HTTP Caching
- Configuration endpoints return `Cache-Control: public, max-age=300`
- Allows browser and CDN caching for performance

## Error Handling

The system implements multiple levels of fallback:

1. **Primary Source**: Load from R2 stored configuration
2. **Dynamic Discovery**: Build from R2 folder structure
3. **Cached Values**: Use previously cached configuration
4. **Default Values**: Fall back to hardcoded defaults

This ensures the system remains functional even if:
- R2 is unavailable
- Configuration file is missing or corrupted
- Network requests fail

## Migration from Hardcoded Values

### Before (Hardcoded)
```javascript
const languages = ['en', 'de', 'fr', 'it'];
const categories = ['fiction', 'non-fiction', 'science'];
```

### After (Dynamic)
```javascript
const languages = await configService.getLanguages();
const categories = await configService.getCategories();
```

## Performance Considerations

1. **Initial Load**: Configuration fetched once on widget initialization
2. **Subsequent Requests**: Served from cache for 5 minutes
3. **Parallel Loading**: Multiple configuration sections loaded concurrently
4. **Lazy Loading**: Products only loaded when category is selected

## Security

1. **CORS Headers**: Proper CORS configuration for cross-origin requests
2. **Input Validation**: All configuration validated before use
3. **Sanitization**: User inputs sanitized to prevent XSS
4. **Rate Limiting**: Consider implementing rate limits on configuration endpoints

## Monitoring and Debugging

### Debug Mode
Enable debug logging in the configuration service:

```javascript
configService.debug = true; // Logs all configuration operations
```

### Health Checks
Monitor configuration loading:

```javascript
const health = await fetch(`${apiUrl}/health`);
const status = await health.json();
console.log('Configuration status:', status.config);
```

## Best Practices

1. **Always Use Configuration Service**: Never hardcode values
2. **Handle Loading States**: Show appropriate UI while configuration loads
3. **Implement Fallbacks**: Always provide sensible defaults
4. **Cache Appropriately**: Balance performance with freshness
5. **Version Configuration**: Consider adding version field for compatibility
6. **Document Changes**: Update configuration documentation when adding options
7. **Test Fallbacks**: Ensure system works without configuration service

## Troubleshooting

### Configuration Not Loading

1. Check worker URL in deployment-config.json
2. Verify CORS headers on worker
3. Check browser console for errors
4. Try refreshing cache: `./scripts/manage-config.sh refresh`

### Changes Not Appearing

1. Configuration may be cached - wait 5 minutes or refresh
2. Clear browser cache
3. Use refresh endpoint to clear server cache

### Invalid Configuration

1. Validate JSON syntax
2. Check all required fields are present
3. Ensure IDs match between categories and products
4. Verify model IDs exist in models configuration