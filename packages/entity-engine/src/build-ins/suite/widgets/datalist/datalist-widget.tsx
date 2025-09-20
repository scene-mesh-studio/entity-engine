import React from 'react';

import { DatalistComp } from './datalist-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class DatalistWidget extends EntityWidget {
    readonly info = {
        widgetName: 'datalist',
        displayName: '数据列表组件',
        icon: 'datalist_icon',
        description: '用于显示数据列表的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <DatalistComp {...props} />;
}
