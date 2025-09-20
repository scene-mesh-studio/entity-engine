import React from 'react';

import { EntityActionWidget } from './action-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class ActionWidget extends EntityWidget {
    readonly info = {
        widgetName: 'action',
        displayName: '动作组件',
        icon: 'action_icon',
        description: '用于显示动作的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <EntityActionWidget {...props} />;
}
