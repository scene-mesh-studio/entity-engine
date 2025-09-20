import React from 'react';

import { LogoComp } from './logo-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class LogoWidget extends EntityWidget {
    readonly info = {
        widgetName: 'logo',
        displayName: 'LOGO组件',
        icon: 'logo_icon',
        description: '用于LOGO信息的显示组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <LogoComp {...props} />;
}
