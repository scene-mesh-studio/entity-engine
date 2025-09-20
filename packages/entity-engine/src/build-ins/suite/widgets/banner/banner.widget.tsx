import React from 'react';

import { BannerComp } from './banner-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class BannerWidget extends EntityWidget {
    readonly info = {
        widgetName: 'banner',
        displayName: '横幅组件',
        icon: 'banner_icon',
        description: '用于展示横幅信息的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <BannerComp {...props} />;
}
