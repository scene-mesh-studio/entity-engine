'use client';

import type { IEntityEngine } from '@scenemesh/entity-engine';
import type { EditMode } from '../types/editor';
import type { StudioDataManager } from '../utils/studio-data-manager';
import type {
    IEntityView,
    IEntityModel,
    ExtendedEntityModel,
    ExtendedEntityField,
} from '../types/entities';

import { m } from 'framer-motion';
import { useMediaQuery } from '@mantine/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
    Box,
    Text,
    Card,
    Menu,
    Grid,
    Title,
    Paper,
    Alert,
    Group,
    Stack,
    Badge,
    Button,
    Loader,
    Divider,
    Tooltip,
    Container,
    ActionIcon,
    ScrollArea,
} from '@mantine/core';

import { Icon } from '../utils/icon-mapping';
import { SaveConfirmationDialog } from './save-dialog';
import { HierarchicalViewEditor } from './view-editor';
import { SaveResultDialog } from './save-result-dialog';
import { HierarchicalModelEditor } from './model-editor';
import { PreviewPanel, type PreviewModeConfig } from './preview';
import { deepEqual, validateDataIntegrity } from '../utils/data-utils';
import { StudioEngineService } from '../services/studio-engine-service';
import { useStudioEngineOptional } from '../providers/studio-engine-provider';
import { changeDetector, type ConfigSnapshot } from '../services/change-detector';
import { componentStyles, studioThemeColors, getThemedTextProps } from '../utils/theme';
import { studioSaveService, type StudioSaveData } from '../services/studio-save-service';
import {
    createStudioDataManagerForNew,
    createStudioDataManagerFromAPI,
} from '../utils/studio-data-manager';

// ================================================================================
// 📦 SECTION 1: 导入和类型定义
// ================================================================================

export interface UnifiedConfigurationWorkspaceProps {
    engine?: IEntityEngine;
    onSave?: (config: { model: IEntityModel; views: IEntityView[] } | any) => void; // 可选的外部保存回调，用于兼容性
    onCancel?: () => void;
}

interface ConfigurationState {
    selectedModel: IEntityModel | null;
    modelViews: IEntityView[];
    selectedViewIndex: number;
    isNewModel: boolean;
    loading: boolean;
    error: string | null;
    editMode: EditMode;
    // 数据管理器 - 解决数据完整性问题的核心
    dataManager?: StudioDataManager;
    // 保留原有快照相关状态用于向后兼容
    originalSnapshot?: ConfigSnapshot;
    saveDialog: {
        open: boolean;
        loading: boolean;
    };
    // 保存结果对话框状态
    saveResultDialog: {
        open: boolean;
        result: {
            success: boolean;
            message?: string;
            error?: string;
            savedData?: any;
        } | null;
    };
    // 预览抽屉状态
    previewDrawer: {
        open: boolean;
    };
}

interface ModelSelectorState {
    open: boolean;
    anchor: HTMLElement | null;
    availableModels: IEntityModel[];
    loading: boolean;
}

type ModelSelectionMode = 'new' | 'existing';

// ================================================================================
// 🛠️ SECTION 2: 工具函数库
// ================================================================================

// 2.1 配置中心（统一管理所有配置常量）
const WORKSPACE_CONFIGS = {
    ui: {
        heights: {
            toolbar: '80px',
            fullHeight: '100vh',
        },
        widths: {
            modelPanel: '320px',
            previewDrawer: '450px',
            minViewPanel: '400px',
        },
        responsive: {
            breakpoints: {
                tablet: 900,
                desktop: 1200,
            },
            gridColumns: {
                md: 12,
                lg: 12,
                xl: 12,
            },
            panelSizes: {
                // md: 二列布局
                tablet: { model: 5, view: 7 },
                // lg+: 二列布局 - 优化比例
                desktop: { model: 4, view: 8 },
            },
        },
        transitions: {
            flex: '0.3s ease',
            width: '0.3s ease',
            card: 'all 0.2s',
            layout: 'all 0.3s ease-in-out',
        },
        zIndex: {
            loading: 9999,
            panel: 1,
            toolbar: 10,
            dropdown: 1500, // 在 studio modal (1000) 之上但在 save dialog (2000) 之下
        },
        spacing: {
            panel: 2,
            section: 3,
            card: 1.5,
            gap: 1,
            container: 2,
        },
        styles: {
            centerColumn: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
            },
            flexRow: {
                display: 'flex',
                alignItems: 'center',
            },
            flexRowSpaceBetween: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            },
            flexWrap: {
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
            },
            panelHeader: {
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.default',
            },
            loadingOverlay: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            },
        },
    },

    icons: {
        workspace: 'solar:settings-bold',
        model: 'solar:add-folder-bold',
        view: 'solar:add-circle-bold',
        menu: 'solar:list-bold',
        preview: {
            open: 'solar:eye-bold',
            close: 'solar:close-circle-bold',
        },
        actions: {
            save: 'solar:check-circle-bold',
            cancel: 'solar:close-circle-bold',
            delete: 'solar:trash-bin-trash-bold',
            dropdown: 'eva:chevron-down-fill',
        },
    },

    messages: {
        welcome: {
            title: '欢迎使用功能配置工作台',
            description:
                '请点击右上角的"选择数据模型"按钮开始配置。您可以创建新的数据模型，或基于现有模型进行配置。',
        },
        loading: {
            models: '加载中...',
            configuration: '配置中...',
        },
        errors: {
            loadModels: '加载数据模型失败',
            getViews: '获取模型视图失败',
            configModel: '配置模型失败',
        },
        labels: {
            selectModel: '选择数据模型',
            noModels: '暂无可用的数据模型',
            newModel: '新建数据模型',
            existingModel: '选择已有数据模型',
        },
    },

    defaults: {
        model: {
            name: 'newModel',
            title: '新数据模型',
            description: '请配置您的数据模型',
        },
        view: {
            name: 'newView',
            title: '新视图',
            viewType: 'form' as const,
        },
    },
} as const;

// 2.2 数据转换工具
function createDefaultModel(): IEntityModel {
    return {
        ...WORKSPACE_CONFIGS.defaults.model,
        fields: [],
    };
}

// 类型转换函数：IEntityModel -> ExtendedEntityModel - 保持完整性
function studioToExtendedModel(studioModel: IEntityModel): ExtendedEntityModel {
    return {
        ...(studioModel as any), // 保留所有原始属性
        fields: studioModel.fields?.map((field) => {
            const extendedField: any = {
                ...(field as any), // 保留字段的所有原始属性
                order: field.order || 0,
                // 为ExtendedEntityField特有的属性提供安全默认值，但不覆盖现有值
                isPrimaryKey: (field as any).isPrimaryKey ?? false,
                isUnique: (field as any).isUnique ?? false,
                editable: (field as any).editable ?? true,
            };

            // 只有当字段已有validation属性时才保留，避免自动添加空数组
            if ((field as any).validation !== undefined) {
                extendedField.validation = (field as any).validation;
            }

            return extendedField;
        }),
    };
}

// 类型转换函数 - 完全保留所有字段，不再作为白名单过滤器
function extendedToStudioModel(extendedModel: ExtendedEntityModel): IEntityModel {
    // 使用扩展操作符完全保留所有属性，避免字段丢失
    const result: IEntityModel = {
        ...(extendedModel as any), // 保留所有原始属性
        fields:
            extendedModel.fields?.map((field: ExtendedEntityField) => ({
                ...(field as any), // 保留字段的所有属性
                order: (field as any).order || 0, // 确保order有默认值
            })) || [],
    };

    if (process.env.NODE_ENV === 'development') {
        // 检查是否有字段丢失
        const originalFieldCount = extendedModel.fields?.length || 0;
        const resultFieldCount = result.fields?.length || 0;
        if (originalFieldCount !== resultFieldCount) {
            console.warn('extendedToStudioModel - 字段数量不匹配!', {
                原始: originalFieldCount,
                结果: resultFieldCount,
            });
        }
    }

    return result;
}

// 类型转换函数：IEntityModel[] -> ExtendedEntityModel[]
function studioToExtendedModels(studioModels: IEntityModel[]): ExtendedEntityModel[] {
    return studioModels.map(studioToExtendedModel);
}

