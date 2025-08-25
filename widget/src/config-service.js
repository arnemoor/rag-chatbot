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
      // Return default languages as fallback
      return [
        { code: 'en', name: 'English', nativeName: 'English', available: true },
        { code: 'de', name: 'German', nativeName: 'Deutsch', available: true },
        { code: 'fr', name: 'French', nativeName: 'Français', available: true },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', available: true },
      ];
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
      // Return default categories as fallback
      return [
        { id: 'general', name: 'General', available: true },
        { id: 'fiction', name: 'Fiction', available: true },
        { id: 'non-fiction', name: 'Non-Fiction', available: true },
        { id: 'science', name: 'Science', available: true },
        { id: 'technology', name: 'Technology', available: true },
        { id: 'reference', name: 'Reference', available: true },
      ];
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
      // Return default providers as fallback
      return [
        {
          id: 'workers-ai',
          name: 'Workers AI',
          requiresApiKey: false,
          models: ['@cf/meta/llama-3.2-3b-instruct'],
          available: true,
        },
        {
          id: 'openai',
          name: 'OpenAI',
          requiresApiKey: true,
          models: ['gpt-4o', 'gpt-4o-mini'],
          available: true,
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          requiresApiKey: true,
          models: ['claude-3-5-sonnet-20241022'],
          available: true,
        },
      ];
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
      // Return default models as fallback
      return {
        '@cf/meta/llama-3.2-3b-instruct': {
          provider: 'workers-ai',
          displayName: 'Llama 3.2 3B',
          available: true,
        },
        'gpt-4o': {
          provider: 'openai',
          displayName: 'GPT-4o',
          available: true,
        },
        'gpt-4o-mini': {
          provider: 'openai',
          displayName: 'GPT-4o Mini',
          available: true,
        },
        'claude-3-5-sonnet-20241022': {
          provider: 'anthropic',
          displayName: 'Claude 3.5 Sonnet',
          available: true,
        },
      };
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
      // Return default product as fallback
      return [
        {
          id: `${categoryId}-default`,
          name: 'Default Collection',
          categoryId,
          available: true,
        },
      ];
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
   */
  getDefaultConfiguration() {
    if (this.defaultConfig) {
      return this.defaultConfig;
    }

    return {
      languages: [
        { code: 'en', name: 'English', nativeName: 'English', available: true },
        { code: 'de', name: 'German', nativeName: 'Deutsch', available: true },
        { code: 'fr', name: 'French', nativeName: 'Français', available: true },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', available: true },
      ],
      categories: [
        { id: 'general', name: 'General', available: true },
        { id: 'fiction', name: 'Fiction', available: true },
        { id: 'non-fiction', name: 'Non-Fiction', available: true },
        { id: 'science', name: 'Science', available: true },
        { id: 'technology', name: 'Technology', available: true },
        { id: 'reference', name: 'Reference', available: true },
      ],
      providers: [
        {
          id: 'workers-ai',
          name: 'Workers AI',
          requiresApiKey: false,
          models: ['@cf/meta/llama-3.2-3b-instruct'],
          available: true,
        },
      ],
      models: {
        '@cf/meta/llama-3.2-3b-instruct': {
          provider: 'workers-ai',
          displayName: 'Llama 3.2 3B',
          available: true,
        },
      },
      defaultSettings: {
        language: 'en',
        category: 'general',
        product: 'library',
        provider: 'workers-ai',
        model: '@cf/meta/llama-3.2-3b-instruct',
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
