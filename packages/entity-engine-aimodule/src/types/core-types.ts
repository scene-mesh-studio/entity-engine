/**
 * Entity Engine AI Core - Type Definitions
 * 
 * 集中导出所有类型定义，确保类型安全和开发体验
 */

// Core module type exports

// Provider configurations types removed - using simplified aiconfig.json approach

// Integration types
export type {
  StreamResult,
  GenerateResult,
  StreamTextOptions,
  GenerateTextOptions
} from '../core/ai-core';

// Structured Data 类型
export type {
  StreamObjectOptions,
  GenerateObjectOptions,
  StreamObjectResultType,
  GenerateObjectResultType
} from '../core/ai-structured';

// Provider Management 类型
export type {
  ModelUsageStats,
  ModelAliasConfig,
  CustomProviderConfig,
  GlobalProviderConfig,
  ProviderHealthStatus,
  ProviderRegistryConfig
} from '../core/ai-provider';

// Settings Management 类型
export type {
  ModelSettings,
  SettingsPreset,
  CommonModelSettings,
  DynamicSettingsConfig,
  ProviderSpecificSettings,
  SettingsValidationResult
} from '../core/ai-settings';

// Tools Integration 类型
export type {
  MCPClient,
  ToolChoice,
  StepResult,
  DynamicTool,
  AdvancedTool,
  StopCondition,
  ToolCallOptions,
  MCPClientConfig,
  ToolExecutionOptions
} from '../core/ai-tools';

// Embeddings Integration 类型
export type {
  EmbedResult,
  EmbedOptions,
  EmbedManyConfig,
  EmbedManyResult,
  EmbedManyOptions,
  SimilarityResult,
  EmbeddingModelConfig,
  EmbeddingProviderInfo
} from '../core/ai-embeddings';

// Core types re-export

export type {
  Tool,
  ToolSet,
  Provider,
  ImageModel,
  
  // 消息和工具类型
  CoreMessage,
  FinishReason,
  // 核心类型
  LanguageModel,
  TypedToolCall,
  EmbeddingModel,
  
  // 流式处理类型
  TextStreamPart,
  TypedToolResult,
  // 错误类型
  NoSuchToolError,
  StreamTextResult,
  
  // 生成结果类型
  GenerateTextResult,
  StreamObjectResult,
  // 使用情况和元数据
  LanguageModelUsage,
  GenerateObjectResult,
  
  InvalidToolInputError,
  
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata
} from 'ai';

// Extended and composite types

/**
 * AI Core 完整配置类型
 */
export interface AICoreConfig {
  // Provider配置
  providers?: {
    openai?: import('../core/ai-provider').CustomProviderConfig;
    anthropic?: import('../core/ai-provider').CustomProviderConfig;
    custom?: Record<string, import('../core/ai-provider').CustomProviderConfig>;
  };
  
  // 全局设置
  settings?: {
    default?: import('../core/ai-settings').ModelSettings;
    presets?: Record<string, import('../core/ai-settings').SettingsPreset>;
  };
  
  // 功能开关
  features?: {
    embeddings?: boolean;
    tools?: boolean;
    structuredData?: boolean;
    healthChecking?: boolean;
  };
  
  // 监控和日志
  monitoring?: {
    enabled?: boolean;
    metrics?: boolean;
    logging?: {
      level?: 'error' | 'warn' | 'info' | 'debug';
      destination?: 'console' | 'file' | 'custom';
    };
  };
}

/**
 * AI Core 实例接口
 */
export interface AICoreInstance {
  // 核心组件
  aiSDK: import('../core/ai-core').AISDKIntegration;
  providerManagement: import('../core/ai-provider').AIProviderManagement;
  toolsIntegration: import('../core/ai-tools').AIToolsIntegration;
  embeddingsIntegration: import('../core/ai-embeddings').AIEmbeddingsIntegration;
  settingsManagement: import('../core/ai-settings').AISettingsManagement;
  structuredData: import('../core/ai-structured').AIStructuredDataIntegration;
  
  // 状态方法
  isInitialized(): boolean;
  getStats(): AICoreStats;
  destroy(): Promise<void>;
}

/**
 * AI Core 统计信息
 */
export interface AICoreStats {
  // 初始化状态
  isInitialized: boolean;
  initializationTime?: number;
  
  // 组件统计
  components: {
    aiSDK: boolean;
    providerManagement: boolean;
    toolsIntegration: boolean;
    embeddingsIntegration: boolean;
    settingsManagement: boolean;
    structuredData: boolean;
  };
  
  // 使用统计
  usage: {
    totalRequests: number;
    totalTokens: number;
    averageLatency: number;
    errorRate: number;
  };
  
  // Provider健康状态
  providerHealth: {
    totalProviders: number;
    healthyProviders: number;
    unhealthyProviders: number;
  };
}

/**
 * 事件类型定义
 */
export interface AICoreEvents {
  // 初始化事件
  'core:initializing': { timestamp: Date };
  'core:initialized': { timestamp: Date; duration: number };
  'core:initialization_failed': { timestamp: Date; error: Error };
  
  // 组件事件
  'component:ready': { component: string; timestamp: Date };
  'component:error': { component: string; error: Error; timestamp: Date };
  
  // 使用事件
  'request:started': { requestId: string; type: string; timestamp: Date };
  'request:completed': { requestId: string; duration: number; tokens?: number };
  'request:failed': { requestId: string; error: Error; duration: number };
  
  // Provider事件
  'provider:health_changed': { providerId: string; isHealthy: boolean };
  'provider:added': { providerId: string; type: string };
  'provider:removed': { providerId: string };
}

// Tool and utility types

/**
 * 深度可选类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 联合到交集类型
 */
export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * 提取函数参数类型
 */
export type ExtractParameters<T> = T extends (...args: infer P) => any ? P : never;

/**
 * 提取函数返回类型
 */
export type ExtractReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * 可选的Promise
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * 字符串字面量类型
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// Version compatibility types

/**
 * Version compatibility check
 */
export interface VersionCompatibility {
  aiSDKVersion: string;
  entityEngineVersion: string;
  compatible: boolean;
  warnings?: string[];
  errors?: string[];
}

/**
 * 功能支持矩阵
 */
export interface FeatureSupport {
  streamText: boolean;
  generateText: boolean;
  generateObject: boolean;
  streamObject: boolean;
  embeddings: boolean;
  tools: boolean;
  multiStep: boolean;
  customProviders: boolean;
}