/**
 * Entity Engine API 对接层
 * 负责与主包EntityEngine的API交互，不包含任何fallback逻辑
 */

import type {
    IEntityEngine,
    IEntityViewDelegate,
    IEntityModelDelegate,
} from '@scenemesh/entity-engine';

export class EntityEngineAPI {
    constructor(private engine: IEntityEngine) {}

    // ================================================================================
    // 🎯 模型相关API
    // ================================================================================

    //获取所有模型

    getModels(): IEntityModelDelegate[] {
        return this.engine.metaRegistry.models;
    }

    //根据名称获取模型

    getModelByName(name: string): IEntityModelDelegate | undefined {
        return this.engine.metaRegistry.getModel(name);
    }

    //搜索模型

    searchModels(query: string): IEntityModelDelegate[] {
        const lowerQuery = query.toLowerCase();
        return this.getModels().filter(
            (model) =>
                model.name.toLowerCase().includes(lowerQuery) ||
                model.title?.toLowerCase().includes(lowerQuery) ||
                model.description?.toLowerCase().includes(lowerQuery)
        );
    }

    // ================================================================================
    // 🎯 视图相关API
    // ================================================================================

    //获取所有视图 - 增强容错性，返回完整的视图数据

    getViews(): IEntityViewDelegate[] {
        try {
            console.log('[EntityEngineAPI] 开始获取所有视图...');
            const views = this.engine.metaRegistry.views;

            if (!Array.isArray(views)) {
                console.warn('[EntityEngineAPI] metaRegistry.views不是数组:', views);
                return [];
            }

            console.log(`[EntityEngineAPI] 获取到 ${views.length} 个视图委托对象`);

            // 验证每个视图委托对象并获取完整数据
            const validViews = views
                .filter((view, index) => {
                    if (!view) {
                        console.warn(`[EntityEngineAPI] 视图 ${index} 为空`);
                        return false;
                    }

                    if (!view.name || typeof view.name !== 'string') {
                        console.warn(`[EntityEngineAPI] 视图 ${index} 缺少有效的name:`, view);
                        return false;
                    }

                    if (!view.modelName || typeof view.modelName !== 'string') {
                        console.warn(
                            `[EntityEngineAPI] 视图 ${view.name} 缺少有效的modelName:`,
                            view
                        );
                        return false;
                    }

                    return true;
                })
                .map((view) => {
                    try {
                        // 🔑 关键修复：使用toSupplementedView()获取完整的视图数据，包括items
                        const supplementedView = view.toSupplementedView();

                        console.log(`[EntityEngineAPI] 视图 ${view.name} 补充数据:`, {
                            name: supplementedView.name,
                            modelName: supplementedView.modelName,
                            viewType: supplementedView.viewType,
                            itemsCount: supplementedView.items?.length || 0,
                            hasItems: !!supplementedView.items,
                        });

                        return supplementedView;
                    } catch (error) {
                        console.error(
                            `[EntityEngineAPI] 获取视图 ${view.name} 的完整数据失败:`,
                            error
                        );
                        // 如果获取补充数据失败，返回原始委托对象
                        return view;
                    }
                });

            console.log(`[EntityEngineAPI] 验证后有效视图数量: ${validViews.length}`);
            return validViews;
        } catch (error) {
            console.error('[EntityEngineAPI] 获取视图失败:', error);
            return [];
        }
    }

    //根据名称获取视图 - 增强容错性，返回完整的视图数据

