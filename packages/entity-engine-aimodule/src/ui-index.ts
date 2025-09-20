'use client';

/**
 * 🎯 Entity Engine AIUI - Main Export
 * 
 * Complete AI SDK UI implementation with dialog-style interface
 * 基于AI SDK官方规范的完整前端UI包主入口
 */

// ================================
// 🎯 Core Hooks
// ================================
export {
  useChat,
  useObject,
  useCompletion,
} from './hooks';

// ================================
// 🎯 Renderers (Plugin System)
// ================================
// Note: Renderers will be added when available

// ================================
// 🎯 UI Components
// ================================
export {
  ChatDialog,
  FileViewer,
  MessageBubble,
} from './components';

// ================================
// 🎯 Context Providers
// ================================
// Note: ViewControllerContext has been removed

// ================================
// 🎯 UI Components for Tools
// ================================
export {
  WeatherComponent,
  LocationComponent,
  CodeExecutionComponent,
} from './components/GenerativeUI/PrebuiltComponents';

// ================================
// 🎯 AI Renderers for Entity Engine
// ================================
// Note: Renderers are now dynamically imported in ai.module.ts to avoid circular dependencies
// This prevents compilation issues with @scenemesh/entity-engine-aimodule/ui-index imports

// Re-export useful AI SDK utilities
export {
  readUIMessageStream,
  DefaultChatTransport,
  createUIMessageStream,
  convertToModelMessages,
  TextStreamChatTransport,
  createUIMessageStreamResponse,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';

// 🔧 Dynamic UI Components - Entity Engine集成版本
export {
  DynamicToolRenderer,
  ENTITY_DYNAMIC_COMPONENTS,
  DynamicEntityGridComponent,
  DynamicEntityFormComponent,
  DynamicEntityKanbanComponent,
  DynamicEntityMastailComponent,
  DynamicEntityDashboardComponent,
} from './components/DynamicUI';

// ================================
// 🎯 Re-exports from AI SDK
// ================================

// ================================
// 🎯 Utility Functions
// ================================
export {
  // CSS Utils
  cn,
  // Storage Utils
  storage,
  // Performance Utils
  debounce,
  throttle,
  // Error Utils
  safeAsync,
  
  // Validation Utils
  isValidUrl,
  isValidJson,
  
  hasToolCalls,
  getToolCalls,
  // String Utils
  truncateText,
  createFileUrl,
  revokeFileUrl,
  
  camelToSpaced,
  safeJsonParse,
  // File Utils
  formatFileSize,
  
  // Time Utils
  formatTimestamp,
  getFileExtension,
  // Message Utils
  extractMessageText,
  
  hasFileAttachments,
  
  getFileAttachments,
  formatRelativeTime,
  
  isFileTypeAccepted,
  createErrorMessage,
  
  highlightSearchTerms,
} from './utils';

// Re-export core AI SDK types that users might need
export type {
  UIMessage,
  DataUIPart,
  FileUIPart,
  TextUIPart,
  UIMessagePart,
  ToolResultPart,
} from 'ai';

// ================================
// 🎯 Version Info
// ================================

export const version = '1.0.0';
export const packageName = 'entity-engine-aiui';

// ================================
// 🎯 Types & Interfaces
// ================================
export type {
  ChatReturn,
  // Event Types
  ChatEvents,
  MessageRole,
  
  // Hook Types
  ChatOptions,
  // Theme Types
  ThemeConfig,
  ObjectReturn,
  MessageStatus,
  
  // Tool Types
  ToolCallState,
  ObjectOptions,
  StyleVariants,
  ToolDefinition,
  // Component Types
  ChatDialogProps,
  FileViewerProps,
  
  // Data Types
  CustomDataParts,
  CustomUIMessage,
  CompletionReturn,
  // Core Types
  ExtendedUIMessage,
  
  CompletionOptions,
  
  MessageBubbleProps,
  ToolExecutionResult,
  // Transport Types
  CustomTransportOptions,
  
  UserInteractionToolOptions,
} from './types';

// ================================
// 🎯 Generative UI Types
// ================================
// Note: Registry types removed - using direct component imports instead

// ================================
// 🎯 Default Export
// ================================

/**
 * Default export containing all main functionality
 * Components are loaded dynamically to avoid server-side React imports
 */
const EntityEngineAIUI = {
  // Hooks - imported dynamically to avoid server-side issues
  get useChat() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./hooks').useChat;
  },
  get useCompletion() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./hooks').useCompletion;
  },
  get useObject() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./hooks').useObject;
  },
  
  // Components - imported dynamically to avoid server-side React imports
  get ChatDialog() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./components').ChatDialog;
  },
  get MessageBubble() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./components').MessageBubble;
  },
  get FileViewer() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./components').FileViewer;
  },
  
  // Version info
  version,
  packageName,
};

export default EntityEngineAIUI;