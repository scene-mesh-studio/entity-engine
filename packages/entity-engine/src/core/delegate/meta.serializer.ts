import type { ZodTypeAny } from 'zod';
import type { IEntityView, IEntityModel } from '../../types';

import { zodToJsonSchema } from 'zod-to-json-schema';
import { convertJsonSchemaToZod } from 'zod-from-json-schema';

export function serializeFieldSchema(schema?: ZodTypeAny): any {
    if (schema) {
        try {
            return zodToJsonSchema(schema);
        } catch (e) {
            console.error('Failed to serialize Zod schema to JSON schema:', e);
        }
    }
    return undefined;
}

export function deserializeFieldSchema(_data: any): ZodTypeAny | undefined {
    if (_data) {
        try {
            return convertJsonSchemaToZod(_data);
        } catch (e) {
            console.error('Failed to deserialize Zod schema from JSON schema:', e);
        }
    }
    return undefined;
}

// 将 IEntityModel 序列化为 JSON 字符串。
// 注意: Zod schema (field.schema) 不是可序列化对象，这里剔除。
export function serializeEntityModel(model: IEntityModel): any {
    const safe = {
        name: model.name,
        title: model.title,
        description: model.description,
        external: model.external,
        externalConfig: { features: model.externalConfig?.features || [] },
        fields: model.fields.map((field) => ({
            name: field.name,
            title: field.title,
            type: field.type,
            typeOptions: field.typeOptions,
            description: field.description,
            defaultValue: field.defaultValue,
            isRequired: field.isRequired,
            isPrimaryKey: field.isPrimaryKey,
            isUnique: field.isUnique,
            editable: field.editable,
            searchable: field.searchable,
            refModel: field.refModel,
            refField: field.refField,
            order: field.order,
            // 添加 schemaSerialized 字段，保留原字段 schema 以便未来恢复
            schemaSerialized: serializeFieldSchema(field.schema),
        })),
    } as any;
    return safe;
}

// 从 JSON 字符串反序列化为 IEntityModel。遇到结构不合法时返回 undefined。
export function deserializeEntityModel(json: string): IEntityModel | undefined {
    if (!json) return undefined;
    try {
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== 'object') return undefined;
        if (typeof obj.name !== 'string' || typeof obj.title !== 'string') return undefined;
        if (!Array.isArray(obj.fields)) return undefined;
        const fields = obj.fields
            .filter((f: any) => f && typeof f === 'object')
            .map((f: any) => {
                const {
                    name,
                    title,
                    type,
                    typeOptions,
                    description,
                    defaultValue,
                    isRequired,
                    isPrimaryKey,
                    isUnique,
                    editable,
                    searchable,
                    refModel,
                    refField,
                    order,
                    schemaSerialized,
                } = f;
                if (
                    typeof name !== 'string' ||
                    typeof title !== 'string' ||
                    typeof type !== 'string'
                ) {
                    return undefined;
                }
                return {
                    name,
                    title,
                    type,
                    typeOptions,
                    description,
                    defaultValue,
                    isRequired,
                    isPrimaryKey,
                    isUnique,
                    editable,
                    searchable,
                    refModel,
                    refField,
                    order,
                    schema: deserializeFieldSchema(schemaSerialized),
                };
            })
            .filter(Boolean);
        const model: IEntityModel = {
            name: obj.name,
            title: obj.title,
            external: obj.external,
            externalConfig: obj.externalConfig,
            description: typeof obj.description === 'string' ? obj.description : undefined,
            fields: fields as any,
        };
        return model;
    } catch {
        return undefined;
    }
}

export function serializeEntityView(view: IEntityView): any {
    if (!view) return undefined;
    const VERSION = 1; // 当前视图序列化结构版本

    const cloneField = (field: any): any => {
        if (!field || typeof field !== 'object') return undefined;
        const {
            name,
            title,
            description,
            icon,
            widget,
            widgetOptions,
            width,
            flex,
            spanCols,
            order,
            fields,
            hiddenWhen,
            showWhen,
            readOnlyWhen,
            disabledWhen,
            requiredWhen,
            referenceView,
            referenceComp,
        } = field;
        if (typeof name !== 'string') return undefined;
        const safe: any = {
            name,
            title,
            description,
            icon,
            widget,
            widgetOptions: widgetOptions ? JSON.parse(JSON.stringify(widgetOptions)) : undefined,
            width,
            flex,
            spanCols,
            order,
            hiddenWhen,
            showWhen,
            readOnlyWhen,
            disabledWhen,
            requiredWhen,
            referenceView,
            referenceComp,
        };
        if (Array.isArray(fields)) {
            const child = fields.map((f) => cloneField(f)).filter(Boolean);
            if (child.length > 0) safe.fields = child;
        }
        return safe;
    };

    const {
        name,
        title,
        description,
        modelName,
        viewType,
        viewOptions,
        items,
        hilites,
        canEdit,
        canNew,
        canDelete,
        density,
    } = view;
    if (
        typeof name !== 'string' ||
        typeof title !== 'string' ||
        typeof modelName !== 'string' ||
        typeof viewType !== 'string'
    ) {
        throw new Error('Invalid IEntityView: missing required string fields');
    }
    const safeItems = Array.isArray(items) ? items.map((it) => cloneField(it)).filter(Boolean) : [];
    const safe: any = {
        __viewSerializerVersion: VERSION,
        name,
        title,
        description,
        modelName,
        viewType,
        viewOptions: viewOptions ? JSON.parse(JSON.stringify(viewOptions)) : undefined,
        items: safeItems,
        hilites: Array.isArray(hilites)
            ? hilites
                  .filter((h) => h && typeof h === 'object' && typeof h.when === 'string')
                  .map((h) => ({ when: h.when, color: h.color }))
            : undefined,
        canEdit,
        canNew,
        canDelete,
        density,
    };
    return safe;
}

