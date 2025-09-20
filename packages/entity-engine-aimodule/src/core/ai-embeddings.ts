/**
 * AI Embeddings Complete Integration
 * 
 * Complete embeddings functionality:
 * - embed: Single value embedding
 * - embedMany: Batch embedding  
 * - cosineSimilarity: Similarity calculation
 * - All configuration parameters supported
 * - Provider-specific configurations
 */

import { EventEmitter } from 'events';
import {
  embed,
  embedMany,
  cosineSimilarity,
  type EmbeddingModel,
  type LanguageModelUsage,
  type LanguageModelRequestMetadata,
  type LanguageModelResponseMetadata
} from 'ai';

// Type Definitions

/**
 * Complete embedding model configuration
 */
export interface EmbeddingModelConfig {
  // 基础模型
  model: EmbeddingModel;
  
  // 提供商特定选项 - 官方文档支持
  providerOptions?: Record<string, any>; // 如 { openai: { dimensions: 512 } }
  
  // 控制参数
  maxRetries?: number; // 最大重试次数，默认 2
  abortSignal?: AbortSignal; // 取消信号
  headers?: Record<string, string>; // 自定义 HTTP 头
}

/**
 * 批量嵌入配置 - embedMany 专用参数
 */
export interface EmbedManyConfig extends EmbeddingModelConfig {
  maxParallelCalls?: number; // 并行请求数 - 官方文档功能
}

/**
 * 单值嵌入选项 - embed() 完整参数
 */
export interface EmbedOptions extends EmbeddingModelConfig {
  value: string; // 要嵌入的文本
}

/**
 * 批量嵌入选项 - embedMany() 完整参数  
 */
export interface EmbedManyOptions extends EmbedManyConfig {
  values: string[]; // 要嵌入的文本数组
}

/**
 * 嵌入结果类型 - 官方规范
 */
export interface EmbedResult {
  embedding: number[]; // 嵌入向量
  usage: LanguageModelUsage; // 令牌使用情况
  request?: LanguageModelRequestMetadata; // 请求元数据
  response?: LanguageModelResponseMetadata; // 响应元数据
}

/**
 * 批量嵌入结果类型 - 官方规范
 */
export interface EmbedManyResult {
  embeddings: number[][]; // 嵌入向量数组，与输入顺序一致
  usage: LanguageModelUsage; // 令牌使用情况
  request?: LanguageModelRequestMetadata; // 请求元数据
  response?: LanguageModelResponseMetadata; // 响应元数据
}

/**
 * 相似度计算结果
 */
export interface SimilarityResult {
  similarity: number;
  vector1: number[];
  vector2: number[];
  method: 'cosine' | 'euclidean' | 'dot';
}

/**
 * 嵌入提供商信息 - 基于官方文档表格
 */
export interface EmbeddingProviderInfo {
  provider: string;
  model: string;
  dimensions: number;
  description?: string;
}

// Predefined provider model configurations

/**
 * Supported embedding models
 */
export const SupportedEmbeddingModels: Record<string, EmbeddingProviderInfo> = {
  // Qwen
  'qwen:text-embedding-v3': {
    provider: 'qwen',
    model: 'text-embedding-v3',
    dimensions: 1024,
    description: 'Qwen latest embedding model with 1024 dimensions'
  }
};

// Core Embeddings Integration Class

/**
 * Complete embeddings integration class
 */
export class AIEmbeddingsIntegration extends EventEmitter {
  private initialized: boolean = false;
  private requestCounter: number = 0;
  private embeddingCache: Map<string, EmbedResult> = new Map();
  private usageStats: Map<string, { totalEmbeddings: number; totalTokens: number; lastUsed: Date }> = new Map();

  constructor() {
    super();
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.emit('ai_embeddings:initializing');
      this.initialized = true;
      this.emit('ai_embeddings:initialized');
    } catch (error) {
      this.emit('ai_embeddings:initialization_failed', { error });
      throw error;
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `ai-embeddings-${Date.now()}-${++this.requestCounter}`;
  }

  // Single value embedding methods

  /**
   * Embed single value - embed() API
   */
  async embed(options: EmbedOptions): Promise<EmbedResult> {
    return this.embedSingleValue(options);
  }

