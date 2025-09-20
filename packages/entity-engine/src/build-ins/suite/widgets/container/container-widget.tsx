import React from 'react';

import { ContainerCompEx } from './container-compex';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class ContainerWidget extends EntityWidget {
    readonly info = {
        widgetName: 'container',
        displayName: '容器组件',
        icon: 'container_icon',
        description: '用于显示视图的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <ContainerCompEx {...props} />;
}
