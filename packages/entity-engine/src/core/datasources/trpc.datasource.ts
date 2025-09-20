import type { IEntityEngineSettings } from '../types';
import type {
    IEntityQuery,
    IEntityObject,
    EntityTreeNode,
    IEntityDataSource,
    IEntityObjectReference,
    IEntityObjectReferenceProps,
} from '../../types';

import { createVanillaTrpcClient } from '../../services/api/trpc/vanilla-client';
import { convertEntityTree, convertRawEntityObject } from '../../lib/data/data-utils';

export class TRPCEntityObjectDataSource implements IEntityDataSource {
    private _settings: IEntityEngineSettings;
    private _vanillaTrpcClient?: ReturnType<typeof createVanillaTrpcClient>;
    private _serverUrl: string = '__';
    constructor(settings: IEntityEngineSettings) {
        this._settings = settings;
    }

    private get __vanillaTrpcClient() {
        const serverUrl = this._settings.getUrl('/trpc');
        if (!this._vanillaTrpcClient || this._serverUrl !== serverUrl) {
            // 如果服务器 URL 发生变化，重新创建 TRPC 客户端
            console.log('Creating new TRPC client with URL:', serverUrl);
            this._serverUrl = serverUrl;
            this._vanillaTrpcClient = createVanillaTrpcClient(serverUrl);
        }
        return this._vanillaTrpcClient;
    }

    async findPlainConfig(input: {
        modelName?: string;
        viewName?: string;
        configVersion?: string;
    }): Promise<{ models: any[]; views: any[] }> {
        return await this.__vanillaTrpcClient.model.findPlainConfig.query(input);
    }

    async findGroupedObjects(input: {
        modelName: string;
        groupBy:
            | string
            | {
                  field: string;
                  format?: {
                      type: 'time' | 'range';
                      pattern: string;
                  };
                  withoutDetails?: boolean; // 是否不返回详细数据
              };
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
            key: Record<string, any>;
            count: number;
            objects: IEntityObject[];
            aggregations?: Record<string, any>;
        }>;
        totalCount: number;
    }> {
        // 使用 Prisma 分组查询
        const result = await this.__vanillaTrpcClient.model.findGroupedObjects.query({
            modelName: input.modelName,
            groupBy: input.groupBy,
            query: input.query,
            reference: input.reference,
            aggregations: input.aggregations,
            groupSortBy: input.groupSortBy,
            objectSortBy: input.objectSortBy,
        });

        // 转换结果格式以匹配接口
        return {
            groups: result.groups.map((group: any) => ({
                key: group.key,
                count: group.count,
                objects: group.objects
                    .map((obj: any) => convertRawEntityObject(obj))
                    .filter((obj: any): obj is IEntityObject => obj !== null && obj !== undefined),
                aggregations: group.aggregations,
            })),
            totalCount: result.totalCount,
        };
    }

    async findOne(input: {
        id: string;
        modelName?: string;
    }): Promise<IEntityObject | undefined | null> {
        const ret = await this.__vanillaTrpcClient.model.findObject.query({
            id: input.id,
            modelName: input.modelName,
        });
        return Promise.resolve(convertRawEntityObject(ret));
    }

    async findMany(input: {
        modelName: string;
        query?: any; // Adjust type as needed
        withAllReferences?: boolean;
    }): Promise<{ data: IEntityObject[]; count: number }> {
        const query = input.query || {};
        const ret = await this.__vanillaTrpcClient.model.listObjects.query({
            modelName: input.modelName,
            pagination: {
                page: query?.pageIndex ?? 1,
                pageSize: query?.pageSize ?? 10,
            },
            reference: query?.references,
            filter: query?.filter as any,
            withAllReferences: input.withAllReferences,
        });
        return Promise.resolve({
            data: ret.data
                .map((obj: any) => convertRawEntityObject(obj))
                .filter((obj: any): obj is IEntityObject => obj !== null && obj !== undefined),
            count: ret.count,
        });
    }

    async findTreeObjects(input: {
        modelName: string;
        fieldName: string;
        rootObjectId?: string;
    }): Promise<EntityTreeNode | EntityTreeNode[] | null> {
        const ret = await this.__vanillaTrpcClient.model.treeObjects.query(input);

        if (Array.isArray(ret)) {
            const nodes: EntityTreeNode[] = [];
            ret.forEach((node, index) => {
                const cnode = convertEntityTree(node);
                if (cnode) {
                    nodes.push(cnode);
                }
            });
            return Promise.resolve(nodes);
        } else {
            return Promise.resolve(convertEntityTree(ret));
        }
    }

