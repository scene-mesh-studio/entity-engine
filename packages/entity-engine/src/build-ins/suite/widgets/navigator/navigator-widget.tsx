import React from 'react';

import { NavigatorComp } from './navigator-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class NavigatorWidget extends EntityWidget {
    readonly info = {
        widgetName: 'navigator',
        displayName: '导航拦组件',
        icon: 'navigator_icon',
        description: '用于导航拦的显示组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <NavigatorComp {...props} />;
}
