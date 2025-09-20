'use client';

// 导入 @dnd-kit 相关组件和 hooks
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { EntityViewProps } from '../../types';
import type { IEntityViewDelegate } from '../../../core';
import type { IEntityModel, IEntityObject } from '../../../types';

import { Icon } from '@iconify/react';
import React, { useState } from 'react';
import { modals } from '@mantine/modals';
import { CSS } from '@dnd-kit/utilities';
import { EditIcon, TrashIcon } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
    useSensor,
    DndContext,
    useSensors,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    closestCorners,
} from '@dnd-kit/core';
import {
    Box,
    Text,
    Card,
    Grid,
    Group,
    Paper,
    Stack,
    Button,
    Tooltip,
    ScrollArea,
    ActionIcon,
    LoadingOverlay,
} from '@mantine/core';

import { toDataSourceHook } from '../../../lib/hooks';
import {
    useEntityEngine,
    EntityViewContainer,
    EntityWidgetRenderer,
    useEntityPermissionGuard,
} from '../../../uikit';

// 预定义的颜色数组
const COLORS = [
    'blue',
    'green',
    'violet',
    'indigo',
    'teal',
    'cyan',
    'pink',
    'grape',
    'orange',
    'lime',
    'red',
    'yellow',
];

// 统一的字段值解析：优先 values，再退回对象根；支持 name/field/displayField
// eslint-disable-next-line arrow-body-style
const resolveFieldValue = (obj: any, item: any): any => {
    return obj?.values?.[item?.name] ?? obj?.[item?.name] ?? undefined;
};

const isEmptyValue = (value: any): boolean => value === undefined || value === null || value === '';

