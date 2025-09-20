'use client';

import type { TreeNodeData, RenderTreeNodePayload } from '@mantine/core';
import type { EntityWidgetProps } from '../../../../components/types';
import type { IEntityObject, EntityTreeNode } from '../../../../types';

import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { PlusIcon, TrashIcon, ChevronDownIcon, ListCollapseIcon } from 'lucide-react';
import { Tree, Flex, Text, Stack, Loader, Button, Center, useTree } from '@mantine/core';

import { toDataSourceHook } from '../../../../lib/hooks';
import {
    useEntityEngine,
    EntityViewContainer,
    useMasterDetailViewContainer,
} from '../../../../uikit';

export function GraphComp(props: EntityWidgetProps) {
    const { object, model, field } = props;
    const [rootObjectId, setRootObjectId] = useState<string | undefined>(object?.id);
    const engine = useEntityEngine();
    const { performAction, currentAction, broadcastData, parentContext } =
        useMasterDetailViewContainer();

    const options = field.widgetOptions;

    const selfChildrenFieldName = options?.selfChildrenFieldName || 'children';

    const dataSource = engine.datasourceFactory.getDataSource();
    const dataSourceHooks = toDataSourceHook(dataSource);

    const handleNodeSelected = useCallback(
        (node: EntityTreeNode) => {
            if (node.data) {
                console.log('Node selected:', node.data);
                performAction({
                    actionType: 'view',
                    payload: {
                        modelName: model.name,
                        viewType: 'form',
                        viewName: options?.editViewName,
                    },
                    contextObject: node.data,
                });
            }
        },
        [performAction, model.name]
    );

    const { data, loading, error, isFetching, refetch } = dataSourceHooks.useFindTreeObjects(
        {
            modelName: model.name,
            fieldName: selfChildrenFieldName as string,
            rootObjectId,
        },
        {
            enabled: !!rootObjectId,
        }
    );

    const reload = useCallback(
        (rootObjId?: string) => {
            if (rootObjId) {
                setRootObjectId(rootObjId);
            }
            refetch?.();
        },
        [refetch]
    );

    const deleteNodes = useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return false;
            const ret = await dataSource.deleteMany({ ids });
            reload();
            return ret;
        },
        [dataSource, reload]
    );

    if (loading || isFetching) {
        return <Loader size="sm" variant="dots" />;
    }
    if (error) {
        console.error('Error fetching data:', error);
        return <div>Error loading data</div>;
    }

    return (
        <InnerGraphComp
            {...props}
            data={data}
            handleNodeSelected={handleNodeSelected}
            reload={reload}
            deleteNodes={deleteNodes}
        />
    );
}

type InnerGraphCompProps = EntityWidgetProps & {
    data: EntityTreeNode | EntityTreeNode[] | null | undefined;
    handleNodeSelected: (node: EntityTreeNode) => void;
    reload?: (rootObjId?: string) => void;
    deleteNodes?: (ids: string[]) => Promise<boolean>;
};

