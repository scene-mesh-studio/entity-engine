'use client';

import type { IEntityView, IEntityModel } from '../types/entities';

import { useMemo, useState, useCallback } from 'react';
import {
    Box,
    Text,
    Tabs,
    Paper,
    Badge,
    Button,
    Tooltip,
    Collapse,
    ActionIcon,
    ScrollArea,
    RingProgress,
} from '@mantine/core';

import { Icon } from '../utils/icon-mapping';
import { componentStyles } from '../utils/theme';
// ================================================================================
// 📦 SECTION 1: 导入和类型定义
// ================================================================================

// 简化的预览配置接口
export interface PreviewModeConfig {
    mode: 'create' | 'edit';
    title: string;
    modelName: string;
    viewName: string;
    description?: string;
}

export interface PreviewPanelProps {
    modelConfig: IEntityModel;
    viewConfig: IEntityView;
    modeConfig: PreviewModeConfig;
}

interface ValidationResults {
    errors: string[];
    warnings: string[];
    isValid: boolean;
}

interface ConfigCompleteness {
    completed: number;
    total: number;
    percentage: number;
    isComplete: boolean;
}

interface TabConfig {
    value: string;
    label: string;
    icon: string;
}

type PreviewTabType = 'model' | 'view';

// ================================================================================
// 🛠️ SECTION 2: 工具函数库
// ================================================================================

// 2.1 配置中心（统一管理所有配置常量）
const PREVIEW_CONFIGS = {
    ui: {
        heights: {
            header: '60px',
            tabBar: '48px',
            fullHeight: '100%',
        },
        spacing: {
            header: 3,
            content: 2,
            small: 1,
            medium: 2,
        },
        colors: {
            codeBackground: componentStyles.codePreview.background,
            progressBackground: componentStyles.treeNode.hoverBackground,
            borderColor: componentStyles.codePreview.border,
        },
        transitions: {
            progress: '0.3s ease',
            tabs: '0.2s ease',
        },
        styles: {
            codeBox: {
                height: 'calc(100% - 60px)',
                overflow: 'auto',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '14px',
                whiteSpace: 'pre-wrap',
            },
            progressBar: {
                width: '100%',
                height: 8,
                borderRadius: 1,
                overflow: 'hidden',
            },
            flexRow: {
                display: 'flex',
                alignItems: 'center',
            },
            flexRowSpaceBetween: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            },
            flexColumn: {
                display: 'flex',
                flexDirection: 'column',
            },
            fullContainer: {
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            },
            panelContainer: {
                height: '100%',
            },
            listStyle: {
                margin: 0,
                paddingLeft: 20,
            },
        },
    },

    icons: {
        model: 'solar:bed-bold',
        view: 'solar:list-bold',

        copy: 'solar:copy-bold',
    },

    tabs: [
        { value: 'model', label: '数据模型预览', icon: 'solar:bed-bold' },
        { value: 'view', label: '视图配置预览', icon: 'solar:list-bold' },
    ] as TabConfig[],

    messages: {
        title: '配置预览',
        completeness: '配置完整性',
        errors: {
            title: '配置错误（保存已禁用）：',
            modelName: '数据模型名称不能为空',
            modelTitle: '数据模型标题不能为空',
            viewName: '视图名称不能为空',
            viewTitle: '视图标题不能为空',
            viewModel: '视图必须关联一个数据模型',
            modelMismatch: '数据模型名称与视图关联的模型名称不一致',
            createMode: '新建模式下，模型和视图的名称、标题都是必填项',
        },
        warnings: {
            title: '配置建议：',
            noFields: '数据模型至少需要一个字段',
            noItems: '视图至少需要配置一个显示字段',
            fieldNotFound: (fieldName: string) => `视图字段 "${fieldName}" 在数据模型中不存在`,
        },
        success: {
            complete: '✅ 配置完整且验证通过，可以安全保存！',
            basicComplete: '✅ 配置基本完整，建议处理警告项后再保存',
        },
        labels: {
            copyCode: '复制代码',
        },
        chips: {
            mode: (mode: string) => `模式: ${mode === 'create' ? '新建' : '编辑'}`,
            model: (name: string) => `模型: ${name || '未配置'}`,
            view: (name: string, type: string) => `视图: ${name || '未配置'} (${type})`,
        },
    },

    validation: {
        totalChecks: 6,
        thresholds: {
            good: 100,
            warning: 50,
        },
    },
} as const;

// 2.2 代码生成工具
function generateModelCode(modelConfig: IEntityModel): string {
    try {
        return JSON.stringify(modelConfig, null, 2);
    } catch (_error) {
        return `// 模型配置生成失败: ${_error}`;
    }
}

