import type { EntityViewProps, IEntityViewMetaInfo } from '../../types';

import React from 'react';

import { EntityView } from '../../types';
import { EntityGridViewComp } from './grid-view-comp';

export class GridView extends EntityView {
    readonly info: IEntityViewMetaInfo = {
        viewName: 'grid',
        displayName: '网格视图',
        icon: 'grid_icon',
        description: '实体数据的网格视图',
    };

    readonly Component: React.FC<EntityViewProps> = (props) => <EntityGridViewComp {...props} />;
}
