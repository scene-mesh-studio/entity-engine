'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import remarkGfm from 'remark-gfm';
import Markdown from 'react-markdown';
import MDEditor from '@uiw/react-md-editor';

export function MarkdownComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;

    if (behavior.mode === 'display') {
        return (
            // <Text size="sm" lineClamp={1} style={props.style} className={props.className}>
            //     {value !== undefined ? value.toString() : 'N/A'}
            // </Text>
            <Markdown remarkPlugins={[remarkGfm]}>
                {value !== undefined ? value.toString() : ''}
            </Markdown>
        );
    } else {
        return (
            <MDEditor
                {...fieldControl}
                textareaProps={{
                    placeholder: field?.description,
                    maxLength: 102400, // 100KB
                    style: { minHeight: 120, ...props.style },
                }}
            />
        );
    }
}