function generateViewCode(viewConfig: IEntityView): string {
    try {
        return JSON.stringify(viewConfig, null, 2);
    } catch (_error) {
        return `// 视图配置生成失败: ${_error}`;
    }
}

// 2.3 配置验证工具
function validateConfiguration(
    modelConfig: IEntityModel,
    viewConfig: IEntityView,
    mode: string
): ValidationResults {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证数据模型
    if (!modelConfig.name || modelConfig.name.trim() === '') {
        errors.push(PREVIEW_CONFIGS.messages.errors.modelName);
    }
    if (!modelConfig.title || modelConfig.title.trim() === '') {
        errors.push(PREVIEW_CONFIGS.messages.errors.modelTitle);
    }
    if (!modelConfig.fields || modelConfig.fields.length === 0) {
        warnings.push(PREVIEW_CONFIGS.messages.warnings.noFields);
    }

    // 验证视图配置
    if (!viewConfig.name || viewConfig.name.trim() === '') {
        errors.push(PREVIEW_CONFIGS.messages.errors.viewName);
    }
    if (!viewConfig.title || viewConfig.title.trim() === '') {
        errors.push(PREVIEW_CONFIGS.messages.errors.viewTitle);
    }
    if (!viewConfig.modelName || viewConfig.modelName.trim() === '') {
        errors.push(PREVIEW_CONFIGS.messages.errors.viewModel);
    }

    // 验证模型和视图的一致性
    if (modelConfig.name && viewConfig.modelName && modelConfig.name !== viewConfig.modelName) {
        errors.push(PREVIEW_CONFIGS.messages.errors.modelMismatch);
    }

    // 验证视图字段引用
    if (viewConfig.items && viewConfig.items.length > 0) {
        viewConfig.items.forEach((item) => {
            // 确保 item.name 存在且为字符串
            if (item.name && typeof item.name === 'string') {
                const modelField = modelConfig.fields?.find((f) => f.name === item.name);
                if (!modelField && !item.name.startsWith('$$')) {
                    warnings.push(PREVIEW_CONFIGS.messages.warnings.fieldNotFound(item.name));
                }
            }
        });
    } else {
        warnings.push(PREVIEW_CONFIGS.messages.warnings.noItems);
    }

    // 新建模式特殊验证
    if (mode === 'create') {
        if (!modelConfig.name || !modelConfig.title || !viewConfig.name || !viewConfig.title) {
            errors.push(PREVIEW_CONFIGS.messages.errors.createMode);
        }
    }

    return { errors, warnings, isValid: errors.length === 0 };
}

// 2.4 配置完整性计算工具
function calculateCompleteness(
    modelConfig: IEntityModel,
    viewConfig: IEntityView,
    isValid: boolean
): ConfigCompleteness {
    const { totalChecks } = PREVIEW_CONFIGS.validation;
    let completedChecks = 0;

    if (modelConfig.name && modelConfig.name.trim() !== '') completedChecks++;
    if (modelConfig.title && modelConfig.title.trim() !== '') completedChecks++;
    if (viewConfig.name && viewConfig.name.trim() !== '') completedChecks++;
    if (viewConfig.title && viewConfig.title.trim() !== '') completedChecks++;
    if (viewConfig.modelName && viewConfig.modelName.trim() !== '') completedChecks++;
    if (viewConfig.items && viewConfig.items.length > 0) completedChecks++;

    return {
        completed: completedChecks,
        total: totalChecks,
        percentage: Math.round((completedChecks / totalChecks) * 100),
        isComplete: completedChecks === totalChecks && isValid,
    };
}

// 2.7 工具函数辅助器
function copyToClipboard(text: string) {
    return navigator.clipboard?.writeText(text);
}

// ================================================================================
// 🧩 SECTION 3: 小型辅助组件
// ================================================================================

// 3.2 验证详情组件（可展开显示）
interface ValidationDetailsProps {
    validation: ValidationResults;
}

