import type { EntityViewProps, IEntityViewMetaInfo } from '@scenemesh/entity-engine';

import React from 'react';
import { EntityView } from '@scenemesh/entity-engine';

import { AuthViewLoginComp } from './auth-view-comp';

export class AuthView extends EntityView {
    readonly info: IEntityViewMetaInfo = {
        viewName: 'auth',
        displayName: '认证视图',
        icon: 'auth_icon',
        description: '认证视图, 包含登录、注册等功能',
    };

    readonly Component: React.FC<EntityViewProps> = (props) => <AuthViewLoginComp {...props} />;
}
