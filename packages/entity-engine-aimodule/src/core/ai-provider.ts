/**
 * AI Provider and Model Management
 * 
 * Manages custom providers, model registry, and global configuration.
 * Includes model aliases, settings, and limitations.
 */

import type { 
  ModelSettings,
  AISettingsManagement
} from './ai-settings';
// Import required types and classes
import type { 
  EmbeddingModelConfig,
  AIEmbeddingsIntegration
} from './ai-embeddings';

import { EventEmitter } from 'events';
import {
  type Provider,
  customProvider,
  type ImageModel,
  wrapLanguageModel,
  type LanguageModel,
  type EmbeddingModel,
  createProviderRegistry,
  defaultSettingsMiddleware
} from 'ai';

// Type Definitions

/**
 * Custom provider configuration
 */
export interface CustomProviderConfig {
  // Language model configuration
  languageModels?: Record<string, LanguageModel | {
    model: LanguageModel;
    middleware?: any;
    settings?: {
      maxOutputTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      seed?: number;
      providerOptions?: Record<string, any>;
    };
  }>;
  
  // Embedding model configuration
  embeddingModels?: Record<string, EmbeddingModel>;
  
  // Image model configuration
  imageModels?: Record<string, ImageModel>;
  
  // Fallback provider
  fallbackProvider?: Provider;
}

/**
 * Provider registry configuration
 */
export interface ProviderRegistryConfig {
  providers: Record<string, Provider>;
  options?: {
    separator?: string; // 默认为 ':',官方支持自定义分隔符
  };
}

/**
 * Model alias configuration
 */
export interface ModelAliasConfig {
  alias: string;
  providerId: string;
  modelId: string;
  settings?: any;
  middleware?: any;
}

/**
 * Global provider configuration
 */
export interface GlobalProviderConfig {
  defaultProvider: Provider;
  modelPrefixes?: Record<string, Provider>; // Support prefix routing
}

/**
 * Provider health check results
 */
export interface ProviderHealthStatus {
  providerId: string;
  isHealthy: boolean;
  latency?: number;
  error?: string;
  lastCheck: Date;
}

/**
 * Model usage statistics
 */
export interface ModelUsageStats {
  modelId: string;
  providerId: string;
  totalCalls: number;
  totalTokens: number;
  averageLatency: number;
  errorRate: number;
  lastUsed: Date;
}

// Core Provider Management Class

/**
 * AI Provider Management Integration Class
 */
export class AIProviderManagement extends EventEmitter {
  private initialized: boolean = false;
  private registry: any | null = null;
  private customProviders: Map<string, Provider> = new Map();
  private modelAliases: Map<string, ModelAliasConfig> = new Map();
  private healthStatus: Map<string, ProviderHealthStatus> = new Map();
  private usageStats: Map<string, ModelUsageStats> = new Map();
  private defaultLanguageModel: any | null = null;
  private defaultEmbeddingModel: any | null = null;
  private globalProvider: Provider | null = null;

  // 新增：嵌入和设置管理相关属性
  private embeddingModelConfigs: Map<string, EmbeddingModelConfig> = new Map();
  private modelSettingsPresets: Map<string, ModelSettings> = new Map();
  private embeddingsIntegration: any; // AIEmbeddingsIntegration - 延迟初始化
  private settingsManagement: any;    // AISettingsManager - 延迟初始化

