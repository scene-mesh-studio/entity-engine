import type { EntityViewProps, IEntityViewMetaInfo } from '../../types';

import React from 'react';

import { EntityView } from '../../types';
import { EntityDashboardViewComp } from './dashboard-view-comp';

export class DashboardView extends EntityView {
    readonly info: IEntityViewMetaInfo = {
        viewName: 'dashboard',
        displayName: '仪表盘',
        icon: 'dashboard_icon',
        description: '实体数据的仪表盘视图',
    };

    readonly Component: React.FC<EntityViewProps> = (props) => (
        <EntityDashboardViewComp {...props} />
    );
}
