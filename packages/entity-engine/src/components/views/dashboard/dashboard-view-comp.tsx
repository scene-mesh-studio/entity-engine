'use client';

import type { EntityViewProps } from '../../types';
import type { IEntityQuery, IEntityViewField } from '../../../types';

import { useMemo } from 'react';
import { Card, Grid } from '@mantine/core';

import { toDataSourceHook } from '../../../lib/hooks';
import { useEntityEngine, EntityWidgetRenderer } from '../../../uikit';

// Dashboard配置类型定义
interface DashboardWidgetConfig {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'custom';
    title: string;
    span?: { cols: number; rows: number };
    dataSource?: {
        modelName?: string;
        query?: IEntityQuery;
        field?: string;
        aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
    };
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    refreshable?: boolean;
    widget?: string; // 自定义widget名称
}

interface DashboardViewOptions {
    layout?: 'grid' | 'masonry';
    columns?: number;
    widgets?: DashboardWidgetConfig[];
    refreshInterval?: number;
    allowFullscreen?: boolean;
}

export function EntityDashboardViewComp(props: EntityViewProps) {
    const { model, viewData, behavior, reference } = props;
    const engine = useEntityEngine();
    const dataSource = engine.datasourceFactory.getDataSource();
    const dataSourceHooks = toDataSourceHook(dataSource);

    // 从viewOptions获取dashboard配置
    const dashboardOptions: DashboardViewOptions = useMemo(() => {
        const options = viewData.viewOptions as DashboardViewOptions;
        return {
            layout: options?.layout || 'grid',
            columns: options?.columns || 12,
            widgets: options?.widgets || [],
            refreshInterval: options?.refreshInterval,
            allowFullscreen: options?.allowFullscreen !== false,
        };
    }, [viewData.viewOptions]);

    const items = viewData.items || [];

    return (
        <Grid>
            {items.map((item, index) => (
                <Grid.Col span={item.spanCols || 6} key={index}>
                    <InnerItemPanel options={dashboardOptions} {...props} field={item} />
                </Grid.Col>
            ))}
        </Grid>
    );
}

type InnerDashboardViewProps = EntityViewProps & {
    options: DashboardViewOptions;
    field: IEntityViewField;
};

function InnerItemPanel(props: InnerDashboardViewProps) {
    const { model, viewData, field } = props;
    const subFields = field.fields || [];
    if (subFields.length === 0) {
        return <InnerItem {...props} field={field} />;
    } else {
        return (
            <Grid>
                {subFields.map((subField, index) => (
                    <Grid.Col span={subField.spanCols || 6} key={index}>
                        <InnerItemPanel {...props} field={subField} />
                    </Grid.Col>
                ))}
            </Grid>
        );
    }
}

type InnerItemProps = EntityViewProps & {
    options: DashboardViewOptions;
    field: IEntityViewField;
};

function InnerItem(props: InnerItemProps) {
    const { model, viewData, field } = props;

    return (
        <Card shadow="sm" withBorder padding="lg" h="100%" style={{ borderColor: 'snow' }}>
            <Card.Section>
                <EntityWidgetRenderer
                    widgetName={field.widget || 'default'}
                    field={field}
                    view={viewData}
                    model={model}
                    behavior={props.behavior}
                />
            </Card.Section>
        </Card>
    );
}
