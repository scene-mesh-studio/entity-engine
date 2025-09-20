import type { IEntityObject, EntityCSSProperties } from '../../types';
import type {
    IEntityEngine,
    IEntityViewDelegate,
    IEntityModelDelegate,
    IEntityFieldDelegate,
    IEntityViewFieldDelegate,
} from '../../core';
import type {
    EntityWidget,
    EntityWidgetProps,
    EntityViewBehaviorType,
    EntityWidgetFieldState,
    EntityWidgetFieldControlProps,
} from '../../components';

import React from 'react';
import { Icon } from '@iconify/react';

import { useEntityEngine, useEntitySuiteAdapter } from '../../uikit';

export type EntityWidgetRendererProps = {
    widgetName: string;
    view: IEntityViewDelegate;
    model: IEntityModelDelegate;
    field: IEntityViewFieldDelegate;
    value?: any; // 组件的值
    object?: IEntityObject; // 关联的实体对象
    behavior: EntityViewBehaviorType;
    showLabel?: boolean; // 是否显示标签
    fieldControl?: EntityWidgetFieldControlProps;
    fieldState?: EntityWidgetFieldState;
    style?: EntityCSSProperties;
    className?: string;
};

export function EntityWidgetRenderer(props: EntityWidgetRendererProps) {
    const {
        widgetName,
        view,
        model,
        field,
        object,
        value,
        behavior,
        showLabel,
        fieldState,
        style,
        className,
    } = props;
    const engine = useEntityEngine();
    const adapterType = useEntitySuiteAdapter();

    if (!adapterType) {
        return (
            <InnerWidgetRenderer viewField={field} model={model} viewData={view}>
                <div>Adapter type not found</div>
            </InnerWidgetRenderer>
        );
    }

    // 获取适配器并查找组件
    const adapter = engine.componentRegistry.getAdapter(adapterType.suiteName);
    if (!adapter) {
        return (
            <InnerWidgetRenderer viewField={field} model={model} viewData={view}>
                <div>
                    Adapter {adapterType.suiteName}@{adapterType.suiteVersion} not found
                </div>
            </InnerWidgetRenderer>
        );
    }

    // 获取指定名称的组件
    const widgetComp = adapter.getWidget(widgetName) || findWidgetInBuildins(engine, widgetName);
    if (!widgetComp) {
        return (
            <InnerWidgetRenderer viewField={field} model={model} viewData={view}>
                <div>Widget {widgetName} not found</div>
            </InnerWidgetRenderer>
        );
    }

    const wcprops = {
        value,
        object,
        model,
        view,
        field,
        behavior,
        fieldControl: props.fieldControl,
        fieldState: props.fieldState,
        style,
        className,
    };

    const modelField = model.findFieldByName(field.name);
    return (
        <InnerWidgetRenderer
            model={model}
            viewData={view}
            viewField={field}
            hideLabel={!showLabel}
            hideFlag={behavior.mode === 'display'}
            field={modelField}
            fieldState={fieldState}
        >
            {/* <widgetComp.Component {...componentProps} /> */}
            {React.createElement(widgetComp.Component, wcprops)}
        </InnerWidgetRenderer>
    );
}

function findWidgetInBuildins(
    engine: IEntityEngine,
    widgetName: string
): EntityWidget<EntityWidgetProps> | undefined {
    const adapter = engine.componentRegistry.getAdapter('build-in');
    if (!adapter) {
        return undefined;
    }
    return adapter.getWidget(widgetName);
}

type InnerWidgetRendererProps = {
    model: IEntityModelDelegate;
    viewData: IEntityViewDelegate;
    viewField?: IEntityViewFieldDelegate;
    children: React.ReactNode;
    hideLabel?: boolean; // 是否显示标签
    hideFlag?: boolean; // 是否隐藏标志
    field?: IEntityFieldDelegate;
    fieldState?: EntityWidgetFieldState;
};

function InnerWidgetRenderer(props: InnerWidgetRendererProps) {
    const { viewField, field, children, hideLabel, hideFlag, fieldState } = props;
    const isRequired = field ? field.isRequired : false;
    if (!hideLabel && viewField && viewField.title) {
        return (
            <div className="entity-widget-renderer">
                {!hideLabel && viewField && viewField.title && (
                    <label>
                        {viewField.title}{' '}
                        {!hideFlag && isRequired && (
                            <Icon icon="mdi:required" width={10} height={10} />
                        )}
                    </label>
                )}
                <div className="entity-widget-content">{children}</div>
                {fieldState && fieldState.error && (
                    <div className="entity-widget-error">{fieldState.error.message}</div>
                )}
            </div>
        );
    } else {
        return <>{children}</>;
    }
    // return (
    //     <div className="entity-widget-renderer">
    //         {!hideLabel && viewField && viewField.title && (
    //             <label>
    //                 {viewField.title}{' '}
    //                 {!hideFlag && isRequired && <Icon icon="mdi:required" width={10} height={10} />}
    //             </label>
    //         )}
    //         <div className="entity-widget-content">{children}</div>
    //         {fieldState && fieldState.error && (
    //             <div className="entity-widget-error">{fieldState.error.message}</div>
    //         )}
    //     </div>
    // );
}
