/**
 * Dynamic Configuration Module
 * Provides centralized configuration management for all AutoRAG settings
 */

import { MODELS, ModelConfig } from './models';
import { R2Operations } from './r2-operations';
import { Env } from './types';

// Configuration interfaces
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  products?: Product[];
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  available: boolean;
}

export interface Provider {
  id: string;
  name: string;
  description?: string;
  requiresApiKey: boolean;
  models: string[];
  available: boolean;
}

export interface AppConfiguration {
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

// Language metadata for discovered language codes
const LANGUAGE_METADATA: Record<string, { name: string; nativeName: string }> = {
  'en': { name: 'English', nativeName: 'English' },
  'de': { name: 'German', nativeName: 'Deutsch' },
  'fr': { name: 'French', nativeName: 'Français' },
  'it': { name: 'Italian', nativeName: 'Italiano' },
  'es': { name: 'Spanish', nativeName: 'Español' },
  'pt': { name: 'Portuguese', nativeName: 'Português' },
  'zh': { name: 'Chinese', nativeName: '中文' },
  'ja': { name: 'Japanese', nativeName: '日本語' },
  'ko': { name: 'Korean', nativeName: '한국어' },
  'ru': { name: 'Russian', nativeName: 'Русский' },
  'ar': { name: 'Arabic', nativeName: 'العربية' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी' },
};


const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'workers-ai',
    name: 'Workers AI',
    description: 'Cloudflare Workers AI with built-in RAG',
    requiresApiKey: false,
    models: ['@cf/meta/llama-3.2-3b-instruct', '@cf/meta/llama-3.1-8b-instruct-fast'],
    available: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI GPT models',
    requiresApiKey: true,
    models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-chat-latest', 'gpt-4o', 'gpt-4o-mini'],
    available: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Anthropic Claude models',
    requiresApiKey: true,
    models: ['claude-opus-4-1-20250805', 'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    available: true,
  },
];

// Configuration cache
let configCache: AppConfiguration | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load dynamic configuration from R2 or environment
 */
export async function loadConfiguration(env: Env): Promise<AppConfiguration> {
  // Check cache first
  if (configCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return configCache;
  }

  try {
    // Try to load configuration from R2
    const r2ops = new R2Operations(env);
    const configObject = await env.R2_BUCKET.get('_config/app-config.json');

    if (configObject) {
      const configText = await configObject.text();
      const loadedConfig = JSON.parse(configText) as AppConfiguration;

      // Merge with models from code
      loadedConfig.models = MODELS;

      // Cache the configuration
      configCache = loadedConfig;
      cacheTimestamp = Date.now();

      return loadedConfig;
    }
  } catch (error) {
    console.error('Failed to load configuration from R2:', error);
  }

  // Build configuration from R2 structure discovery only
  const config = await buildDynamicConfiguration(env);

  // Cache the configuration
  configCache = config;
  cacheTimestamp = Date.now();

  // DO NOT auto-save discovered config - let users manage _config/app-config.json manually
  
  return config;
}

/**
 * Build configuration dynamically from R2 structure
 */
async function buildDynamicConfiguration(env: Env): Promise<AppConfiguration> {
  const r2ops = new R2Operations(env);

  // Discover categories from R2 structure - NO DEFAULTS
  let categories: Category[] = [];
  let languages: Language[] = [];

  try {
    // List top-level folders to discover categories
    const result = await r2ops.list('', '/');

    if (result.delimitedPrefixes) {
      const discoveredCategories = new Map<string, Set<string>>(); // category -> products
      const discoveredLanguages = new Set<string>();

      for (const prefix of result.delimitedPrefixes) {
        const categoryName = prefix.replace('/', '');
        if (categoryName && !categoryName.startsWith('_')) {
          const categoryProducts = new Set<string>();

          // Check for products within this category (second level)
          try {
            const productResult = await r2ops.list(prefix, '/');
            if (productResult.delimitedPrefixes) {
              for (const productPrefix of productResult.delimitedPrefixes) {
                const productName = productPrefix.replace(prefix, '').replace('/', '');
                if (productName && !productName.startsWith('_')) {
                  categoryProducts.add(productName);

                  // Check for languages within this product (third level)
                  try {
                    const langResult = await r2ops.list(productPrefix, '/');
                    if (langResult.delimitedPrefixes) {
                      for (const langPrefix of langResult.delimitedPrefixes) {
                        const langCode = langPrefix.replace(productPrefix, '').replace('/', '');
                        if (langCode && langCode.length === 2) {
                          discoveredLanguages.add(langCode);
                        }
                      }
                    }
                  } catch (e) {
                    console.error(`Failed to discover languages in ${productPrefix}:`, e);
                  }
                }
              }
            }
          } catch (e) {
            console.error(`Failed to discover products in ${prefix}:`, e);
          }

          if (categoryProducts.size > 0) {
            discoveredCategories.set(categoryName, categoryProducts);
          }
        }
      }

      // Build categories from discovered structure only
      if (discoveredCategories.size > 0) {
        for (const [catId, productSet] of discoveredCategories) {
          const category: Category = {
            id: catId,
            name: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, ' '),
            description: `${catId} documents`,
            available: true,
            products: Array.from(productSet).map((prodId: string) => ({
              id: prodId,
              name: prodId.charAt(0).toUpperCase() + prodId.slice(1).replace(/-/g, ' '),
              description: `${prodId} collection`,
              categoryId: catId,
              available: true,
            })),
          };
          categories.push(category);
        }
      }

      // Build languages list from discovered languages only
      if (discoveredLanguages.size > 0) {
        languages = Array.from(discoveredLanguages).map(code => ({
          code,
          name: LANGUAGE_METADATA[code]?.name || code.toUpperCase(),
          nativeName: LANGUAGE_METADATA[code]?.nativeName || code.toUpperCase(),
          available: true,
        }));
      }
    }
  } catch (error) {
    console.error('Failed to discover categories from R2:', error);
  }

