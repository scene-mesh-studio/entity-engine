import type { PrismaClient } from '@prisma/client';
import type { EntityAction, EntityActionResult, IEntityEnginePrimitive } from '../../../core';

import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

import { QueryOperator } from '../../../types';
import { getFullTree, getDeepEntityFirstLevelFilter } from '../routers/utils/enhanced-query';
import {
    externalfindObjectLogic,
    externalListObjectsLogic,
    externalFindGroupedObjectsLogic,
} from './mode.external.service';

/**
 * 定义服务函数所需的上下文（Context）类型
 */
export interface ApiContext {
    db: PrismaClient;
    engine: IEntityEnginePrimitive;
}

export const findPlainConfigInputSchema = z.object({
    modelName: z.string().optional(),
    viewName: z.string().optional(),
    configVersion: z.string().optional(),
});

export const findObjectInputSchema = z.object({ id: z.string(), modelName: z.string().optional() });

export const deleteObjectInputSchema = z.object({ id: z.string() });

export const deleteObjectsInputSchema = z.object({
    ids: z.array(z.string()),
});

export const listObjectsInputSchema = z.object({
    modelName: z.string(),
    // 注意：REST API 的查询参数是字符串，使用 coerce 可以在验证时自动转换为数字
    pagination: z
        .object({
            page: z.coerce.number().int().positive().optional(),
            pageSize: z.coerce.number().int().positive().optional(),
        })
        .optional(),
    reference: z
        .object({
            fromModelName: z.string(),
            fromFieldName: z.string(),
            fromObjectId: z.string(),
        })
        .optional(),
    filter: z.record(z.string(), z.unknown()).optional(),
    withAllReferences: z.boolean().optional(),
});

export const treeObjectsInputSchema = z.object({
    modelName: z.string(),
    fieldName: z.string(),
    rootObjectId: z.string().optional(),
});

export const listWithChildrenInputSchema = z.object({
    modelName: z.string(),
    filter: z.record(z.string(), z.unknown()).optional(),
    pagination: z
        .object({
            page: z.coerce.number().int().positive().optional(),
            pageSize: z.coerce.number().int().positive().optional(),
        })
        .optional(),
    childFieldName: z.string(),
});

export const findOneWithReferencesInputSchema = z.object({
    objectId: z.string(),
    includeFieldNames: z.array(z.string()).optional(),
});

export const countObjectsInputSchema = z.object({
    modelName: z.string(),
    reference: z
        .object({
            fromModelName: z.string(),
            fromFieldName: z.string(),
            fromObjectId: z.string(),
        })
        .optional(),
});

export const createObjectInputSchema = z.object({
    id: z.string().optional(),
    modelName: z.string().min(3),
    values: z.record(z.string(), z.any()),
    isDeleted: z.boolean().optional(),
    reference: z
        .object({
            fromModelName: z.string(),
            fromFieldName: z.string(),
            fromObjectId: z.string(),
        })
        .optional(),
});

export const updateObjectInputSchema = z.object({
    id: z.string(),
    values: z.record(z.string(), z.any()),
});

export const updateValuesInputSchema = z.object({
    id: z.string(),
    values: z.record(z.string(), z.any()),
});

export const findObjectReferenceOOInputSchema = z.object({
    fromModelName: z.string().min(3),
    fromFieldName: z.string().min(3),
    fromObjectId: z.string().min(3),
    toModelName: z.string().min(3),
});

export const findObjectReferencesOMInputSchema = z.object({
    fromModelName: z.string().min(3),
    fromFieldName: z.string().min(3),
    fromObjectId: z.string().min(3),
    toModelName: z.string().min(3),
});

export const findObjectReferencesCountOMInputSchema = z.object({
    fromModelName: z.string().min(3),
    fromFieldName: z.string().min(3),
    fromObjectId: z.string(),
    toModelName: z.string().min(3),
});

export const createObjectReferenceInputSchema = z.object({
    fromModelName: z.string().min(3),
    fromFieldName: z.string().min(3),
    fromObjectId: z.string().min(3),
    toModelName: z.string().min(3),
    toObjectId: z.string().min(3),
});

export const createObjectReferencesInputSchema = z.object({
    fromModelName: z.string().min(3),
    fromFieldName: z.string().min(3),
    fromObjectId: z.string().min(3),
    toModelName: z.string().min(3),
    toObjectIds: z.array(z.string().min(3)),
});

export const deleteObjectReferenceInputSchema = z.object({
    fromModelName: z.string().min(3),
    fromFieldName: z.string().min(3),
    fromObjectId: z.string().min(3),
    toModelName: z.string().min(3),
    toObjectId: z.string().min(3),
});

export const deleteObjectReferencesInputSchema = z.object({
    fromModelName: z.string().min(3),
    fromFieldName: z.string().min(3),
    fromObjectId: z.string().min(3),
    toModelName: z.string().min(3),
    toObjectIds: z.array(z.string().min(3)),
});

