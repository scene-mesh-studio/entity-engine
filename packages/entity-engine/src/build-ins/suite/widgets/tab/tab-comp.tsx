'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Tabs } from '@mantine/core';
import { Icon } from '@iconify/react';
import React, { useEffect, useCallback } from 'react';

import { ViewContainerProvider, useMasterDetailViewContainer } from '../../../../uikit';
import { EntityViewContainerPlaceholder } from '../../../../uikit/surface/view-container-placeholder';

export function TabComp(props: EntityWidgetProps) {
    const { currentAction, parentContext } = useMasterDetailViewContainer();
    return (
        <ViewContainerProvider parentContext={parentContext}>
            <InnerTabComp {...props} />
        </ViewContainerProvider>
    );
}

export function InnerTabComp(props: EntityWidgetProps) {
    const {
        value,
        object,
        model,
        view,
        field: viewField,
        behavior,
        fieldControl,
        fieldState,
    } = props;
    const [tabValue, setTabValue] = React.useState(0);
    const [localCurrentAction, setLocalCurrentAction] = React.useState<any>(undefined);
    const { performAction, currentAction, parentContext } = useMasterDetailViewContainer();
    const [lastContext, setLastContext] = React.useState<any>(parentContext);

    useEffect(() => {
        if (currentAction) {
            setTabValue(currentAction?.payload.tabIndex || 0);
        }
    }, [currentAction?.payload, parentContext]);

    const handleChange = useCallback(
        (newValue: string | null) => {
            const indexInt = parseInt(newValue || '0', 10);
            const tf = viewField?.fields?.[indexInt];
            if (tf && tf.widgetOptions?.actionType) {
                const _ca = {
                    actionType: tf.widgetOptions?.actionType as string,
                    payload: { ...(tf.widgetOptions?.payload as any), tabIndex: indexInt },
                    contextObject: currentAction?.contextObject || { id: object?.id || '' },
                };
                // setLocalCurrentAction(_ca);
                performAction(_ca);
            }
            setTabValue(parseInt(newValue || '0', 10));
        },
        [currentAction?.contextObject, object?.id, viewField?.fields]
    );

    // if (lastContext) {
    return (
        <>
            {/* {JSON.stringify(currentAction)} */}
            <Tabs value={String(tabValue)} onChange={handleChange} aria-label="basic tabs example">
                <Tabs.List>
                    {viewField?.fields?.map((field, index) => (
                        <Tabs.Tab
                            leftSection={field.icon && <Icon icon={field.icon} />}
                            key={index}
                            value={String(index)}
                        >
                            {field.title}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>
            <EntityViewContainerPlaceholder
                {...props}
                currentAction={localCurrentAction}
                withoutProvider
                modelName={model.name}
                viewType={view.viewType}
                viewName={view.name}
                baseObjectId={object?.id || ''}
                reference={undefined}
            >
                ...
            </EntityViewContainerPlaceholder>
        </>
    );
}
