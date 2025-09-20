/**
 * Entity Engine AI Module - Type Definitions
 * 
 * Consolidates all type definitions from Core and UI modules, providing unified type interface
 */

// Core module types

// Export all core types
export * from './core-types';

// Event types
export type {
  ChatEvents
} from './ui-types';

// Data types - removed non-standard types
export type {
  CustomDataParts
} from './ui-types';

// Transport types
export type {
  CustomTransportOptions
} from './ui-types';

// Theme types
export type {
  ThemeConfig,
  StyleVariants
} from './ui-types';

// Component types
export type {
  ChatDialogProps,
  FileViewerProps,
  MessageBubbleProps
} from './ui-types';

// Integration types
export type {
  StreamResult,
  GenerateResult,
  StreamTextOptions,
  GenerateTextOptions
} from '../core/ai-core';

// UI module types

// Tool related types
export type {
  ToolCallState,
  ToolDefinition,
  ToolExecutionResult,
  UserInteractionToolOptions
} from './ui-types';

// Basic message types
export type {
  MessageRole,
  MessageStatus,
  CustomUIMessage,
  StandardUIMessage,
  ExtendedUIMessage
} from './ui-types';

// Structured Data types
export type {
  StreamObjectOptions,
  GenerateObjectOptions,
  StreamObjectResultType,
  GenerateObjectResultType
} from '../core/ai-structured';

// Tools Integration types
export type {
  ToolChoice,
  StepResult,
  DynamicTool,
  AdvancedTool,
  StopCondition,
  ToolCallOptions,
  MCPClientConfig,
  ToolExecutionOptions
} from '../core/ai-tools';

// Provider Management types
export type {
  ModelUsageStats,
  ModelAliasConfig,
  CustomProviderConfig,
  GlobalProviderConfig,
  ProviderHealthStatus,
  ProviderRegistryConfig
} from '../core/ai-provider';

// Settings Management types
export type {
  ModelSettings,
  SettingsPreset,
  CommonModelSettings,
  DynamicSettingsConfig,
  ProviderSpecificSettings,
  SettingsValidationResult
} from '../core/ai-settings';

// Embeddings Integration types
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

// Hook types
export type {
  UseChatHelpers as ChatReturn,
  UseChatOptions as ChatOptions,
  UseCompletionHelpers as CompletionReturn,
  UseCompletionOptions as CompletionOptions,
  Experimental_UseObjectHelpers as ObjectReturn,
  Experimental_UseObjectOptions as ObjectOptions
} from '@ai-sdk/react';

// Core types re-export

// Core types export
export type {
  Tool,
  ToolSet,
  Provider,
  UIMessage,
  ImageModel,
  DataUIPart,
  FileUIPart,
  TextUIPart,
  CoreMessage,
  FinishReason,
  LanguageModel,
  UIMessagePart,
  EmbeddingModel,
  TextStreamPart,
  ToolResultPart,
  StreamTextResult,
  GenerateTextResult,
  StreamObjectResult,
  LanguageModelUsage,
  GenerateObjectResult,
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata
} from 'ai';

// Interface types

// Error types

/**
 * AI Module error type
 */
export class aimoduleError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'aimoduleError';
  }
}

/**
 * Runtime error
 */
export class aimoduleRuntimeError extends aimoduleError {
  constructor(message: string, details?: any) {
    super(message, 'RUNTIME_ERROR', details);
    this.name = 'aimoduleRuntimeError';
  }
}

// Utility types

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required fields type
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Optional fields type
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;