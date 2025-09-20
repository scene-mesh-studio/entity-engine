'use client';

import type { EntityViewProps } from '../../types';
import type { IEntityViewDelegate, IEntityModelDelegate } from '../../../core';
import type { IEntityQuery, IEntityObject, IEntityDataSource } from '../../../types';

import React, { useState } from 'react';
import { modals } from '@mantine/modals';
import { DataTable } from 'mantine-datatable';
import { createId } from '@paralleldrive/cuid2';
import { notifications } from '@mantine/notifications';
import { EyeIcon, PlusIcon, EditIcon, TrashIcon, GripVerticalIcon } from 'lucide-react';
import { Box, Flex, Text, Title, Group, Button, Loader, Divider, ActionIcon } from '@mantine/core';

import { toDataSourceHook } from '../../../lib/hooks';
import { EntitySearchPanel } from '../../../components/share/search-panel/search-panel';
import { convertFilterToQuery } from '../../../components/share/search-panel/query-utils';
import { useEntityEngineTheme } from '../../../uikit/provider/entity-engine-theme-provider';
import {
    useEntityEngine,
    EntityViewContainer,
    EntityNamedRenderer,
    EntityWidgetRenderer,
    useEntityPermissionGuard,
} from '../../../uikit';

type GridViewOptions = {
    mode?: 'grid' | 'card';
    query?: IEntityQuery;
    hideToolbar?: boolean;
    hideEditColumn?: boolean;
    hidePagination?: boolean;
};

export function EntityGridViewComp(props: EntityViewProps) {
    const { model, viewData, baseObjectId, behavior } = props;
    const viewOptions = (viewData.viewOptions || {}) as GridViewOptions;
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filterData, setFilterData] = useState({});
    const { theme } = useEntityEngineTheme();
    const engine = useEntityEngine();

    const formSchema = model.schema;

    const dataSource = engine.datasourceFactory.getDataSource();

    const dataSourceHooks = toDataSourceHook(dataSource);

    const {
        data: gridData,
        loading: formLoading,
        error: formError,
        refetch: formRefresh,
        isFetching,
    } = dataSourceHooks.useFindMany(
        {
            modelName: model.name,
            query: viewOptions.query || {
                pageIndex,
                pageSize,
                references: props.reference,
                filter: convertFilterToQuery(filterData),
            },
        },
        {
            keepPreviousData: true,
        }
    );

    if (formLoading && !gridData) {
        return <Loader color="blue" type="dots" size="sm" />;
    }

    if (formError) {
        return <div>Error loading form data: {formError.message}</div>;
    }
    return (
        <InnerGridView
            {...props}
            viewData={props.viewData}
            data={gridData}
            dataSource={dataSource}
            reload={formRefresh}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            pageSize={pageSize}
            setPageSize={setPageSize}
            isFetching={isFetching}
            filterData={filterData}
            setFilterData={setFilterData}
            viewOptions={viewOptions}
        />
    );
}

