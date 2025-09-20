import type { EntityViewProps, IEntityViewMetaInfo } from '@scenemesh/entity-engine';

import React from 'react';
import { EntityView } from '@scenemesh/entity-engine';

import { SplashViewComp } from './splash-view-comp';

export class SplashView extends EntityView {
    readonly info: IEntityViewMetaInfo = {
        viewName: 'splash',
        displayName: '启动/开屏视图',
        icon: 'splash_icon',
        description: '开屏视图',
    };

    readonly Component: React.FC<EntityViewProps> = (props) => <SplashViewComp {...props} />;
}