export const findGroupedObjectsInputSchema = z.object({
    modelName: z.string(),
    groupBy: z.union([
        z.string(),
        z.object({
            field: z.string(),
            format: z.object({ type: z.enum(['time', 'range']), pattern: z.string() }).optional(),
            withoutDetails: z.boolean().optional(),
        }),
    ]),
    query: z
        .object({
            filter: z
                .union([
                    // 支持简单的键值对过滤
                    z.record(z.string(), z.unknown()),
                    // 支持复杂的查询条件
                    z.object({
                        field: z.string(),
                        operator: z.string(),
                        value: z.unknown(),
                        value2: z.unknown().optional(),
                    }),
                    // 支持复合条件
                    z.object({
                        and: z.array(z.any()).optional(),
                        or: z.array(z.any()).optional(),
                        not: z.any().optional(),
                    }),
                ])
                .optional(),
        })
        .optional(),
    reference: z
        .object({
            fromModelName: z.string(),
            fromFieldName: z.string(),
            fromObjectId: z.string(),
        })
        .optional(),
    aggregations: z.record(z.string(), z.enum(['count', 'sum', 'avg', 'min', 'max'])).optional(),
    groupSortBy: z.record(z.string(), z.enum(['asc', 'desc'])).optional(),
    objectSortBy: z.record(z.string(), z.enum(['asc', 'desc'])).optional(),
});

export const handleActionInputSchema = z.object({
    name: z.string(),
    modelName: z.string().optional(),
    objectId: z.string().optional(),
    parameter: z.record(z.string(), z.any()).optional(),
});

// --- 服务函数定义 ---

// --- Read Operations ---

export async function handleActionLogic(
    ctx: ApiContext,
    input: { name: string; modelName?: string; objectId?: string; parameter?: Record<string, any> }
) {
    const { name, modelName, objectId, parameter } = input;
    const actionRegistry = ctx.engine.actionRegistry;
    const handler = actionRegistry.getActionHandler(name);
    if (handler) {
        const context = {
            engine: ctx.engine,
            db: ctx.db,
        };
        const action: EntityAction = {
            name,
            modelName,
            objectId,
            parameter,
        };
        try {
            const result = await handler.handle(action, context);
            return result;
        } catch (e) {
            const errResult: EntityActionResult = {
                success: false,
                message: e instanceof Error ? e.message : 'Unknown error',
                payload: {
                    type: 'error',
                },
            };
            return errResult;
        }
    } else {
        const errResult: EntityActionResult = {
            success: false,
            message: 'Action Handler not found',
            payload: {
                type: 'error',
            },
        };
        return errResult;
    }
}

export async function findPlainConfigLogic(
    ctx: ApiContext,
    input: { modelName?: string; viewName?: string; configVersion?: string }
) {
    const { modelName, viewName, configVersion } = input;
    const models = [];
    const views = [];
    const metaRegistry = ctx.engine.metaRegistry;
    if (modelName) {
        const m = metaRegistry.getModel(modelName);
        if (m) {
            models.push(metaRegistry.toPlainModelObject(m));
        }
    } else if (viewName) {
        const v = metaRegistry.getView(viewName);
        if (v) {
            views.push(metaRegistry.toPlainViewObject(v));
        }
    } else {
        for (const model of metaRegistry.models) {
            models.push(metaRegistry.toPlainModelObject(model));
        }
        for (const view of metaRegistry.views) {
            views.push(metaRegistry.toPlainViewObject(view));
        }
        // models.push(...metaRegistry.models.map((m) => metaRegistry.toPlainModelObject(m)));
        // views.push(...metaRegistry.views.map((v) => metaRegistry.toPlainViewObject(v)));
    }

    return {
        models,
        views,
    };
}

export async function findObjectLogic(ctx: ApiContext, input: { id: string; modelName?: string }) {
    if (input.modelName) {
        const model = ctx.engine.metaRegistry.getModel(input.modelName);
        if (model?.external) {
            return await externalfindObjectLogic(ctx.engine, {
                id: input.id,
                modelName: input.modelName,
            });
        }
    }

    return ctx.db.entityObject.findFirst({
        where: { id: input.id },
    });
}