  /**
   * Embed single value - complete embed() implementation
   */
  async embedSingleValue(options: EmbedOptions): Promise<EmbedResult> {
    if (!this.initialized) {
      throw new Error('AIEmbeddingsIntegration not initialized. Call initialize() first.');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      this.emit('ai_embeddings:embed_started', {
        requestId,
        model: typeof options.model === 'string' ? options.model : 'unknown',
        valueLength: options.value.length,
        hasProviderOptions: !!options.providerOptions,
        maxRetries: options.maxRetries || 2
      });

      // 检查缓存
      const cacheKey = this.generateCacheKey(options.model, options.value, options.providerOptions);
      if (this.embeddingCache.has(cacheKey)) {
        const cached = this.embeddingCache.get(cacheKey)!;
        this.emit('ai_embeddings:embed_cache_hit', { requestId, cacheKey });
        return cached;
      }

      // 调用官方 embed 函数
      const result = await embed({
        model: options.model,
        value: options.value,
        providerOptions: options.providerOptions,
        maxRetries: options.maxRetries,
        abortSignal: options.abortSignal,
        headers: options.headers
      });

      // 缓存结果  
      this.embeddingCache.set(cacheKey, result as any);

      // 记录统计
      this.recordUsage(options.model, 1, result.usage.tokens || 0);

      this.emit('ai_embeddings:embed_completed', {
        requestId,
        latency: Date.now() - startTime,
        embeddingDimensions: result.embedding.length,
        usage: result.usage,
        cached: false
      });

      return result as any;

    } catch (error: any) {
      this.emit('ai_embeddings:embed_failed', {
        requestId,
        error: error.message,
        latency: Date.now() - startTime,
        errorType: error.constructor.name
      });

      throw error;
    }
  }

  // Batch embedding methods

  /**
   * Embed multiple values - embedMany() API
   */
  async embedMany(options: EmbedManyOptions): Promise<EmbedManyResult> {
    return this.embedManyValues(options);
  }

  /**
   * Embed multiple values - complete embedMany() implementation  
   */
  async embedManyValues(options: EmbedManyOptions): Promise<EmbedManyResult> {
    if (!this.initialized) {
      throw new Error('AIEmbeddingsIntegration not initialized. Call initialize() first.');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      this.emit('ai_embeddings:embed_many_started', {
        requestId,
        model: typeof options.model === 'string' ? options.model : 'unknown',
        valuesCount: options.values.length,
        maxParallelCalls: options.maxParallelCalls,
        hasProviderOptions: !!options.providerOptions,
        maxRetries: options.maxRetries || 2
      });

      // 调用官方 embedMany 函数
      const result = await embedMany({
        model: options.model,
        values: options.values,
        maxParallelCalls: options.maxParallelCalls,
        providerOptions: options.providerOptions,
        maxRetries: options.maxRetries,
        abortSignal: options.abortSignal,
        headers: options.headers
      });

      // 记录统计
      this.recordUsage(options.model, options.values.length, result.usage.tokens || 0);

      this.emit('ai_embeddings:embed_many_completed', {
        requestId,
        latency: Date.now() - startTime,
        valuesCount: options.values.length,
        embeddingsCount: result.embeddings.length,
        embeddingDimensions: result.embeddings[0]?.length || 0,
        usage: result.usage
      });

      return result as any;

    } catch (error: any) {
      this.emit('ai_embeddings:embed_many_failed', {
        requestId,
        error: error.message,
        latency: Date.now() - startTime,
        errorType: error.constructor.name,
        valuesCount: options.values.length
      });

      throw error;
    }
  }

  // Similarity calculation methods

  /**
   * Cosine similarity calculation - cosineSimilarity() implementation
   */
  calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    const similarity = cosineSimilarity(vector1, vector2);
    
    this.emit('ai_embeddings:similarity_calculated', {
      method: 'cosine',
      similarity,
      vector1Dimensions: vector1.length,
      vector2Dimensions: vector2.length
    });

