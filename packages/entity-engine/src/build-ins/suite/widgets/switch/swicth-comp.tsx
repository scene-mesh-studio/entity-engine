'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Badge, Switch } from '@mantine/core';

export function SwitchComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;

    const { yesLabel, noLabel } = field?.widgetOptions ?? { yesLabel: '是', noLabel: '否' };

    if (behavior.mode === 'display') {
        return (
            <Badge color={value ? 'green' : 'red'} style={props.style} className={props.className}>
                {value ? (yesLabel as string) : (noLabel as string)}
            </Badge>
        );
    } else {
        return (
            <Switch
                size="md"
                onLabel={yesLabel as string}
                offLabel={noLabel as string}
                {...fieldControl}
                checked={fieldControl?.value}
            />
        );
    }
}
