import React from 'react';

import { DateComp } from './date-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class DateWidget extends EntityWidget {
    readonly info = {
        widgetName: 'date',
        displayName: '日期组件',
        icon: 'date_icon',
        description: '用于显示日期的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <DateComp {...props} />;
}
