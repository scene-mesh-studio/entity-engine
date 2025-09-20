/**
 * 统一数据适配器 - 整合API数据适配和数据源适配
 * 解决API数据源(schemaSerialized) vs EntityEngine数据源(schema)的冲突
 */

import type { IEntityField } from '@scenemesh/entity-engine';
import type { IEntityView, IEntityViewField, ExtendedEntityField } from '../types/entities';

export type DataSourceType = 'api' | 'entity-engine';

// ==================== 数据源检测与适配 ====================

/**
 * 检测数据来源类型
 */
export function detectDataSource(field: any): DataSourceType {
    // 如果包含 schemaSerialized 且没有 Zod schema，则为API数据源
    if (field.schemaSerialized && !field.schema) {
        return 'api';
    }
    // 如果包含 Zod schema 对象，则为entity-engine数据源
    if (field.schema && typeof field.schema === 'object' && field.schema._def) {
        return 'entity-engine';
    }
    // 默认假设为API数据源
    return 'api';
}

/**
 * API数据源字段转换器
 * 专门处理包含 schemaSerialized 的API数据
 */
export function convertAPIField(apiField: any): ExtendedEntityField {
    console.log('🌐 [DataAdapter] 转换API字段:', apiField.name);

    const result: ExtendedEntityField = {
        name: apiField.name,
        title: apiField.title || apiField.name,
        type: apiField.type,
        // 🔑 关键：保持API数据的原始结构，只添加API中存在的字段
        ...(apiField.description !== undefined && { description: apiField.description }),
        ...(apiField.typeOptions !== undefined && { typeOptions: apiField.typeOptions }),
        ...(apiField.defaultValue !== undefined && { defaultValue: apiField.defaultValue }),
        ...(apiField.isRequired !== undefined && { isRequired: Boolean(apiField.isRequired) }),
        ...(apiField.isPrimaryKey !== undefined && {
            isPrimaryKey: Boolean(apiField.isPrimaryKey),
        }),
        ...(apiField.isUnique !== undefined && { isUnique: Boolean(apiField.isUnique) }),
        ...(apiField.editable !== undefined && { editable: Boolean(apiField.editable) }),
        ...(apiField.searchable !== undefined && { searchable: Boolean(apiField.searchable) }),
        ...(apiField.refModel !== undefined && { refModel: apiField.refModel }),
        ...(apiField.refField !== undefined && { refField: apiField.refField }),
        ...(apiField.order !== undefined && { order: apiField.order }),
        // 🎯 API特有：schemaSerialized (JSON Schema)
        ...(apiField.schemaSerialized !== undefined && {
            schemaSerialized: apiField.schemaSerialized,
        }),
    };

    console.log(`✅ [DataAdapter] API字段转换完成: ${result.name}`, {
        hasSchemaSerialized: !!result.schemaSerialized,
        hasTypeOptions: !!result.typeOptions,
        hasDescription: !!result.description,
    });

    return result;
}

/**
 * EntityEngine数据源字段转换器
 * 专门处理包含 Zod schema 的EntityEngine数据
 */
export function convertEntityEngineField(engineField: IEntityField): ExtendedEntityField {
    console.log('🔧 [DataAdapter] 转换EntityEngine字段:', engineField.name);

    const result: ExtendedEntityField = {
        name: engineField.name,
        title: engineField.title,
        type: engineField.type,
        // 🔑 EntityEngine核心包支持的所有字段
        ...(engineField.description !== undefined && { description: engineField.description }),
        ...(engineField.typeOptions !== undefined && { typeOptions: engineField.typeOptions }),
        ...(engineField.defaultValue !== undefined && { defaultValue: engineField.defaultValue }),
        ...(engineField.isRequired !== undefined && {
            isRequired: Boolean(engineField.isRequired),
        }),
        ...(engineField.isPrimaryKey !== undefined && {
            isPrimaryKey: Boolean(engineField.isPrimaryKey),
        }),
        ...(engineField.isUnique !== undefined && { isUnique: Boolean(engineField.isUnique) }),
        ...(engineField.editable !== undefined && { editable: Boolean(engineField.editable) }),
        ...(engineField.searchable !== undefined && {
            searchable: Boolean(engineField.searchable),
        }),
        ...(engineField.refModel !== undefined && { refModel: engineField.refModel }),
        ...(engineField.refField !== undefined && { refField: engineField.refField }),
        ...(engineField.order !== undefined && { order: engineField.order }),
        // 🎯 EntityEngine特有：Zod schema
        ...(engineField.schema !== undefined && { schema: engineField.schema }),
    };

    console.log(`✅ [DataAdapter] EntityEngine字段转换完成: ${result.name}`, {
        hasSchema: !!result.schema,
        hasTypeOptions: !!result.typeOptions,
        hasDescription: !!result.description,
    });

    return result;
}

// ==================== API视图数据适配 ====================

/**
 * 标准化API视图数据 - 基于真实API结构
 */
