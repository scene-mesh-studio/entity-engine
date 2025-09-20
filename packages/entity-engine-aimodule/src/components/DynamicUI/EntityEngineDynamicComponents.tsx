// 'use client' directive is added by tsup banner

/**
 * Entity Engine Integrated Dynamic Components
 * 
 * Uses Entity Engine standard components for dynamic rendering
 * 专注于grid和form视图的集成，无冗余逻辑
 */



import React from 'react';
import { EntityViewContainer } from '@scenemesh/entity-engine';

// ================================
// Dynamic component type definitions
// ================================

export interface DynamicEntityComponentProps {
  toolName: string;
  modelName?: string;
  displayMode?: string;
  data?: any[];
  totalCount?: number;
  pagination?: {
    pageSize: number;
    pageIndex: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  query?: {
    sortBy?: Record<string, 'asc' | 'desc'>;
    filters?: Record<string, any>;
  };
  executedAt?: string;
  toolCallId?: string;
  _renderHint?: {
    componentType: string;
    preferredLayout?: string;
    features?: string[];
    dataSchema?: string[];
    capabilities?: string[];
  };
}

// ================================
// 📊 Entity Engine Grid 组件 - 数据表格显示
// ================================

export interface DynamicEntityGridProps extends DynamicEntityComponentProps {
  displayMode?: 'table' | 'grid';
}

export const DynamicEntityGridComponent: React.FC<DynamicEntityGridProps> = ({
  modelName = '',
  displayMode = 'table',
  toolName,
  _renderHint
}) => {
  if (!modelName) {
    return (
      <div style={{
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        backgroundColor: '#f8fafc'
      }}>
        <h4>⚠️ {toolName} 错误</h4>
        <p>缺少必需的 modelName 参数</p>
      </div>
    );
  }

  // 直接使用Entity Engine的标准组件
  return (
    <div>
      <EntityViewContainer
        modelName={modelName}
        viewType="grid"
        behavior={{ mode: 'display' }}
        viewOptions={{
          mode: displayMode,
          hideToolbar: false,
          hideEditColumn: false,
          hidePagination: false
        }}
      />
    </div>
  );
};

// ================================
// 📝 Entity Engine Form 组件 - 表单显示
// ================================

export interface DynamicEntityFormProps extends DynamicEntityComponentProps {
  baseObjectId?: string;
  mode?: 'display' | 'edit';
  toCreating?: boolean; // 使用Entity Engine的标准方式表示创建模式
}

// ================================
// 📋 Entity Engine Kanban 组件 - 看板视图
// ================================

export interface DynamicEntityKanbanProps extends DynamicEntityComponentProps {
  displayMode?: 'kanban';
}

// ================================
// 📊 Entity Engine Dashboard 组件 - 仪表板视图
// ================================

export interface DynamicEntityDashboardProps extends DynamicEntityComponentProps {
  displayMode?: 'dashboard';
}

// ================================
// 📑 Entity Engine Mastail 组件 - 主详视图
// ================================

export interface DynamicEntityMastailProps extends DynamicEntityComponentProps {
  displayMode?: 'mastail';
  baseObjectId?: string;
}

export const DynamicEntityFormComponent: React.FC<DynamicEntityFormProps> = ({
  modelName = '',
  baseObjectId,
  mode = 'display',
  toCreating = false,
  toolName
}) => {
  if (!modelName) {
    return (
      <div style={{
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        backgroundColor: '#f8fafc'
      }}>
        <h4>⚠️ {toolName} 错误</h4>
        <p>缺少必需的 modelName 参数</p>
      </div>
    );
  }

  // 直接使用Entity Engine的标准表单组件
  return (
    <div>
      <EntityViewContainer
        modelName={modelName}
        viewType="form"
        baseObjectId={baseObjectId}
        behavior={{ 
          mode,
          toCreating
        }}
      />
    </div>
  );
};

// ================================
// 📋 Kanban 组件实现
// ================================

export const DynamicEntityKanbanComponent: React.FC<DynamicEntityKanbanProps> = ({
  modelName = '',
  toolName,
  _renderHint
}) => {
  if (!modelName) {
    return (
      <div style={{
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        backgroundColor: '#f8fafc'
      }}>
        <h4>⚠️ {toolName} 错误</h4>
        <p>缺少必需的 modelName 参数</p>
      </div>
    );
  }

  return (
    <div>
      <EntityViewContainer
        modelName={modelName}
        viewType="kanban"
        behavior={{ mode: 'display' }}
        viewOptions={{
          hideToolbar: false,
          hideEditColumn: false,
          hidePagination: false
        }}
      />
    </div>
  );
};

// ================================
// 📊 Dashboard 组件实现
// ================================

export const DynamicEntityDashboardComponent: React.FC<DynamicEntityDashboardProps> = ({
  modelName = '',
  toolName,
  _renderHint
}) => {
  if (!modelName) {
    return (
      <div style={{
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        backgroundColor: '#f8fafc'
      }}>
        <h4>⚠️ {toolName} 错误</h4>
        <p>缺少必需的 modelName 参数</p>
      </div>
    );
  }

  return (
    <div>
      <EntityViewContainer
        modelName={modelName}
        viewType="dashboard"
        behavior={{ mode: 'display' }}
        viewOptions={{
          hideToolbar: false,
          hideEditColumn: false,
          hidePagination: false
        }}
      />
    </div>
  );
};

// ================================
// 📑 Mastail 组件实现
// ================================

export const DynamicEntityMastailComponent: React.FC<DynamicEntityMastailProps> = ({
  modelName = '',
  baseObjectId,
  toolName,
  _renderHint
}) => {
  if (!modelName) {
    return (
      <div style={{
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        backgroundColor: '#f8fafc'
      }}>
        <h4>⚠️ {toolName} 错误</h4>
        <p>缺少必需的 modelName 参数</p>
      </div>
    );
  }

  return (
    <div>
      <EntityViewContainer
        modelName={modelName}
        viewType="mastail"
        baseObjectId={baseObjectId}
        behavior={{ mode: 'display' }}
        viewOptions={{
          hideToolbar: false,
          hideEditColumn: false,
          hidePagination: false
        }}
      />
    </div>
  );
};

// ================================
// 🚫 错误显示组件 - 处理工具执行错误
// ================================

export interface DynamicErrorDisplayProps extends DynamicEntityComponentProps {
  error: string;
  errorDetails?: string;
  errorType?: string;
}

export const DynamicErrorDisplayComponent: React.FC<DynamicErrorDisplayProps> = ({
  toolName,
  error,
  errorDetails,
  errorType,
  executedAt,
  _renderHint
}) => (
    <div style={{
      padding: '1rem',
      backgroundColor: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: '0.5rem',
      color: '#dc2626',
      margin: '0.5rem 0'
    }}>
      <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
        ❌ {toolName} 执行失败
      </div>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
      {errorDetails && (
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.875rem' }}>详细错误信息</summary>
          <pre style={{ 
            marginTop: '0.25rem', 
            fontSize: '0.75rem', 
            backgroundColor: '#fef2f2',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {errorDetails}
          </pre>
        </details>
      )}
      {executedAt && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#991b1b', 
          marginTop: '0.5rem',
          opacity: 0.8
        }}>
          执行时间: {new Date(executedAt).toLocaleString()}
        </div>
      )}
    </div>
  );

// ================================
// Component type mapping for dynamic tools
// ================================

export const ENTITY_DYNAMIC_COMPONENTS = {
  'DynamicDataTable': DynamicEntityGridComponent,
  'DynamicDataGrid': DynamicEntityGridComponent,
  'DynamicDataList': DynamicEntityGridComponent,
  'DynamicEntityForm': DynamicEntityFormComponent,
  'DynamicEntityKanban': DynamicEntityKanbanComponent,
  'DynamicEntityDashboard': DynamicEntityDashboardComponent,
  'DynamicEntityMastail': DynamicEntityMastailComponent,
  'DynamicErrorDisplay': DynamicErrorDisplayComponent,
} as const;

export type EntityDynamicComponentType = keyof typeof ENTITY_DYNAMIC_COMPONENTS;