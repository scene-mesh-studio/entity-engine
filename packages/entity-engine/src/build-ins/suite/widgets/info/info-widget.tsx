import React from 'react';

import { InfoComp } from './info-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class InfoWidget extends EntityWidget {
    readonly info = {
        widgetName: 'info',
        displayName: '信息摘要组件',
        icon: 'info_icon',
        description: '用于信息摘要的显示组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => (
        <InfoComp {...props} behavior={{ ...props.behavior, mode: 'display' }} />
    );
}