export async function listObjectsLogic(
    ctx: ApiContext,
    input: {
        modelName: string;
        pagination?: { page?: number; pageSize?: number };
        reference?: {
            fromModelName: string;
            fromFieldName: string;
            fromObjectId: string;
        };
        filter?: Record<string, unknown>;
        withAllReferences?: boolean;
    }
) {
    const { modelName, pagination, reference, filter } = input;
    const filterQuery = filter ? convertFilterToPrismaQuery(filter as any) : [];
    const skip = ((pagination?.page ?? 1) - 1) * (pagination?.pageSize ?? 10);
    const take = pagination?.pageSize ?? 10;
    const whereClause = { isDeleted: false, AND: filterQuery };

    const model = ctx.engine.metaRegistry.getModel(modelName);
    if (model?.external) {
        return await externalListObjectsLogic(ctx.engine, input);
    }

    if (reference) {
        const refWhere = {
            fromModelName: reference.fromModelName,
            fromFieldName: reference.fromFieldName,
            fromObjectId: reference.fromObjectId,
            toModelName: modelName,
            toObject: whereClause,
        };
        const [refs, cnt] = await ctx.db.$transaction([
            ctx.db.entityObjectReference.findMany({
                where: refWhere,
                include: { toObject: true },
                skip,
                take,
            }),
            ctx.db.entityObjectReference.count({ where: refWhere }),
        ]);
        if (!input.withAllReferences) {
            return { count: cnt, data: refs?.map((ref: any) => ref.toObject) ?? [] };
        } else {
            const data = [];
            if (refs && refs.length > 0) {
                for (const ref of refs) {
                    const wr = await findOneWithReferencesLogic(ctx, { objectId: ref.toObject.id });
                    if (wr) {
                        data.push(wr);
                    }
                }
            }
            return { count: cnt, data };
        }
    } else {
        const finalWhere = { modelName, ...whereClause };
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> finalWhere', finalWhere);
        const [objects, cnt] = await ctx.db.$transaction([
            ctx.db.entityObject.findMany({ where: finalWhere, skip, take }),
            ctx.db.entityObject.count({ where: finalWhere }),
        ]);
        if (!input.withAllReferences) {
            return { count: cnt, data: objects ?? [] };
        } else {
            const data = [];
            if (objects && objects.length > 0) {
                for (const obj of objects) {
                    const wr = await findOneWithReferencesLogic(ctx, { objectId: obj.id });
                    if (wr) {
                        data.push(wr);
                    }
                }
            }
            return { count: cnt, data };
        }
    }
}

export async function treeObjectsLogic(
    ctx: ApiContext,
    input: { modelName: string; fieldName: string; rootObjectId?: string }
) {
    const { modelName, fieldName, rootObjectId } = input;
    return getFullTree(ctx.db, modelName, fieldName, rootObjectId);
}

export async function listWithChildrenLogic(
    ctx: ApiContext,
    input: {
        modelName: string;
        filter?: Record<string, unknown>;
        pagination?: { page?: number; pageSize?: number };
        childFieldName: string;
    }
) {
    const { modelName, pagination, filter, childFieldName } = input;
    const parentModelDef = ctx.engine.metaRegistry.getModel(modelName);
    const childFieldDef = parentModelDef?.fields.find((f) => f.name === childFieldName);
    const childModelName = childFieldDef?.refModel;

    if (!childModelName) {
        throw new Error(
            `Field '${childFieldName}' on model '${modelName}' is not a valid reference field.`
        );
    }

    const filterQuery = filter ? convertFilterToPrismaQuery(filter as any) : [];
    const whereClause = { modelName, isDeleted: false, AND: filterQuery };

    const parentObjects = await ctx.db.entityObject.findMany({
        where: whereClause,
        skip: ((pagination?.page ?? 1) - 1) * (pagination?.pageSize ?? 10),
        take: pagination?.pageSize ?? 10,
    });

    const totalCount = await ctx.db.entityObject.count({ where: whereClause });
    if (parentObjects.length === 0) return { count: 0, data: [] };

    const parentIds = parentObjects.map((p: any) => p.id);
    const references = await ctx.db.entityObjectReference.findMany({
        where: {
            fromModelName: modelName,
            fromFieldName: childFieldName,
            fromObjectId: { in: parentIds },
            toModelName: childModelName,
        },
        include: { toObject: true },
    });

    const childrenMap = new Map<string, any[]>();
    for (const ref of references as any[]) {
        if (ref.toObject) {
            if (!childrenMap.has(ref.fromObjectId)) childrenMap.set(ref.fromObjectId, []);
            childrenMap.get(ref.fromObjectId)?.push(ref.toObject);
        }
    }

    const resultData = parentObjects.map((parent: any) => ({
        ...parent,
        values: {
            ...(parent.values as object),
            [childFieldName]: childrenMap.get(parent.id) || [],
        },
    }));

    return { count: totalCount, data: resultData };
}

export async function findOneWithReferencesLogic(
    ctx: ApiContext,
    input: { objectId: string; includeFieldNames?: string[] }
) {
    const { objectId, includeFieldNames } = input;
    return getDeepEntityFirstLevelFilter(ctx.db, objectId, includeFieldNames);
}

export async function countObjectsLogic(
    ctx: ApiContext,
    input: {
        modelName: string;
        reference?: {
            fromModelName: string;
            fromFieldName: string;
            fromObjectId: string;
        };
    }
) {
    const { modelName, reference } = input;
    if (reference) {
        return ctx.db.entityObjectReference.count({
            where: {
                fromModelName: reference.fromModelName,
                fromFieldName: reference.fromFieldName,
                fromObjectId: reference.fromObjectId,
                toModelName: modelName,
                toObject: { isDeleted: false },
            },
        });
    } else {
        return ctx.db.entityObject.count({
            where: { modelName, isDeleted: false },
        });
    }
}

