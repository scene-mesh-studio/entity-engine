'use client';

import type { ChangeSet, ChangeItem } from '../services/change-detector';

import React, { useMemo, useState, useCallback } from 'react';
import {
    Box,
    Text,
    Chip,
    List,
    Modal,
    Title,
    Alert,
    Paper,
    Stack,
    Button,
    Collapse,
    Accordion,
    ActionIcon,
} from '@mantine/core';

import { Icon } from '../utils/icon-mapping';
import { componentStyles } from '../utils/theme';

// ================================================================================
// 📦 SECTION 1: 类型定义和配置
// ================================================================================

export interface SaveConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    changeSet: ChangeSet;
    isNewModel: boolean;
    loading?: boolean;
}

// 提取样式常量，避免内联样式重复计算
const STYLED_CONSTANTS = {
    changeSummaryCard: {
        backgroundColor: componentStyles.welcomeScreen.cardBackground,
        padding: 24,
        marginBottom: 24,
    },

    changeTypeChip: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '4px',
    },

    changeItemContainer: {
        flexDirection: 'column' as const,
        alignItems: 'stretch' as const,
        padding: 0,
        border: `1px solid ${componentStyles.toolbar.border}`,
        borderRadius: '4px',
        marginBottom: '8px',
        overflow: 'hidden' as const,
    },

    changeItemHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        cursor: 'pointer' as const,
    },

    propertyChangeCard: {
        backgroundColor: componentStyles.welcomeScreen.cardBackground,
        padding: 12,
    },

    valueDisplay: {
        padding: '4px 8px',
        borderRadius: '4px',
        marginTop: '2px',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
    },

    modalFooter: {
        padding: 24,
        borderTop: `1px solid ${componentStyles.toolbar.border}`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
    },

    spinAnimation: {
        animation: 'spin 1s linear infinite',
    },
} as const;

// 变更类型配置
const CHANGE_TYPE_CONFIG = {
    CREATE: {
        icon: 'solar:add-circle-bold',
        color: 'success',
        label: '新增',
        bgColor: 'success.50',
        textColor: 'success.main',
    },
    UPDATE: {
        icon: 'solar:pen-bold',
        color: 'warning',
        label: '修改',
        bgColor: 'warning.50',
        textColor: 'warning.main',
    },
    DELETE: {
        icon: 'solar:trash-bin-trash-bold',
        color: 'error',
        label: '删除',
        bgColor: 'error.50',
        textColor: 'error.main',
    },
} as const;

// 风险级别配置
const RISK_LEVEL_CONFIG = {
    low: {
        color: 'success',
        label: '低风险',
        icon: 'solar:check-circle-bold',
    },
    medium: {
        color: 'warning',
        label: '中等风险',
        icon: 'solar:danger-triangle-bold',
    },
    high: {
        color: 'error',
        label: '高风险',
        icon: 'solar:close-circle-bold',
    },
} as const;

// 分类配置
const CATEGORY_CONFIG = {
    model: {
        label: '数据模型',
        icon: 'solar:bed-bold',
        color: 'primary',
    },
    view: {
        label: '视图配置',
        icon: 'solar:widget-bold',
        color: 'secondary',
    },
} as const;

// ================================================================================
// 🧩 SECTION 2: 子组件
// ================================================================================

interface ChangeSummaryProps {
    changeSet: ChangeSet;
    isNewModel: boolean;
}