function ValidationDetails({ validation }: ValidationDetailsProps) {
    return (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 🚨 错误列表 */}
            {validation.errors.length > 0 && (
                <Box
                    style={{
                        padding: 12,
                        backgroundColor: componentStyles.status.error.background,
                        border: `1px solid ${componentStyles.status.error.border}`,
                        borderRadius: 6,
                    }}
                >
                    <Box
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                        }}
                    >
                        <Icon
                            icon="solar:close-circle-bold"
                            size={16}
                            style={{ color: componentStyles.status.error.icon }}
                        />
                        <Text
                            size="sm"
                            fw={600}
                            style={{ color: componentStyles.status.error.text }}
                        >
                            配置错误 ({validation.errors.length} 项)
                        </Text>
                    </Box>
                    <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {validation.errors.map((error, index) => (
                            <Text
                                key={index}
                                size="xs"
                                style={{
                                    color: componentStyles.status.error.textSecondary,
                                    lineHeight: 1.4,
                                    paddingLeft: 16,
                                    position: 'relative',
                                }}
                            >
                                <span
                                    style={{
                                        position: 'absolute',
                                        left: 4,
                                        top: 0,
                                        color: componentStyles.status.error.textLight,
                                    }}
                                >
                                    •
                                </span>
                                {error}
                            </Text>
                        ))}
                    </Box>
                </Box>
            )}

            {/* ⚠️ 警告列表 */}
            {validation.warnings.length > 0 && (
                <Box
                    style={{
                        padding: 12,
                        backgroundColor: componentStyles.status.warning.background,
                        border: `1px solid ${componentStyles.status.warning.border}`,
                        borderRadius: 6,
                    }}
                >
                    <Box
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                        }}
                    >
                        <Icon
                            icon="solar:danger-triangle-bold"
                            size={16}
                            style={{ color: componentStyles.status.warning.icon }}
                        />
                        <Text
                            size="sm"
                            fw={600}
                            style={{ color: componentStyles.status.warning.text }}
                        >
                            优化建议 ({validation.warnings.length} 项)
                        </Text>
                    </Box>
                    <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {validation.warnings.map((warning, index) => (
                            <Text
                                key={index}
                                size="xs"
                                style={{
                                    color: componentStyles.status.warning.textSecondary,
                                    lineHeight: 1.4,
                                    paddingLeft: 16,
                                    position: 'relative',
                                }}
                            >
                                <span
                                    style={{
                                        position: 'absolute',
                                        left: 4,
                                        top: 0,
                                        color: componentStyles.status.warning.textLight,
                                    }}
                                >
                                    •
                                </span>
                                {warning}
                            </Text>
                        ))}
                    </Box>
                </Box>
            )}

            {/* 🎉 全部正常状态 */}
            {validation.errors.length === 0 && validation.warnings.length === 0 && (
                <Box
                    style={{
                        padding: 16,
                        backgroundColor: componentStyles.status.success.background,
                        border: `1px solid ${componentStyles.status.success.border}`,
                        borderRadius: 6,
                        textAlign: 'center',
                    }}
                >
                    <Icon
                        icon="solar:check-circle-bold"
                        size={24}
                        style={{
                            color: componentStyles.status.success.icon,
                            marginBottom: 8,
                        }}
                    />
                    <Text
                        size="sm"
                        fw={600}
                        style={{
                            color: componentStyles.status.success.text,
                            marginBottom: 4,
                        }}
                    >
                        配置完美无缺！
                    </Text>
                    <Text size="xs" style={{ color: componentStyles.treeNode.normalText }}>
                        所有配置项都已正确设置，可以安全保存
                    </Text>
                </Box>
            )}
        </Box>
    );
}

// 3.3 紧凑校验状态栏组件
interface CompactValidationBarProps {
    modelConfig: IEntityModel;
    viewConfig: IEntityView;
    modeConfig: PreviewModeConfig;
    validation: ValidationResults;
    completeness: ConfigCompleteness;
}

