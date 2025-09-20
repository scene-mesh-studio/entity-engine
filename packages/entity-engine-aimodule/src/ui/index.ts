/**
 * Entity Engine AI Module - UI Exports
 * 
 * 导出所有React UI组件、Hooks和相关功能
 * 这个模块专门为前端React应用设计
 */

// Core Hooks
export {
  useChat,
  useObject,
  useCompletion,
} from '../hooks';

// UI Components
export {
  ChatDialog,
  FileViewer,
  MessageBubble,
} from '../components';

// Renderers (Plugin System)
// TODO: Add renderers when implemented
// export {
//   EntityEngineAIUILauncher,
//   aiuiRenderers,
// } from '../renderers';

// UI utility functions
export {
  DefaultChatTransport,
  createUIMessageStream,
  convertToModelMessages,
  TextStreamChatTransport,
  createUIMessageStreamResponse,
  lastAssistantMessageIsCompleteWithToolCalls,
  // readUIMessageStream, // 避免与http模块重复导出
} from 'ai';

// UI Related Utilities
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
} from '../utils';

// Core types for UI components

// Essential types for UI usage
export type {
  UIMessage,
  DataUIPart,
  FileUIPart,
  TextUIPart,
  UIMessagePart,
  ToolResultPart,
} from 'ai';

// UI Types & Interfaces
export type {
  // Event Types
  ChatEvents,
  MessageRole,
  // Theme Types
  ThemeConfig,
  
  MessageStatus,
  // Tool Types
  ToolCallState,
  StyleVariants,
  ToolDefinition,
  // Component Types
  ChatDialogProps,
  
  FileViewerProps,
  // Data Types
  CustomDataParts,
  CustomUIMessage,
  
  // Core UI Types
  ExtendedUIMessage,
  MessageBubbleProps,
  ToolExecutionResult,
  
  // Transport Types
  CustomTransportOptions,
  
  UserInteractionToolOptions,
} from '../types/ui-types';

// ================================
// Version Info
// ================================

export const UI_VERSION = '1.0.0';
export const UI_PACKAGE_NAME = 'entity-engine-aimodule/ui';

// Default Export for UI

// Import components for default export
import { useChat, useObject, useCompletion } from '../hooks';
import { ChatDialog, FileViewer, MessageBubble } from '../components';

/**
 * Default export containing all UI functionality
 */
const EntityEngineaimoduleUI = {
  // Hooks
  useChat,
  useCompletion,
  useObject,
  
  // Components
  ChatDialog,
  MessageBubble,
  FileViewer,
  
  // Version info
  version: UI_VERSION,
  packageName: UI_PACKAGE_NAME,
};

export default EntityEngineaimoduleUI;