// Entity Engine Studio - 基于 EntityEngine 的配置工作室

// ================================================================================
// 🎯 核心组件
// ================================================================================

export { PreviewPanel } from './components/preview';

export { StudioService } from './services/studio-service';
// 变更检测服务
export { changeDetector } from './services/change-detector';
// 视图和组件编辑器
export { ViewOptionsEditor } from './components/view-editor';
export { WidgetConfigEditor } from './components/view-editor';
export { EnhancedFieldEditor } from './components/view-editor';
export { EntityEngineAPI } from './services/entity-engine-api';

export { UniversalFieldsEditor } from './components/view-editor';

// ================================================================================
// 🔧 服务层
// ================================================================================

export { HierarchicalViewEditor } from './components/view-editor';
export { HierarchicalModelEditor } from './components/model-editor';
// 主工作空间组件
export { UnifiedConfigurationWorkspace } from './components/workspace';
export { StudioEngineService } from './services/studio-engine-service';
export { studioRenderers, EntityEngineStudioLauncher } from './renderers';
export { StudioEngineProvider, useStudioEngineOptional } from './providers/studio-engine-provider';

// ================================================================================
// 📋 类型定义
// ================================================================================

export type { EditMode } from './types/editor';
export type { StudioPageInfo } from './types/index';
export type { StudioState, StudioConfig } from './services/studio-service';
export type { ChangeSet, ConfigSnapshot } from './services/change-detector';
export type { ConfigData, ViewOptions } from './services/studio-engine-service';

export type { UnifiedConfigurationWorkspaceProps } from './components/workspace';

export type { StudioEngineProviderProps } from './providers/studio-engine-provider';

// 从主包导出核心类型（供外部使用）
export type {
    IEntityView,
    IEntityModel,
    IEntityField,
    IEntityEngine,
    IEntityViewField,
} from '@scenemesh/entity-engine';

// ================================================================================
// 🚀 扩展机制
// ================================================================================

export interface StudioExtension {
    name: string;
    version: string;
    description?: string;

    editors?: {
        model?: React.ComponentType<any>;
        view?: React.ComponentType<any>;
        field?: React.ComponentType<any>;
    };

    toolbar?: {
        items?: React.ComponentType<any>[];
    };

    panels?: {
        left?: React.ComponentType<any>[];
        right?: React.ComponentType<any>[];
    };

    hooks?: {
        onModelSave?: (model: any) => Promise<void>;
        onViewSave?: (view: any) => Promise<void>;
        onConfigExport?: (config: any) => Promise<any>;
        onConfigImport?: (config: any) => Promise<any>;
    };
}

export class StudioExtensionRegistry {
    private extensions = new Map<string, StudioExtension>();

    register(extension: StudioExtension) {
        this.extensions.set(extension.name, extension);
    }

    unregister(name: string) {
        this.extensions.delete(name);
    }

    get(name: string): StudioExtension | undefined {
        return this.extensions.get(name);
    }

    getAll(): StudioExtension[] {
        return Array.from(this.extensions.values());
    }

    getEditors(type: 'model' | 'view' | 'field') {
        return this.getAll()
            .map((ext) => ext.editors?.[type])
            .filter(Boolean);
    }

    getToolbarItems() {
        return this.getAll().flatMap((ext) => ext.toolbar?.items || []);
    }

    getPanels(position: 'left' | 'right') {
        return this.getAll().flatMap((ext) => ext.panels?.[position] || []);
    }
}

export const studioExtensionRegistry = new StudioExtensionRegistry();

// ================================================================================
// 🛠️ 工具函数
// ================================================================================

import { StudioEngineService } from './services/studio-engine-service';

export function createStudioInstance(engine: any) {
    return {
        service: new StudioEngineService(engine),
        extensionRegistry: studioExtensionRegistry,
    };
}

export type {
    // Studio类型别名
    PageConfig,
    // Studio独有类型
    NewPageForm,
    EditPageForm,
    MenuStructure,
    PageConfigItem,

    // 基于主包的扩展类型
    StudioPageConfig,
    StudioPageConfigItem,
} from './types';

export const STUDIO_VERSION = '0.0.4';
export const STUDIO_NAME = '@scenemesh/entity-engine-studio';
