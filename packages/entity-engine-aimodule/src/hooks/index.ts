/**
 * Entity Engine AI - Hooks Export
 * 
 * Unified export for all React Hooks
 */

// Core Hooks
export { useChat } from './useChat';
export { useObject } from './useObject';
export { useCompletion } from './useCompletion';

// AI SDK Core types  
export type {
  CoreMessage
} from 'ai';

// Re-export AI SDK types
export type {
  UIMessage,
  UseChatOptions,
  CreateUIMessage
} from '@ai-sdk/react';