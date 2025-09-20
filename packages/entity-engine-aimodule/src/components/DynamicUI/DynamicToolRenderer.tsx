// 'use client' directive is added by tsup banner

/**
 * Dynamic Tool Renderer - Integrated with Entity Engine components
 * 
 * Features:
 * - 处理part.type === 'dynamic-tool' 
 * - 支持工具状态管理
 * - 直接使用Entity Engine的grid和form组件
 * - 无冗余逻辑，保持简洁
 */



import React from 'react';

import {
  ENTITY_DYNAMIC_COMPONENTS,
  type EntityDynamicComponentType
} from './EntityEngineDynamicComponents';

// ================================
// Standard type definitions
// ================================

interface DynamicToolPartProps {
  toolName: string;
  input: any;
  output: any;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
}

// ================================
// Main renderer implementation
// ================================

export function DynamicToolRenderer({ toolName, input, output, state }: DynamicToolPartProps) {
  switch (state) {
    case 'input-streaming':
      return (
        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
            ⚡ {toolName} - 准备中...
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            正在解析工具参数...
          </div>
        </div>
      );

    case 'input-available':
      return (
        <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #f59e0b' }}>
          <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
            🔧 {toolName} - 执行中
          </div>
          <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
            {input?.modelName && `查询模型：${input.modelName}`}
            {input?.displayMode && ` | 显示模式：${input.displayMode}`}
          </div>
        </div>
      );

    case 'output-available':
      return (
        <DynamicOutputRenderer 
          toolName={toolName}
          input={input}
          output={output}
        />
      );

    case 'output-error':
      return (
        <div style={{ 
          padding: '1rem', 
          background: '#fee2e2', 
          borderRadius: '0.5rem', 
          border: '1px solid #fecaca',
          color: '#dc2626'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
            ❌ {toolName} 执行失败
          </div>
          <p style={{ margin: 0 }}>{output?.error || '未知错误'}</p>
          {output?.errorDetails && (
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer' }}>详细信息</summary>
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>{output.errorDetails}</p>
            </details>
          )}
        </div>
      );

    default:
      return (
        <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem' }}>
          <h4>🔧 {toolName}</h4>
          <p>未知状态: {state}</p>
        </div>
      );
  }
}

// ================================
// Output renderer - intelligent component selection
// ================================

function DynamicOutputRenderer({ toolName, input, output }: {
  toolName: string;
  input: any;
  output: any;
}) {
  // 获取渲染提示
  const renderHint = output?._renderHint;
  const componentType = renderHint?.componentType;
  
  // 优先根据displayMode选择组件
  const displayMode = input?.displayMode || output?.displayMode;
  
  // 智能组件选择逻辑
  let selectedComponentType: EntityDynamicComponentType;
  
  if (componentType && componentType in ENTITY_DYNAMIC_COMPONENTS) {
    selectedComponentType = componentType as EntityDynamicComponentType;
  } else {
    // 根据显示模式智能选择，不设置默认值
    switch (displayMode) {
      case 'table':
        selectedComponentType = 'DynamicDataTable';
        break;
      case 'list':
        selectedComponentType = 'DynamicDataGrid'; // 使用grid视图的list模式
        break;
      case 'grid':
        selectedComponentType = 'DynamicDataGrid';
        break;
      case 'form':
        selectedComponentType = 'DynamicEntityForm';
        break;
      case 'kanban':
        selectedComponentType = 'DynamicEntityKanban';
        break;
      case 'dashboard':
        selectedComponentType = 'DynamicEntityDashboard';
        break;
      case 'mastail':
        selectedComponentType = 'DynamicEntityMastail';
        break;
      default:
        // 根据数据判断最合适的显示方式
        if (input?.baseObjectId || output?.baseObjectId) {
          selectedComponentType = 'DynamicEntityForm'; // 有ID则显示表单
        } else {
          selectedComponentType = 'DynamicDataGrid'; // 无ID则显示网格
        }
    }
  }
  
  // 获取对应的组件
  const SelectedComponent = ENTITY_DYNAMIC_COMPONENTS[selectedComponentType];
  
  // 组件属性映射
  const componentProps: any = {
    toolName,
    modelName: input?.modelName || output?.modelName,
    displayMode: displayMode || 'table',
    data: output?.data,
    totalCount: output?.totalCount,
    pagination: output?.pagination,
    query: output?.query || {
      sortBy: input?.sortBy,
      filters: input?.filters
    },
    baseObjectId: input?.baseObjectId,
    mode: input?.mode === 'create' ? 'edit' : (input?.mode || 'display'),
    toCreating: input?.mode === 'create',
    executedAt: output?.executedAt,
    toolCallId: output?.toolCallId,
    _renderHint: renderHint
  };

  // Add required error property for error display component
  if (selectedComponentType === 'DynamicErrorDisplay') {
    componentProps.error = output?.error || 'Unknown error';
    componentProps.errorDetails = output?.errorDetails || renderHint?.errorDetails;
    componentProps.errorType = output?.errorType || renderHint?.errorType || 'unknown';
  }

  return (
    <div style={{ margin: '0.5rem 0' }}>
      <div style={{ 
        fontWeight: '500', 
        marginBottom: '0.75rem',
        padding: '0.5rem',
        background: '#f0f9ff',
        borderRadius: '0.375rem',
        border: '1px solid #e0f2fe'
      }}>
        🔧 {toolName} 结果
        {output?.executedAt && (
          <span style={{ 
            fontSize: '0.75rem', 
            color: '#64748b', 
            marginLeft: '0.5rem' 
          }}>
            {new Date(output.executedAt).toLocaleString()}
          </span>
        )}
      </div>
      <SelectedComponent {...componentProps} />
    </div>
  );
}