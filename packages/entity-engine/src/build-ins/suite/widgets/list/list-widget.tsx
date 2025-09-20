import React from 'react';

import { ListComp } from './list-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class ListWidget extends EntityWidget {
    readonly info = {
        widgetName: 'list',
        displayName: '列表组件',
        icon: ' list_icon',
        description: '用于显示列表项的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <ListComp {...props} />;
}
