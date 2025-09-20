import React from 'react';

import { MarkdownComp } from './markdown-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class MarkdownWidget extends EntityWidget {
    readonly info = {
        widgetName: 'markdown',
        displayName: 'Markdown组件',
        icon: 'markdown_icon',
        description: '用于Markdown内容的显示或编辑的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <MarkdownComp {...props} />;
}