type InnerGridViewProps = EntityViewProps & {
    data: { data: IEntityObject[]; count: number } | undefined | null;
    dataSource: IEntityDataSource;
    reload?: () => void;
    pageIndex: number;
    setPageIndex: (index: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    isFetching: boolean;
    filterData: { [fieldName: string]: { operator: string; value: any } };
    setFilterData: (data: { [fieldName: string]: { operator: string; value: any } }) => void;
    viewOptions: GridViewOptions;
};

function InnerGridView(props: InnerGridViewProps) {
    const {
        model,
        viewData,
        baseObjectId,
        behavior,
        reference,
        data,
        dataSource,
        reload,
        pageIndex,
        setPageIndex,
        pageSize,
        setPageSize,
        isFetching,
        filterData,
        setFilterData,
        viewOptions,
    } = props;
    const permissionGuard = useEntityPermissionGuard();
    const [selectedRecords, setSelectedRecords] = useState<IEntityObject[]>([]);

    const objs = data?.data || [];
    const count = data?.count || 0;

    const key = `grid-view-${model.name}-rsz`;

    const handleCreate = async () => {
        //权限校验
        const canCreate = await permissionGuard.checkPermission({
            action: 'create',
            modelName: model.name,
        });
        if (!canCreate) {
            notifications.show({
                title: '权限不足',
                message: `您没有权限创建 ${model.title} 数据。`,
                color: 'red',
            });
            return;
        }

        const handleCreateResult = (obj: IEntityObject) => {
            modals.close(modelId);
            reload?.();
        };
        const modelId = modals.open({
            title: <Text fw={700}>创建{model.title}</Text>,
            children: (
                <Box p="md">
                    <EntityViewContainer
                        modelName={model.name}
                        viewType="form"
                        behavior={{ mode: 'edit', toCreating: true, toCreatingId: createId() }}
                        callbacks={{ onObjectCreated: handleCreateResult }}
                        reference={reference}
                    />
                </Box>
            ),
            size: '80%',
            centered: true,
        });
    };

    const handleDeleteSelecteds = async () => {
        if (selectedRecords.length === 0) {
            return;
        }

        //权限校验
        const canDelete = await permissionGuard.checkPermission({
            action: 'delete',
            modelName: model.name,
        });
        if (!canDelete) {
            notifications.show({
                title: '权限不足',
                message: `您没有权限删除 ${model.title} 数据。`,
                color: 'red',
            });
            return;
        }

        const performDelete = async () => {
            await dataSource.deleteMany({ ids: selectedRecords.map((r) => r.id) });
            setSelectedRecords([]);
            reload?.();
            notifications.show({
                title: `${model.title}`,
                message: '数据已成功删除。',
                position: 'top-right',
            });
        };

        modals.openConfirmModal({
            title: '操作确认',
            children: (
                <Text size="sm">
                    确认删除选中的 {selectedRecords.length} 条记录吗？此操作不可撤销。
                </Text>
            ),
            labels: { confirm: '确认', cancel: '取消' },
            onConfirm: () => performDelete(),
        });
    };

    const handleShowDisplay = (record: IEntityObject) => {
        modals.open({
            title: <Text fw={700}>查看{model.title}</Text>,
            children: (
                <Box p="md">
                    <EntityViewContainer
                        modelName={model.name}
                        viewType="form"
                        baseObjectId={record.id}
                        behavior={{ mode: 'display' }}
                    />
                </Box>
            ),
            size: '80%',
            centered: true,
        });
    };

    const handleShowEdit = (record: IEntityObject) => {
        // alert(record.id);
        const handleEditResult = (obj: IEntityObject) => {
            modals.close(modalId);
            reload?.();
        };
        const modalId = modals.open({
            title: <Text fw={700}>编辑{model.title}</Text>,
            children: (
                <Box p="md">
                    <EntityViewContainer
                        modelName={model.name}
                        viewType="form"
                        baseObjectId={record.id}
                        behavior={{ mode: 'edit' }}
                        callbacks={{ onObjectUpdated: handleEditResult }}
                    />
                </Box>
            ),
            size: '80%',
            centered: true,
            stackId: createId(),
        });
    };

    const handleDeleteObject = async (record: IEntityObject) => {
        //权限校验
        const canDelete = await permissionGuard.checkPermission({
            action: 'delete',
            modelName: model.name,
            objectId: record.id,
        });
        if (!canDelete) {
            notifications.show({
                title: '权限不足',
                message: `您没有权限删除 ${model.title} 数据。`,
                color: 'red',
            });
            return;
        }

        const performDelete = async () => {
            await dataSource.delete({ id: record.id });
            reload?.();
            notifications.show({
                title: `${model.title}`,
                message: '数据已成功删除。',
                position: 'top-right',
            });
        };

        modals.openConfirmModal({
            title: '操作确认',
            children: <Text size="sm">确认删除该条记录吗？此操作不可撤销。</Text>,
            labels: { confirm: '确认', cancel: '取消' },
            onConfirm: () => performDelete(),
        });
    };

    const handleSearch = (fdata: { [fieldName: string]: { operator: string; value: any } }) => {
        setFilterData(fdata);
        reload?.();
    };

    const columns = generateColumns(
        model,
        viewData,
        viewOptions,
        handleShowDisplay,
        handleShowEdit,
        handleDeleteObject
    );

    return (
        <Box component="div" p="2">
            {!viewOptions.hideToolbar && (
                <Flex
                    align="center"
                    justify="start"
                    gap="2"
                    className="mb-2 border border-accent rounded-md p-1"
                >
                    <GripVerticalIcon width={18} height={18} />
                    <Title order={6}>{viewData.title}</Title>
                    <Divider orientation="vertical" my="xs" mx="xs" />
                    {model.isSupportFeature('c') && (
                        <Button
                            onClick={handleCreate}
                            variant="subtle"
                            size="sm"
                            radius="sm"
                            leftSection={<PlusIcon width={16} height={16} />}
                            px="xs"
                            py="4"
                            loaderProps={{ size: 'xs' }}
                            // loading={isSubmitting}
                            // disabled={!isDirty}
                        >
                            新建
                        </Button>
                    )}
                    {selectedRecords.length > 0 && model.isSupportFeature('d') && (
                        <>
                            <Button
                                onClick={handleDeleteSelecteds}
                                variant="subtle"
                                size="sm"
                                radius="sm"
                                leftSection={<TrashIcon width={16} height={16} />}
                                px="xs"
                                py="4"
                                color="red"
                                loaderProps={{ size: 'xs' }}
                                // disabled={!isDirty || isSubmitting}
                            >
                                删除 {selectedRecords.length} 条
                            </Button>
                            <Divider orientation="vertical" my="xs" mx="xs" />
                        </>
                    )}

                    <EntitySearchPanel model={model} onSearch={handleSearch} values={filterData} />
                    <EntityNamedRenderer
                        slotName="view-tool"
                        {...props}
                        model={model}
                        viewData={viewData}
                        render={(comp) => (
                            <>
                                <Divider orientation="vertical" my="xs" mx="xs" />
                                {comp}
                            </>
                        )}
                    />
                </Flex>
            )}
            <DataTable
                withTableBorder={false}
                highlightOnHover
                striped
                borderRadius="md"
                storeColumnsKey={key}
                records={objs}
                columns={columns}
                selectedRecords={!viewOptions.hideToolbar ? selectedRecords : undefined}
                onSelectedRecordsChange={!viewOptions.hideToolbar ? setSelectedRecords : undefined}
                page={pageIndex}
                onPageChange={(page: number) => {
                    setPageIndex(page);
                }}
                totalRecords={count}
                recordsPerPage={pageSize}
                onRecordsPerPageChange={(size: number) => {
                    setPageSize(size);
                    setPageIndex(1); // 重置页码
                }}
                recordsPerPageOptions={[5, 10, 20, 50, 100]}
                recordsPerPageLabel="每页显示"
                noRecordsText="没有数据"
                fetching={isFetching}
                styles={{
                    table: {
                        row: {
                            height: 50,
                        },
                        tableLayout: 'auto',
                        width: '100%',
                    },
                    header: {
                        backgroundColor: '#f1f5f9', // 设置背景色
                        borderBottom: '1px solid #d1dce6',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        height: 50,
                    },
                    pagination: {
                        borderTop: 'none',
                    },
                }}
            />
        </Box>
    );
}

function generateColumns(
    model: IEntityModelDelegate,
    view: IEntityViewDelegate,
    viewOptions: GridViewOptions,
    handleShowDisplay?: (record: IEntityObject) => void,
    handleShowEdit?: (record: IEntityObject) => void,
    handleDeleteObject?: (record: IEntityObject) => void
) {
    const columns = [];
    columns.push({
        accessor: 'id',
        title: 'ID',
        width: 80, // 默认宽度
        resizable: false, // 可调整大小
        textAlign: 'center' as const,
        render: (record: IEntityObject) => {
            if (!record || !record.values) {
                return '';
            }
            return (
                <span style={{ cursor: 'pointer' }} onClick={() => handleShowDisplay?.(record)}>
                    <EntityWidgetRenderer
                        view={view}
                        model={model}
                        widgetName="id"
                        behavior={{ mode: 'display' }}
                        field={{ name: 'id', title: 'ID' }}
                        value={record.id}
                    />
                </span>
            );
        },
    });
    const items = view.items
        .filter((item) => (item.fields ? item.fields.length <= 0 : true))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const item of items) {
        const modelField = model.findFieldByName(item.name);
        columns.push({
            accessor: item.name,
            title: item.title || modelField?.title || item.name,
            // width: 200, // 默认宽度
            ...(item.width ? { width: item.width || 100 } : {}),
            ...(item.flex ? { width: 'auto' } : {}),
            resizable: true, // 可调整大小
            textAlign: 'left' as const,
            render: (record: IEntityObject) => {
                if (!record || !record.values) {
                    return '';
                }
                return (
                    <EntityWidgetRenderer
                        view={view}
                        model={model}
                        widgetName={item.widget || 'textfield'}
                        behavior={{ mode: 'display' }}
                        field={item}
                        value={record.values[item.name]}
                        object={record}
                    />
                );
            },
        });
    }
    if (!viewOptions.hideEditColumn) {
        columns.push({
            accessor: '__actions',
            textAlign: 'center' as const,
            title: '操作',
            width: 100,
            resizable: false, // 可调整大小
            render: (record: IEntityObject) => (
                <Group gap={4} justify="right" wrap="nowrap">
                    <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="green"
                        onClick={() => handleShowDisplay?.(record)}
                    >
                        <EyeIcon size={16} />
                    </ActionIcon>
                    {model.isSupportFeature('u') && (
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="blue"
                            onClick={() => handleShowEdit?.(record)}
                        >
                            <EditIcon size={16} />
                        </ActionIcon>
                    )}
                    {model.isSupportFeature('d') && (
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteObject?.(record)}
                        >
                            <TrashIcon size={16} />
                        </ActionIcon>
                    )}
                </Group>
            ),
        });
    }

    return columns;
}
