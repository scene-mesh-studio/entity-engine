'use client';

import type { EditMode } from '../types/editor';
import type { IEntityView, IEntityModel, IEntityField, IEntityViewField } from '../types/entities';

import { CSS } from '@dnd-kit/utilities';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { arrayMove, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
    useSensor,
    DndContext,
    useSensors,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    Box,
    Text,
    List,
    Chip,
    Card,
    Tabs,
    Paper,
    Alert,
    Stack,
    Group,
    Badge,
    Button,
    Select,
    Switch,
    Portal,
    Tooltip,
    Textarea,
    TextInput,
    ActionIcon,
    ScrollArea,
} from '@mantine/core';

import { Icon } from '../utils/icon-mapping';
import { deepEqual } from '../utils/data-utils';
import { componentStyles } from '../utils/theme';
import { FieldSelectorDialog } from './model-editor';
import { StudioEngineService } from '../services/studio-engine-service';
import { useStudioEngineOptional } from '../providers/studio-engine-provider';

const TREE_NODE_STYLES = {
    CONTAINER_CLASS: 'tree-node-item',
    TEXT_CONTAINER_CLASS: 'text-container',
    STYLE_ID: 'view-tree-node-styles',
} as const;

const treeNodeStyles = `
.${TREE_NODE_STYLES.CONTAINER_CLASS} {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-start !important;
}
.${TREE_NODE_STYLES.CONTAINER_CLASS} * {
  box-sizing: border-box;
}
.${TREE_NODE_STYLES.CONTAINER_CLASS} .${TREE_NODE_STYLES.TEXT_CONTAINER_CLASS} {
  display: flex !important;
  align-items: center !important;
  flex: 1 !important;
}
`;

const injectTreeNodeStyles = (() => {
    let injected = false;
    return () => {
        if (typeof document !== 'undefined' && !injected) {
            if (!document.querySelector(`#${TREE_NODE_STYLES.STYLE_ID}`)) {
                const styleElement = document.createElement('style');
                styleElement.id = TREE_NODE_STYLES.STYLE_ID;
                styleElement.textContent = treeNodeStyles;
                document.head.appendChild(styleElement);
                injected = true;
            }
        }
    };
})();

injectTreeNodeStyles();

/**
 * 使用API获取组件数据的Hook
 */
function useStudioComponentData() {
    const engine = useStudioEngineOptional();
    const [studioService, setStudioService] = React.useState<StudioEngineService | null>(null);
    const [availableWidgets, setAvailableWidgets] = React.useState<any[]>([]);
    const [availableSuites, setAvailableSuites] = React.useState<any[]>([]);
    const [availableViewTypes, setAvailableViewTypes] = React.useState<any[]>([]);
    const [availableDensityOptions, setAvailableDensityOptions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (engine) {
            const service = new StudioEngineService(engine);
            setStudioService(service);
        }
    }, [engine]);

    React.useEffect(() => {
        async function loadComponentData() {
            if (studioService) {
                setLoading(true);
                try {
                    const [widgets, suites, densityOptions] = await Promise.all([
                        studioService.getAvailableWidgets(),
                        studioService.getAvailableComponentSuites(),
                        studioService.getAvailableDensityOptions(),
                    ]);

                    // 视图类型是同步获取
                    const viewTypes = studioService.getAvailableViewTypes();

                    setAvailableWidgets(widgets || []);
                    setAvailableSuites(suites || []);
                    setAvailableViewTypes(viewTypes || []);
                    setAvailableDensityOptions(densityOptions || []);
                } catch {
                    console.error('Failed to load component data:');
                } finally {
                    setLoading(false);
                }
            }
        }

        loadComponentData();
    }, [studioService]);

    return {
        availableWidgets,
        availableSuites,
        availableViewTypes,
        availableDensityOptions,
        loading,
        hasRealData: availableWidgets.length > 0,
    };
}

function validateSelectOptions<T extends { value?: any; label?: any }>(
    options: T[]
): Array<T & { value: string; label: string }> {
    if (!Array.isArray(options)) {
        return [];
    }

    const seen = new Set<string>();
    return options
        .filter((option) => option?.value && option?.label)
        .map((option) => ({
            ...option,
            value: String(option.value),
            label: String(option.label),
        }))
        .filter((option) => {
            if (seen.has(option.value)) {
                return false; // 跳过重复的value
            }
            seen.add(option.value);
            return true;
        });
}

export interface ViewTypeInfo {
    value: string;
    label: string;
    icon: string;
    description?: string;
}

export interface WidgetParameterSpec {
    type: 'boolean' | 'string' | 'number' | 'enum' | 'object' | 'array' | 'function';
    options?: any[];
    range?: { min?: number; max?: number; step?: number };
    default?: any;
    description?: string;
    source?: string;
    examples?: any[];
}

export interface WidgetConfigSpec {
    [paramName: string]: WidgetParameterSpec;
}

export interface ViewParameterSpec {
    type: 'boolean' | 'string' | 'number' | 'enum' | 'object' | 'array' | 'function';
    options?: any[];
    range?: { min?: number; max?: number; step?: number };
    default?: any;
    description?: string;
    source?: string;
    examples?: any[];
}

export interface ViewConfigSpec {
    [paramName: string]: ViewParameterSpec;
}

export interface WidgetTypeInfo {
    value: string;
    label: string;
    icon: string;
    description?: string;
    viewType: string;
    defaultConfig?: Record<string, any>;
    configSpec?: WidgetConfigSpec;
}

async function getWidgetDefaultConfigForEditor(
    widgetType: string,
    viewType: string,
    studioService?: StudioEngineService
): Promise<Record<string, any>> {
    if (!studioService) return {};

    const result = await studioService.analyzeWidget({
        widgetType,
        viewType,
        useCache: true,
    });

    if (result?.success && result.data?.configSpec) {
        const defaults: Record<string, any> = {};
        Object.entries(result.data.configSpec).forEach(([key, spec]: [string, any]) => {
            if (spec.default !== undefined) {
                defaults[key] = spec.default;
            }
        });
        return defaults;
    }

    return {};
}

async function getWidgetConfigSpecForEditor(
    widgetType: string,
    viewType: string,
    studioService?: StudioEngineService | null,
    forceRefresh = false
): Promise<WidgetConfigSpec> {
    if (!studioService) return {};

    if (forceRefresh) {
        await studioService.clearWidgetAnalysisCache();
    }

    const result = await studioService.getWidgetConfigSpec({
        widgetType,
        viewType,
    });

    if (result?.success && result.data) {
        return result.data.configSpec ?? {};
    }

    return {};
}

async function clearWidgetAnalysisCache(studioService?: StudioEngineService | null): Promise<void> {
    if (!studioService) return;
    await studioService.clearWidgetAnalysisCache();
}

async function getViewConfigSpecForEditor(
    viewType: string,
    studioService?: StudioEngineService | null,
    forceRefresh = false
): Promise<ViewConfigSpec> {
    if (!studioService) return {};

    if (forceRefresh) {
        await clearWidgetAnalysisCache(studioService);
    }

    const result = await studioService.getViewConfigSpec({
        viewType,
    });

    if (result?.success) {
        return result.data?.configSpec ?? {};
    }

    return {};
}

export interface HierarchicalViewEditorProps {
    config: IEntityView;
    modelConfig?: IEntityModel;
    onChange: (config: IEntityView) => void;
    onModeChange: (mode: EditMode) => void;
    editMode?: EditMode;
}

export interface EnhancedFieldEditorProps {
    field: IEntityViewField;
    modelField?: IEntityField;
    viewType?: string;
    onFieldChange: (updatedField: IEntityViewField) => void;
    availableWidgets?: WidgetTypeInfo[]; // 传入已转换的widget数据
}

export interface UniversalFieldsEditorProps {
    fields: IEntityViewField[];
    onChange: (fields: IEntityViewField[]) => void;
    context?: {
        parentWidget?: string;
        viewType?: string;
        maxDepth?: number;
        level?: number;
    };
    showHeader?: boolean;
    headerTitle?: string;
    showPreview?: boolean;
    compact?: boolean;
    availableWidgets?: WidgetTypeInfo[]; // 新增：传入可用的widgets
}

export interface WidgetConfigEditorProps {
    widgetType: string;
    viewType: string;
    config: Record<string, any>;
    onChange: (config: Record<string, any>) => void;
}

export interface ViewOptionsEditorProps {
    viewType: string;
    config: Record<string, any>;
    onChange: (config: Record<string, any>) => void;
}

/**
 * 增强的可拖拽排序的字段项 - 支持嵌套字段管理
 */
const SortableFieldItem = React.memo(function SortableFieldItem({
    node,
    level,
    isSelected,
    onSelectNode,
    onAddChild,
    onDeleteNode,
    onMoveUp,
    onMoveDown,
}: {
    node: ConfigTreeNode;
    level: number;
    isSelected: boolean;
    onSelectNode: (id: string) => void;
    onAddChild?: (parentId: string) => void;
    onDeleteNode?: (id: string) => void;
    onMoveUp?: (id: string) => void;
    onMoveDown?: (id: string) => void;
}) {
    const [isHovered, setIsHovered] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: node.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    const actualLevel = node.level >= 0 ? node.level : level;

    const getNodeIcon = () => {
        switch (node.type) {
            case 'field-item':
                return 'solar:widget-bold';
            case 'nested-field':
                return 'solar:widget-2-bold';
            case 'deep-nested-field':
                return 'solar:widget-3-bold';
            case 'items-config':
                return 'solar:list-bold';
            case 'view-config':
                return 'solar:settings-bold';
            case 'basic-info':
                return 'solar:info-circle-bold';
            default:
                return 'solar:folder-bold';
        }
    };

    return (
        <Box
            ref={setNodeRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelectNode(node.id)} // 整个节点区域可点击
            style={{
                ...style,
                position: 'relative',
                paddingLeft: 8, // 统一左间距，不再基于层级递进
                paddingTop: 6,
                paddingBottom: 6,
                paddingRight: 8,
                cursor: isDragging ? 'grabbing' : 'pointer',
                minHeight: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isSelected
                    ? componentStyles.treeNode.selectedBackground
                    : isHovered
                      ? 'var(--mantine-color-gray-0)'
                      : 'transparent',
                borderLeft:
                    actualLevel > 0
                        ? `3px solid var(--mantine-color-${['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange'][Math.min(actualLevel, 6)]}-6)` // 增强边框颜色区分
                        : 'none',
                borderRadius: 4,
                transition: 'all 0.2s ease',
                marginBottom: 2,
            }}
        >
            {/* 左侧：拖拽手柄和节点信息 */}
            <Group
                gap="xs"
                style={{
                    flex: 1,
                    minWidth: 0,
                    pointerEvents: 'none', // 禁用pointer events，由父容器处理点击
                }}
            >
                {/* 拖拽手柄 */}
                <Box
                    {...attributes}
                    {...listeners}
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        color: 'var(--mantine-color-dimmed)',
                        pointerEvents: 'auto', // 重新启用拖拽手柄的事件
                    }}
                    onClick={(e) => e.stopPropagation()} // 阻止冒泡到父容器
                >
                    <Icon icon={'mdi:dots-vertical' as any} size={12} />
                </Box>

                {/* 显示层级标识或图标 */}
                {actualLevel > 0 ? (
                    <Badge
                        size="sm"
                        color={
                            ['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange'][
                                Math.min(actualLevel, 6)
                            ]
                        } // 颜色递进区分层级
                        variant="light"
                        style={{ pointerEvents: 'none' }}
                    >
                        L{actualLevel + 1}
                    </Badge>
                ) : (
                    <Icon icon={getNodeIcon()} size={16} style={{ pointerEvents: 'none' }} />
                )}
                <Text
                    size="sm"
                    fw={isSelected ? 600 : 500}
                    c={
                        isSelected
                            ? componentStyles.treeNode.selectedText
                            : componentStyles.treeNode.normalText
                    }
                    style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                    }}
                >
                    {node.label}
                </Text>
            </Group>

            {isHovered && (
                <Group
                    gap={2}
                    onClick={(e) => e.stopPropagation()}
                    style={{ pointerEvents: 'auto' }} // 重新启用操作按钮的事件
                >
                    {node.canAddChildren && onAddChild && (
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="blue"
                            onClick={() => onAddChild(node.id)}
                            title="添加嵌套字段"
                        >
                            <Icon icon="solar:add-circle-bold" size={12} />
                        </ActionIcon>
                    )}

                    {node.canDelete && onDeleteNode && (
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={() => onDeleteNode(node.id)}
                            title="删除字段"
                        >
                            <Icon icon="solar:trash-bin-trash-bold" size={12} />
                        </ActionIcon>
                    )}
                </Group>
            )}
        </Box>
    );
});

