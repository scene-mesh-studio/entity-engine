import React from 'react';

import { StatCardComp } from './statcard-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class StatCardWidget extends EntityWidget {
    readonly info = {
        widgetName: 'statcard',
        displayName: '统计卡片组件',
        icon: 'statcard_icon',
        description: '用于展示统计信息的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <StatCardComp {...props} />;
}
