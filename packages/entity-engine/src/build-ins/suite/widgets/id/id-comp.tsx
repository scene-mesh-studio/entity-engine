'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Badge } from '@mantine/core';

import { useEntityEngineTheme } from '../../../../uikit';

export function EntityObjectIdWidget(props: EntityWidgetProps) {
    const {
        value,
        object,
        model,
        view,
        field,
        behavior,
        fieldControl,
        fieldState,
        style,
        className,
    } = props;
    const { theme } = useEntityEngineTheme();
    const idValue = value || object?.id || '';
    return (
        <Badge
            color={theme.colors.primary}
            variant="light"
            size="md"
            radius="md"
            style={{ cursor: 'pointer', ...style }}
            className={className}
        >
            {idValue || '<ID>'}
        </Badge>
    );
}