/**
 * 增强的树节点组件 - 集成操作按钮和嵌套字段管理，支持递归渲染
 */
const EnhancedTreeNode = React.memo(function EnhancedTreeNode({
    node,
    level,
    isSelected,
    onSelectNode,
    onAddChild,
    onDeleteNode,
    onMoveUp,
    onMoveDown,
}: {
    node: ConfigTreeNode;
    level: number;
    isSelected: boolean;
    onSelectNode: (id: string) => void;
    onAddChild?: (parentId: string) => void;
    onDeleteNode?: (id: string) => void;
    onMoveUp?: (id: string) => void;
    onMoveDown?: (id: string) => void;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [nodeRef, setNodeRef] = useState<HTMLElement | null>(null);
    const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number } | null>(
        null
    );
    const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
    const actualLevel = node.level >= 0 ? node.level : level;

    // 计算悬浮按钮的位置
    useEffect(() => {
        if (isHovered && nodeRef) {
            const rect = nodeRef.getBoundingClientRect();
            setButtonPosition({
                top: rect.top + rect.height / 2,
                left: rect.right + 10,
            });
        } else {
            setButtonPosition(null);
        }
    }, [isHovered, nodeRef]);

    // 清理定时器
    useEffect(
        () => () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }
        },
        [hideTimeout]
    );

    // 鼠标进入节点
    const handleNodeMouseEnter = useCallback(() => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            setHideTimeout(null);
        }
        setIsHovered(true);
    }, [hideTimeout]);

    // 鼠标离开节点 - 延迟隐藏
    const handleNodeMouseLeave = useCallback(() => {
        const timeout = setTimeout(() => {
            setIsHovered(false);
        }, 100); // 100ms延迟给用户时间移动到弹窗
        setHideTimeout(timeout);
    }, []);

    // 鼠标进入弹窗 - 取消隐藏
    const handlePopupMouseEnter = useCallback(() => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            setHideTimeout(null);
        }
        setIsHovered(true);
    }, [hideTimeout]);

    // 鼠标离开弹窗 - 立即隐藏
    const handlePopupMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    // 根据层级设置不同的视觉样式
    const getNodeStyle = (): React.CSSProperties => ({
        paddingLeft: 8, // 统一左间距，不再基于层级递进
        paddingTop: 6,
        paddingBottom: 6,
        paddingRight: 8,
        cursor: 'pointer',
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isSelected
            ? componentStyles.treeNode.selectedBackground
            : isHovered
              ? 'var(--mantine-color-gray-0)'
              : 'transparent',
        borderLeft:
            actualLevel > 0
                ? `3px solid var(--mantine-color-${['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange'][Math.min(actualLevel, 6)]}-6)` // 增强边框颜色区分
                : 'none',
        borderRadius: 4,
        transition: 'all 0.2s ease',
        marginBottom: 2,
    });

    const getNodeIcon = () => {
        switch (node.type) {
            case 'field-item':
                return 'solar:widget-bold';
            case 'nested-field':
                return 'solar:widget-2-bold';
            case 'deep-nested-field':
                return 'solar:widget-3-bold';
            case 'items-config':
                return 'solar:list-bold';
            case 'view-config':
                return 'solar:settings-bold';
            case 'basic-info':
                return 'solar:info-circle-bold';
            default:
                return 'solar:folder-bold';
        }
    };

    return (
        <Box style={{ position: 'relative' }}>
            {/* 主节点 - 整个区域可点击 */}
            <Box
                ref={setNodeRef}
                onMouseEnter={handleNodeMouseEnter}
                onMouseLeave={handleNodeMouseLeave}
                onClick={() => onSelectNode(node.id)} // 整个节点区域可点击
                style={getNodeStyle()}
            >
                {/* 左侧：节点信息 */}
                <Group
                    gap="xs"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        pointerEvents: 'none',
                    }}
                >
                    {/* 显示层级标识或图标 */}
                    {actualLevel > 0 ? (
                        <Badge
                            size="sm"
                            color={
                                ['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange'][
                                    Math.min(actualLevel, 6)
                                ]
                            } // 颜色递进区分层级
                            variant="light"
                            style={{ pointerEvents: 'none' }}
                        >
                            L{actualLevel + 1}
                        </Badge>
                    ) : (
                        <Icon icon={getNodeIcon()} size={16} style={{ pointerEvents: 'none' }} />
                    )}
                    <Text
                        size="sm"
                        fw={isSelected ? 600 : 500}
                        c={
                            isSelected
                                ? componentStyles.treeNode.selectedText
                                : componentStyles.treeNode.normalText
                        }
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                        }}
                    >
                        {node.label}
                    </Text>
                </Group>

                {/* 右侧：操作按钮组（鼠标悬停时显示在节点右侧） */}
            </Box>

            {/* 使用Portal渲染悬浮按钮到body，避免容器裁剪 */}
            {buttonPosition && (
                <Portal>
                    <Box
                        style={{
                            position: 'fixed',
                            top: buttonPosition.top,
                            left: buttonPosition.left,
                            transform: 'translateY(-50%)',
                            zIndex: 10000,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'flex',
                            gap: 4,
                            pointerEvents: 'auto', // 确保Portal按钮可点击
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={handlePopupMouseEnter}
                        onMouseLeave={handlePopupMouseLeave}
                    >
                        {node.canAddChildren && onAddChild && (
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="blue"
                                onClick={() => onAddChild(node.id)}
                                title="添加嵌套字段"
                            >
                                <Icon icon="solar:add-circle-bold" size={12} />
                            </ActionIcon>
                        )}

                        {node.canMoveUp && onMoveUp && (
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                onClick={() => onMoveUp(node.id)}
                                title="上移"
                            >
                                <Icon icon="solar:arrow-up-bold" size={12} />
                            </ActionIcon>
                        )}

                        {node.canMoveDown && onMoveDown && (
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                onClick={() => onMoveDown(node.id)}
                                title="下移"
                            >
                                <Icon icon="solar:arrow-down-bold" size={12} />
                            </ActionIcon>
                        )}

                        {node.canDelete && onDeleteNode && (
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={() => onDeleteNode(node.id)}
                                title="删除字段"
                            >
                                <Icon icon="solar:trash-bin-trash-bold" size={12} />
                            </ActionIcon>
                        )}
                    </Box>
                </Portal>
            )}
        </Box>
    );
});

/**
 * 根据字段路径查找字段的工具函数
 */
const findFieldByPath = (
    items: IEntityViewField[],
    path: string[]
): { field: IEntityViewField | null; parent: IEntityViewField | null; index: number } => {
    // path格式: ['items', '0', 'fields', '1', 'fields', '0']
    let current: any = { items };
    let parent: IEntityViewField | null = null;
    let index = -1;

    for (let i = 0; i < path.length; i++) {
        const segment = path[i];

        if (segment === 'items' || segment === 'fields') {
            parent = current.items ? null : current; // items级别没有父字段
            current = current[segment];
        } else {
            index = parseInt(segment, 10);
            if (!Array.isArray(current) || index < 0 || index >= current.length) {
                return { field: null, parent: null, index: -1 };
            }
            current = current[index];
        }
        if (!current) {
            return { field: null, parent: null, index: -1 };
        }
    }

    return { field: current, parent, index };
};

/**
 * 解析节点ID获取字段路径的工具函数
 */
const parseNodeId = (nodeId: string): string[] => {
    if (!nodeId.startsWith('field-')) return [];

    const pathParts = nodeId.replace('field-', '').split('-');
    const fieldPath: string[] = [];

    // 重建路径: field-items-0-fields-1 => ['items', '0', 'fields', '1']
    for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'items' || pathParts[i] === 'fields') {
            fieldPath.push(pathParts[i]);
        } else {
            fieldPath.push(pathParts[i]);
        }
    }

    return fieldPath;
};

/**
 * 树状结构操作管理Hook - 处理嵌套字段的增删改操作
 */
const useTreeOperations = (config: IEntityView, onChange: (config: IEntityView) => void) => {
    // 在指定节点添加子字段 - 修复L3+层级支持
    const addChildField = useCallback(
        (parentNodeId: string) => {
            // 添加子字段

            // 特殊处理items-config节点，直接添加到顶级items数组
            if (parentNodeId === 'items-config') {
                const newField: IEntityViewField = {
                    name: `field_${Date.now()}`,
                    title: '新字段',
                    description: '',
                    icon: '',
                    widget: undefined,
                    widgetOptions: undefined,
                    width: undefined,
                    flex: undefined,
                    spanCols: undefined,
                    order: config.items?.length || 0,
                    fields: undefined,
                    showWhen: undefined,
                    hiddenWhen: undefined,
                    requiredWhen: undefined,
                    readOnlyWhen: undefined,
                    disabledWhen: undefined,
                };

                // 添加顶级字段
                onChange({
                    ...config,
                    items: [...(config.items || []), newField],
                });
                return;
            }

            // 处理嵌套字段添加
            const fieldPath = parseNodeId(parentNodeId);
            // 解析字段路径

            if (fieldPath.length === 0) {
                console.warn('[TreeOperations] 无法解析父节点ID:', parentNodeId);
                return;
            }

            const newField: IEntityViewField = {
                name: `nested_${Date.now()}`,
                title: '新嵌套字段',
                description: '',
                icon: '',
                widget: undefined,
                widgetOptions: undefined,
                width: undefined,
                flex: undefined,
                spanCols: undefined,
                order: 0,
                fields: undefined,
                showWhen: undefined,
                hiddenWhen: undefined,
                requiredWhen: undefined,
                readOnlyWhen: undefined,
                disabledWhen: undefined,
            };

            const newItems = JSON.parse(JSON.stringify(config.items)); // 深拷贝
            // 查找目标字段
            const { field: targetField } = findFieldByPath(newItems, fieldPath);

            // 查找结果

            if (targetField) {
                if (!targetField.fields) {
                    // 初始化目标字段的fields数组
                    targetField.fields = [];
                }
                targetField.fields.push(newField);

                // 成功添加嵌套字段
                onChange({ ...config, items: newItems });
            } else {
                console.error(
                    '[TreeOperations] 未找到目标字段，路径:',
                    fieldPath,
                    '父节点ID:',
                    parentNodeId
                );
                console.error(
                    '[TreeOperations] 当前items结构:',
                    JSON.stringify(config.items, null, 2)
                );
            }
        },
        [config, onChange]
    );

    // 删除字段
    const deleteField = useCallback(
        (nodeId: string) => {
            const fieldPath = parseNodeId(nodeId);
            if (fieldPath.length === 0) return;

            const newItems = JSON.parse(JSON.stringify(config.items)); // 深拷贝

            if (fieldPath.length <= 2) {
                // 删除顶级字段 (items level)
                const index = parseInt(fieldPath[1], 10);
                if (index >= 0 && index < newItems.length) {
                    newItems.splice(index, 1);
                    onChange({ ...config, items: newItems });
                }
            } else {
                // 删除嵌套字段
                const parentPath = fieldPath.slice(0, -2); // 移除最后的 'fields' 和 index
                const index = parseInt(fieldPath[fieldPath.length - 1], 10);

                const { field: parentField } = findFieldByPath(newItems, parentPath);
                if (parentField?.fields && index >= 0 && index < parentField.fields.length) {
                    parentField.fields.splice(index, 1);
                    onChange({ ...config, items: newItems });
                }
            }
        },
        [config, onChange]
    );

    // 字段上移/下移
    const moveField = useCallback(
        (nodeId: string, direction: 'up' | 'down') => {
            const fieldPath = parseNodeId(nodeId);
            if (fieldPath.length === 0) return;

            const newItems = JSON.parse(JSON.stringify(config.items)); // 深拷贝

            if (fieldPath.length <= 2) {
                // 移动顶级字段
                const index = parseInt(fieldPath[1], 10);
                const newIndex = direction === 'up' ? index - 1 : index + 1;

                if (newIndex >= 0 && newIndex < newItems.length && index !== newIndex) {
                    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
                    onChange({ ...config, items: newItems });
                }
            } else {
                // 移动嵌套字段
                const parentPath = fieldPath.slice(0, -2);
                const index = parseInt(fieldPath[fieldPath.length - 1], 10);

                const { field: parentField } = findFieldByPath(newItems, parentPath);
                if (parentField?.fields && index >= 0 && index < parentField.fields.length) {
                    const newIndex = direction === 'up' ? index - 1 : index + 1;

                    if (
                        newIndex >= 0 &&
                        newIndex < parentField.fields.length &&
                        index !== newIndex
                    ) {
                        [parentField.fields[index], parentField.fields[newIndex]] = [
                            parentField.fields[newIndex],
                            parentField.fields[index],
                        ];
                        onChange({ ...config, items: newItems });
                    }
                }
            }
        },
        [config, onChange]
    );

    return {
        addChildField,
        deleteField,
        moveField,
    };
};

