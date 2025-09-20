'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Text, PasswordInput } from '@mantine/core';

export function PasswordComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;

    const { yesLabel, noLabel } = field?.widgetOptions ?? { yesLabel: '是', noLabel: '否' };

    if (behavior.mode === 'display') {
        return (
            <Text size="sm" lineClamp={1} style={props.style} className={props.className}>
                ******
            </Text>
        );
    } else {
        return <PasswordInput placeholder={field?.description || '请输入密码'} {...fieldControl} />;
    }
}