    getViewByName(name: string): IEntityViewDelegate | undefined {
        try {
            if (!name || typeof name !== 'string') {
                console.warn('[EntityEngineAPI] getViewByName参数无效:', name);
                return undefined;
            }

            console.log(`[EntityEngineAPI] 获取视图: ${name}`);
            const view = this.engine.metaRegistry.getView(name);

            if (!view) {
                console.log(`[EntityEngineAPI] 未找到视图: ${name}`);
                return undefined;
            }

            // 验证视图委托对象的完整性
            if (!view.name || !view.modelName) {
                console.warn(`[EntityEngineAPI] 视图 ${name} 数据不完整:`, {
                    hasName: !!view.name,
                    hasModelName: !!view.modelName,
                    hasViewType: !!view.viewType,
                });
                return undefined;
            }

            try {
                // 🔑 关键修复：使用toSupplementedView()获取完整的视图数据，包括items
                const supplementedView = view.toSupplementedView();

                console.log(
                    `[EntityEngineAPI] 找到视图: ${supplementedView.name} (model: ${supplementedView.modelName}, type: ${supplementedView.viewType})`,
                    {
                        itemsCount: supplementedView.items?.length || 0,
                        hasItems: !!supplementedView.items,
                    }
                );

                return supplementedView;
            } catch (error) {
                console.error(`[EntityEngineAPI] 获取视图 ${name} 的完整数据失败:`, error);
                // 如果获取补充数据失败，返回原始委托对象
                console.log(
                    `[EntityEngineAPI] 使用原始委托对象: ${view.name} (model: ${view.modelName}, type: ${view.viewType})`
                );
                return view;
            }
        } catch (error) {
            console.error(`[EntityEngineAPI] 获取视图 ${name} 失败:`, error);
            return undefined;
        }
    }

    //根据模型名称获取视图 - 增强容错性

    getViewsByModelName(modelName: string): IEntityViewDelegate[] {
        try {
            if (!modelName || typeof modelName !== 'string') {
                console.warn('[EntityEngineAPI] getViewsByModelName参数无效:', modelName);
                return [];
            }

            console.log(`[EntityEngineAPI] 获取模型 ${modelName} 的所有视图...`);
            const allViews = this.getViews(); // 使用增强的getViews方法

            const modelViews = allViews.filter((view) => {
                if (!view || !view.modelName) {
                    console.warn('[EntityEngineAPI] 发现无效的视图对象:', view);
                    return false;
                }

                const matches = view.modelName === modelName;
                if (matches) {
                    console.log(
                        `[EntityEngineAPI] 找到匹配的视图: ${view.name} (${view.viewType})`
                    );
                }
                return matches;
            });

            console.log(`[EntityEngineAPI] 模型 ${modelName} 有 ${modelViews.length} 个视图`);
            return modelViews;
        } catch (error) {
            console.error(`[EntityEngineAPI] 获取模型 ${modelName} 的视图失败:`, error);
            return [];
        }
    }

    //搜索视图 - 增强容错性

    searchViews(query: string): IEntityViewDelegate[] {
        try {
            if (!query || typeof query !== 'string') {
                console.warn('[EntityEngineAPI] searchViews参数无效:', query);
                return [];
            }

            console.log(`[EntityEngineAPI] 搜索视图: "${query}"`);
            const lowerQuery = query.toLowerCase();
            const allViews = this.getViews(); // 使用增强的getViews方法

            const matchedViews = allViews.filter((view) => {
                if (!view) return false;

                try {
                    const nameMatch = view.name?.toLowerCase().includes(lowerQuery);
                    const titleMatch = view.title?.toLowerCase().includes(lowerQuery);
                    const modelMatch = view.modelName?.toLowerCase().includes(lowerQuery);
                    const typeMatch = view.viewType?.toLowerCase().includes(lowerQuery);

                    return nameMatch || titleMatch || modelMatch || typeMatch;
                } catch (error) {
                    console.warn(`[EntityEngineAPI] 搜索视图 ${view.name} 时出错:`, error);
                    return false;
                }
            });

            console.log(`[EntityEngineAPI] 搜索到 ${matchedViews.length} 个匹配的视图`);
            return matchedViews;
        } catch (error) {
            console.error(`[EntityEngineAPI] 搜索视图失败:`, error);
            return [];
        }
    }

    // ================================================================================
    // 🎯 字段类型相关API
    // ================================================================================

    //获取字段类型信息

    getFieldTypeInfo(type: string) {
        const typer = this.engine.fieldTyperRegistry.getFieldTyper(type);
        if (!typer) return undefined;

        return {
            type: typer.type,
            title: typer.title,
            description: typer.description,
            defaultValue: typer.getDefaultValue({} as any),
            defaultWidget: typer.getDefaultWidgetType('form'),
        };
    }

    //获取所有可用的字段类型

    getAvailableFieldTypes(): string[] {
        return this.engine.fieldTyperRegistry.getFieldTypers().map((typer) => typer.type);
    }

