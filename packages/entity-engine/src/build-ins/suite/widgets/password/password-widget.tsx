import React from 'react';

import { PasswordComp } from './password-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class PasswordWidget extends EntityWidget {
    readonly info = {
        widgetName: 'password',
        displayName: '密码框组件',
        icon: 'password_icon',
        description: '用于密码的显示或编辑的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <PasswordComp {...props} />;
}
