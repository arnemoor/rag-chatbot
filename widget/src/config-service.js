/**
 * Configuration Service for AutoRAG Widget
 * Manages dynamic configuration fetching and caching
 */

export class ConfigurationService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.defaultConfig = null;
  }

  /**
   * Get the full configuration from the API
   */
  async getConfiguration() {
    const cacheKey = 'full_config';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.statusText}`);
      }

      const config = await response.json();
      this.setCache(cacheKey, config);
      this.defaultConfig = config;
      return config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Get available languages
   */
  async getLanguages() {
    const cacheKey = 'languages';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/config/languages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.statusText}`);
      }

      const languages = await response.json();
      this.setCache(cacheKey, languages);
      return languages;
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      // Return empty array - no defaults
      return [];
    }
  }

  /**
   * Get available categories
   */
  async getCategories() {
    const cacheKey = 'categories';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/config/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const categories = await response.json();
      this.setCache(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Return empty array - no defaults
      return [];
    }
  }

  /**
   * Get available providers
   */
  async getProviders() {
    const cacheKey = 'providers';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/config/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.statusText}`);
      }

      const providers = await response.json();
      this.setCache(cacheKey, providers);
      return providers;
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      // Return empty array - configuration must come from API
      return [];
    }
  }

  /**
   * Get available models for a provider
   */
  async getModels(providerId) {
    const cacheKey = `models_${providerId || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const url = providerId
        ? `${this.apiUrl}/config/models?provider=${providerId}`
        : `${this.apiUrl}/config/models`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const models = await response.json();
      this.setCache(cacheKey, models);
      return models;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Return empty object - configuration must come from API
      return {};
    }
  }

  /**
   * Get products for a category
   */
  async getProducts(categoryId) {
    const cacheKey = `products_${categoryId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/config/products?category=${categoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const products = await response.json();
      this.setCache(cacheKey, products);
      return products;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Return empty array - no defaults
      return [];
    }
  }

  /**
   * Refresh configuration (clears cache)
   */
  async refreshConfiguration() {
    this.cache.clear();
    try {
      const response = await fetch(`${this.apiUrl}/config/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh configuration: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.config) {
        this.setCache('full_config', result.config);
        this.defaultConfig = result.config;
      }
      return result;
    } catch (error) {
      console.error('Failed to refresh configuration:', error);
      throw error;
    }
  }

  /**
   * Get from cache if not expired
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache with timestamp
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get default configuration (fallback)
   * Returns minimal safe defaults - all dynamic data must come from API
   */
  getDefaultConfiguration() {
    if (this.defaultConfig) {
      return this.defaultConfig;
    }

    // Return minimal configuration - all dynamic data must come from API
    return {
      languages: [], // Must be fetched from API
      categories: [], // Must be fetched from API
      providers: [], // Must be fetched from API
      models: {}, // Must be fetched from API
      defaultSettings: {
        language: 'en',
        category: '', // No default - must be selected
        product: '', // No default - must be selected
        provider: '', // No default - must be selected from API providers
        model: '', // No default - must be selected from API models
      },
      features: {
        streaming: false,
        citations: true,
        sessionManagement: true,
        multiLanguage: true,
      },
      ui: {
        themes: ['light', 'dark'],
        positions: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
        defaultTheme: 'light',
        defaultPosition: 'bottom-right',
      },
    };
  }
}

// Export singleton instance factory
let instance = null;
export function getConfigService(apiUrl) {
  if (!instance || instance.apiUrl !== apiUrl) {
    instance = new ConfigurationService(apiUrl);
  }
  return instance;
}
