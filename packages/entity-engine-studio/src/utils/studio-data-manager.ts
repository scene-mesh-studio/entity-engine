/**
 * Studio数据管理器 - 解决数据完整性问题
 * 实现双数据源架构：原始数据保护 + 增量编辑
 */

import type { IEntityView, IEntityModel, IEntityField, IEntityViewField } from '../types/entities';

import { deepEqual, deepClone } from './data-utils';

export interface IncrementalChanges {
    // 模型层面的变更
    modelChanges: Partial<IEntityModel>;

    // 视图层面的变更 - 使用Map以支持多个视图
    viewChanges: Map<string, Partial<IEntityView>>;

    // 字段层面的变更
    addedFields: IEntityField[];
    deletedFieldNames: string[];
    fieldChanges: Map<string, Partial<IEntityField>>;

    // 🆕 新增：视图字段配置变更（widget等视图特有的属性）
    viewFieldChanges: Map<string, Map<string, Partial<IEntityViewField>>>;

    // 元数据
    lastModified: number;
    changeCount: number;
}

export interface OriginalData {
    model: IEntityModel | null;
    views: IEntityView[];
    timestamp: number;
    source: 'api' | 'new'; // 标识数据来源
}

export interface RuntimeData {
    model: IEntityModel;
    views: IEntityView[];
    mergedAt: number;
}

/**
 * Studio数据管理器 - 核心类
 */
export class StudioDataManager {
    private _originalData: OriginalData;
    private _incrementalChanges: IncrementalChanges;
    private _runtimeData: RuntimeData | null = null;

    constructor(originalData: OriginalData) {
        this._originalData = deepClone(originalData); // 深拷贝保护原始数据
        this._incrementalChanges = this.createEmptyChanges();
    }

    /**
     * 创建空的增量变更对象
     */
    private createEmptyChanges(): IncrementalChanges {
        return {
            modelChanges: {},
            viewChanges: new Map(),
            addedFields: [],
            deletedFieldNames: [],
            fieldChanges: new Map(),
            viewFieldChanges: new Map(),
            lastModified: Date.now(),
            changeCount: 0,
        };
    }

    /**
     * 获取原始数据（只读）
     */
    get originalData(): Readonly<OriginalData> {
        return this._originalData;
    }

    /**
     * 获取增量变更（只读）
     */
    get incrementalChanges(): Readonly<IncrementalChanges> {
        return this._incrementalChanges;
    }

    /**
     * 获取运行时合并数据
     */
    get runtimeData(): RuntimeData {
        if (!this._runtimeData) {
            this._runtimeData = this.mergeData();

            if (process.env.NODE_ENV === 'development') {
                console.log('🔍 StudioDataManager - 生成运行时数据', {
                    原始数据: this._originalData,
                    增量变更: this._incrementalChanges,
                    运行时数据: this._runtimeData,
                    模型字段详情: this._runtimeData.model.fields?.map((f) => ({
                        名称: f.name,
                        类型: f.type,
                        widget: (f as any).widget,
                    })),
                });
            }
        }
        return this._runtimeData;
    }

    /**
     * 更新模型属性（增量方式）
     */
    updateModel(changes: Partial<IEntityModel>): void {
        // 只记录实际发生的变更
        Object.keys(changes).forEach((key) => {
            const newValue = (changes as any)[key];
            const originalValue = this._originalData.model
                ? (this._originalData.model as any)[key]
                : undefined;

            if (!deepEqual(newValue, originalValue)) {
                (this._incrementalChanges.modelChanges as any)[key] = newValue;
            } else {
                // 如果新值与原始值相同，移除之前的变更记录
                delete (this._incrementalChanges.modelChanges as any)[key];
            }
        });

        this._incrementalChanges.lastModified = Date.now();
        this._incrementalChanges.changeCount++;
        this._runtimeData = null; // 清空缓存，强制重新合并
    }

