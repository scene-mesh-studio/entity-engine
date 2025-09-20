'use client';

import type { IEntityQuery } from '../../../../types';
import type { EntityWidgetProps } from '../../../../components/types';

import { useState } from 'react';

import { useEntityEngine, EntityViewContainer } from '../../../../uikit';

type DatalistOptions = {
    query?: IEntityQuery;
    modelName?: string;
    viewName?: string;
};

export function DatalistComp(props: EntityWidgetProps) {
    const { object, model, field } = props;
    const options = (field.widgetOptions || {}) as DatalistOptions;
    const [rootObjectId, setRootObjectId] = useState<string | undefined>(object?.id);
    const engine = useEntityEngine();

    const viewOptions = {
        // query: options.query,
        hideToolbar: true,
        hideEditColumn: true,
        hidePagination: true,
    };

    return (
        <EntityViewContainer
            modelName={options.modelName || model.name}
            viewType="grid"
            viewName={options.viewName}
            viewOptions={viewOptions}
            withoutProvider
        />
    );
}