    return similarity;
  }

  /**
   * 批量相似度计算
   */
  calculateSimilarities(
    targetVector: number[],
    vectors: number[][],
    method: 'cosine' | 'euclidean' | 'dot' = 'cosine'
  ): SimilarityResult[] {
    return vectors.map(vector => ({
      similarity: method === 'cosine' 
        ? this.calculateCosineSimilarity(targetVector, vector)
        : method === 'euclidean'
        ? this.calculateEuclideanSimilarity(targetVector, vector)  
        : this.calculateDotProduct(targetVector, vector),
      vector1: targetVector,
      vector2: vector,
      method
    }));
  }

  /**
   * 欧几里得距离相似度
   */
  private calculateEuclideanSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    const sumSquared = vector1.reduce((sum, val, i) => {
      const diff = val - vector2[i];
      return sum + diff * diff;
    }, 0);

    // 转换为相似度（距离越小，相似度越高）
    return 1 / (1 + Math.sqrt(sumSquared));
  }

  /**
   * 点积相似度
   */
  private calculateDotProduct(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  }

  // Similarity search and ranking

  /**
   * Find most similar embeddings
   */
  findMostSimilar(
    queryVector: number[],
    candidateVectors: number[][],
    topK: number = 5,
    method: 'cosine' | 'euclidean' | 'dot' = 'cosine'
  ): Array<{ index: number; similarity: number; vector: number[] }> {
    const similarities = this.calculateSimilarities(queryVector, candidateVectors, method);
    
    return similarities
      .map((result, index) => ({
        index,
        similarity: result.similarity,
        vector: result.vector2
      }))
      .sort((a, b) => b.similarity - a.similarity) // 按相似度降序排列
      .slice(0, topK);
  }

  /**
   * 文本相似性搜索
   */
  async searchSimilarTexts(
    queryText: string,
    candidateTexts: string[],
    model: EmbeddingModel,
    topK: number = 5,
    options?: Partial<EmbeddingModelConfig>
  ): Promise<Array<{ index: number; text: string; similarity: number }>> {
    // 嵌入查询文本和候选文本
    const queryResult = await this.embedSingleValue({
      model,
      value: queryText,
      ...options
    });

    const candidatesResult = await this.embedManyValues({
      model,
      values: candidateTexts,
      ...options
    });

    // 计算相似度
    const similarities = this.findMostSimilar(
      queryResult.embedding,
      candidatesResult.embeddings,
      topK
    );

    return similarities.map(result => ({
      index: result.index,
      text: candidateTexts[result.index],
      similarity: result.similarity
    }));
  }

  // Utility methods and cache management

  /**
   * Generate cache key
   */
  private generateCacheKey(model: EmbeddingModel, value: string, providerOptions?: any): string {
    const modelKey = typeof model === 'string' ? model : 'unknown';
    const optionsKey = providerOptions ? JSON.stringify(providerOptions) : '';
    return `${modelKey}:${value}:${optionsKey}`;
  }

  /**
   * Record usage statistics
   */
  private recordUsage(model: EmbeddingModel, embeddingCount: number, tokens: number): void {
    const modelKey = typeof model === 'string' ? model : 'unknown';
    
    const existing = this.usageStats.get(modelKey);
    if (existing) {
      existing.totalEmbeddings += embeddingCount;
      existing.totalTokens += tokens;
      existing.lastUsed = new Date();
    } else {
      this.usageStats.set(modelKey, {
        totalEmbeddings: embeddingCount,
        totalTokens: tokens,
        lastUsed: new Date()
      });
    }
  }

  /**
   * 获取支持的模型信息
   */
  getSupportedModels(): EmbeddingProviderInfo[] {
    return Object.values(SupportedEmbeddingModels);
  }

  /**
   * 根据提供商筛选模型
   */
  getModelsByProvider(provider: string): EmbeddingProviderInfo[] {
    return Object.values(SupportedEmbeddingModels)
      .filter(model => model.provider === provider);
  }

  /**
   * 获取使用统计
   */
  getUsageStats(): Record<string, { totalEmbeddings: number; totalTokens: number; lastUsed: Date }> {
    const stats: Record<string, { totalEmbeddings: number; totalTokens: number; lastUsed: Date }> = {};
    this.usageStats.forEach((stat, model) => {
      stats[model] = { ...stat };
    });
    return stats;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.embeddingCache.clear();
    this.emit('ai_embeddings:cache_cleared');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.embeddingCache.size,
      keys: Array.from(this.embeddingCache.keys())
    };
  }

  /**
   * 检查初始化状态
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    isInitialized: boolean;
    requestCount: number;
    cacheSize: number;
    totalUsage: { embeddings: number; tokens: number };
  } {
    const totalUsage = Array.from(this.usageStats.values()).reduce(
      (sum, stat) => ({
        embeddings: sum.embeddings + stat.totalEmbeddings,
        tokens: sum.tokens + stat.totalTokens
      }),
      { embeddings: 0, tokens: 0 }
    );

    return {
      isInitialized: this.initialized,
      requestCount: this.requestCounter,
      cacheSize: this.embeddingCache.size,
      totalUsage
    };
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.embeddingCache.clear();
    this.usageStats.clear();
    this.removeAllListeners();
    this.initialized = false;
    this.requestCounter = 0;
  }
}

// Exports

export {
  // Core functions
  embed,
  embedMany,
  cosineSimilarity,
  // Core types
  type EmbeddingModel,
  
  type LanguageModelUsage,
  type LanguageModelRequestMetadata,
  type LanguageModelResponseMetadata
};

// Default export
export default AIEmbeddingsIntegration;