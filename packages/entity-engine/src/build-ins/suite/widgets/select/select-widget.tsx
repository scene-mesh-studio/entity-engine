import React from 'react';

import { SelectComp } from './select-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class SelectWidget extends EntityWidget {
    readonly info = {
        widgetName: 'select',
        displayName: '选择框',
        icon: 'select_icon',
        description: '用于单选或多选的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <SelectComp {...props} />;
}