// --- Write Operations ---

export async function createObjectLogic(
    ctx: ApiContext,
    input: {
        id?: string;
        modelName: string;
        values: Record<string, any>;
        isDeleted?: boolean;
        reference?: {
            fromModelName: string;
            fromFieldName: string;
            fromObjectId: string;
        };
    }
) {
    const objId = input.id || createId();
    const createObjectPromise = ctx.db.entityObject.create({
        data: {
            id: objId,
            modelName: input.modelName,
            values: input.values,
            isDeleted: input.isDeleted ?? false,
        },
    });

    if (!input.reference) {
        const obj = await createObjectPromise;
        if (obj) {
            await updateToOneFieldReferences(obj.id, ctx.engine, obj.modelName, obj.values, ctx.db);
        }
        return obj;
    }

    const createReferencePromise = ctx.db.entityObjectReference.create({
        data: {
            fromModelName: input.reference.fromModelName,
            fromFieldName: input.reference.fromFieldName,
            fromObjectId: input.reference.fromObjectId,
            toModelName: input.modelName,
            toObjectId: objId,
        },
    });

    const transactionResult = await ctx.db.$transaction([
        createObjectPromise,
        createReferencePromise,
    ]);
    if (transactionResult[0]) {
        const obj = transactionResult[0];
        await updateToOneFieldReferences(obj.id, ctx.engine, obj.modelName, obj.values, ctx.db);
    }
    return transactionResult[0];
}

export async function deleteObjectLogic(ctx: ApiContext, input: { id: string }) {
    const [refCount, obj] = await ctx.db.$transaction([
        ctx.db.entityObjectReference.deleteMany({
            where: { OR: [{ toObjectId: input.id }, { fromObjectId: input.id }] },
        }),
        ctx.db.entityObject.delete({ where: { id: input.id } }),
    ]);
    return !!(refCount || obj);
}

export async function deleteObjectsLogic(ctx: ApiContext, input: { ids: string[] }) {
    const [refCount, srefCount, objCount] = await ctx.db.$transaction([
        ctx.db.entityObjectReference.deleteMany({
            where: { OR: input.ids.map((id) => ({ toObjectId: id })) },
        }),
        ctx.db.entityObjectReference.deleteMany({
            where: { OR: input.ids.map((id) => ({ fromObjectId: id })) },
        }),
        ctx.db.entityObject.deleteMany({ where: { id: { in: input.ids } } }),
    ]);
    return !!(refCount || srefCount || objCount);
}

export async function updateObjectLogic(
    ctx: ApiContext,
    input: { id: string; values: Record<string, any> }
) {
    const { id, values } = input;
    Object.keys(values).forEach(
        (key) => (values[key] === undefined || values[key] === null) && delete values[key]
    );

    const object = await ctx.db.entityObject.update({
        where: { id },
        data: { values },
    });

    //TODO: 更新关系的逻辑需要优化: 应该根据明确更新的字段进行关系更新
    if (object) {
        await updateToOneFieldReferences(id, ctx.engine, object.modelName, values, ctx.db);
    }
    return object;
}

export async function updateValuesLogic(
    ctx: ApiContext,
    input: { id: string; values: Record<string, any> }
) {
    const existingObject = await ctx.db.entityObject.findUnique({
        where: { id: input.id },
    });
    if (!existingObject) {
        return null;
    }

    const currentValues = existingObject.values as Record<string, any>;
    const mergedValues = { ...currentValues, ...input.values };

    const updatedObject = await ctx.db.entityObject.update({
        where: { id: input.id },
        data: { values: mergedValues },
    });

    if (updatedObject) {
        await updateToOneFieldReferences(
            input.id,
            ctx.engine,
            updatedObject.modelName,
            input.values,
            ctx.db
        );
    }
    return updatedObject;
}

// --- Reference Operations ---

export async function findObjectReferenceOOLogic(
    ctx: ApiContext,
    input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    }
) {
    ctx.db.entityObject.groupBy({
        by: ['id'],
        _count: {
            id: true,
        },
    });
    return ctx.db.entityObjectReference.findFirst({ where: input });
}

export async function findObjectReferencesOMLogic(
    ctx: ApiContext,
    input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    }
) {
    return ctx.db.entityObjectReference.findMany({ where: input });
}

export async function findObjectReferencesCountOMLogic(
    ctx: ApiContext,
    input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    }
) {
    return ctx.db.entityObjectReference.count({ where: input });
}

export async function createObjectReferenceLogic(
    ctx: ApiContext,
    input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectId: string;
    }
) {
    // 检查是否已存在相同的关联
    const existing = await ctx.db.entityObjectReference.findFirst({
        where: input,
    });

    if (existing) {
        throw new Error('关联关系已存在');
    }

    return ctx.db.entityObjectReference.create({
        data: input,
    });
}