function createDefaultView(modelName: string): IEntityView {
    return {
        ...WORKSPACE_CONFIGS.defaults.view,
        modelName,
        items: [],
    };
}

/**
 * 智能字段比较：忽略自动添加的默认值差异
 */
function areFieldsEffectivelyEqual(originalField: any, newField: any): boolean {
    // 如果完全相等，直接返回
    if (deepEqual(originalField, newField)) {
        return true;
    }

    // 创建标准化的比较副本，移除或标准化可能自动添加的属性
    const normalizeForComparison = (field: any) => {
        const normalized = { ...field };

        // 标准化 validation 数组：空数组等同于 undefined
        if (Array.isArray(normalized.validation) && normalized.validation.length === 0) {
            delete normalized.validation;
        }

        // 标准化其他可能自动添加的默认值
        if (normalized.typeOptions && Object.keys(normalized.typeOptions).length === 0) {
            delete normalized.typeOptions;
        }

        if (normalized.description === '') {
            delete normalized.description;
        }

        return normalized;
    };

    const normalizedOriginal = normalizeForComparison(originalField);
    const normalizedNew = normalizeForComparison(newField);

    const result = deepEqual(normalizedOriginal, normalizedNew);

    return result;
}

/**
 * 智能视图比较：忽略自动添加的默认值差异和顺序差异
 */
function areViewsEffectivelyEqual(originalView: any, newView: any): boolean {
    // 如果完全相等，直接返回
    if (deepEqual(originalView, newView)) {
        return true;
    }

    // 创建标准化的比较副本
    const normalizeViewForComparison = (view: any) => {
        const normalized = { ...view };

        // 标准化基础属性的默认值
        if (normalized.title === normalized.name || normalized.title === '') {
            delete normalized.title;
        }

        if (normalized.description === '') {
            delete normalized.description;
        }

        // 标准化权限字段的默认值
        if (normalized.canEdit === true) delete normalized.canEdit;
        if (normalized.canNew === true) delete normalized.canNew;
        if (normalized.canDelete === true) delete normalized.canDelete;

        // 标准化items数组，移除自动添加的默认值
        if (Array.isArray(normalized.items)) {
            normalized.items = normalized.items.map((item: any) => {
                const normalizedItem = { ...item };

                // 标准化item的默认值
                if (normalizedItem.spanCols === 12) delete normalizedItem.spanCols;
                if (normalizedItem.order === 0) delete normalizedItem.order;
                if (normalizedItem.title === normalizedItem.name || normalizedItem.title === '') {
                    delete normalizedItem.title;
                }
                if (normalizedItem.required === false) delete normalizedItem.required;
                if (normalizedItem.disabled === false) delete normalizedItem.disabled;
                if (normalizedItem.readonly === false) delete normalizedItem.readonly;

                return normalizedItem;
            });

            // 按name排序items数组以消除顺序差异
            normalized.items.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        }

        return normalized;
    };

    const normalizedOriginal = normalizeViewForComparison(originalView);
    const normalizedNew = normalizeViewForComparison(newView);

    const result = deepEqual(normalizedOriginal, normalizedNew);

    return result;
}

function createNewViewForModel(model: IEntityModel, viewCount: number): IEntityView {
    return {
        name: `${model.name}View${viewCount + 1}`,
        title: `新视图 ${viewCount + 1}`,
        modelName: model.name,
        viewType: 'form',
        items: [],
    };
}

// 2.3 状态验证工具
function validateSaveConditions(state: ConfigurationState): boolean {
    return !!state.selectedModel; // 只要有模型就可以保存，不强制要求视图
}

function canDeleteView(viewCount: number): boolean {
    return viewCount > 1;
}

// 2.5 样式和配置访问工具
function getStyle(styleName: keyof typeof WORKSPACE_CONFIGS.ui.styles) {
    return WORKSPACE_CONFIGS.ui.styles[styleName];
}

function getSpacing(spacingName: keyof typeof WORKSPACE_CONFIGS.ui.spacing) {
    return WORKSPACE_CONFIGS.ui.spacing[spacingName];
}

function getTransition(transitionName: keyof typeof WORKSPACE_CONFIGS.ui.transitions) {
    return WORKSPACE_CONFIGS.ui.transitions[transitionName];
}

function getIcon(iconPath: string) {
    const paths = iconPath.split('.');
    let current: any = WORKSPACE_CONFIGS.icons;
    for (const path of paths) {
        current = current[path];
        if (!current) return WORKSPACE_CONFIGS.icons.workspace;
    }
    return current;
}

function getMessage(messagePath: string) {
    const paths = messagePath.split('.');
    let current: any = WORKSPACE_CONFIGS.messages;
    for (const path of paths) {
        current = current[path];
        if (!current) return messagePath;
    }
    return current;
}

// 2.6 初始状态生成器
function createInitialConfigurationState(): ConfigurationState {
    return {
        selectedModel: null,
        modelViews: [],
        selectedViewIndex: 0,
        isNewModel: true,
        loading: false,
        error: null,
        editMode: 'visual',
        // 初始化快照相关状态
        originalSnapshot: undefined,
        saveDialog: {
            open: false,
            loading: false,
        },
        // 初始化保存结果对话框状态
        saveResultDialog: {
            open: false,
            result: null,
        },
        // 初始化预览抽屉状态
        previewDrawer: {
            open: false,
        },
    };
}

function createInitialModelSelectorState(): ModelSelectorState {
    return {
        open: false,
        anchor: null,
        availableModels: [],
        loading: false,
    };
}

// ================================================================================
// 🧩 SECTION 3: 小型辅助组件
// ================================================================================

// 3.1 欢迎界面组件（React.memo优化）
interface WelcomeScreenProps {
    onSelectModel: (anchor: HTMLElement) => void;
    modelSelector: ModelSelectorState;
    onModelSelection: (mode: ModelSelectionMode, model?: IEntityModel) => void;
}

