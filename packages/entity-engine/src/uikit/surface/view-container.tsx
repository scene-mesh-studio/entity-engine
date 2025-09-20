import type {
    EntityView,
    EntityViewProps,
    EntityViewBehaviorType,
    EntityViewCallbacksType,
} from '../../components';

import { EntityNamedRenderer } from './named-renderer';
import { EntityViewContainerPlaceholder } from './view-container-placeholder';
import {
    useEntityEngine,
    ViewContainerProvider,
    EntityPermissionGuard,
    useEntityPermissionGuard,
    useMasterDetailViewContainer,
} from '../provider';

export type EntityViewContainerProps = {
    modelName: string;
    viewType: string;
    viewName?: string;
    baseObjectId?: string;
    behavior?: EntityViewBehaviorType;
    callbacks?: EntityViewCallbacksType;
    reference?: {
        fromModelName: string;
        fromFieldName: string;
        fromObjectId: string;
        toModelName: string;
    };
    viewOptions?: {
        [key: string]: any;
    };
    containerName?: string;
    withoutProvider?: boolean; // 是否不使用 ViewContainerProvider 包裹
};

export function EntityViewContainer(props: EntityViewContainerProps) {
    const {
        modelName,
        viewType,
        viewName,
        baseObjectId,
        behavior,
        callbacks,
        reference,
        viewOptions,
        containerName,
        withoutProvider = false, // 默认使用 Provider
    } = props;
    const engine = useEntityEngine();
    const permissionGuard = useEntityPermissionGuard();
    const { currentAction } = useMasterDetailViewContainer();

    const model = engine.metaRegistry.getModel(modelName);
    const viewData = engine.metaRegistry.findView(modelName, viewType, viewName);

    const viewComp = engine.componentRegistry.getView(viewType);

    if (!viewData) {
        return (
            <div>
                The view(viewType: {viewType}, viewName: {viewName}, modelName: {modelName}) was not
                found
            </div>
        );
    }
    if (!viewComp) {
        return <div>The view component for viewType: {viewType} was not found</div>;
    }
    if (!model) {
        return <div>The model {modelName} was not found</div>;
    }

    // const canRead = await permissionGuard.checkPermission({
    //     action: 'read',
    //     modelName: model.name,
    //     objectId: baseObjectId
    // });
    // if (!canRead){
    //     return <div>You do not have permission to view this data.</div>;
    // }

    const finalViewData = viewData.toSupplementedView(viewOptions);

    const viewProps: EntityViewProps = {
        model,
        viewData: finalViewData,
        baseObjectId,
        behavior: behavior || { mode: 'display' },
        reference,
        callbacks,
    };

    if (!withoutProvider) {
        return (
            <ViewContainerProvider
                parentContext={currentAction?.contextObject}
                containerName={containerName}
            >
                <EntityViewContainerPlaceholder {...props}>
                    <InnerViewContainer {...viewProps} viewComp={viewComp} />
                </EntityViewContainerPlaceholder>
            </ViewContainerProvider>
        );
    } else {
        return <InnerViewContainer {...viewProps} viewComp={viewComp} />;
    }
}

type InnerViewContainerProps = EntityViewProps & {
    viewComp: EntityView<EntityViewProps>;
};

function InnerViewContainer(props: InnerViewContainerProps) {
    const { viewComp } = props;

    return (
        <EntityPermissionGuard
            action={{
                action: 'read',
                modelName: props.model.name,
                objectId: props.baseObjectId,
            }}
        >
            <div style={{ position: 'relative' }}>
                <viewComp.Component {...props} />
                <EntityNamedRenderer
                    {...props}
                    slotName="view-inspector"
                    render={(comp) => (
                        <div style={{ position: 'absolute', top: 0, right: 0 }}>{comp}</div>
                    )}
                />
            </div>
        </EntityPermissionGuard>
    );
}