export function EntityKanbanViewComp(props: EntityViewProps) {
    const { model, viewData } = props;
    const engine = useEntityEngine();
    // 从 viewOptions 读取配置；
    const {
        groupByFieldName,
        groupSortDir,
        objectSortBy,
        groupFieldMapping,
        columnWidth,
        canbeViewed,
    } = fetchViewOptions(model, viewData);

    const dataSource = engine.datasourceFactory.getDataSource();
    const dataSourceHooks = toDataSourceHook(dataSource);

    // 拖拽状态
    const [activeCard, setActiveCard] = useState<any>(null);

    // 配置拖拽传感器
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5, // 需要移动5px才开始拖拽
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100,
                tolerance: 5,
            },
        })
    );

    const {
        data: kanbanData,
        error: dataError,
        refetch: dataRefresh,
        isFetching,
    } = dataSourceHooks.useFindGroupedObjects({
        modelName: model.name,
        groupBy: groupByFieldName as string,
        groupSortBy: { [groupByFieldName as string]: (groupSortDir as any) || 'asc' },
        objectSortBy: (objectSortBy as any) || { createdAt: 'asc' },
        // reference: {
        //     fromModelName: 'product',
        //     fromFieldName: 'rootScene',
        //     fromObjectId: 'bry9wbiy3nasmd8afkkf0wjm',
        // },
        // query: {
        //     filter: {
        //         field: 'name',
        //         operator: QueryOperator.CONTAINS,
        //         value: '通用',
        //     },
        // },
        // aggregations: {
        //     name: 'count',
        // },
    });

    const columns = React.useMemo(() => {
        const groups = kanbanData?.groups || [];

        const kanbanColumns: any[] = [];
        groups.map((group: any) =>
            kanbanColumns.push({
                id: group.key[groupByFieldName as string],
                title:
                    groupFieldMapping?.[group.key[groupByFieldName as string]] ||
                    group.key[groupByFieldName as string],
                cards: group.objects || [],
            })
        );

        // 如果 groupFieldMapping 中的字段数量与 kanbanColumns 中的字段数量不一致，则需要在kanbanColumns中增加缺少的列
        if (Object.entries(groupFieldMapping).length !== kanbanColumns.length) {
            Object.entries(groupFieldMapping).forEach(([key, value]) => {
                if (!kanbanColumns.some((column) => column.id === key)) {
                    kanbanColumns.push({
                        id: key,
                        title: value,
                        cards: [],
                    });
                }
            });
        }
        return kanbanColumns;
    }, [kanbanData?.groups, groupByFieldName, groupFieldMapping]);

    // 定义 kanban actions
    const { onAddCard, onDragStart, onDragEnd, onEditCard, onDeleteCard, onViewCard } =
        useKanbanAction({
            columns,
            setActiveCard,
            model,
            objectSortBy,
            dataSource,
            dataRefresh,
            groupByFieldName: groupByFieldName as string,
            canbeViewed: canbeViewed as boolean,
        });

    // 错误与空数据处理（复用组件）
    if (dataError) {
        return (
            <EmptyState
                title="加载失败"
                description={dataError.message}
                actionLabel="重试"
                onAction={() => dataRefresh()}
                color="red"
            />
        );
    }

    if (columns.length === 0) {
        if (isFetching) {
            return (
                <div style={{ position: 'relative', minHeight: 400 }}>
                    <LoadingOverlay visible />
                </div>
            );
        }
        return (
            <EmptyState
                title="暂无数据"
                description="创建你的第一个卡片"
                actionLabel="添加第一个卡片"
                onAction={onAddCard}
            />
        );
    }

    // 渲染看板视图
    return (
        <div
            style={{
                position: 'relative',
                height: '90vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <LoadingOverlay visible={isFetching} />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            >
                <ScrollArea
                    type="always"
                    scrollbarSize={10}
                    style={{ flex: 1, minHeight: 0 }}
                    offsetScrollbars={false}
                >
                    <Group
                        gap="md"
                        align="stretch"
                        p="md"
                        style={{
                            flex: 1,
                            minHeight: 0,
                            width: 'max-content', // 让 Group 宽度适应所有列
                            flexWrap: 'nowrap', // 防止换行
                            alignItems: 'stretch',
                            height: '90vh',
                        }}
                    >
                        {columns.map((column) => (
                            <DraggableColumn
                                key={column.id}
                                column={column}
                                onEdit={onEditCard}
                                onDelete={onDeleteCard}
                                onView={onViewCard}
                                onAdd={(columnId) => onAddCard(columnId)}
                                model={model}
                                viewData={viewData}
                                objectSortBy={objectSortBy}
                                columnWidth={columnWidth}
                            />
                        ))}
                    </Group>
                </ScrollArea>

                {/* 拖拽时的覆盖层 */}
                <DragOverlay>
                    {activeCard ? (
                        <Card
                            withBorder
                            style={{
                                width: columnWidth,
                                opacity: 0.8,
                                transform: 'rotate(5deg)',
                            }}
                        >
                            <Card.Section p="xs">
                                <KanbanCardContent
                                    card={activeCard}
                                    model={model}
                                    viewData={viewData}
                                    onEdit={onEditCard}
                                    onDelete={onDeleteCard}
                                />
                            </Card.Section>
                        </Card>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

interface KanbanActionProps {
    columns: any[];
    setActiveCard: (card: any) => void;
    model: any;
    objectSortBy: any;
    dataSource: any;
    dataRefresh: () => void;
    groupByFieldName: string;
    canbeViewed: boolean;
}

const useKanbanAction = (props: KanbanActionProps) => {
    const {
        columns,
        setActiveCard,
        model,
        objectSortBy,
        dataSource,
        dataRefresh,
        groupByFieldName,
        canbeViewed,
    } = props;

    const permissionGuard = useEntityPermissionGuard();

    const onDragStart = React.useCallback(
        (event: DragStartEvent) => {
            const { active } = event;
            // 找到被拖拽的卡片
            const foundCard = columns
                .flatMap((col) => col.cards)
                .find((card: any) => card.id === active.id);
            setActiveCard(foundCard);
        },
        [columns, setActiveCard]
    );

    // 拖拽结束处理
    const onDragEnd = React.useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over) {
                setActiveCard(null);
                return;
            }

            const activeId = active.id as string;
            const overId = over.id as string;

            // 检查权限
            const hasPermission = await permissionGuard.checkPermission({
                modelName: model.name,
                action: 'update',
            });

            if (!hasPermission) {
                console.warn('没有编辑权限，拖拽操作被拒绝');
                setActiveCard(null);
                return;
            }

            // 找到源列和目标列
            const sourceColumn = columns.find((col) =>
                col.cards.some((card: any) => card.id === activeId)
            );
            const targetColumn = columns.find(
                (col) => col.id === overId || col.cards.some((card: any) => card.id === overId)
            );

            if (!sourceColumn || !targetColumn) {
                setActiveCard(null);
                return;
            }

            // 如果是同一列内排序
            if (sourceColumn.id === targetColumn.id) {
                const cards = [...sourceColumn.cards];
                const oldIndex = cards.findIndex((card: any) => card.id === activeId);
                const newIndex = cards.findIndex((card: any) => card.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    // 获取排序字段的key
                    const sortFieldKey = Object.keys(objectSortBy)[0];

                    // 保存原始值用于交换
                    const oldCard = cards[oldIndex];
                    const newCard = cards[newIndex];

                    // 获取排序值
                    const oldValue = oldCard.values?.[sortFieldKey] || oldCard[sortFieldKey];
                    const newValue = newCard.values?.[sortFieldKey] || newCard[sortFieldKey];

                    // 交换排序字段值
                    if (oldCard.values) {
                        oldCard.values = { ...oldCard.values, [sortFieldKey]: newValue };
                    } else {
                        oldCard[sortFieldKey] = newValue;
                    }

                    if (newCard.values) {
                        newCard.values = { ...newCard.values, [sortFieldKey]: oldValue };
                    } else {
                        newCard[sortFieldKey] = oldValue;
                    }

                    // 重新排序数组
                    const [removed] = cards.splice(oldIndex, 1);
                    cards.splice(newIndex, 0, removed);

                    // 更新数据库中的排序字段值
                    try {
                        await Promise.all([
                            dataSource.updateValues({
                                id: oldCard.id,
                                values: { [sortFieldKey]: newValue },
                            }),
                            dataSource.updateValues({
                                id: newCard.id,
                                values: { [sortFieldKey]: oldValue },
                            }),
                        ]);
                        dataRefresh();
                    } catch (error) {
                        console.error('更新排序失败:', error);
                    }
                }
            } else {
                // 跨列移动
                const sourceCards = [...sourceColumn.cards];
                const targetCards = [...targetColumn.cards];
                const cardIndex = sourceCards.findIndex((card: any) => card.id === activeId);

                if (cardIndex !== -1) {
                    const [movedCard] = sourceCards.splice(cardIndex, 1);

                    // 获取排序字段的key
                    const sortFieldKeys = Object.keys(objectSortBy);

                    // 确定插入位置
                    let insertIndex = targetCards.length; // 默认插入到末尾

                    // 如果拖拽到特定卡片上，插入到该卡片位置
                    if (overId !== targetColumn.id) {
                        const targetCardIndex = targetCards.findIndex(
                            (card: any) => card.id === overId
                        );
                        if (targetCardIndex !== -1) {
                            insertIndex = targetCardIndex;
                        }
                    }

                    // 在目标位置插入卡片（仅用于本地计算；持久化依赖于后续刷新）
                    targetCards.splice(insertIndex, 0, movedCard);

                    // 准备所有更新操作
                    const updates = [] as Array<{ id: string; values: Record<string, any> }>;

                    // 1) 更新被移动卡片的分组字段
                    const movedCardUpdateValues: Record<string, any> = {
                        [groupByFieldName]: targetColumn.id,
                    };

                    // 2) 若配置了对象排序字段：
                    //    - 对于类型为 date 的排序字段（如 updatedAt），写入当前时间
                    //    - 其他类型不做数值重排，交由后端规则或下一步交互决定
                    if (Array.isArray(model?.fields)) {
                        for (const sortFieldKey of sortFieldKeys) {
                            const fieldMeta = model.fields.find(
                                (f: any) => f?.name === sortFieldKey
                            );
                            if (fieldMeta?.type === 'date') {
                                movedCardUpdateValues[sortFieldKey] = new Date();
                            }
                        }
                    }

                    updates.push({ id: movedCard.id, values: movedCardUpdateValues });

                    // 批量更新数据库
                    try {
                        await Promise.all(
                            updates.map((u) =>
                                dataSource.updateValues({ id: u.id, values: u.values })
                            )
                        );
                        dataRefresh();
                    } catch (error) {
                        console.error('跨列移动更新失败:', error);
                    }
                }
            }

            setActiveCard(null);
        },
        [
            groupByFieldName,
            columns,
            dataRefresh,
            dataSource,
            model.fields,
            model.name,
            objectSortBy,
            permissionGuard,
            setActiveCard,
        ]
    );

    // 编辑卡片
    const onEditCard = React.useCallback(
        async (card: any) => {
            const canEdit = await permissionGuard.checkPermission({
                modelName: model.name,
                action: 'update',
            });

            if (!canEdit) {
                notifications.show({
                    title: '权限不足',
                    message: `您没有权限修改 ${model.title} 数据。`,
                    color: 'red',
                });
                return;
            }

            const handleEditResult = (obj: IEntityObject) => {
                modals.close(modalId);
                // 刷新看板数据
                dataRefresh();
            };

            const modalId = modals.open({
                title: <Text fw={700}>编辑{model.title}</Text>,
                children: (
                    <Box p="md">
                        <EntityViewContainer
                            modelName={model.name}
                            viewType="form"
                            baseObjectId={card.id}
                            behavior={{ mode: 'edit' }}
                            callbacks={{ onObjectUpdated: handleEditResult }}
                        />
                    </Box>
                ),
                size: '80%',
                centered: true,
            });
        },
        [dataRefresh, model.name, model.title, permissionGuard]
    );

    // 删除卡片
    const onDeleteCard = React.useCallback(
        async (card: any) => {
            const canDelete = await permissionGuard.checkPermission({
                modelName: model.name,
                action: 'delete',
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
                await dataSource.delete({ id: card.id });
                dataRefresh?.();
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
        },
        [dataRefresh, dataSource, model.name, model.title, permissionGuard]
    );

    // 查看卡片
    const onViewCard = React.useCallback(
        async (card: any) => {
            if (!canbeViewed) {
                return;
            }

            const canView = await permissionGuard.checkPermission({
                modelName: model.name,
                action: 'read',
            });

            if (!canView) {
                notifications.show({
                    title: '权限不足',
                    message: `您没有权限查看 ${model.title} 数据。`,
                    color: 'red',
                });
                return;
            }

            modals.open({
                title: <Text fw={700}>查看{model.title}</Text>,
                children: (
                    <Box p="md">
                        <EntityViewContainer
                            modelName={model.name}
                            viewType="form"
                            baseObjectId={card.id}
                            behavior={{ mode: 'display' }}
                        />
                    </Box>
                ),
                size: '80%',
                centered: true,
            });
        },
        [canbeViewed, model.name, model.title, permissionGuard]
    );

    // 添加卡片
    const onAddCard = React.useCallback(
        async (columnId?: string) => {
            const canCreate = await permissionGuard.checkPermission({
                modelName: model.name,
                action: 'create',
            });

            if (!canCreate) {
                notifications.show({
                    title: '权限不足',
                    message: `您没有权限创建 ${model.title} 数据。`,
                    color: 'red',
                });
                return;
            }

            const handleCreateResult = async (obj: IEntityObject) => {
                modals.close(modalId);
                // 若提供列ID，则在创建后补写分组字段
                if (columnId) {
                    try {
                        await dataSource.updateValues({
                            id: obj.id,
                            values: { [groupByFieldName]: columnId },
                        });
                    } catch (e) {
                        console.error('设置分组字段失败:', e);
                    }
                }
                dataRefresh();
            };

            const modalId = modals.open({
                title: <Text fw={700}>创建{model.title}</Text>,
                children: (
                    <Box p="md">
                        <EntityViewContainer
                            modelName={model.name}
                            viewType="form"
                            behavior={{ mode: 'edit', toCreating: true }}
                            callbacks={{ onObjectCreated: handleCreateResult }}
                        />
                    </Box>
                ),
                size: '80%',
                centered: true,
            });
        },
        [groupByFieldName, dataRefresh, dataSource, model.name, model.title, permissionGuard]
    );
    return { onAddCard, onDragStart, onDragEnd, onEditCard, onDeleteCard, onViewCard };
};

function fetchViewOptions(model: IEntityModel, viewData: IEntityViewDelegate) {
    const groupByFieldName = viewData.viewOptions?.groupByField;
    if (!groupByFieldName) {
        throw new Error('groupByField 用于排列看板列，不能为空');
    }

    const groupByField = model.fields.find((field) => field.name === groupByFieldName);
    if (!groupByField) {
        throw new Error(`groupByField ${groupByFieldName} 在 ${model.name} 模型中不存在`);
    }

    //验证是否是枚举或数组类型
    if (groupByField.type !== 'enum' && groupByField.type !== 'array') {
        throw new Error(
            `groupByField ${groupByFieldName} 在 ${model.name} 模型中必须是枚举或数组类型`
        );
    }
    const groupSortDir = viewData.viewOptions?.groupSortDir || 'asc';
    let groupFieldMapping: Record<string, string> = {};
    if (groupByField.type === 'enum' || groupByField.type === 'array') {
        const options = Array.isArray(groupByField.typeOptions?.options)
            ? (groupByField.typeOptions?.options as any[])
            : [];
        groupFieldMapping = options.reduce<Record<string, string>>((acc, opt) => {
            const value = opt && typeof opt === 'object' && 'value' in opt ? opt.value : opt;
            const label =
                opt && typeof opt === 'object' && 'label' in opt ? opt.label : String(opt);
            if (value != null) {
                acc[String(value)] = String(label);
            }
            return acc;
        }, {});
    }

    const objectSortBy = viewData.viewOptions?.objectSortBy || { $$updatedAt: 'desc' };
    const columnWidth =
        typeof viewData.viewOptions?.columnWidth === 'number' &&
        viewData.viewOptions?.columnWidth > 0
            ? viewData.viewOptions?.columnWidth
            : 320;
    const cardItems = viewData.items;
    const canbeViewed = viewData.viewOptions?.canbeViewed || false;
    return {
        groupByFieldName,
        groupSortDir,
        objectSortBy,
        groupFieldMapping,
        cardItems,
        columnWidth,
        canbeViewed,
    };
}

// 空态复用组件
function EmptyState({
    title,
    description,
    actionLabel,
    onAction,
    color,
}: {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    color?: string;
}) {
    return (
        <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
                <Text c={color || 'dimmed'} size="lg">
                    {title}
                </Text>
                {description ? <Text c="dimmed">{description}</Text> : null}
                {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
            </Stack>
        </Paper>
    );
}

// 列组件
function DraggableColumn({
    column,
    onEdit,
    onDelete,
    onView,
    onAdd,
    model,
    viewData,
    columnWidth,
}: {
    column: any;
    onEdit: (card: any) => void;
    onDelete: (card: any) => void;
    onView: (card: any) => void;
    onAdd: (columnId: string) => void;
    model: any;
    viewData: any;
    objectSortBy: any;
    columnWidth?: number;
}) {
    const { setNodeRef, transform, transition, isDragging } = useSortable({
        id: column.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Paper
            ref={setNodeRef}
            style={{
                ...style,
                height: '100%',
                width: columnWidth || 320,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0, // 防止列被压缩
                flexGrow: 0,
            }}
            p="xs"
            withBorder
            radius="sm"
        >
            <Stack gap="xs" style={{ height: '100%', display: 'flex' }}>
                {/* 列标题和统计 */}
                <Group justify="space-between" align="center">
                    <Group gap="xs" align="center">
                        <Text c="dimmed" size="md" fw={600}>
                            {column.title}
                        </Text>
                    </Group>
                </Group>

                {/* 卡片列表区域 */}
                <ScrollArea type="always" scrollbarSize={10} style={{ flex: 1, height: '100%' }}>
                    <SortableContext
                        items={column.cards.map((card: any) => card.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <Stack gap="xs" style={{ minHeight: 100 }}>
                            {column.cards.map((card: any) => (
                                <DraggableCard
                                    key={card.id}
                                    card={card}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onView={onView}
                                    model={model}
                                    viewData={viewData}
                                />
                            ))}
                        </Stack>
                    </SortableContext>
                </ScrollArea>

                {/* 添加卡片按钮 */}
                <Button
                    variant="subtle"
                    size="sm"
                    radius="xs"
                    leftSection={<Icon icon="mdi:plus" />}
                    px="xs"
                    py="4"
                    loaderProps={{ size: 'xs' }}
                    style={{ marginTop: 'auto' }}
                    onClick={() => onAdd(String(column.id))}
                >
                    添加卡片
                </Button>
            </Stack>
        </Paper>
    );
}

// 纯展示的卡片内容组件（无交互/无 hooks）
function KanbanCardContent({
    card,
    model,
    viewData,
    onEdit,
    onDelete,
}: {
    card: any;
    model: any;
    viewData: any;
    onEdit: (card: any) => void;
    onDelete: (card: any) => void;
}) {
    const items = Array.isArray(viewData.items) ? viewData.items : [];
    const imageItem = items.find((it: any) => it?.widget === 'image');
    const textItems = items.filter((it: any) => it !== imageItem);

    // 检查是否有图片内容
    const hasImage = imageItem && resolveFieldValue(card, imageItem);

    return (
        <Grid gutter="xs" align="flex-start">
            {/* 顶部操作按钮行 - 与标题保持同一水平 */}
            <Grid.Col span={12}>
                <Group justify="space-between" align="center">
                    {/* 左侧：第一个文本项作为标题 */}
                    <Box style={{ flex: 1 }}>
                        {textItems.length > 0 && (
                            <EntityWidgetRenderer
                                widgetName={textItems[0].widget}
                                view={viewData}
                                model={model}
                                field={textItems[0]}
                                object={card}
                                value={resolveFieldValue(card, textItems[0])}
                                behavior={{ mode: 'display' }}
                                showLabel={false}
                            />
                        )}
                    </Box>

                    {/* 右侧：编辑和删除按钮 */}
                    <Group gap="xs">
                        <Tooltip label="编辑">
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(card);
                                }}
                            >
                                <Icon icon="streamline-plump-color:fill-and-sign" />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="删除">
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(card);
                                }}
                            >
                                <Icon icon="streamline-ultimate-color:delete-2" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Grid.Col>

            {/* 内容区域 - 根据是否有图片动态调整布局 */}
            <Grid.Col span={hasImage ? 9 : 12}>
                <Stack gap="xs">
                    {/* 跳过第一个项目（已作为标题显示） */}
                    {textItems.slice(1).map((item: any, index: number) => {
                        const fieldValue = resolveFieldValue(card, item);
                        if (isEmptyValue(fieldValue) && !item.required) return null;
                        if (isEmptyValue(fieldValue) && item.required) {
                            return (
                                <div
                                    key={index}
                                    style={{ gridColumn: `span ${item.spanCols || 12}` }}
                                >
                                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                                        {(item.label || item.name) + ': 无数据'}
                                    </Text>
                                </div>
                            );
                        }
                        return (
                            <div key={index} style={{ gridColumn: `span ${item.spanCols || 12}` }}>
                                <EntityWidgetRenderer
                                    widgetName={item.widget}
                                    view={viewData}
                                    model={model}
                                    field={item}
                                    object={card}
                                    value={fieldValue}
                                    behavior={{ mode: 'display' }}
                                    showLabel={false}
                                />
                            </div>
                        );
                    })}
                </Stack>
            </Grid.Col>

            {/* 图片区域 - 只有当有图片内容时才显示 */}
            {hasImage && (
                <Grid.Col span={3}>
                    <EntityWidgetRenderer
                        widgetName={imageItem.widget}
                        view={viewData}
                        model={model}
                        field={imageItem}
                        object={card}
                        value={resolveFieldValue(card, imageItem)}
                        behavior={{ mode: 'display' }}
                        showLabel={false}
                    />
                </Grid.Col>
            )}
        </Grid>
    );
}

// 可拖拽的卡片组件
function DraggableCard({
    card,
    onEdit,
    onDelete,
    onView,
    model,
    viewData,
}: {
    card: any;
    onEdit: (card: any) => void;
    onDelete: (card: any) => void;
    onView: (card: any) => void;
    model: any;
    viewData: any;
}) {
    const { attributes, listeners, setNodeRef } = useSortable({
        id: card.id,
    });

    const items = Array.isArray(viewData.items) ? viewData.items : [];
    const imageItem = items.find((it: any) => it?.widget === 'image');
    const textItems = items.filter((it: any) => it !== imageItem);

    // 检查是否有图片内容
    const hasImage = imageItem && resolveFieldValue(card, imageItem);

    return (
        <Card ref={setNodeRef} padding="sm" radius="sm" withBorder onClick={() => onView(card)}>
            <Card.Section p={8} pb={1} pt={5} style={{ height: '20%' }}>
                <Group gap="xs" justify="space-between" align="center">
                    <ActionIcon
                        {...attributes}
                        {...listeners}
                        style={{ cursor: 'grab' }}
                        size="xs"
                        variant="subtle"
                        color="gray"
                    >
                        <Icon icon="mdi:drag" />
                    </ActionIcon>

                    {/* 左侧：第一个文本项作为标题 */}
                    <Box style={{ flex: 1 }}>
                        {textItems.length > 0 && (
                            <EntityWidgetRenderer
                                widgetName={textItems[0].widget}
                                view={viewData}
                                model={model}
                                field={textItems[0]}
                                object={card}
                                value={resolveFieldValue(card, textItems[0])}
                                behavior={{ mode: 'display' }}
                                showLabel={false}
                            />
                        )}
                    </Box>

                    {/* 右侧：编辑和删除按钮 */}
                    <Tooltip label="编辑">
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(card);
                            }}
                        >
                            <EditIcon size={13} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="删除">
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(card);
                            }}
                        >
                            <TrashIcon size={13} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Card.Section>
            <Card.Section p={8} py={1} pb={8} style={{ height: '80%' }}>
                <Grid gutter={4} mt="xs">
                    {/* 内容区域 - 根据是否有图片动态调整布局 */}
                    <Grid.Col span={hasImage ? 9 : 12}>
                        {/* 跳过第一个项目（已作为标题显示） */}
                        {textItems.slice(1).map((item: any, index: number) => {
                            const fieldValue = resolveFieldValue(card, item);
                            if (isEmptyValue(fieldValue) && !item.required) return null;
                            if (isEmptyValue(fieldValue) && item.required) {
                                return (
                                    <div
                                        key={index}
                                        style={{ gridColumn: `span ${item.spanCols || 12}` }}
                                    >
                                        <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                                            {(item.label || item.name) + ': 无数据'}
                                        </Text>
                                    </div>
                                );
                            }
                            return (
                                <div
                                    key={index}
                                    style={{ gridColumn: `span ${item.spanCols || 12}` }}
                                >
                                    <EntityWidgetRenderer
                                        widgetName={item.widget}
                                        view={viewData}
                                        model={model}
                                        field={item}
                                        object={card}
                                        value={fieldValue}
                                        behavior={{ mode: 'display' }}
                                        showLabel={false}
                                    />
                                </div>
                            );
                        })}
                    </Grid.Col>

                    {/* 图片区域 - 只有当有图片内容时才显示 */}
                    {hasImage && (
                        <Grid.Col span={3}>
                            <EntityWidgetRenderer
                                widgetName={imageItem.widget}
                                view={viewData}
                                model={model}
                                field={imageItem}
                                object={card}
                                value={resolveFieldValue(card, imageItem)}
                                behavior={{ mode: 'display' }}
                                showLabel={false}
                            />
                        </Grid.Col>
                    )}
                </Grid>
            </Card.Section>
        </Card>
    );
}