const ChangeSummary = React.memo(function ChangeSummary({
    changeSet,
    isNewModel,
}: ChangeSummaryProps) {
    const { summary } = changeSet;
    const riskConfig = RISK_LEVEL_CONFIG[summary.riskLevel];

    // 预计算风险级别样式
    const riskChipStyle = useMemo(
        () => ({
            ...STYLED_CONSTANTS.changeTypeChip,
            backgroundColor:
                riskConfig.color === 'success'
                    ? componentStyles.chip.success.backgroundColor
                    : riskConfig.color === 'warning'
                      ? componentStyles.chip.warning.backgroundColor
                      : componentStyles.chip.error.backgroundColor,
        }),
        [riskConfig.color]
    );

    const riskTextColor = useMemo(
        () =>
            riskConfig.color === 'success'
                ? componentStyles.chip.success.color
                : riskConfig.color === 'warning'
                  ? componentStyles.chip.warning.color
                  : componentStyles.chip.error.color,
        [riskConfig.color]
    );

    return (
        <Paper style={STYLED_CONSTANTS.changeSummaryCard}>
            <Stack gap={16}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon icon={'solar:chart-bold' as any} size={24} />
                    <Title order={6} fw={600}>
                        {isNewModel ? '新建配置摘要' : '配置变更摘要'}
                    </Title>
                </Box>

                <Box
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
                >
                    <Box
                        style={{
                            ...STYLED_CONSTANTS.changeTypeChip,
                            border: `1px solid ${componentStyles.toolbar.border}`,
                        }}
                    >
                        <Icon icon={'solar:checklist-bold' as any} size={14} />
                        <Text
                            size="sm"
                            fw={500}
                            style={{ color: componentStyles.treeNode.normalText }}
                        >{`总计 ${summary.totalChanges} 项变更`}</Text>
                    </Box>

                    {summary.creates > 0 && (
                        <Box
                            style={{
                                ...STYLED_CONSTANTS.changeTypeChip,
                                border: `1px solid ${componentStyles.alert.success.borderColor}`,
                                backgroundColor: componentStyles.alert.success.backgroundColor,
                            }}
                        >
                            <Icon
                                icon={CHANGE_TYPE_CONFIG.CREATE.icon}
                                size={14}
                                style={{ color: componentStyles.alert.success.color }}
                            />
                            <Text
                                size="sm"
                                style={{ color: componentStyles.alert.success.color }}
                            >{`新增 ${summary.creates} 项`}</Text>
                        </Box>
                    )}

                    {summary.updates > 0 && (
                        <Box
                            style={{
                                ...STYLED_CONSTANTS.changeTypeChip,
                                border: `1px solid ${componentStyles.alert.warning.borderColor}`,
                                backgroundColor: componentStyles.alert.warning.backgroundColor,
                            }}
                        >
                            <Icon
                                icon={CHANGE_TYPE_CONFIG.UPDATE.icon}
                                size={14}
                                style={{ color: componentStyles.alert.warning.color }}
                            />
                            <Text
                                size="sm"
                                style={{ color: componentStyles.alert.warning.color }}
                            >{`修改 ${summary.updates} 项`}</Text>
                        </Box>
                    )}

                    {summary.deletes > 0 && (
                        <Box
                            style={{
                                ...STYLED_CONSTANTS.changeTypeChip,
                                border: `1px solid ${componentStyles.alert.error.borderColor}`,
                                backgroundColor: componentStyles.alert.error.backgroundColor,
                            }}
                        >
                            <Icon
                                icon={CHANGE_TYPE_CONFIG.DELETE.icon}
                                size={14}
                                style={{ color: componentStyles.alert.error.color }}
                            />
                            <Text
                                size="sm"
                                style={{ color: componentStyles.alert.error.color }}
                            >{`删除 ${summary.deletes} 项`}</Text>
                        </Box>
                    )}

                    <Box style={riskChipStyle}>
                        <Icon icon={riskConfig.icon} size={14} style={{ color: riskTextColor }} />
                        <Text size="sm" style={{ color: riskTextColor }}>
                            {riskConfig.label}
                        </Text>
                    </Box>
                </Box>
            </Stack>
        </Paper>
    );
});

interface ChangeItemComponentProps {
    change: ChangeItem;
    expanded: boolean;
    onToggle: () => void;
}

