'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Chip } from '@mantine/core';

export function CheckboxComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;

    const { yesLabel, noLabel } = field?.widgetOptions ?? { yesLabel: '是', noLabel: '否' };

    if (behavior.mode === 'display') {
        return (
            <Chip defaultChecked={value} size="xs">
                {field.title}
            </Chip>
        );
    } else {
        return (
            <Chip
                checked={fieldControl?.value}
                onChange={fieldControl?.onChange}
                onBlur={fieldControl?.onBlur}
                size="xs"
                style={props.style}
                className={props.className}
            >
                {field.title}
            </Chip>
        );
    }
}
