/**
 * Studio Engine Service - 重构版本
 * 专门负责Studio与EntityEngine的集成，不包含分析功能
 */

import type {
    IEntityView,
    IEntityModel,
    IEntityEngine,
    IEntityViewDelegate,
    IEntityModelDelegate,
} from '@scenemesh/entity-engine';
import type { EntityEngineAPI } from './entity-engine-api';

import { StudioService } from './studio-service';
import { directAPIService } from './direct-api-service';
import { validateAPIViewData, normalizeAPIViewsData } from '../utils/data-adapter';
// 已删除所有增强机制相关的导入，确保完全使用API原始数据

export interface ConfigData {
    models: IEntityModel[];
    views: IEntityView[];
}

export interface ConfigDataDelegates {
    models: IEntityModelDelegate[];
    views: IEntityViewDelegate[];
}

export interface FieldTypeInfo {
    type: string;
    title: string;
    description: string;
    shortLabel?: string;
    icon?: string;
    color?: string;
}

export interface ViewOptions {
    viewName?: string;
    viewType?: string;
}

export class StudioEngineService {
    private studioService: StudioService;
    private api: EntityEngineAPI;

    constructor(private engine: IEntityEngine) {
        this.studioService = new StudioService(engine);
        this.api = this.studioService.getAPI();
    }

    // ================================================================================
    // 🎯 基础数据访问方法
    // ================================================================================

    //获取所有模型（直接从API获取原始数据）

    async getModels(): Promise<IEntityModel[]> {
        try {
            const apiModels = await directAPIService.fetchModels();

            // 直接返回API原始数据，不做任何增强处理
            return apiModels as IEntityModel[];
        } catch (error) {
            console.error('[StudioEngineService] 直接从API获取模型失败:', error);
            return [];
        }
    }

    //根据名称获取单个模型（直接从API获取原始数据）

    async getModelByName(name: string): Promise<IEntityModel | null> {
        try {
            if (!name || typeof name !== 'string') {
                console.warn('[StudioEngineService] getModelByName参数无效:', name);
                return null;
            }

            const apiModel = await directAPIService.fetchModel(name);

            if (!apiModel) {
                return null;
            }

            // 直接返回API原始数据，不做任何增强处理
            return apiModel as IEntityModel;
        } catch (error) {
            console.error(`[StudioEngineService] 获取模型 ${name} 失败:`, error);
            return null;
        }
    }

    //获取所有视图（直接从API获取原始数据）

    async getViews(): Promise<IEntityView[]> {
        try {
            const apiViews = await directAPIService.fetchViews();

            // 直接返回API原始数据，不做任何增强处理
            return apiViews as IEntityView[];
        } catch (error) {
            console.error('[StudioEngineService] 直接从API获取视图失败:', error);
            return [];
        }
    }

    //根据名称获取模型（返回委托对象）

    getModelDelegateByName(name: string): IEntityModelDelegate | undefined {
        return this.api.getModelByName(name);
    }

    //根据名称获取视图（直接从API获取原始数据）

    async getViewByName(name: string): Promise<IEntityView | null> {
        try {
            if (!name || typeof name !== 'string') {
                console.warn('[StudioEngineService] getViewByName参数无效:', name);
                return null;
            }

            // 获取所有视图然后查找指定名称的视图
            const allViews = await this.getViews();
            const targetView = allViews.find((view) => view.name === name);

            if (!targetView) {
                return null;
            }

            return targetView;
        } catch (error) {
            console.error(`[StudioEngineService] 获取视图 ${name} 失败:`, error);
            return null;
        }
    }

    //根据名称获取视图（返回委托对象）

    getViewDelegateByName(name: string): IEntityViewDelegate | undefined {
        return this.api.getViewByName(name);
    }

    //根据模型名称获取视图列表（直接从API获取原始数据）

    async getViewsByModelName(modelName: string): Promise<IEntityView[]> {
        // 直接调用我们已经实现的DirectAPI方法
        return this.getViewsByModelNameFromDirectAPI(modelName);
    }