    // ================================================================================
    // 🎯 组件相关API
    // ================================================================================

    //获取所有可用的Widget - 增强容错性

    getAvailableWidgets() {
        console.log('[EntityEngineAPI] 开始获取可用的Widget...');

        try {
            const adapters = this.engine.componentRegistry.getAdapters();
            const widgets: Array<{ value: string; label: string; info?: any }> = [];

            if (!Array.isArray(adapters)) {
                console.warn('[EntityEngineAPI] getAdapters()返回值不是数组:', adapters);
                return [];
            }

            console.log(`[EntityEngineAPI] 找到 ${adapters.length} 个适配器`);

            adapters.forEach((adapter: any, adapterIndex: number) => {
                try {
                    if (!adapter) {
                        console.warn(`[EntityEngineAPI] 适配器 ${adapterIndex} 为空`);
                        return;
                    }

                    console.log(`[EntityEngineAPI] 处理适配器 ${adapterIndex}:`, {
                        suiteName: adapter.suiteName || 'unknown',
                        hasGetWidgets: typeof adapter.getWidgets === 'function',
                        adapterKeys: Object.keys(adapter || {}),
                    });

                    if (typeof adapter.getWidgets === 'function') {
                        const adapterWidgets = adapter.getWidgets();

                        if (!Array.isArray(adapterWidgets)) {
                            console.warn(
                                `[EntityEngineAPI] 适配器 ${adapterIndex} getWidgets()返回值不是数组:`,
                                adapterWidgets
                            );
                            return;
                        }

                        console.log(
                            `[EntityEngineAPI] 适配器 ${adapterIndex} 返回 ${adapterWidgets.length} 个widgets`
                        );

                        adapterWidgets.forEach((widget: any, widgetIndex: number) => {
                            try {
                                if (!widget) {
                                    console.warn(
                                        `[EntityEngineAPI] Widget ${adapterIndex}-${widgetIndex} 为空`
                                    );
                                    return;
                                }

                                // EntityWidget标准结构提取策略
                                let widgetValue: string;
                                let widgetLabel: string;
                                let widgetInfo: any = null;

                                // 策略1: EntityWidget标准结构 - widget.info.widgetName/displayName
                                if (widget.info && typeof widget.info === 'object') {
                                    widgetValue =
                                        widget.info.widgetName ||
                                        `widget-${adapterIndex}-${widgetIndex}`;
                                    widgetLabel =
                                        widget.info.displayName ||
                                        widget.info.widgetName ||
                                        widgetValue;
                                    widgetInfo = widget.info;
                                    console.log(
                                        `[EntityEngineAPI] Widget ${adapterIndex}-${widgetIndex} 使用EntityWidget标准结构:`,
                                        { widgetValue, widgetLabel, widgetInfo }
                                    );
                                }
                                // 策略2: 兼容旧格式 - 直接属性
                                else if (widget.widgetName || widget.name || widget.type) {
                                    widgetValue =
                                        widget.widgetName ||
                                        widget.name ||
                                        widget.type ||
                                        `widget-${adapterIndex}-${widgetIndex}`;
                                    widgetLabel =
                                        widget.displayName ||
                                        widget.title ||
                                        widget.label ||
                                        widgetValue;
                                    widgetInfo = widget;
                                    console.log(
                                        `[EntityEngineAPI] Widget ${adapterIndex}-${widgetIndex} 使用兼容结构:`,
                                        { widgetValue, widgetLabel }
                                    );
                                }
                                // 策略3: 兜底策略
                                else {
                                    // 尝试从对象的各种可能属性中提取
                                    const possibleKeys = Object.keys(widget);
                                    console.log(
                                        `[EntityEngineAPI] Widget ${adapterIndex}-${widgetIndex} 尝试从属性中提取:`,
                                        possibleKeys
                                    );

                                    widgetValue =
                                        widget.id ||
                                        widget.key ||
                                        widget.component ||
                                        `widget-${adapterIndex}-${widgetIndex}`;
                                    widgetLabel =
                                        widget.title ||
                                        widget.label ||
                                        widget.displayName ||
                                        widgetValue;
                                    widgetInfo = widget;

                                    console.log(
                                        `[EntityEngineAPI] Widget ${adapterIndex}-${widgetIndex} 使用兜底策略:`,
                                        { widgetValue, widgetLabel }
                                    );
                                }

                                // 确保value和label都是有效字符串
                                if (typeof widgetValue !== 'string' || widgetValue.trim() === '') {
                                    widgetValue = `widget-${adapterIndex}-${widgetIndex}`;
                                }
                                if (typeof widgetLabel !== 'string' || widgetLabel.trim() === '') {
                                    widgetLabel = widgetValue;
                                }

                                widgets.push({
                                    value: widgetValue,
                                    label: widgetLabel,
                                    info: widgetInfo,
                                });

                                console.log(`[EntityEngineAPI] 成功添加Widget: ${widgetValue}`);
                            } catch (widgetError) {
                                console.error(
                                    `[EntityEngineAPI] 处理Widget ${adapterIndex}-${widgetIndex} 时出错:`,
                                    widgetError,
                                    widget
                                );
                                // 继续处理其他widgets
                            }
                        });
                    } else {
                        console.log(`[EntityEngineAPI] 适配器 ${adapterIndex} 没有getWidgets方法`);
                    }
                } catch (adapterError) {
                    console.error(
                        `[EntityEngineAPI] 处理适配器 ${adapterIndex} 时出错:`,
                        adapterError,
                        adapter
                    );
                    // 继续处理其他适配器
                }
            });

            console.log(
                `[EntityEngineAPI] 最终收集到 ${widgets.length} 个widgets:`,
                widgets.map((w) => ({ value: w.value, label: w.label }))
            );
            return widgets;
        } catch (error) {
            console.error('[EntityEngineAPI] 获取Widgets时发生严重错误:', error);
            return []; // 返回空数组确保不会破坏UI
        }
    }

