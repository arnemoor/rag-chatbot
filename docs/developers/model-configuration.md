# AutoRAG Model Configuration Guide

## Overview

AutoRAG supports multiple AI providers and models, giving you flexibility to choose the right balance of cost, speed, and quality for your use case. This guide covers model selection, configuration, optimization strategies, and cost management.

## Available AI Providers

### 1. Workers AI (Cloudflare Native)

**Advantages:**
- No additional API keys required
- Integrated billing with Cloudflare
- Low latency (runs on Cloudflare's edge)
- Free tier available
- No external dependencies

**Limitations:**
- Smaller model selection
- Lower quality compared to premium models
- Limited customization options

#### Available Models

```typescript
const workersAIModels = {
  "@cf/meta/llama-3.2-3b-instruct": {
    name: "Llama 3.2 3B",
    contextLength: 8192,
    cost: "Free",
    speed: "Fast",
    quality: "Good",
    useCase: "General queries, simple tasks"
  },
  "@cf/meta/llama-3.1-8b-instruct-fast": {
    name: "Llama 3.1 8B Fast",
    contextLength: 8192,
    cost: "Free",
    speed: "Very Fast", 
    quality: "Better",
    useCase: "Real-time chat, basic support"
  },
  "@cf/meta/llama-3.1-70b-instruct": {
    name: "Llama 3.1 70B",
    contextLength: 8192,
    cost: "Low",
    speed: "Medium",
    quality: "Very Good",
    useCase: "Complex queries, detailed responses"
  }
};
```

#### Configuration Example
```javascript
const workersAIConfig = {
  provider: "workers-ai",
  model: "@cf/meta/llama-3.1-8b-instruct-fast",
  parameters: {
    max_tokens: 1024,
    temperature: 0.1,
    top_p: 0.9
  }
};
```

### 2. OpenAI

**Advantages:**
- Industry-leading model quality
- Extensive model selection
- Advanced reasoning capabilities
- Strong multilingual support
- Regular model updates

**Considerations:**
- Requires OpenAI API key
- Higher costs for premium models
- External dependency
- Usage-based billing

#### GPT-5 Series Models (Current Generation - Uses NEW Responses API!)

**⚠️ CRITICAL: GPT-5 models use a completely different API than older models!**

```typescript
const gpt5Models = {
  "gpt-5": {
    name: "GPT-5 (Full)",
    api_endpoint: "/v1/responses",  // NOT /v1/chat/completions!
    contextLength: 256000,
    cost: "$15/$60 per MTok",
    speed: "Medium (includes reasoning time)",
    quality: "State-of-the-art with reasoning",
    useCase: "Complex reasoning, analysis, planning",
    special_params: {
      input: "string",  // Uses "input" not "messages"!
      reasoning: { effort: ["low", "medium", "high"] },
      text: { verbosity: ["low", "medium", "high"] },
      // NO temperature, max_tokens, etc!
    }
  },
  "gpt-5-mini": {
    name: "GPT-5 Mini",
    api_endpoint: "/v1/responses",
    contextLength: 128000,
    cost: "$3/$12 per MTok",
    speed: "Fast",
    quality: "Excellent reasoning",
    useCase: "Cost-effective reasoning model"
  },
  "gpt-5-nano": {
    name: "GPT-5 Nano",
    api_endpoint: "/v1/responses",
    contextLength: 64000,
    cost: "$0.30/$1.20 per MTok",
    speed: "Very Fast",
    quality: "Good reasoning",
    useCase: "Budget-friendly quick reasoning"
  }
};

// ACTUAL IMPLEMENTATION FROM OUR WORKER:
if (model.startsWith('gpt-5')) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      input: combinedInput,  // NOT "messages"!
      reasoning: { effort: 'low' },
      text: { verbosity: 'medium' }
    })
  });
  
  // Complex response parsing required:
  const data = await response.json();
  const messageItem = data.output.find(item => item.type === 'message');
  const outputItem = messageItem.content.find(c => c.type === 'output_text');
  return outputItem.text;
}
```


#### Configuration Example (GPT-5)
```javascript
// IMPORTANT: GPT-5 uses different API and parameters!
const openAIConfig = {
  provider: "openai",
  model: "gpt-5-mini",  // or gpt-5, gpt-5-nano
  parameters: {
    max_tokens: 2048,
    temperature: 0.1,
    top_p: 0.9,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  },
  systemPrompt: "You are a helpful technical support assistant..."
};
```

### 3. Anthropic Claude

**Advantages:**
- Excellent reasoning and analysis
- Strong safety measures
- Long context windows
- High-quality responses
- Good at following instructions

**Considerations:**
- Requires Anthropic API key
- Premium pricing
- Slower response times
- External dependency

#### Available Models

```typescript
const anthropicModels = {
  "claude-opus-4-1-20250805": {
    name: "Claude Opus 4.1",
    contextLength: 200000,
    cost: "$15/$75 per MTok",
    speed: "Slow",
    quality: "Best",
    useCase: "Complex analysis, critical tasks",
    features: ["Exceptional reasoning", "Long context", "Safety-focused"]
  },
  "claude-sonnet-4-20250514": {
    name: "Claude Sonnet 4",
    contextLength: 200000,
    cost: "$3/$15 per MTok",
    speed: "Fast",
    quality: "Excellent",
    useCase: "General use, balanced performance",
    features: ["Good reasoning", "Fast responses", "Balanced cost"]
  },
  "claude-haiku-4-20250109": {
    name: "Claude Haiku 4",
    contextLength: 200000,
    cost: "$0.25/$1.25 per MTok",
    speed: "Very Fast",
    quality: "Good",
    useCase: "High-volume, quick responses",
    features: ["Ultra-fast", "Cost-effective", "Good quality"]
  }
};
```

#### Configuration Example
```javascript
const anthropicConfig = {
  provider: "anthropic",
  model: "claude-sonnet-4-20250514", 
  parameters: {
    max_tokens: 2048,
    temperature: 0.1,
    top_p: 0.9
  },
  systemPrompt: "You are Claude, a helpful AI assistant..."
};
```

## Model Selection Strategy

### 1. Use Case Based Selection

#### Real-time Chat Support
```javascript
const realTimeChatConfig = {
  primary: {
    provider: "workers-ai",
    model: "@cf/meta/llama-3.1-8b-instruct-fast",
    reason: "Ultra-fast responses, no external dependencies"
  },
  fallback: {
    provider: "openai", 
    model: "gpt-5-nano",
    reason: "Fast and cost-effective backup"
  }
};
```

#### Complex Technical Support
```javascript
const complexSupportConfig = {
  primary: {
    provider: "openai",
    model: "gpt-5",
    reason: "Advanced reasoning for complex problems"
  },
  fallback: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    reason: "Alternative high-quality reasoning"
  }
};
```

#### High-Volume, Cost-Sensitive
```javascript
const highVolumeConfig = {
  primary: {
    provider: "workers-ai",
    model: "@cf/meta/llama-3.1-8b-instruct-fast",
    reason: "Free tier, good quality"
  },
  fallback: {
    provider: "openai",
    model: "gpt-5-nano", 
    reason: "Very low cost per token"
  }
};
```

#### Premium Support
```javascript
const premiumSupportConfig = {
  primary: {
    provider: "anthropic",
    model: "claude-opus-4-1-20250805",
    reason: "Highest quality responses"
  },
  fallback: {
    provider: "openai",
    model: "gpt-5",
    reason: "Alternative premium option"
  }
};
```

### 2. Performance vs Cost Matrix

```typescript
interface ModelMetrics {
  provider: string;
  model: string;
  costPerQuery: number; // USD
  averageLatency: number; // milliseconds
  qualityScore: number; // 1-10
  reliabilityScore: number; // 1-10
}

const modelComparison: ModelMetrics[] = [
  {
    provider: "workers-ai",
    model: "@cf/meta/llama-3.1-8b-instruct-fast",
    costPerQuery: 0,
    averageLatency: 800,
    qualityScore: 7,
    reliabilityScore: 9
  },
  {
    provider: "openai",
    model: "gpt-5-nano",
    costPerQuery: 0.001,
    averageLatency: 1200,
    qualityScore: 8,
    reliabilityScore: 9
  },
  {
    provider: "openai", 
    model: "gpt-5-mini",
    costPerQuery: 0.005,
    averageLatency: 1500,
    qualityScore: 9,
    reliabilityScore: 9
  },
  {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    costPerQuery: 0.015,
    averageLatency: 2000,
    qualityScore: 9.5,
    reliabilityScore: 8
  }
];
```

## Dynamic Model Selection

### 1. Intelligent Routing

```typescript
class ModelRouter {
  private models: ModelConfiguration[];
  private metrics: ModelMetrics;
  
  constructor() {
    this.models = this.loadModelConfigurations();
    this.metrics = new ModelMetrics();
  }
  
  async selectModel(query: ChatQuery): Promise<ModelConfiguration> {
    const factors = {
      complexity: this.analyzeQueryComplexity(query.query),
      urgency: this.determineUrgency(query),
      userTier: this.getUserTier(query.dignity),
      timeOfDay: this.getTimeOfDay(),
      currentLoad: await this.getCurrentSystemLoad()
    };
    
    return this.routeBasedOnFactors(factors);
  }
  
  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const indicators = {
      simple: ['what is', 'how to', 'where is', 'when'],
      medium: ['configure', 'setup', 'install', 'troubleshoot'],
      complex: ['migrate', 'integrate', 'customize', 'develop', 'analyze']
    };
    
    const queryLower = query.toLowerCase();
    
    if (indicators.complex.some(term => queryLower.includes(term))) {
      return 'complex';
    }
    if (indicators.medium.some(term => queryLower.includes(term))) {
      return 'medium';
    }
    return 'simple';
  }
  
  private routeBasedOnFactors(factors: RoutingFactors): ModelConfiguration {
    // Premium users get best models
    if (factors.userTier === 'premium') {
      return this.models.find(m => m.quality === 'best') || this.models[0];
    }
    
    // Complex queries need better models
    if (factors.complexity === 'complex') {
      return this.models.find(m => m.quality >= 'excellent') || this.models[0];
    }
    
    // High load periods use faster models
    if (factors.currentLoad > 0.8) {
      return this.models.find(m => m.speed === 'very-fast') || this.models[0];
    }
    
    // Default to balanced option
    return this.models.find(m => m.quality === 'very-good' && m.speed === 'fast') || this.models[0];
  }
}
```

### 2. Fallback Chain Configuration

```typescript
const fallbackChainConfig = {
  primary: {
    provider: "openai",
    model: "gpt-5-mini",
    timeout: 5000,
    retries: 2
  },
  fallbacks: [
    {
      provider: "workers-ai",
      model: "@cf/meta/llama-3.1-8b-instruct-fast",
      timeout: 3000,
      retries: 1,
      trigger: ["timeout", "rate_limit", "api_error"]
    },
    {
      provider: "anthropic",
      model: "claude-haiku-4-20250109",
      timeout: 8000,
      retries: 1,
      trigger: ["all_providers_failed"]
    }
  ],
  emergency: {
    provider: "workers-ai",
    model: "@cf/meta/llama-3.2-3b-instruct",
    message: "Using emergency backup model due to service issues"
  }
};

class FallbackManager {
  async executeWithFallback(query: ChatQuery): Promise<ChatResponse> {
    const config = fallbackChainConfig;
    
    // Try primary model
    try {
      return await this.callModel(config.primary, query);
    } catch (error) {
      console.warn(`Primary model failed: ${error.message}`);
    }
    
    // Try fallback models
    for (const fallback of config.fallbacks) {
      if (this.shouldTriggerFallback(error, fallback.trigger)) {
        try {
          return await this.callModel(fallback, query);
        } catch (fallbackError) {
          console.warn(`Fallback model failed: ${fallbackError.message}`);
        }
      }
    }
    
    // Emergency fallback
    console.error("All models failed, using emergency backup");
    return await this.callModel(config.emergency, query);
  }
}
```

## Cost Optimization Strategies

### 1. Token Usage Optimization

```typescript
class TokenOptimizer {
  private tokenLimits = {
    "gpt-5": { input: 2000, output: 1000 },
    "gpt-5-mini": { input: 1500, output: 800 },
    "claude-sonnet-4-20250514": { input: 1800, output: 1200 }
  };
  
  optimizePrompt(originalPrompt: string, model: string): string {
    const limits = this.tokenLimits[model];
    if (!limits) return originalPrompt;
    
    // Remove unnecessary whitespace
    let optimized = originalPrompt.trim().replace(/\s+/g, ' ');
    
    // Truncate if too long
    const estimatedTokens = this.estimateTokens(optimized);
    if (estimatedTokens > limits.input) {
      optimized = this.truncateToTokenLimit(optimized, limits.input);
    }
    
    return optimized;
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  private truncateToTokenLimit(text: string, tokenLimit: number): string {
    const charLimit = tokenLimit * 4;
    if (text.length <= charLimit) return text;
    
    // Truncate at sentence boundary if possible
    const truncated = text.substring(0, charLimit);
    const lastSentence = truncated.lastIndexOf('.');
    
    return lastSentence > charLimit * 0.8 
      ? truncated.substring(0, lastSentence + 1)
      : truncated + '...';
  }
}
```

### 2. Caching Strategy

```typescript
class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private ttl = 3600000; // 1 hour
  
  async getCachedResponse(query: ChatQuery): Promise<ChatResponse | null> {
    const cacheKey = this.generateCacheKey(query);
    const entry = this.cache.get(cacheKey);
    
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.response;
    }
    
    return null;
  }
  
  cacheResponse(query: ChatQuery, response: ChatResponse): void {
    const cacheKey = this.generateCacheKey(query);
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
  }
  
  private generateCacheKey(query: ChatQuery): string {
    // Create cache key from query essentials
    return `${query.query}:${query.language}:${query.product}:${query.dignity}`;
  }
}
```

### 3. Cost Monitoring

```typescript
class CostMonitor {
  private dailyBudgets = {
    "openai": 100, // $100/day
    "anthropic": 50, // $50/day
    "workers-ai": 0 // Free tier
  };
  
  private currentSpend = new Map<string, number>();
  
  async checkBudget(provider: string, estimatedCost: number): Promise<boolean> {
    const currentDaily = this.currentSpend.get(provider) || 0;
    const budget = this.dailyBudgets[provider];
    
    if (currentDaily + estimatedCost > budget) {
      console.warn(`Daily budget exceeded for ${provider}: $${currentDaily + estimatedCost} > $${budget}`);
      return false;
    }
    
    return true;
  }
  
  recordCost(provider: string, cost: number): void {
    const current = this.currentSpend.get(provider) || 0;
    this.currentSpend.set(provider, current + cost);
  }
  
  getDailyReport(): CostReport {
    const report: CostReport = {
      totalSpend: 0,
      providerBreakdown: {},
      budgetStatus: {}
    };
    
    for (const [provider, spent] of this.currentSpend) {
      const budget = this.dailyBudgets[provider];
      report.totalSpend += spent;
      report.providerBreakdown[provider] = spent;
      report.budgetStatus[provider] = {
        spent,
        budget,
        remaining: budget - spent,
        utilizationPercent: (spent / budget) * 100
      };
    }
    
    return report;
  }
}
```

## Environment-Specific Configuration

### 1. Development Environment

```typescript
const developmentConfig = {
  defaultProvider: "workers-ai",
  defaultModel: "@cf/meta/llama-3.1-8b-instruct-fast",
  enableCaching: false,
  enableFallbacks: false,
  debugMode: true,
  rateLimiting: false,
  budgetLimits: {
    daily: 10,
    monthly: 100
  }
};
```

### 2. Staging Environment

```typescript
const stagingConfig = {
  defaultProvider: "openai",
  defaultModel: "gpt-5-nano",
  enableCaching: true,
  enableFallbacks: true,
  debugMode: true,
  rateLimiting: true,
  budgetLimits: {
    daily: 50,
    monthly: 500
  },
  fallbackChain: [
    "workers-ai/@cf/meta/llama-3.1-8b-instruct-fast"
  ]
};
```

### 3. Production Environment

```typescript
const productionConfig = {
  defaultProvider: "openai",
  defaultModel: "gpt-5-mini",
  enableCaching: true,
  enableFallbacks: true,
  debugMode: false,
  rateLimiting: true,
  budgetLimits: {
    daily: 200,
    monthly: 5000
  },
  fallbackChain: [
    "workers-ai/@cf/meta/llama-3.1-8b-instruct-fast",
    "anthropic/claude-haiku-4-20250109"
  ],
  monitoring: {
    alertThresholds: {
      errorRate: 0.05,
      latency: 5000,
      costPerDay: 150
    }
  }
};
```

## Model Parameter Tuning

### 1. Temperature Settings

```typescript
const temperatureSettings = {
  "factual-support": {
    temperature: 0.1,
    description: "Low creativity, high accuracy for factual queries"
  },
  "general-chat": {
    temperature: 0.3,
    description: "Balanced creativity and accuracy"
  },
  "creative-help": {
    temperature: 0.7,
    description: "Higher creativity for open-ended questions"
  }
};

function selectTemperature(queryType: string): number {
  const setting = temperatureSettings[queryType];
  return setting ? setting.temperature : 0.3;
}
```

### 2. System Prompt Optimization

```typescript
const systemPrompts = {
  "technical-support": `You are a technical support specialist for academic IT systems. 
You provide accurate, step-by-step guidance for:
- LibraryOnline (practice management system)
- Librarywin (library software)  
- KnowledgeHub (health information platform)
- ScholarAccess (telemedicine platform)

Always:
- Cite relevant documentation sections
- Provide specific steps numbered clearly
- Ask clarifying questions when needed
- Escalate complex issues appropriately`,

  "general-help": `You are a helpful assistant for academic professionals.
You provide clear, concise answers while maintaining:
- Professional library terminology
- Respectful tone appropriate for academic
- Accurate information based on provided documentation
- Quick resolution of common questions`,

  "administrator": `You are a system administrator assistant.
You help with:
- System configuration and setup
- User management and permissions
- Technical troubleshooting
- Integration and deployment issues

Focus on:
- Security best practices
- Detailed technical explanations
- Step-by-step configuration guides
- Preventive maintenance recommendations`
};
```

### 3. Response Format Templates

```typescript
const responseTemplates = {
  "step-by-step": {
    prefix: "Here's how to {task}:\n\n",
    format: "numbered-list",
    footer: "\nIf you encounter any issues with these steps, please provide:\n- Your system version\n- Error messages (if any)\n- Which step failed"
  },
  
  "troubleshooting": {
    prefix: "Let's troubleshoot this issue:\n\n",
    format: "diagnostic-flow",
    sections: ["symptoms", "causes", "solutions", "prevention"],
    footer: "\nIf the issue persists, please contact technical support with the above information."
  },
  
  "configuration": {
    prefix: "Configuration for {feature}:\n\n",
    format: "structured-guide",
    sections: ["prerequisites", "steps", "verification", "common-issues"],
    footer: "\nRemember to backup your configuration before making changes."
  }
};
```

## Advanced Configuration

### 1. Multi-Model Ensemble

```typescript
class EnsembleManager {
  async getEnsembleResponse(query: ChatQuery): Promise<ChatResponse> {
    const models = [
      { provider: "openai", model: "gpt-5-mini", weight: 0.4 },
      { provider: "anthropic", model: "claude-sonnet-4-20250514", weight: 0.4 },
      { provider: "workers-ai", model: "@cf/meta/llama-3.1-8b-instruct-fast", weight: 0.2 }
    ];
    
    // Get responses from multiple models
    const responses = await Promise.allSettled(
      models.map(config => this.callModel(config, query))
    );
    
    // Combine and rank responses
    const validResponses = responses
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
    
    if (validResponses.length === 0) {
      throw new Error('All ensemble models failed');
    }
    
    // Use consensus or highest confidence response
    return this.selectBestResponse(validResponses, models);
  }
  
  private selectBestResponse(responses: ChatResponse[], models: ModelConfig[]): ChatResponse {
    // Score responses based on length, confidence, citation quality
    const scored = responses.map((response, index) => ({
      response,
      score: this.scoreResponse(response) * models[index].weight
    }));
    
    // Return highest scoring response
    scored.sort((a, b) => b.score - a.score);
    return scored[0].response;
  }
}
```

### 2. A/B Testing Framework

```typescript
class ModelABTesting {
  private experiments = new Map<string, ABTest>();
  
  startExperiment(name: string, config: ABTestConfig): void {
    this.experiments.set(name, {
      name,
      config,
      results: { a: [], b: [] },
      startTime: Date.now()
    });
  }
  
  async getModelForUser(userId: string, experimentName: string): Promise<ModelConfiguration> {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) return this.getDefaultModel();
    
    // Assign user to A or B group based on hash
    const group = this.assignUserToGroup(userId);
    return group === 'A' ? experiment.config.modelA : experiment.config.modelB;
  }
  
  recordResult(experimentName: string, userId: string, result: TestResult): void {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) return;
    
    const group = this.assignUserToGroup(userId);
    experiment.results[group.toLowerCase()].push(result);
  }
  
  getExperimentResults(experimentName: string): ABTestResults {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) throw new Error('Experiment not found');
    
    return {
      groupA: this.analyzeResults(experiment.results.a),
      groupB: this.analyzeResults(experiment.results.b),
      significance: this.calculateSignificance(experiment.results),
      recommendation: this.generateRecommendation(experiment.results)
    };
  }
}
```

## Performance Optimization

### 1. Response Time Optimization

```typescript
class PerformanceOptimizer {
  private performanceTargets = {
    "real-time": 1000,    // 1 second
    "interactive": 3000,  // 3 seconds
    "background": 10000   // 10 seconds
  };
  
  async optimizeForLatency(query: ChatQuery): Promise<ModelConfiguration> {
    const urgency = this.determineUrgency(query);
    const target = this.performanceTargets[urgency];
    
    // Select fastest model that meets quality requirements
    const fastModels = this.getModelsBySpeed()
      .filter(model => model.averageLatency < target)
      .sort((a, b) => b.qualityScore - a.qualityScore);
    
    return fastModels[0] || this.getFallbackModel();
  }
  
  async preemptiveCache(commonQueries: string[]): Promise<void> {
    // Pre-generate responses for common queries during low traffic
    for (const query of commonQueries) {
      const cacheKey = this.generateCacheKey(query);
      if (!this.cache.has(cacheKey)) {
        try {
          const response = await this.generateResponse(query);
          this.cache.set(cacheKey, response);
        } catch (error) {
          console.warn(`Failed to pre-cache query: ${query}`);
        }
      }
    }
  }
}
```

### 2. Quality Assurance

```typescript
class ResponseQualityValidator {
  private qualityMetrics = {
    minLength: 50,
    maxLength: 2000,
    minCitations: 1,
    bannedPhrases: ["I don't know", "I'm not sure", "I cannot"],
    requiredElements: ["specific steps", "clear instructions"]
  };
  
  validateResponse(response: ChatResponse, query: ChatQuery): QualityReport {
    const issues = [];
    
    // Length validation
    if (response.text.length < this.qualityMetrics.minLength) {
      issues.push("Response too short");
    }
    if (response.text.length > this.qualityMetrics.maxLength) {
      issues.push("Response too long");
    }
    
    // Citation validation
    if (response.citations.length < this.qualityMetrics.minCitations) {
      issues.push("Insufficient citations");
    }
    
    // Content validation
    for (const phrase of this.qualityMetrics.bannedPhrases) {
      if (response.text.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push(`Contains banned phrase: ${phrase}`);
      }
    }
    
    // Relevance scoring
    const relevanceScore = this.calculateRelevance(query, response);
    if (relevanceScore < 0.7) {
      issues.push("Low relevance score");
    }
    
    return {
      passed: issues.length === 0,
      issues,
      score: this.calculateOverallScore(response, issues),
      recommendations: this.generateRecommendations(issues)
    };
  }
}
```

This comprehensive model configuration guide provides developers with everything needed to select, configure, and optimize AI models for their specific AutoRAG implementation requirements.