const ChangeItemComponent = React.memo(function ChangeItemComponent({
    change,
    expanded,
    onToggle,
}: ChangeItemComponentProps) {
    const typeConfig = CHANGE_TYPE_CONFIG[change.type];

    // 预计算风险级别样式
    const riskChipStyle = useMemo(() => {
        if (!change.riskLevel || change.riskLevel === 'low') return null;
        return {
            color:
                change.riskLevel === 'high'
                    ? componentStyles.chip.error.color
                    : componentStyles.chip.warning.color,
            borderColor:
                change.riskLevel === 'high'
                    ? componentStyles.chip.error.borderColor
                    : componentStyles.chip.warning.borderColor,
        };
    }, [change.riskLevel]);

    // 预计算值显示样式
    const oldValueStyle = useMemo(
        () => ({
            ...STYLED_CONSTANTS.valueDisplay,
            backgroundColor: componentStyles.alert.error.backgroundColor,
        }),
        []
    );

    const newValueStyle = useMemo(
        () => ({
            ...STYLED_CONSTANTS.valueDisplay,
            backgroundColor: componentStyles.alert.success.backgroundColor,
        }),
        []
    );

    return (
        <Box style={STYLED_CONSTANTS.changeItemContainer}>
            {/* 主要信息行 */}
            <Box style={STYLED_CONSTANTS.changeItemHeader} onClick={onToggle}>
                <Box style={{ minWidth: '36px' }}>
                    <Icon
                        icon={typeConfig.icon}
                        width={20}
                        style={{ color: typeConfig.textColor }}
                    />
                </Box>

                <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500} c={componentStyles.text.subtitle}>
                        {change.description}
                    </Text>
                    <Text size="xs" c={componentStyles.text.caption}>
                        {change.path}
                    </Text>
                    {/* 显示属性变更数量（如果是聚合变更） */}
                    {change.propertyChanges && change.propertyChanges.length > 1 && (
                        <Text size="xs" mt={2} style={{ color: componentStyles.alert.info.color }}>
                            包含 {change.propertyChanges.length} 个属性变更
                        </Text>
                    )}
                </Box>

                <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {riskChipStyle && (
                        <Chip size="sm" variant="outline" style={riskChipStyle}>
                            {RISK_LEVEL_CONFIG[change.riskLevel!].label}
                        </Chip>
                    )}

                    <ActionIcon
                        size="sm"
                        variant="subtle"
                        style={{ color: componentStyles.text.caption }}
                    >
                        <Icon
                            icon={
                                expanded
                                    ? ('solar:alt-arrow-up-bold' as any)
                                    : ('solar:alt-arrow-down-bold' as any)
                            }
                            width={16}
                        />
                    </ActionIcon>
                </Box>
            </Box>

            {/* 详细信息 */}
            <Collapse in={expanded}>
                <Box
                    style={{
                        padding: '16px',
                        borderTop: `1px solid ${componentStyles.toolbar.border}`,
                    }}
                >
                    <Stack gap={16}>
                        {/* 属性变更详情（聚合模式） */}
                        {change.propertyChanges && change.propertyChanges.length > 0 ? (
                            <Box>
                                <Text size="sm" fw={600} mb={8} c={componentStyles.text.subtitle}>
                                    属性变更详情
                                </Text>

                                <Stack gap={8}>
                                    {change.propertyChanges.map((propChange, index) => (
                                        <Paper
                                            key={index}
                                            style={STYLED_CONSTANTS.propertyChangeCard}
                                        >
                                            <Text
                                                size="sm"
                                                fw={500}
                                                mb={4}
                                                c={componentStyles.text.subtitle}
                                            >
                                                {propChange.description}
                                            </Text>

                                            <Box
                                                style={{
                                                    display: 'flex',
                                                    gap: '12px',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {propChange.oldValue !== undefined && (
                                                    <Box style={{ flex: 1 }}>
                                                        <Text
                                                            size="xs"
                                                            fw={600}
                                                            style={{
                                                                color: componentStyles.alert.error
                                                                    .color,
                                                            }}
                                                        >
                                                            原值:
                                                        </Text>
                                                        <Text
                                                            size="xs"
                                                            c={componentStyles.text.caption}
                                                            style={oldValueStyle}
                                                        >
                                                            {typeof propChange.oldValue === 'object'
                                                                ? JSON.stringify(
                                                                      propChange.oldValue,
                                                                      null,
                                                                      2
                                                                  )
                                                                : String(propChange.oldValue)}
                                                        </Text>
                                                    </Box>
                                                )}

                                                {propChange.newValue !== undefined && (
                                                    <Box style={{ flex: 1 }}>
                                                        <Text
                                                            size="xs"
                                                            fw={600}
                                                            style={{
                                                                color: componentStyles.alert.success
                                                                    .color,
                                                            }}
                                                        >
                                                            新值:
                                                        </Text>
                                                        <Text
                                                            size="xs"
                                                            c={componentStyles.text.caption}
                                                            style={newValueStyle}
                                                        >
                                                            {typeof propChange.newValue === 'object'
                                                                ? JSON.stringify(
                                                                      propChange.newValue,
                                                                      null,
                                                                      2
                                                                  )
                                                                : String(propChange.newValue)}
                                                        </Text>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        ) : (
                            /* 传统变更详情（非聚合模式） */
                            (change.oldValue !== undefined || change.newValue !== undefined) && (
                                <Box>
                                    <Text
                                        size="sm"
                                        fw={600}
                                        mb={8}
                                        c={componentStyles.text.caption}
                                    >
                                        变更详情
                                    </Text>

                                    <Stack gap={8}>
                                        {change.oldValue !== undefined && (
                                            <Box>
                                                <Text
                                                    size="xs"
                                                    fw={600}
                                                    style={{
                                                        color: componentStyles.alert.error.color,
                                                    }}
                                                >
                                                    原值:
                                                </Text>
                                                <Paper
                                                    p={8}
                                                    mt={4}
                                                    style={{
                                                        backgroundColor:
                                                            componentStyles.alert.error
                                                                .backgroundColor,
                                                    }}
                                                >
                                                    <Text
                                                        size="xs"
                                                        ff="monospace"
                                                        c={componentStyles.text.caption}
                                                    >
                                                        {typeof change.oldValue === 'object'
                                                            ? JSON.stringify(
                                                                  change.oldValue,
                                                                  null,
                                                                  2
                                                              )
                                                            : String(change.oldValue)}
                                                    </Text>
                                                </Paper>
                                            </Box>
                                        )}

                                        {change.newValue !== undefined && (
                                            <Box>
                                                <Text
                                                    size="xs"
                                                    fw={600}
                                                    style={{
                                                        color: componentStyles.alert.success.color,
                                                    }}
                                                >
                                                    新值:
                                                </Text>
                                                <Paper
                                                    p={8}
                                                    mt={4}
                                                    style={{
                                                        backgroundColor:
                                                            componentStyles.alert.success
                                                                .backgroundColor,
                                                    }}
                                                >
                                                    <Text
                                                        size="xs"
                                                        ff="monospace"
                                                        c={componentStyles.text.caption}
                                                    >
                                                        {typeof change.newValue === 'object'
                                                            ? JSON.stringify(
                                                                  change.newValue,
                                                                  null,
                                                                  2
                                                              )
                                                            : String(change.newValue)}
                                                    </Text>
                                                </Paper>
                                            </Box>
                                        )}
                                    </Stack>
                                </Box>
                            )
                        )}

                        {/* 影响说明 */}
                        {change.impact && (
                            <Alert
                                variant="light"
                                style={{
                                    backgroundColor: componentStyles.alert.warning.backgroundColor,
                                    borderColor: componentStyles.alert.warning.borderColor,
                                    color: componentStyles.alert.warning.color,
                                }}
                            >
                                <Text size="sm" style={{ color: componentStyles.text.caption }}>
                                    <strong>影响说明:</strong> {change.impact}
                                </Text>
                            </Alert>
                        )}
                    </Stack>
                </Box>
            </Collapse>
        </Box>
    );
});

/**
 * 变更分类组件
 */
interface ChangeGroupProps {
    title: string;
    icon: string;
    changes: ChangeItem[];
    color: string;
}

const ChangeGroup = React.memo(function ChangeGroup({
    title,
    icon,
    changes,
    color,
}: ChangeGroupProps) {
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

    // 使用useCallback避免子组件不必要的重渲染
    const toggleExpanded = useCallback((index: number) => {
        setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    }, []);

    // 预计算计数芯片样式
    const countChipStyle = useMemo(
        () => ({
            color: componentStyles.text.caption,
            borderColor: componentStyles.toolbar.border,
            backgroundColor: 'transparent',
        }),
        []
    );

    if (changes.length === 0) return null;

    return (
        <Accordion defaultValue="0" mb={16}>
            <Accordion.Item value="0">
                <Accordion.Control>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon icon={icon as any} width={20} />
                        <Title order={6} fw={600}>
                            {title}
                        </Title>
                        <Chip size="sm" variant="outline" style={countChipStyle}>
                            {changes.length}
                        </Chip>
                    </Box>
                </Accordion.Control>

                <Accordion.Panel pt={0}>
                    <List p={0}>
                        {changes.map((change, index) => (
                            <ChangeItemComponent
                                key={index}
                                change={change}
                                expanded={expandedItems.has(index)}
                                onToggle={() => toggleExpanded(index)}
                            />
                        ))}
                    </List>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
});

// ================================================================================
// 🎯 SECTION 3: 主组件
// ================================================================================

export function SaveConfirmationDialog({
    open,
    onClose,
    onConfirm,
    changeSet,
    isNewModel,
    loading = false,
}: SaveConfirmationDialogProps) {
    // 计算风险提示
    const riskAlerts = useMemo(() => {
        const alerts: string[] = [];

        // 检查删除操作
        const hasDeletes = changeSet.summary.deletes > 0;
        if (hasDeletes) {
            alerts.push('包含删除操作，可能导致数据丢失或功能异常');
        }

        // 检查高风险变更
        const hasHighRisk = [...changeSet.model, ...changeSet.views].some(
            (c) => c.riskLevel === 'high'
        );
        if (hasHighRisk) {
            alerts.push('包含高风险变更，可能影响系统稳定性');
        }

        // 检查模型名称变更
        const hasModelNameChange = changeSet.model.some((c) => c.path === 'name');
        if (hasModelNameChange) {
            alerts.push('模型名称变更可能影响所有相关视图和数据引用');
        }

        return alerts;
    }, [changeSet]);

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Modal
            opened={open}
            onClose={onClose}
            size="lg"
            centered
            zIndex={2000}
            styles={{
                inner: {
                    zIndex: 2000,
                },
                overlay: {
                    zIndex: 1999,
                },
                content: {
                    maxHeight: '90vh',
                    overflowY: 'auto',
                },
            }}
        >
            <Modal.Header>
                <Modal.Title>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon icon={'solar:file-bold' as any} size={24} />
                        <Title order={4}>{isNewModel ? '确认新建配置' : '确认保存配置变更'}</Title>
                    </Box>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ padding: '1.5rem 1.5rem' }}>
                {/* 变更摘要 */}
                <ChangeSummary changeSet={changeSet} isNewModel={isNewModel} />

                {/* 风险提示 */}
                {riskAlerts.length > 0 && (
                    <Alert
                        variant="light"
                        mb={24}
                        style={{
                            backgroundColor: componentStyles.alert.warning.backgroundColor,
                            borderColor: componentStyles.alert.warning.borderColor,
                            color: componentStyles.alert.warning.color,
                        }}
                    >
                        <Text
                            size="sm"
                            fw={600}
                            mb={8}
                            style={{ color: componentStyles.text.caption }}
                        >
                            风险提示
                        </Text>
                        <Box component="ul" style={{ margin: 0, paddingLeft: '16px' }}>
                            {riskAlerts.map((alert, index) => (
                                <li key={index}>
                                    <Text size="sm" c={componentStyles.text.caption}>
                                        {alert}
                                    </Text>
                                </li>
                            ))}
                        </Box>
                    </Alert>
                )}

                {/* 变更分类列表 */}
                <Box>
                    {/* 数据模型变更 - 使用原有的ChangeGroup组件 */}
                    <ChangeGroup
                        title={CATEGORY_CONFIG.model.label}
                        icon={CATEGORY_CONFIG.model.icon}
                        changes={changeSet.model}
                        color={CATEGORY_CONFIG.model.color}
                    />

                    {/* 视图变更 - 使用相同的ChangeGroup组件保持显示一致 */}
                    <ChangeGroup
                        title={CATEGORY_CONFIG.view.label}
                        icon={CATEGORY_CONFIG.view.icon}
                        changes={changeSet.views}
                        color={CATEGORY_CONFIG.view.color}
                    />
                </Box>

                {/* 无变更提示 */}
                {changeSet.summary.totalChanges === 0 && (
                    <Box style={{ textAlign: 'center', padding: '32px 0' }}>
                        <Icon
                            icon="solar:check-circle-bold"
                            size={48}
                            style={{
                                color: componentStyles.alert.success.color,
                                marginBottom: '16px',
                            }}
                        />
                        <Title order={6} c={componentStyles.text.caption}>
                            没有检测到配置变更
                        </Title>
                        <Text size="sm" c={componentStyles.text.caption}>
                            当前配置与原始配置一致
                        </Text>
                    </Box>
                )}
            </Modal.Body>

            <Box style={STYLED_CONSTANTS.modalFooter}>
                <Button
                    onClick={onClose}
                    variant="outline"
                    disabled={loading}
                    leftSection={<Icon icon="solar:close-circle-bold" />}
                    style={{
                        color: componentStyles.button.secondary.color,
                        borderColor: componentStyles.button.secondary.borderColor,
                        backgroundColor: componentStyles.button.secondary.backgroundColor,
                    }}
                >
                    取消
                </Button>

                <Button
                    onClick={handleConfirm}
                    variant="filled"
                    disabled={loading || changeSet.summary.totalChanges === 0}
                    leftSection={
                        loading ? (
                            <Icon
                                icon={'solar:refresh-bold' as any}
                                style={STYLED_CONSTANTS.spinAnimation}
                            />
                        ) : (
                            <Icon icon="solar:check-circle-bold" />
                        )
                    }
                    style={{
                        backgroundColor: componentStyles.button.primary.backgroundColor,
                        color: componentStyles.button.primary.color,
                        border: 'none',
                    }}
                >
                    {loading ? '保存中...' : `确认保存 (${changeSet.summary.totalChanges}项变更)`}
                </Button>
            </Box>
        </Modal>
    );
}