// 动态获取Widget的函数
const EnhancedFieldEditor = React.memo(function EnhancedFieldEditor({
    field,
    modelField,
    viewType,
    onFieldChange,
    availableWidgets = [], // 接收已转换的widget数据
}: EnhancedFieldEditorProps) {
    const engine = useStudioEngineOptional();
    const [, setStudioService] = useState<StudioEngineService | null>(null);

    useEffect(() => {
        if (engine) {
            setStudioService(new StudioEngineService(engine));
        }
    }, [engine]);

    const widgetOptions = useMemo(
        (): WidgetTypeInfo[] => availableWidgets || [], // 直接使用传入的已转换数据
        [availableWidgets]
    );

    // 获取当前选中Widget的配置参数
    const selectedWidgetInfo = useMemo(() => {
        if (!field.widget) return null;
        return widgetOptions.find((w) => w.value === field.widget) || null;
    }, [widgetOptions, field.widget]);

    const handleFieldPropertyChange = useCallback(
        (property: keyof IEntityViewField, value: any) => {
            const currentValue = field[property];

            if (currentValue === value) {
                return;
            }
            if (property === 'widget' && value !== field.widget) {
                const shouldResetWidgetOptions =
                    field.widgetOptions && Object.keys(field.widgetOptions).length > 0;
                const updatedField = {
                    ...field,
                    [property]: value,
                    ...(shouldResetWidgetOptions ? { widgetOptions: {} } : {}),
                };
                onFieldChange(updatedField);
            } else {
                const updatedField = {
                    ...field,
                    [property]: value,
                };
                onFieldChange(updatedField);
            }
        },
        [field, onFieldChange]
    );

    const handleWidgetConfigChange = useCallback(
        (config: Record<string, any>) => {
            handleFieldPropertyChange('widgetOptions', config);
        },
        [handleFieldPropertyChange]
    );

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 字段信息头部卡片 - 增强API信息显示 */}
            <Card withBorder>
                <Card.Section p="md">
                    <Group justify="space-between" align="flex-start">
                        <Box>
                            <Group gap="xs" align="center">
                                <Text size="lg" fw={600} c={componentStyles.text.caption}>
                                    {field.title || field.name || '未命名字段'}
                                </Text>
                                {field.widget ? (
                                    selectedWidgetInfo ? (
                                        <Badge size="sm" variant="light" color="blue">
                                            {selectedWidgetInfo.label}
                                        </Badge>
                                    ) : (
                                        <Badge size="sm" variant="light" color="orange">
                                            {field.widget}
                                        </Badge>
                                    )
                                ) : (
                                    <Badge size="sm" variant="light" color="gray">
                                        未配置组件
                                    </Badge>
                                )}
                                {modelField && (
                                    <Badge size="sm" variant="light" color="green">
                                        {modelField.type}
                                    </Badge>
                                )}
                                {/* API数据完整性指示器 */}
                                {field.widgetOptions &&
                                    Object.keys(field.widgetOptions).length > 0 && (
                                        <Badge size="sm" variant="light" color="cyan">
                                            含Widget配置
                                        </Badge>
                                    )}
                                {field.fields && field.fields.length > 0 && (
                                    <Badge size="sm" variant="light" color="purple">
                                        {field.fields.length}个子字段
                                    </Badge>
                                )}
                            </Group>
                            <Text size="sm" c={componentStyles.text.caption} mt={4}>
                                字段名: {field.name} • Widget:{' '}
                                {field.widget
                                    ? selectedWidgetInfo?.label || field.widget
                                    : '未设置'}
                                {modelField && ` • 数据类型: ${modelField.type}`}
                                {field.spanCols && ` • 列宽: ${field.spanCols}/12`}
                                {field.order !== undefined && ` • 顺序: ${field.order}`}
                            </Text>
                            {field.description && (
                                <Text size="sm" c={componentStyles.text.caption} mt={2}>
                                    {field.description}
                                </Text>
                            )}
                            {/* 显示API原始数据摘要 */}
                            <Text
                                size="xs"
                                c={componentStyles.text.muted}
                                mt={4}
                                style={{ fontFamily: 'monospace' }}
                            >
                                API数据:{' '}
                                {JSON.stringify(
                                    {
                                        widget: field.widget || 'undefined',
                                        hasOptions: !!(
                                            field.widgetOptions &&
                                            Object.keys(field.widgetOptions).length > 0
                                        ),
                                        hasFields: !!(field.fields && field.fields.length > 0),
                                        layout: {
                                            spanCols: field.spanCols,
                                            width: field.width,
                                            flex: field.flex,
                                        },
                                    },
                                    null,
                                    0
                                ).slice(0, 120)}
                                ...
                            </Text>
                        </Box>
                        <Group gap="xs">
                            {field.showWhen && (
                                <Badge size="xs" color="orange" variant="light">
                                    条件显示
                                </Badge>
                            )}
                            {field.requiredWhen && (
                                <Badge size="xs" color="red" variant="light">
                                    条件必填
                                </Badge>
                            )}
                            {field.readOnlyWhen && (
                                <Badge size="xs" color="gray" variant="light">
                                    条件只读
                                </Badge>
                            )}
                            {field.disabledWhen && (
                                <Badge size="xs" color="gray" variant="light">
                                    条件禁用
                                </Badge>
                            )}
                        </Group>
                    </Group>
                </Card.Section>
            </Card>

            {/* 基础设置 */}
            <Card withBorder>
                <Card.Section p="md">
                    <Group gap="xs" mb={2}>
                        <Icon icon="solar:settings-bold" size={20} />
                        <Text fw={600} c={componentStyles.text.caption}>
                            基础设置
                        </Text>
                    </Group>
                    <Stack gap={2}>
                        <Box style={{ display: 'flex', gap: 2 }}>
                            <TextInput
                                label="字段名称"
                                value={field.name || ''}
                                onChange={(e) => handleFieldPropertyChange('name', e.target.value)}
                                size="sm"
                                style={{ flex: 1 }}
                            />
                            <TextInput
                                label="显示标题"
                                value={field.title || ''}
                                onChange={(e) => handleFieldPropertyChange('title', e.target.value)}
                                size="sm"
                                style={{ flex: 1 }}
                            />
                        </Box>

                        <Box>
                            <Select
                                label="Widget组件"
                                value={field.widget || null}
                                onChange={(value) => handleFieldPropertyChange('widget', value)}
                                data={validateSelectOptions(
                                    widgetOptions.map((widget) => ({
                                        value: widget.value,
                                        label: widget.label,
                                    }))
                                )}
                                placeholder={
                                    field.widget
                                        ? undefined // 如果有值就不显示placeholder
                                        : widgetOptions.length > 0
                                          ? '请选择组件类型'
                                          : '暂未配置组件'
                                }
                                description={
                                    field.widget
                                        ? `当前组件: ${selectedWidgetInfo?.label || field.widget} | 可选择 ${widgetOptions.length} 种组件`
                                        : widgetOptions.length > 0
                                          ? `可选择 ${widgetOptions.length} 种组件类型`
                                          : '点击下拉框可选择可用组件'
                                }
                                size="sm"
                                styles={{
                                    dropdown: {
                                        zIndex: 1200,
                                    },
                                }}
                                disabled={widgetOptions.length === 0}
                                clearable
                            />
                        </Box>
                    </Stack>
                </Card.Section>
            </Card>

            {selectedWidgetInfo && viewType && (
                <Card withBorder>
                    <Card.Section p="md">
                        <Text fw={600} style={{ mb: 2 }} c={componentStyles.text.caption}>
                            Widget配置
                        </Text>
                        <WidgetConfigEditor
                            widgetType={selectedWidgetInfo.value}
                            viewType={viewType}
                            config={field.widgetOptions || {}}
                            onChange={handleWidgetConfigChange}
                        />
                    </Card.Section>
                </Card>
            )}

            {/* 布局与显示配置 */}
            <Card withBorder>
                <Card.Section p="md">
                    <Text fw={600} style={{ mb: 2 }} c={componentStyles.text.caption}>
                        布局与显示
                    </Text>
                    <Stack gap={2}>
                        <Box>
                            <Text size="sm" fw={500} mb={2} c={componentStyles.text.caption}>
                                尺寸配置
                            </Text>
                            <Box
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 2,
                                }}
                            >
                                <TextInput
                                    label="列跨度 (spanCols)"
                                    type="number"
                                    size="sm"
                                    value={field.spanCols || ''}
                                    onChange={(e) =>
                                        handleFieldPropertyChange(
                                            'spanCols',
                                            e.target.value
                                                ? parseInt(e.target.value, 10)
                                                : undefined
                                        )
                                    }
                                    min={1}
                                    max={12}
                                    description="1-12列"
                                />
                                <TextInput
                                    label="固定宽度 (width)"
                                    type="number"
                                    size="sm"
                                    value={field.width || ''}
                                    onChange={(e) =>
                                        handleFieldPropertyChange(
                                            'width',
                                            e.target.value
                                                ? parseInt(e.target.value, 10)
                                                : undefined
                                        )
                                    }
                                    min={0}
                                    description="像素值"
                                />
                                <TextInput
                                    label="弹性系数 (flex)"
                                    type="number"
                                    size="sm"
                                    value={field.flex || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '0') {
                                            handleFieldPropertyChange('flex', 0);
                                        } else if (val === '1') {
                                            handleFieldPropertyChange('flex', 1);
                                        } else {
                                            handleFieldPropertyChange('flex', undefined);
                                        }
                                    }}
                                    min={0}
                                    max={1}
                                    description="0或1"
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Text size="sm" fw={500} mb={2} c={componentStyles.text.caption}>
                                图标设置
                            </Text>
                            <TextInput
                                label="图标 (icon)"
                                value={field.icon || ''}
                                onChange={(e) => handleFieldPropertyChange('icon', e.target.value)}
                                size="sm"
                                placeholder="例如: solar:user-bold"
                                description="支持所有Icon图标"
                                leftSection={
                                    field.icon ? (
                                        <Box
                                            style={{ mr: 1, display: 'flex', alignItems: 'center' }}
                                        >
                                            <Icon icon={field.icon as any} size={16} />
                                        </Box>
                                    ) : null
                                }
                            />
                        </Box>
                    </Stack>
                </Card.Section>
            </Card>

            {/* 条件逻辑 */}
            <Card withBorder>
                <Card.Section p="md">
                    <Text fw={600} style={{ mb: 2 }} c={componentStyles.text.caption}>
                        条件逻辑
                    </Text>
                    <Stack gap={3}>
                        <Box>
                            <Text size="sm" fw={500} mb={2} c={componentStyles.text.caption}>
                                显示控制
                            </Text>
                            <Box
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 2,
                                }}
                            >
                                <TextInput
                                    label="条件显示 (showWhen)"
                                    value={field.showWhen || ''}
                                    onChange={(e) =>
                                        handleFieldPropertyChange('showWhen', e.target.value)
                                    }
                                    size="sm"
                                    placeholder="例如: values.type === 'A'"
                                    description="满足条件时显示"
                                />
                                <TextInput
                                    label="条件隐藏 (hiddenWhen)"
                                    value={field.hiddenWhen || ''}
                                    onChange={(e) =>
                                        handleFieldPropertyChange('hiddenWhen', e.target.value)
                                    }
                                    size="sm"
                                    placeholder="例如: values.type === 'B'"
                                    description="满足条件时隐藏"
                                />
                            </Box>
                        </Box>

                        <Box>
                            <Text size="sm" fw={500} mb={2} c={componentStyles.text.caption}>
                                行为控制
                            </Text>
                            <Box
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 2,
                                }}
                            >
                                <TextInput
                                    label="条件必填 (requiredWhen)"
                                    value={field.requiredWhen || ''}
                                    onChange={(e) =>
                                        handleFieldPropertyChange('requiredWhen', e.target.value)
                                    }
                                    size="sm"
                                    placeholder="例如: values.isSpecial === true"
                                    description="满足条件时必填"
                                />
                                <TextInput
                                    label="条件只读 (readOnlyWhen)"
                                    value={field.readOnlyWhen || ''}
                                    onChange={(e) =>
                                        handleFieldPropertyChange('readOnlyWhen', e.target.value)
                                    }
                                    size="sm"
                                    placeholder="例如: values.status > 1"
                                    description="满足条件时只读"
                                />
                                <TextInput
                                    label="条件禁用 (disabledWhen)"
                                    value={field.disabledWhen || ''}
                                    onChange={(e) =>
                                        handleFieldPropertyChange('disabledWhen', e.target.value)
                                    }
                                    size="sm"
                                    placeholder="例如: rowData.approved"
                                    description="满足条件时禁用"
                                />
                            </Box>
                        </Box>
                    </Stack>
                </Card.Section>
            </Card>

            {/* 描述信息 */}
            <Card withBorder>
                <Card.Section p="md">
                    <Text fw={600} style={{ mb: 2 }} c={componentStyles.text.caption}>
                        描述信息
                    </Text>
                    <Textarea
                        label="字段描述 (description)"
                        value={field.description || ''}
                        onChange={(e) => handleFieldPropertyChange('description', e.target.value)}
                        size="sm"
                        rows={2}
                        placeholder="作为字段的帮助或提示信息"
                    />
                </Card.Section>
            </Card>

            {/* 显示嵌套字段数据的详细信息 - 扩展API信息显示 */}
            {field.fields && field.fields.length > 0 && (
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:layers-bold" size={20} />
                            <Text fw={600} c={componentStyles.text.caption}>
                                嵌套字段信息
                            </Text>
                        </Group>
                        <Text size="sm" c={componentStyles.text.caption} mb="sm">
                            该字段包含 {field.fields.length}{' '}
                            个嵌套子字段，点击左侧树状结构中的子节点可编辑具体字段
                        </Text>
                        <Stack gap="xs">
                            {field.fields.map((nestedField, index) => (
                                <Box
                                    key={index}
                                    style={{
                                        padding: 8,
                                        border: '1px solid var(--mantine-color-gray-3)',
                                        borderRadius: 4,
                                        backgroundColor: 'var(--mantine-color-gray-0)',
                                    }}
                                >
                                    <Group justify="space-between">
                                        <Text size="sm" fw={500}>
                                            {nestedField.title || nestedField.name}
                                        </Text>
                                        <Group gap="xs">
                                            {nestedField.widget && (
                                                <Badge size="xs" color="blue">
                                                    {nestedField.widget}
                                                </Badge>
                                            )}
                                            {nestedField.fields &&
                                                nestedField.fields.length > 0 && (
                                                    <Badge size="xs" color="purple">
                                                        {nestedField.fields.length}个子字段
                                                    </Badge>
                                                )}
                                            <Badge size="xs" variant="outline">
                                                L{index + 2}
                                            </Badge>
                                        </Group>
                                    </Group>
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        mt={4}
                                        style={{ fontFamily: 'monospace' }}
                                    >
                                        API数据:{' '}
                                        {JSON.stringify(
                                            {
                                                name: nestedField.name,
                                                widget: nestedField.widget || 'undefined',
                                                hasOptions: !!(
                                                    nestedField.widgetOptions &&
                                                    Object.keys(nestedField.widgetOptions).length >
                                                        0
                                                ),
                                                hasSubFields: !!(
                                                    nestedField.fields &&
                                                    nestedField.fields.length > 0
                                                ),
                                                level: `L${index + 2}`,
                                            },
                                            null,
                                            0
                                        )}
                                    </Text>
                                </Box>
                            ))}
                        </Stack>
                    </Card.Section>
                </Card>
            )}

            {/* 字段信息总结 */}
            {selectedWidgetInfo && (
                <Alert
                    variant="light"
                    style={{
                        mt: 1,
                        color: componentStyles.alert.info.color,
                        backgroundColor: componentStyles.alert.info.backgroundColor,
                        borderColor: componentStyles.alert.info.borderColor,
                    }}
                >
                    <Box>
                        <Text
                            size="sm"
                            fw={500}
                            style={{ color: componentStyles.chip.success.color }}
                        >
                            ✅ 当前配置
                        </Text>
                        <Text size="sm" mt={1} c={componentStyles.text.caption}>
                            <strong>{field.name}</strong> →{' '}
                            <strong>{selectedWidgetInfo.label}</strong> 组件
                            {field.fields && ` (含${field.fields.length}个嵌套字段)`}
                        </Text>
                        <Text size="xs" c={componentStyles.text.caption} mt={2}>
                            💾 配置会自动保存到widgetOptions中
                        </Text>
                    </Box>
                </Alert>
            )}
        </Box>
    );
});