    //根据模型名称获取视图列表（返回委托对象）

    getViewDelegatesByModelName(modelName: string): IEntityViewDelegate[] {
        return this.api.getViewsByModelName(modelName);
    }

    // ================================================================================
    // 🎯 搜索功能
    // ================================================================================

    //搜索模型（直接从API搜索原始数据）

    async searchModels(query: string): Promise<IEntityModel[]> {
        try {
            // 获取所有模型然后过滤
            const allModels = await this.getModels();
            const filteredModels = allModels.filter(
                (model) =>
                    model.name?.toLowerCase().includes(query.toLowerCase()) ||
                    model.title?.toLowerCase().includes(query.toLowerCase())
            );
            return filteredModels;
        } catch (error) {
            console.error(`[StudioEngineService] 搜索模型失败: ${query}`, error);
            return [];
        }
    }

    //搜索视图（直接从API搜索原始数据）

    async searchViews(query: string): Promise<IEntityView[]> {
        try {
            // 获取所有视图然后过滤
            const allViews = await this.getViews();
            const filteredViews = allViews.filter(
                (view) =>
                    view.name?.toLowerCase().includes(query.toLowerCase()) ||
                    view.title?.toLowerCase().includes(query.toLowerCase())
            );
            return filteredViews;
        } catch (error) {
            console.error(`[StudioEngineService] 搜索视图失败: ${query}`, error);
            return [];
        }
    }

    //搜索模型（返回委托对象）

    searchModelDelegates(query: string): IEntityModelDelegate[] {
        return this.api.searchModels(query);
    }

    //搜索视图（返回委托对象）

    searchViewDelegates(query: string): IEntityViewDelegate[] {
        return this.api.searchViews(query);
    }

    //综合搜索

    search(query: string) {
        return this.studioService.search(query);
    }

    // ================================================================================
    // 🎯 验证功能
    // ================================================================================

    //验证模型

    validateModel(modelName: string) {
        return this.api.validateModel(modelName);
    }

    //验证视图

    validateView(viewName: string) {
        return this.api.validateView(viewName);
    }

    // ================================================================================
    // 🎯 引擎信息
    // ================================================================================

    //获取引擎信息

    getEngineInfo() {
        return this.api.getEngineInfo();
    }

    //获取统计信息

    getStatistics() {
        return this.studioService.getStatistics();
    }

    // ================================================================================
    // 🎯 数据导出
    // ================================================================================

    //导出元数据

    exportMetadata() {
        return this.studioService.exportMetadata();
    }

    // ================================================================================
    // 🔧 字段类型相关方法
    // ================================================================================

    //判断字段类型是否为关系类型

    isRelationFieldType(fieldType: string): boolean {
        return ['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many'].includes(fieldType);
    }

    //判断字段类型是否为选项类型

    isOptionsFieldType(fieldType: string): boolean {
        return ['select', 'multiselect', 'radio', 'checkbox'].includes(fieldType);
    }

    //已禁用：获取字段类型的默认组件 - 为保持API数据一致性，不再提供自动推断功能

    getDefaultWidgetForFieldType(fieldType: string, viewType = 'form'): string {
        // 完全禁用自动推断，返回空字符串，确保与API原始数据一致
        console.warn(
            '[StudioEngineService] getDefaultWidgetForFieldType已禁用，不再进行自动推断，请直接从API获取widget信息'
        );
        return '';
    }

    //获取可用的组件套件 - 使用正确的适配器流程

    getAvailableComponentSuites(): Array<{ value: string; label: string }> {
        try {
            const componentRegistry = this.engine.componentRegistry;
            if (!componentRegistry) {
                console.warn('[StudioEngineService] componentRegistry不存在');
                return [];
            }

            const adapters = componentRegistry.getAdapters();
            if (!adapters || adapters.length === 0) {
                console.warn('[StudioEngineService] 未找到可用的适配器');
                return [];
            }

            return adapters
                .map((adapter: any) => ({
                    value: adapter.suiteName || adapter.name || 'unknown',
                    label: adapter.displayName || adapter.suiteName || adapter.name || 'unknown',
                }))
                .filter((suite) => suite.value !== 'unknown');
        } catch (error) {
            console.error('[StudioEngineService] 获取组件套件失败:', error);
            return [];
        }
    }

