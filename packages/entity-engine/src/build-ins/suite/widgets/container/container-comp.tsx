'use client';

import type { IEntityEngine } from '../../../../core';
import type { IEntityObject } from '../../../../types';
import type { EntityWidgetProps } from '../../../../components/types';

import { Box } from '@mantine/core';
import { createId } from '@paralleldrive/cuid2';

import { toDataSourceHook } from '../../../../lib/hooks';
import {
    useEntityEngine,
    EntityViewContainer,
    useEntityEngineTheme,
    useEntityEngineRouter,
    useMasterDetailViewContainer,
} from '../../../../uikit';

export function ContainerComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;
    const { theme } = useEntityEngineTheme();
    const engine = useEntityEngine();
    const { broadcast, currentAction } = useMasterDetailViewContainer();
    const router = useEntityEngineRouter();

    const handleObjectChanged = (obj: IEntityObject) => {
        console.log(`handleObjectChanged: ${obj.id}`);
        // performAction('updateData', { modelName: model.name }, obj);
        broadcast('updateData', obj);
    };

    if (currentAction?.actionType === 'hidden') {
        return <Box style={{ display: 'none' }} />;
    }
    if (currentAction?.actionType === 'view') {
        // console.log(`currentAction >>>>>>>>>>> ${currentAction.contextObject.id}`);
        return (
            <EntityViewContainer
                modelName={currentAction.payload.modelName}
                viewType={currentAction.payload.viewType}
                viewName={currentAction.payload.viewName}
                baseObjectId={currentAction.contextObject?.id || ''}
                behavior={behavior}
                callbacks={{
                    onObjectCreated: handleObjectChanged,
                    onObjectUpdated: handleObjectChanged,
                    onObjectDeleted: handleObjectChanged,
                }}
            />
        );
    }
    if (currentAction?.actionType === 'comp') {
        const Comp = currentAction.payload.comp;
        return <Comp />;
    }

    if (currentAction?.actionType === 'reference-view') {
        const { fromFieldName, toModelName, viewType } = currentAction.payload;
        const fromField = model.findFieldByName(fromFieldName);
        if (fromField?.type === 'one_to_one' || fromField?.type === 'many_to_one') {
            const ref = {
                fromModelName: model.name,
                fromFieldName,
                fromObjectId: currentAction.contextObject.id,
                toModelName,
            };
            return (
                <InnerOneViewContainer
                    toModelName={toModelName}
                    viewType={viewType}
                    ref={ref}
                    fromModelName={model.name}
                    fromFieldName={fromFieldName}
                    fromObjectId={currentAction.contextObject.id}
                    behavior={behavior}
                    engine={engine}
                />
            );
        } else {
            if (fromFieldName && toModelName) {
                const ref = {
                    fromModelName: model.name,
                    fromFieldName,
                    fromObjectId: currentAction.contextObject.id,
                    toModelName,
                };
                return (
                    <EntityViewContainer
                        modelName={toModelName}
                        viewType={viewType || 'grid'}
                        behavior={{ ...behavior }}
                        reference={ref}
                        baseObjectId={currentAction.contextObject.id}
                    />
                );
            }
        }

        return <div>...</div>;
    }
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
