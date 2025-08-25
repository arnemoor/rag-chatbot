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

// Default configuration (fallback when dynamic loading fails)
const DEFAULT_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', available: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', available: true },
  { code: 'fr', name: 'French', nativeName: 'Français', available: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', available: true },
];

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'general',
    name: 'General',
    description: 'All categories combined',
    available: true,
  },
  {
    id: 'fiction',
    name: 'Fiction',
    description: 'Fiction books and literature',
    available: true,
  },
  {
    id: 'non-fiction',
    name: 'Non-Fiction',
    description: 'Non-fiction books and resources',
    available: true,
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Scientific literature and research',
    available: true,
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Technology and programming resources',
    available: true,
  },
  {
    id: 'reference',
    name: 'Reference',
    description: 'Reference materials and documentation',
    available: true,
  },
];

// Helper function to get default products for a category
function getDefaultProductsForCategory(category: Category): Product[] {
  switch (category.id) {
    case 'fiction':
      return [
        { id: 'novels', name: 'Novels', description: 'Fiction novels', categoryId: 'fiction', available: true },
        { id: 'short-stories', name: 'Short Stories', description: 'Short story collections', categoryId: 'fiction', available: true },
      ];
    case 'non-fiction':
      return [
        { id: 'self-help', name: 'Self Help', description: 'Self improvement books', categoryId: 'non-fiction', available: true },
        { id: 'biography', name: 'Biography', description: 'Biographical works', categoryId: 'non-fiction', available: true },
      ];
    case 'science':
      return [
        { id: 'research', name: 'Research', description: 'Scientific research', categoryId: 'science', available: true },
        { id: 'physics', name: 'Physics', description: 'Physics texts', categoryId: 'science', available: true },
      ];
    case 'technology':
      return [
        { id: 'programming', name: 'Programming', description: 'Programming guides', categoryId: 'technology', available: true },
        { id: 'ai-ml', name: 'AI/ML', description: 'Artificial Intelligence and Machine Learning', categoryId: 'technology', available: true },
      ];
    case 'reference':
      return [
        { id: 'catalog', name: 'Catalog', description: 'Reference catalogs', categoryId: 'reference', available: true },
        { id: 'encyclopedias', name: 'Encyclopedias', description: 'Encyclopedia entries', categoryId: 'reference', available: true },
      ];
    default:
      return [{
        id: 'default',
        name: 'Default Collection',
        description: `Default collection for ${category.name}`,
        categoryId: category.id,
        available: true,
      }];
  }
}

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
    models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-chat-latest'],
    available: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Anthropic Claude models',
    requiresApiKey: true,
    models: ['claude-opus-4-1-20250805', 'claude-sonnet-4-20250514'],
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

  // Fallback: Build configuration from defaults and actual R2 structure
  const config = await buildDynamicConfiguration(env);

  // Cache the configuration
  configCache = config;
  cacheTimestamp = Date.now();

  // Optionally save to R2 for future use
  try {
    await saveConfiguration(env, config);
  } catch (error) {
    console.error('Failed to save configuration to R2:', error);
  }

  return config;
}

/**
 * Build configuration dynamically from R2 structure
 */
async function buildDynamicConfiguration(env: Env): Promise<AppConfiguration> {
  const r2ops = new R2Operations(env);

  // Discover categories from R2 structure
  let categories = [...DEFAULT_CATEGORIES];
  let languages = [...DEFAULT_LANGUAGES];

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

      // Update categories and products based on discovery
      if (discoveredCategories.size > 0) {
        const existingIds = new Set(categories.map((c) => c.id));

        // Process discovered categories and their products
        for (const [catId, productSet] of discoveredCategories) {
          let category = categories.find(c => c.id === catId);
          
          if (!category) {
            // Add new category if not in defaults
            category = {
              id: catId,
              name: catId.charAt(0).toUpperCase() + catId.slice(1).replace('-', ' '),
              description: `${catId} resources`,
              available: true,
              products: [],
            };
            categories.push(category);
          }
          
          // Add products to category
          category.products = Array.from(productSet).map((prodId: string) => ({
            id: prodId,
            name: prodId.charAt(0).toUpperCase() + prodId.slice(1).replace('-', ' '),
            description: `${prodId} collection`,
            categoryId: catId,
            available: true,
          }));
        }
      }

      // Update languages if we found any
      if (discoveredLanguages.size > 0) {
        const existingCodes = new Set(languages.map((l) => l.code));

        // Mark existing languages as available/unavailable based on discovery
        languages = languages.map((lang) => ({
          ...lang,
          available: discoveredLanguages.has(lang.code),
        }));
      }
    }
  } catch (error) {
    console.error('Failed to discover categories from R2:', error);
  }

  // Ensure all categories have products (add defaults if needed)
  for (const category of categories) {
    if (category.id !== 'general' && (!category.products || category.products.length === 0)) {
      // Add default products based on category
      category.products = getDefaultProductsForCategory(category);
    }
  }

  return {
    languages,
    categories,
    providers: DEFAULT_PROVIDERS,
    models: MODELS,
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