  constructor() {
    super();
    // 延迟初始化以避免循环依赖
    this.embeddingsIntegration = null;
    this.settingsManagement = null;
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.emit('ai_provider:initializing');
      
      // 环境变量应该在模块初始化阶段加载，不在这里处理
      
      // 2. 延迟导入以避免循环依赖
      const { AIEmbeddingsIntegration } = await import('./ai-embeddings');
      const { AISettingsManagement } = await import('./ai-settings');
      
      // 3. 初始化子系统
      this.embeddingsIntegration = new AIEmbeddingsIntegration();
      this.settingsManagement = new AISettingsManagement();
      
      await this.embeddingsIntegration.initialize();
      await this.settingsManagement.initialize();
      
      // 4. 创建和注册默认Qwen Provider
      await this.setupDefaultProviders();
      
      this.initialized = true;
      this.emit('ai_provider:initialized');
    } catch (error) {
      this.emit('ai_provider:initialization_failed', { error });
      throw error;
    }
  }


  /**
   * 设置默认提供商 - 从环境变量加载配置
   */
  private async setupDefaultProviders(): Promise<void> {
    try {
      // 检查环境变量
      // 使用EEAI_前缀的环境变量
      const qwenApiKey = process.env.EEAI_QWEN_API_KEY;
      const qwenBaseUrl = process.env.EEAI_QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
      
      const deepseekApiKey = process.env.EEAI_DEEPSEEK_API_KEY;
      const deepseekBaseUrl = process.env.EEAI_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

      if (!qwenApiKey && !deepseekApiKey) {
        // 环境变量在 EntityAIModule 中加载，这里如果找不到就跳过
        return;
      }

      // 导入 OpenAI Compatible Provider
      const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible');

      // 创建可用的Provider实例
      const providers: Record<string, any> = {};

      if (qwenApiKey) {
        providers.qwen = createOpenAICompatible({
          name: 'qwen',
          baseURL: qwenBaseUrl,
          apiKey: qwenApiKey
        });
      }

      if (deepseekApiKey) {
        providers.deepseek = createOpenAICompatible({
          name: 'deepseek',
          baseURL: deepseekBaseUrl,
          apiKey: deepseekApiKey
        });
      }

      // 创建Provider Registry with 所有可用providers
      const registryConfig: ProviderRegistryConfig = {
        providers,
        options: {
          separator: ':'
        }
      };

      // 注册Provider Registry - 直接使用AI SDK的createProviderRegistry
      this.registry = createProviderRegistry(
        registryConfig.providers as any,
        registryConfig.options
      );

      // 设置默认语言模型
      this.defaultLanguageModel = this.registry.languageModel('qwen:qwen-plus-2025-01-25');

      // 尝试设置默认嵌入模型（如果Qwen支持的话）
      try {
        this.defaultEmbeddingModel = this.registry.textEmbeddingModel('qwen:text-embedding-v1');
      } catch {
        // Ignore embedding model setup errors
      }

      this.emit('ai_provider:default_providers_setup', {
        providers: Object.keys(providers),
        defaultModel: 'qwen:qwen-plus-2025-01-25',
        embeddingModel: 'qwen:text-embedding-v1'
      });

      
    } catch (error: any) {
      console.error('Failed to setup default providers:', error);
      this.emit('ai_provider:default_providers_setup_failed', { error: error.message });
    }
  }

  // Custom Providers

  /**
   * Create custom provider
   */
  createCustomProvider(
    id: string,
    config: CustomProviderConfig
  ): Provider {
    if (!this.initialized) {
      throw new Error('AIProviderManagement not initialized. Call initialize() first.');
    }

    try {
      this.emit('ai_provider:custom_provider_creating', { id, config });

      // 处理语言模型配置
      const languageModels: Record<string, any> = {};
      if (config.languageModels) {
        Object.entries(config.languageModels).forEach(([modelId, modelConfig]) => {
          if (modelConfig && typeof modelConfig === 'object' && 'model' in modelConfig) {
            // 带中间件和设置的复杂配置
            languageModels[modelId] = wrapLanguageModel({
              model: modelConfig.model as any,
              middleware: modelConfig.middleware || defaultSettingsMiddleware({
                settings: modelConfig.settings || {}
              })
            }) as any;
          } else if (modelConfig) {
            // 简单的模型引用
            languageModels[modelId] = modelConfig as any;
          }
        });
      }

      // 创建自定义提供商
      const customProviderInstance = customProvider({
        languageModels: languageModels as any,
        embeddingModels: config.embeddingModels as any,
        imageModels: config.imageModels as any,
        fallbackProvider: config.fallbackProvider as any
      } as any);

      this.customProviders.set(id, customProviderInstance);

      this.emit('ai_provider:custom_provider_created', { 
        id, 
        languageModels: Object.keys(languageModels),
        embeddingModels: Object.keys(config.embeddingModels || {}),
        imageModels: Object.keys(config.imageModels || {}),
        hasFallback: !!config.fallbackProvider
      });

      return customProviderInstance;

    } catch (error: any) {
      this.emit('ai_provider:custom_provider_creation_failed', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Create model alias
   */
  createModelAlias(
    aliasConfig: ModelAliasConfig
  ): any {
    const provider = this.customProviders.get(aliasConfig.providerId);
    if (!provider) {
      throw new Error(`Provider '${aliasConfig.providerId}' not found`);
    }

    this.modelAliases.set(aliasConfig.alias, aliasConfig);
    
    // Create model instance
    this.emit('ai_provider:model_alias_created', aliasConfig);
    
    // Return language model instance
    return provider.languageModel?.(aliasConfig.modelId) as any;
  }

  /**
   * Create model with predefined settings
   */
  createModelWithSettings(
    originalModel: LanguageModel,
    settings: {
      maxOutputTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      seed?: number;
      providerOptions?: Record<string, any>;
    }
  ): any {
    return wrapLanguageModel({
      model: originalModel as any,
      middleware: defaultSettingsMiddleware({
        settings
      })
    }) as any;
  }

  // Provider Registry

  /**
   * Create provider registry
   */
  createProviderRegistry(config: ProviderRegistryConfig): any {
    if (!this.initialized) {
      throw new Error('AIProviderManagement not initialized. Call initialize() first.');
    }

    try {
      this.emit('ai_provider:registry_creating', { 
        providers: Object.keys(config.providers),
        separator: config.options?.separator || ':'
      });

      // 创建注册表
      this.registry = createProviderRegistry(
        config.providers as any,
        config.options
      );

      this.emit('ai_provider:registry_created', {
        providerCount: Object.keys(config.providers).length,
        separator: config.options?.separator || ':'
      });

      return this.registry;

    } catch (error: any) {
      this.emit('ai_provider:registry_creation_failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get language model from registry
   */
  getLanguageModel(modelId?: string): LanguageModel | null {
    try {
      // Return default model if no model ID specified
      if (!modelId && this.defaultLanguageModel) {
        return this.defaultLanguageModel;
      }

      // Use registry if available
      if (this.registry && modelId) {
        try {
          const model = this.registry.languageModel(modelId);
          this.recordModelUsage(modelId);
          return model;
        } catch (registryError) {
          // Registry failed, try direct provider access
        }
      }

      // Try direct access from Qwen provider
      if (modelId) {
        const qwenProvider = this.customProviders.get('qwen');
        if (qwenProvider && qwenProvider.languageModel) {
          const model = qwenProvider.languageModel(modelId);
          if (model) {
            this.recordModelUsage(modelId);
            return model;
          }
        }

        // Try prefixed model name (provider:model)
        if (modelId.includes(':')) {
          const [providerId, actualModelId] = modelId.split(':');
          const provider = this.customProviders.get(providerId);
          if (provider && provider.languageModel) {
            const model = provider.languageModel(actualModelId);
            if (model) {
              this.recordModelUsage(modelId);
              return model;
            }
          }
        }
      }

      // Return default model as fallback
      if (this.defaultLanguageModel) {
        return this.defaultLanguageModel;
      }

      return null;
    } catch (error: any) {
      this.emit('ai_provider:model_access_failed', { modelId, error: error.message });
      return this.defaultLanguageModel;
    }
  }

  /**
   * Get text embedding model from registry
   */
  getTextEmbeddingModel(modelId?: string): EmbeddingModel | null {
    try {
      // Return default embedding model if no model ID specified
      if (!modelId && this.defaultEmbeddingModel) {
        return this.defaultEmbeddingModel;
      }

      if (!this.registry) {
        throw new Error('Provider registry not created. Call initialize() first.');
      }

      if (!modelId) {
        throw new Error('Model ID is required when no default embedding model is available');
      }

      const model = this.registry.textEmbeddingModel(modelId);
      
      // 记录使用统计
      this.recordModelUsage(modelId);
      
      return model;
    } catch (error: any) {
      this.emit('ai_provider:embedding_model_access_failed', { modelId, error: error.message });
      
      // 尝试使用默认模型作为回退
      if (modelId && this.defaultEmbeddingModel) {
        return this.defaultEmbeddingModel;
      }
      
      return null;
    }
  }

  /**
   * 从注册表获取图像模型 - 官方用法
   */
  getImageModel(modelId: string): ImageModel | null {
    if (!this.registry) {
      throw new Error('Provider registry not created. Call createProviderRegistry() first.');
    }

    try {
      const model = this.registry.imageModel(modelId);
      
      // 记录使用统计
      this.recordModelUsage(modelId);
      
      return model;
    } catch (error: any) {
      this.emit('ai_provider:image_model_access_failed', { modelId, error: error.message });
      return null;
    }
  }

  // Global Provider Management

  /**
   * Set global default provider
   */
  setGlobalProvider(provider: Provider): void {
    // Set global provider
    (globalThis as any).AI_SDK_DEFAULT_PROVIDER = provider;
    this.globalProvider = provider;
    
    this.emit('ai_provider:global_provider_set', { 
      providerId: (provider as any).providerId || 'unknown' 
    });
  }

  /**
   * Get current global provider
   */
  getGlobalProvider(): Provider | null {
    return this.globalProvider || (globalThis as any).AI_SDK_DEFAULT_PROVIDER || null;
  }

  // Health Monitoring

  /**
   * Check provider health status
   */
  async checkProviderHealth(providerId: string): Promise<ProviderHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Simplified health check - could call provider test endpoint in production
      const provider = this.customProviders.get(providerId);
      const isHealthy = !!provider;
      
      const status: ProviderHealthStatus = {
        providerId,
        isHealthy,
        latency: Date.now() - startTime,
        lastCheck: new Date()
      };
      
      this.healthStatus.set(providerId, status);
      this.emit('ai_provider:health_check_completed', status);
      
      return status;
      
    } catch (error: any) {
      const status: ProviderHealthStatus = {
        providerId,
        isHealthy: false,
        latency: Date.now() - startTime,
        error: error.message,
        lastCheck: new Date()
      };
      
      this.healthStatus.set(providerId, status);
      this.emit('ai_provider:health_check_failed', status);
      
      return status;
    }
  }

  /**
   * Check health status of all providers
   */
  async checkAllProvidersHealth(): Promise<ProviderHealthStatus[]> {
    const providerIds = Array.from(this.customProviders.keys());
    const results = await Promise.all(
      providerIds.map(id => this.checkProviderHealth(id))
    );
    
    this.emit('ai_provider:bulk_health_check_completed', { 
      total: results.length,
      healthy: results.filter(r => r.isHealthy).length,
      unhealthy: results.filter(r => !r.isHealthy).length
    });
    
    return results;
  }

  /**
   * Record model usage statistics
   */
  private recordModelUsage(modelId: string): void {
    const [providerId] = modelId.includes(':') ? modelId.split(':') : ['unknown', modelId];
    const statsKey = `${providerId}:${modelId}`;
    
    const existing = this.usageStats.get(statsKey);
    if (existing) {
      existing.totalCalls += 1;
      existing.lastUsed = new Date();
    } else {
      this.usageStats.set(statsKey, {
        modelId,
        providerId,
        totalCalls: 1,
        totalTokens: 0,
        averageLatency: 0,
        errorRate: 0,
        lastUsed: new Date()
      });
    }
  }

  // Model Selection and Fallback

  /**
   * Smart model selection based on health and load
   */
  async selectBestModel(
    modelIds: string[],
    criteria: {
      prioritizeHealth?: boolean;
      prioritizeLatency?: boolean;
      prioritizeReliability?: boolean;
    } = {}
  ): Promise<string | null> {
    if (modelIds.length === 0) return null;
    
    // Get health status for all models
    const modelHealth = new Map<string, ProviderHealthStatus>();
    for (const modelId of modelIds) {
      const [providerId] = modelId.includes(':') ? modelId.split(':') : ['unknown'];
      const health = this.healthStatus.get(providerId);
      if (health) {
        modelHealth.set(modelId, health);
      }
    }
    
    // Simple selection logic - prioritize healthy providers
    const healthyModels = modelIds.filter(id => {
      // Extract provider ID for health check
      const [providerId] = id.includes(':') ? id.split(':') : ['unknown'];
      const health = modelHealth.get(id);
      
      // Log health check status (development)
      if (process.env.NODE_ENV === 'development') {
        // Health check logging would go here
      }
      
      return health?.isHealthy !== false;
    });
    
    if (healthyModels.length === 0) {
      // Return first model as last resort if none are healthy
      return modelIds[0];
    }
    
    // If prioritizing latency, select lowest latency model
    if (criteria.prioritizeLatency) {
      const sorted = healthyModels.sort((a, b) => {
        const healthA = modelHealth.get(a);
        const healthB = modelHealth.get(b);
        return (healthA?.latency || Infinity) - (healthB?.latency || Infinity);
      });
      return sorted[0];
    }
    
    // Default: return first healthy model
    return healthyModels[0];
  }

  /**
   * Create model chain with fallback
   */
  createModelChain(primaryModelId: string, fallbackModelIds: string[]): {
    execute: <T>(operation: (model: LanguageModel) => Promise<T>) => Promise<T>;
  } {
    return {
      execute: async <T>(operation: (model: LanguageModel) => Promise<T>): Promise<T> => {
        const modelIds = [primaryModelId, ...fallbackModelIds];
        
        for (let i = 0; i < modelIds.length; i++) {
          const modelId = modelIds[i];
          
          try {
            const model = this.getLanguageModel(modelId);
            if (!model) continue;
            
            const result = await operation(model);
            
            // Record successful usage
            this.emit('ai_provider:model_chain_success', { 
              attemptedModel: modelId,
              attempt: i + 1,
              totalModels: modelIds.length
            });
            
            return result;
            
          } catch (error: any) {
            this.emit('ai_provider:model_chain_attempt_failed', {
              attemptedModel: modelId,
              attempt: i + 1,
              error: error.message,
              willTryNext: i < modelIds.length - 1
            });
            
            // Throw error if last model also failed
            if (i === modelIds.length - 1) {
              throw error;
            }
          }
        }
        
        throw new Error('All models in chain failed');
      }
    };
  }

  // Utility Methods

  /**
   * Get all registered providers
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.customProviders.keys());
  }

  /**
   * Get model aliases
   */
  getModelAliases(): Record<string, ModelAliasConfig> {
    const aliases: Record<string, ModelAliasConfig> = {};
    this.modelAliases.forEach((config, alias) => {
      aliases[alias] = config;
    });
    return aliases;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): ModelUsageStats[] {
    return Array.from(this.usageStats.values());
  }

  /**
   * Get health status report
   */
  getHealthReport(): {
    totalProviders: number;
    healthyProviders: number;
    unhealthyProviders: number;
    statuses: ProviderHealthStatus[];
  } {
    const statuses = Array.from(this.healthStatus.values());
    return {
      totalProviders: statuses.length,
      healthyProviders: statuses.filter(s => s.isHealthy).length,
      unhealthyProviders: statuses.filter(s => !s.isHealthy).length,
      statuses
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clean up MCP connections and other resources
    await Promise.all(
      Array.from(this.customProviders.values()).map(async provider => {
        try {
          // Call cleanup method if provider has one
          if (typeof (provider as any).cleanup === 'function') {
            await (provider as any).cleanup();
          }
        } catch (error) {
          this.emit('ai_provider:cleanup_error', { error });
        }
      })
    );
  }

  /**
   * Check initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get statistics
   */
  getStats(): {
    isInitialized: boolean;
    customProviders: number;
    modelAliases: number;
    totalUsage: number;
    hasRegistry: boolean;
    hasGlobalProvider: boolean;
  } {
    return {
      isInitialized: this.initialized,
      customProviders: this.customProviders.size,
      modelAliases: this.modelAliases.size,
      totalUsage: Array.from(this.usageStats.values()).reduce((sum, stat) => sum + stat.totalCalls, 0),
      hasRegistry: !!this.registry,
      hasGlobalProvider: !!this.globalProvider
    };
  }

  // Embedding Model Management

  /**
   * Get embeddings integration instance
   */
  getEmbeddingsIntegration(): AIEmbeddingsIntegration {
    return this.embeddingsIntegration;
  }

  /**
   * Configure embedding model parameters
   */
  configureEmbeddingModel(
    providerId: string,
    modelId: string,
    config: EmbeddingModelConfig
  ): void {
    const key = `${providerId}:${modelId}`;
    this.embeddingModelConfigs.set(key, config);
    
    this.emit('ai_provider:embedding_model_configured', {
      providerId,
      modelId,
      config
    });
  }

  /**
   * Get embedding model configuration
   */
  getEmbeddingModelConfig(
    providerId: string,
    modelId: string
  ): EmbeddingModelConfig | null {
    const key = `${providerId}:${modelId}`;
    return this.embeddingModelConfigs.get(key) || null;
  }

  /**
   * Get all supported embedding models
   */
  getSupportedEmbeddingModels(): any {
    return this.embeddingsIntegration.getSupportedModels();
  }

  /**
   * Get embedding models by provider
   */
  getEmbeddingModelsByProvider(provider: string): any[] {
    return this.embeddingsIntegration.getModelsByProvider(provider);
  }

  // Settings Management

  /**
   * Get settings management instance
   */
  getSettingsManagement(): AISettingsManagement {
    return this.settingsManagement;
  }

  /**
   * Apply settings preset to model configuration
   */
  applySettingsPreset(
    modelId: string,
    presetName: string,
    additionalSettings?: Partial<ModelSettings>
  ): ModelSettings {
    const preset = this.settingsManagement.getPreset(presetName);
    if (!preset) {
      throw new Error(`Settings preset '${presetName}' not found`);
    }

    let finalSettings = preset.settings;
    
    // Merge additional settings
    if (additionalSettings) {
      finalSettings = this.settingsManagement.mergeSettings(
        preset.settings,
        additionalSettings
      );
    }

    // Validate settings
    const validation = this.settingsManagement.validateSettings(finalSettings);
    if (!validation.isValid) {
      throw new Error(`Invalid settings: ${validation.errors.map((e: any) => e.message).join(', ')}`);
    }

    // Store applied settings
    this.modelSettingsPresets.set(modelId, finalSettings);
    
    // Record usage history
    this.settingsManagement.recordSettingsUsage(finalSettings, {
      modelId,
      presetName,
      timestamp: new Date()
    });

    this.emit('ai_provider:settings_preset_applied', {
      modelId,
      presetName,
      finalSettings,
      validation
    });

    return finalSettings;
  }

  /**
   * Create model instance with custom settings
   */
  createModelWithCustomSettings(
    baseModel: LanguageModel,
    settings: ModelSettings
  ): any {
    // Validate settings
    const validation = this.settingsManagement.validateSettings(settings);
    if (!validation.isValid) {
      this.emit('ai_provider:settings_validation_warning', {
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Apply settings using middleware system
    return wrapLanguageModel({
      model: baseModel as any,
      middleware: defaultSettingsMiddleware({
        settings
      })
    }) as any;
  }

  /**
   * Get model applied settings
   */
  getModelSettings(modelId: string): ModelSettings | null {
    return this.modelSettingsPresets.get(modelId) || null;
  }

  /**
   * Create optimized model for specific use case
   */
  createOptimizedModel(
    baseModel: LanguageModel,
    useCase: 'creative' | 'analytical' | 'deterministic' | 'fast' | 'long-form' | 'code'
  ): any {
    const presetMap = {
      creative: 'CREATIVE',
      analytical: 'PRECISE', 
      deterministic: 'DETERMINISTIC',
      fast: 'FAST_RESPONSE',
      'long-form': 'LONG_FORM',
      code: 'CODE_GENERATION'
    };

    const presetName = presetMap[useCase];
    const preset = this.settingsManagement.getPreset(presetName);
    
    if (!preset) {
      throw new Error(`No preset found for use case: ${useCase}`);
    }

    return this.createModelWithCustomSettings(baseModel, preset.settings);
  }

  /**
   * Destroy instance - enhanced version
   */
  async destroy(): Promise<void> {
    await this.cleanup();
    
    // Clear main data
    this.customProviders.clear();
    this.modelAliases.clear();
    this.healthStatus.clear();
    this.usageStats.clear();
    this.registry = null;
    this.globalProvider = null;
    
    // Clear additional data
    this.embeddingModelConfigs.clear();
    this.modelSettingsPresets.clear();
    
    // Destroy subsystems
    this.embeddingsIntegration.destroy();
    this.settingsManagement.destroy();
    
    this.removeAllListeners();
    this.initialized = false;
  }
}

// Exports

export {
  type Provider,
  customProvider,
  type ImageModel,
  wrapLanguageModel,
  
  // Core types
  type LanguageModel,
  type EmbeddingModel,
  // Core functions
  createProviderRegistry,
  defaultSettingsMiddleware
};

// Default export
export default AIProviderManagement;