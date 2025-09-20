import React from 'react';

import { GraphComp } from './graph-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class GraphWidget extends EntityWidget {
    readonly info = {
        widgetName: 'graph',
        displayName: '图/树组件',
        icon: 'graph_icon',
        description: '用于显示树状/图的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <GraphComp {...props} />;
}