  // Do NOT add default products - only use what's discovered from R2

  return {
    languages,
    categories,
    providers: DEFAULT_PROVIDERS,
    models: MODELS,
    defaultSettings: {
      language: 'en',
      category: '', // No default - must come from R2
      product: '', // No default - must come from R2
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
      themes: ['light', 'dark', 'auto'],
      positions: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      defaultTheme: 'light',
      defaultPosition: 'bottom-right',
    },
  };
}

/**
 * Save configuration to R2
 */
async function saveConfiguration(env: Env, config: AppConfiguration): Promise<void> {
  try {
    await env.R2_BUCKET.put('_config/app-config.json', JSON.stringify(config, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
      },
      customMetadata: {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to save configuration:', error);
    throw error;
  }
}

/**
 * Clear configuration cache
 */
export function clearConfigCache(): void {
  configCache = null;
  cacheTimestamp = 0;
}

/**
 * Get specific configuration sections
 */
export async function getLanguages(env: Env): Promise<Language[]> {
  const config = await loadConfiguration(env);
  return config.languages;
}

export async function getCategories(env: Env): Promise<Category[]> {
  const config = await loadConfiguration(env);
  return config.categories;
}

export async function getProviders(env: Env): Promise<Provider[]> {
  const config = await loadConfiguration(env);
  return config.providers;
}

export async function getModels(
  env: Env,
  providerId?: string,
): Promise<Record<string, ModelConfig>> {
  const config = await loadConfiguration(env);

  if (providerId) {
    const provider = config.providers.find((p) => p.id === providerId);
    if (provider) {
      const filteredModels: Record<string, ModelConfig> = {};
      for (const modelId of provider.models) {
        if (config.models[modelId]) {
          filteredModels[modelId] = config.models[modelId];
        }
      }
      return filteredModels;
    }
  }

  return config.models;
}

export async function getProducts(env: Env, categoryId: string): Promise<Product[]> {
  const config = await loadConfiguration(env);
  const category = config.categories.find((c) => c.id === categoryId);
  return category?.products || [];
}