export async function createObjectReferencesLogic(
    ctx: ApiContext,
    input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectIds: string[];
    }
) {
    const createData = input.toObjectIds.map((toObjectId) => ({
        fromModelName: input.fromModelName,
        fromFieldName: input.fromFieldName,
        fromObjectId: input.fromObjectId,
        toModelName: input.toModelName,
        toObjectId,
    }));

    // 过滤掉已存在的关联
    const existingRefs = await ctx.db.entityObjectReference.findMany({
        where: {
            fromModelName: input.fromModelName,
            fromFieldName: input.fromFieldName,
            fromObjectId: input.fromObjectId,
            toModelName: input.toModelName,
            toObjectId: { in: input.toObjectIds },
        },
    });

    // 创建新的关联
    const finalCreateData = createData.filter(
        (item) =>
            !existingRefs.some(
                (ref) =>
                    ref.fromModelName === item.fromModelName &&
                    ref.fromFieldName === item.fromFieldName &&
                    ref.fromObjectId === item.fromObjectId &&
                    ref.toModelName === item.toModelName &&
                    ref.toObjectId === item.toObjectId
            )
    );

    const result = await ctx.db.entityObjectReference.createMany({
        data: finalCreateData,
    });
    return result.count;
}

export async function deleteObjectReferenceLogic(
    ctx: ApiContext,
    input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectId: string;
    }
) {
    const result = await ctx.db.entityObjectReference.deleteMany({
        where: input,
    });

    return result.count > 0;
}

export async function deleteObjectReferencesLogic(
    ctx: ApiContext,
    input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectIds: string[];
    }
) {
    const result = await ctx.db.entityObjectReference.deleteMany({
        where: {
            fromModelName: input.fromModelName,
            fromFieldName: input.fromFieldName,
            fromObjectId: input.fromObjectId,
            toModelName: input.toModelName,
            toObjectId: {
                in: input.toObjectIds,
            },
        },
    });

    return result.count;
}

// --- 辅助函数 ---

function convertFilterToPrismaQuery(filter: {
    and: { field: string; operator: string; value: any }[];
}) {
    if (!filter || !filter.and) return [];
    return filter.and
        .map((item) => ({ values: convertFilterItemToPrismaQuery(item) }))
        .filter((item) => item.values !== undefined);
}

function convertFilterItemToPrismaQuery(item: { field: string; operator: string; value: any }) {
    const { field, operator, value } = item;
    const path = { path: [field] };
    switch (operator) {
        case QueryOperator.CONTAINS:
            return { ...path, string_contains: value };
        case QueryOperator.EQ:
            return { ...path, equals: value };
        case QueryOperator.NE:
            return { ...path, not: value };
        case QueryOperator.STARTS_WITH:
            return { ...path, string_starts_with: value };
        case QueryOperator.ENDS_WITH:
            return { ...path, string_ends_with: value };
        case QueryOperator.IN:
            return { ...path, array_contains: value };
        case QueryOperator.IS_NULL:
            return { ...path, equals: null };
        case QueryOperator.IS_NOT_NULL:
            return { ...path, not: null };
        default:
            return undefined;
    }
}

async function updateToOneFieldReferences(
    objId: string,
    engine: IEntityEnginePrimitive,
    modelName: string,
    values: any,
    db: PrismaClient
) {
    const fields = engine.metaRegistry
        .getModel(modelName)
        ?.fields.filter((f) => f.type === 'one_to_one' || f.type === 'many_to_one');
    if (!fields) return;

    const funcs = [];
    for (const field of fields) {
        if (
            field.name in values &&
            values[field.name] !== null &&
            values[field.name] !== undefined &&
            values[field.name] !== '' &&
            field.refModel
        ) {
            funcs.push(
                db.entityObjectReference.deleteMany({
                    where: {
                        fromModelName: modelName,
                        fromFieldName: field.name,
                        fromObjectId: objId,
                        toModelName: field.refModel,
                    },
                })
            );
            const newRefId = values[field.name];
            if (newRefId) {
                funcs.push(
                    db.entityObjectReference.create({
                        data: {
                            fromModelName: modelName,
                            fromFieldName: field.name,
                            fromObjectId: objId,
                            toModelName: field.refModel,
                            toObjectId: newRefId,
                        },
                    })
                );
            }
        }
    }
    if (funcs.length > 0) await db.$transaction(funcs);
}

