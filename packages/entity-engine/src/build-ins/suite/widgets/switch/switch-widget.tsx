import React from 'react';

import { SwitchComp } from './swicth-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class SwitchWidget extends EntityWidget {
    readonly info = {
        widgetName: 'switch',
        displayName: '状态切换组件',
        icon: 'switch_icon',
        description: '用于布尔状态的显示或编辑的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <SwitchComp {...props} />;
}