function CompactValidationBar({
    modelConfig,
    viewConfig,
    modeConfig,
    validation,
    completeness,
}: CompactValidationBarProps) {
    const [expanded, setExpanded] = useState(false);

    // 🎯 状态计算逻辑优化
    const overallStatus = useMemo(() => {
        if (validation.errors.length > 0) return 'error';
        if (validation.warnings.length > 0) return 'warning';
        return 'success';
    }, [validation.errors.length, validation.warnings.length]);

    // 🎨 主题色彩配置
    const statusConfig = useMemo(() => {
        switch (overallStatus) {
            case 'error':
                return {
                    bg: componentStyles.status.error.background,
                    border: componentStyles.status.error.border,
                    color: componentStyles.status.error.text,
                    icon: 'solar:close-circle-bold',
                    progressColor: componentStyles.status.error.progressColor,
                };
            case 'warning':
                return {
                    bg: componentStyles.status.warning.background,
                    border: componentStyles.status.warning.border,
                    color: componentStyles.status.warning.text,
                    icon: 'solar:danger-triangle-bold',
                    progressColor: componentStyles.status.warning.progressColor,
                };
            default:
                return {
                    bg: componentStyles.status.success.background,
                    border: componentStyles.status.success.border,
                    color: componentStyles.status.success.text,
                    icon: 'solar:check-circle-bold',
                    progressColor: componentStyles.status.success.progressColor,
                };
        }
    }, [overallStatus]);

    const statusText = useMemo(() => {
        if (validation.errors.length > 0) {
            return `发现 ${validation.errors.length} 个配置问题`;
        }
        if (validation.warnings.length > 0) {
            return `有 ${validation.warnings.length} 项建议优化`;
        }
        return '配置完整，可以保存';
    }, [validation.errors.length, validation.warnings.length]);

    // 动态进度环颜色
    const progressSections = useMemo(() => {
        const percentage = completeness.percentage;
        return [
            {
                value: percentage,
                color: statusConfig.progressColor,
            },
        ];
    }, [completeness.percentage, statusConfig.progressColor]);

    return (
        <Paper
            shadow="none"
            style={{
                border: `1px solid ${statusConfig.border}`,
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 0,
                transition: 'all 0.2s ease',
            }}
        >
            {/* 🎯 优化后的状态栏 */}
            <Box
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: statusConfig.bg,
                    minHeight: 64,
                    transition: 'background-color 0.2s ease',
                }}
            >
                {/* 左侧：专业进度环 */}
                <Box
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginRight: 16,
                    }}
                >
                    <RingProgress
                        size={40}
                        thickness={3}
                        sections={progressSections}
                        label={
                            <Text
                                size="xs"
                                fw={700}
                                ta="center"
                                style={{
                                    fontSize: '0.625rem',
                                    color: statusConfig.color,
                                }}
                            >
                                {completeness.percentage}%
                            </Text>
                        }
                    />
                </Box>

                {/* 中间：状态指示区 */}
                <Box
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flex: 1,
                    }}
                >
                    <Icon
                        icon={statusConfig.icon as any}
                        size={20}
                        style={{ color: statusConfig.color }}
                    />
                    <Box>
                        <Text
                            size="sm"
                            fw={600}
                            style={{
                                color: statusConfig.color,
                                lineHeight: 1.2,
                            }}
                        >
                            {statusText}
                        </Text>
                        {/* 配置摘要信息 */}
                        <Text
                            size="xs"
                            c={componentStyles.text.caption}
                            style={{
                                lineHeight: 1.2,
                                marginTop: 2,
                            }}
                        >
                            {modelConfig.name || '未命名模型'} · {viewConfig.viewType || 'form'}视图
                        </Text>
                    </Box>
                </Box>

                {/* 右侧：状态徽章 + 操作按钮 */}
                <Box
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    {/* 模式标识 */}
                    <Badge
                        size="sm"
                        variant="light"
                        color={modeConfig.mode === 'create' ? 'blue' : 'gray'}
                        style={{
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    >
                        {modeConfig.mode === 'create' ? '新建模式' : '编辑模式'}
                    </Badge>

                    {/* 详情展开按钮 */}
                    {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                        <Tooltip label={expanded ? '收起详细信息' : '查看详细信息'} position="left">
                            <ActionIcon
                                size="lg"
                                variant="subtle"
                                color={statusConfig.progressColor}
                                onClick={() => setExpanded(!expanded)}
                                style={{
                                    transition: 'transform 0.2s ease',
                                }}
                            >
                                <Icon
                                    icon={
                                        expanded
                                            ? 'solar:alt-arrow-up-bold'
                                            : 'solar:alt-arrow-down-bold'
                                    }
                                    size={16}
                                    style={{
                                        transform: expanded ? 'rotate(0deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease',
                                    }}
                                />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* 展开的详细信息区域 */}
            <Collapse in={expanded}>
                <Box
                    style={{
                        padding: '16px 20px',
                        borderTop: `1px solid ${statusConfig.border}`,
                    }}
                >
                    <ValidationDetails validation={validation} />
                </Box>
            </Collapse>
        </Paper>
    );
}

// 3.4 预览头部组件
interface PreviewHeaderProps {
    modelConfig: IEntityModel;
    viewConfig: IEntityView;
    modeConfig: PreviewModeConfig;
    validation: ValidationResults;
    completeness: ConfigCompleteness;
}

function PreviewHeader({
    modelConfig,
    viewConfig,
    modeConfig,
    validation,
    completeness,
}: PreviewHeaderProps) {
    return (
        <Box
            style={{
                padding: '16px 16px 12px 16px',
                borderBottom: `1px solid ${componentStyles.toolbar.border}`,
            }}
        >
            {/* 🎯 智能校验状态栏 */}
            <CompactValidationBar
                modelConfig={modelConfig}
                viewConfig={viewConfig}
                modeConfig={modeConfig}
                validation={validation}
                completeness={completeness}
            />
        </Box>
    );
}