const WidgetConfigEditor = React.memo(function WidgetConfigEditor({
    widgetType,
    viewType,
    config = {},
    onChange,
}: WidgetConfigEditorProps) {
    // 获取StudioEngineService实例
    const engine = useStudioEngineOptional();
    const [studioService, setStudioService] = useState<StudioEngineService | null>(null);

    const [tabValue, setTabValue] = useState(0);
    const [userJsonString, setUserJsonString] = useState('');
    const [userJsonError, setUserJsonError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [configSpec, setConfigSpec] = useState<WidgetConfigSpec | null>(null);
    const [configSpecError, setConfigSpecError] = useState('');

    // 初始化StudioEngineService
    useEffect(() => {
        if (engine) {
            const service = new StudioEngineService(engine);
            setStudioService(service);
        }
    }, [engine]);

    // 动态获取Widget配置规范
    useEffect(() => {
        async function loadConfigSpec() {
            if (!studioService) return;

            setIsLoading(true);
            setConfigSpecError('');

            try {
                const spec = await getWidgetConfigSpecForEditor(
                    widgetType,
                    viewType,
                    studioService
                );
                setConfigSpec(spec);
            } catch {
                setConfigSpecError('获取配置规范失败');
            } finally {
                setIsLoading(false);
            }
        }

        loadConfigSpec();
    }, [widgetType, viewType, studioService]);

    // 同步用户编辑的JSON字符串
    useEffect(() => {
        setUserJsonString(JSON.stringify(config, null, 2));
    }, [config]);

    const handleUserJsonChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = event.target.value;
            setUserJsonString(newValue);

            try {
                const parsed = JSON.parse(newValue);
                setUserJsonError('');
                onChange(parsed);
            } catch {
                setUserJsonError('JSON格式错误');
            }
        },
        [onChange]
    );

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    }, []);

    const handleReset = useCallback(async () => {
        try {
            const defaultConfig = await getWidgetDefaultConfigForEditor(widgetType, viewType);
            onChange(defaultConfig);
        } catch {
            // 重置失败时忽略错误
        }
    }, [widgetType, viewType, onChange]);

    const handleFormatJson = useCallback(() => {
        try {
            const parsed = JSON.parse(userJsonString);
            const formatted = JSON.stringify(parsed, null, 2);
            setUserJsonString(formatted);
            setUserJsonError('');
        } catch {
            setUserJsonError('JSON格式错误，无法格式化');
        }
    }, [userJsonString]);

    const handleCopySpecToConfig = useCallback(() => {
        if (!configSpec) return;

        const defaultConfig: Record<string, any> = {};
        Object.entries(configSpec).forEach(([paramName, paramSpec]) => {
            if (paramSpec.default !== undefined) {
                defaultConfig[paramName] = paramSpec.default;
            }
        });

        const mergedConfig = { ...config, ...defaultConfig };
        onChange(mergedConfig);
    }, [configSpec, config, onChange]);

    const configSpecCount = useMemo(
        () => (configSpec ? Object.keys(configSpec).length : 0),
        [configSpec]
    );

    return (
        <Box style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Text variant="subtitle2">{widgetType} Widget 配置</Text>

                <Box style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {configSpecCount > 0 && (
                        <Chip size="sm" color="blue">
                            {`${configSpecCount} 个参数`}
                        </Chip>
                    )}

                    <Tooltip withinPortal zIndex={4000} label="刷新组件分析">
                        <ActionIcon
                            size="sm"
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    const spec = await getWidgetConfigSpecForEditor(
                                        widgetType,
                                        viewType,
                                        studioService,
                                        true
                                    );
                                    setConfigSpec(spec);
                                    setConfigSpecError('');
                                } catch (error) {
                                    setConfigSpecError(
                                        error instanceof Error ? error.message : '刷新失败'
                                    );
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                            color="primary"
                        >
                            <Icon icon="solar:restart-bold" size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Box>
            </Box>

            <Box
                style={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                }}
            >
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Tabs
                        value={String(tabValue)}
                        onChange={(value) => handleTabChange(null as any, Number(value))}
                    >
                        <Tabs.List style={{ flexWrap: 'nowrap' }}>
                            <Tabs.Tab
                                value="0"
                                leftSection={<Icon icon="solar:pen-bold" size={16} />}
                            >
                                用户配置
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="1"
                                leftSection={<Icon icon="solar:info-circle-bold" size={16} />}
                            >
                                参数规范
                            </Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                </Box>
                <Box style={{ display: 'flex', gap: 1 }}>
                    <Tooltip withinPortal zIndex={4000} label="格式化JSON">
                        <ActionIcon size="sm" onClick={handleFormatJson}>
                            <Icon icon="solar:share-bold" size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip withinPortal zIndex={4000} label="重置为默认配置">
                        <ActionIcon size="sm" onClick={handleReset}>
                            <Icon icon="solar:restart-bold" size={16} />
                        </ActionIcon>
                    </Tooltip>
                    {configSpecCount > 0 && (
                        <Tooltip
                            withinPortal
                            zIndex={4000}
                            label="将参数规范的默认值合并到当前配置"
                        >
                            <ActionIcon size="sm" onClick={handleCopySpecToConfig} color="primary">
                                <Icon icon="solar:copy-bold" size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            <Box style={{ flex: 1, overflow: 'hidden' }}>
                {tabValue === 0 && (
                    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Textarea
                            rows={8}
                            value={userJsonString}
                            onChange={handleUserJsonChange}
                            error={!!userJsonError}
                            styles={{
                                input: {
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                },
                            }}
                            placeholder={`{
  "placeholder": "请输入...",
  "disabled": false
}`}
                        />
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Textarea
                            rows={8}
                            value={JSON.stringify(configSpec, null, 2)}
                            readOnly
                            styles={{
                                input: {
                                    flex: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                },
                            }}
                        />
                    </Box>
                )}
            </Box>

            {isLoading && (
                <Alert
                    mt="sm"
                    style={{
                        color: componentStyles.alert.info.color,
                        backgroundColor: componentStyles.alert.info.backgroundColor,
                        borderColor: componentStyles.alert.info.borderColor,
                    }}
                >
                    正在分析 {widgetType} 组件源码...
                </Alert>
            )}

            {!isLoading && configSpecCount === 0 && !configSpecError && (
                <Alert
                    mt="sm"
                    style={{
                        color: componentStyles.alert.warning.color,
                        backgroundColor: componentStyles.alert.warning.backgroundColor,
                        borderColor: componentStyles.alert.warning.borderColor,
                    }}
                >
                    功能正在实现中
                </Alert>
            )}

            {configSpecError && (
                <Alert
                    mt="sm"
                    style={{
                        color: componentStyles.alert.error.color,
                        backgroundColor: componentStyles.alert.error.backgroundColor,
                        borderColor: componentStyles.alert.error.borderColor,
                    }}
                >
                    {configSpecError}
                </Alert>
            )}
        </Box>
    );
});

