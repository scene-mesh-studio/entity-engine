'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Badge } from '@mantine/core';

import { toDataSourceHook } from '../../../../lib/hooks';
import { useEntityEngine, useEntityEngineTheme } from '../../../../uikit';

type ReferenceDisplayCompProps = EntityWidgetProps & {
    referenceModelName: string;
};

export function ReferenceDisplayComp(props: ReferenceDisplayCompProps) {
    const { value, object, model, view, field, referenceModelName } = props;
    const { theme } = useEntityEngineTheme();
    const engine = useEntityEngine();

    const dataSource = engine.datasourceFactory.getDataSource();
    const dsHooks = toDataSourceHook(dataSource);

    const refModel = engine.metaRegistry.getModel(referenceModelName);

    const { data: count, loading: countLoading } = dsHooks.useFindReferencesCount({
        fromModelName: model.name,
        fromFieldName: field.name,
        fromObjectId: object?.id || '',
        toModelName: referenceModelName,
    });

    if (countLoading) {
        return <div>...</div>;
    }

    return (
        <Badge variant="light" size="md" radius="md">
            {refModel?.title}({count || 0})
        </Badge>
    );
}