// 3.5 代码预览面板组件
interface CodePreviewPanelProps {
    title: string;
    code: string;
}

function CodePreviewPanel({ title, code }: CodePreviewPanelProps) {
    return (
        <Box
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: 16,
                minHeight: 0,
            }}
        >
            <Paper
                shadow="none"
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${componentStyles.codePreview.border}`,
                    minHeight: 0,
                }}
            >
                <Box
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        borderBottom: `1px solid ${componentStyles.codePreview.border}`,
                        flexShrink: 0,
                    }}
                >
                    <Text size="sm" fw={600} c={componentStyles.text.caption}>
                        {title}
                    </Text>
                    <Button
                        size="sm"
                        variant="outline"
                        leftSection={<Icon icon="solar:copy-bold" />}
                        onClick={() => copyToClipboard(code)}
                        style={{ paddingLeft: 12, paddingRight: 12 }}
                    >
                        复制代码
                    </Button>
                </Box>
                <ScrollArea
                    style={{
                        flex: 1,
                        minHeight: 0,
                    }}
                    scrollbarSize={8}
                    scrollHideDelay={500}
                >
                    <Box
                        style={{
                            padding: 16,
                            backgroundColor: componentStyles.codePreview.background,
                            color: componentStyles.codePreview.text,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.5,
                            minHeight: 'max-content',
                        }}
                    >
                        {code}
                    </Box>
                </ScrollArea>
            </Paper>
        </Box>
    );
}

// ================================================================================
// 🎯 SECTION 4: 主编辑器组件
// ================================================================================

// 4.1 预览面板主组件
export function PreviewPanel({ modelConfig, viewConfig, modeConfig }: PreviewPanelProps) {
    // 4.2 状态管理
    const [activeTab, setActiveTab] = useState<PreviewTabType>('view');

    // 4.3 数据计算（缓存优化）

    // 生成代码预览（缓存优化）
    const modelCodePreview = useMemo(() => generateModelCode(modelConfig), [modelConfig]);

    const viewCodePreview = useMemo(() => generateViewCode(viewConfig), [viewConfig]);

    // 配置验证结果（缓存优化）
    const validationResults = useMemo(
        () => validateConfiguration(modelConfig, viewConfig, modeConfig.mode),
        [modelConfig, viewConfig, modeConfig.mode]
    );

    // 配置完整性计算（缓存优化）
    const configCompleteness = useMemo(
        () => calculateCompleteness(modelConfig, viewConfig, validationResults.isValid),
        [modelConfig, viewConfig, validationResults.isValid]
    );

    // 选项卡配置映射（缓存优化）
    const tabContentMap = useMemo(
        () => ({
            model: { title: '数据模型配置代码', code: modelCodePreview },
            view: { title: '视图配置代码', code: viewCodePreview },
        }),
        [modelCodePreview, viewCodePreview]
    );

    // 4.4 事件处理（性能优化）
    const handleTabChange = useCallback((newValue: string | null) => {
        if (newValue && (newValue === 'model' || newValue === 'view')) {
            setActiveTab(newValue as PreviewTabType);
        }
    }, []);

    // 4.5 主渲染（性能优化）
    return (
        <Box
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* 头部信息 */}
            <PreviewHeader
                modelConfig={modelConfig}
                viewConfig={viewConfig}
                modeConfig={modeConfig}
                validation={validationResults}
                completeness={configCompleteness}
            />

            {/* 选项卡导航 */}
            <Box
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    borderBottom: `1px solid ${componentStyles.toolbar.border}`,
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Tabs.List grow>
                        {PREVIEW_CONFIGS.tabs.map((tab) => (
                            <Tabs.Tab
                                key={tab.value}
                                value={tab.value}
                                leftSection={<Icon icon={tab.icon as any} size={18} />}
                                style={{
                                    textTransform: 'none',
                                    minHeight: 48,
                                    fontWeight: 500,
                                }}
                            >
                                {tab.label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {/* 预览内容 */}
                    {PREVIEW_CONFIGS.tabs.map((tab) => (
                        <Tabs.Panel
                            key={tab.value}
                            value={tab.value}
                            style={{
                                flex: 1,
                                overflow: 'hidden',
                                minHeight: 0,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <CodePreviewPanel
                                title={tabContentMap[tab.value as PreviewTabType].title}
                                code={tabContentMap[tab.value as PreviewTabType].code}
                            />
                        </Tabs.Panel>
                    ))}
                </Tabs>
            </Box>
        </Box>
    );
}

// ================================================================================
// 📤 SECTION 5: 导出声明
// ================================================================================

// 5.1 主要导出
export default PreviewPanel;
