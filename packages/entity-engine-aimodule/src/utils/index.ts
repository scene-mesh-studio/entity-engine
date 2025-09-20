/**
 * Entity Engine AI - Utility Functions
 * 
 * Collection of utility functions for common operations
 */

import type { ExtendedUIMessage } from '../types/ui-types';

// Export other utility modules

export * from './warnings';
export * from './streaming';
export * from './persistence';

// Message processing utilities

/**
 * Extract text content from message
 */
export function extractMessageText(message: ExtendedUIMessage): string {
  return message.parts
    .filter(part => part.type === 'text')
    .map(part => (part as any).text)
    .join('\n');
}

/**
 * Check if message contains tool calls
 */
export function hasToolCalls(message: ExtendedUIMessage): boolean {
  return message.parts.some(part => 
    part.type.startsWith('tool-') || part.type === 'dynamic-tool'
  );
}

/**
 * Get tool calls list from message
 */
export function getToolCalls(message: ExtendedUIMessage): Array<{
  toolName: string;
  state: string;
  input?: any;
  output?: any;
}> {
  return message.parts
    .filter(part => part.type.startsWith('tool-') || part.type === 'dynamic-tool')
    .map(part => ({
      toolName: part.type === 'dynamic-tool' 
        ? (part as any).toolName 
        : part.type.replace('tool-', ''),
      state: (part as any).state || 'unknown',
      input: (part as any).input,
      output: (part as any).output,
    }));
}

/**
 * Check if message contains file attachments
 */
export function hasFileAttachments(message: ExtendedUIMessage): boolean {
  return message.parts.some(part => part.type === 'file');
}

/**
 * Get file attachments list from message
 */
export function getFileAttachments(message: ExtendedUIMessage) {
  return message.parts
    .filter(part => part.type === 'file')
    .map(part => part as any);
}

// Time formatting utilities

/**
 * Format timestamp
 */
export function formatTimestamp(timestamp?: number, options?: {
  format?: 'short' | 'long' | 'relative';
  includeDate?: boolean;
}): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const { format = 'short', includeDate = false } = options || {};

  switch (format) {
    case 'short':
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        ...(includeDate && { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    
    case 'long':
      return date.toLocaleString();
    
    case 'relative':
      return formatRelativeTime(timestamp);
    
    default:
      return date.toLocaleTimeString();
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (diff < minute) {
    return 'Just now';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}m ago`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days}d ago`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks}w ago`;
  } else if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months}mo ago`;
  } else {
    const years = Math.floor(diff / year);
    return `${years}y ago`;
  }
}

// File processing utilities

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file type is accepted
 */
export function isFileTypeAccepted(
  file: File, 
  acceptedTypes: string[]
): boolean {
  return acceptedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
}

/**
 * Create file URL
 */
export function createFileUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke file URL
 */
export function revokeFileUrl(url: string): void {
  URL.revokeObjectURL(url);
}

// String processing utilities

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Highlight search terms
 */
export function highlightSearchTerms(text: string, searchTerms: string[]): string {
  if (!searchTerms.length) return text;
  
  let highlightedText = text;
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
}

/**
 * Convert camelCase to space-separated
 */
export function camelToSpaced(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').trim();
}

// Data validation utilities

/**
 * Check if string is valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is valid JSON
 */
export function isValidJson(string: string): boolean {
  try {
    JSON.parse(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(string: string, fallback: T): T {
  try {
    return JSON.parse(string);
  } catch {
    return fallback;
  }
}

// CSS class name utilities

/**
 * Combine CSS class names (simplified clsx)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Error handling utilities

/**
 * Safely execute async function
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    return { 
      error: error instanceof Error ? error : new Error(String(error)),
      ...(fallback !== undefined && { data: fallback })
    };
  }
}

/**
 * Create error message
 */
export function createErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// Performance utilities

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function debouncedFunction(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function throttledFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, delay);
    }
  };
}

// Local storage utilities

/**
 * Safe localStorage operations
 */
export const storage = {
  get<T>(key: string, fallback?: T): T | null {
    if (typeof window === 'undefined') return fallback || null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : (fallback || null);
    } catch {
      return fallback || null;
    }
  },

  set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};