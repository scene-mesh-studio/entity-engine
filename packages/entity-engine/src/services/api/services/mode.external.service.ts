import type { EntityObject } from '@prisma/client';
import type { IEntityEnginePrimitive } from '../../../core';
import type { IEntityModel, IEntityObject, IEntityModelExternalConfig } from '../../../types';

import { Pool } from 'pg';

import { QueryOperator } from '../../../types';

class ModelExternalPoolService {
    #poolMap: Map<string, Pool>;

    constructor() {
        this.#poolMap = new Map<string, Pool>();
    }

    async getPool(url: string): Promise<Pool | null> {
        try {
            if (!this.#poolMap.has(url)) {
                const pool = new Pool({ connectionString: url });
                await pool.connect();
                this.#poolMap.set(url, pool);
            }
            return Promise.resolve(this.#poolMap.get(url)!);
        } catch (error) {
            console.error('Error getting database pool:', error);
            return null;
        }
    }
}

const modelExternalPoolService = new ModelExternalPoolService();

export async function externalfindObjectLogic(
    engine: IEntityEnginePrimitive,
    input: {
        modelName: string;
        id: string;
    }
): Promise<EntityObject | null> {
    const model = engine.metaRegistry.getModel(input.modelName);
    if (!model) {
        throw new Error(`Model not found: ${input.modelName}`);
    }

    const externalConfig = model.externalConfig;
    if (!externalConfig) {
        throw new Error(`External config not found for model: ${input.modelName}`);
    }
    const pool = await modelExternalPoolService.getPool(externalConfig.url);
    if (!pool) {
        throw new Error('Failed to acquire external database pool');
    }

    const result = await pool.query(
        `SELECT * FROM "${externalConfig.tableName}" WHERE "${externalConfig.mappings.find((m) => m.local === '$$id')?.remote}" = $1 LIMIT 1`,
        [input.id]
    );

    if (result && result.rows && result.rows.length > 0) {
        return convertRowToEntityObject(result.rows[0], model, externalConfig) as EntityObject;
    }

    return null;
}

export async function externalListObjectsLogic(
    engine: IEntityEnginePrimitive,
    input: {
        modelName: string;
        pagination?: { page?: number; pageSize?: number };
        reference?: {
            fromModelName: string;
            fromFieldName: string;
            fromObjectId: string;
        };
        filter?: Record<string, unknown>;
    }
): Promise<{ count: number; data: IEntityObject[] }> {
    const { modelName, pagination, reference, filter } = input;
    // 目前外部模型暂不支持 reference 过滤（需要本地引用关系参与 Join），先直接抛出明确错误
    if (reference) {
        throw new Error('External model listing with reference filter is not supported yet.');
    }

    const skip = ((pagination?.page ?? 1) - 1) * (pagination?.pageSize ?? 10);
    const take = pagination?.pageSize ?? 10;

    const model = engine.metaRegistry.getModel(modelName);
    if (!model) {
        throw new Error(`Model not found: ${modelName}`);
    }

    const externalConfig = model.externalConfig;
    if (!externalConfig) {
        throw new Error(`External config not found for model: ${modelName}`);
    }
    const pool = await modelExternalPoolService.getPool(externalConfig.url);
    if (!pool) {
        throw new Error('Failed to acquire external database pool');
    }

    // 构建 where 语句
    const filterQuery = filter
        ? convertFilterToSqlQuery(filter as any, model, externalConfig)
        : undefined;
    const whereClause = filterQuery?.whereClause ? `WHERE ${filterQuery.whereClause}` : '';

    // 排序：优先使用 $$updatedAt 或 $$createdAt，没有则使用 $$id
    const preferredOrderLocals = ['$$updatedAt', '$$createdAt', '$$id'];
    let orderRemoteColumn: string | undefined;
    for (const localName of preferredOrderLocals) {
        const found = externalConfig.mappings.find((mp) => mp.local === localName);
        if (found) {
            orderRemoteColumn = found.remote;
            break;
        }
    }
    if (!orderRemoteColumn) {
        // 回退：若没有匹配到，则使用第一个 mapping 的 remote 字段
        orderRemoteColumn = externalConfig.mappings[0]?.remote;
    }
    const orderBySql = orderRemoteColumn ? `ORDER BY "${orderRemoteColumn}" DESC` : '';

    // count 查询（共用 where 条件）
    const countSql = `SELECT COUNT(*)::bigint AS cnt FROM "${externalConfig.tableName}" ${whereClause}`;
    const countResult = await pool.query(countSql, filterQuery?.parameters ?? []);

    // data 查询
    const dataParams = [...(filterQuery?.parameters ?? [])];
    // limit offset 使用参数化防止注入
    dataParams.push(take);
    dataParams.push(skip);
    const limitParamIndex = dataParams.length - 1; // skip 的位置
    const sizeParamIndex = dataParams.length - 2; // take 的位置
    const dataSql = `SELECT * FROM "${externalConfig.tableName}" ${whereClause} ${orderBySql} LIMIT $${sizeParamIndex + 1} OFFSET $${limitParamIndex + 1}`;
    const result = await pool.query(dataSql, dataParams);

    const objs: IEntityObject[] = [];
    // 根据 externalConfig 的映射关系(mappings) 构建实体对象
    if (result && result.rows) {
        for (const row of result.rows) {
            const obj: IEntityObject | null = convertRowToEntityObject(row, model, externalConfig);
            if (obj) {
                objs.push(obj);
            }
        }
    }
    const countValueRaw = countResult.rows?.[0]?.cnt ?? countResult.rows?.[0]?.count ?? 0;
    const count =
        typeof countValueRaw === 'string' ? parseInt(countValueRaw, 10) : Number(countValueRaw);
    return { count: count || 0, data: objs };
}

interface GroupByConfig {
    field: string;
    format?: {
        type: 'time' | 'range';
        pattern: string;
    };
    withoutDetails?: boolean;
}

interface FilterCondition {
    field: string;
    operator: string;
    value: any;
    value2?: any;
}

interface SqlQueryBuilder {
    whereClause: string;
    parameters: any[];
}

const COLUMN_NAME_REGEX = /^[_a-zA-Z][_a-zA-Z0-9]*$/;
const DATE_REGEX = /\d{4}-\d{2}-\d{2}/;
const PREFERRED_SORT_FIELDS = ['$$updatedAt', '$$createdAt', '$$id'] as const;

function validateColumnName(columnName: string, context: string): void {
    if (!COLUMN_NAME_REGEX.test(columnName)) {
        throw new Error(`Unsafe remote column name detected in ${context}: ${columnName}`);
    }
}

function buildTimeGroupExpression(remoteColumn: string, pattern: string): string {
    const base = `CAST("${remoteColumn}" AS TIMESTAMP)`;
    switch (pattern) {
        case 'YYYY':
            return `EXTRACT(YEAR FROM ${base})`;
        case 'YYYY-MM':
            return `TO_CHAR(${base}, 'YYYY-MM')`;
        case 'YYYY-MM-DD':
            return `TO_CHAR(${base}, 'YYYY-MM-DD')`;
        default:
            throw new Error(`Unsupported time groupBy pattern: ${pattern}`);
    }
}

function buildRangeGroupExpression(remoteColumn: string, pattern: string): string {
    const numExpr = `CAST("${remoteColumn}" AS NUMERIC)`;
    const ranges = pattern
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

    if (ranges.length === 0) {
        return `"${remoteColumn}"`;
    }

    const cases: string[] = [];
    for (const range of ranges) {
        if (range.includes('-')) {
            const [minStr, maxStr] = range.split('-', 2);
            const min = Number(minStr);
            const max = Number(maxStr);
            if (!isNaN(min) && !isNaN(max)) {
                cases.push(`WHEN ${numExpr} >= ${min} AND ${numExpr} <= ${max} THEN '${range}'`);
            }
        } else if (range.endsWith('+')) {
            const min = Number(range.slice(0, -1));
            if (!isNaN(min)) {
                cases.push(`WHEN ${numExpr} >= ${min} THEN '${range}'`);
            }
        } else {
            const val = Number(range);
            if (!isNaN(val)) {
                cases.push(`WHEN ${numExpr} = ${val} THEN '${val}'`);
            }
        }
    }

    return cases.length > 0 ? `CASE ${cases.join(' ')} ELSE 'other' END` : `"${remoteColumn}"`;
}

function buildGroupExpression(remoteColumn: string, groupByConfig: GroupByConfig): string {
    if (!groupByConfig.format) {
        return `"${remoteColumn}"`;
    }

    const { type, pattern } = groupByConfig.format;

    if (type === 'time') {
        return buildTimeGroupExpression(remoteColumn, pattern);
    } else if (type === 'range') {
        return buildRangeGroupExpression(remoteColumn, pattern);
    }

    return `"${remoteColumn}"`;
}

function buildFilterSqlQuery(
    filter: FilterCondition,
    model: IEntityModel,
    config: IEntityModelExternalConfig
): SqlQueryBuilder | null {
    const { field, operator, value, value2 } = filter;

    if (!field || operator === undefined || operator === null) {
        return null;
    }

    const remoteColumn = mapLocalToRemote(field, model, config);
    if (!remoteColumn) {
        return null;
    }

    validateColumnName(remoteColumn, 'filter');

    const colRef = `"${remoteColumn}"`;
    const isDateValue = typeof value === 'string' && DATE_REGEX.test(value);
    const leftExpr = isDateValue ? `CAST(${colRef} AS TIMESTAMP)` : colRef;

    const params: any[] = [];
    let whereClause = '';

    switch (operator) {
        case 'contains':
            params.push(`%${value}%`);
            whereClause = `${colRef} ILIKE $${params.length}`;
            break;
        case 'startsWith':
            params.push(`${value}%`);
            whereClause = `${colRef} ILIKE $${params.length}`;
            break;
        case 'endsWith':
            params.push(`%${value}`);
            whereClause = `${colRef} ILIKE $${params.length}`;
            break;
        case 'eq':
            params.push(value);
            whereClause = `${colRef} = $${params.length}`;
            break;
        case 'ne':
            params.push(value);
            whereClause = `${colRef} <> $${params.length}`;
            break;
        case 'gt':
            params.push(value);
            whereClause = `${leftExpr} > $${params.length}`;
            break;
        case 'gte':
            params.push(value);
            whereClause = `${leftExpr} >= $${params.length}`;
            break;
        case 'lt':
            params.push(value);
            whereClause = `${leftExpr} < $${params.length}`;
            break;
        case 'lte':
            params.push(value);
            whereClause = `${leftExpr} <= $${params.length}`;
            break;
        case 'in':
            if (Array.isArray(value) && value.length > 0) {
                params.push(value);
                whereClause = `${colRef} = ANY($${params.length})`;
            }
            break;
        case 'isNull':
            whereClause = `${colRef} IS NULL`;
            break;
        case 'isNotNull':
            whereClause = `${colRef} IS NOT NULL`;
            break;
        case 'between':
            if (value !== undefined && value2 !== undefined) {
                const betweenExpr = isDateValue ? `CAST(${colRef} AS TIMESTAMP)` : colRef;
                params.push(value, value2);
                whereClause = `${betweenExpr} BETWEEN $${params.length - 1} AND $${params.length}`;
            }
            break;
        default:
            throw new Error(`Unsupported operator: ${operator}`);
    }

    return whereClause ? { whereClause, parameters: params } : null;
}

function buildOrderExpression(
    sortBy: Record<string, 'asc' | 'desc'> | undefined,
    model: IEntityModel,
    externalConfig: IEntityModelExternalConfig,
    fallbackFields: readonly string[] = PREFERRED_SORT_FIELDS
): string {
    if (sortBy) {
        const [key, dir] = Object.entries(sortBy)[0];
        const remoteColumn = mapLocalToRemote(key, model, externalConfig);
        if (!remoteColumn) {
            throw new Error(`Sort field not mapped: ${key}`);
        }
        validateColumnName(remoteColumn, 'sort');
        return `"${remoteColumn}" ${dir.toUpperCase()}`;
    }

    // Fallback to preferred fields
    for (const field of fallbackFields) {
        const mapping = externalConfig.mappings.find((mp) => mp.local === field);
        if (mapping?.remote) {
            return `"${mapping.remote}" DESC`;
        }
    }

    // Ultimate fallback to first mapping
    const firstMapping = externalConfig.mappings[0];
    return firstMapping ? `"${firstMapping.remote}" DESC` : 'NULL';
}

function buildAggregationSelects(
    aggregations: Record<string, 'count' | 'sum' | 'avg' | 'min' | 'max'> | undefined,
    groupExpr: string,
    model: IEntityModel,
    externalConfig: IEntityModelExternalConfig
): string {
    if (!aggregations || Object.keys(aggregations).length === 0) {
        return '';
    }

    const windowPartition = `PARTITION BY ${groupExpr}`;
    const selects: string[] = [];

    for (const [field, operation] of Object.entries(aggregations)) {
        const remoteColumn = mapLocalToRemote(field, model, externalConfig);
        if (!remoteColumn || !COLUMN_NAME_REGEX.test(remoteColumn)) {
            continue;
        }

        const colRef = `"${remoteColumn}"`;
        const aggExpression =
            operation === 'count'
                ? `COUNT(*) OVER (${windowPartition})`
                : `${operation.toUpperCase()}(CAST(${colRef} AS NUMERIC)) OVER (${windowPartition})`;

        selects.push(`${aggExpression} AS "${field}_${operation}"`);
    }

    return selects.length > 0 ? ', ' + selects.join(', ') : '';
}

function processGroupedResults(
    rows: any[],
    groupByField: string,
    groupByConfig: GroupByConfig,
    aggregations: Record<string, string> | undefined,
    model: IEntityModel,
    externalConfig: IEntityModelExternalConfig
): any[] {
    const groupsMap = new Map<string, any>();

    for (const row of rows) {
        const groupKey = String(row.groupKey ?? '');

        if (!groupsMap.has(groupKey)) {
            const groupData: any = {
                key: { [groupByField]: row.groupKey },
                count: Number(row.object_count) || 0,
                objects: [],
            };

            if (aggregations) {
                groupData.aggregations = Object.fromEntries(
                    Object.keys(aggregations).map((field) => [
                        field,
                        row[`${field}_${aggregations[field]}`],
                    ])
                );
            }

            groupsMap.set(groupKey, groupData);
        }

        if (!groupByConfig.withoutDetails) {
            const rowClone = { ...row };

            // Remove metadata columns
            delete rowClone.groupKey;
            delete rowClone.object_count;
            delete rowClone.group_rank;

            // Remove aggregation columns
            if (aggregations) {
                for (const [field, operation] of Object.entries(aggregations)) {
                    delete rowClone[`${field}_${operation}`];
                }
            }

            const entityObject = convertRowToEntityObject(rowClone, model, externalConfig);
            if (entityObject) {
                groupsMap.get(groupKey)!.objects.push(entityObject);
            }
        }
    }

    return Array.from(groupsMap.values());
}

export async function externalFindGroupedObjectsLogic(
    engine: IEntityEnginePrimitive,
    input: {
        modelName: string;
        groupBy: string | GroupByConfig;
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

    if (reference) {
        throw new Error('External model grouping with reference is not supported yet.');
    }

    const model = engine.metaRegistry.getModel(modelName);
    if (!model) {
        throw new Error(`Model not found: ${modelName}`);
    }

    const externalConfig = model.externalConfig;
    if (!externalConfig) {
        throw new Error(`External config not found for model: ${modelName}`);
    }

    const pool = await modelExternalPoolService.getPool(externalConfig.url);
    if (!pool) {
        throw new Error('Failed to acquire external database pool');
    }

    const groupByConfig: GroupByConfig = typeof groupBy === 'string' ? { field: groupBy } : groupBy;

    const remoteGroupColumn = mapLocalToRemote(groupByConfig.field, model, externalConfig);
    if (!remoteGroupColumn) {
        throw new Error(`GroupBy field not mapped: ${groupByConfig.field}`);
    }
    validateColumnName(remoteGroupColumn, 'groupBy');

    const groupExpr = buildGroupExpression(remoteGroupColumn, groupByConfig);
    const params: any[] = [];
    let whereClause = '1=1';

    if (query?.filter) {
        const filterResult = buildFilterSqlQuery(
            query.filter as FilterCondition,
            model,
            externalConfig
        );
        if (filterResult) {
            whereClause = filterResult.whereClause;
            params.push(...filterResult.parameters);
        }
    }

    const objectOrderExpr = buildOrderExpression(objectSortBy, model, externalConfig);
    const windowPartition = `PARTITION BY ${groupExpr}`;
    const aggregationSelects = buildAggregationSelects(
        aggregations,
        groupExpr,
        model,
        externalConfig
    );

    let groupOrderSql = '';
    if (groupSortBy) {
        const [key, direction] = Object.entries(groupSortBy)[0];
        const remoteColumn = mapLocalToRemote(key, model, externalConfig);
        if (remoteColumn && COLUMN_NAME_REGEX.test(remoteColumn)) {
            groupOrderSql = `ORDER BY "${remoteColumn}" ${direction.toUpperCase()}`;
        }
    }

    const sql = `
        SELECT
            t.*,
            ${groupExpr} AS "groupKey",
            COUNT(*) OVER (${windowPartition}) AS "object_count",
            ROW_NUMBER() OVER (${windowPartition} ORDER BY ${objectOrderExpr}) AS "group_rank"${aggregationSelects}
        FROM "${externalConfig.tableName}" t
        WHERE ${whereClause}
        ${groupOrderSql}
    `.trim();

    try {
        const result = await pool.query(sql, params);
        const groups = processGroupedResults(
            result.rows,
            groupByConfig.field,
            groupByConfig,
            aggregations,
            model,
            externalConfig
        );

        return {
            groups,
            totalCount: groups.reduce((sum, group) => sum + group.count, 0),
        };
    } catch (error) {
        throw new Error(
            `Failed to execute grouped query: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * 将前端传入的 filter（与内部 listObjectsLogic 保持一致：{ and: [ { field, operator, value } ] }）
 * 转换为安全的可参数化 SQL where 语句。
 */
function convertFilterToSqlQuery(
    filter: {
        and?: { field: string; operator: QueryOperator | string; value: any; value2?: any }[];
    },
    model: IEntityModel,
    config: IEntityModelExternalConfig
): { whereClause: string; parameters: any[] } | undefined {
    if (!filter || !Array.isArray(filter.and) || filter.and.length === 0) return undefined;

    const clauses: string[] = [];
    const params: any[] = [];

    for (const item of filter.and) {
        if (!item) continue;
        const { field, operator, value, value2 } = item;
        if (!field || operator === undefined || operator === null) continue;

        const remoteColumn = mapLocalToRemote(field, model, config);
        if (!remoteColumn) continue; // 未找到映射，忽略该条件
        if (!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(remoteColumn)) {
            throw new Error(`Unsafe remote column name detected: ${remoteColumn}`);
        }
        const colRef = `"${remoteColumn}"`;

        const op: QueryOperator | string = operator as any;
        switch (op) {
            case QueryOperator.CONTAINS: {
                params.push(`%${value}%`);
                clauses.push(`${colRef} ILIKE $${params.length}`);
                break;
            }
            case QueryOperator.STARTS_WITH: {
                params.push(`${value}%`);
                clauses.push(`${colRef} ILIKE $${params.length}`);
                break;
            }
            case QueryOperator.ENDS_WITH: {
                params.push(`%${value}`);
                clauses.push(`${colRef} ILIKE $${params.length}`);
                break;
            }
            case QueryOperator.EQ: {
                params.push(value);
                clauses.push(`${colRef} = $${params.length}`);
                break;
            }
            case QueryOperator.NE: {
                params.push(value);
                clauses.push(`${colRef} <> $${params.length}`);
                break;
            }
            case QueryOperator.GT: {
                params.push(value);
                clauses.push(`${colRef} > $${params.length}`);
                break;
            }
            case QueryOperator.GTE: {
                params.push(value);
                clauses.push(`${colRef} >= $${params.length}`);
                break;
            }
            case QueryOperator.LT: {
                params.push(value);
                clauses.push(`${colRef} < $${params.length}`);
                break;
            }
            case QueryOperator.LTE: {
                params.push(value);
                clauses.push(`${colRef} <= $${params.length}`);
                break;
            }
            case QueryOperator.IN: {
                if (!Array.isArray(value) || value.length === 0) break;
                params.push(value);
                clauses.push(`${colRef} = ANY($${params.length})`);
                break;
            }
            case QueryOperator.NOT_IN: {
                if (!Array.isArray(value) || value.length === 0) break;
                params.push(value);
                clauses.push(`NOT (${colRef} = ANY($${params.length}))`);
                break;
            }
            case QueryOperator.IS_NULL: {
                clauses.push(`${colRef} IS NULL`);
                break;
            }
            case QueryOperator.IS_NOT_NULL: {
                clauses.push(`${colRef} IS NOT NULL`);
                break;
            }
            case QueryOperator.BETWEEN: {
                if (value === undefined || value2 === undefined) break;
                params.push(value);
                params.push(value2);
                clauses.push(`${colRef} BETWEEN $${params.length - 1} AND $${params.length}`);
                break;
            }
            default:
                // 忽略未支持的操作符
                break;
        }
    }

    if (clauses.length === 0) return undefined;
    return { whereClause: clauses.join(' AND '), parameters: params };
}

function mapLocalToRemote(
    localField: string,
    model: IEntityModel,
    config: IEntityModelExternalConfig
) {
    // 系统字段 $$id $$createdAt $$updatedAt
    const sys = config.mappings.find((mp) => mp.local === localField);
    if (sys) return sys.remote;
    // 普通字段
    const field = model.fields.find((f) => f.name === localField);
    if (!field) return undefined;
    const normal = config.mappings.find((mp) => mp.local === field.name);
    return normal?.remote;
}

function convertRowToEntityObject(
    row: any,
    model: IEntityModel,
    config: IEntityModelExternalConfig
): IEntityObject | null {
    const obj: IEntityObject = {
        id: '',
        modelName: model.name,
        isDeleted: false,
        values: {},
    };

    for (const { local, remote } of config.mappings) {
        if (local === '$$id') {
            obj['id'] = row[remote];
        } else if (local === '$$createdAt') {
            obj['createdAt'] = row[remote];
        } else if (local === '$$updatedAt') {
            obj['updatedAt'] = row[remote];
        } else {
            const field = model.fields.find((f) => f.name === local);
            if (field) {
                obj.values[local] = row[remote];
            }
        }
    }

    if (obj.id === '') {
        return null;
    }
    return obj;
}
