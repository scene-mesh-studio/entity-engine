/**
 * Tools Collection - Unified export for all available tools
 * 
 * Optimized file structure:
 * - static-tools/: Static tools (predefined types)
 * - dynamic-tools/: Dynamic tools (runtime types)
 * - frontend-tools/: Frontend proxy tools
 */

// Dynamic tools import
import { entityQueryTool } from './dynamic-tools';
// Static tools import
import { weatherTool, locationTool } from './static-tools';
// Frontend proxy tools import
import { 
  recordGetValuesTool,
  recordSetValuesTool,
  recordResetFormTool,
  recordValidateFormTool,
  recordGetFieldInfoTool
} from './frontend-tools';

/**
 * Default tools collection - Static, dynamic and frontend proxy tools
 * 
 * Design features:
 * - Static tools: getWeather, getLocation (basic functionality)
 * - Dynamic tools: entityQuery (data retrieval focused)
 * - Frontend proxy tools: record* operations
 */
export const defaultTools = {
  // Static tools
  getWeather: weatherTool,
  getLocation: locationTool,
  
  // Dynamic tools
  entityQuery: entityQueryTool,
  
  // Frontend proxy tools - standardized view controller operations
  recordGetValues: recordGetValuesTool,
  recordSetValues: recordSetValuesTool,
  recordResetForm: recordResetFormTool,
  recordValidateForm: recordValidateFormTool,
  recordGetFieldInfo: recordGetFieldInfoTool,
} as const;

/**
 * Get all available tools
 */
export function getAllTools() {
  return defaultTools;
}

/**
 * Get tools list (for API documentation or debugging)
 */
export function getToolsList() {
  return Object.keys(defaultTools);
}

// Re-export specific tools (backward compatibility)
export { weatherTool, locationTool } from './static-tools';
export { entityQueryTool, toolsIntegration } from './dynamic-tools';
export { 
  recordGetValuesTool,
  recordSetValuesTool,
  recordResetFormTool,
  recordValidateFormTool,
  recordGetFieldInfoTool
} from './frontend-tools';