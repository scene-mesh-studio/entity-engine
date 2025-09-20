import type { EntityWidgetProps } from '@scenemesh/entity-engine';

import React from 'react';
import { EntityWidget } from '@scenemesh/entity-engine';

import { RichTextEditorComp } from './richeditor-comp';

export class RichTextEditorWidget extends EntityWidget {
    readonly info = {
        widgetName: 'richeditor',
        displayName: '富文本框',
        icon: 'richeditor_icon',
        description: '用于富文本编辑和显示的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <RichTextEditorComp {...props} />;
}