export async function findGroupedObjectsLogic(
    ctx: ApiContext,
    input: {
        modelName: string;
        groupBy:
            | string
            | {
                  field: string;
                  format?: {
                      type: 'time' | 'range';
                      //time: 'YYYY', 'YYYY-MM', 'YYYY-MM-DD'
                      //range: '0-100,100-200,300-400'
                      pattern: string;
                  };
                  withoutDetails?: boolean; // 是否返回详细数据
              };
        query?: {
            filter?: Record<string, unknown>;
        };
        reference?: {
            fromModelName: string;
            fromFieldName: string;
            fromObjectId: string;
        };
        aggregations?: Record<string, 'count' | 'sum' | 'avg' | 'min' | 'max'>;
        groupSortBy?: Record<string, 'asc' | 'desc'>;
        objectSortBy?: Record<string, 'asc' | 'desc'>;
    }
) {
    const { modelName, groupBy, query, reference, aggregations, groupSortBy, objectSortBy } = input;

    const model = ctx.engine.metaRegistry.getModel(modelName);
    if (!model) {
        throw new Error(`Model not found: ${modelName}`);
    }

    if (model.external) {
        return externalFindGroupedObjectsLogic(ctx.engine, input);
    }

    const getFieldType = (fieldName: string): string => {
        // 处理系统字段
        if (fieldName.startsWith('$$')) {
            const actualFieldName = fieldName.slice(2);
            // 系统字段类型映射
            const systemFieldTypes: Record<string, string> = {
                createdAt: 'timestamp',
                updatedAt: 'timestamp',
                id: 'string',
                modelName: 'string',
                isDeleted: 'boolean',
            };
            return systemFieldTypes[actualFieldName] || 'string';
        }

        // 处理普通字段
        const field = model.fields.find((f) => f.name === fieldName);
        return field?.type || 'string';
    };

    const isNumericField = (fieldName: string): boolean => {
        const fieldType = getFieldType(fieldName);
        return ['number', 'integer', 'float', 'decimal'].includes(fieldType);
    };

    const isDateField = (fieldName: string): boolean => {
        const fieldType = getFieldType(fieldName);
        return ['date', 'datetime', 'timestamp'].includes(fieldType);
    };

    const buildFieldExpressionWithCast = (fieldName: string): Prisma.Sql => {
        const fieldExpr = buildFieldExpression(fieldName);
        if (isNumericField(fieldName)) {
            return Prisma.sql`CAST(${fieldExpr} AS NUMERIC)`;
        }
        if (isDateField(fieldName)) {
            return Prisma.sql`CAST(${fieldExpr} AS TIMESTAMP)`;
        }
        return fieldExpr;
    };

    //构建 groupBy 表达式
    const groupByConfig =
        typeof input.groupBy === 'string' ? { field: input.groupBy } : input.groupBy;

    const groupByField = groupByConfig.field;
    const groupByFormat = groupByConfig.format;

    const rawFieldExpr = buildFieldExpression(groupByField);

    let groupByExpr: Prisma.Sql = rawFieldExpr;

    if (groupByFormat?.type === 'time') {
        const tsExpr = Prisma.sql`CAST(${rawFieldExpr} AS TIMESTAMP)`;
        switch (groupByFormat.pattern) {
            case 'YYYY':
                groupByExpr = Prisma.sql`EXTRACT(YEAR FROM ${tsExpr})`;
                break;
            case 'YYYY-MM':
                groupByExpr = Prisma.sql`TO_CHAR(${tsExpr}, 'YYYY-MM')`;
                break;
            case 'YYYY-MM-DD':
                groupByExpr = Prisma.sql`TO_CHAR(${tsExpr}, 'YYYY-MM-DD')`;
                break;
            default:
                throw new Error(
                    `findGroupedObjectsLogic - Unsupported groupByFormat: ${groupByFormat.pattern}`
                );
        }
    } else if (groupByFormat?.type === 'range') {
        const numExpr = Prisma.sql`CAST(${rawFieldExpr} AS NUMERIC)`;
        const ranges = groupByFormat.pattern.split(',').map((r) => r.trim());
        const cases: Prisma.Sql[] = [];

        for (const range of ranges) {
            if (range.includes('-')) {
                const [min, max] = range.split('-').map(Number);
                cases.push(
                    Prisma.sql`WHEN ${numExpr} >= ${min} AND ${numExpr} <= ${max} THEN ${range}`
                );
            } else if (range.includes('+')) {
                const min = Number(range.slice(0, -1));
                cases.push(Prisma.sql`WHEN ${numExpr} >= ${min} THEN ${range}`);
            } else {
                const val = Number(range);
                cases.push(Prisma.sql`WHEN ${numExpr} = ${val} THEN ${val}`);
            }
        }

        let caseSql = Prisma.sql`CASE `;
        cases.forEach((c, i) => {
            if (i === 0) {
                caseSql = Prisma.sql`${caseSql}${c}`;
            } else {
                caseSql = Prisma.sql`${caseSql} ${c}`;
            }
        });
        groupByExpr = Prisma.sql`${caseSql} ELSE 'other' END`;
    }

    // 构建 select 语句
    const selectSqls = [
        Prisma.sql`"eo".*`,
        Prisma.sql`${groupByExpr} as "groupKey"`,
        Prisma.sql`COUNT(*) OVER (PARTITION BY ${groupByExpr}) as "object_count"`,
    ];

    // select 添加聚合sql
    if (aggregations) {
        Object.entries(aggregations).forEach(([field, aggOp]) => {
            const fieldExpr = buildFieldExpression(field);
            const aggMap: Record<string, Prisma.Sql> = {
                count: Prisma.sql`COUNT(*) OVER (PARTITION BY ${groupByExpr})`,
                sum: Prisma.sql`SUM(CAST(${fieldExpr} AS NUMERIC)) OVER (PARTITION BY ${groupByExpr})`,
                avg: Prisma.sql`AVG(CAST(${fieldExpr} AS NUMERIC)) OVER (PARTITION BY ${groupByExpr})`,
                min: Prisma.sql`MIN(CAST(${fieldExpr} AS NUMERIC)) OVER (PARTITION BY ${groupByExpr})`,
                max: Prisma.sql`MAX(CAST(${fieldExpr} AS NUMERIC)) OVER (PARTITION BY ${groupByExpr})`,
            };
            selectSqls.push(Prisma.sql`${aggMap[aggOp]} as "${Prisma.raw(`${field}_${aggOp}`)}"`);
        });
    }

    // select 添加row_number进行组内对象排序
    let rowNumberOrderBySql: Prisma.Sql;
    if (objectSortBy) {
        const [sortByKey, direction] = Object.entries(objectSortBy)[0];
        const sortFieldExpr = buildFieldExpression(sortByKey);
        rowNumberOrderBySql = Prisma.sql`ORDER BY ${sortFieldExpr} ${Prisma.raw(direction.toUpperCase())}`;
    } else {
        rowNumberOrderBySql = Prisma.sql`ORDER BY "eo"."updatedAt" DESC`;
    }
    selectSqls.push(
        Prisma.sql`ROW_NUMBER() OVER (PARTITION BY ${groupByExpr} ${rowNumberOrderBySql}) as "group_rank"`
    );

    // 需要关联查询时 select 添加引用别名
    if (reference) {
        selectSqls.push(
            Prisma.sql`ref.id as "ref_id"`,
            Prisma.sql`related."values" as "ref_values"`
        );
    }

    // 需要关联查询时构建join子句
    const joinSql = reference
        ? Prisma.sql`
    INNER JOIN "EntityObjectReference" ref ON (
        eo.id = ref."toObjectId" 
        AND ref."fromModelName" = ${reference.fromModelName}
        AND ref."fromFieldName" = ${reference.fromFieldName}
        AND ref."fromObjectId" = ${reference.fromObjectId}
        AND ref."toModelName" = ${modelName}
    )
    INNER JOIN "EntityObject" related ON (
        related.id = ${reference.fromObjectId}
        AND related."isDeleted" = false
    )`
        : Prisma.sql``;

    // 构建基础 where 条件
    const whereConditions = [
        Prisma.sql`"eo"."isDeleted" = false`,
        Prisma.sql`"eo"."modelName" = ${modelName}`,
    ];

    // where 上添加 filter 条件
    if (input.query?.filter) {
        const { field, operator, value, value2 } = input.query.filter;

        let betweenSql: Prisma.Sql | undefined;
        if (operator === 'between') {
            if (value2 === undefined || value2 === null) {
                throw new Error(`BETWEEN operator requires both value and value2`);
            }
            const fieldExprWithCast = buildFieldExpressionWithCast(field as string);

            // 如果是日期字段，需要将字符串转换为时间戳
            if (isDateField(field as string)) {
                betweenSql = Prisma.sql`${fieldExprWithCast} BETWEEN ${Prisma.sql`CAST(${value} AS TIMESTAMP)`} AND ${Prisma.sql`CAST(${value2} AS TIMESTAMP)`}`;
            } else {
                betweenSql = Prisma.sql`${fieldExprWithCast} BETWEEN ${value} AND ${value2}`;
            }
        }

        const fieldExpr = buildFieldExpression(field as string);
        const opMap: Record<string, Prisma.Sql> = {
            contains: Prisma.sql`${fieldExpr} LIKE ${`%${value}%`}`,
            startsWith: Prisma.sql`${fieldExpr} LIKE ${`${value}%`}`,
            endsWith: Prisma.sql`${fieldExpr} LIKE ${`%${value}`}`,
            eq: Prisma.sql`${fieldExpr} = ${value}`,
            ne: Prisma.sql`${fieldExpr} != ${value}`,
            gt: isDateField(field as string)
                ? Prisma.sql`${buildFieldExpressionWithCast(field as string)} > ${Prisma.sql`CAST(${value} AS TIMESTAMP)`}`
                : Prisma.sql`${buildFieldExpressionWithCast(field as string)} > ${value}`,
            gte: isDateField(field as string)
                ? Prisma.sql`${buildFieldExpressionWithCast(field as string)} >= ${Prisma.sql`CAST(${value} AS TIMESTAMP)`}`
                : Prisma.sql`${buildFieldExpressionWithCast(field as string)} >= ${value}`,
            lt: isDateField(field as string)
                ? Prisma.sql`${buildFieldExpressionWithCast(field as string)} < ${Prisma.sql`CAST(${value} AS TIMESTAMP)`}`
                : Prisma.sql`${buildFieldExpressionWithCast(field as string)} < ${value}`,
            lte: isDateField(field as string)
                ? Prisma.sql`${buildFieldExpressionWithCast(field as string)} <= ${Prisma.sql`CAST(${value} AS TIMESTAMP)`}`
                : Prisma.sql`${buildFieldExpressionWithCast(field as string)} <= ${value}`,
            in: Array.isArray(value)
                ? Prisma.sql`${fieldExpr} IN (${Prisma.join(value.map((v) => Prisma.sql`${v}`))})`
                : Prisma.sql``,
            isNull: Prisma.sql`${fieldExpr} IS NULL`,
            isNotNull: Prisma.sql`${fieldExpr} IS NOT NULL`,
        };

        const opSql = operator === 'between' ? betweenSql : opMap[operator as keyof typeof opMap];
        if (opSql) whereConditions.push(opSql);
        else throw new Error(`findGroupedObjectsLogic - Unsupported operator: ${operator}`);
    }

    // 构建 GROUP ORDER BY 子句
    let groupOrderBySql: Prisma.Sql;
    if (groupSortBy) {
        const [sortByKey, direction] = Object.entries(groupSortBy)[0];
        const groupSortFieldExpr = buildFieldExpression(sortByKey);
        groupOrderBySql = Prisma.sql`ORDER BY ${groupSortFieldExpr} ${Prisma.raw(direction.toUpperCase())}`;
    } else {
        groupOrderBySql = Prisma.sql``;
    }

    //构建完整的 SQL 语句
    // select
    let completedSelectSql: Prisma.Sql;
    completedSelectSql = selectSqls[0];
    for (let i = 1; i < selectSqls.length; i++) {
        completedSelectSql = Prisma.sql`${completedSelectSql}, ${selectSqls[i]}`;
    }

    //where
    let completedWhereSql: Prisma.Sql;
    completedWhereSql = whereConditions[0];
    for (let i = 1; i < whereConditions.length; i++) {
        completedWhereSql = Prisma.sql`${completedWhereSql} AND ${whereConditions[i]}`;
    }

    //join
    const completedJoinSql = joinSql;

    //group order by
    const completedGroupOrderBySql = groupOrderBySql;

    //complete sql
    const completeSql = Prisma.sql`
        SELECT ${completedSelectSql}
        FROM "EntityObject" eo
        ${completedJoinSql}
        WHERE ${completedWhereSql}
        ${completedGroupOrderBySql}
    `;

    //执行 SQL
    const results = (await ctx.db.$queryRaw(completeSql)) as any[];

    // 处理结果，按分组组织数据
    const groups = new Map();
    results.forEach((row: any) => {
        const groupKey = row.groupKey;
        if (!groups.has(groupKey)) {
            const group = {
                key: { [groupByField]: groupKey },
                count: Number(row.object_count),
                objects: [],
                aggregations: aggregations
                    ? Object.fromEntries(
                          Object.keys(aggregations).map((field) => [
                              field,
                              row[`${field}_${aggregations[field]}`],
                          ])
                      )
                    : undefined,
            };
            groups.set(groupKey, group);
        }

        if (!groupByConfig?.withoutDetails) {
            const obj = { ...row };
            ['groupKey', 'object_count', 'group_rank'].forEach((f) => delete obj[f]);
            if (reference) {
                obj.reference = row.ref_id
                    ? {
                          id: row.ref_id,
                          values: row.ref_values,
                      }
                    : undefined;
                ['ref_id', 'ref_values'].forEach((f) => delete obj[f]);
            }
            groups.get(groupKey).objects.push(obj);
        }
    });

    const finalGroups = Array.from(groups.values());

    const finalResults = {
        groups: finalGroups,
        totalCount: finalGroups.reduce((acc, group) => acc + group.count, 0),
    };

    // console.log('=== 最终结果 ===');
    // console.log('Result:', JSON.stringify(finalResults, (key, value) =>
    //     typeof value === 'bigint' ? value.toString() : value
    // , 2));

    return finalResults;
}

// 字段表达式构建
function buildFieldExpression(fieldName: string): Prisma.Sql {
    // 判断字段类型：$$ 开头表示 model 表字段，否则表示 values 中的字段
    const isModelField = fieldName.startsWith('$$');
    const actualFieldName = isModelField ? fieldName.slice(2) : fieldName;

    return isModelField
        ? Prisma.sql`"eo"."${Prisma.raw(actualFieldName)}"`
        : Prisma.sql`"eo"."values"->>${actualFieldName}`;
}