const ViewOptionsEditor = React.memo(function ViewOptionsEditor({
    viewType,
    config = {},
    onChange,
}: ViewOptionsEditorProps) {
    // 获取StudioEngineService实例
    const engine = useStudioEngineOptional();
    const [studioService, setStudioService] = useState<StudioEngineService | null>(null);

    const [tabValue, setTabValue] = useState(0);
    const [userJsonString, setUserJsonString] = useState('');
    const [userJsonError, setUserJsonError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [configSpec, setConfigSpec] = useState<ViewConfigSpec | null>(null);
    const [configSpecError, setConfigSpecError] = useState('');

    // 初始化StudioEngineService
    useEffect(() => {
        if (engine) {
            const service = new StudioEngineService(engine);
            setStudioService(service);
        }
    }, [engine]);

    // 动态获取View配置规范
    useEffect(() => {
        async function loadConfigSpec() {
            if (!studioService) return;

            setIsLoading(true);
            setConfigSpecError('');

            try {
                const spec = await getViewConfigSpecForEditor(viewType, studioService);
                setConfigSpec(spec);
            } catch (error) {
                setConfigSpecError(error instanceof Error ? error.message : '获取配置规范失败');
            } finally {
                setIsLoading(false);
            }
        }

        loadConfigSpec();
    }, [viewType, studioService]);

    // 同步用户编辑的JSON字符串
    useEffect(() => {
        setUserJsonString(JSON.stringify(config, null, 2));
    }, [config]);

    const handleUserJsonChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = event.target.value;
            setUserJsonString(newValue);

            try {
                const parsed = JSON.parse(newValue);
                setUserJsonError('');
                onChange(parsed);
            } catch {
                setUserJsonError('JSON格式错误');
            }
        },
        [onChange]
    );

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    }, []);

    const handleCopySpecToConfig = useCallback(() => {
        if (!configSpec) return;

        const defaultConfig: Record<string, any> = {};
        Object.entries(configSpec).forEach(([paramName, paramSpec]) => {
            if (paramSpec.default !== undefined) {
                defaultConfig[paramName] = paramSpec.default;
            }
        });

        const mergedConfig = { ...config, ...defaultConfig };
        onChange(mergedConfig);
    }, [configSpec, config, onChange]);

    const configSpecCount = useMemo(
        () => (configSpec ? Object.keys(configSpec).length : 0),
        [configSpec]
    );

    return (
        <Box style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 2,
                }}
            >
                <Text variant="h6">{viewType} 视图配置</Text>

                <Box style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {configSpecCount > 0 && (
                        <Chip size="sm" color="blue">
                            {`${configSpecCount} 个参数`}
                        </Chip>
                    )}

                    <Tooltip withinPortal zIndex={4000} label="刷新视图分析">
                        <ActionIcon
                            size="sm"
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    const spec = await getViewConfigSpecForEditor(
                                        viewType,
                                        studioService,
                                        true
                                    );
                                    setConfigSpec(spec);
                                    setConfigSpecError('');
                                } catch (error) {
                                    setConfigSpecError(
                                        error instanceof Error ? error.message : '刷新失败'
                                    );
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                            color="primary"
                        >
                            <Icon icon="solar:restart-bold" size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Box>
            </Box>

            <Box style={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                    value={String(tabValue)}
                    onChange={(value) => handleTabChange(null as any, Number(value))}
                >
                    <Tabs.List style={{ flexWrap: 'nowrap' }}>
                        <Tabs.Tab value="0" leftSection={<Icon icon="solar:pen-bold" size={16} />}>
                            用户配置
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="1"
                            leftSection={<Icon icon="solar:info-circle-bold" size={16} />}
                        >
                            参数规范
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>
            </Box>

            <Box style={{ flex: 1, overflow: 'hidden' }}>
                {tabValue === 0 && (
                    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 1,
                            }}
                        >
                            {configSpecCount > 0 && (
                                <Tooltip label="将参数规范的默认值合并到当前配置">
                                    <ActionIcon
                                        size="sm"
                                        onClick={handleCopySpecToConfig}
                                        color="primary"
                                    >
                                        <Icon icon="solar:copy-bold" size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </Box>

                        <Textarea
                            rows={15}
                            value={userJsonString}
                            onChange={handleUserJsonChange}
                            error={!!userJsonError}
                            style={{ flex: 1 }}
                            styles={{
                                input: {
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                },
                            }}
                            placeholder={`{
  "mode": "grid",
  "spacing": 2,
  "padding": 2
}`}
                        />
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Textarea
                            rows={15}
                            value={JSON.stringify(configSpec, null, 2)}
                            readOnly
                            style={{ flex: 1 }}
                            styles={{
                                input: {
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                },
                            }}
                        />
                    </Box>
                )}
            </Box>

            {isLoading && (
                <Alert
                    style={{
                        mt: 2,
                        color: componentStyles.alert.info.color,
                        backgroundColor: componentStyles.alert.info.backgroundColor,
                        borderColor: componentStyles.alert.info.borderColor,
                    }}
                >
                    正在分析 {viewType} 视图组件源码...
                </Alert>
            )}

            {!isLoading && configSpecCount === 0 && !configSpecError && (
                <Alert
                    style={{
                        mt: 2,
                        color: componentStyles.alert.warning.color,
                        backgroundColor: componentStyles.alert.warning.backgroundColor,
                        borderColor: componentStyles.alert.warning.borderColor,
                    }}
                >
                    未找到可配置的参数
                </Alert>
            )}

            {configSpecError && (
                <Alert
                    style={{
                        mt: 2,
                        color: componentStyles.alert.error.color,
                        backgroundColor: componentStyles.alert.error.backgroundColor,
                        borderColor: componentStyles.alert.error.borderColor,
                    }}
                >
                    {configSpecError}
                </Alert>
            )}
        </Box>
    );
});

const UniversalFieldsEditor = React.memo(function UniversalFieldsEditor({
    fields,
    onChange,
    context = {},
    showHeader = true,
    headerTitle,
    showPreview = false,
    compact = false,
    availableWidgets = [], // 新增：接受可用的widgets
}: UniversalFieldsEditorProps) {
    const { parentWidget, viewType, maxDepth = 5, level = 0 } = context;

    const defaultTitle = useMemo(() => {
        if (headerTitle) return headerTitle;

        const levelNames = ['分组', '功能', '动作', '子项', '详细配置'];
        return `${levelNames[Math.min(level, levelNames.length - 1)]}配置`;
    }, [level, headerTitle]);

    const handleFieldChange = useCallback(
        (index: number, updatedField: IEntityViewField) => {
            const newFields = [...fields];
            newFields[index] = updatedField;
            onChange(newFields);
        },
        [fields, onChange]
    );

    const handleFieldDelete = useCallback(
        (index: number) => {
            const newFields = fields.filter((_, i) => i !== index);
            onChange(newFields);
        },
        [fields, onChange]
    );

    const handleAddField = useCallback(() => {
        const newField: IEntityViewField = {
            name: `field_${Date.now()}`,
            title: '新字段',
            spanCols: undefined,
            order: fields.length,
            widget: undefined,
            icon: undefined,
            description: undefined,
            showWhen: undefined,
            hiddenWhen: undefined,
            requiredWhen: undefined,
            readOnlyWhen: undefined,
            disabledWhen: undefined,
            width: undefined,
            flex: undefined,
        };

        onChange([...fields, newField]);
    }, [fields, onChange]);

    return (
        <Box style={{ width: '100%' }}>
            {showHeader && (
                <Box
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        p: compact ? 1 : 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon icon="solar:list-bold" size={20} />
                        <Text variant={compact ? 'subtitle2' : 'h6'}>{defaultTitle}</Text>
                        {level > 0 && (
                            <Chip size="sm" color="blue" variant="outline">
                                {`L${level + 1}`}
                            </Chip>
                        )}
                    </Box>

                    <Button
                        variant="outlined"
                        size="sm"
                        leftSection={<Icon icon="solar:add-circle-bold" />}
                        onClick={handleAddField}
                    >
                        添加字段
                    </Button>
                </Box>
            )}

            <Stack gap={compact ? 1 : 2}>
                {fields.map((field, index) =>
                    viewType ? (
                        <UniversalFieldItem
                            key={`${field.name || 'unnamed'}-${index}-${field.widget || 'default'}`}
                            field={field}
                            index={index}
                            level={level || 0}
                            maxDepth={maxDepth}
                            viewType={viewType}
                            parentWidget={parentWidget || undefined}
                            compact={compact}
                            onChange={(updatedField) => handleFieldChange(index, updatedField)}
                            onDelete={() => handleFieldDelete(index)}
                            availableWidgets={availableWidgets}
                        />
                    ) : null
                )}

                {fields.length === 0 && (
                    <Alert color="blue" style={{ textAlign: 'center' }}>
                        <Text variant="body2">
                            暂无字段配置，点击上方&ldquo;添加字段&rdquo;按钮开始配置
                        </Text>
                    </Alert>
                )}
            </Stack>
        </Box>
    );
});

interface UniversalFieldItemProps {
    field: IEntityViewField;
    index: number;
    level: number;
    maxDepth: number;
    viewType: string;
    parentWidget?: string;
    compact: boolean;
    onChange: (field: IEntityViewField) => void;
    onDelete: () => void;
    availableWidgets?: WidgetTypeInfo[]; // 传入可用的widgets
}

