'use client';

import '@mantine/dates/styles.css';

import type { EntityWidgetProps } from '../../../../components/types';

import dayjs from 'dayjs';
import { useState } from 'react';
import { Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

type DateOptions = {
    format?: string;
};

export function DateComp(props: EntityWidgetProps) {
    const { value, object, model, field, behavior, fieldControl } = props;
    const options = (field.widgetOptions || {}) as DateOptions;
    const [rootObjectId, setRootObjectId] = useState<string | undefined>(object?.id);

    if (behavior.mode === 'edit') {
        // 编辑模式下的逻辑
        return (
            <DatePickerInput
                clearable
                valueFormat={options.format || 'YYYY-MM-DD'}
                placeholder={field.description || '选择日期...'}
                value={fieldControl?.value}
                onChange={fieldControl?.onChange}
                onBlur={fieldControl?.onBlur}
            />
        );
    } else {
        return (
            <Text size="sm" lineClamp={1} style={props.style} className={props.className}>
                {value !== undefined ? dayjs(value).format(options.format || 'YYYY-MM-DD') : 'N/A'}
            </Text>
        );
    }
}
