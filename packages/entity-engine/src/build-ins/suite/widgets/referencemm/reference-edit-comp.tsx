'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { EntityViewContainer, useEntityEngineTheme } from '../../../../uikit';

export function ReferenceEditComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;
    const { theme } = useEntityEngineTheme();

    const modelField = model.findFieldByName(field.name);
    const refModelName = modelField?.refModel;

    if (!refModelName) {
        return <div>未找到引用模型</div>;
    }

    return (
        <EntityViewContainer
            viewType="grid"
            modelName={refModelName}
            baseObjectId={object?.id}
            behavior={{ mode: 'edit' }}
            callbacks={{
                onObjectDeleted: (obj) => console.log('onObjectDeleted', obj),
                onObjectCreated: (obj) => console.log('onObjectCreated', obj),
                onObjectUpdated: (obj) => console.log('onObjectUpdated', obj),
            }}
            reference={{
                fromModelName: model.name,
                fromFieldName: modelField.name,
                fromObjectId: object?.id || '',
                toModelName: refModelName,
            }}
        />
    );
}