export function normalizeAPIViewData(rawApiView: any): IEntityView {
    if (!rawApiView || typeof rawApiView !== 'object') {
        console.warn('[DataAdapter] 无效的API视图数据:', rawApiView);
        return rawApiView;
    }

    // 🎯 关键：直接保留API的完整结构，只处理必要的标准化
    const normalizedView: IEntityView = {
        name: rawApiView.name,
        title: rawApiView.title || rawApiView.name,
        description: rawApiView.description,
        modelName: rawApiView.modelName,
        viewType: rawApiView.viewType, // 🔑 关键：保留viewType
        density: rawApiView.density,
        viewOptions: rawApiView.viewOptions || {},
        // 🔑 关键：处理items数组，保持完整的widget信息
        items: normalizeViewItemsFlat(rawApiView.items || []),
        // 保留其他可能的API字段
        ...(rawApiView.canEdit !== undefined && { canEdit: rawApiView.canEdit }),
        ...(rawApiView.canNew !== undefined && { canNew: rawApiView.canNew }),
        ...(rawApiView.canDelete !== undefined && { canDelete: rawApiView.canDelete }),
    };

    return normalizedView;
}

/**
 * 处理视图项 - 保持嵌套结构完整
 */
function normalizeViewItemsFlat(rawItems: any[]): IEntityViewField[] {
    if (!Array.isArray(rawItems)) {
        console.warn('[DataAdapter] items不是数组:', rawItems);
        return [];
    }

    console.log(`[DataAdapter] 开始处理 ${rawItems.length} 个顶级字段`);

    const processItem = (item: any, level = 0): IEntityViewField | null => {
        if (!item || typeof item !== 'object') {
            console.warn(`[DataAdapter] 跳过无效item (层级${level}):`, item);
            return null;
        }

        // 🔑 核心：创建标准化字段，完整保留所有API属性
        const normalizedField: IEntityViewField = {
            name: item.name,
            title: item.title || item.name,
            // 🎯 确保widget信息被完整保留
            ...(item.widget && { widget: item.widget }),
            ...(item.widgetOptions && { widgetOptions: item.widgetOptions }),
            // 布局属性
            ...(item.spanCols !== undefined && { spanCols: item.spanCols }),
            ...(item.width !== undefined && { width: item.width }),
            ...(item.flex !== undefined && { flex: item.flex }),
            ...(item.order !== undefined && { order: item.order }),
            // 显示控制
            ...(item.icon && { icon: item.icon }),
            ...(item.description && { description: item.description }),
            // 条件逻辑
            ...(item.showWhen && { showWhen: item.showWhen }),
            ...(item.hiddenWhen && { hiddenWhen: item.hiddenWhen }),
            ...(item.requiredWhen && { requiredWhen: item.requiredWhen }),
            ...(item.readOnlyWhen && { readOnlyWhen: item.readOnlyWhen }),
            ...(item.disabledWhen && { disabledWhen: item.disabledWhen }),
        };

        // 🔑 关键修复：递归处理嵌套fields，保持层级结构
        if (item.fields && Array.isArray(item.fields)) {
            console.log(
                `[DataAdapter] 字段 "${item.name}" (层级${level}) 包含 ${item.fields.length} 个嵌套字段`
            );

            const processedNestedFields = item.fields
                .map((subItem: any) => processItem(subItem, level + 1))
                .filter((field: IEntityViewField | null) => field !== null) as IEntityViewField[];

            // 🔑 保持嵌套结构：将处理后的嵌套字段赋值给fields属性
            normalizedField.fields = processedNestedFields;

            console.log(
                `[DataAdapter] 字段 "${item.name}" 嵌套处理完成，保留 ${processedNestedFields.length} 个嵌套字段`
            );
        }

        return normalizedField;
    };

    // 只处理顶级items，保持嵌套结构
    const result = rawItems
        .map((item, index) => processItem(item, 0))
        .filter((field) => field !== null) as IEntityViewField[];

    console.log(`[DataAdapter] 视图项处理完成，共 ${result.length} 个有效字段`);
    return result;
}

/**
 * 验证API视图数据完整性
 */
export function validateAPIViewData(rawApiView: any): boolean {
    if (!rawApiView || typeof rawApiView !== 'object') {
        console.warn('[DataAdapter] API视图数据无效:', rawApiView);
        return false;
    }

    // 检查必要字段
    if (!rawApiView.name) {
        console.warn('[DataAdapter] API视图缺少name字段');
        return false;
    }

    if (!rawApiView.modelName) {
        console.warn('[DataAdapter] API视图缺少modelName字段');
        return false;
    }

    // 检查items数组
    if (rawApiView.items && !Array.isArray(rawApiView.items)) {
        console.warn('[DataAdapter] API视图items字段不是数组');
        return false;
    }

    return true;
}

/**
 * 标准化API视图数据数组
 */
export function normalizeAPIViewsData(rawApiViews: any[]): IEntityView[] {
    if (!Array.isArray(rawApiViews)) {
        console.warn('[DataAdapter] API视图数据不是数组:', rawApiViews);
        return [];
    }

    console.log(`[DataAdapter] 开始处理 ${rawApiViews.length} 个API视图`);

    const normalizedViews = rawApiViews
        .map((rawView, index) => {
            if (!validateAPIViewData(rawView)) {
                console.warn(`[DataAdapter] 跳过无效的API视图 [${index}]:`, rawView);
                return null;
            }

            try {
                const normalizedView = normalizeAPIViewData(rawView);
                console.log(`[DataAdapter] 视图 "${rawView.name}" 标准化完成`);
                return normalizedView;
            } catch (error) {
                console.error(`[DataAdapter] 视图 "${rawView.name}" 标准化失败:`, error);
                return null;
            }
        })
        .filter((view): view is IEntityView => view !== null);

    console.log(`[DataAdapter] API视图标准化完成，共 ${normalizedViews.length} 个有效视图`);
    return normalizedViews;
}
