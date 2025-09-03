// Model Configuration
// This file contains model mappings including placeholders for future models

export interface ModelConfig {
  provider: string;
  apiName: string;
  displayName: string;
  available: boolean;
  estimatedRelease?: string;
  capabilities?: string[];
}

export const MODELS: Record<string, ModelConfig> = {
  // Workers AI Models (Available)
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast': {
    provider: 'workers-ai',
    apiName: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    displayName: 'Llama 3.3 70B Instruct (Fast)',
    available: true,
    capabilities: ['text-generation', 'multilingual', 'fast'],
  },
  '@cf/meta/llama-3.1-8b-instruct-fast': {
    provider: 'workers-ai',
    apiName: '@cf/meta/llama-3.1-8b-instruct-fast',
    displayName: 'Llama 3.1 8B Instruct (Fast)',
    available: true,
    capabilities: ['text-generation', 'multilingual', 'fast'],
  },
  '@cf/meta/llama-3.1-8b-instruct-fp8': {
    provider: 'workers-ai',
    apiName: '@cf/meta/llama-3.1-8b-instruct-fp8',
    displayName: 'Llama 3.1 8B Instruct (FP8)',
    available: true,
    capabilities: ['text-generation', 'multilingual'],
  },
  '@cf/meta/llama-4-scout-17b-16e-instruct': {
    provider: 'workers-ai',
    apiName: '@cf/meta/llama-4-scout-17b-16e-instruct',
    displayName: 'Llama 4 Scout 17B',
    available: true,
    capabilities: ['text-generation', 'multilingual'],
  },
  '@cf/meta/llama-3.2-3b-instruct': {
    provider: 'workers-ai',
    apiName: '@cf/meta/llama-3.2-3b-instruct',
    displayName: 'Llama 3.2 3B Instruct',
    available: true,
    capabilities: ['text-generation', 'multilingual'],
  },

  // OpenAI Current Models
  'gpt-5': {
    provider: 'openai',
    apiName: 'gpt-5',
    displayName: 'GPT-5',
    available: true,
    capabilities: ['text-generation', 'vision', 'advanced-reasoning', 'multimodal'],
  },
  'gpt-5-mini': {
    provider: 'openai',
    apiName: 'gpt-5-mini',
    displayName: 'GPT-5 Mini',
    available: true,
    capabilities: ['text-generation', 'fast', 'cost-effective'],
  },
  'gpt-5-nano': {
    provider: 'openai',
    apiName: 'gpt-5-nano',
    displayName: 'GPT-5 Nano',
    available: true,
    capabilities: ['text-generation', 'ultra-fast', 'edge-computing'],
  },
  'gpt-5-chat-latest': {
    provider: 'openai',
    apiName: 'gpt-5-chat-latest',
    displayName: 'GPT-5 Chat Latest',
    available: true,
    capabilities: ['text-generation', 'chat-optimized', 'latest-features'],
  },
  'gpt-4o': {
    provider: 'openai',
    apiName: 'gpt-4o',
    displayName: 'GPT-4 Turbo',
    available: true,
    capabilities: ['text-generation', 'vision', 'advanced-reasoning'],
  },
  'gpt-4o-mini': {
    provider: 'openai',
    apiName: 'gpt-4o-mini',
    displayName: 'GPT-4 Turbo Mini',
    available: true,
    capabilities: ['text-generation', 'fast', 'cost-effective'],
  },

  // Anthropic Current Models
  'claude-opus-4-1-20250805': {
    provider: 'anthropic',
    apiName: 'claude-opus-4-1-20250805',
    displayName: 'Claude Opus 4.1',
    available: true,
    capabilities: ['text-generation', 'advanced-reasoning', 'long-context', 'multimodal'],
  },
  'claude-sonnet-4-20250514': {
    provider: 'anthropic',
    apiName: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4.0',
    available: true,
    capabilities: ['text-generation', 'balanced-performance', 'cost-effective'],
  },
  'claude-3-5-sonnet-20241022': {
    provider: 'anthropic',
    apiName: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    available: true,
    capabilities: ['text-generation', 'advanced-reasoning', 'long-context'],
  },
  'claude-3-haiku-20240307': {
    provider: 'anthropic',
    apiName: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    available: true,
    capabilities: ['text-generation', 'fast', 'cost-effective'],
  },
};

// Helper function to check if a model is available
export function isModelAvailable(modelId: string): boolean {
  return MODELS[modelId]?.available || false;
}

// Helper function to get model config
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODELS[modelId];
}

// Function to handle future model requests
export function handleFutureModel(modelId: string): string {
  const model = MODELS[modelId];
  if (!model) {
    return `Unknown model: ${modelId}`;
  }

  if (!model.available) {
    return `${model.displayName} is not yet available. Estimated release: ${model.estimatedRelease || 'TBA'}. Please use a currently available model.`;
  }

  return '';
}
