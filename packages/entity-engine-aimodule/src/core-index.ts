/**
 * Entity Engine AI Core - Main Entry File
 * 
 * Complete AI core library with full compatibility
 */

// Type imports

import type { AISDKIntegration } from './core/ai-core';
import type { AIToolsIntegration } from './core/ai-tools';
import type { AIEmbeddingsIntegration } from './core/ai-embeddings';
import type { AIStructuredDataIntegration } from './core/ai-structured';
import type { ModelSettings, AISettingsManagement } from './core/ai-settings';
import type { CustomProviderConfig, AIProviderManagement } from './core/ai-provider';

// Core management classes

export { AISDKIntegration } from './core/ai-core';
export { AIToolsIntegration } from './core/ai-tools';
export { AIProviderManagement } from './core/ai-provider';
export { AISettingsManagement } from './core/ai-settings';
/**
 * Default export - main AI integration class
 */
export { AISDKIntegration as default } from './core/ai-core';
export { AIEmbeddingsIntegration } from './core/ai-embeddings';

// Configuration and utility classes

export { 
  BuiltinSettingsPresets 
} from './core/ai-settings';

// Type definitions

export { AIStructuredDataIntegration } from './core/ai-structured';

export { 
  SupportedEmbeddingModels 
} from './core/ai-embeddings';

// Provider configurations removed - using simplified aiconfig.json approach

export {
  tool,
  embed,
  type Tool,
  embedMany,
  streamText,
  type ToolSet,
  // AI SDK native functions
  generateText,
  streamObject,
  smoothStream,
  type Provider,
  generateObject,
  customProvider,
  type ImageModel,
  NoSuchToolError,
  type CoreMessage,
  cosineSimilarity,
  
  type FinishReason,
  wrapLanguageModel,
  // AI SDK native types
  type LanguageModel,
  type EmbeddingModel,
  type TextStreamPart,
  type StreamTextResult,
  InvalidToolInputError,
  createProviderRegistry,
  type GenerateTextResult,
  type StreamObjectResult,
  type LanguageModelUsage,
  type GenerateObjectResult,
  defaultSettingsMiddleware,
  type LanguageModelRequestMetadata,
  type LanguageModelResponseMetadata
} from 'ai';

// AI SDK Integration 类型
export type {
  StreamResult,
  GenerateResult,
  StreamTextOptions,
  GenerateTextOptions
} from './core/ai-core';

// Structured Data 类型
export type {
  StreamObjectOptions,
  GenerateObjectOptions,
  StreamObjectResultType,
  GenerateObjectResultType
} from './core/ai-structured';

// ================================
// Predefined configurations and constants

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
} from './core/ai-tools';

// Provider Management 类型
export type {
  ModelUsageStats,
  ModelAliasConfig,
  CustomProviderConfig,
  GlobalProviderConfig,
  ProviderHealthStatus,
  ProviderRegistryConfig
} from './core/ai-provider';

// AI SDK native types and functions - re-export

// Settings Management 类型
export type {
  ModelSettings,
  SettingsPreset,
  CommonModelSettings,
  DynamicSettingsConfig,
  ProviderSpecificSettings,
  SettingsValidationResult
} from './core/ai-settings';

// Version information

export const VERSION = '0.1.0';
export const AI_SDK_COMPATIBLE_VERSION = '^5.0.0';

// Convenience factory functions

/**
 * Convenience function to create complete AI Core instance
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
  // Dynamically import classes and create instances
  const { AISDKIntegration } = await import('./core/ai-core');
  const { AIProviderManagement } = await import('./core/ai-provider');
  const { AIToolsIntegration } = await import('./core/ai-tools');
  const { AIEmbeddingsIntegration } = await import('./core/ai-embeddings');
  const { AISettingsManagement } = await import('./core/ai-settings');
  const { AIStructuredDataIntegration } = await import('./core/ai-structured');
  
  // Initialize all components
  const aiSDK = new AISDKIntegration();
  const providerManagement = new AIProviderManagement();
  const toolsIntegration = new AIToolsIntegration();
  const embeddingsIntegration = new AIEmbeddingsIntegration();
  const settingsManagement = new AISettingsManagement();
  const structuredData = new AIStructuredDataIntegration();
  
  // Initialize all components
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
} from './core/ai-embeddings';