    //获取可用的视图类型 - 从componentRegistry获取

    getAvailableViewTypes(): Array<{ value: string; label: string }> {
        try {
            // 从实际的组件注册表中获取视图类型
            const componentRegistry = this.engine.componentRegistry;
            if (!componentRegistry) {
                console.warn('[StudioEngineService] componentRegistry不存在');
                return [];
            }

            // 动态获取所有已注册的视图
            const registeredViews = componentRegistry.getViews();

            const viewTypes: Array<{ value: string; label: string }> = [];

            registeredViews.forEach((view, index) => {
                try {
                    if (!view || !view.info) {
                        console.warn(`[StudioEngineService] 视图 ${index} 缺少info信息:`, view);
                        return;
                    }

                    const viewInfo = view.info as any;
                    const apiViewName = viewInfo.viewName || viewInfo.name || `view_${index}`;
                    const displayName = viewInfo.displayName || apiViewName;

                    if (apiViewName) {
                        viewTypes.push({
                            value: apiViewName,
                            label: displayName,
                        });
                    }
                } catch (error) {
                    console.warn(`[StudioEngineService] 处理视图 ${index} 时出错:`, error);
                }
            });

            // 如果没有找到任何视图类型，返回默认类型
            if (viewTypes.length === 0) {
                console.warn('[StudioEngineService] 未找到任何视图类型');
                return [];
            }

            // 按label排序并去重
            const uniqueViewTypes = Array.from(
                new Map(viewTypes.map((vt) => [vt.value, vt])).values()
            ).sort((a, b) => a.label.localeCompare(b.label));

            return uniqueViewTypes;
        } catch (error) {
            console.error('[StudioEngineService] 获取视图类型失败:', error);
            return [];
        }
    }

    //获取可用的密度选项

    getAvailableDensityOptions(): Array<{ value: string; label: string }> {
        return [
            { value: 'small', label: '紧凑' },
            { value: 'medium', label: '中等' },
            { value: 'large', label: '宽松' },
        ];
    }

    //分析组件配置

    async analyzeWidget(_config: any): Promise<any> {
        // 基础实现，返回配置本身
        return { success: true, config: _config };
    }

    //清除组件分析缓存

    async clearWidgetAnalysisCache(): Promise<any> {
        // 基础实现
        return { success: true };
    }

    //获取组件配置规范

    async getWidgetConfigSpec(_config: any): Promise<any> {
        // 基础实现
        return { success: true, spec: {} };
    }

    //获取视图配置规范

    async getViewConfigSpec(_config: any): Promise<any> {
        // 基础实现
        return { success: true, spec: {} };
    }

    //获取配置数据（直接从API获取原始数据）

    async getConfigData(): Promise<ConfigData> {
        return {
            models: await this.getModels(),
            views: await this.getViews(),
        };
    }

    // ================================================================================
    // 🎯 Studio状态管理
    // ================================================================================

    //获取Studio服务实例

    getStudioService(): StudioService {
        return this.studioService;
    }

    //选择模型

    selectModel(modelName: string) {
        this.studioService.selectModel(modelName);
    }

    //选择视图

    selectView(viewName: string) {
        this.studioService.selectView(viewName);
    }

    //获取当前选中的模型详情

    getCurrentModelDetails() {
        return this.studioService.getCurrentModelDetails();
    }

    //获取当前选中的视图详情

    getCurrentViewDetails() {
        return this.studioService.getCurrentViewDetails();
    }

    // ================================================================================
    // 🎯 组件信息（直接委托给API）
    // ================================================================================

    //获取可用的Widget - 使用正确的套件适配器流程