function WelcomeScreen({ onSelectModel, modelSelector, onModelSelection }: WelcomeScreenProps) {
    return (
        <Box
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100%',
                background: componentStyles.toolbar.background,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 极简的顶部区域 */}
            <Box
                style={{
                    padding: '16px 24px',
                    borderBottom: `1px solid ${componentStyles.welcomeScreen.border}`,
                }}
            >
                <Title
                    order={3}
                    style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: componentStyles.welcomeScreen.titleColor,
                        margin: 0,
                    }}
                >
                    {getMessage('welcome.title')}
                </Title>
            </Box>

            {/* 主要内容区域 */}
            <ScrollArea style={{ flex: 1, minHeight: 0 }} px="lg" py="lg">
                <Box
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                    }}
                >
                    {/* 精简的新建模型卡片 */}
                    <Box style={{ marginBottom: '24px' }}>
                        <Box
                            style={{
                                padding: '16px 20px',
                                borderRadius: '8px',
                                background: `linear-gradient(135deg, ${studioThemeColors.info}, ${studioThemeColors.info})`,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }}
                            onClick={() => onModelSelection('new')}
                        >
                            <Box
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box>
                                    <Text
                                        style={{
                                            color: 'white',
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            marginBottom: '2px',
                                        }}
                                    >
                                        创建新数据模型
                                    </Text>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* 区域标题 */}
                    <Box
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: componentStyles.welcomeScreen.titleColor,
                            }}
                        >
                            现有数据模型
                        </Text>

                        {modelSelector.availableModels.length > 0 && (
                            <Text
                                size="sm"
                                style={{ color: componentStyles.welcomeScreen.countColor }}
                            >
                                {modelSelector.availableModels.length} 个
                            </Text>
                        )}
                    </Box>

                    {/* 状态显示 */}
                    {modelSelector.loading ? (
                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '120px',
                                gap: '12px',
                            }}
                        >
                            <Loader size="md" color="blue" />
                            <Text size="sm" {...getThemedTextProps('muted')}>
                                {getMessage('loading.models')}
                            </Text>
                        </Box>
                    ) : modelSelector.availableModels.length === 0 ? (
                        <Box
                            style={{
                                textAlign: 'center',
                                padding: '32px',
                                borderRadius: '8px',
                                background: componentStyles.welcomeScreen.cardBackground,
                                border: `1px solid ${componentStyles.welcomeScreen.border}`,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: '14px',
                                }}
                                {...getThemedTextProps('muted')}
                            >
                                暂无数据模型，点击上方按钮创建第一个
                            </Text>
                        </Box>
                    ) : (
                        <Box
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                gap: '12px',
                                paddingBottom: '24px',
                            }}
                        >
                            {modelSelector.availableModels.map((model, index) => (
                                <Box
                                    key={model.name}
                                    style={{
                                        background: componentStyles.welcomeScreen.cardBackground,
                                        borderRadius: '8px',
                                        border: `1px solid ${componentStyles.welcomeScreen.border}`,
                                        padding: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow =
                                            '0 4px 12px rgba(0, 0, 0, 0.1)';
                                        e.currentTarget.style.borderColor =
                                            studioThemeColors.selectedBackground;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor =
                                            componentStyles.welcomeScreen.border;
                                    }}
                                    onClick={() => onModelSelection('existing', model)}
                                >
                                    {/* 顶部装饰 */}
                                    <Box
                                        style={{
                                            width: '100%',
                                            height: '2px',
                                            background: `linear-gradient(90deg, ${studioThemeColors.info}, ${studioThemeColors.info})`,
                                            borderRadius: '1px',
                                            marginBottom: '12px',
                                        }}
                                    />

                                    {/* 核心信息 */}
                                    <Box style={{ marginBottom: '12px' }}>
                                        <Text
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                marginBottom: '4px',
                                                lineHeight: 1.3,
                                            }}
                                            {...getThemedTextProps('heading')}
                                        >
                                            {model.title}
                                        </Text>
                                        <Text
                                            size="xs"
                                            style={{
                                                fontSize: '12px',
                                            }}
                                            {...getThemedTextProps('muted')}
                                        >
                                            {model.name}
                                        </Text>
                                    </Box>

                                    {/* 简化的底部信息 */}
                                    <Box
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Text
                                            size="xs"
                                            style={{
                                                fontSize: '11px',
                                                color: componentStyles.chip.success.color,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {model.fields.length} 个字段
                                        </Text>

                                        <Icon
                                            icon="solar:arrow-right-bold"
                                            size={14}
                                            style={{ color: componentStyles.treeNode.normalText }}
                                        />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </ScrollArea>
        </Box>
    );
}

// 3.2 模型选择器菜单组件
interface ModelSelectorMenuProps {
    selectorState: ModelSelectorState;
    onClose: () => void;
    onSelectNew: () => void;
    onSelectExisting: (model: IEntityModel) => void;
}

function ModelSelectorMenu({
    selectorState,
    onClose,
    onSelectNew,
    onSelectExisting,
}: ModelSelectorMenuProps) {
    return (
        <Box style={{ minWidth: '380px', maxWidth: '420px' }}>
            {/* 新建模型选项 - 优化设计 */}
            <Box
                style={{
                    padding: '12px',
                    borderBottom: `1px solid ${componentStyles.toolbar.border}`,
                }}
            >
                <Button
                    variant="light"
                    size="sm"
                    fullWidth
                    onClick={onSelectNew}
                    leftSection={<Icon icon="solar:add-circle-bold" size={16} />}
                    style={{
                        height: '44px',
                        justifyContent: 'flex-start',
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: componentStyles.chip.success.backgroundColor,
                        color: componentStyles.chip.success.color,
                        borderColor: componentStyles.chip.success.borderColor,
                    }}
                >
                    <Box style={{ textAlign: 'left', flex: 1 }}>
                        <Text
                            size="sm"
                            fw={600}
                            style={{ color: componentStyles.chip.success.color }}
                        >
                            {getMessage('labels.newModel')}
                        </Text>
                    </Box>
                </Button>
            </Box>

            {/* 已有模型列表 - 优化设计 */}
            <Box style={{ padding: '12px 0' }}>
                <Box style={{ padding: '0 16px 12px 16px' }}>
                    <Group gap="xs" align="center">
                        <Icon
                            icon="solar:database-bold"
                            size={16}
                            style={{ color: componentStyles.text.muted }}
                        />
                        <Text size="sm" fw={600} c={componentStyles.text.label}>
                            已有数据模型
                        </Text>
                        {selectorState.availableModels.length > 0 && (
                            <Badge size="sm" color="gray" variant="light">
                                {selectorState.availableModels.length}
                            </Badge>
                        )}
                    </Group>
                </Box>

                {selectorState.loading ? (
                    <Box
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '32px 16px',
                            gap: '12px',
                        }}
                    >
                        <Loader size="sm" color="blue" />
                        <Text size="sm" c={componentStyles.text.secondary}>
                            {getMessage('loading.models')}
                        </Text>
                    </Box>
                ) : selectorState.availableModels.length === 0 ? (
                    <Box
                        style={{
                            textAlign: 'center',
                            padding: '32px 16px',
                            color: componentStyles.text.muted,
                        }}
                    >
                        <Icon
                            icon="solar:database-bold"
                            size={40}
                            style={{ color: componentStyles.text.muted, marginBottom: '12px' }}
                        />
                        <Text size="sm" c={componentStyles.text.secondary} fw={500}>
                            暂无数据模型
                        </Text>
                        <Text
                            size="xs"
                            c={componentStyles.text.caption}
                            style={{ marginTop: '4px' }}
                        >
                            点击上方按钮创建第一个数据模型
                        </Text>
                    </Box>
                ) : (
                    <Box style={{ maxHeight: '320px', overflowY: 'auto', padding: '0 6px' }}>
                        {selectorState.availableModels.map((model, index) => (
                            <Box
                                key={model.name}
                                style={{
                                    padding: '10px',
                                    margin: '3px 0',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    border: `1px solid ${componentStyles.welcomeScreen.border}`,
                                    transition: 'all 0.2s ease',
                                    backgroundColor: componentStyles.welcomeScreen.cardBackground,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        componentStyles.treeNode.hoverBackground;
                                    e.currentTarget.style.borderColor =
                                        componentStyles.treeNode.selectedBackground;
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow =
                                        '0 2px 8px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        componentStyles.welcomeScreen.cardBackground;
                                    e.currentTarget.style.borderColor =
                                        componentStyles.welcomeScreen.border;
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                                onClick={() => onSelectExisting(model)}
                            >
                                <Group gap="sm" align="center">
                                    {/* 模型图标 - 缩小 */}
                                    <Box
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '6px',
                                            backgroundColor: 'var(--mantine-color-blue-1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon
                                            icon="solar:database-bold"
                                            size={16}
                                            color="var(--mantine-color-blue-6)"
                                        />
                                    </Box>

                                    {/* 模型信息 - 简化 */}
                                    <Box style={{ flex: 1, minWidth: 0 }}>
                                        <Text
                                            size="sm"
                                            fw={600}
                                            c="dark"
                                            style={{
                                                marginBottom: '2px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {model.title}
                                        </Text>

                                        <Group gap="sm" align="center">
                                            <Text
                                                size="xs"
                                                c={componentStyles.text.muted}
                                                style={{
                                                    fontFamily: 'monospace',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '120px',
                                                }}
                                            >
                                                {model.name}
                                            </Text>

                                            <Text size="xs" c={componentStyles.text.caption}>
                                                {model.fields?.length || 0} 字段
                                            </Text>
                                        </Group>
                                    </Box>
                                </Group>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

// 3.4 工具栏组件
interface WorkspaceToolbarProps {
    state: ConfigurationState;
    modelSelector: ModelSelectorState;
    onModelSelection: (mode: ModelSelectionMode, model?: IEntityModel) => void;
    onTogglePreviewDrawer: () => void;
    onCancel?: () => void;
    onSave: () => void;
}

function WorkspaceToolbar({
    state,
    modelSelector,
    onModelSelection,
    onTogglePreviewDrawer,
    onCancel,
    onSave,
}: WorkspaceToolbarProps) {
    const isSmallScreen = useMediaQuery('(max-width: 900px)'); // < 900px
    const isExtraSmall = useMediaQuery('(max-width: 600px)'); // < 600px

    // 判断是否为初始选择页面（没有选择数据模型）
    const isInitialPage = !state.selectedModel;

    // 控制Menu的开关状态
    const [menuOpened, setMenuOpened] = useState(false);

    // 优化：使用useCallback优化事件处理器
    const handleMenuToggle = useCallback((opened: boolean) => {
        setMenuOpened(opened);
    }, []);

    const handleModelSelection = useCallback(
        (mode: ModelSelectionMode, model?: IEntityModel) => {
            onModelSelection(mode, model);
            setMenuOpened(false);
        },
        [onModelSelection]
    );

    // 缓存计算值，避免重复计算
    const modelStatus = useMemo(() => {
        if (!state.selectedModel) return null;
        return {
            isNewModel: state.isNewModel,
            statusColor: state.isNewModel
                ? 'var(--mantine-color-green-6)'
                : 'var(--mantine-color-blue-6)',
            displayText: isExtraSmall
                ? state.selectedModel
                    ? '已选择'
                    : '选择'
                : state.selectedModel
                  ? state.selectedModel.title
                  : getMessage('labels.selectModel'),
        };
    }, [state.selectedModel, state.isNewModel, isExtraSmall]);

    return (
        <Paper
            shadow="sm"
            p={getSpacing('panel')}
            style={{
                borderBottom: `1px solid ${componentStyles.toolbar.border}`,
                borderRadius: 0,
            }}
        >
            <Group
                justify="space-between"
                align="center"
                gap={isExtraSmall ? 'xs' : getSpacing('gap')}
                style={{
                    minHeight: isExtraSmall ? '36px' : '42px',
                }}
            >
                {/* 左侧：数据模型选择器和状态 - 仅在非初始页面显示 */}
                {!isInitialPage && (
                    <Group
                        gap={isExtraSmall ? 'xs' : getSpacing('gap')}
                        align={isExtraSmall ? 'flex-start' : 'center'}
                        style={{
                            flex: isExtraSmall ? '2 1 auto' : '1 0 0',
                            minWidth: 0, // 允许flex item收缩
                        }}
                    >
                        <Menu
                            position="bottom-start"
                            withArrow
                            opened={menuOpened}
                            onChange={handleMenuToggle}
                            styles={{
                                dropdown: {
                                    minWidth: 380,
                                    maxWidth: 420,
                                    padding: 0, // 移除默认padding，让自定义组件控制
                                    zIndex: WORKSPACE_CONFIGS.ui.zIndex.dropdown, // 使用配置的 z-index
                                },
                            }}
                        >
                            <Menu.Target>
                                <Button
                                    variant="outline"
                                    leftSection={<Icon icon={getIcon('model')} size={18} />}
                                    rightSection={
                                        !isExtraSmall ? (
                                            <Icon icon={getIcon('actions.dropdown')} size={14} />
                                        ) : undefined
                                    }
                                    size={isExtraSmall ? 'xs' : 'sm'}
                                    style={{
                                        minWidth: isExtraSmall ? 'auto' : '180px',
                                        width: isExtraSmall ? '100%' : 'auto',
                                        height: isExtraSmall ? '32px' : '36px',
                                        fontWeight: 500,
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            flex: 1,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* 移除重复的图标，只显示状态指示器 */}
                                        {modelStatus && !isExtraSmall && (
                                            <Box
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: modelStatus.statusColor,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                        <Text
                                            size={isExtraSmall ? 'xs' : 'sm'}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {modelStatus?.displayText ||
                                                getMessage('labels.selectModel')}
                                        </Text>
                                    </Box>
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <ModelSelectorMenu
                                    selectorState={modelSelector}
                                    onClose={() => setMenuOpened(false)}
                                    onSelectNew={() => handleModelSelection('new')}
                                    onSelectExisting={(model) =>
                                        handleModelSelection('existing', model)
                                    }
                                />
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                )}

                {/* 中间：标题 */}
                {!isExtraSmall && (
                    <Box
                        style={{
                            flex: isInitialPage ? '1 0 0' : '0 1 auto',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minWidth: 0,
                        }}
                    >
                        <Text
                            component={m.div}
                            size="xl"
                            fw={800}
                            animate={{ backgroundPosition: '200% center' }}
                            transition={{
                                duration: 20,
                                ease: 'linear',
                                repeat: Infinity,
                                repeatType: 'reverse',
                            }}
                            style={{
                                background:
                                    'linear-gradient(300deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-orange-6) 25%, var(--mantine-color-blue-6) 50%, var(--mantine-color-orange-6) 75%, var(--mantine-color-blue-6) 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                backgroundSize: '600%',
                                fontSize: isSmallScreen ? '0.85rem' : '1rem',
                                letterSpacing: '0.5px',
                                textAlign: 'center',
                                margin: 0,
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Entity-Engine-Studio
                        </Text>
                    </Box>
                )}

                {/* 右侧：操作按钮 */}
                <Group
                    gap={isExtraSmall ? 'xs' : getSpacing('gap')}
                    justify="flex-end"
                    wrap={isExtraSmall ? 'wrap' : 'nowrap'}
                    style={{
                        flex: isInitialPage ? '0 0 auto' : isExtraSmall ? '1 1 auto' : '1 0 0',
                        minWidth: 0,
                    }}
                >
                    {/* 预览抽屉切换 - 仅在非初始页面显示 */}
                    {!isInitialPage && (
                        <Tooltip label={state.previewDrawer.open ? '关闭预览抽屉' : '打开预览抽屉'}>
                            {isExtraSmall ? (
                                <ActionIcon
                                    onClick={onTogglePreviewDrawer}
                                    style={{
                                        color: state.previewDrawer.open
                                            ? componentStyles.chip.primary.color
                                            : componentStyles.treeNode.normalText,
                                    }}
                                    variant={state.previewDrawer.open ? 'filled' : 'outline'}
                                    size="sm"
                                >
                                    <Icon
                                        icon={
                                            state.previewDrawer.open
                                                ? getIcon('preview.close')
                                                : getIcon('preview.open')
                                        }
                                    />
                                </ActionIcon>
                            ) : (
                                <Button
                                    variant={state.previewDrawer.open ? 'filled' : 'outline'}
                                    onClick={onTogglePreviewDrawer}
                                    leftSection={
                                        <Icon
                                            icon={
                                                state.previewDrawer.open
                                                    ? getIcon('preview.close')
                                                    : getIcon('preview.open')
                                            }
                                        />
                                    }
                                    size="sm"
                                >
                                    {isSmallScreen
                                        ? state.previewDrawer.open
                                            ? '关闭'
                                            : '预览'
                                        : state.previewDrawer.open
                                          ? '关闭预览'
                                          : '打开预览'}
                                </Button>
                            )}
                        </Tooltip>
                    )}

                    {!isExtraSmall && !isInitialPage && <Divider orientation="vertical" />}

                    {/* 取消按钮 - 始终显示 */}
                    {!isSmallScreen && (
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            leftSection={<Icon icon={getIcon('actions.cancel')} />}
                            size="sm"
                        >
                            {isInitialPage ? '关闭' : '取消'}
                        </Button>
                    )}

                    {/* 保存按钮 - 仅在非初始页面显示 */}
                    {!isInitialPage && (
                        <>
                            {isExtraSmall ? (
                                <ActionIcon
                                    onClick={onSave}
                                    disabled={!validateSaveConditions(state)}
                                    color="blue"
                                    variant="filled"
                                    size="sm"
                                >
                                    <Icon icon={getIcon('actions.save')} />
                                </ActionIcon>
                            ) : (
                                <Button
                                    variant="filled"
                                    onClick={onSave}
                                    disabled={!validateSaveConditions(state)}
                                    leftSection={<Icon icon={getIcon('actions.save')} />}
                                    size="sm"
                                    fw={600}
                                >
                                    {isSmallScreen ? '保存' : '保存配置'}
                                </Button>
                            )}
                        </>
                    )}
                </Group>
            </Group>

            {/* 错误提示 */}
            {state.error && (
                <Alert color="red" mt="sm">
                    {state.error}
                </Alert>
            )}
        </Paper>
    );
}

// 3.5 视图管理面板组件
interface ViewManagementPanelProps {
    state: ConfigurationState;
    onSelectView: (index: number) => void;
    onAddView: () => void;
    onDeleteView: (index: number) => void;
    onViewChange: (view: IEntityView) => void;
}

function ViewManagementPanel({
    state,
    onSelectView,
    onAddView,
    onDeleteView,
    onViewChange,
}: ViewManagementPanelProps) {
    const currentView = state.modelViews[state.selectedViewIndex] || null;

    return (
        <Paper
            shadow="md"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: WORKSPACE_CONFIGS.ui.zIndex.panel,
            }}
        >
            {/* 视图选择器头部 - 紧凑型设计 */}
            <Box
                p="md"
                style={{
                    backgroundColor: componentStyles.toolbar.background,
                }}
            >
                <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                        <Text size="md" fw={600} c={componentStyles.text.heading}>
                            视图配置管理
                        </Text>
                    </Group>
                    <Button
                        variant="outline"
                        size="xs"
                        leftSection={<Icon icon={getIcon('view')} />}
                        onClick={onAddView}
                    >
                        添加视图
                    </Button>
                </Group>

                {/* 视图标签页 - 紧凑型设计 */}
                <Group gap="xs" wrap="wrap">
                    {state.modelViews.map((view, index) => (
                        <Card
                            key={index}
                            withBorder
                            p="xs"
                            style={{
                                minWidth: '140px',
                                height: '65px',
                                cursor: 'pointer',
                                transition: getTransition('card'),
                                ...(state.selectedViewIndex === index && {
                                    backgroundColor: 'var(--mantine-color-blue-1)',
                                    borderColor: 'var(--mantine-color-blue-6)',
                                }),
                            }}
                            onClick={() => onSelectView(index)}
                        >
                            <Stack gap={0} justify="space-between" h="100%">
                                {/* 第一行：视图标题 + 删除按钮 */}
                                <Group justify="space-between" gap={2}>
                                    <Text
                                        size="xs"
                                        c={componentStyles.text.caption}
                                        fw={600}
                                        truncate
                                        title={view.title || '未命名视图'}
                                        style={{
                                            fontSize: '0.85rem',
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        {view.title || '未命名视图'}
                                    </Text>

                                    {canDeleteView(state.modelViews.length) && (
                                        <ActionIcon
                                            size={16}
                                            variant="subtle"
                                            c="red"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteView(index);
                                            }}
                                        >
                                            <Icon icon={getIcon('actions.delete')} size={10} />
                                        </ActionIcon>
                                    )}
                                </Group>

                                {/* 第二行：视图类型标签 */}
                                <Group>
                                    <Badge
                                        size="xs"
                                        variant="outline"
                                        style={{
                                            color:
                                                state.selectedViewIndex === index
                                                    ? componentStyles.chip.primary.color
                                                    : componentStyles.treeNode.normalText,
                                            borderColor:
                                                state.selectedViewIndex === index
                                                    ? componentStyles.chip.primary.borderColor
                                                    : componentStyles.treeNode.normalText,
                                        }}
                                    >
                                        {view.viewType}
                                    </Badge>
                                </Group>
                            </Stack>
                        </Card>
                    ))}
                </Group>
            </Box>

            {/* 当前视图配置编辑器 - 移除外层ScrollArea避免嵌套滚动问题 */}
            <Box
                style={{
                    flex: 1,
                    minHeight: 0, // 关键：防止flex子项高度溢出
                    height: '100%', // 确保Box占满可用空间
                    overflow: 'hidden', // 防止溢出，让内部组件自己处理滚动
                }}
                px={getSpacing('section')}
            >
                {currentView && state.selectedModel ? (
                    <HierarchicalViewEditor
                        config={currentView}
                        modelConfig={state.selectedModel}
                        onChange={onViewChange}
                        onModeChange={() => {}}
                        editMode="visual"
                    />
                ) : (
                    <Stack align="center" justify="center" h={200} gap="md">
                        <Icon
                            icon={getIcon('view')}
                            size={48}
                            style={{ color: componentStyles.treeNode.normalText }}
                        />
                        <Text size="sm" c={componentStyles.text.secondary}>
                            选择一个视图开始配置
                        </Text>
                    </Stack>
                )}
            </Box>
        </Paper>
    );
}

// ================================================================================
// 🎯 SECTION 4: 主编辑器组件
// ================================================================================

// 4.1 统一配置工作区
export function UnifiedConfigurationWorkspace({
    engine: propEngine,
    onSave,
    onCancel,
}: UnifiedConfigurationWorkspaceProps) {
    // 获取 EntityEngine 实例 - 优先使用 props，然后从 Provider 获取
    const contextEngine = useStudioEngineOptional();
    const engine = propEngine || contextEngine;

    if (!engine) {
        throw new Error(
            'UnifiedConfigurationWorkspace requires an EntityEngine instance. Provide it via props or wrap with StudioEngineProvider.'
        );
    }

    // 创建服务实例 - 支持API基础URL配置
    const studioService = useMemo(() => new StudioEngineService(engine as any), [engine]);

    // 4.2 状态管理
    const [state, setState] = useState<ConfigurationState>(createInitialConfigurationState);
    const [modelSelector, setModelSelector] = useState<ModelSelectorState>(
        createInitialModelSelectorState
    );

    // 4.3 数据加载逻辑

    // 加载可用的数据模型 - 强制使用API数据源以保证数据一致性
    const loadAvailableModels = useCallback(async () => {
        setModelSelector((prev) => ({ ...prev, loading: true }));
        try {
            const models = await studioService.getModels();

            setModelSelector((prev) => ({
                ...prev,
                availableModels: models as any,
                loading: false,
            }));
        } catch (error) {
            console.error('[Workspace] 加载模型失败:', error);
            setState((prev) => ({ ...prev, error: WORKSPACE_CONFIGS.messages.errors.loadModels }));
            setModelSelector((prev) => ({ ...prev, loading: false }));
        }
    }, [studioService]);

    // 获取模型的所有视图 - 使用直接API绕过EntityEngine增强处理
    const getModelViews = useCallback(
        async (modelName: string): Promise<IEntityView[]> => {
            try {
                const views = await studioService.getViewsByModelNameFromDirectAPI(modelName);
                return views;
            } catch (error) {
                console.error(`[Workspace] 获取模型${modelName}视图失败:`, error);
                return [];
            }
        },
        [studioService]
    );

    // 初始化：加载可用模型
    useEffect(() => {
        loadAvailableModels();
    }, [loadAvailableModels]);

    // 4.4 事件处理逻辑

    const createNewModelConfiguration = useCallback(() => {
        try {
            const newModel = createDefaultModel();
            const newView = createDefaultView(newModel.name);

            // 创建新模型的数据管理器
            const dataManager = createStudioDataManagerForNew();

            // 初始化新模型的增量数据
            dataManager.updateModel(newModel);

            // 创建原始快照（新建模式的初始快照为空）
            const originalSnapshot: ConfigSnapshot = {
                model: null,
                views: [],
                timestamp: Date.now(),
            };

            // 获取运行时数据用于UI显示
            const runtimeData = dataManager.runtimeData;

            return {
                selectedModel: runtimeData.model,
                modelViews: [newView],
                selectedViewIndex: 0,
                isNewModel: true,
                loading: false,
                dataManager, // 数据管理器
                originalSnapshot,
            };
        } catch (error) {
            console.error('createNewModelConfiguration 失败:', error);

            // 如果初始化失败，使用简单模式
            const newModel = createDefaultModel();
            const newView = createDefaultView(newModel.name);

            return {
                selectedModel: newModel,
                modelViews: [newView],
                selectedViewIndex: 0,
                isNewModel: true,
                loading: false,
                originalSnapshot: {
                    model: null,
                    views: [],
                    timestamp: Date.now(),
                },
            };
        }
    }, []);

    /**
     * 处理已有模型的数据加载和配置
     * 核心修复：强制使用API数据源保证数据完整性和一致性
     */
    const configureExistingModel = useCallback(
        async (model: IEntityModel) => {
            try {
                // 强制使用API数据源获取完整的模型信息
                const apiModels = await studioService.getModels();
                const fullModel = apiModels.find((apiModel) => apiModel.name === model.name);

                if (!fullModel) {
                    throw new Error(`无法在API数据中找到模型 ${model.name}`);
                }

                // 2. 动态加载该模型的所有已配置视图
                const views = await getModelViews(fullModel.name);

                // 3. 创建StudioDataManager，使用纯API数据
                const dataManager = createStudioDataManagerFromAPI(fullModel, views);

                // 🛡️ 数据完整性验证
                const runtimeData = dataManager.runtimeData;
                const integrityReport = validateDataIntegrity(
                    fullModel,
                    runtimeData.model,
                    'configureExistingModel'
                );

                if (!integrityReport.isValid) {
                    console.error('数据完整性验证失败！', integrityReport);
                    throw new Error(`数据完整性验证失败：${integrityReport.errors.join(', ')}`);
                } else {
                    // 数据完整性验证通过
                }

                // 4. 创建原始快照（保留完全原始API数据结构）
                const originalSnapshot: ConfigSnapshot = {
                    model: { ...fullModel }, // 保留原始API数据
                    views: views.map((v) => ({ ...v })), // 保留原始API数据
                    timestamp: Date.now(),
                };

                return {
                    selectedModel: runtimeData.model, // UI使用运行时数据
                    modelViews: runtimeData.views, // UI使用运行时数据
                    selectedViewIndex: runtimeData.views.length > 0 ? 0 : -1,
                    isNewModel: false,
                    loading: false,
                    dataManager, // 数据管理器保证数据完整性
                    originalSnapshot, // 快照保留原始数据用于变更检测
                };
            } catch (error) {
                console.error('configureExistingModel 失败:', error);

                // 如果加载失败，使用简单模式
                const fallbackModel = {
                    ...model,
                    fields: model.fields || [],
                };

                return {
                    selectedModel: fallbackModel,
                    modelViews: [],
                    selectedViewIndex: -1,
                    isNewModel: false,
                    loading: false,
                    originalSnapshot: {
                        model: { ...fallbackModel },
                        views: [],
                        timestamp: Date.now(),
                    },
                    error: `加载模型失败: ${error}`,
                };
            }
        },
        [getModelViews, studioService]
    );

    // 处理数据模型选择
    const handleModelSelection = useCallback(
        async (mode: ModelSelectionMode, model?: IEntityModel) => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                if (mode === 'new') {
                    // 新建模型模式 - 使用提取的helper函数
                    const newConfiguration = createNewModelConfiguration();
                    setState((prev) => ({ ...prev, ...newConfiguration }));
                } else if (mode === 'existing' && model) {
                    // 选择已有模型模式 - 使用提取的helper函数
                    const existingConfiguration = await configureExistingModel(model);
                    setState((prev) => ({ ...prev, ...existingConfiguration }));
                }
            } catch {
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: `${WORKSPACE_CONFIGS.messages.errors.configModel}: 配置失败`,
                }));
            }

            // 确保关闭菜单状态
            setModelSelector((prev) => ({ ...prev, open: false }));
        },
        [createNewModelConfiguration, configureExistingModel]
    );

    // 处理模型配置变更 - 使用StudioDataManager替代直接状态修改
    const handleModelChange = useCallback((updatedExtendedModel: ExtendedEntityModel) => {
        const updatedModel = extendedToStudioModel(updatedExtendedModel);

        setState((prev) => {
            // 如果存在数据管理器，使用增量更新
            if (prev.dataManager) {
                // 关键：使用数据管理器的增量更新，保证数据完整性
                try {
                    // 区分模型级别变更和字段级别变更
                    const originalModel = prev.selectedModel;
                    const modelLevelChanges: Partial<IEntityModel> = {};

                    // 检查模型级别的变更（名称、标题、描述等）
                    ['name', 'title', 'description'].forEach((key) => {
                        const oldValue = (originalModel as any)?.[key];
                        const newValue = (updatedModel as any)[key];
                        if (oldValue !== newValue) {
                            (modelLevelChanges as any)[key] = newValue;
                        }
                    });

                    // 应用模型级别变更
                    if (Object.keys(modelLevelChanges).length > 0) {
                        prev.dataManager.updateModel(modelLevelChanges);
                    }

                    // 🔧 处理字段变更：比较字段数组的差异
                    const originalFields = originalModel?.fields || [];
                    const newFields = updatedModel.fields || [];

                    // 处理字段变更或新增
                    newFields.forEach((newField, index) => {
                        const originalField = originalFields[index];

                        if (!originalField) {
                            // 新增字段
                            prev.dataManager!.addField(newField);
                        } else if (
                            originalField.name !== newField.name ||
                            originalField.type !== newField.type ||
                            !areFieldsEffectivelyEqual(originalField, newField)
                        ) {
                            // 字段有变更
                            prev.dataManager!.updateField(newField.name, newField);
                        }
                    });

                    // 处理字段删除
                    if (originalFields.length > newFields.length) {
                        for (let i = newFields.length; i < originalFields.length; i++) {
                            prev.dataManager!.deleteField(originalFields[i].name);
                        }
                    }

                    // 获取最新的运行时数据用于UI显示
                    const runtimeData = prev.dataManager.runtimeData;

                    const newState = {
                        ...prev,
                        selectedModel: runtimeData.model,
                        // 如果模型名称变更，同时更新所有视图的modelName
                        modelViews: prev.modelViews.map((view) => ({
                            ...view,
                            modelName: runtimeData.model.name,
                        })),
                    };

                    return newState;
                } catch (error) {
                    console.error('handleModelChange - 数据管理器更新失败:', error);

                    // 如果数据管理器失败，退回到兼容模式
                    return {
                        ...prev,
                        selectedModel: updatedModel,
                        modelViews: prev.modelViews.map((view) => ({
                            ...view,
                            modelName: updatedModel.name,
                        })),
                    };
                }
            } else {
                // 向后兼容：如果没有数据管理器，使用原有逻辑
                return {
                    ...prev,
                    selectedModel: updatedModel,
                    modelViews: prev.modelViews.map((view) => ({
                        ...view,
                        modelName: updatedModel.name,
                    })),
                };
            }
        });
    }, []);

    // 🔧 视图配置变更 - 使用StudioDataManager增量更新
    const handleViewChange = useCallback((updatedView: IEntityView) => {
        setState((prev) => {
            // 如果存在数据管理器，使用增量更新
            if (prev.dataManager && updatedView.name) {
                try {
                    // 获取原始视图数据用于比较
                    const originalView = prev.modelViews[prev.selectedViewIndex];

                    // 智能比较：只有在视图真正发生变更时才更新
                    if (!areViewsEffectivelyEqual(originalView, updatedView)) {
                        prev.dataManager.updateView(updatedView.name, updatedView);
                    } else {
                        // 直接返回当前状态，不进行更新
                        return prev;
                    }

                    // 获取最新的运行时数据
                    const runtimeData = prev.dataManager.runtimeData;

                    return {
                        ...prev,
                        modelViews: runtimeData.views,
                    };
                } catch (error) {
                    console.error('handleViewChange - 数据管理器更新失败:', error);

                    // 如果数据管理器失败，退回到兼容模式
                    const newViews = [...prev.modelViews];
                    newViews[prev.selectedViewIndex] = updatedView;
                    return {
                        ...prev,
                        modelViews: newViews,
                    };
                }
            } else {
                // 向后兼容：使用原有逻辑
                const newViews = [...prev.modelViews];
                newViews[prev.selectedViewIndex] = updatedView;
                return {
                    ...prev,
                    modelViews: newViews,
                };
            }
        });
    }, []);

    // 添加新视图 - 使用StudioDataManager增量更新
    const handleAddView = useCallback(() => {
        if (!state.selectedModel) return;

        const newView = createNewViewForModel(state.selectedModel, state.modelViews.length);

        setState((prev) => ({
            ...prev,
            modelViews: [...prev.modelViews, newView],
            selectedViewIndex: prev.modelViews.length,
        }));
    }, [state.selectedModel, state.modelViews.length]);

    // 删除视图
    const handleDeleteView = useCallback(
        (viewIndex: number) => {
            if (!canDeleteView(state.modelViews.length)) return;

            setState((prev) => {
                const newViews = prev.modelViews.filter((_, index) => index !== viewIndex);
                return {
                    ...prev,
                    modelViews: newViews,
                    selectedViewIndex: Math.min(prev.selectedViewIndex, newViews.length - 1),
                };
            });
        },
        [state.modelViews.length]
    );

    // 保存配置 - 显示确认对话框
    const handleSave = useCallback(() => {
        if (!validateSaveConditions(state)) return;

        setState((prev) => ({
            ...prev,
            saveDialog: {
                open: true,
                loading: false,
            },
        }));
    }, [state]);

    // 确认保存 - 只提交实际变更，保证数据完整性
    const handleConfirmSave = useCallback(async () => {
        if (!validateSaveConditions(state)) return;

        setState((prev) => ({
            ...prev,
            saveDialog: {
                ...prev.saveDialog,
                loading: true,
            },
        }));

        try {
            let saveData;

            // 使用数据管理器提供的增量数据
            if (state.dataManager) {
                // 新架构：只提交实际变更的数据
                const dataManager = state.dataManager; // 提取到局部变量，帮助TypeScript类型推断
                const incrementalChanges = dataManager.exportChanges();

                // 检查是否有实际变更
                const hasChanges = dataManager.hasUnsavedChanges();
                if (!hasChanges) {
                    // 显示"无变更需要保存"的提示对话框
                    setState((prev) => ({
                        ...prev,
                        saveDialog: {
                            open: false,
                            loading: false,
                        },
                        saveResultDialog: {
                            open: true,
                            result: {
                                success: false,
                                message: '当前配置没有变更，无需保存',
                                error: '提示：只有在您修改了模型或视图配置后才需要保存',
                            },
                        },
                    }));
                    return;
                }

                // 构建增量保存数据
                const runtimeData = dataManager.runtimeData;

                // 🔧 清理模型数据：移除validation字段，只保留schemaSerialized
                const cleanedModel = {
                    ...runtimeData.model,
                    fields:
                        runtimeData.model.fields?.map((field) => {
                            const { ...cleanField } = field as any;
                            return cleanField; // 只保留schemaSerialized等字段
                        }) || [],
                };

                saveData = {
                    model: cleanedModel, // 使用清理后的模型
                    views: runtimeData.views,
                    // 🔑 关键：附带增量变更信息，供后端优化处理
                    _incrementalChanges: incrementalChanges,
                    _changesSummary: dataManager.getChangesSummary(),
                    _isIncremental: true,
                };
            } else {
                const cleanedCompatModel = {
                    ...state.selectedModel!,
                    fields:
                        state.selectedModel!.fields?.map((field) => {
                            const { ...cleanField } = field as any;
                            return cleanField;
                        }) || [],
                };

                saveData = {
                    model: cleanedCompatModel,
                    views: state.modelViews,
                    _isIncremental: false,
                };
            }

            // 使用新的StudioSaveService保存到主包API
            const studioSaveData: StudioSaveData = {
                model: saveData.model,
                views: saveData.views,
                _incrementalChanges: saveData._incrementalChanges,
                _changesSummary: saveData._changesSummary,
                _isIncremental: saveData._isIncremental,
            };

            // 验证保存数据
            const validation = studioSaveService.validateSaveData(studioSaveData);
            if (!validation.valid) {
                throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
            }

            // 调用新的保存服务
            const saveResult = await studioSaveService.save(studioSaveData);

            if (!saveResult.success) {
                throw new Error(saveResult.error || '保存失败');
            }

            // 🎯 显示保存成功对话框
            setState((prev) => ({
                ...prev,
                saveDialog: {
                    open: false,
                    loading: false,
                },
                saveResultDialog: {
                    open: true,
                    result: {
                        success: true,
                        message: saveResult.message,
                        savedData: saveResult.savedData,
                    },
                },
            }));

            if (onSave) {
                // 检测到外部回调，但暂时跳过以避免Studio关闭
            }

            // 保存成功后重置数据管理器状态（但不关闭对话框，让用户看到结果）
            if (state.dataManager) {
                const dataManager = state.dataManager;
                dataManager.resetChanges();
            }
        } catch (error) {
            console.error('保存失败:', error);

            // 🎯 显示保存失败对话框
            setState((prev) => ({
                ...prev,
                saveDialog: {
                    open: false,
                    loading: false,
                },
                saveResultDialog: {
                    open: true,
                    result: {
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    },
                },
            }));
        }
    }, [state, onSave]);

    // 取消保存确认
    const handleCancelSave = useCallback(() => {
        setState((prev) => ({
            ...prev,
            saveDialog: {
                open: false,
                loading: false,
            },
        }));
    }, []);

    // 模型选择器已集成到Menu组件中，不需要额外的状态管理

    // 当前选中的视图（缓存优化）
    const currentView = useMemo(
        () => state.modelViews[state.selectedViewIndex] || null,
        [state.modelViews, state.selectedViewIndex]
    );

    const handleTogglePreviewDrawer = useCallback(() => {
        setState((prev) => ({
            ...prev,
            previewDrawer: {
                open: !prev.previewDrawer.open,
            },
        }));
    }, []);

    const handleSelectView = useCallback((index: number) => {
        setState((prev) => ({ ...prev, selectedViewIndex: index }));
    }, []);

    // 处理保存结果对话框的关闭
    const handleSaveResultClose = useCallback(() => {
        setState((prev) => ({
            ...prev,
            saveResultDialog: {
                open: false,
                result: null,
            },
        }));
    }, []);

    // 处理保存成功后的数据重新加载（Studio内部刷新）
    const handleSaveResultReload = useCallback(async () => {
        if (!state.selectedModel) return;

        try {
            // 开始Studio内部数据刷新
            setState((prev) => ({ ...prev, loading: true }));

            // 🔧 重新从API加载最新的模型数据（而不是浏览器页面刷新）
            const refreshedConfiguration = await configureExistingModel(state.selectedModel!);

            // 重新加载可用模型列表
            await loadAvailableModels();

            // 更新状态以反映最新数据
            setState((prev) => ({
                ...prev,
                ...refreshedConfiguration,
                // 保持saveResultDialog打开，让用户知道刷新完成
                saveResultDialog: {
                    ...prev.saveResultDialog,
                    result: prev.saveResultDialog.result
                        ? {
                              ...prev.saveResultDialog.result,
                              message: `${prev.saveResultDialog.result.message}\n\n数据已刷新完成`,
                          }
                        : null,
                },
            }));

            // Studio内部数据刷新完成
        } catch (error) {
            console.error('[Workspace] Studio内部数据刷新失败:', error);
            setState((prev) => ({
                ...prev,
                loading: false,
                error: `重新加载失败: ${error}`,
                // 更新saveResultDialog显示刷新失败
                saveResultDialog: {
                    ...prev.saveResultDialog,
                    result: prev.saveResultDialog.result
                        ? {
                              ...prev.saveResultDialog.result,
                              message: `${prev.saveResultDialog.result.message}\n\n⚠️ 数据刷新失败: ${error}`,
                          }
                        : null,
                },
            }));
        }
    }, [state.selectedModel, configureExistingModel, loadAvailableModels]);

    // 🔧 为预览准备的模型数据：移除validation字段，只保留schemaSerialized
    const modelConfigForPreview = useMemo(() => {
        if (!state.selectedModel) return null;

        return {
            ...state.selectedModel,
            fields:
                state.selectedModel.fields?.map((field, index) => {
                    const { ...fieldWithoutValidation } = field as any;

                    return fieldWithoutValidation;
                }) || [],
        };
    }, [state.selectedModel]);

    // 预览配置对象（缓存优化） - 现在schemaSerialized是最新的，直接使用完整模型
    const previewModeConfig = useMemo(
        (): PreviewModeConfig => ({
            mode: state.isNewModel ? 'create' : 'edit',
            title: state.selectedModel?.title || '配置预览',
            modelName: state.selectedModel?.name || '',
            viewName: currentView?.name || '',
            description: '统一配置工作台预览',
        }),
        [state.isNewModel, state.selectedModel?.title, state.selectedModel?.name, currentView?.name]
    );

    // 变更检测结果（缓存优化）
    const changeSet = useMemo(() => {
        if (!state.originalSnapshot)
            return {
                model: [],
                views: [],
                summary: {
                    totalChanges: 0,
                    creates: 0,
                    updates: 0,
                    deletes: 0,
                    riskLevel: 'low' as const,
                },
            };

        // 创建当前配置快照
        const currentSnapshot: ConfigSnapshot = {
            model: state.selectedModel,
            views: state.modelViews,
            timestamp: Date.now(),
        };

        // 检测变更
        return changeDetector.detectChanges(state.originalSnapshot, currentSnapshot);
    }, [state.originalSnapshot, state.selectedModel, state.modelViews]);

    // 4.8 主渲染
    return (
        <Box
            style={{
                height: WORKSPACE_CONFIGS.ui.heights.fullHeight,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* 顶部工具栏 */}
            <Paper
                shadow="sm"
                style={{
                    zIndex: WORKSPACE_CONFIGS.ui.zIndex.toolbar,
                    position: 'relative',
                }}
            >
                <WorkspaceToolbar
                    state={state}
                    modelSelector={modelSelector}
                    onModelSelection={handleModelSelection}
                    onTogglePreviewDrawer={handleTogglePreviewDrawer}
                    onCancel={onCancel}
                    onSave={handleSave}
                />
            </Paper>

            {/* 主要内容区域 - 固定布局 */}
            <Box
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* 配置内容 - 固定二栏布局 */}
                {!state.selectedModel ? (
                    // 欢迎界面
                    <Container size="xl" style={{ height: '100%', display: 'flex' }}>
                        <WelcomeScreen
                            onSelectModel={() => {}}
                            modelSelector={modelSelector}
                            onModelSelection={handleModelSelection}
                        />
                    </Container>
                ) : (
                    // 固定二栏布局
                    <Container
                        fluid
                        p={getSpacing('container')}
                        style={{
                            height: '100%',
                            maxWidth: 'none',
                            backgroundColor: componentStyles.toolbar.background,
                            position: 'relative',
                        }}
                    >
                        {/* 预览抽屉 - 右侧覆盖显示 */}
                        {state.previewDrawer.open && (
                            <Box
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: '450px',
                                    height: '100%',
                                    backgroundColor: componentStyles.toolbar.background,
                                    borderLeft: `1px solid ${componentStyles.toolbar.border}`,
                                    boxShadow: '-2px 0 10px rgba(0,0,0,0.15)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    zIndex: 1000,
                                }}
                            >
                                {/* 抽屉头部 */}
                                <Box
                                    style={{
                                        padding: '16px',
                                        borderBottom: `1px solid ${componentStyles.toolbar.border}`,
                                        backgroundColor: componentStyles.toolbar.background,
                                        flexShrink: 0,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Group gap="xs">
                                        <Icon icon={getIcon('preview.open')} size={20} />
                                        <Text size="lg" fw={600} c={componentStyles.text.heading}>
                                            预览面板
                                        </Text>
                                    </Group>
                                    <ActionIcon
                                        onClick={handleTogglePreviewDrawer}
                                        variant="subtle"
                                        size="lg"
                                    >
                                        <Icon icon={getIcon('preview.close')} size={18} />
                                    </ActionIcon>
                                </Box>

                                {/* 抽屉内容 */}
                                <Box
                                    style={{
                                        flex: 1,
                                        minHeight: 0,
                                        overflow: 'hidden',
                                        backgroundColor:
                                            componentStyles.welcomeScreen.cardBackground,
                                    }}
                                >
                                    {state.selectedModel && currentView && modelConfigForPreview ? (
                                        <PreviewPanel
                                            modelConfig={modelConfigForPreview}
                                            viewConfig={currentView}
                                            modeConfig={previewModeConfig}
                                        />
                                    ) : (
                                        <Box
                                            p="md"
                                            style={{
                                                textAlign: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '100%',
                                            }}
                                        >
                                            <Icon
                                                icon={getIcon('preview.open')}
                                                size={48}
                                                style={{ color: componentStyles.text.muted }}
                                            />
                                            <Text
                                                size="lg"
                                                fw={600}
                                                mt="md"
                                                c={componentStyles.text.secondary}
                                            >
                                                预览不可用
                                            </Text>
                                            <Text
                                                size="sm"
                                                c={componentStyles.text.caption}
                                                mt="xs"
                                            >
                                                请先选择一个数据模型和视图配置
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        <Grid
                            gutter="md"
                            style={{
                                height: '100%',
                                overflow: 'hidden',
                                margin: 0,
                                width: '100%',
                                display: 'flex',
                            }}
                        >
                            {/* 左侧：数据模型配置面板 - 调整为5/12 (约42%) */}
                            <Grid.Col
                                span={5.5}
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <Paper
                                    shadow="md"
                                    style={{
                                        width: '100%',
                                        height: '100%', // 确保Paper填满Grid.Col
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        zIndex: WORKSPACE_CONFIGS.ui.zIndex.panel,
                                    }}
                                >
                                    <Box
                                        p={getSpacing('panel')}
                                        style={{
                                            backgroundColor: componentStyles.toolbar.background,
                                        }}
                                    >
                                        <Group gap={getSpacing('gap')}>
                                            <Text
                                                size="md"
                                                fw={600}
                                                c={componentStyles.text.heading}
                                            >
                                                数据模型配置
                                            </Text>
                                        </Group>
                                    </Box>
                                    <Box
                                        p={getSpacing('panel')}
                                        style={{
                                            flex: 1,
                                            overflow: 'auto',
                                            minHeight: 0, // 防止flex子项高度计算问题
                                        }}
                                    >
                                        <HierarchicalModelEditor
                                            config={(() => {
                                                const extendedModel = studioToExtendedModel(
                                                    state.selectedModel!
                                                );
                                                return extendedModel;
                                            })()}
                                            onChange={handleModelChange}
                                            onModeChange={() => {}}
                                            editMode="visual"
                                            allModels={studioToExtendedModels(
                                                modelSelector.availableModels
                                            )}
                                        />
                                    </Box>
                                </Paper>
                            </Grid.Col>

                            {/* 右侧：视图配置管理面板 - 调整为7/12 (约58%) */}
                            <Grid.Col
                                span={6.5}
                                style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <ViewManagementPanel
                                    state={state}
                                    onSelectView={handleSelectView}
                                    onAddView={handleAddView}
                                    onDeleteView={handleDeleteView}
                                    onViewChange={handleViewChange}
                                />
                            </Grid.Col>
                        </Grid>
                    </Container>
                )}
            </Box>

            {/* 错误提示 */}
            {state.error && (
                <Alert color="red" m="md">
                    {state.error}
                </Alert>
            )}

            {/* 加载状态 */}
            {state.loading && (
                <Box
                    style={{
                        ...getStyle('loadingOverlay'),
                        zIndex: WORKSPACE_CONFIGS.ui.zIndex.loading,
                    }}
                >
                    <Paper p={getSpacing('section')}>
                        <Group gap={getSpacing('panel')}>
                            <Loader size={24} />
                            <Text>{getMessage('loading.configuration')}</Text>
                        </Group>
                    </Paper>
                </Box>
            )}

            {/* 保存确认对话框 */}
            {state.originalSnapshot && (
                <SaveConfirmationDialog
                    open={state.saveDialog.open}
                    onClose={handleCancelSave}
                    onConfirm={handleConfirmSave}
                    changeSet={changeSet}
                    isNewModel={state.isNewModel}
                    loading={state.saveDialog.loading}
                />
            )}

            {/* 保存结果对话框 */}
            <SaveResultDialog
                open={state.saveResultDialog.open}
                onClose={handleSaveResultClose}
                result={state.saveResultDialog.result}
                onReload={handleSaveResultReload}
            />
        </Box>
    );
}

// ================================================================================
// 📤 SECTION 5: 导出声明
// ================================================================================

// 5.1 主要导出
export default UnifiedConfigurationWorkspace;