function InnerGraphComp(props: InnerGraphCompProps) {
    const { data, field, handleNodeSelected, reload, deleteNodes, model } = props;
    const { currentAction, parentContext } = useMasterDetailViewContainer();
    const cardViewName = field?.widgetOptions?.cardViewName;
    const fromModelName =
        field?.widgetOptions?.fromModelName || currentAction?.contextObject?.modelName;
    const fromFieldName = field?.widgetOptions?.fromFieldName;
    const childrenFieldName = field?.widgetOptions?.selfChildrenFieldName || 'children';
    const createViewName = field?.widgetOptions?.createViewName;
    const editViewName = field?.widgetOptions?.editViewName || createViewName;
    const [activedNode, setActivedNode] = useState<boolean>(false);

    const tree = useTree({
        initialSelectedState: [], // Initialize with no selected nodes
        multiple: false, // Allow multiple selections if needed
    });

    // 使用 useMemo 缓存转换后的树数据
    const tData: TreeNodeData[] = useMemo(
        () => convertToTreeData(data, field.widgetOptions),
        [data, field.widgetOptions]
    );

    const hasChidrenNode = (nodeId: string) => {
        const findNode = (nodes: TreeNodeData[]): boolean => {
            for (const node of nodes) {
                if (node.value === nodeId) {
                    return !!node.children && node.children.length > 0;
                }
                if (node.children) {
                    const foundInChildren = findNode(node.children);
                    if (foundInChildren) {
                        return true;
                    }
                }
            }
            return false;
        };
        return findNode(tData);
    };

    // 使用 useCallback 缓存 handleNodeClick 函数
    const handleNodeClick = useCallback(
        (node: TreeNodeData) => {
            tree.select(node.value); // Update the tree selection
            if (node.nodeProps?.entityData) {
                // Perform any action with the selected node's entity data
                console.log('Selected node data:', node.nodeProps.entityData);
                handleNodeSelected(node.nodeProps.entityData);
            }
        },
        [tree]
    );

    const handleCreateNode = useCallback(() => {
        console.log('Create new node');
        let modalId: string | null = null;
        const onObjectChanged = (obj: IEntityObject) => {
            console.log('Object changed, refreshing tree data');
            if (obj) {
                reload?.(obj.id); // 更新根节点 ID
                if (modalId) {
                    modals.close(modalId); // 关闭创建节点的模态框
                }
            }
        };
        const onChildObjectChanged = (obj: IEntityObject) => {
            console.log('Object changed, refreshing tree data');
            if (obj) {
                reload?.(); // 更新根节点 ID
                if (modalId) {
                    modals.close(modalId); // 关闭创建节点的模态框
                }
            }
        };

        if (tree.selectedState.length > 0) {
            const selectedNode = tree.selectedState[0];
            console.log('Selected node for creation:', selectedNode);
            modalId = modals.open({
                title: '创建节点',
                children: (
                    <EntityViewContainer
                        modelName={model.name}
                        viewType="form"
                        viewName={createViewName as string}
                        baseObjectId=""
                        callbacks={{
                            onObjectUpdated: onChildObjectChanged,
                            onObjectDeleted: onChildObjectChanged,
                            onObjectCreated: onChildObjectChanged,
                        }}
                        reference={{
                            fromModelName: model.name,
                            fromFieldName: (childrenFieldName as string) || 'children',
                            fromObjectId: selectedNode,
                            toModelName: model.name,
                        }}
                        behavior={{ mode: 'edit', toCreating: true }}
                    />
                ),
                size: '80%',
                centered: true,
                closeOnClickOutside: true,
                closeOnEscape: true,
            });
        } else {
            if (tData.length <= 0) {
                modalId = modals.open({
                    title: '创建根节点',
                    children: (
                        <EntityViewContainer
                            modelName={model.name}
                            viewType="form"
                            viewName={createViewName as string}
                            baseObjectId=""
                            callbacks={{
                                onObjectUpdated: onObjectChanged,
                                onObjectDeleted: onObjectChanged,
                                onObjectCreated: onObjectChanged,
                            }}
                            reference={{
                                fromModelName,
                                fromFieldName: fromFieldName as string,
                                fromObjectId: parentContext?.id || '',
                                toModelName: model.name,
                            }}
                            behavior={{ mode: 'edit', toCreating: true }}
                        />
                    ),
                    size: '80%',
                    centered: true,
                    closeOnClickOutside: true,
                    closeOnEscape: true,
                });
            }
        }
    }, [tree.selectedState, currentAction, reload, field, model, data]);

    const handleDeleteNode = useCallback(async () => {
        // Handle node deletion logic here
        const selectedNodes = tree.selectedState;
        if (selectedNodes.length > 0) {
            console.log('Delete selected nodes:', selectedNodes);
            const seledtedNode = selectedNodes[0];
            if (hasChidrenNode(seledtedNode)) {
                notifications.show({
                    title: '删除节点失败',
                    message: '请先删除子节点',
                    color: 'red',
                    autoClose: 3000,
                });
                return;
            }
            modals.openConfirmModal({
                title: '确认删除',
                children: <Text size="sm">确认删除当前选中的节点吗？此操作不可撤销。</Text>,
                labels: { confirm: '删除', cancel: '取消' },
                confirmProps: { color: 'red' },
                centered: true,
                onConfirm: async () => {
                    const ret = await deleteNodes?.([seledtedNode]);
                    if (ret) {
                        notifications.show({
                            title: '删除节点成功',
                            message: '节点已删除',
                            color: 'green',
                            autoClose: 3000,
                        });
                    }
                },
            });
        } else {
            console.warn('No nodes selected for deletion');
        }
    }, [deleteNodes, hasChidrenNode, tree.selectedState]);

    // 使用 useCallback 缓存 renderNode 函数
    const renderNode = useCallback(
        (payload: RenderTreeNodePayload) => (
            <GraphTreeNode {...payload} handleNodeClick={handleNodeClick} />
        ),
        [handleNodeClick]
    );

    useEffect(() => {
        const activeFirstNode = () => {
            if (!activedNode && tData.length > 0) {
                console.log('Tree data loaded:', tData);
                handleNodeClick(tData[0]); // 默认选中第一个节点
                setActivedNode(true); // 设置已激活状态，避免重复激活
            }
        };
        setTimeout(activeFirstNode, 100);
    }, [handleNodeClick, tData]);

    return (
        <Stack>
            <Flex justify="flex-start" align="center">
                <Button
                    variant="subtle"
                    size="compact-sm"
                    radius="sm"
                    leftSection={<PlusIcon size={14} />}
                    onClick={handleCreateNode}
                >
                    添加
                </Button>
                {tData.length > 0 && (
                    <Button
                        variant="subtle"
                        size="compact-sm"
                        radius="sm"
                        leftSection={<TrashIcon size={14} color="red" />}
                        disabled={tree.selectedState.length <= 0}
                        onClick={handleDeleteNode}
                    >
                        删除
                    </Button>
                )}
            </Flex>
            <Tree
                tree={tree}
                data={tData}
                selectOnClick
                renderNode={renderNode}
                style={{
                    height: '100%',
                    overflowY: 'auto',
                }}
            />
            {!tData || tData.length === 0 ? (
                <Center>
                    <Text size="sm" color="dimmed">
                        暂无数据
                    </Text>
                </Center>
            ) : null}
        </Stack>
    );
}

