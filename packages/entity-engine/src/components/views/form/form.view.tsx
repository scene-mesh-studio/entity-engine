import type { EntityViewProps, IEntityViewMetaInfo } from '../../types';

import React from 'react';

import { EntityView } from '../../types';
import { EntityFormViewComp } from './form-view-comp';

export class FormView extends EntityView {
    readonly info: IEntityViewMetaInfo = {
        viewName: 'form',
        displayName: '表单视图',
        icon: 'form_icon',
        description: '实体数据的编辑或查看视图',
    };

    readonly Component: React.FC<EntityViewProps> = (props) => <EntityFormViewComp {...props} />;
}
