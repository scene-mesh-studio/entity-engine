import React from 'react';

import { CheckboxComp } from './checkbox-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class CheckboxWidget extends EntityWidget {
    readonly info = {
        widgetName: 'checkbox',
        displayName: '复选框组件',
        icon: 'checkbox_icon',
        description: '用于布尔状态的显示或编辑的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <CheckboxComp {...props} />;
}
