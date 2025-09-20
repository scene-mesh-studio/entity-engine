import type { EntityViewProps, IEntityViewMetaInfo } from '../../types';

import React from 'react';

import { EntityView } from '../../types';
import { EntityKanbanViewComp } from './kanban-view-comp';

export class KanbanView extends EntityView {
    readonly info: IEntityViewMetaInfo = {
        viewName: 'kanban',
        displayName: '看板视图',
        icon: 'kanban_icon',
        description: '看板视图',
    };

    readonly Component: React.FC<EntityViewProps> = (props) => <EntityKanbanViewComp {...props} />;
}