    /**
     * 🆕 更新视图字段配置（widget等视图特有的属性）
     */
    updateViewField(viewName: string, fieldName: string, changes: Partial<IEntityViewField>): void {
        console.log('🔧 StudioDataManager.updateViewField 被调用', {
            视图名称: viewName,
            字段名称: fieldName,
            变更内容: changes,
        });

        // 获取或创建视图的字段变更映射
        if (!this._incrementalChanges.viewFieldChanges.has(viewName)) {
            this._incrementalChanges.viewFieldChanges.set(viewName, new Map());
        }

        const viewFieldMap = this._incrementalChanges.viewFieldChanges.get(viewName)!;
        const existingChanges = viewFieldMap.get(fieldName) || {};

        // 合并变更
        const mergedChanges = { ...existingChanges, ...changes };

        // 🎯 智能过滤：只保留实际有变化的属性
        const originalView = this._originalData.views.find((v) => v.name === viewName);
        const originalField = originalView?.items?.find((f) => f.name === fieldName);

        const actualChanges: Partial<IEntityViewField> = {};
        let hasActualChanges = false;

        Object.keys(mergedChanges).forEach((key) => {
            const newValue = (mergedChanges as any)[key];
            const originalValue = originalField ? (originalField as any)[key] : undefined;

            if (!deepEqual(newValue, originalValue)) {
                (actualChanges as any)[key] = newValue;
                hasActualChanges = true;
            }
        });

        if (hasActualChanges) {
            viewFieldMap.set(fieldName, actualChanges);
            console.log('✅ updateViewField - 记录视图字段变更', {
                视图名称: viewName,
                字段名称: fieldName,
                变更记录: actualChanges,
            });
        } else {
            viewFieldMap.delete(fieldName);
            console.log('🗑️ updateViewField - 清除视图字段变更记录（无实际变更）', {
                视图名称: viewName,
                字段名称: fieldName,
            });
        }

        // 如果视图的所有字段都没有变更，则删除视图记录
        if (viewFieldMap.size === 0) {
            this._incrementalChanges.viewFieldChanges.delete(viewName);
        }

        this._incrementalChanges.lastModified = Date.now();
        this._incrementalChanges.changeCount++;
        this._runtimeData = null;

        console.log('📈 updateViewField - 更新数据管理器状态', {
            总变更计数: this._incrementalChanges.changeCount,
            视图字段变更映射大小: this._incrementalChanges.viewFieldChanges.size,
            当前视图字段变更: Array.from(this._incrementalChanges.viewFieldChanges.entries()).map(
                ([vName, fieldMap]) => ({
                    视图: vName,
                    字段数量: fieldMap.size,
                    字段变更: Array.from(fieldMap.keys()),
                })
            ),
        });
    }