type GraphTreeNodeProps = RenderTreeNodePayload & {
    handleNodeClick: (node: TreeNodeData) => void;
};

function GraphTreeNode(payload: GraphTreeNodeProps) {
    const { node, level, expanded, hasChildren, selected, elementProps, handleNodeClick } = payload;
    const { style, onClick, ...restElementProps } = elementProps;
    return (
        <Flex
            gap="xs"
            justify="flex-start"
            align="center"
            bdrs={6}
            style={{
                cursor: 'pointer',
                padding: '4px 4px',
                paddingLeft: `${(level - 1) * 20 + 4}px`,
                ...style,
            }}
            onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node);
                onClick?.(e); // Call the original onClick if it exists
            }}
            {...restElementProps}
        >
            <ListCollapseIcon size={14} />
            <Text size="sm" fw={500}>
                {node.label}
            </Text>
            {hasChildren && (
                <ChevronDownIcon
                    size={14}
                    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            )}
        </Flex>
    );
}

function convertToTreeData(
    data: EntityTreeNode | EntityTreeNode[] | null | undefined,
    widgetOptions: { [key: string]: any } | undefined
): TreeNodeData[] {
    if (!data) {
        return [];
    }
    const titleFieldName = widgetOptions?.titleFieldName || 'name';

    const convertNode = (node: EntityTreeNode): TreeNodeData | null => {
        if (!node.data) {
            return null;
        }
        const label = node.data.values[titleFieldName] || node.data.id || 'Untitled';

        const children: TreeNodeData[] = node.children
            .map((child) => convertNode(child))
            .filter((child): child is TreeNodeData => child !== null);

        return {
            label,
            value: node.data.id,
            children: children.length > 0 ? children : undefined,
            nodeProps: {
                entityData: node,
                parentId: node.parentId,
            },
        };
    };

    if (Array.isArray(data)) {
        return data
            .map((node) => convertNode(node))
            .filter((node): node is TreeNodeData => node !== null);
    } else {
        const converted = convertNode(data);
        return converted ? [converted] : [];
    }
}
