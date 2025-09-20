'use client';

import type { IEntityQuery, IEntityObject } from '../../types';

import React from 'react';

import { useEntityEngine } from '../provider';
import { useAsync, toDataSourceHook } from '../../lib/hooks';

type EntityObjectsConsumerProps = {
    modelName: string;
    query?: IEntityQuery;
    withReference?: boolean;
    objectsRenderer: (count: number, objs: IEntityObject[]) => React.ReactNode;
    onError?: (error: Error) => React.ReactNode;
    loading?: React.ReactNode;
};

export function EntityObjectsConsumer(props: EntityObjectsConsumerProps) {
    const { modelName, query, withReference, objectsRenderer, onError, loading } = props;
    const engine = useEntityEngine();
    const model = engine.metaRegistry.getModel(modelName);
    if (!model) {
        return null;
    }

    const datasource = engine.datasourceFactory.getDataSource();
    const dsHook = toDataSourceHook(datasource);

    const {
        data,
        loading: isLoading,
        error,
    } = dsHook.useFindMany({
        modelName,
        query,
        withAllReferences: withReference || false,
    });

    if (isLoading || !data) {
        return loading || <div>Loading...</div>;
    }

    if (error) {
        if (onError) {
            return onError(error);
        }
        return <div style={{ color: 'red' }}>Error: {error.message}</div>;
    }

    return <>{objectsRenderer(data.count, data.data)}</>;
}

type EntityObjectConsumerProps = {
    modelName: string;
    objectId: string;
    withReference?: boolean;
    objectRenderer: (obj: IEntityObject) => React.ReactNode;
    onError?: (error: Error) => React.ReactNode;
    loading?: React.ReactNode;
};

export function EntityObjectConsumer(props: EntityObjectConsumerProps) {
    const { modelName, objectId, withReference, objectRenderer, onError, loading } = props;
    const engine = useEntityEngine();

    const datasource = engine.datasourceFactory.getDataSource();
    const dsHook = toDataSourceHook(datasource);

    const { data, error, state } = useAsync(async () => {
        if (withReference) {
            return await datasource.findOneWithReferences({
                modelName,
                id: objectId,
                includeFieldNames: undefined,
            });
        } else {
            return await datasource.findOne({
                modelName,
                id: objectId,
            });
        }
    }, [objectId, withReference]);

    if (state === 'loading' || !data) {
        return loading || <div>Loading...</div>;
    }

    if (error) {
        if (onError) {
            return onError(error);
        }
        return <div style={{ color: 'red' }}>Error: {error.message}</div>;
    }

    return <>{objectRenderer(data)}</>;
}