export function deserializeEntityView(json: string): IEntityView | undefined {
    if (!json) return undefined;
    try {
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== 'object') return undefined;
        // 版本向前兼容：当前序列化版本为 1（见 serializeEntityView）。
        // 未来如果出现更高版本，可在此处做差异适配；暂时仅校验是数字或缺省。
        const {
            name,
            title,
            description,
            modelName,
            viewType,
            viewOptions,
            items,
            hilites,
            canEdit,
            canNew,
            canDelete,
            density,
        } = obj as any;
        if (
            typeof name !== 'string' ||
            typeof title !== 'string' ||
            typeof modelName !== 'string' ||
            typeof viewType !== 'string'
        ) {
            return undefined;
        }
        const reviveField = (field: any): any => {
            if (!field || typeof field !== 'object') return undefined;
            if (typeof field.name !== 'string') return undefined;
            const f: any = {
                name: field.name,
                title: typeof field.title === 'string' ? field.title : undefined,
                description: typeof field.description === 'string' ? field.description : undefined,
                icon: typeof field.icon === 'string' ? field.icon : undefined,
                widget: typeof field.widget === 'string' ? field.widget : undefined,
                widgetOptions:
                    field.widgetOptions && typeof field.widgetOptions === 'object'
                        ? field.widgetOptions
                        : undefined,
                width: typeof field.width === 'number' ? field.width : undefined,
                flex: field.flex === 0 || field.flex === 1 ? field.flex : undefined,
                spanCols: typeof field.spanCols === 'number' ? field.spanCols : undefined,
                order: typeof field.order === 'number' ? field.order : undefined,
                hiddenWhen: typeof field.hiddenWhen === 'string' ? field.hiddenWhen : undefined,
                showWhen: typeof field.showWhen === 'string' ? field.showWhen : undefined,
                readOnlyWhen:
                    typeof field.readOnlyWhen === 'string' ? field.readOnlyWhen : undefined,
                disabledWhen:
                    typeof field.disabledWhen === 'string' ? field.disabledWhen : undefined,
                requiredWhen:
                    typeof field.requiredWhen === 'string' ? field.requiredWhen : undefined,
                referenceView:
                    field.referenceView && typeof field.referenceView === 'object'
                        ? field.referenceView
                        : undefined,
                referenceComp:
                    field.referenceComp && typeof field.referenceComp === 'object'
                        ? field.referenceComp
                        : undefined,
            };
            if (Array.isArray(field.fields)) {
                const child = field.fields.map((c: any) => reviveField(c)).filter(Boolean);
                if (child.length > 0) f.fields = child;
            }
            return f;
        };
        const safeItems = Array.isArray(items)
            ? items.map((it: any) => reviveField(it)).filter(Boolean)
            : [];
        const safe: IEntityView = {
            name,
            title,
            description: typeof description === 'string' ? description : undefined,
            modelName,
            viewType,
            viewOptions: viewOptions && typeof viewOptions === 'object' ? viewOptions : undefined,
            items: safeItems,
            hilites: Array.isArray(hilites)
                ? hilites
                      .filter((h: any) => h && typeof h.when === 'string')
                      .map((h: any) => ({ when: h.when, color: h.color }))
                : undefined,
            canEdit: typeof canEdit === 'boolean' ? canEdit : undefined,
            canNew: typeof canNew === 'boolean' ? canNew : undefined,
            canDelete: typeof canDelete === 'boolean' ? canDelete : undefined,
            density:
                density === 'small' || density === 'medium' || density === 'large'
                    ? density
                    : undefined,
        };
        return safe;
    } catch {
        return undefined;
    }
}
