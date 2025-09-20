/**
 * Entity Engine Frontend Proxy Tools
 * 
 * Registers frontend controller operations as standard tools.
 * Communicates with frontend view controllers through backend proxy API.
 */

import { z } from 'zod';
import { tool } from 'ai';

/**
 * Global frontend tool call bridge
 * Communicates with frontend through global objects
 */
declare global {
  interface Window {
    __ENTITY_ENGINE_AI_BRIDGE__?: {
      executeViewControllerTool: (toolName: string, input: any) => Promise<string>;
    };
    __FRONTEND_TOOL_EXECUTOR__?: (waitId: string, toolName: string, input: any) => Promise<void>;
    resolveFrontendTool?: (waitId: string, result: string) => void;
    rejectFrontendTool?: (waitId: string, error: string) => void;
  }
  
  var resolveFrontendTool: (waitId: string, result: string) => void;
  var rejectFrontendTool: (waitId: string, error: string) => void;
  var __FRONTEND_TOOL_EXECUTOR__: (waitId: string, toolName: string, input: any) => Promise<void>;
}

/**
 * Frontend tool waiting pool - for backend waiting for frontend results
 */
const frontendToolWaitPool = new Map<string, {
  resolve: (result: string) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}>();

/**
 * Frontend tool executor - waits for frontend HTTP responses
 */
async function executeFrontendTool(toolName: string, input: any): Promise<string> {
  
  // Key: use simplified waitId for frontend matching
  const waitId = `frontend-${toolName}`;
  
  // Key: create Promise waiting for frontend HTTP result
  return new Promise((resolve, reject) => {
    // Set timeout mechanism
    const timeout = setTimeout(() => {
      frontendToolWaitPool.delete(waitId);
      reject(new Error(`Frontend tool ${toolName} timeout after 30 seconds`));
    }, 30000);
    
    // Store Promise in waiting pool
    frontendToolWaitPool.set(waitId, {
      resolve,
      reject,
      timeout
    });
  });
}

/**
 * Frontend tool result callback - for frontend invocation
 */
(global as any).resolveFrontendTool = (waitId: string, result: string) => {
  const waiting = frontendToolWaitPool.get(waitId);
  if (waiting) {
    clearTimeout(waiting.timeout);
    frontendToolWaitPool.delete(waitId);
    waiting.resolve(result);
  }
};

(global as any).rejectFrontendTool = (waitId: string, error: string) => {
  const waiting = frontendToolWaitPool.get(waitId);
  if (waiting) {
    clearTimeout(waiting.timeout);
    frontendToolWaitPool.delete(waitId);
    waiting.reject(new Error(error));
  }
};

/**
 * Get record field values tool
 */
export const recordGetValuesTool = tool({
  description: 'Get current form/record field values. Returns all field values in the current form.',
  inputSchema: z.object({}).describe('No input parameters required'),
  execute: async () => await executeFrontendTool('recordGetValues', {})
});

/**
 * Set record field value tool
 */
export const recordSetValuesTool = tool({
  description: 'Set form field values',
  inputSchema: z.object({
    values: z.record(z.string(), z.any()).describe('Field value object. Keys MUST be exact field names returned by recordGetFieldInfo')
  }),
  execute: async ({ values }) => await executeFrontendTool('recordSetValues', { values })
});

/**
 * Reset form tool
 */
export const recordResetFormTool = tool({
  description: 'Reset form to initial state. Clear all user input and restore default values.',
  inputSchema: z.object({}).describe('No input parameters required'),
  execute: async () => await executeFrontendTool('recordResetForm', {})
});

/**
 * Form validation tool
 */
export const recordValidateFormTool = tool({
  description: 'Validate current form/record data. Check all field validation rules and return validation results.',
  inputSchema: z.object({}).describe('No input parameters required'),
  execute: async () => await executeFrontendTool('recordValidateForm', {})
});

/**
 * Get field information tool
 */
export const recordGetFieldInfoTool = tool({
  description: 'Get record field information. Returns detailed information and exact field names for all fields in current view. Must call this tool before recordSetValues to get correct field names.',
  inputSchema: z.object({
    fieldName: z.string().optional().describe('Specific field name, if not provided returns all field information')
  }),
  execute: async ({ fieldName }) => await executeFrontendTool('recordGetFieldInfo', { fieldName })
});