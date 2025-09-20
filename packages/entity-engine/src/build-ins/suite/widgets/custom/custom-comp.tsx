'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { EntityNamedRenderer } from '../../../../uikit';

export function CustomComp(props: EntityWidgetProps) {
    const { field } = props;
    const compName = field?.widgetOptions?.comp;
    if (compName && typeof compName === 'string') {
        return <EntityNamedRenderer name={compName} {...props} />;
    }
}
