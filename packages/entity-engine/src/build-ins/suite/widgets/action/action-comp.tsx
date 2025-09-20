'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Icon } from '@iconify/react';
import { Button } from '@mantine/core';

import {
    useEntityEngineTheme,
    useEntityEngineRouter,
    useMasterDetailViewContainer,
} from '../../../../uikit';

export function EntityActionWidget(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;
    const { theme } = useEntityEngineTheme();
    const router = useEntityEngineRouter();
    const { performAction } = useMasterDetailViewContainer();

    const handleAction = () => {
        console.log('handleAction');
        if (field?.widgetOptions) {
            const { actionType, payload, target } = field.widgetOptions;
            console.log('actionType', actionType, payload);
            if (actionType === 'route') {
                if (typeof payload === 'object' && typeof (payload as any).path !== 'string') {
                    console.error('Route action requires a path in payload');
                    router.navigate((payload as any).path);
                    return;
                }
            } else {
                performAction({
                    actionType: actionType as string,
                    payload,
                    contextObject: object,
                    target: target as string | undefined,
                });
            }
        }
    };

    return (
        <Button
            variant="outline"
            leftSection={field?.icon ? <Icon icon={field.icon} /> : null}
            size="xs"
            radius="md"
            onClick={handleAction}
            style={props.style}
            className={props.className}
        >
            {field?.title || '动作'}
        </Button>
    );
}
