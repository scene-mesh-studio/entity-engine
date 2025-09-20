'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Text, NumberInput } from '@mantine/core';

export function NumberComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;

    const { yesLabel, noLabel } = field?.widgetOptions ?? { yesLabel: '是', noLabel: '否' };

    if (behavior.mode === 'display') {
        return (
            <Text size="sm" lineClamp={1} style={props.style} className={props.className}>
                {value !== undefined ? value.toString() : 'N/A'}
            </Text>
        );
    } else {
        return <NumberInput placeholder={field?.description} {...fieldControl} />;
    }
}