const UniversalFieldItem = React.memo(function UniversalFieldItem({
    field,
    index,
    level,
    maxDepth,
    viewType,
    parentWidget,
    compact,
    onChange,
    onDelete,
    availableWidgets = [], // 新增：接受可用的widgets
}: UniversalFieldItemProps) {
    // 固定展开，不需要状态管理

    // 获取当前字段的Widget显示名称
    const getWidgetDisplayName = (widgetValue: string) => {
        const widgetInfo = availableWidgets.find((w) => w.value === widgetValue);
        return widgetInfo ? widgetInfo.label : widgetValue;
    };

    return (
        <Card
            variant="outlined"
            style={{
                ml: level * 2,
                borderLeft: level > 0 ? 3 : 1,
                borderLeftColor: level > 0 ? 'primary.main' : 'divider',
            }}
        >
            <Card.Section style={{ pb: 1 }}>
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <Chip
                            size="sm"
                            style={{
                                minWidth: 32,
                                color:
                                    level === 0
                                        ? componentStyles.chip.primary.color
                                        : componentStyles.chip.info.color,
                                backgroundColor:
                                    level === 0
                                        ? componentStyles.chip.primary.backgroundColor
                                        : componentStyles.chip.info.backgroundColor,
                                borderColor:
                                    level === 0
                                        ? componentStyles.chip.primary.borderColor
                                        : componentStyles.chip.info.borderColor,
                            }}
                        >
                            {`${index + 1}`}
                        </Chip>
                        <Box style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Text variant="subtitle2" style={{ fontWeight: 600 }}>
                                {field.title || field.name}
                            </Text>

                            {field.widget && (
                                <Chip
                                    size="sm"
                                    variant="outline"
                                    style={{
                                        color: componentStyles.chip.info.color,
                                        borderColor: componentStyles.chip.info.borderColor,
                                    }}
                                >
                                    {getWidgetDisplayName(field.widget)}
                                </Chip>
                            )}

                            {field.icon && <Icon icon={field.icon as any} size={16} />}
                        </Box>
                    </Group>
                    <Group gap="xs">
                        <Tooltip withinPortal zIndex={4000} label="删除字段">
                            <ActionIcon
                                size="sm"
                                onClick={onDelete}
                                style={{
                                    color: componentStyles.actionIcon.danger.color,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        componentStyles.actionIcon.danger.hoverBackground;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <Icon icon="solar:trash-bin-trash-bold" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Card.Section>

            {/* 固定展开的内容区域 */}
            <Card.Section style={{ pt: 0 }}>
                <EnhancedFieldEditor
                    field={field}
                    viewType={viewType}
                    onFieldChange={onChange}
                    availableWidgets={availableWidgets} // 传入真实API数据
                />
            </Card.Section>
        </Card>
    );
});

// SECTION 4: 主编辑器组件

// 4.1 配置节点类型和数据结构
// 配置节点类型
type ConfigNodeType =
    | 'root'
    | 'basic-info' // 基础信息
    | 'view-config' // 视图配置
    | 'items-config' // 数据项配置
    | 'field-item' // 顶级字段项 (items中的字段)
    | 'nested-field' // 嵌套字段 (fields中的字段)
    | 'deep-nested-field'; // 深层嵌套字段 (多层嵌套)

// 增强的配置树节点 - 支持完整的嵌套字段管理
interface ConfigTreeNode {
    id: string;
    type: ConfigNodeType;
    label: string;
    path: string;
    level: number; // 嵌套层级: -1=容器, 0=顶级字段, 1+=嵌套字段
    fieldPath: string[]; // 字段路径数组: ['items', '0', 'fields', '1']
    parentId?: string; // 父节点ID
    children?: ConfigTreeNode[];
    // 操作权限控制
    canAddChildren?: boolean; // 是否可以添加子字段
    canDelete?: boolean; // 是否可以删除
    canMoveUp?: boolean; // 是否可以上移
    canMoveDown?: boolean; // 是否可以下移
}

// 4.2 主编辑器实现
/**
 * 层级树状视图配置编辑器
 */
export function HierarchicalViewEditor({
    config,
    modelConfig,
    onChange,
    onModeChange,
    editMode = 'visual',
}: HierarchicalViewEditorProps) {
    const { availableWidgets, availableViewTypes, availableDensityOptions } =
        useStudioComponentData();

    // 优化：组合相关状态，减少重渲染
    const [editorState, setEditorState] = useState({
        selectedNodeId: 'basic-info',
        showFieldSelector: false,
    });

    // 树操作功能
    const treeOperations = useTreeOperations(config, onChange);

    // DND-Kit 传感器配置
    const sensors = useSensors(
        // 增加激活阈值，避免轻微点击触发拖拽
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // DND-Kit 拖拽结束处理 - 更新为支持新的字段ID格式
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || active.id === over.id) return;

            const parseFieldIndex = (id: string | number): number => {
                const idStr = String(id);
                if (idStr.startsWith('field-items-')) {
                    const index = parseInt(idStr.replace('field-items-', ''), 10);
                    return isNaN(index) ? -1 : index;
                }
                return -1;
            };

            const activeIndex = parseFieldIndex(active.id);
            const overIndex = parseFieldIndex(over.id);

            if (
                activeIndex === -1 ||
                overIndex === -1 ||
                !config.items ||
                activeIndex === overIndex
            )
                return;

            if (
                activeIndex >= 0 &&
                activeIndex < config.items.length &&
                overIndex >= 0 &&
                overIndex < config.items.length
            ) {
                const reorderedItems = arrayMove(config.items, activeIndex, overIndex);

                // 重新分配order属性，确保预览中的排序正确
                const newItems = reorderedItems.map((item: IEntityViewField, index: number) => ({
                    ...item,
                    order: index,
                }));

                onChange({ ...config, items: newItems });

                // 保持选中状态，更新为新的ID
                const newSelectedId = `field-items-${overIndex}`;
                setEditorState((prev) => ({
                    ...prev,
                    selectedNodeId: newSelectedId,
                }));
            }
        },
        [config, onChange]
    );

    // 动态获取可用视图类型 - 直接使用API数据
    const validatedViewTypes = useMemo(
        () =>
            validateSelectOptions(
                availableViewTypes.map((type) => ({
                    value: type.value,
                    label: type.label,
                }))
            ),
        [availableViewTypes]
    );

    // 动态获取当前视图类型下的可用Widget - 直接使用API数据
    const availableWidgetsForView = useMemo(
        () =>
            // 直接使用availableWidgets，过滤适合当前视图类型的widgets
            availableWidgets.filter(
                (widget) =>
                    !config.viewType ||
                    widget.viewType === config.viewType ||
                    widget.viewType === 'all' ||
                    widget.viewType === 'form' // 默认兼容form类型
            ),
        [config.viewType, availableWidgets]
    );

    // 获取已使用的字段名称列表
    const usedFieldNames = useMemo(
        () => config.items?.map((item: any) => item.name).filter(Boolean) || [],
        [config.items]
    );

    // 缓存字段选择处理逻辑 - 保持与API数据一致性
    const handleFieldSelect = useCallback(
        (field: IEntityField) => {
            const newField = {
                name: field.name,
                title: field.title,
                spanCols: undefined,
                widget: undefined,
                order: config.items?.length || 0,
                icon: '',
                description: '',
                showWhen: '',
                hiddenWhen: '',
                requiredWhen: '',
                readOnlyWhen: '',
                disabledWhen: '',
                width: undefined,
                flex: undefined,
                // 添加数据来源标记
                _dataSource: 'model-field-selection',
                _addedAt: Date.now(),
            };

            onChange({
                ...config,
                items: [...(config.items || []), newField],
            });
        },
        [config, onChange]
    );

    // 动态获取密度选项 - 直接使用API数据
    const validatedDensityOptions = useMemo(
        () =>
            validateSelectOptions(
                availableDensityOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                }))
            ),
        [availableDensityOptions]
    );

    // 递归生成嵌套字段节点的辅助函数 - 增强调试
    const generateNestedFieldNodes = useCallback(
        (
            fields: IEntityViewField[],
            parentPath: string[],
            parentId: string,
            level: number
        ): ConfigTreeNode[] => {
            console.log(
                `[GenerateNestedNodes] Level ${level} - 处理 ${fields.length} 个字段，父路径:`,
                parentPath,
                '父ID:',
                parentId
            );

            return fields.map((field, index) => {
                const fieldPath = [...parentPath, 'fields', index.toString()];
                const nodeId = `field-${fieldPath.join('-')}`;
                const nodeType: ConfigNodeType =
                    level === 0 ? 'field-item' : level === 1 ? 'nested-field' : 'deep-nested-field';

                console.log(`[GenerateNestedNodes] Level ${level} - 创建节点:`, {
                    fieldName: field.name,
                    nodeId,
                    nodeType,
                    fieldPath,
                    hasSubFields: !!(field.fields && field.fields.length > 0),
                    subFieldsCount: field.fields?.length || 0,
                });

                const node: ConfigTreeNode = {
                    id: nodeId,
                    type: nodeType,
                    label: field.title || field.name,
                    path: `${parentId}.${nodeId}`,
                    level,
                    fieldPath,
                    parentId,
                    canAddChildren: true, // 所有字段都可以添加子字段
                    canDelete: true,
                    canMoveUp: index > 0,
                    canMoveDown: index < fields.length - 1,
                    children: field.fields
                        ? (() => {
                              console.log(
                                  `[GenerateNestedNodes] Level ${level} - 字段 "${field.name}" 有 ${field.fields.length} 个子字段，递归处理...`
                              );
                              const nestedNodes = generateNestedFieldNodes(
                                  field.fields,
                                  fieldPath,
                                  nodeId,
                                  level + 1
                              );
                              console.log(
                                  `[GenerateNestedNodes] Level ${level} - 字段 "${field.name}" 递归完成，生成 ${nestedNodes.length} 个子节点`
                              );
                              return nestedNodes;
                          })()
                        : undefined,
                };

                return node;
            });
        },
        []
    );

    // 预定义配置树结构 - 支持完整的嵌套结构
    const configTree: ConfigTreeNode[] = useMemo(() => {
        console.log('[ConfigTree] 开始生成配置树，items数量:', config.items?.length || 0);

        const baseNodes: ConfigTreeNode[] = [
            {
                id: 'basic-info',
                type: 'basic-info',
                label: '基础信息',
                path: 'basic-info',
                level: -1,
                fieldPath: ['basic-info'],
            },
            {
                id: 'view-config',
                type: 'view-config',
                label: '视图配置',
                path: 'view-config',
                level: -1,
                fieldPath: ['view-config'],
            },
            {
                id: 'items-config',
                type: 'items-config',
                label: '字段配置',
                path: 'items-config',
                level: -1,
                fieldPath: ['items'],
                canAddChildren: true,
                children:
                    config.items?.map((item: any, index: number) => {
                        const fieldPath = ['items', index.toString()];
                        const uniqueId = `field-${fieldPath.join('-')}`;

                        const node: ConfigTreeNode = {
                            id: uniqueId,
                            type: 'field-item',
                            label: item.title || item.name,
                            path: `items-config.${uniqueId}`,
                            level: 0,
                            fieldPath,
                            parentId: 'items-config',
                            canAddChildren: true,
                            canDelete: true,
                            canMoveUp: index > 0,
                            canMoveDown: index < (config.items?.length || 0) - 1,
                            // 递归生成嵌套字段节点
                            children: item.fields
                                ? (() => {
                                      console.log(
                                          `[ConfigTree] 字段 "${item.name}" 包含 ${item.fields.length} 个子字段`
                                      );
                                      const nestedNodes = generateNestedFieldNodes(
                                          item.fields,
                                          fieldPath,
                                          uniqueId,
                                          1
                                      );
                                      console.log(
                                          `[ConfigTree] 字段 "${item.name}" 生成 ${nestedNodes.length} 个嵌套节点`
                                      );
                                      return nestedNodes;
                                  })()
                                : undefined,
                        };

                        return node;
                    }) || [],
            },
        ];

        console.log('[ConfigTree] 配置树生成完成');
        return baseNodes;
    }, [config.items, generateNestedFieldNodes]);

    // 获取当前选中的节点
    const selectedNode = useMemo(() => {
        const findNode = (nodes: ConfigTreeNode[]): ConfigTreeNode | null => {
            for (const node of nodes) {
                if (node.id === editorState.selectedNodeId) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findNode(configTree);
    }, [configTree, editorState.selectedNodeId]);

    // 选择节点 - 增强调试
    const selectNode = useCallback((nodeId: string) => {
        console.log('[SelectNode] 选择节点:', nodeId);
        setEditorState((prev) => ({
            ...prev,
            selectedNodeId: nodeId,
        }));
    }, []);

    // 增强的树节点渲染 - 支持嵌套字段操作和拖拽排序，统一递归逻辑
    const renderTreeNode = useCallback(
        (node: ConfigTreeNode, level = 0) => {
            const isSelected = editorState.selectedNodeId === node.id;
            const actualLevel = node.level >= 0 ? node.level : level;

            console.log(
                `[RenderTreeNode] 渲染节点: ${node.id}, type: ${node.type}, level: ${actualLevel}, hasChildren: ${!!node.children}, childrenCount: ${node.children?.length || 0}`
            );

            // 对于顶级字段项，启用拖拽功能
            if (node.type === 'field-item' && node.level === 0) {
                return (
                    <Box key={node.id}>
                        <SortableFieldItem
                            node={node}
                            level={actualLevel}
                            isSelected={isSelected}
                            onSelectNode={selectNode}
                            onAddChild={treeOperations.addChildField}
                            onDeleteNode={treeOperations.deleteField}
                            onMoveUp={(nodeId) => treeOperations.moveField(nodeId, 'up')}
                            onMoveDown={(nodeId) => treeOperations.moveField(nodeId, 'down')}
                        />

                        {/* 递归渲染子节点（嵌套字段不支持拖拽，但支持操作按钮） */}
                        {node.children && node.children.length > 0 && (
                            <Box style={{ marginLeft: 16 }}>
                                {node.children.map((child) => renderTreeNode(child, level + 1))}
                            </Box>
                        )}
                    </Box>
                );
            }

            // 对于所有其他类型的节点（包括嵌套字段），使用增强的树节点组件
            return (
                <Box key={node.id}>
                    <EnhancedTreeNode
                        node={node}
                        level={actualLevel}
                        isSelected={isSelected}
                        onSelectNode={selectNode}
                        onAddChild={node.canAddChildren ? treeOperations.addChildField : undefined}
                        onDeleteNode={node.canDelete ? treeOperations.deleteField : undefined}
                        onMoveUp={
                            node.canMoveUp
                                ? (nodeId) => treeOperations.moveField(nodeId, 'up')
                                : undefined
                        }
                        onMoveDown={
                            node.canMoveDown
                                ? (nodeId) => treeOperations.moveField(nodeId, 'down')
                                : undefined
                        }
                    />

                    {/* 递归渲染子节点 */}
                    {node.children && node.children.length > 0 && (
                        <Box style={{ marginLeft: 16 }}>
                            {node.children.map((child) => {
                                console.log(
                                    `[RenderTreeNode] 递归渲染子节点: ${child.id}, parentType: ${node.type}, childType: ${child.type}`
                                );
                                return renderTreeNode(child, level + 1);
                            })}
                        </Box>
                    )}
                </Box>
            );
        },
        [editorState.selectedNodeId, selectNode, treeOperations]
    );

    // 基础信息编辑器
    const renderBasicInfoEditor = useCallback(
        () => (
            <Stack gap="md" p="lg">
                {/* 页面标题区域 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:widget-bold" size={24} />
                            <Box>
                                <Text size="lg" fw={600}>
                                    视图基础信息
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    配置视图的基本属性和关联模型
                                </Text>
                            </Box>
                        </Group>

                        {/* 状态信息 */}
                        <Group gap="xs">
                            <Badge
                                variant="light"
                                color={config.name ? 'green' : 'gray'}
                                leftSection={
                                    <Icon
                                        icon={
                                            config.name
                                                ? 'solar:check-circle-bold'
                                                : 'solar:clock-circle-bold'
                                        }
                                        size={12}
                                    />
                                }
                            >
                                {config.name ? '已配置' : '待配置'}
                            </Badge>
                            {config.modelName && (
                                <Badge variant="light" color="blue">
                                    关联: {config.modelName}
                                </Badge>
                            )}
                            {config.viewType ? (
                                <Badge variant="light" color="purple">
                                    类型: {config.viewType}
                                </Badge>
                            ) : (
                                <Badge variant="light" color="gray">
                                    未配置类型
                                </Badge>
                            )}
                        </Group>
                    </Card.Section>
                </Card>

                {/* 基础配置 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:settings-bold" size={20} />
                            <Text fw={600} c={componentStyles.text.caption}>
                                基础配置
                            </Text>
                        </Group>

                        <Stack gap="md">
                            <Box
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 'var(--mantine-spacing-md)',
                                }}
                            >
                                <TextInput
                                    label="视图名称"
                                    value={config.name || ''}
                                    onChange={(e) => {
                                        const updatedConfig = { ...config, name: e.target.value };
                                        onChange(updatedConfig);
                                    }}
                                    placeholder="例如：UserProfileForm"
                                    required
                                    description="视图的唯一标识符"
                                    leftSection={<Icon icon="solar:tag-bold" size={16} />}
                                />

                                <TextInput
                                    label="显示标题"
                                    value={config.title || ''}
                                    onChange={(e) => {
                                        const updatedConfig = { ...config, title: e.target.value };
                                        onChange(updatedConfig);
                                    }}
                                    placeholder="例如：用户档案表单"
                                    required
                                    description="在界面上显示的标题"
                                    leftSection={<Icon icon="solar:text-bold" size={16} />}
                                />
                            </Box>

                            <Select
                                label="关联数据模型"
                                value={config.modelName || ''}
                                onChange={(value) =>
                                    onChange({ ...config, modelName: value || '' })
                                }
                                data={
                                    modelConfig
                                        ? [
                                              {
                                                  value: modelConfig.name,
                                                  label: `${modelConfig.title} (${modelConfig.name})`,
                                              },
                                          ]
                                        : []
                                }
                                placeholder="选择要关联的数据模型"
                                description="视图将基于此数据模型渲染"
                                leftSection={<Icon icon="solar:database-bold" size={16} />}
                                styles={{
                                    dropdown: {
                                        zIndex: 1200,
                                    },
                                }}
                            />

                            <Textarea
                                label="视图描述"
                                value={config.description || ''}
                                onChange={(e) =>
                                    onChange({ ...config, description: e.target.value })
                                }
                                placeholder="描述此视图的用途和展示内容..."
                                rows={3}
                                description="视图的详细说明（可选）"
                            />
                        </Stack>
                    </Card.Section>
                </Card>

                {/* 配置指引 */}
                <Card withBorder variant="light">
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:info-circle-bold" size={20} />
                            <Text fw={600} c={componentStyles.text.caption}>
                                配置指引
                            </Text>
                        </Group>

                        <Stack gap="sm">
                            <Group gap="xs">
                                <Icon icon="solar:check-circle-bold" size={16} color="green" />
                                <Text size="sm">
                                    视图名称应使用 camelCase 格式，如 userForm、productList
                                </Text>
                            </Group>
                            <Group gap="xs">
                                <Icon icon="solar:check-circle-bold" size={16} color="green" />
                                <Text size="sm">必须关联一个数据模型才能正常工作</Text>
                            </Group>
                            <Group gap="xs">
                                <Icon icon="solar:check-circle-bold" size={16} color="green" />
                                <Text size="sm">
                                    完成基础信息后，在左侧&ldquo;视图配置&rdquo;中设置视图类型和属性
                                </Text>
                            </Group>
                        </Stack>
                    </Card.Section>
                </Card>
            </Stack>
        ),
        [config, modelConfig, onChange]
    );

    // 视图配置编辑器 - 使用动态视图类型，集成ViewOptions配置
    const renderViewConfigEditor = useCallback(
        () => (
            <Stack gap="md" p="lg">
                {/* 页面标题区域 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:settings-bold" size={24} />
                            <Box>
                                <Text size="lg" fw={600}>
                                    视图配置
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    配置视图的类型、行为和显示选项
                                </Text>
                            </Box>
                        </Group>

                        {/* 状态信息 */}
                        <Group gap="xs">
                            <Badge
                                variant="light"
                                color={config.viewType ? 'green' : 'gray'}
                                leftSection={
                                    <Icon
                                        icon={
                                            config.viewType
                                                ? 'solar:check-circle-bold'
                                                : 'solar:clock-circle-bold'
                                        }
                                        size={12}
                                    />
                                }
                            >
                                {config.viewType ? `类型: ${config.viewType}` : '未选择类型'}
                            </Badge>
                            <Badge variant="light" color="blue">
                                {validatedViewTypes.length} 种类型可用
                            </Badge>
                        </Group>
                    </Card.Section>
                </Card>

                {/* 视图类型配置 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:widget-2-bold" size={20} />
                            <Text fw={600} c={componentStyles.text.caption}>
                                视图类型设置
                            </Text>
                        </Group>

                        <Stack gap="md">
                            <Select
                                label="视图类型"
                                value={config.viewType || null}
                                onChange={(value) => {
                                    const updatedConfig = { ...config, viewType: value as any };
                                    onChange(updatedConfig);
                                }}
                                data={validatedViewTypes}
                                placeholder={
                                    config.viewType
                                        ? undefined // 如果有值就不显示placeholder
                                        : validatedViewTypes.length > 0
                                          ? '请选择视图类型'
                                          : '暂无可用视图类型'
                                }
                                description={
                                    config.viewType
                                        ? `当前视图类型: ${config.viewType} | 支持 ${validatedViewTypes.length} 种类型`
                                        : validatedViewTypes.length > 0
                                          ? `支持 ${validatedViewTypes.length} 种视图类型`
                                          : '暂无可用视图类型'
                                }
                                leftSection={<Icon icon="solar:monitor-bold" size={16} />}
                                clearable
                                styles={{
                                    dropdown: {
                                        zIndex: 1200, // 确保在模态框内的 Select 下拉菜单可见
                                    },
                                }}
                            />

                            <Select
                                label="界面密度"
                                value={config.density || null}
                                onChange={(value) => onChange({ ...config, density: value as any })}
                                data={validatedDensityOptions}
                                placeholder="选择界面元素密度"
                                description="控制界面元素的紧凑程度"
                                leftSection={<Icon icon="solar:layers-bold" size={16} />}
                                clearable
                                styles={{
                                    dropdown: {
                                        zIndex: 1200, // 确保在模态框内的 Select 下拉菜单可见
                                    },
                                }}
                            />
                        </Stack>
                    </Card.Section>
                </Card>

                {/* 操作权限配置 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:shield-user-bold" size={20} />
                            <Text fw={600} c={componentStyles.text.caption}>
                                操作权限
                            </Text>
                        </Group>

                        <Text size="sm" c={componentStyles.text.caption} mb="md">
                            控制用户在此视图中可以执行的操作
                        </Text>

                        <Group gap="xl">
                            <Switch
                                label="允许编辑"
                                checked={config.canEdit !== false}
                                onChange={(e) =>
                                    onChange({ ...config, canEdit: e.currentTarget.checked })
                                }
                            />
                            <Switch
                                label="允许新建"
                                checked={config.canNew !== false}
                                onChange={(e) =>
                                    onChange({ ...config, canNew: e.currentTarget.checked })
                                }
                            />
                            <Switch
                                label="允许删除"
                                checked={config.canDelete !== false}
                                onChange={(e) =>
                                    onChange({ ...config, canDelete: e.currentTarget.checked })
                                }
                            />
                        </Group>
                    </Card.Section>
                </Card>

                {/* 高级选项配置 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:tuning-2-bold" size={20} />
                            <Text fw={600} c={componentStyles.text.caption}>
                                高级选项
                            </Text>
                        </Group>

                        {config.viewType ? (
                            <ViewOptionsEditor
                                viewType={config.viewType}
                                config={config.viewOptions || {}}
                                onChange={(viewOptions) => onChange({ ...config, viewOptions })}
                            />
                        ) : (
                            <Alert
                                variant="light"
                                style={{
                                    color: componentStyles.alert.warning.color,
                                    backgroundColor: componentStyles.alert.warning.backgroundColor,
                                    borderColor: componentStyles.alert.warning.borderColor,
                                }}
                            >
                                <Group gap="xs">
                                    <Icon icon="solar:info-circle-bold" size={16} />
                                    <Text size="sm">请先选择视图类型，然后配置视图选项</Text>
                                </Group>
                            </Alert>
                        )}
                    </Card.Section>
                </Card>

                {/* 配置提示 */}
                <Card withBorder variant="light">
                    <Card.Section p="md">
                        <Group gap="xs" mb="sm">
                            <Icon icon="solar:lightbulb-bold" size={20} />
                            <Text fw={600} c={componentStyles.text.caption}>
                                配置提示
                            </Text>
                        </Group>
                        <Stack gap="xs">
                            <Text size="sm" c={componentStyles.text.caption}>
                                • 不同的视图类型适用于不同的数据展示场景
                            </Text>
                            <Text size="sm" c={componentStyles.text.caption}>
                                • 合理设置操作权限可以提升用户体验和数据安全
                            </Text>
                            <Text size="sm" c={componentStyles.text.caption}>
                                • 高级选项可以进一步定制视图的行为和外观
                            </Text>
                        </Stack>
                    </Card.Section>
                </Card>
            </Stack>
        ),
        [config, onChange, validatedDensityOptions, validatedViewTypes]
    );

    // 数据项配置编辑器
    const renderItemsConfigEditor = useCallback(
        () => (
            <Stack gap="md" p="lg">
                {/* 页面标题区域 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:list-check-bold" size={24} />
                            <Box>
                                <Text size="lg" fw={600}>
                                    数据项配置
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    管理视图中显示的字段和面板布局
                                </Text>
                            </Box>
                        </Group>

                        {/* 状态信息 */}
                        <Group gap="xs">
                            <Badge
                                variant="light"
                                color={config.items && config.items.length > 0 ? 'green' : 'gray'}
                                leftSection={<Icon icon="solar:layers-bold" size={12} />}
                            >
                                {config.items?.length || 0} 个数据项
                            </Badge>
                            {config.items && config.items.some((item: any) => item.fields) && (
                                <Badge variant="light" color="blue">
                                    {config.items.filter((item: any) => item.fields).length} 个面板
                                </Badge>
                            )}
                        </Group>
                    </Card.Section>
                </Card>

                {/* 操作指引 */}
                <Alert color="blue" variant="light">
                    <Group gap="xs">
                        <Icon icon="solar:info-circle-bold" size={16} />
                        <Text size="sm">
                            点击下方数据项卡片可进入详细编辑，或选择左侧具体的字段项来编辑配置
                        </Text>
                    </Group>
                </Alert>

                {/* 操作区域 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group justify="space-between" align="center">
                            <Group gap="xs">
                                <Icon icon="solar:settings-bold" size={20} />
                                <Text fw={600} c={componentStyles.text.caption}>
                                    数据项列表
                                </Text>
                            </Group>

                            <Group gap="xs">
                                <Button
                                    variant="light"
                                    leftSection={<Icon icon="solar:import-bold" size={16} />}
                                    onClick={() =>
                                        setEditorState((prev) => ({
                                            ...prev,
                                            showFieldSelector: true,
                                        }))
                                    }
                                    disabled={
                                        !modelConfig ||
                                        !modelConfig.fields ||
                                        modelConfig.fields.length === 0
                                    }
                                    size="sm"
                                    title={
                                        !modelConfig
                                            ? '等待模型配置加载...'
                                            : !modelConfig.fields
                                              ? '模型没有字段定义'
                                              : modelConfig.fields.length === 0
                                                ? '模型字段列表为空'
                                                : ''
                                    }
                                    loading={!modelConfig}
                                >
                                    从模型选择
                                </Button>
                                <Button
                                    leftSection={<Icon icon="solar:add-circle-bold" size={16} />}
                                    onClick={() => {
                                        const newField = {
                                            name: `field_${Date.now()}`,
                                            title: '新字段',
                                            spanCols: undefined,
                                            order: config.items?.length || 0,
                                            widget: undefined,
                                            icon: undefined,
                                            description: undefined,
                                            showWhen: undefined,
                                            hiddenWhen: undefined,
                                            requiredWhen: undefined,
                                            readOnlyWhen: undefined,
                                            disabledWhen: undefined,
                                            width: undefined,
                                            flex: undefined,
                                        };
                                        onChange({
                                            ...config,
                                            items: [...(config.items || []), newField],
                                        });
                                    }}
                                    size="sm"
                                >
                                    手动添加
                                </Button>
                            </Group>
                        </Group>
                    </Card.Section>
                </Card>

                {/* 数据项列表区域 */}
                {!config.items || config.items.length === 0 ? (
                    <Card withBorder variant="light">
                        <Card.Section p="xl" style={{ textAlign: 'center' }}>
                            <Icon
                                icon="solar:layers-bold"
                                size={48}
                                style={{
                                    color: componentStyles.text.muted,
                                    opacity: 0.5,
                                    marginBottom: 16,
                                }}
                            />
                            <Text size="lg" fw={500} mb="xs">
                                暂无数据项配置
                            </Text>
                            <Text size="sm" c={componentStyles.text.caption} mb="lg">
                                开始为您的视图添加要显示的字段和面板
                            </Text>
                            <Group justify="center" gap="xs">
                                <Button
                                    variant="light"
                                    leftSection={<Icon icon="solar:import-bold" size={16} />}
                                    onClick={() =>
                                        setEditorState((prev) => ({
                                            ...prev,
                                            showFieldSelector: true,
                                        }))
                                    }
                                    disabled={
                                        !modelConfig ||
                                        !modelConfig.fields ||
                                        modelConfig.fields.length === 0
                                    }
                                    title={
                                        !modelConfig
                                            ? '等待模型配置加载...'
                                            : !modelConfig.fields
                                              ? '模型没有字段定义'
                                              : modelConfig.fields.length === 0
                                                ? '模型字段列表为空'
                                                : ''
                                    }
                                    loading={!modelConfig}
                                >
                                    从数据模型选择字段
                                </Button>
                                <Button
                                    variant="outline"
                                    leftSection={<Icon icon="solar:add-circle-bold" size={16} />}
                                    onClick={() => {
                                        const newField = {
                                            name: `field_${Date.now()}`,
                                            title: '新字段',
                                            spanCols: undefined,
                                            order: 0,
                                            widget: undefined,
                                            icon: undefined,
                                            description: undefined,
                                            showWhen: undefined,
                                            hiddenWhen: undefined,
                                            requiredWhen: undefined,
                                            readOnlyWhen: undefined,
                                            disabledWhen: undefined,
                                            width: undefined,
                                            flex: undefined,
                                        };
                                        onChange({
                                            ...config,
                                            items: [newField],
                                        });
                                    }}
                                >
                                    手动添加字段
                                </Button>
                            </Group>
                        </Card.Section>
                    </Card>
                ) : (
                    <Stack gap="sm">
                        {config.items.map((item: any, index: number) => (
                            <Card
                                key={index}
                                withBorder
                                style={{ cursor: 'pointer' }}
                                onClick={() => selectNode(`field-items-${index}`)}
                            >
                                <Card.Section p="md">
                                    <Group justify="space-between" align="center">
                                        <Group gap="md" align="center">
                                            <Icon
                                                icon={
                                                    item.fields
                                                        ? 'solar:widget-4-bold'
                                                        : 'solar:document-bold'
                                                }
                                                size={20}
                                                color={item.fields ? 'blue' : 'gray'}
                                            />
                                            <Box>
                                                <Group gap="xs" align="center">
                                                    <Text
                                                        fw={600}
                                                        size="sm"
                                                        c={componentStyles.text.caption}
                                                    >
                                                        {item.title || item.name}
                                                    </Text>
                                                    <Badge
                                                        size="xs"
                                                        variant="light"
                                                        color={item.fields ? 'blue' : 'gray'}
                                                    >
                                                        {item.fields
                                                            ? `面板 (${item.fields.length} 子字段)`
                                                            : '字段'}
                                                    </Badge>
                                                    {item.spanCols && (
                                                        <Badge size="xs" variant="outline">
                                                            {item.spanCols}/12 列宽
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Text size="xs" c={componentStyles.text.caption}>
                                                    {item.name}
                                                </Text>
                                            </Box>
                                        </Group>

                                        <Group gap="xs">
                                            <Tooltip withinPortal zIndex={4000} label="编辑数据项">
                                                <ActionIcon
                                                    size="sm"
                                                    variant="light"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selectNode(`field-items-${index}`);
                                                    }}
                                                >
                                                    <Icon icon="solar:pen-bold" size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip withinPortal zIndex={4000} label="删除数据项">
                                                <ActionIcon
                                                    size="sm"
                                                    variant="light"
                                                    color="red"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newItems = [...(config.items || [])];
                                                        newItems.splice(index, 1);
                                                        onChange({ ...config, items: newItems });
                                                    }}
                                                >
                                                    <Icon
                                                        icon="solar:trash-bin-trash-bold"
                                                        size={16}
                                                    />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Group>
                                </Card.Section>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* 配置提示 */}
                {config.items && config.items.length > 0 && (
                    <Card withBorder variant="light">
                        <Card.Section p="md">
                            <Group gap="xs" mb="sm">
                                <Icon icon="solar:lightbulb-bold" size={20} />
                                <Text fw={600} c={componentStyles.text.caption}>
                                    配置提示
                                </Text>
                            </Group>
                            <Stack gap="xs">
                                <Text size="sm" c={componentStyles.text.caption}>
                                    • 点击数据项卡片可进入详细编辑模式
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    • 面板可以包含多个子字段，用于分组显示
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    • 通过拖拽可以调整数据项的显示顺序
                                </Text>
                            </Stack>
                        </Card.Section>
                    </Card>
                )}
            </Stack>
        ),
        [config, onChange, selectNode, modelConfig]
    );

    // 在组件顶层计算当前选中字段的配置信息 - 支持嵌套字段，增强调试
    const selectedFieldConfig = React.useMemo(() => {
        if (!selectedNode || !config.items) {
            console.log('[SelectedFieldConfig] 没有选中节点或配置项:', {
                hasNode: !!selectedNode,
                hasItems: !!config.items,
            });
            return null;
        }

        // 只处理字段类型的节点
        if (!['field-item', 'nested-field', 'deep-nested-field'].includes(selectedNode.type)) {
            console.log('[SelectedFieldConfig] 跳过非字段类型节点:', selectedNode.type);
            return null;
        }

        const nodeId = selectedNode.id;
        console.log('[SelectedFieldConfig] 处理节点:', { nodeId, type: selectedNode.type });

        let item: IEntityViewField | undefined;
        let itemIndex = -1;
        let parentPath: string[] = [];

        // 解析不同的ID格式，优先处理更具体的格式
        if (nodeId.startsWith('field-items-') && !nodeId.includes('-fields-')) {
            // 顶级字段: field-items-{index} (且不包含fields)
            const indexStr = nodeId.replace('field-items-', '');
            const index = parseInt(indexStr, 10);
            console.log('[SelectedFieldConfig] 处理顶级字段，索引:', index);

            if (!isNaN(index) && index >= 0 && index < config.items.length) {
                item = config.items[index];
                itemIndex = index;
                parentPath = ['items', index.toString()];
                console.log('[SelectedFieldConfig] 找到顶级字段:', {
                    name: item.name,
                    hasWidget: !!item.widget,
                });
            } else {
                console.warn(
                    '[SelectedFieldConfig] 顶级字段索引无效:',
                    index,
                    '总数:',
                    config.items.length
                );
            }
        } else if (nodeId.startsWith('field-')) {
            // 嵌套字段: field-items-0-fields-1-fields-0 或其他复杂路径
            const fieldPath = parseNodeId(nodeId);
            console.log('[SelectedFieldConfig] 处理嵌套字段，解析路径:', fieldPath);

            if (fieldPath.length > 0) {
                const { field, parent, index } = findFieldByPath(config.items, fieldPath);
                console.log('[SelectedFieldConfig] 路径查找结果:', {
                    hasField: !!field,
                    fieldName: field?.name,
                    hasParent: !!parent,
                    parentName: parent?.name,
                    index,
                    fieldHasWidget: !!field?.widget,
                    fieldWidget: field?.widget,
                    fieldWidgetOptions: field?.widgetOptions,
                });

                if (field) {
                    item = field;
                    itemIndex = -1; // 嵌套字段没有直接的索引
                    parentPath = fieldPath;
                    console.log('[SelectedFieldConfig] 成功找到嵌套字段:', {
                        name: item.name,
                        title: item.title,
                        widget: item.widget,
                        widgetOptions: item.widgetOptions,
                        hasFields: !!item.fields,
                        fieldsCount: item.fields?.length || 0,
                    });
                } else {
                    console.warn('[SelectedFieldConfig] 未找到嵌套字段，路径:', fieldPath);
                }
            }
        }

        if (!item) {
            console.warn('[HierarchicalViewEditor] 无法找到字段配置:', nodeId);
            console.warn(
                '[HierarchicalViewEditor] 当前config.items结构:',
                config.items?.map((i) => ({ name: i.name, hasFields: !!i.fields }))
            );
            return null;
        }

        // 获取对应模型字段信息
        const modelField = modelConfig?.fields?.find((f: any) => f.name === item.name);
        console.log('[SelectedFieldConfig] 模型字段匹配:', {
            hasModelField: !!modelField,
            modelFieldName: modelField?.name,
            modelFieldType: modelField?.type,
        });

        const result = {
            item,
            modelField,
            fieldIdentifier: item.name,
            itemIndex,
            fieldPath: parentPath,
            isNestedField: selectedNode.type !== 'field-item',
        };

        console.log('[SelectedFieldConfig] 最终配置结果:', {
            fieldName: result.item.name,
            isNested: result.isNestedField,
            hasCompleteInfo: !!(result.item.name && result.item.title),
            apiDataIntact: !!(
                result.item.widget ||
                result.item.widgetOptions ||
                result.item.description
            ),
        });

        return result;
    }, [selectedNode, config.items, modelConfig?.fields]);

    // 字段项编辑器 - 使用增强字段编辑器，支持嵌套字段编辑
    const renderFieldItemEditor = useCallback(() => {
        if (!selectedFieldConfig) return null;

        const { item, modelField, itemIndex, fieldPath, isNestedField } = selectedFieldConfig;

        const handleFieldUpdate = (updatedField: IEntityViewField) => {
            const fieldChanged = !deepEqual(item, updatedField);

            if (!fieldChanged) {
                return;
            }

            const newItems = JSON.parse(JSON.stringify(config.items)); // 深拷贝

            if (isNestedField && fieldPath) {
                // 处理嵌套字段更新
                const {
                    field: targetField,
                    parent: parentField,
                    index,
                } = findFieldByPath(newItems, fieldPath);

                if (targetField && parentField && parentField.fields && index >= 0) {
                    parentField.fields[index] = updatedField;
                    onChange({ ...config, items: newItems });
                } else if (targetField && !parentField && index >= 0) {
                    // 顶级字段情况
                    newItems[index] = updatedField;
                    onChange({ ...config, items: newItems });
                }
            } else if (itemIndex >= 0 && itemIndex < newItems.length) {
                // 处理顶级字段更新
                newItems[itemIndex] = updatedField;
                onChange({ ...config, items: newItems });
            }
        };

        return (
            <Box style={{ p: 3 }}>
                <EnhancedFieldEditor
                    field={item}
                    modelField={modelField}
                    viewType={config.viewType}
                    onFieldChange={handleFieldUpdate}
                    availableWidgets={availableWidgetsForView}
                />
            </Box>
        );
    }, [selectedFieldConfig, config, onChange, availableWidgetsForView]);

    // 渲染编辑器内容
    const renderEditorContent = useCallback(() => {
        if (!selectedNode) return null;

        switch (selectedNode.type) {
            case 'basic-info':
                return renderBasicInfoEditor();
            case 'view-config':
                return renderViewConfigEditor();
            case 'items-config':
                return renderItemsConfigEditor();
            case 'field-item':
            case 'nested-field':
            case 'deep-nested-field':
                return renderFieldItemEditor();
            default:
                return (
                    <Box style={{ p: 3, textAlign: 'center' }}>
                        <Text c={componentStyles.text.caption}>请选择左侧的配置项进行编辑</Text>
                    </Box>
                );
        }
    }, [
        selectedNode,
        renderBasicInfoEditor,
        renderViewConfigEditor,
        renderItemsConfigEditor,
        renderFieldItemEditor,
    ]);

    return (
        <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 仅保留可视化编辑模式 */}
            <>
                {/* 主编辑区域 - 左右两栏布局 */}
                <Box
                    style={{
                        flex: 1,
                        display: 'flex',
                        overflow: 'hidden',
                        gap: 'var(--mantine-spacing-sm)',
                    }}
                >
                    {/* 左栏：配置树导航 */}
                    <Paper
                        withBorder
                        shadow="sm"
                        radius="md"
                        style={{
                            flex: '0 0 220px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'visible',
                        }}
                    >
                        <ScrollArea.Autosize
                            mah="100%"
                            type="auto"
                            scrollbarSize={8}
                            style={{
                                flex: 1,
                                minHeight: 0,
                            }}
                            px={4}
                            py={8}
                        >
                            {/* 注入DndContext (修改) */}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <List>{configTree.map((node) => renderTreeNode(node))}</List>
                            </DndContext>
                        </ScrollArea.Autosize>
                    </Paper>

                    {/* 右栏：配置编辑器 (占满剩余空间) */}
                    <Paper
                        withBorder
                        shadow="sm"
                        radius="md"
                        style={{
                            flex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box
                            style={{
                                flex: 1,
                                overflow: 'auto', // 直接使用 auto overflow 实现滚动
                                padding: '12px',
                            }}
                        >
                            {renderEditorContent()}
                        </Box>
                    </Paper>
                </Box>

                {/* 字段选择器对话框 */}
                {modelConfig && (
                    <FieldSelectorDialog
                        open={editorState.showFieldSelector}
                        onClose={() =>
                            setEditorState((prev) => ({ ...prev, showFieldSelector: false }))
                        }
                        onSelect={(field) => handleFieldSelect(field as IEntityField)}
                        modelConfig={modelConfig as any}
                        usedFieldNames={usedFieldNames}
                    />
                )}
            </>
        </Box>
    );
}

// SECTION 5: 导出声明

// 组件导出
export { ViewOptionsEditor, WidgetConfigEditor, EnhancedFieldEditor, UniversalFieldsEditor };

// 工具函数导出
export {
    getViewConfigSpecForEditor,
    getWidgetConfigSpecForEditor,
    getWidgetDefaultConfigForEditor,
};