    //获取所有可用的Renderer

    getAvailableRenderers() {
        const adapters = this.engine.componentRegistry.getAdapters();
        const renderers: any[] = [];

        adapters.forEach((adapter: any) => {
            if (typeof adapter.getRenderers === 'function') {
                const adapterRenderers = adapter.getRenderers();
                if (Array.isArray(adapterRenderers)) {
                    renderers.push(...adapterRenderers);
                }
            }
        });

        return renderers;
    }

    //获取组件套件信息

    getComponentSuites() {
        const adapters = this.engine.componentRegistry.getAdapters();

        return adapters.map((adapter: any) => {
            let widgetCount = 0;
            let rendererCount = 0;

            if (typeof adapter.getWidgets === 'function') {
                const widgets = adapter.getWidgets();
                widgetCount = Array.isArray(widgets) ? widgets.length : 0;
            }

            if (typeof adapter.getRenderers === 'function') {
                const renderers = adapter.getRenderers();
                rendererCount = Array.isArray(renderers) ? renderers.length : 0;
            }

            return {
                name: adapter.suiteName || 'unknown',
                version: adapter.suiteVersion || '1.0.0',
                widgetCount,
                rendererCount,
                description: adapter.description,
            };
        });
    }

    // ================================================================================
    // 🎯 引擎信息API
    // ================================================================================

    //获取引擎基本信息

    getEngineInfo() {
        return {
            version: this.engine.version || '1.0.0',
            modelCount: this.getModels().length,
            viewCount: this.getViews().length,
            widgetCount: this.getAvailableWidgets().length,
            rendererCount: this.getAvailableRenderers().length,
            fieldTyperCount: this.getAvailableFieldTypes().length,
        };
    }

    // ================================================================================
    // 🎯 验证相关API
    // ================================================================================

    //验证模型

    validateModel(modelName: string) {
        const model = this.getModelByName(modelName);
        if (!model) {
            return { isValid: false, error: '模型不存在' };
        }

        // 基本验证
        if (!model.name || !model.fields || model.fields.length === 0) {
            return { isValid: false, error: '模型配置不完整' };
        }

        return { isValid: true };
    }

    //验证视图

    validateView(viewName: string) {
        const view = this.getViewByName(viewName);
        if (!view) {
            return { isValid: false, error: '视图不存在' };
        }

        // 验证关联的模型是否存在
        const model = this.getModelByName(view.modelName);
        if (!model) {
            return { isValid: false, error: '关联的模型不存在' };
        }

        return { isValid: true };
    }
}