    async findOneWithReferences(input: {
        modelName: string;
        id: string;
        includeFieldNames?: string[];
    }): Promise<IEntityObject | undefined | null> {
        const ret = await this.__vanillaTrpcClient.model.findOneWithReferences.query({
            objectId: input.id,
            includeFieldNames: input.includeFieldNames,
        });
        return Promise.resolve(convertRawEntityObject(ret));
    }

    async create(input: {
        modelName: string;
        data: Partial<IEntityObject>;
        reference?: IEntityObjectReferenceProps;
    }): Promise<IEntityObject | null | undefined> {
        const values = (input.data.values ?? {}) as { [key: string]: any };

        const ret = await this.__vanillaTrpcClient.model.createObject.mutate({
            id: input.data.id,
            modelName: input.modelName,
            values,
            reference: input.reference,
        });
        return Promise.resolve(convertRawEntityObject(ret));
    }

    async update(input: { id: string; data: Partial<IEntityObject> }): Promise<boolean> {
        if (!input.data.values) {
            throw new Error('更新对象时 values 不能为空');
        }
        const ret = await this.__vanillaTrpcClient.model.updateObject.mutate({
            id: input.id,
            values: input.data.values,
        });
        return Promise.resolve(ret ? true : false);
    }

    async updateValues(input: { id: string; values: { [key: string]: any } }): Promise<boolean> {
        if (!input.values) {
            throw new Error('更新对象时 values 不能为空');
        }
        const ret = await this.__vanillaTrpcClient.model.updateValues.mutate({
            id: input.id,
            values: input.values,
        });

        if (ret) {
            return true;
        }

        return false;
    }

    async delete(input: { id: string }): Promise<boolean> {
        const ret = await this.__vanillaTrpcClient.model.deleteObject.mutate({
            id: input.id,
        });
        return Promise.resolve(ret ? true : false);
    }

    async deleteMany(input: { ids: string[] }): Promise<boolean> {
        const ret = await this.__vanillaTrpcClient.model.deleteObjects.mutate({
            ids: input.ids,
        });
        return Promise.resolve(ret ? true : false);
    }

    async findCount(input: {
        modelName: string;
        query?: any; // Adjust type as needed
    }): Promise<number> {
        //TODO: 过滤条件的应用
        const ret = await this.__vanillaTrpcClient.model.countObjects.query({
            modelName: input.modelName,
        });
        return Promise.resolve(ret);
    }

    async findManyWithReferences(input: {
        modelName: string;
        childrenFieldName: string;
        query?: any; // Adjust type as needed
    }): Promise<{ data: IEntityObject[]; count: number }> {
        const ret = await this.__vanillaTrpcClient.model.listWithChildren.query({
            modelName: input.modelName,
            childFieldName: input.childrenFieldName,
            pagination: {
                page: input.query?.pageIndex ?? 1,
                pageSize: input.query?.pageSize ?? 10,
            },
            filter: input.query?.filter as any,
        });
        return Promise.resolve({
            data: ret.data
                .map(convertRawEntityObject)
                .filter((obj): obj is IEntityObject => obj !== null && obj !== undefined),
            count: ret.count,
        });
    }

    async findReferences(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    }): Promise<IEntityObjectReference[]> {
        const ret = await this.__vanillaTrpcClient.model.findObjectReferencesOM.query(input);
        return Promise.resolve(ret);
    }

    async validate(input: { modelName: string; data: Partial<any> }): Promise<boolean> {
        return Promise.resolve(true);
    }

    async findReferencesCount(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    }): Promise<number> {
        const ret = await this.__vanillaTrpcClient.model.findObjectReferencesCountOM.query(input);
        return Promise.resolve(ret);
    }

    async createReference(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectId: string;
    }): Promise<IEntityObjectReference> {
        const ret = await this.__vanillaTrpcClient.model.createObjectReference.mutate(input);
        return Promise.resolve(ret);
    }

    async createReferences(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectIds: string[];
    }): Promise<number> {
        const ret = await this.__vanillaTrpcClient.model.createObjectReferences.mutate(input);
        return Promise.resolve(ret);
    }

    async deleteReference(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectId: string;
    }): Promise<boolean> {
        const ret = await this.__vanillaTrpcClient.model.deleteObjectReference.mutate(input);
        return Promise.resolve(ret);
    }

    async deleteReferences(input: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
        toObjectIds: string[];
    }): Promise<number> {
        const ret = await this.__vanillaTrpcClient.model.deleteObjectReferences.mutate(input);
        return Promise.resolve(ret);
    }
}
