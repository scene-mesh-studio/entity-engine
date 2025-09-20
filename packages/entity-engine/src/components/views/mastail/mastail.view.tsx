import type { EntityViewProps, IEntityViewMetaInfo } from '../../types';

import React from 'react';

import { EntityView } from '../../types';
import { EntityMasterDetailViewComp } from './mastail-view-comp';

export class MasterDetailView extends EntityView {
    readonly info: IEntityViewMetaInfo = {
        viewName: 'mastail',
        displayName: '主从视图',
        icon: 'mastail_icon',
        description: '实体数据的主从视图',
    };

    readonly Component: React.FC<EntityViewProps> = (props) => (
        <EntityMasterDetailViewComp {...props} />
    );
}
