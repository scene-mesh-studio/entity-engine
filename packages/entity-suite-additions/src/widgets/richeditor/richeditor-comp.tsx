'use client';

import '@mantine/tiptap/styles.css';

import type { EntityWidgetProps } from '@scenemesh/entity-engine';

import { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight'; ///extension-highlight
import SubScript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import { Link, RichTextEditor } from '@mantine/tiptap';
import Superscript from '@tiptap/extension-superscript';

export function RichTextEditorComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;

    if (behavior.mode === 'display') {
        const html = value !== undefined ? value.toString() : '';
        return (
            // <Text size="sm" lineClamp={1} style={props.style} className={props.className}>
            //     {value !== undefined ? value.toString() : 'N/A'}
            // </Text>
            <div dangerouslySetInnerHTML={{ __html: html }} />
        );
    } else {
        return <InnerRichTextEditorComp {...props} style={{ minHeight: 120, ...props.style }} />;
    }
}

function InnerRichTextEditorComp(props: EntityWidgetProps) {
    const contentValue = props.fieldControl?.value ?? props.value ?? '';
    const _editor = useEditor({
        extensions: [
            StarterKit.configure({
                // 从 StarterKit 中排除重复的扩展
                link: false,
            }),
            Highlight,
            Superscript,
            SubScript,
            Link.configure({
                openOnClick: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: contentValue,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            // onChange?.(html);
            props.fieldControl?.onChange?.(html);
        },
        onBlur: ({ editor }) => {
            props.fieldControl?.onBlur?.();
        },
        onFocus: ({ editor }) => {
            const html = editor.getHTML();
            props.fieldControl?.onChange?.(html);
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        if (_editor && contentValue !== _editor.getHTML()) {
            _editor.commands.setContent(contentValue);
        }
    }, [contentValue, _editor]);

    return (
        <RichTextEditor editor={_editor} variant="subtle">
            <RichTextEditor.Toolbar sticky stickyOffset="var(--docs-header-height)">
                <RichTextEditor.ControlsGroup>
                    <RichTextEditor.Bold />
                    <RichTextEditor.Italic />
                    <RichTextEditor.Underline />
                    <RichTextEditor.Strikethrough />
                    <RichTextEditor.ClearFormatting />
                    <RichTextEditor.Highlight />
                    <RichTextEditor.Code />
                </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>

            <RichTextEditor.Content />
        </RichTextEditor>
    );
}
