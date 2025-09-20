'use client';

import type { JSX } from 'react';
import type { EntityViewProps, EntityViewBehaviorType } from '../../types';
import type { IEntityViewDelegate, IEntityModelDelegate } from '../../../core';
import type { IEntityObject, IEntityViewField, IEntityViewPanel } from '../../../types';

import { Grid, Loader } from '@mantine/core';

import { toDataSourceHook } from '../../../lib/hooks';
import { useEntityEngine, EntityWidgetRenderer } from '../../../uikit';

export function EntityMasterDetailViewComp(props: EntityViewProps) {
    const { model, baseObjectId, viewData, behavior } = props;
    const engine = useEntityEngine();
    // const { currentAction } = useMatserDetailViewContainer();
    const dataSource = engine.datasourceFactory.getDataSource();
    const dataSourceHooks = toDataSourceHook(dataSource);

    const { data, loading, error } = dataSourceHooks.useFindOneWithReferences({
        modelName: model.name,
        id: baseObjectId || '',
    });
    if (loading) {
        return <Loader size="sm" variant="dots" />;
    }

    return (
        // <ViewContainerProvider parentContext={currentAction?.contextObject}>
        <InnerView
            data={data as IEntityObject | undefined}
            model={model}
            viewData={viewData}
            behavior={behavior}
        />
        // </ViewContainerProvider>
    );
}

function getGridColWidthProps(item: IEntityViewField | IEntityViewPanel) {
    // 检查是否有相关属性
    const hasFlexProp = 'flex' in item;
    const hasSpanColsProp = 'spanCols' in item;

    if (hasFlexProp && item.flex === 1) {
        return { style: { flex: 1, minWidth: 0 } };
    } else if (hasSpanColsProp && item.spanCols && item.spanCols > 0) {
        return { span: item.spanCols };
    } else if (hasSpanColsProp && item.spanCols && item.spanCols < 0) {
        return { style: { width: `${-item.spanCols}px`, flexShrink: 0 }, span: 'content' as const };
    } else {
        return { span: 6 }; // 默认宽度
    }
}

type InnerViewProps = EntityViewProps & {
    data: IEntityObject | undefined | null;
};

function InnerView(props: InnerViewProps) {
    const { data, model, viewData, behavior } = props;

    const itemCompCaps: { item: IEntityViewField | IEntityViewPanel; comp: JSX.Element }[] = [];

    viewData.items.forEach((item, index) => {
        const widthProps = getGridColWidthProps(item);
        if (item.widget) {
            itemCompCaps.push({
                comp: (
                    <Grid.Col key={`it-${index}`} {...widthProps}>
                        <InnerItemContainer
                            item={item}
                            object={data as IEntityObject}
                            value={null}
                            model={model}
                            view={viewData}
                            behavior={behavior}
                            widget={item.widget}
                        />
                    </Grid.Col>
                ),
                item: item as IEntityViewField,
            });
        } else if ('fields' in item && Array.isArray(item.fields) && item.fields.length > 0) {
            itemCompCaps.push({
                comp: (
                    <Grid.Col key={`p-${index}`} {...widthProps}>
                        <InnerPanelContainer
                            key={index}
                            item={item as IEntityViewPanel}
                            object={data as IEntityObject}
                            value={null}
                            model={model}
                            view={viewData}
                            behavior={behavior}
                        />
                    </Grid.Col>
                ),
                item: item as IEntityViewPanel,
            });
        }
    });
    if (itemCompCaps.length === 0) {
        return <div>view config error</div>;
    }

    return (
        <Grid grow={false} gutter="md" style={{ display: 'flex', flexWrap: 'nowrap' }}>
            {itemCompCaps.map((item, index) => item.comp)}
        </Grid>
    );
}

type ItemContainerProps = {
    item: IEntityViewField;
    widget: string;
    object: IEntityObject | undefined;
    value: any;
    model: IEntityModelDelegate;
    view: IEntityViewDelegate;
    behavior?: EntityViewBehaviorType;
};

function InnerItemContainer(props: ItemContainerProps) {
    const { item, widget, object, value, model, view, behavior } = props;
    const field = item as IEntityViewField;
    return (
        <EntityWidgetRenderer
            widgetName={widget}
            view={view}
            model={model}
            field={field}
            object={object}
            value={value}
            behavior={behavior || { mode: 'display' }}
            showLabel={false}
        />
    );
}

type InnerPanelContainerProps = {
    item: IEntityViewPanel;
    object: IEntityObject | undefined;
    value: any;
    model: IEntityModelDelegate;
    view: IEntityViewDelegate;
    behavior?: EntityViewBehaviorType;
};

function InnerPanelContainer(props: InnerPanelContainerProps) {
    const { item, object, value, model, view, behavior } = props;
    const panel = item as IEntityViewPanel;
    return (
        <Grid grow={false} gutter="md" style={{ display: 'flex', flexWrap: 'nowrap' }}>
            {panel.fields.map((field, index) => {
                if (field.widget) {
                    return (
                        <Grid.Col span={field.spanCols || 6} key={index}>
                            <InnerItemContainer
                                item={field}
                                object={object}
                                value={object?.values?.[field.name] ?? ''}
                                model={model}
                                view={view}
                                behavior={behavior}
                                widget={field.widget}
                            />
                        </Grid.Col>
                    );
                } else {
                    return undefined;
                }
            })}
        </Grid>
    );
}
