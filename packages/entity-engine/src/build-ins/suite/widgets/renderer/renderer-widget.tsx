import React from 'react';

import { RendererComp } from './renderer-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class RendererWidget extends EntityWidget {
    readonly info = {
        widgetName: 'renderer',
        displayName: '渲染器组件',
        icon: 'renderer_icon',
        description: '用于渲染器的显示组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <RendererComp {...props} />;
}
