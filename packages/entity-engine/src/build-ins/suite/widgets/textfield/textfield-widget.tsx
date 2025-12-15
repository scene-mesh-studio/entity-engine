import React from 'react';
import { Text, Textarea, TextInput } from '@mantine/core';

import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class TextfieldWidget extends EntityWidget {
    readonly info = {
        widgetName: 'textfield',
        displayName: '文本框',
        icon: 'textfield_icon',
        description: '用于单行文本编辑和显示的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => (
        <InnerTextfieldWidget {...props} />
    );
}

function InnerTextfieldWidget(props: EntityWidgetProps) {
    const { value, model, view, field, behavior, fieldControl, fieldState, style, className } =
        props;
    const multiline = field?.widgetOptions?.multiline || false;
    const fontSize = field?.widgetOptions?.fontSize || 'sm';
    const fontWeight = field?.widgetOptions?.fontWeight || '500';
    const fontStyle = field?.widgetOptions?.fontStyle || '';
    const fontColor = field?.widgetOptions?.fontColor || 'black';
    const minRowsValue = field?.widgetOptions?.minRows;
    const minRows =
        typeof minRowsValue === 'number'
            ? minRowsValue
            : typeof minRowsValue === 'string' && !isNaN(Number(minRowsValue))
              ? Number(minRowsValue)
              : 3;

    if (behavior.mode === 'display') {
        // return <div className="rounded w-full">{value || '无内容'}</div>;
        return (
            <Text
                size={fontSize as any}
                fw={fontWeight as any}
                fs={fontStyle as any}
                c={fontColor as any}
                lineClamp={multiline ? undefined : 1}
                style={style}
                className={className}
            >
                {value || '无内容'}
            </Text>
        );
    } else if (behavior.mode === 'edit') {
        if (multiline) {
            return (
                <Textarea
                    placeholder={field?.description || '请输入...'}
                    {...fieldControl}
                    minRows={minRows}
                    rows={minRows}
                />
            );
        } else {
            return <TextInput placeholder={field?.description || '请输入...'} {...fieldControl} />;
        }
    }

    return <div>Unsupported behavior mode: {behavior.mode}</div>;
}
