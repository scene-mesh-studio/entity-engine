'use client';

import type { IEntityObject } from '../../../../types';
import type { EntityWidgetProps } from '../../../../components/types';

import { useMemo, useState, useCallback } from 'react';
import { Notifications } from '@mantine/notifications';
import { PlusIcon, Link2Icon, TrashIcon } from 'lucide-react';
import { Box, Flex, Text, Modal, Button } from '@mantine/core';

import { toDataSourceHook } from '../../../../lib/hooks';
import { useEntityEngine, EntityViewContainer } from '../../../../uikit';
import { EntityObjectTable } from '../../../../components/share/object-table';

export function ReferenceEditMMComp(props: EntityWidgetProps) {
    const { object, model, field } = props;
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<IEntityObject[]>([]);
    const [showSelectDialog, setShowSelectDialog] = useState(false);
    const engine = useEntityEngine();

    const modelField = model.findFieldByName(field.name);
    const refModelName = modelField?.refModel;
    const refModel = refModelName ? engine.metaRegistry.getModel(refModelName) : undefined;

    const dataSource = engine.datasourceFactory.getDataSource();
    const dsHooks = toDataSourceHook(dataSource);

    const { data, loading, refetch } = dsHooks.useFindMany({
        modelName: refModelName!,
        query: {
            pageSize,
            pageIndex,
            references: {
                fromModelName: model.name,
                fromFieldName: field.name,
                fromObjectId: object?.id || '',
                toModelName: refModelName!,
            },
        },
    });

    const tableData = useMemo(() => {
        if (!data || !refModel) {
            return { objects: [], pagination: { count: 0, page: 1, pageSize: 10 } };
        }
        return {
            objects: data.data,
            pagination: {
                count: data.count,
                page: pageIndex,
                pageSize,
            },
        };
    }, [data, refModel, pageIndex, pageSize]);

    const showSelectPanel = () => {
        setShowSelectDialog(true);
    };

    const onAddReferences = async (sels: IEntityObject[], closeit?: boolean) => {
        if (sels.length > 0 && object) {
            const result = await dataSource.createReferences({
                fromModelName: model.name,
                fromFieldName: field.name,
                fromObjectId: object.id,
                toModelName: refModelName!,
                toObjectIds: sels.map((s) => s.id),
            });
            Notifications.show({
                title: '添加关联完成',
                message: `成功添加了 ${result} 条关联`,
                color: 'green',
            });
            if (result > 0) {
                setSelectedRows([]);
                refetch();
            }
        }
        if (closeit) {
            setShowSelectDialog(false);
        }
    };

    const onDeleteReferences = useCallback(async () => {
        if (selectedRows.length > 0 && object) {
            const ret = await dataSource.deleteReferences({
                fromModelName: model.name,
                fromFieldName: field.name,
                fromObjectId: object.id,
                toModelName: refModelName!,
                toObjectIds: selectedRows.map((s) => s.id),
            });
            Notifications.show({
                title: '删除关联完成',
                message: `成功删除了 ${ret} 条关联`,
                color: 'green',
            });
            if (ret) {
                setSelectedRows([]);
                refetch();
            }
        }
    }, [model.name, refModelName, selectedRows]);

    return (
        <Box>
            <Flex justify="flex-end" align="center" mb={10}>
                <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<PlusIcon size={14} />}
                    onClick={showSelectPanel}
                >
                    添加关联
                </Button>
                <Button
                    size="xs"
                    ml={10}
                    variant="subtle"
                    leftSection={<TrashIcon size={14} color="red" />}
                    disabled={selectedRows.length === 0}
                    onClick={onDeleteReferences}
                >
                    删除关联{}
                    {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                </Button>
            </Flex>
            <EntityObjectTable
                data={tableData}
                isFetching={loading}
                model={refModel!}
                selectedObjects={selectedRows}
                onSelectedChange={setSelectedRows}
                onPageChange={(page, size) => {
                    setPageIndex(page);
                    setPageSize(size);
                }}
                viewData={engine.metaRegistry.findView(refModel!.name, 'grid')!}
            />
            <ReferenceSelectPanel
                opened={showSelectDialog}
                close={() => setShowSelectDialog(false)}
                addReferences={onAddReferences}
                selected={[]}
                modelName={refModelName!}
            />
        </Box>
    );
}

