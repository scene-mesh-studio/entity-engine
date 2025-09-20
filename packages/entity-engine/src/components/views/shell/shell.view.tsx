import type { EntityViewProps, IEntityViewMetaInfo } from '../../types';

import React from 'react';

import { EntityView } from '../../types';
import { EntityShellViewComp } from './shell-view-comp';

export class ShellView extends EntityView {
    readonly info: IEntityViewMetaInfo = {
        viewName: 'shell',
        displayName: '骨架视图',
        icon: 'shell_icon',
        description: '实体数据的骨架视图',
    };

    readonly Component: React.FC<EntityViewProps> = (props) => <EntityShellViewComp {...props} />;
}
