import React from 'react';

import { ReferenceEditComp } from './reference-edit-comp';
import { ReferenceDisplayComp } from './reference-display-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class ReferenceMMWidget extends EntityWidget {
    readonly info = {
        widgetName: 'referencemm',
        displayName: '多对多数据部件',
        icon: 'referencemm_icon',
        description: '用于多对多引用数据编辑和显示的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => {
        const { model, field: viewField } = props;
        const modelField = model.findFieldByName(viewField.name);

        if (!modelField) {
            return (
                <div>
                    Model field {viewField.name} not found in model {model.name}
                </div>
            );
        }
        const refModel = modelField.refModel;
        if (!refModel) {
            return (
                <div>
                    Reference model not found for field {viewField.name} in model {model.name}
                </div>
            );
        }

        if (props.behavior.mode === 'edit') {
            return <ReferenceEditComp {...props} />;
        }
        return <ReferenceDisplayComp {...props} referenceModelName={refModel} />;
    };
}
