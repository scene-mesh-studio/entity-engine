'use client';

import type { IEntityEngine } from '../../../../core';
import type { EntityWidgetProps } from '../../../../components/types';

import { createId } from '@paralleldrive/cuid2';

import { toDataSourceHook } from '../../../../lib/hooks';
import { EntityViewContainerPlaceholder } from '../../../../uikit/surface/view-container-placeholder';
import {
    useEntityEngine,
    EntityViewContainer,
    useEntityEngineTheme,
    useEntityEngineRouter,
    ViewContainerProvider,
    useMasterDetailViewContainer,
} from '../../../../uikit';

export function ContainerCompEx(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;
    const { theme } = useEntityEngineTheme();
    const engine = useEntityEngine();
    const { broadcast, currentAction } = useMasterDetailViewContainer();
    const router = useEntityEngineRouter();

    return (
        <ViewContainerProvider parentContext={currentAction?.contextObject}>
            <EntityViewContainerPlaceholder
                modelName={model.name}
                behavior={behavior}
                viewType={view.viewType}
                children
                // withoutProvider={false}
            />
        </ViewContainerProvider>
    );
}

type InnerOneViewContainerProps = {
    toModelName: string;
    viewType: string;
    ref: any;
    fromModelName: string;
    fromFieldName: string;
    fromObjectId: string;
    behavior?: any;
    engine: IEntityEngine;
};

function InnerOneViewContainer(props: InnerOneViewContainerProps) {
    const {
        toModelName,
        viewType,
        ref,
        behavior,
        fromModelName,
        fromFieldName,
        fromObjectId,
        engine,
    } = props;

    const dataSource = engine.datasourceFactory.getDataSource();
    const dataSourceHooks = toDataSourceHook(dataSource);

    const { data, loading, refetch } = dataSourceHooks.useFindMany({
        modelName: toModelName,
        query: {
            pageIndex: 1,
            pageSize: 1,
            references: {
                fromModelName,
                fromFieldName,
                fromObjectId,
                toModelName,
            },
        },
    });

    // const { state, data } = useAsync<{ data: IEntityObject[]; count: number }>(() => {
    //     if (toDS) {
    //         return toDS.findMany({
    //             pageIndex: 1,
    //             pageSize: 1,
    //             references: {
    //                 fromModelName,
    //                 fromFieldName,
    //                 fromObjectId,
    //                 toModelName,
    //             },
    //         });
    //     }
    //     return Promise.resolve({ data: [], count: 0 });
    // }, [fromModelName, fromFieldName, fromObjectId, toModelName]);

    if (!loading) {
        if (data?.data?.length === 0) {
            return (
                <EntityViewContainer
                    modelName={toModelName}
                    viewType={viewType || 'grid'}
                    behavior={{ ...behavior, toCreating: true }}
                    reference={ref}
                    baseObjectId={createId()}
                />
            );
        } else {
            return (
                <EntityViewContainer
                    modelName={toModelName}
                    viewType={viewType || 'grid'}
                    behavior={behavior}
                    reference={ref}
                    baseObjectId={data?.data?.[0].id}
                />
            );
        }
    } else {
        return <div>...xxx</div>;
    }
}
