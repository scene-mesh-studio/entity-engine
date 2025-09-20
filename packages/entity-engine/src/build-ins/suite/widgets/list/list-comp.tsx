'use client';

import type { IEntityObject } from '../../../../types';
import type { EntityWidgetProps } from '../../../../components/types';

import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { createId } from '@paralleldrive/cuid2';
import { Box, Card, Text, Group, Modal, Stack, Button, Loader } from '@mantine/core';

import { toDataSourceHook } from '../../../../lib/hooks';
import {
    useEntityEngine,
    EntityViewContainer,
    EntityWidgetRenderer,
    useMasterDetailViewContainer,
} from '../../../../uikit';

export function ListComp(props: EntityWidgetProps) {
    const { model, view, object, field, maintain } = props;
    const { currentAction, performAction } = useMasterDetailViewContainer();
    const titleFieldName = field?.widgetOptions?.titleFieldName || 'name';
    const subtitleFieldName = field?.widgetOptions?.subtitleFieldName || 'description';
    const iconFieldName = field?.widgetOptions?.iconFieldName || 'image';

    const [opened, { open, close }] = useDisclosure(false);
    const [selectedObjectId, setSelectedObjectId] = useState<string>('');

    const engine = useEntityEngine();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [refreshIndex, setRefreshIndex] = useState(0);

    const dataSource = engine.datasourceFactory.getDataSource();
    const dataSourceHooks = toDataSourceHook(dataSource);

    const { data, loading, error } = dataSourceHooks.useFindMany({
        modelName: model.name,
        query: { pageIndex: 1, pageSize: 999 },
    });

    useEffect(() => {
        if (object && object.id) {
            itemClickHandler(object as any);
        }
    }, [object]);

    if (error) {
        return <Text c="red">错误: {error.message}</Text>;
    }

    const itemClickHandler = (item: any) => {
        setSelectedItemId(item.id);
        // performAction('view', { modelName: model.name, viewType: 'form' }, item);
        performAction({
            actionType: 'view',
            payload: { modelName: model.name, viewType: 'form' },
            contextObject: item,
        });
    };

    const onObjectChanged = (obj: IEntityObject) => {
        close();
        setRefreshIndex(refreshIndex + 1);
        if (obj.id) {
            itemClickHandler(obj as any);
        }
    };

    const handleCreateNew = () => {
        setSelectedObjectId(createId());
        open();
    };

    const itemRenderer = (item: any, index: number) => {
        const isSelected = selectedItemId === item.id;

        return (
            <Card
                key={index}
                padding="sm"
                radius="sm"
                withBorder
                style={{
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
                }}
                onClick={() => itemClickHandler(item)}
            >
                <Group gap="sm">
                    <EntityWidgetRenderer
                        widgetName="image"
                        model={model}
                        field={{ ...field, widgetOptions: { width: '50px', height: '50px' } }}
                        object={item}
                        value={item.values?.[iconFieldName as string]}
                        view={view}
                        behavior={{ mode: 'display' }}
                    />
                    <div style={{ flex: 1 }}>
                        <EntityWidgetRenderer
                            widgetName="textfield"
                            model={model}
                            field={field}
                            object={item}
                            value={item.values?.[titleFieldName as string]}
                            view={view}
                            behavior={{ mode: 'display' }}
                        />
                        <EntityWidgetRenderer
                            widgetName="textfield"
                            model={model}
                            field={field}
                            object={item}
                            value={item.values?.[subtitleFieldName as string]}
                            view={view}
                            behavior={{ mode: 'display' }}
                        />
                    </div>
                </Group>
            </Card>
        );
    };

    return (
        <Box
            style={{
                backgroundColor: 'var(--mantine-color-body)',
                borderRight: '1px dashed var(--mantine-color-gray-4)',
                padding: 'var(--mantine-spacing-xs)',
                width: '100%',
                ...props.style,
            }}
            className={props.className}
        >
            <Stack gap="xs">
                <Group justify="space-between" align="center">
                    <Text size="sm" fw={500}>
                        {field?.title}
                    </Text>
                    {loading && <Loader size="xs" />}
                </Group>

                <Stack gap="xs">
                    {data?.data?.map((item, index) => itemRenderer(item, index))}

                    <Button variant="light" size="sm" onClick={handleCreateNew} leftSection="+">
                        新建{model.title}
                    </Button>
                </Stack>
            </Stack>

            <Modal opened={opened} onClose={close} title={model.title} size="80%">
                <EntityViewContainer
                    modelName={model.name}
                    viewType="form"
                    baseObjectId={selectedObjectId}
                    callbacks={{
                        onObjectUpdated: onObjectChanged,
                        onObjectDeleted: onObjectChanged,
                        onObjectCreated: onObjectChanged,
                    }}
                    behavior={{ ...maintain, mode: 'edit' }}
                />
            </Modal>
        </Box>
    );
}
