/**
 * Entity Data Query Dynamic Tool
 * 
 * Dynamic tool implementation for entity data queries
 * Focused on data retrieval without complex analysis features
 */

import { z } from 'zod';

import { type DynamicTool, AIToolsIntegration } from '../../core/ai-tools';

// Create tools integration instance
const toolsIntegration = new AIToolsIntegration();

/**
 * Entity data query tool
 * Focused on data retrieval without analysis functionality
 */
export const entityQueryTool: DynamicTool = toolsIntegration.createDynamicTool(
  'Query entity data with basic operations like pagination, sorting, and filtering. Focused on data retrieval without analysis functionality.',
  z.object({
    modelName: z.string().describe('Entity model name, e.g.: ee-base-user (users), product (products), etc'),
    displayMode: z.enum(['table', 'list', 'grid', 'form', 'kanban', 'dashboard', 'mastail']).optional().default('table').describe('Display mode: table, list, grid, form, kanban, dashboard, or mastail (master-detail view)'),
    baseObjectId: z.string().optional().describe('Entity object ID, used for form mode to display specific object'),
    pageSize: z.number().optional().default(20).describe('Number of items per page, default 20'),
    pageIndex: z.number().optional().default(0).describe('Page index, starting from 0'),
    sortBy: z.record(z.string(), z.enum(['asc', 'desc'])).optional().describe('Sort fields and directions'),
    filters: z.record(z.string(), z.any()).optional().describe('Filter conditions')
  }),
  async (input: unknown, options) => {
    try {
      // Validate and parse input
      const validatedInput = validateAndParseInput(input);
      const { modelName, displayMode, baseObjectId, pageSize, pageIndex, sortBy, filters } = validatedInput;


      // Execute data query
      return await executeEntityQuery(modelName, {
        displayMode,
        baseObjectId,
        pageSize,
        pageIndex,
        sortBy,
        filters
      }, options);

    } catch (error) {
      console.error('Entity query tool execution error:', error);
      
      return {
        error: error instanceof Error ? error.message : 'Query failed',
        toolName: 'entityQuery',
        toolCallId: options.toolCallId,
        executedAt: new Date().toISOString(),
        _renderHint: {
          componentType: 'DynamicErrorDisplay',
          errorType: 'query_error',
          errorDetails: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
);

/**
 * Input validation and parsing function
 */
function validateAndParseInput(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid input: expected object');
  }

  const obj = input as Record<string, any>;
  
  if (!obj.modelName || typeof obj.modelName !== 'string') {
    throw new Error('Invalid modelName: must be a string');
  }

  return {
    modelName: obj.modelName as string,
    displayMode: obj.displayMode || 'table',
    baseObjectId: obj.baseObjectId || undefined,
    pageSize: obj.pageSize || 20,
    pageIndex: obj.pageIndex || 0,
    sortBy: obj.sortBy || { createdAt: 'desc' },
    filters: obj.filters || {}
  };
}

/**
 * Execute entity data query
 */
async function executeEntityQuery(
  modelName: string,
  queryOptions: {
    displayMode: string;
    baseObjectId?: string;
    pageSize: number;
    pageIndex: number;
    sortBy: Record<string, 'asc' | 'desc'>;
    filters: Record<string, any>;
  },
  options: { toolCallId: string; messages: any[]; abortSignal?: AbortSignal }
) {
  const { displayMode, baseObjectId, pageSize, pageIndex, sortBy, filters } = queryOptions;

  // Build tRPC query parameters
  const tRPCInput = encodeURIComponent(JSON.stringify({
    "0": {
      "json": {
        modelName,
        pageSize,
        pageIndex,
        sortBy,
        where: filters // Convert filter conditions to where clause
      }
    }
  }));
  
  // Call Entity Engine tRPC API
  const response = await fetch(`http://localhost:8082/api/ee/trpc/model.listObjects?batch=1&input=${tRPCInput}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: options.abortSignal
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const tRPCResult = await response.json();
  const result = tRPCResult[0]?.result?.data?.json || {};
  const rawEntityData = result.data || [];
  const totalCount = result.count || 0;
  
  // Flatten Entity data structure for frontend rendering
  const entityData = rawEntityData.map((item: any) => ({
    id: item.id,
    modelName: item.modelName,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    isDeleted: item.isDeleted,
    ...item.values // Spread entity data values
  }));

  return {
    toolName: 'entityQuery',
    modelName,
    displayMode,
    data: entityData,
    totalCount,
    baseObjectId, // Add baseObjectId to response for form mode
    pagination: {
      pageSize,
      pageIndex,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: pageIndex < Math.ceil(totalCount / pageSize) - 1,
      hasPreviousPage: pageIndex > 0
    },
    query: {
      sortBy,
      filters,
      appliedFilters: Object.keys(filters).length
    },
    executedAt: new Date().toISOString(),
    toolCallId: options.toolCallId,
    // Provide rendering hints for dynamic component renderers
    _renderHint: {
      componentType: getDynamicComponentType(displayMode),
      preferredLayout: displayMode,
      features: getDisplayModeFeatures(displayMode),
      dataSchema: entityData.length > 0 ? Object.keys(entityData[0]) : [],
      capabilities: ['pagination', 'sorting', 'filtering'] // 只提供基础功能
    }
  };
}

/**
 * 根据显示模式获取对应的动态组件类型
 */
function getDynamicComponentType(displayMode: string): string {
  const mapping = {
    'table': 'DynamicDataTable',
    'list': 'DynamicDataList',
    'grid': 'DynamicDataGrid',
    'form': 'DynamicEntityForm',
    'kanban': 'DynamicEntityKanban',
    'dashboard': 'DynamicEntityDashboard',
    'mastail': 'DynamicEntityMastail'
  };
  return mapping[displayMode as keyof typeof mapping] || 'DynamicDataTable';
}

/**
 * 根据显示模式获取功能特性
 */
function getDisplayModeFeatures(displayMode: string): string[] {
  const featureMap = {
    'table': ['pagination', 'sorting', 'filtering', 'selection', 'export'],
    'list': ['pagination', 'filtering', 'search'],
    'grid': ['pagination', 'filtering', 'card_view'],
    'form': ['display', 'edit', 'validation', 'field_layout'],
    'kanban': ['drag_drop', 'status_columns', 'card_management', 'filtering'],
    'dashboard': ['charts', 'metrics', 'widgets', 'real_time_data'],
    'mastail': ['master_detail', 'navigation', 'related_data', 'drill_down']
  };
  return featureMap[displayMode as keyof typeof featureMap] || ['pagination'];
}

// 导出工具集成器实例
export { toolsIntegration };