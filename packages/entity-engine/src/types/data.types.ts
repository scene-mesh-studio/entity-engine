import type { IEntityField } from './meta.types';

export interface IEntityResult<T> {
    data: T | undefined;
    error?: string;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
}

export enum QueryOperator {
    // 比较操作符
    NONE = 'none',
    EQ = 'eq',
    NE = 'ne',
    GT = 'gt',
    GTE = 'gte',
    LT = 'lt',
    LTE = 'lte',
    // 字符串操作符
    CONTAINS = 'contains',
    STARTS_WITH = 'startsWith',
    ENDS_WITH = 'endsWith',
    // 数组操作符
    IN = 'in',
    NOT_IN = 'notIn',
    // 空值操作符
    IS_NULL = 'isNull',
    IS_NOT_NULL = 'isNotNull',
    // 范围操作符
    BETWEEN = 'between',
}

// 叶子节点条件（基础查询条件）
export interface ILeafCondition {
    field: string;
    operator: QueryOperator;
    value: any;
    value2?: any; // 用于 BETWEEN 操作符
    and?: never; // 确保互斥
    or?: never; // 确保互斥
    not?: never; // 确保互斥
}

// 复合条件（AND/OR/NOT）
export interface ICompositeCondition {
    field?: never; // 确保互斥
    operator?: never; // 确保互斥
    value?: never; // 确保互斥
    value2?: never; // 确保互斥
    and?: IEntityQueryItem[];
    or?: IEntityQueryItem[];
    not?: IEntityQueryItem[];
}

// 改进查询项接口
export type IEntityQueryItem = ILeafCondition | ICompositeCondition;

export interface IEntityQuery {
    pageSize?: number;
    pageIndex?: number;
    sortBy?: {
        [key: string]: 'asc' | 'desc';
    };
    references?: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    };
    filter?: IEntityQueryItem;
}

export interface IEntityQueryItemMeta {
    field: IEntityField;
    operators: QueryOperator[];
    options?: { [key: string]: any }[];
}

export interface IEntityQueryMeta {
    queryItemMetas: IEntityQueryItemMeta[];
}

export interface IEntityObject {
    id: string;
    modelName: string;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    values: { [key: string]: any };
}

export interface IEntityObjectReference {
    id: number;
    fromModelName: string;
    fromFieldName: string;
    fromObjectId: string;
    toModelName: string;
    toObjectId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IEntityObjectReferenceProps {
    fromModelName: string;
    fromFieldName: string;
    fromObjectId: string;
}

export interface EntityTreeNode {
    children: EntityTreeNode[];
    data: IEntityObject | undefined | null;
    parentId: string | null | undefined;
}

export interface IEntityDataSource {
    findPlainConfig(input: {
        modelName?: string;
        viewName?: string;
        configVersion?: string;
    }): Promise<{ models: any[]; views: any[] }>;

    findOne(input: { id: string; modelName?: string }): Promise<IEntityObject | undefined | null>;

    findMany(input: {
        modelName: string;
        query?: IEntityQuery;
        withAllReferences?: boolean;
    }): Promise<{ data: IEntityObject[]; count: number }>;

    findTreeObjects(input: {
        modelName: string;
        fieldName: string;
        rootObjectId?: string;
    }): Promise<EntityTreeNode | EntityTreeNode[] | null>;

    findOneWithReferences(input: {
        modelName: string;
        id: string;
        includeFieldNames?: string[];
    }): Promise<IEntityObject | undefined | null>;

    findManyWithReferences(input: {
        modelName: string;
        childrenFieldName: string;
        query?: IEntityQuery;
    }): Promise<{ data: IEntityObject[]; count: number }>;

    findCount(input: { modelName: string; query?: IEntityQuery }): Promise<number>;

    create(input: {
        modelName: string;
        data: Partial<IEntityObject>;
        reference?: IEntityObjectReferenceProps;
    }): Promise<IEntityObject | null | undefined>;

    update(input: { id: string; data: Partial<IEntityObject> }): Promise<boolean>;

    updateValues(input: { id: string; values: { [key: string]: any } }): Promise<boolean>;

    delete(input: { id: string }): Promise<boolean>;

    deleteMany(input: { ids: string[] }): Promise<boolean>;

    validate(input: { modelName: string; data: Partial<any> }): Promise<boolean>;

    findReferences(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    }): Promise<IEntityObjectReference[]>;

    findReferencesCount(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    }): Promise<number>;

    createReference(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectId: string;
    }): Promise<IEntityObjectReference>;

    createReferences(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectIds: string[];
    }): Promise<number>;

    deleteReference(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectId: string;
    }): Promise<boolean>;

    deleteReferences(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectIds: string[];
    }): Promise<number>;

    findGroupedObjects(input: {
        modelName: string;
        groupBy:
            | string
            | {
                  field: string;
                  format?: {
                      type: 'time' | 'range';
                      pattern: string;
                  };
                  withoutDetails?: boolean; // 是否返回详细数据
              }; // 分组字段名
        query?: IEntityQuery; // 可选的查询条件
        aggregations?: {
            // 可选的聚合计算
            [fieldName: string]: 'count' | 'sum' | 'avg' | 'min' | 'max';
        };
        reference?: {
            fromModelName: string;
            fromFieldName: string;
            fromObjectId: string;
        };
        groupSortBy?: {
            // 组排序
            [fieldName: string]: 'asc' | 'desc';
        };
        objectSortBy?: {
            // 组内对象排序
            [fieldName: string]: 'asc' | 'desc';
        };
    }): Promise<{
        groups: Array<{
            key: Record<string, any>; // 分组键值
            count: number; // 该分组下的对象数量
            objects: IEntityObject[]; // 该分组下的对象列表
            aggregations?: Record<string, any>; // 聚合结果
        }>;
        totalCount: number;
    }>;
}