    /**
     * 更新视图属性（增量方式）- 智能变更检测
     */
    updateView(viewName: string, changes: Partial<IEntityView>): void {
        console.log('🔧 StudioDataManager.updateView 被调用', {
            视图名称: viewName,
            变更内容: changes,
            变更键数量: Object.keys(changes).length,
        });

        const originalView = this._originalData.views.find((v) => v.name === viewName);
        const existingChanges = this._incrementalChanges.viewChanges.get(viewName) || {};

        console.log('🔍 updateView - 比较基准数据', {
            找到原始视图: !!originalView,
            原始视图名称: originalView?.name,
            原始视图类型: originalView?.viewType,
            已有变更数量: Object.keys(existingChanges).length,
        });

        // 合并变更，只保留实际不同的字段，使用智能比较
        const mergedChanges = { ...existingChanges };
        let actualChanges = 0;

        Object.keys(changes).forEach((key) => {
            const newValue = (changes as any)[key];
            const originalValue = originalView ? (originalView as any)[key] : undefined;

            // 🎯 智能比较：对于items数组使用特殊处理
            let isEqual: boolean;
            if (key === 'items' && Array.isArray(newValue) && Array.isArray(originalValue)) {
                // 对items数组使用标准化比较
                const normalizeItemsForComparison = (items: any[]) =>
                    items
                        .map((item) => {
                            const normalized = { ...item };

                            // 移除默认值属性
                            if (normalized.spanCols === 12) delete normalized.spanCols;
                            if (normalized.order === 0) delete normalized.order;
                            if (normalized.title === normalized.name || normalized.title === '') {
                                delete normalized.title;
                            }
                            if (normalized.required === false) delete normalized.required;
                            if (normalized.disabled === false) delete normalized.disabled;
                            if (normalized.readonly === false) delete normalized.readonly;

                            // 移除空字符串属性
                            if (normalized.icon === '') delete normalized.icon;
                            if (normalized.description === '') delete normalized.description;
                            if (normalized.showWhen === '') delete normalized.showWhen;
                            if (normalized.hiddenWhen === '') delete normalized.hiddenWhen;
                            if (normalized.requiredWhen === '') delete normalized.requiredWhen;
                            if (normalized.readOnlyWhen === '') delete normalized.readOnlyWhen;
                            if (normalized.disabledWhen === '') delete normalized.disabledWhen;

                            // 移除 undefined 属性
                            if (normalized.width === undefined) delete normalized.width;
                            if (normalized.flex === undefined) delete normalized.flex;

                            // 标准化 widgetOptions
                            if (
                                normalized.widgetOptions &&
                                Object.keys(normalized.widgetOptions).length === 0
                            ) {
                                delete normalized.widgetOptions;
                            }

                            return normalized;
                        })
                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                const normalizedOriginal = normalizeItemsForComparison(originalValue);
                const normalizedNew = normalizeItemsForComparison(newValue);
                isEqual = deepEqual(normalizedOriginal, normalizedNew);

                // 只在开发环境下输出详细日志
                if (!isEqual && process.env.NODE_ENV === 'development') {
                    console.log('🔍 items数组差异检测', {
                        原始items数量: originalValue.length,
                        新items数量: newValue.length,
                        标准化原始: normalizedOriginal,
                        标准化新值: normalizedNew,
                    });
                }
            } else {
                isEqual = deepEqual(newValue, originalValue);
            }

            // 只在开发环境下输出详细的字段比较日志
            if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 updateView - 字段比较: ${key}`, {
                    原始值: originalValue,
                    新值: newValue,
                    是否相等: isEqual,
                    值类型: typeof newValue,
                });
            }

            if (!isEqual) {
                (mergedChanges as any)[key] = newValue;
                actualChanges++;
            } else {
                delete (mergedChanges as any)[key];
            }
        });

        console.log('📊 updateView - 变更统计', {
            检查的字段数: Object.keys(changes).length,
            实际变更数: actualChanges,
            合并后变更数: Object.keys(mergedChanges).length,
            最终变更内容: mergedChanges,
        });

        if (Object.keys(mergedChanges).length > 0) {
            this._incrementalChanges.viewChanges.set(viewName, mergedChanges);
            console.log('✅ updateView - 记录视图变更', {
                视图名称: viewName,
                变更记录: mergedChanges,
            });

            this._incrementalChanges.lastModified = Date.now();
            this._incrementalChanges.changeCount++;
        } else {
            this._incrementalChanges.viewChanges.delete(viewName);
            console.log('🗑️ updateView - 清除视图变更记录（无实际变更）', {
                视图名称: viewName,
            });
        }

        this._runtimeData = null;

        console.log('📈 updateView - 更新数据管理器状态', {
            总变更计数: this._incrementalChanges.changeCount,
            视图变更映射大小: this._incrementalChanges.viewChanges.size,
            最后修改时间: new Date(this._incrementalChanges.lastModified).toLocaleTimeString(),
        });
    }

    /**
     * 添加字段
     */
    addField(field: IEntityField): void {
        // 检查是否是真正的新字段
        const existsInOriginal = this._originalData.model?.fields?.some(
            (f) => f.name === field.name
        );

        if (!existsInOriginal) {
            // 检查是否已在增量变更中
            const existsInAdded = this._incrementalChanges.addedFields.some(
                (f) => f.name === field.name
            );
            if (!existsInAdded) {
                this._incrementalChanges.addedFields.push(deepClone(field));
            }
        } else {
            // 如果字段在原始数据中存在，这是一个字段修改操作
            this.updateField(field.name, field);
        }

        this._incrementalChanges.lastModified = Date.now();
        this._incrementalChanges.changeCount++;
        this._runtimeData = null;
    }

    /**
     * 更新字段属性（增量方式）
     */
    updateField(fieldName: string, changes: Partial<IEntityField>): void {
        const originalField = this._originalData.model?.fields?.find((f) => f.name === fieldName);
        const existingChanges = this._incrementalChanges.fieldChanges.get(fieldName) || {};

        const mergedChanges = { ...existingChanges };
        Object.keys(changes).forEach((key) => {
            const newValue = (changes as any)[key];
            const originalValue = originalField ? (originalField as any)[key] : undefined;

            if (!deepEqual(newValue, originalValue)) {
                (mergedChanges as any)[key] = newValue;
            } else {
                delete (mergedChanges as any)[key];
            }
        });

        if (Object.keys(mergedChanges).length > 0) {
            this._incrementalChanges.fieldChanges.set(fieldName, mergedChanges);
        } else {
            this._incrementalChanges.fieldChanges.delete(fieldName);
        }

        this._incrementalChanges.lastModified = Date.now();
        this._incrementalChanges.changeCount++;
        this._runtimeData = null;
    }

    /**
     * 删除字段
     */
    deleteField(fieldName: string): void {
        // 检查字段来源
        const existsInOriginal = this._originalData.model?.fields?.some(
            (f) => f.name === fieldName
        );
        const existsInAdded = this._incrementalChanges.addedFields.some(
            (f) => f.name === fieldName
        );

        if (existsInAdded) {
            // 如果是增量添加的字段，直接从添加列表中移除
            this._incrementalChanges.addedFields = this._incrementalChanges.addedFields.filter(
                (f) => f.name !== fieldName
            );
        } else if (existsInOriginal) {
            // 如果是原始字段，标记为删除
            if (!this._incrementalChanges.deletedFieldNames.includes(fieldName)) {
                this._incrementalChanges.deletedFieldNames.push(fieldName);
            }
        }

        // 清理相关的字段变更记录
        this._incrementalChanges.fieldChanges.delete(fieldName);

        this._incrementalChanges.lastModified = Date.now();
        this._incrementalChanges.changeCount++;
        this._runtimeData = null;
    }

    /**
     * 合并原始数据和增量变更，生成运行时数据
     */
    private mergeData(): RuntimeData {
        const mergedModel = this.mergeModel();
        const mergedViews = this.mergeViews();

        return {
            model: mergedModel,
            views: mergedViews,
            mergedAt: Date.now(),
        };
    }

    /**
     * 合并模型数据
     */
    private mergeModel(): IEntityModel {
        const baseModel = this._originalData.model || {
            name: '',
            title: '',
            description: '',
            fields: [],
        };

        // 应用模型层面的变更
        const mergedModel = { ...baseModel, ...this._incrementalChanges.modelChanges };

        // 合并字段：原始字段 + 字段变更 + 新增字段 - 删除字段
        const originalFields = baseModel.fields || [];
        const mergedFields: IEntityField[] = [];

        // 处理原始字段和字段变更
        originalFields.forEach((originalField) => {
            if (!this._incrementalChanges.deletedFieldNames.includes(originalField.name)) {
                const fieldChanges = this._incrementalChanges.fieldChanges.get(originalField.name);

                const mergedField = {
                    ...originalField,
                    ...fieldChanges,
                };

                mergedFields.push(mergedField);
            }
        });

        // 添加新增字段
        mergedFields.push(...this._incrementalChanges.addedFields);

        mergedModel.fields = mergedFields;
        return mergedModel;
    }

    /**
     * 合并视图数据
     */
    private mergeViews(): IEntityView[] {
        const originalViews = this._originalData.views || [];

        return originalViews.map((originalView) => {
            const viewChanges = this._incrementalChanges.viewChanges.get(originalView.name);
            const viewFieldChanges = this._incrementalChanges.viewFieldChanges.get(
                originalView.name
            );

            let mergedView = {
                ...originalView,
                ...viewChanges,
            };

            // 🆕 合并视图字段的变更
            if (viewFieldChanges && viewFieldChanges.size > 0 && mergedView.items) {
                mergedView = {
                    ...mergedView,
                    items: mergedView.items.map((originalField) => {
                        const fieldChanges = viewFieldChanges.get(originalField.name);
                        if (fieldChanges) {
                            return {
                                ...originalField,
                                ...fieldChanges,
                            };
                        }
                        return originalField;
                    }),
                };
            }

            return mergedView;
        });
    }

    /**
     * 检查是否有未保存的变更
     */
    hasUnsavedChanges(): boolean {
        return this._incrementalChanges.changeCount > 0 || this.hasAnyChanges();
    }

    /**
     * 检查是否有任何变更
     */
    private hasAnyChanges(): boolean {
        return (
            Object.keys(this._incrementalChanges.modelChanges).length > 0 ||
            this._incrementalChanges.viewChanges.size > 0 ||
            this._incrementalChanges.addedFields.length > 0 ||
            this._incrementalChanges.deletedFieldNames.length > 0 ||
            this._incrementalChanges.fieldChanges.size > 0 ||
            this._incrementalChanges.viewFieldChanges.size > 0
        );
    }

    /**
     * 重置所有变更
     */
    resetChanges(): void {
        this._incrementalChanges = this.createEmptyChanges();
        this._runtimeData = null;
    }

    /**
     * 导出变更用于保存
     */
    exportChanges(): IncrementalChanges {
        return deepClone(this._incrementalChanges);
    }

    /**
     * 调试：获取变更摘要
     */
    getChangesSummary(): string {
        const summary = [];

        if (Object.keys(this._incrementalChanges.modelChanges).length > 0) {
            summary.push(
                `模型变更: ${Object.keys(this._incrementalChanges.modelChanges).join(', ')}`
            );
        }

        if (this._incrementalChanges.addedFields.length > 0) {
            summary.push(
                `新增字段: ${this._incrementalChanges.addedFields.map((f) => f.name).join(', ')}`
            );
        }

        if (this._incrementalChanges.deletedFieldNames.length > 0) {
            summary.push(`删除字段: ${this._incrementalChanges.deletedFieldNames.join(', ')}`);
        }

        if (this._incrementalChanges.fieldChanges.size > 0) {
            summary.push(
                `字段变更: ${Array.from(this._incrementalChanges.fieldChanges.keys()).join(', ')}`
            );
        }

        if (this._incrementalChanges.viewChanges.size > 0) {
            const viewDetails = Array.from(this._incrementalChanges.viewChanges.entries()).map(
                ([viewName, changes]) => {
                    const changedFields = Object.keys(changes);
                    return `${viewName}(${changedFields.join(',')})`;
                }
            );
            summary.push(`视图变更: ${viewDetails.join(', ')}`);
        }

        // 🆕 新增：视图字段变更摘要
        if (this._incrementalChanges.viewFieldChanges.size > 0) {
            const viewFieldDetails = Array.from(
                this._incrementalChanges.viewFieldChanges.entries()
            ).map(([viewName, fieldMap]) => {
                const fieldDetails = Array.from(fieldMap.entries()).map(([fieldName, changes]) => {
                    const changedProps = Object.keys(changes);
                    return `${fieldName}[${changedProps.join(',')}]`;
                });
                return `${viewName}:{${fieldDetails.join(', ')}}`;
            });
            summary.push(`视图字段变更: ${viewFieldDetails.join(', ')}`);
        }

        return summary.join('\n') || '无变更';
    }

    /**
     * 获取详细的视图变更信息用于API调用
     */
    getViewChangesDetail(): {
        [viewName: string]: { original: IEntityView | null; updated: Partial<IEntityView> };
    } {
        const viewChangesDetail: {
            [viewName: string]: { original: IEntityView | null; updated: Partial<IEntityView> };
        } = {};

        this._incrementalChanges.viewChanges.forEach((changes, viewName) => {
            const originalView = this._originalData.views.find((v) => v.name === viewName);
            viewChangesDetail[viewName] = {
                original: originalView || null,
                updated: changes,
            };
        });

        return viewChangesDetail;
    }
}

/**
 * 工厂函数：从API数据创建数据管理器
 */
export function createStudioDataManagerFromAPI(
    model: IEntityModel | null,
    views: IEntityView[]
): StudioDataManager {
    const originalData: OriginalData = {
        model,
        views,
        timestamp: Date.now(),
        source: 'api',
    };

    return new StudioDataManager(originalData);
}

/**
 * 工厂函数：创建新模型的数据管理器
 */
export function createStudioDataManagerForNew(): StudioDataManager {
    const originalData: OriginalData = {
        model: null,
        views: [],
        timestamp: Date.now(),
        source: 'new',
    };

    return new StudioDataManager(originalData);
}
