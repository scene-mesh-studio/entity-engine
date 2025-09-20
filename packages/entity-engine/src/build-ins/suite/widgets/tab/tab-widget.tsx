import React from 'react';

import { TabComp } from './tab-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class TabWidget extends EntityWidget {
    readonly info = {
        widgetName: 'tab',
        displayName: '选项卡组件',
        icon: 'tab_icon',
        description: '用于选项卡的显示组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <TabComp {...props} />;
}
