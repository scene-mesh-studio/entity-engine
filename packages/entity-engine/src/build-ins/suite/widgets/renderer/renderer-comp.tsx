'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { useEntityEngine, EntityNamedRenderer } from '../../../../uikit';

export function RendererComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;
    const engine = useEntityEngine();

    const { rendererName, slotName } = field?.widgetOptions ?? {};
    if (rendererName) {
        return (
            <EntityNamedRenderer
                {...props}
                viewData={view}
                model={model}
                name={rendererName as string | undefined}
                slotName={slotName as string | undefined}
            />
        );
    }
    return null;
}
