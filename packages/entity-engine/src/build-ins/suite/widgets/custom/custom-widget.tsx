import React from 'react';

import { CustomComp } from './custom-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class CustomWidget extends EntityWidget {
    readonly info = {
        widgetName: 'custom',
        displayName: '自定义组件',
        icon: 'custom_icon',
        description: '用于显示自定义的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <CustomComp {...props} />;
}
