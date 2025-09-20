/**
 * Entity Engine AI Module - Core Module Export
 * 
 * 导出所有核心AI功能，包括Provider管理、工具集成、嵌入向量等
 * 这个模块专门为后端和无UI环境设计
 */

// Type imports - standard practices

import type { AISDKIntegration } from './ai-core';
import type { AIToolsIntegration } from './ai-tools';
import type { AIEmbeddingsIntegration } from './ai-embeddings';
import type { AIStructuredDataIntegration } from './ai-structured';
import type { ModelSettings, AISettingsManagement } from './ai-settings';
import type { CustomProviderConfig, AIProviderManagement } from './ai-provider';

// Core management classes - main exports

export { AISDKIntegration } from './ai-core';
export { AIToolsIntegration } from './ai-tools';
export { AICoreManager } from './ai-core-manager';
export { AIProviderManagement } from './ai-provider';
export { AISettingsManagement } from './ai-settings';
export { AIEmbeddingsIntegration } from './ai-embeddings';
export { 
  BuiltinSettingsPresets 
} from './ai-settings';

// Configuration and utility classes

export { AIStructuredDataIntegration } from './ai-structured';

// Type definitions - core module

export { 
  SupportedEmbeddingModels 
} from './ai-embeddings';

// Provider configurations removed - using simplified aiconfig.json approach

export {
  tool,
  embed,
  embedMany,
  streamText,
  // Core functions
  generateText,
  streamObject,
  smoothStream,
  generateObject,
  customProvider,
  NoSuchToolError,
  cosineSimilarity,
  wrapLanguageModel,
  InvalidToolInputError,
  createProviderRegistry,
  defaultSettingsMiddleware
} from 'ai';

// AI SDK Integration 类型
export type {
  StreamResult,
  GenerateResult,
  StreamTextOptions,
  GenerateTextOptions
} from './ai-core';

// Structured Data 类型
export type {
  StreamObjectOptions,
  GenerateObjectOptions,
  StreamObjectResultType,
  GenerateObjectResultType
} from './ai-structured';

// Tools Integration 类型
export type {
  ToolChoice,
  StepResult,
  DynamicTool,
  AdvancedTool,
  StopCondition,
  ToolCallOptions,
  MCPClientConfig,
  ToolExecutionOptions
} from './ai-tools';

// Predefined configurations and constants

// Provider Management 类型
export type {
  ModelUsageStats,
  ModelAliasConfig,
  CustomProviderConfig,
  GlobalProviderConfig,
  ProviderHealthStatus,
  ProviderRegistryConfig
} from './ai-provider';

// Settings Management 类型
export type {
  ModelSettings,
  SettingsPreset,
  CommonModelSettings,
  DynamicSettingsConfig,
  ProviderSpecificSettings,
  SettingsValidationResult
} from './ai-settings';

// Core functions - re-export

// Embeddings 类型
export type {
  EmbedResult,
  EmbedOptions,
  EmbedManyConfig,
  EmbedManyResult,
  EmbedManyOptions,
  SimilarityResult,
  EmbeddingModelConfig,
  EmbeddingProviderInfo
} from './ai-embeddings';

// Convenience factory functions

/**
 * 创建完整的AI Core实例的便捷函数
 */
export async function createAICore(config?: {
  providers?: CustomProviderConfig[];
  settings?: Partial<ModelSettings>;
  enableEmbeddings?: boolean;
  enableTools?: boolean;
}): Promise<{
  aiSDK: AISDKIntegration;
  providerManagement: AIProviderManagement;
  toolsIntegration: AIToolsIntegration;
  embeddingsIntegration: AIEmbeddingsIntegration;
  settingsManagement: AISettingsManagement;
  structuredData: AIStructuredDataIntegration;
}> {
  // 动态导入类并创建实例
  const { AISDKIntegration } = await import('./ai-core');
  const { AIProviderManagement } = await import('./ai-provider');
  const { AIToolsIntegration } = await import('./ai-tools');
  const { AIEmbeddingsIntegration } = await import('./ai-embeddings');
  const { AISettingsManagement } = await import('./ai-settings');
  const { AIStructuredDataIntegration } = await import('./ai-structured');
  
  // 初始化所有组件
  const aiSDK = new AISDKIntegration();
  const providerManagement = new AIProviderManagement();
  const toolsIntegration = new AIToolsIntegration();
  const embeddingsIntegration = new AIEmbeddingsIntegration();
  const settingsManagement = new AISettingsManagement();
  const structuredData = new AIStructuredDataIntegration();
  
  // Apply configuration
  // TODO: Enable when these methods are implemented
  // if (config?.providers) {
  //   await Promise.all(
  //     config.providers.map(provider => 
  //       providerManagement.registerProvider(provider)
  //     )
  //   );
  // }
  
  // if (config?.settings) {
  //   await settingsManagement.updateSettings(config.settings);
  // }
  
  // 初始化所有组件
  await Promise.all([
    aiSDK.initialize(),
    providerManagement.initialize(),
    toolsIntegration.initialize(),
    embeddingsIntegration.initialize(),
    settingsManagement.initialize(),
    structuredData.initialize()
  ]);
  
  return {
    aiSDK,
    providerManagement,
    toolsIntegration,
    embeddingsIntegration,
    settingsManagement,
    structuredData
  };
}

// Version information

export const CORE_VERSION = '1.0.0';
export const AI_SDK_COMPATIBLE_VERSION = '^5.0.0';