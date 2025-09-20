import React from 'react';

import { NumberComp } from './number-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class NumberWidget extends EntityWidget {
    readonly info = {
        widgetName: 'number',
        displayName: '数字组件',
        icon: 'number_icon',
        description: '用于数字的显示或编辑的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <NumberComp {...props} />;
}
