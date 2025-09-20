import React from 'react';

import { ReferenceEditComp } from './reference-edit-comp';
import { ReferenceEditMMComp } from './reference-edit-mm-comp';
import { ReferenceDisplayComp } from './reference-display-comp';
import { ReferenceDisplayMMComp } from './reference-display-mm-comp';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class ReferenceWidget extends EntityWidget {
    readonly info = {
        widgetName: 'reference',
        displayName: '数据引用部件',
        icon: 'reference_icon',
        description: '用于引用数据编辑和显示的组件',
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

        if (modelField.type === 'one_to_many') {
            if (props.behavior.mode === 'edit') {
                return <ReferenceEditComp {...props} />;
            }
            return <ReferenceDisplayComp {...props} referenceModelName={refModel} />;
        } else {
            if (props.behavior.mode === 'edit') {
                return <ReferenceEditMMComp {...props} />;
            }
            return <ReferenceDisplayMMComp {...props} referenceModelName={refModel} />;
        }
    };
}
