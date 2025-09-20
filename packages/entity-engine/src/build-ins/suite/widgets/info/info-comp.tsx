'use client';

import type { JSX } from 'react';
import type { EntityWidgetProps } from '../../../../components/types';

import React from 'react';
import { Grid, Text, Stack, Group } from '@mantine/core';

import { useEntityEngine, EntityWidgetRenderer } from '../../../../uikit';

export function InfoComp(props: EntityWidgetProps) {
    const {
        value: fieldValue,
        object,
        model,
        view,
        field,
        behavior,
        fieldControl,
        fieldState,
    } = props;
    const engine = useEntityEngine();
    const viewData = engine.metaRegistry.findView(model.name, 'grid')?.toSupplementedView();

    const comps: JSX.Element[] = [];

    if (viewData) {
        const vfs = field?.fields?.map((item, index) => {
            const viewField = viewData.items.find((f) => f.name === item.name);
            const obj = object as any;
            let value = undefined;
            if (item.name.startsWith('$$')) {
                value = obj[item.name.substring(2)];
            } else {
                value = obj?.values[item.name];
            }
            if (!viewField) return null;
            if (index === 0) {
                // 如果是第一个字段，使用标题作为卡片标题
                return (
                    <Grid.Col key={index} span={12}>
                        <Group
                            justify="space-between"
                            style={{
                                backgroundColor: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '8px',
                            }}
                        >
                            <EntityWidgetRenderer
                                widgetName={viewField?.widget ?? 'textfield'}
                                view={viewData}
                                model={model}
                                field={viewField}
                                object={obj}
                                value={value}
                                behavior={behavior}
                                showLabel={false}
                                style={{ fontWeight: 500, fontSize: '1.2rem' }}
                            />
                            <EntityWidgetRenderer
                                widgetName="id"
                                view={viewData}
                                model={model}
                                field={viewField}
                                object={obj}
                                value={obj.id}
                                behavior={behavior}
                                showLabel={false}
                            />
                        </Group>
                    </Grid.Col>
                );
            } else {
                return (
                    <React.Fragment key={index}>
                        <Grid.Col key={index} span={2}>
                            <Text variant="text" size="sm" fw={500} c="dimmed">
                                {viewField.title}
                            </Text>
                        </Grid.Col>
                        <Grid.Col>
                            <EntityWidgetRenderer
                                widgetName={viewField?.widget ?? 'textfield'}
                                view={viewData}
                                model={model}
                                field={viewField}
                                object={obj}
                                value={value}
                                behavior={behavior}
                                showLabel={false}
                            />
                        </Grid.Col>
                    </React.Fragment>
                );
            }
        });
        if (vfs) {
            comps.push(...vfs.filter((f) => f !== null));
        }
    }

    return (
        <Stack>
            <Grid>{comps}</Grid>
        </Stack>
    );
}
