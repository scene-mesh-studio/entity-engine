import React from 'react';

import { EntityObjectIdWidget } from './id-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class IdWidget extends EntityWidget {
    readonly info = {
        widgetName: 'id',
        displayName: 'ID组件',
        icon: 'id_icon',
        description: '用于显示ID的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => (
        <EntityObjectIdWidget {...props} />
    );
}