type ReferenceSelectPanelProps = {
    opened: boolean;
    close: () => void;
    addReferences: (selected: IEntityObject[], closeit?: boolean) => void;
    selected: IEntityObject[];
    modelName: string;
};

function ReferenceSelectPanel(props: ReferenceSelectPanelProps) {
    const { opened, close, addReferences, selected, modelName } = props;
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<IEntityObject[]>(selected || []);

    const [createPanelOpen, setCreatePanelOpen] = useState(false);

    const engine = useEntityEngine();
    const datasource = engine.datasourceFactory.getDataSource();
    const dsHooks = toDataSourceHook(datasource);

    const model = engine.metaRegistry.getModel(modelName);

    const { data, loading, refetch } = dsHooks.useFindMany({
        modelName,
        query: {
            pageSize: 10,
            pageIndex: 1,
        },
    });

    const tableData = useMemo(() => {
        if (!data || !modelName) {
            return { objects: [], pagination: { count: 0, page: 1, pageSize: 10 } };
        }
        return {
            objects: data.data,
            pagination: {
                count: data.count,
                page: pageIndex,
                pageSize,
            },
        };
    }, [data, modelName, pageIndex, pageSize]);

    const onAddReferences = async () => {
        if (selectedRows.length > 0) {
            await addReferences(selectedRows);
            // setSelectedRows([]);
        }
    };

    const onReferenceObjectCreated = async (obj: IEntityObject) => {
        setCreatePanelOpen(false);
        await addReferences([obj], true);
    };

    const onShowCreatePanel = () => {
        setCreatePanelOpen(true);
    };

    return (
        <Modal
            opened={opened}
            onClose={close}
            title="选择关联"
            centered
            size="75%"
            radius="md"
            zIndex={99999999}
        >
            <Flex align="baseline" w="100%" justify="flex-end" my={10} gap={10}>
                <Text flex={1} c="dimmed" size="xs">
                    选择要关联的数据, 然后点击右侧的添加关联按钮
                </Text>
                <Button
                    variant="light"
                    size="xs"
                    leftSection={<Link2Icon size={14} />}
                    onClick={onAddReferences}
                    disabled={selectedRows.length === 0}
                >
                    添加关联
                </Button>
                <Button
                    variant="light"
                    size="xs"
                    leftSection={<PlusIcon size={14} />}
                    onClick={onShowCreatePanel}
                >
                    创建新{model?.title}
                </Button>
            </Flex>
            <EntityObjectTable
                data={tableData}
                isFetching={loading}
                model={engine.metaRegistry.getModel(modelName)!}
                selectedObjects={selectedRows}
                onSelectedChange={setSelectedRows}
                onPageChange={(page, size) => {
                    setPageIndex(page);
                    setPageSize(size);
                }}
                viewData={engine.metaRegistry.findView(modelName, 'grid')!}
            />
            <ReferenceCreatePanel
                opened={createPanelOpen}
                modelName={modelName}
                onCreated={onReferenceObjectCreated}
                onClose={() => setCreatePanelOpen(false)}
            />
        </Modal>
    );
}

type ReferenceCreatePanelProps = {
    opened: boolean;
    modelName: string;
    onCreated: (obj: IEntityObject) => void;
    onClose: () => void;
};

function ReferenceCreatePanel(props: ReferenceCreatePanelProps) {
    const { modelName, opened, onCreated, onClose } = props;

    const handleCreated = async (data: IEntityObject) => {
        onCreated(data);
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="创建新关联"
            centered
            size="75%"
            radius="md"
            zIndex={99999999}
        >
            <EntityViewContainer
                modelName={modelName}
                viewType="form"
                behavior={{ mode: 'edit', toCreating: true }}
                callbacks={{
                    onObjectCreated: handleCreated,
                }}
            />
        </Modal>
    );
}