    getAvailableWidgets() {
        try {
            // 1. 获取当前使用的套件类型
            // useEntitySuiteAdapter 只能在 React Hook 中使用
            // 直接从 engine 获取默认适配器
            const componentRegistry = this.engine.componentRegistry;
            if (!componentRegistry) {
                console.warn('[StudioEngineService] componentRegistry不存在');
                return [];
            }

            // 2. 获取默认适配器或第一个可用的适配器
            const adapters = componentRegistry.getAdapters();
            if (!adapters || adapters.length === 0) {
                console.warn('[StudioEngineService] 未找到可用的适配器');
                return [];
            }

            // 使用第一个可用的适配器（或按照优先级选择）
            const adapter = adapters[0];
            if (!adapter) {
                console.warn('[StudioEngineService] 适配器无效');
                return [];
            }

            // 3. 从适配器获取可用组件
            const widgets = adapter.getWidgets();
            if (!Array.isArray(widgets)) {
                console.warn('[StudioEngineService] adapter.getWidgets()返回值不是数组:', widgets);
                return [];
            }

            // 数据验证和标准化 - 使用 info.widgetName 进行正确匹配
            const validWidgets = widgets
                .filter((widget, index) => {
                    if (!widget) {
                        console.warn(`[StudioEngineService] Widget ${index} 为空`);
                        return false;
                    }
                    return true;
                })
                .map((widget, index) => {
                    // 标准化widget数据格式
                    const widgetInfo = (widget as any).info || widget;

                    // 🔑 关键修复：使用 info.widgetName 作为 API 标识符
                    const apiWidgetName =
                        widgetInfo.widgetName ||
                        (widget as any).name ||
                        widgetInfo.name ||
                        `widget_${index}`;
                    const displayName = widgetInfo.displayName || widgetInfo.label || apiWidgetName;

                    const standardizedWidget = {
                        value: apiWidgetName, // 使用 info.widgetName，这与API返回的值匹配
                        label: displayName,
                        icon: widgetInfo.icon,
                        description: widgetInfo.description,
                        viewType:
                            widgetInfo.viewType || widgetInfo.supportedViewTypes?.[0] || 'form',
                    };

                    return standardizedWidget;
                })
                .filter((widget) => widget.value && widget.label);

            return validWidgets;
        } catch (error) {
            console.error('[StudioEngineService] 获取Widgets失败:', error);
            return [];
        }
    }

    // ================================================================================
    // 🎯 字段类型信息（直接委托给API）
    // ================================================================================

    //获取字段类型信息

    getFieldTypeInfo(type: string) {
        return this.api.getFieldTypeInfo(type);
    }

    //获取所有可用的字段类型

    getAvailableFieldTypes(): string[] {
        return this.api.getAvailableFieldTypes();
    }

    // ================================================================================
    // 🎯 清理资源
    // ================================================================================

    //直接从API获取视图列表（绕过EntityEngine增强处理）

    async getViewsByModelNameFromDirectAPI(modelName: string): Promise<IEntityView[]> {
        try {
            if (!modelName || typeof modelName !== 'string') {
                console.warn(
                    '[StudioEngineService] getViewsByModelNameFromDirectAPI参数无效:',
                    modelName
                );
                return [];
            }

            // 使用DirectAPIService直接获取视图数据
            const rawApiViews = await directAPIService.fetchViews();

            // 过滤出属于指定模型的视图
            const modelRawViews = rawApiViews.filter(
                (view: any) => view && view.modelName === modelName
            );

            // 🆕 关键改进：使用API数据适配器处理复杂的嵌套数据结构
            const normalizedViews = normalizeAPIViewsData(modelRawViews);

            // 验证数据完整性
            normalizedViews.forEach((view, index) => {
                validateAPIViewData(view);
            });

            // 🎯 关键调试：确保viewType和widget信息被正确处理
            normalizedViews.forEach((view, index) => {});

            // 返回标准化后的视图数据，确保复杂嵌套结构被正确处理
            return normalizedViews as IEntityView[];
        } catch (error) {
            console.error(`[StudioEngineService] 直接从API获取模型${modelName}的视图失败:`, error);
            return [];
        }
    }

    //清理资源

    cleanup() {
        this.studioService.cleanup();
    }
}
