'use client';

import type { IEntityObject } from '../../../types';
import type { IEntityViewDelegate, IEntityModelDelegate } from '../../../core';

import { DataTable } from 'mantine-datatable';

import { EntityWidgetRenderer } from '../../../uikit';

type EntityObjectTableProps = {
    model: IEntityModelDelegate;
    viewData: IEntityViewDelegate;
    data: {
        objects: IEntityObject[];
        pagination: { count: number; page: number; pageSize: number };
    };
    isFetching?: boolean;
    onPageChange?: (page: number, pageSize: number) => void;
    selectedObjects?: IEntityObject[];
    onSelectedChange?: (objects: IEntityObject[]) => void;
};

export function EntityObjectTable(props: EntityObjectTableProps) {
    const { model, viewData, data, isFetching, onPageChange, selectedObjects, onSelectedChange } =
        props;
    const key = `entity-table-${model.name}-${viewData.name}`;

    const columns = generateColumns(model, viewData);

    return (
        <DataTable
            withTableBorder
            highlightOnHover
            striped
            borderRadius="md"
            storeColumnsKey={key}
            records={data.objects}
            columns={columns}
            selectedRecords={selectedObjects}
            onSelectedRecordsChange={onSelectedChange}
            page={data.pagination.page}
            onPageChange={(page: number) => {
                onPageChange?.(page, data.pagination.pageSize);
            }}
            totalRecords={data.pagination.count}
            recordsPerPage={data.pagination.pageSize}
            onRecordsPerPageChange={(size: number) => {
                onPageChange?.(1, size);
            }}
            recordsPerPageOptions={[5, 10, 20, 50, 100]}
            recordsPerPageLabel="每页显示"
            noRecordsText="没有数据"
            fetching={isFetching}
            styles={{
                table: {
                    // row: {
                    //     height: 50,
                    // },
                    tableLayout: 'auto',
                    width: '100%',
                },
                header: {
                    backgroundColor: '#f1f5f9', // 设置背景色
                    borderBottom: '1px solid #d1dce6',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    // height: 50,
                },
                pagination: {
                    borderTop: 'none',
                },
            }}
        />
    );
}

function generateColumns(
    model: IEntityModelDelegate,
    view: IEntityViewDelegate,
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

    return columns;
}
