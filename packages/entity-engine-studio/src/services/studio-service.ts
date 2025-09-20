/**
 * Studio 核心服务
 * 专门处理Studio自身的业务逻辑，不涉及与主包的API对接
 */

import type { IEntityView, IEntityModel, IEntityEngine } from '@scenemesh/entity-engine';

import { EntityEngineAPI } from './entity-engine-api';

// 转换ExtendedEntityModel为IEntityModel

export interface StudioConfig {
    theme?: 'light' | 'dark';
    language?: 'zh' | 'en';
    debugMode?: boolean;
}

export interface StudioState {
    currentModel?: string;
    currentView?: string;
    selectedItems?: string[];
    searchQuery?: string;
}

/**
 * Studio核心服务类
 * 负责Studio的状态管理、配置管理等核心功能
 */
export class StudioService {
    private api: EntityEngineAPI;
    private config: StudioConfig = {};
    private state: StudioState = {};

    constructor(private engine: IEntityEngine) {
        this.api = new EntityEngineAPI(engine);
    }

    // ================================================================================
    // 🎯 API访问器
    // ================================================================================

    /**
     * 获取API实例，供其他组件使用
     */
    getAPI(): EntityEngineAPI {
        return this.api;
    }

    // ================================================================================
    // 🎯 配置管理
    // ================================================================================

    /**
     * 获取Studio配置
     */
    getConfig(): StudioConfig {
        return { ...this.config };
    }

    /**
     * 更新Studio配置
     */
    updateConfig(updates: Partial<StudioConfig>) {
        this.config = { ...this.config, ...updates };
    }

    /**
     * 重置配置到默认值
     */
    resetConfig() {
        this.config = {
            theme: 'light',
            language: 'zh',
            debugMode: false,
        };
    }

    // ================================================================================
    // 🎯 状态管理
    // ================================================================================

    /**
     * 获取Studio状态
     */
    getState(): StudioState {
        return { ...this.state };
    }

    /**
     * 更新Studio状态
     */
    updateState(updates: Partial<StudioState>) {
        this.state = { ...this.state, ...updates };
    }

    /**
     * 重置状态
     */
    resetState() {
        this.state = {};
    }

    // ================================================================================
    // 🎯 便捷方法（组合API调用）
    // ================================================================================

    /**
     * 获取当前选中的模型详情
     */
    getCurrentModelDetails() {
        if (!this.state.currentModel) return null;

        const model = this.api.getModelByName(this.state.currentModel);
        if (!model) return null;

        const views = this.api.getViewsByModelName(this.state.currentModel);

        return {
            model,
            views,
            viewCount: views.length,
        };
    }

    /**
     * 获取当前选中的视图详情
     */
    getCurrentViewDetails() {
        if (!this.state.currentView) return null;

        const view = this.api.getViewByName(this.state.currentView);
        if (!view) return null;

        const model = this.api.getModelByName(view.modelName);

        return {
            view,
            model,
            isValid: !!model,
        };
    }

    /**
     * 执行搜索（直接使用API原始数据）
     */
    search(query: string): { models: IEntityModel[]; views: IEntityView[] } {
        this.updateState({ searchQuery: query });

        // 简化实现：直接返回空结果，避免使用增强机制
        console.warn('[StudioService] search方法已简化，不再使用增强机制');
        return {
            models: [],
            views: [],
        };
    }

    /**
     * 选择模型
     */
    selectModel(modelName: string) {
        this.updateState({
            currentModel: modelName,
            currentView: undefined, // 清除视图选择
            selectedItems: [],
        });
    }

    /**
     * 选择视图
     */
    selectView(viewName: string) {
        const view = this.api.getViewByName(viewName);
        this.updateState({
            currentView: viewName,
            currentModel: view?.modelName, // 自动选择关联的模型
            selectedItems: [],
        });
    }

    // ================================================================================
    // 🎯 数据导出
    // ================================================================================

    /**
     * 导出元数据
     */
    exportMetadata() {
        return {
            models: this.api.getModels(),
            views: this.api.getViews(),
            engineInfo: this.api.getEngineInfo(),
            exportTimestamp: Date.now(),
            studioVersion: '1.0.0',
        };
    }

    /**
     * 导出Studio配置
     */
    exportStudioConfig() {
        return {
            config: this.getConfig(),
            state: this.getState(),
            exportTimestamp: Date.now(),
        };
    }

    // ================================================================================
    // 🎯 工具方法
    // ================================================================================

    /**
     * 获取统计信息
     */
    getStatistics() {
        const models = this.api.getModels();
        const views = this.api.getViews();

        // 按模型分组统计视图数量
        const viewCountByModel = views.reduce(
            (acc, view) => {
                acc[view.modelName] = (acc[view.modelName] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        // 按视图类型统计
        const viewCountByType = views.reduce(
            (acc, view) => {
                const type = view.viewType || 'unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        return {
            totalModels: models.length,
            totalViews: views.length,
            viewCountByModel,
            viewCountByType,
            engineInfo: this.api.getEngineInfo(),
        };
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.resetState();
        this.resetConfig();
    }
}
