'use client';

import type { EditMode } from '../types/editor';
import type { EntityFieldType, ExtendedEntityField, ExtendedEntityModel } from '../types/entities';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    Box,
    Text,
    List,
    Chip,
    Card,
    Paper,
    Alert,
    Stack,
    Badge,
    Group,
    Modal,
    Button,
    Select,
    Switch,
    Tooltip,
    Textarea,
    TextInput,
    ActionIcon,
    ScrollArea,
} from '@mantine/core';

import { Icon } from '../utils/icon-mapping';
import { componentStyles } from '../utils/theme';
import { useStudioEngineOptional } from '../providers/studio-engine-provider';
import { type FieldTypeInfo, StudioEngineService } from '../services/studio-engine-service';
import { schemaValidationParser, type ValidationRuleType } from '../utils/schema-validation-parser';

// CSS样式常量
const TREE_NODE_STYLES = {
    CONTAINER_CLASS: 'tree-node-item',
    TEXT_CONTAINER_CLASS: 'text-container',
    PADDING_BASE: 20,
    PADDING_OFFSET: 8,
    MIN_HEIGHT: 36,
    BORDER_RADIUS: 4,
};

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

// 样式注入工具 - 避免重复注入
const injectTreeNodeStyles = (() => {
    let injected = false;
    return () => {
        if (typeof document !== 'undefined' && !injected) {
            const styleId = `${TREE_NODE_STYLES.CONTAINER_CLASS}-styles`;
            if (!document.querySelector(`#${styleId}`)) {
                const styleElement = document.createElement('style');
                styleElement.id = styleId;
                styleElement.textContent = treeNodeStyles;
                document.head.appendChild(styleElement);
                injected = true;
            }
        }
    };
})();

// 初始化时注入样式
injectTreeNodeStyles();

// UI配置常量 - 增强类型安全性
const UI_CONFIG = {
    FIELD_TYPE_INFO: {
        DEFAULT_ICON: 'mdi:text' as const,
        DEFAULT_COLOR: 'var(--mantine-color-blue-filled)' as const,
        DEFAULT_DESCRIPTION_TEMPLATE: (type: string) => `${type} field type`,
        SHORT_LABEL_TRANSFORM: (type: string) => type.charAt(0).toUpperCase(),
    },
    MODAL: {
        DEFAULT_HEIGHT: '80vh' as const,
        DROPDOWN_Z_INDEX: 1200 as const,
        SIZE_MEDIUM: 'md' as const,
    },
    TREE: {
        COMPACT_WIDTH: '0 0 200px' as const,
        SCROLL_BAR_SIZE: 8 as const,
    },
    GRID: {
        TWO_COLUMN: '1fr 1fr' as const,
        THREE_COLUMN: '1fr 1fr 1fr' as const,
        CONDITIONAL_TWO_COLUMN: (hasValue: boolean) => (hasValue ? '1fr 2fr' : '1fr'),
        MANTINE_SPACING: 'var(--mantine-spacing-md)' as const,
    },
    FIELD_GENERATION: {
        PREFIX: 'field_' as const,
        DEFAULT_TITLE: '新字段' as const,
        DEFAULT_TYPE: 'string' as const,
        DEFAULT_ORDER: 0 as const,
    },
    VALIDATION: {
        TIMEOUT_DELAY: 100 as const,
        ASYNC_UPDATE_DELAY: 0 as const,
    },
    LAYOUT: {
        LIST_MAX_HEIGHT: 400 as const,
        CODE_PREVIEW_MAX_HEIGHT: 300 as const,
        DEBUG_PANEL_MAX_HEIGHT: 150 as const,
        ICON_SIZE: {
            SMALL: 12 as const,
            MEDIUM: 16 as const,
            LARGE: 20 as const,
            EXTRA_LARGE: 24 as const,
        },
    },
} as const;

// 类型定义
export interface IEntityFieldValidation {
    type: string;
    value?: unknown;
    message?: string;
}

export interface HierarchicalModelEditorProps {
    config: ExtendedEntityModel;
    allModels?: ExtendedEntityModel[];
    onChange: (config: ExtendedEntityModel) => void;
    onModeChange: (mode: EditMode) => void;
    editMode?: EditMode;
}

export interface FieldSelectorDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (field: ExtendedEntityField) => void;
    modelConfig: ExtendedEntityModel;
    usedFieldNames: string[];
}

// ValidationRuleEditorProps interface removed - not used

// ExtendedEntityField类型已在types/entities.ts中定义
// 这里保留验证接口定义

// ================================================================================
// 📦 SECTION 1: 导入和类型定义
// ================================================================================

/**
 * 动态字段类型 Hook
 * @description 通过 EntityEngine API 动态获取字段类型信息
 * @returns 字段类型数据和相关工具函数
 */
function useFieldTypes() {
    const engine = useStudioEngineOptional();
    const [studioService, setStudioService] = useState<StudioEngineService | null>(null);
    const [fieldTypes, setFieldTypes] = useState<FieldTypeInfo[]>([]);
    const [loading, setLoading] = useState(false);

    // 初始化服务
    useEffect(() => {
        if (engine) {
            setStudioService(new StudioEngineService(engine));
        }
    }, [engine]);

    // 加载字段类型
    useEffect(() => {
        const loadFieldTypes = async () => {
            if (!studioService) return;

            setLoading(true);
            try {
                const typeNames = studioService.getAvailableFieldTypes();
                const types: FieldTypeInfo[] = typeNames.map((type) => ({
                    type,
                    title: type,
                    description: UI_CONFIG.FIELD_TYPE_INFO.DEFAULT_DESCRIPTION_TEMPLATE(type),
                    shortLabel: UI_CONFIG.FIELD_TYPE_INFO.SHORT_LABEL_TRANSFORM(type),
                    icon: UI_CONFIG.FIELD_TYPE_INFO.DEFAULT_ICON,
                    color: UI_CONFIG.FIELD_TYPE_INFO.DEFAULT_COLOR,
                }));

                setFieldTypes(types);
            } catch {
                setFieldTypes([]);
            } finally {
                setLoading(false);
            }
        };

        loadFieldTypes();
    }, [studioService]);

    // 工具函数
    const fieldTypeUtils = useMemo(
        () => ({
            getFieldTypeInfo: (fieldType: string): FieldTypeInfo | undefined =>
                fieldTypes.find((ft) => ft.type === fieldType),

            isRelationFieldType: (fieldType: string): boolean =>
                studioService?.isRelationFieldType(fieldType) ?? false,

            isOptionsFieldType: (fieldType: string): boolean =>
                studioService?.isOptionsFieldType(fieldType) ?? false,

            getDefaultWidgetForFieldType: (fieldType: string, viewType = 'form'): string => '', // 禁用自动推断，始终返回空字符串，确保与API数据一致
        }),
        [fieldTypes, studioService]
    );

    return {
        fieldTypes,
        loading,
        hasRealData: fieldTypes.length > 0,
        ...fieldTypeUtils,
    };
}

export interface HierarchicalModelEditorProps {
    config: ExtendedEntityModel;
    allModels?: ExtendedEntityModel[];
    onChange: (config: ExtendedEntityModel) => void;
    onModeChange: (mode: EditMode) => void;
    editMode?: EditMode;
}

export interface FieldSelectorDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (field: ExtendedEntityField) => void;
    modelConfig: ExtendedEntityModel;
    usedFieldNames: string[];
}

type ModelConfigNodeType = 'basic-info' | 'fields-config' | 'field-item';

interface ModelConfigTreeNode {
    id: string;
    type: ModelConfigNodeType;
    label: string;
    path: string;
    children?: ModelConfigTreeNode[];
    canAddChildren?: boolean;
}

// 工具函数
const createNewField = (order: number = UI_CONFIG.FIELD_GENERATION.DEFAULT_ORDER) => ({
    name: `${UI_CONFIG.FIELD_GENERATION.PREFIX}${Date.now()}`,
    title: UI_CONFIG.FIELD_GENERATION.DEFAULT_TITLE,
    type: UI_CONFIG.FIELD_GENERATION.DEFAULT_TYPE,
    order,
});

// ValidationRuleEditor - 校验规则编辑器
function ValidationRuleEditor({
    rules = [],
    field,
    schemaSerialized,
    onChange,
    onSchemaChange, // 恢复这个参数
}: {
    rules: IEntityFieldValidation[];
    field: ExtendedEntityField;
    schemaSerialized?: any;
    onChange: (rules: IEntityFieldValidation[]) => void;
    onSchemaChange?: (schema: any) => void;
}) {
    const [newRuleType, setNewRuleType] = useState<ValidationRuleType | ''>('');
    const [showSchemaPreview, setShowSchemaPreview] = useState(false);

    // 获取当前字段类型支持的校验规则
    const supportedValidations = useMemo(
        () => schemaValidationParser.getSupportedValidations(field.type as any),
        [field.type]
    );

    // 自动从 schemaSerialized 提取校验规则用于编辑显示
    const [schemaInitialized, setSchemaInitialized] = useState<string>('');
    const [isUpdatingFromSchema, setIsUpdatingFromSchema] = useState(false); // 防止循环更新
    const [lastGeneratedSchemaHash, setLastGeneratedSchemaHash] = useState<string>(''); // 防止重复更新schema

    useEffect(() => {
        // 当存在schemaSerialized时，自动提取规则用于编辑显示
        if (schemaSerialized && typeof schemaSerialized === 'object' && !isUpdatingFromSchema) {
            const schemaHash = JSON.stringify(schemaSerialized);

            // 避免重复提取相同的schema
            if (schemaHash !== schemaInitialized) {
                setIsUpdatingFromSchema(true);

                const extractedRules = schemaValidationParser.extractValidationRules(
                    schemaSerialized,
                    field.type as any
                );

                // 无论当前rules如何，都要用提取的规则替换，让用户看到API数据
                onChange(extractedRules);
                setSchemaInitialized(schemaHash);
                setLastGeneratedSchemaHash(schemaHash);
                // 延迟重置标记，避免立即触发schema更新
                setTimeout(() => {
                    setIsUpdatingFromSchema(false);
                }, 100);
            }
        } else if (schemaInitialized && !schemaSerialized) {
            // 如果schemaSerialized被清空，也要清空规则
            onChange([]);
            setSchemaInitialized('');
            setLastGeneratedSchemaHash('');
        }
    }, [
        schemaSerialized,
        field.type,
        field.name,
        onChange,
        schemaInitialized,
        isUpdatingFromSchema,
    ]);

    // 🔄 核心功能：validation规则实时转换为schemaSerialized
    const generatedSchema = useMemo(() => {
        if (rules.length > 0) {
            return schemaValidationParser.buildJsonSchema(rules, field.type as any);
        }
        // 如果没有规则，保持原始的schemaSerialized不变，不生成新的schema
        return null;
    }, [rules, field.type]);

    //用户编辑validation后，立即更新schemaSerialized字段 (带防护和hash比较)
    useEffect(() => {
        //只有在不是从schema更新rules时且生成了新schema时才更新schema
        if (onSchemaChange && generatedSchema && !isUpdatingFromSchema) {
            const newSchemaHash = JSON.stringify(generatedSchema);

            //防止重复更新相同的schema
            if (newSchemaHash !== lastGeneratedSchemaHash) {
                onSchemaChange(generatedSchema);
                setLastGeneratedSchemaHash(newSchemaHash);
            }
        }
    }, [
        generatedSchema,
        onSchemaChange,
        field.name,
        rules.length,
        isUpdatingFromSchema,
        lastGeneratedSchemaHash,
    ]);

    const handleAddRule = useCallback(() => {
        if (!newRuleType) return;

        // 生成默认的错误消息
        const defaultMessage = schemaValidationParser.generateDefaultMessage(newRuleType);
        const config = schemaValidationParser.getValidationConfig(newRuleType);

        const newRule: IEntityFieldValidation = {
            type: newRuleType,
            message: defaultMessage,
            // 对于需要值的规则类型，设置示例值
            value: config?.valueType !== 'none' ? config?.example : undefined,
        };

        onChange([...rules, newRule]);
        setNewRuleType('');
    }, [newRuleType, rules, onChange]);

    const handleUpdateRule = useCallback(
        (index: number, updates: Partial<IEntityFieldValidation>) => {
            const newRules = [...rules];
            const currentRule = newRules[index];
            const updatedRule = { ...currentRule, ...updates };

            // 如果值发生变化，自动生成新的错误消息（如果用户没有自定义消息）
            if (updates.value !== undefined && !updates.message) {
                updatedRule.message = schemaValidationParser.generateDefaultMessage(
                    currentRule.type,
                    updates.value
                );
            }

            newRules[index] = updatedRule;
            onChange(newRules);
        },
        [rules, onChange]
    );

    const handleDeleteRule = useCallback(
        (index: number) => {
            const newRules = rules.filter((_, i) => i !== index);
            onChange(newRules);
        },
        [rules, onChange]
    );

    const handleResetToDefault = useCallback(() => {
        onChange([]);
    }, [onChange]);

    if (supportedValidations.length === 0) {
        return (
            <Alert color="blue" variant="outlined" style={{ mt: 2 }}>
                当前字段类型 ({field.type}) 不支持额外的校验规则。
            </Alert>
        );
    }

    return (
        <Stack gap={3}>
            {/* 操作工具栏 */}
            <Card withBorder variant="light">
                <Card.Section p="md">
                    <Group justify="space-between" align="center">
                        <Group gap="xs">
                            <Icon icon="solar:settings-bold" size={16} />
                            <Text size="sm" fw={500} c={componentStyles.text.caption}>
                                校验规则工具
                            </Text>
                        </Group>
                        <Group gap="xs">
                            <Button
                                size="xs"
                                variant="light"
                                color="orange"
                                onClick={handleResetToDefault}
                                leftSection={<Icon icon="solar:restart-bold" size={14} />}
                                disabled={rules.length === 0}
                            >
                                重置规则
                            </Button>
                            <Button
                                size="xs"
                                variant={showSchemaPreview ? 'filled' : 'light'}
                                onClick={() => setShowSchemaPreview(!showSchemaPreview)}
                                leftSection={<Icon icon="solar:code-bold" size={14} />}
                            >
                                {showSchemaPreview ? '隐藏' : '预览'} Schema
                            </Button>
                        </Group>
                    </Group>
                </Card.Section>
            </Card>

            {/* 当前规则列表 */}
            {rules.length > 0 && (
                <Stack gap={2}>
                    {rules.map((rule, index) => {
                        const config = schemaValidationParser.getValidationConfig(rule.type);

                        return (
                            <Card key={index} withBorder>
                                <Card.Section p="md">
                                    <Stack gap={3}>
                                        <Group justify="space-between" align="center">
                                            <Group gap="xs">
                                                <Badge size="sm" variant="light" color="blue">
                                                    {config?.label || rule.type}
                                                </Badge>
                                                {config?.description && (
                                                    <Tooltip label={config.description}>
                                                        <Icon
                                                            icon="solar:info-circle-bold"
                                                            size={14}
                                                            style={{ opacity: 0.6 }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </Group>
                                            <ActionIcon
                                                size="sm"
                                                color="red"
                                                variant="light"
                                                onClick={() => handleDeleteRule(index)}
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" size={14} />
                                            </ActionIcon>
                                        </Group>

                                        <Box
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns:
                                                    config?.valueType !== 'none'
                                                        ? '1fr 2fr'
                                                        : '1fr',
                                                gap: 12,
                                            }}
                                        >
                                            {config?.valueType !== 'none' && (
                                                <TextInput
                                                    size="sm"
                                                    label="规则值"
                                                    type={
                                                        config?.valueType === 'number'
                                                            ? 'number'
                                                            : config?.valueType === 'date'
                                                              ? 'date'
                                                              : 'text'
                                                    }
                                                    value={(rule.value as string) || ''}
                                                    onChange={(e) =>
                                                        handleUpdateRule(index, {
                                                            value:
                                                                config?.valueType === 'number'
                                                                    ? Number(e.target.value)
                                                                    : e.target.value,
                                                        })
                                                    }
                                                    placeholder={config?.example}
                                                    error={
                                                        config &&
                                                        !schemaValidationParser.validateRuleValue(
                                                            rule.type,
                                                            rule.value
                                                        )
                                                            ? '值格式不正确'
                                                            : undefined
                                                    }
                                                />
                                            )}
                                            <TextInput
                                                size="sm"
                                                label="错误提示消息"
                                                value={rule.message || ''}
                                                onChange={(e) =>
                                                    handleUpdateRule(index, {
                                                        message: e.target.value,
                                                    })
                                                }
                                                placeholder={`默认: ${schemaValidationParser.generateDefaultMessage(rule.type, rule.value)}`}
                                            />
                                        </Box>
                                    </Stack>
                                </Card.Section>
                            </Card>
                        );
                    })}
                </Stack>
            )}

            {/* 添加新规则 */}
            <Card withBorder>
                <Card.Section p="md">
                    <Group gap="md" align="flex-end">
                        <Box style={{ flex: 1 }}>
                            <Select
                                label="添加校验规则"
                                placeholder="选择要添加的规则类型"
                                value={newRuleType}
                                onChange={(value) => setNewRuleType(value as ValidationRuleType)}
                                data={supportedValidations
                                    .filter(
                                        (config) =>
                                            !rules.some((rule) => rule.type === (config as any).key)
                                    )
                                    .map((config: any) => ({
                                        value: config.key,
                                        label: config.label,
                                        description: config.description,
                                    }))}
                                size="sm"
                                searchable
                                styles={{
                                    dropdown: { zIndex: 1200 },
                                }}
                            />
                        </Box>
                        <Button
                            onClick={handleAddRule}
                            disabled={!newRuleType}
                            leftSection={<Icon icon="solar:add-circle-bold" size={16} />}
                            size="sm"
                        >
                            添加规则
                        </Button>
                    </Group>

                    {supportedValidations.length > 0 && (
                        <Text size="xs" c={componentStyles.text.muted} mt="xs">
                            支持 {supportedValidations.length} 种校验规则类型
                        </Text>
                    )}
                </Card.Section>
            </Card>

            {/* Schema 预览 */}
            {showSchemaPreview && (
                <Card withBorder>
                    <Card.Section p="md">
                        <Stack gap="md">
                            <Group gap="xs">
                                <Icon icon="solar:code-bold" size={16} />
                                <Text fw={600} c={componentStyles.text.caption}>
                                    JSON Schema 预览
                                </Text>
                            </Group>

                            <Box
                                style={{
                                    backgroundColor: 'var(--mantine-color-gray-light)',
                                    border: '1px solid var(--mantine-color-gray-3)',
                                    borderRadius: 6,
                                    padding: 12,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    maxHeight: 300,
                                    overflow: 'auto',
                                }}
                            >
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(
                                        generatedSchema || schemaSerialized || {},
                                        null,
                                        2
                                    )}
                                </pre>
                            </Box>

                            {rules.length === 0 && (
                                <Text size="sm" c={componentStyles.text.muted} ta="center">
                                    添加校验规则后将在此显示对应的 JSON Schema
                                </Text>
                            )}
                        </Stack>
                    </Card.Section>
                </Card>
            )}
        </Stack>
    );
}

// FieldSelectorDialog - 字段选择对话框
function FieldSelectorDialog({
    open,
    onClose,
    onSelect,
    modelConfig,
    usedFieldNames,
}: FieldSelectorDialogProps) {
    // 使用动态字段类型数据
    const { getFieldTypeInfo } = useFieldTypes();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<EntityFieldType | 'all'>('all');

    // 获取可用字段（排除已使用的字段）
    const availableFields = useMemo(() => {
        if (!modelConfig?.fields) return [];

        return modelConfig.fields.filter((field) => !usedFieldNames.includes(field.name));
    }, [modelConfig?.fields, usedFieldNames]);

    // 过滤字段
    const filteredFields = useMemo(
        () =>
            availableFields.filter((field) => {
                // 搜索过滤
                const matchesSearch =
                    searchTerm === '' ||
                    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (field.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (field.description || '').toLowerCase().includes(searchTerm.toLowerCase());

                // 类型过滤
                const matchesType = selectedType === 'all' || field.type === selectedType;

                return matchesSearch && matchesType;
            }),
        [availableFields, searchTerm, selectedType]
    );

    // 获取可用的字段类型
    const availableFieldTypes = useMemo(() => {
        const types = new Set(availableFields.map((field) => field.type));
        return Array.from(types).sort();
    }, [availableFields]);

    // 处理字段选择
    const handleFieldSelect = useCallback(
        (field: any) => {
            onSelect(field as ExtendedEntityField);
            onClose();
            // 重置状态
            setSearchTerm('');
            setSelectedType('all');
        },
        [onSelect, onClose]
    );

    // 处理对话框关闭
    const handleClose = useCallback(() => {
        onClose();
        // 重置状态
        setSearchTerm('');
        setSelectedType('all');
    }, [onClose]);

    return (
        <Modal
            opened={open}
            onClose={handleClose}
            size="md"
            title={
                <Group gap="xs">
                    <Icon icon="solar:add-circle-bold" size={24} />
                    <Text size="lg" fw={600} c={componentStyles.text.heading}>
                        选择数据字段
                    </Text>
                </Group>
            }
            styles={{
                content: { height: UI_CONFIG.MODAL.DEFAULT_HEIGHT },
            }}
        >
            <Stack gap="md">
                {/* 搜索和过滤 */}
                <Box style={{ mb: 3, display: 'flex', gap: 2 }}>
                    <TextInput
                        placeholder="搜索字段名称、标题或描述..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="sm"
                        leftSection={<Icon icon={'solar:magnifer-bold' as any} size={20} />}
                    />

                    <Select
                        placeholder="字段类型"
                        value={selectedType}
                        onChange={(value) => setSelectedType(value as EntityFieldType | 'all')}
                        data={[
                            { value: 'all', label: '全部类型' },
                            ...availableFieldTypes.map((type) => ({
                                value: type,
                                label: getFieldTypeInfo(type)?.shortLabel || type,
                            })),
                        ]}
                        size="sm"
                        style={{ minWidth: 120 }}
                        styles={{
                            dropdown: {
                                zIndex: UI_CONFIG.MODAL.DROPDOWN_Z_INDEX,
                            },
                        }}
                    />
                </Box>

                {/* 统计信息 */}
                <Box style={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                        variant="outline"
                        size="sm"
                        style={{
                            color: componentStyles.chip.primary.color,
                            borderColor: componentStyles.chip.primary.borderColor,
                        }}
                    >
                        模型: {modelConfig?.title || modelConfig?.name || '未知'}
                    </Chip>
                    <Chip
                        variant="outline"
                        size="sm"
                        style={{
                            color: componentStyles.chip.success.color,
                            borderColor: componentStyles.chip.success.borderColor,
                        }}
                    >
                        {`可用字段: ${filteredFields.length}`}
                    </Chip>
                    <Chip
                        variant="outline"
                        size="sm"
                        style={{
                            color: componentStyles.chip.warning.color,
                            borderColor: componentStyles.chip.warning.borderColor,
                        }}
                    >
                        {`已使用: ${usedFieldNames.length}`}
                    </Chip>
                </Box>

                {/* 字段列表 */}
                {filteredFields.length === 0 ? (
                    <Alert
                        style={{
                            mt: 2,
                            color: componentStyles.alert.info.color,
                            backgroundColor: componentStyles.alert.info.backgroundColor,
                            borderColor: componentStyles.alert.info.borderColor,
                        }}
                    >
                        {availableFields.length === 0
                            ? '数据模型中没有可用的字段，请先配置数据模型。'
                            : '没有找到匹配的字段，请调整搜索条件或字段类型过滤。'}
                    </Alert>
                ) : (
                    <List style={{ maxHeight: '400px', overflow: 'auto' }}>
                        {filteredFields.map((field: any, index: any) => (
                            <Box
                                key={field.name}
                                onClick={() => handleFieldSelect(field)}
                                style={{
                                    border: '1px solid var(--mantine-color-default-border)',
                                    borderRadius: 4,
                                    marginBottom: 8,
                                    padding: 12,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'var(--mantine-color-primary-filled)',
                                    },
                                }}
                            >
                                <Group gap="md" align="flex-start">
                                    <Box style={{ minWidth: 40 }}>
                                        <Icon
                                            icon={
                                                getFieldTypeInfo(field.type)?.icon ||
                                                'solar:document-bold'
                                            }
                                            size={24}
                                        />
                                    </Box>

                                    <Box style={{ flex: 1 }}>
                                        <Group gap="xs" wrap="wrap">
                                            <Text
                                                size="sm"
                                                fw={600}
                                                c={componentStyles.text.caption}
                                            >
                                                {field.title || field.name}
                                            </Text>
                                            <Text size="xs" c={componentStyles.text.caption}>
                                                ({field.name})
                                            </Text>
                                            <Chip size="xs" variant="outline" color="gray">
                                                {getFieldTypeInfo(field.type)?.shortLabel ||
                                                    field.type}
                                            </Chip>
                                            {(field.isRequired || field.required) && (
                                                <Chip size="xs" color="red">
                                                    必填
                                                </Chip>
                                            )}
                                            {field.isPrimaryKey && (
                                                <Chip size="xs" color="orange">
                                                    主键
                                                </Chip>
                                            )}
                                        </Group>
                                        {field.description && (
                                            <Text size="xs" c={componentStyles.text.caption} mt={4}>
                                                {field.description}
                                            </Text>
                                        )}
                                    </Box>
                                </Group>
                            </Box>
                        ))}
                    </List>
                )}

                <Group justify="flex-end" mt="md">
                    <Button onClick={handleClose}>取消</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

// HierarchicalModelEditor - 主编辑器组件
export function HierarchicalModelEditor({
    config,
    allModels = [],
    onChange,
    onModeChange,
    editMode = 'visual',
}: HierarchicalModelEditorProps) {
    // 使用动态字段类型数据
    const {
        fieldTypes,
        loading: fieldTypesLoading,
        getFieldTypeInfo,
        isRelationFieldType,
        isOptionsFieldType,
    } = useFieldTypes();

    // 统一状态管理，减少重渲染
    const [editorState, setEditorState] = useState(() => ({
        selectedNodeId: 'basic-info',
        showFieldSelector: false,
    }));

    // 选择节点（添加验证）
    const selectNode = useCallback((nodeId: string) => {
        // 验证nodeId格式
        if (!nodeId || typeof nodeId !== 'string') {
            return;
        }

        setEditorState((prev) => ({
            ...prev,
            selectedNodeId: nodeId,
        }));
    }, []);

    // 缓存字段选择处理逻辑
    const handleFieldSelection = useCallback(
        (field: any) => {
            // 检查字段是否已存在
            const existingFieldIndex = config.fields?.findIndex((f: any) => f.name === field.name);

            if (existingFieldIndex !== undefined && existingFieldIndex >= 0) {
                // 如果字段已存在，选择该字段进行编辑
                selectNode(`field-${existingFieldIndex}`);
            } else {
                // 如果字段不存在，添加到模型中
                const newField: any = { ...field };
                // 确保添加 order 属性
                if (!newField.order) {
                    newField.order = config.fields?.length || 0;
                }

                onChange({
                    ...config,
                    fields: [...(config.fields || []), newField],
                } as any);

                // 选择新添加的字段
                const newIndex = config.fields?.length || 0;
                selectNode(`field-${newIndex}`);
            }
        },
        [config, onChange, selectNode]
    );

    // 缓存字段名称映射
    const usedFieldNames = useMemo(() => config.fields?.map((f) => f.name) || [], [config.fields]);

    // 动态字段类型选项
    const fieldTypeOptions = useMemo(() => {
        const options = fieldTypes.map((fieldType) => ({
            value: fieldType.type,
            label: fieldType.title,
            description: fieldType.description,
            icon: fieldType.icon,
            color: fieldType.color,
        }));

        return options;
    }, [fieldTypes]);

    // 预定义配置树结构
    const configTree: ModelConfigTreeNode[] = useMemo(
        () => [
            {
                id: 'basic-info',
                type: 'basic-info',
                label: '基础信息',
                path: 'basic-info',
            },
            {
                id: 'fields-config',
                type: 'fields-config',
                label: '字段配置',
                path: 'fields-config',
                canAddChildren: true,
                children:
                    config.fields?.map((field, index) => ({
                        id: `field-${index}`,
                        type: 'field-item',
                        label: field.title || field.name,
                        path: `fields-config.field-${index}`,
                    })) || [],
            },
        ],
        [config.fields]
    );

    // 获取当前选中的节点
    const selectedNode = useMemo(() => {
        const findNode = (nodes: ModelConfigTreeNode[]): ModelConfigTreeNode | null => {
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

    const renderTreeNode = useCallback(
        (node: ModelConfigTreeNode, level = 0) => {
            const isSelected = editorState.selectedNodeId === node.id;

            return (
                <Box key={node.id}>
                    <List.Item
                        component="div"
                        onClick={() => selectNode(node.id)}
                        className="tree-node-item"
                        style={{
                            paddingLeft: level * 20 + 8,
                            paddingTop: 8,
                            paddingBottom: 8,
                            cursor: 'pointer',
                            minHeight: 36,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            backgroundColor: isSelected
                                ? componentStyles.treeNode.selectedBackground
                                : componentStyles.treeNode.normalBackground,
                            borderRadius: 4,
                            transition: 'background-color 0.2s ease',
                        }}
                    >
                        {/* 文字容器 - 简化布局，确保垂直对齐 */}
                        <Box
                            className="text-container"
                            style={{
                                flex: 1,
                                marginLeft: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <Text
                                variant="body2"
                                fw={isSelected ? 600 : 500}
                                c={
                                    isSelected
                                        ? componentStyles.treeNode.selectedText
                                        : componentStyles.treeNode.normalText
                                }
                                style={{
                                    fontSize: '0.875rem',
                                    lineHeight: 1.4,
                                }}
                            >
                                {node.label}
                            </Text>
                        </Box>
                    </List.Item>

                    {/* 固定展开所有子节点 */}
                    {node.children && (
                        <List>
                            {node.children.map((child) => renderTreeNode(child, level + 1))}
                        </List>
                    )}
                </Box>
            );
        },
        [editorState.selectedNodeId, selectNode]
    );

    // 4.2 编辑器渲染函数

    // 基础信息编辑器
    const renderBasicInfoEditor = useCallback(
        () => (
            <Stack gap="md" p="lg">
                {/* 页面标题区域 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:database-bold" size={24} />
                            <Box>
                                <Text size="lg" fw={600} c={componentStyles.text.heading}>
                                    数据模型基础信息
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    配置数据模型的基本属性和元数据
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
                            {config.fields && config.fields.length > 0 && (
                                <Badge variant="light" color="blue">
                                    {config.fields.length} 个字段
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
                            <Text fw={600} c={componentStyles.text.subtitle}>
                                基础配置
                            </Text>
                        </Group>

                        <Stack gap="md">
                            <Box
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: UI_CONFIG.GRID.TWO_COLUMN,
                                    gap: 'var(--mantine-spacing-md)',
                                }}
                            >
                                <TextInput
                                    label="模型名称"
                                    value={config.name || ''}
                                    onChange={(e) => onChange({ ...config, name: e.target.value })}
                                    placeholder="例如：UserProfile"
                                    required
                                    description="模型的唯一标识符"
                                    leftSection={<Icon icon="solar:tag-bold" size={16} />}
                                />

                                <TextInput
                                    label="模型标题"
                                    value={config.title || ''}
                                    onChange={(e) => onChange({ ...config, title: e.target.value })}
                                    placeholder="例如：用户档案"
                                    required
                                    description="在界面上显示的标题"
                                    leftSection={<Icon icon="solar:text-bold" size={16} />}
                                />
                            </Box>

                            <Textarea
                                label="模型描述"
                                value={config.description || ''}
                                onChange={(e) =>
                                    onChange({ ...config, description: e.target.value })
                                }
                                placeholder="描述此数据模型的用途和包含的信息..."
                                rows={3}
                                description="模型的详细说明（可选）"
                            />
                        </Stack>
                    </Card.Section>
                </Card>

                {/* 配置指引 */}
                <Card withBorder variant="light">
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:info-circle-bold" size={20} />
                            <Text fw={600} c={componentStyles.text.subtitle}>
                                配置指引
                            </Text>
                        </Group>

                        <Stack gap="sm">
                            <Group gap="xs">
                                <Icon icon="solar:check-circle-bold" size={16} color="green" />
                                <Text size="sm" c={componentStyles.text.caption}>
                                    模型名称应使用 camelCase 格式，如 userProfile、productInfo
                                </Text>
                            </Group>
                            <Group gap="xs">
                                <Icon icon="solar:check-circle-bold" size={16} color="green" />
                                <Text size="sm" c={componentStyles.text.caption}>
                                    模型标题应简洁明了，便于用户理解
                                </Text>
                            </Group>
                            <Group gap="xs">
                                <Icon icon="solar:check-circle-bold" size={16} color="green" />
                                <Text size="sm" c={componentStyles.text.caption}>
                                    完成基础信息配置后，在左侧&ldquo;字段配置&rdquo;中添加具体字段
                                </Text>
                            </Group>
                        </Stack>
                    </Card.Section>
                </Card>
            </Stack>
        ),
        [config, onChange]
    );

    // 字段配置编辑器
    const renderFieldsConfigEditor = useCallback(
        () => (
            <Stack gap="md" p="lg">
                {/* 页面标题区域 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group gap="xs" mb="md">
                            <Icon icon="solar:layers-bold" size={24} />
                            <Box>
                                <Text size="lg" fw={600} c={componentStyles.text.heading}>
                                    字段配置管理
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    管理数据模型的字段结构和属性
                                </Text>
                            </Box>
                        </Group>

                        {/* 统计信息 */}
                        <Group gap="xs">
                            <Badge
                                variant="light"
                                color={config.fields && config.fields.length > 0 ? 'green' : 'gray'}
                                leftSection={<Icon icon="solar:list-bold" size={12} />}
                            >
                                {config.fields?.length || 0} 个字段
                            </Badge>
                            {config.fields && config.fields.length > 0 && (
                                <Badge variant="light" color="blue">
                                    {config.fields.filter((f: any) => f.isRequired).length} 个必填
                                </Badge>
                            )}
                        </Group>
                    </Card.Section>
                </Card>

                {/* 操作区域 */}
                <Card withBorder>
                    <Card.Section p="md">
                        <Group justify="space-between" align="center">
                            <Group gap="xs">
                                <Icon icon="solar:settings-bold" size={20} />
                                <Text fw={600} c={componentStyles.text.subtitle}>
                                    字段列表
                                </Text>
                            </Group>

                            <Group gap="xs">
                                <Button
                                    leftSection={<Icon icon="solar:add-circle-bold" size={16} />}
                                    onClick={() =>
                                        onChange({
                                            ...config,
                                            fields: [
                                                ...(config.fields || []),
                                                createNewField(config.fields?.length || 0),
                                            ],
                                        } as any)
                                    }
                                    size="sm"
                                >
                                    添加字段
                                </Button>
                            </Group>
                        </Group>
                    </Card.Section>
                </Card>

                {/* 字段列表区域 */}
                {!config.fields || config.fields.length === 0 ? (
                    <Card withBorder variant="light">
                        <Card.Section p="xl" style={{ textAlign: 'center' }}>
                            <Icon
                                icon="solar:database-bold"
                                size={48}
                                style={{
                                    color: componentStyles.text.muted,
                                    opacity: 0.5,
                                    marginBottom: 16,
                                }}
                            />
                            <Text size="lg" fw={500} mb="xs" c={componentStyles.text.secondary}>
                                暂无字段配置
                            </Text>
                            <Text size="sm" c={componentStyles.text.caption} mb="lg">
                                开始为您的数据模型添加字段来定义数据结构
                            </Text>
                            <Group justify="center" gap="xs" />
                        </Card.Section>
                    </Card>
                ) : (
                    <Stack gap="sm">
                        {config.fields.map((field: any, index: number) => (
                            <Card
                                key={`${field.name || 'unnamed'}-${index}-${field.type}`}
                                withBorder
                                style={{ cursor: 'pointer' }}
                                onClick={() => selectNode(`field-${index}`)}
                            >
                                <Card.Section p="md">
                                    <Group justify="space-between" align="center">
                                        <Group gap="md" align="center">
                                            <Icon
                                                icon={
                                                    getFieldTypeInfo(field.type)?.icon ||
                                                    'solar:document-bold'
                                                }
                                                size={20}
                                            />
                                            <Box>
                                                <Group gap="xs" align="center">
                                                    <Text
                                                        fw={600}
                                                        size="sm"
                                                        c={componentStyles.text.subtitle}
                                                    >
                                                        {field.title || field.name}
                                                    </Text>
                                                    <Badge
                                                        size="xs"
                                                        variant="light"
                                                        color={
                                                            getFieldTypeInfo(field.type)?.color ||
                                                            'gray'
                                                        }
                                                    >
                                                        {getFieldTypeInfo(field.type)?.shortLabel ||
                                                            field.type}
                                                    </Badge>
                                                    {field.isRequired && (
                                                        <Badge
                                                            size="xs"
                                                            variant="filled"
                                                            color="red"
                                                        >
                                                            必填
                                                        </Badge>
                                                    )}
                                                    {field.isPrimaryKey && (
                                                        <Badge
                                                            size="xs"
                                                            variant="filled"
                                                            color="blue"
                                                        >
                                                            主键
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Text size="xs" c={componentStyles.text.muted}>
                                                    {field.name}
                                                </Text>
                                            </Box>
                                        </Group>

                                        <Group gap="xs">
                                            <Tooltip label="编辑字段">
                                                <ActionIcon
                                                    size="sm"
                                                    variant="light"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selectNode(`field-${index}`);
                                                    }}
                                                >
                                                    <Icon icon="solar:pen-bold" size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="删除字段">
                                                <ActionIcon
                                                    size="sm"
                                                    variant="light"
                                                    color="red"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newFields = [
                                                            ...(config.fields || []),
                                                        ];
                                                        newFields.splice(index, 1);
                                                        onChange({ ...config, fields: newFields });
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
                {config.fields && config.fields.length > 0 && (
                    <Card withBorder variant="light">
                        <Card.Section p="md">
                            <Group gap="xs" mb="sm">
                                <Icon icon="solar:lightbulb-bold" size={20} />
                                <Text fw={600} c={componentStyles.text.subtitle}>
                                    配置提示
                                </Text>
                            </Group>
                            <Stack gap="xs">
                                <Text size="sm" c={componentStyles.text.caption}>
                                    • 点击字段卡片可进入详细编辑模式
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    • 建议为每个模型设置一个主键字段
                                </Text>
                                <Text size="sm" c={componentStyles.text.caption}>
                                    • 必填字段将在表单中显示红色星号标识
                                </Text>
                            </Stack>
                        </Card.Section>
                    </Card>
                )}
            </Stack>
        ),
        [config, onChange, selectNode, getFieldTypeInfo]
    );

    // 优化：预先计算字段编辑器状态
    const fieldEditorState = useMemo(() => {
        if (!selectedNode || selectedNode.type !== 'field-item') {
            return null;
        }

        if (!selectedNode.path || typeof selectedNode.path !== 'string') {
            return null;
        }

        const pathParts = selectedNode.path.split('.');

        if (pathParts.length !== 2 || !pathParts[1] || !pathParts[1].startsWith('field-')) {
            return null;
        }

        const fieldIndexStr = pathParts[1].split('-')[1];
        const fieldIndex = parseInt(fieldIndexStr);

        if (isNaN(fieldIndex) || fieldIndex < 0) {
            return null;
        }

        const field = config.fields?.[fieldIndex];

        if (!field) {
            return null;
        }

        return { fieldIndex, field };
    }, [selectedNode, config.fields]);

    // 字段更新函数（始终定义，避免条件性Hooks）
    const updateField = useCallback(
        (updates: any) => {
            if (!fieldEditorState) {
                return;
            }

            const { fieldIndex, field } = fieldEditorState;
            const newFields = [...(config.fields || [])];
            const updatedField = { ...field, ...updates };
            newFields[fieldIndex] = updatedField as any;

            const updatedConfig = { ...config, fields: newFields };
            onChange(updatedConfig as any);
        },
        [fieldEditorState, config, onChange]
    );

    // 稳定化校验规则更新回调，防止无限循环
    const handleValidationChange = useCallback(
        (rules: IEntityFieldValidation[]) => {
            // 防止相同数据的重复更新
            const currentRules = fieldEditorState?.field?.validation || [];

            // 深度比较检查是否真的有变化
            const rulesChanged =
                JSON.stringify(currentRules.sort((a, b) => a.type.localeCompare(b.type))) !==
                JSON.stringify(rules.sort((a, b) => a.type.localeCompare(b.type)));

            if (rulesChanged) {
                // 使用setTimeout确保状态更新在下一个事件循环中执行，避免同步更新冲突
                setTimeout(() => {
                    updateField({ validation: rules });
                }, 0);
            }
        },
        [updateField, fieldEditorState?.field?.validation]
    );

    //schemaSerialized回调 - 用于validation→schemaSerialized转换
    const handleSchemaChange = useCallback(
        (newSchema: any) => {
            updateField({ schemaSerialized: newSchema });
        },
        [updateField]
    );

    // 字段项编辑器
    const renderFieldItemEditor = useCallback(() => {
        if (!fieldEditorState) {
            return null;
        }

        const { field } = fieldEditorState;

        // 使用动态字段类型信息
        const fieldTypeInfo = getFieldTypeInfo(field.type);
        const fieldLabel = fieldTypeInfo?.title || field.type;

        return (
            <Box p="lg">
                <Stack gap={3}>
                    {/* 字段概览卡片 */}
                    <Card withBorder>
                        <Card.Section p="md">
                            <Group justify="space-between" align="flex-start">
                                <Box>
                                    <Group gap="xs" align="center">
                                        <Text size="lg" fw={600} c={componentStyles.text.caption}>
                                            {field.title || field.name || '未命名字段'}
                                        </Text>
                                        <Badge size="sm" variant="light" color="blue">
                                            {fieldLabel}
                                        </Badge>
                                        {(field as any).widget && (
                                            <Badge size="sm" variant="light" color="green">
                                                Widget: {(field as any).widget}
                                            </Badge>
                                        )}
                                    </Group>
                                    <Text size="sm" c={componentStyles.text.caption} mt={4}>
                                        字段名: {field.name} • 类型:{' '}
                                        {getFieldTypeInfo(field.type)?.title || field.type}
                                        {(field as any).widget &&
                                            ` • Widget: ${(field as any).widget}`}
                                    </Text>
                                    {field.description && (
                                        <Text size="sm" c={componentStyles.text.caption} mt={2}>
                                            {field.description}
                                        </Text>
                                    )}
                                </Box>
                                <Group gap="xs">
                                    {field.isRequired && (
                                        <Badge size="xs" color="red" variant="filled">
                                            必填
                                        </Badge>
                                    )}
                                    {field.isPrimaryKey && (
                                        <Badge size="xs" color="orange" variant="filled">
                                            主键
                                        </Badge>
                                    )}
                                    {field.isUnique && (
                                        <Badge size="xs" color="green" variant="filled">
                                            唯一
                                        </Badge>
                                    )}
                                </Group>
                            </Group>
                        </Card.Section>
                    </Card>

                    {/* 基础属性 */}
                    <Card withBorder>
                        <Card.Section p="md">
                            <Group gap="xs" mb={2}>
                                <Icon icon="solar:document-text-bold" size={20} />
                                <Text fw={600} c={componentStyles.text.caption}>
                                    基础属性
                                </Text>
                            </Group>
                            <Stack gap={2}>
                                <Box
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 2,
                                    }}
                                >
                                    <TextInput
                                        label="字段名称"
                                        value={field.name || ''}
                                        onChange={(e) => updateField({ name: e.target.value })}
                                        required
                                    />
                                    <TextInput
                                        label="显示标题"
                                        value={field.title || ''}
                                        onChange={(e) => updateField({ title: e.target.value })}
                                        required
                                    />
                                </Box>

                                <Select
                                    label="字段类型"
                                    value={field.type}
                                    onChange={(value) =>
                                        updateField({ type: value as EntityFieldType })
                                    }
                                    data={fieldTypeOptions}
                                    placeholder={
                                        fieldTypesLoading
                                            ? '加载字段类型中...'
                                            : fieldTypeOptions.length === 0
                                              ? '暂无字段类型'
                                              : '选择字段类型'
                                    }
                                    disabled={fieldTypesLoading}
                                    searchable
                                    styles={{
                                        dropdown: {
                                            zIndex: 1200, // 确保在模态框内的 Select 下拉菜单可见
                                        },
                                    }}
                                />

                                <Textarea
                                    label="字段描述"
                                    value={field.description || ''}
                                    onChange={(e) => updateField({ description: e.target.value })}
                                    rows={2}
                                />
                            </Stack>
                        </Card.Section>
                    </Card>

                    {/* 约束配置 */}
                    <Card withBorder>
                        <Card.Section p="md">
                            <Group gap="xs" mb={2}>
                                <Icon icon="solar:settings-bold" size={20} />
                                <Text fw={600} c={componentStyles.text.caption}>
                                    约束配置
                                </Text>
                            </Group>
                            <Stack gap={3}>
                                <Box>
                                    <Text
                                        size="sm"
                                        fw={500}
                                        mb={2}
                                        c={componentStyles.text.caption}
                                    >
                                        数据约束
                                    </Text>
                                    <Box
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr 1fr',
                                            gap: 2,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Switch
                                            label="必填字段"
                                            checked={field.isRequired || false}
                                            onChange={(e) =>
                                                updateField({ isRequired: e.currentTarget.checked })
                                            }
                                        />
                                        <Switch
                                            label="主键字段"
                                            checked={field.isPrimaryKey || false}
                                            onChange={(e) =>
                                                updateField({
                                                    isPrimaryKey: e.currentTarget.checked,
                                                })
                                            }
                                        />
                                        <Switch
                                            label="唯一约束"
                                            checked={field.isUnique || false}
                                            onChange={(e) =>
                                                updateField({ isUnique: e.currentTarget.checked })
                                            }
                                        />
                                    </Box>
                                </Box>

                                <Box>
                                    <Text
                                        size="sm"
                                        fw={500}
                                        mb={2}
                                        c={componentStyles.text.caption}
                                    >
                                        功能设置
                                    </Text>
                                    <Box
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            flexWrap: 'nowrap',
                                        }}
                                    >
                                        <Switch
                                            label={
                                                <Text style={{ whiteSpace: 'nowrap' }}>可搜索</Text>
                                            }
                                            checked={field.searchable || false}
                                            onChange={(e) =>
                                                updateField({ searchable: e.currentTarget.checked })
                                            }
                                        />
                                        <Switch
                                            label={
                                                <Text style={{ whiteSpace: 'nowrap' }}>可编辑</Text>
                                            }
                                            checked={field.editable !== false}
                                            onChange={(e) =>
                                                updateField({ editable: e.currentTarget.checked })
                                            }
                                        />
                                        <Box
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <Text
                                                size="sm"
                                                style={{ whiteSpace: 'nowrap', lineHeight: 1 }}
                                            >
                                                序号
                                            </Text>
                                            <TextInput
                                                type="number"
                                                value={field.order || 0}
                                                onChange={(e) =>
                                                    updateField({ order: parseInt(e.target.value) })
                                                }
                                                size="sm"
                                                style={{ width: 60 }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                            </Stack>
                        </Card.Section>
                    </Card>

                    {/* 校验规则配置 */}
                    <Card withBorder>
                        <Card.Section p="md">
                            <Group gap="xs" mb={2}>
                                <Icon icon="solar:shield-check-bold" size={20} />
                                <Text fw={600} c={componentStyles.text.caption}>
                                    校验规则配置
                                </Text>
                            </Group>
                            <ValidationRuleEditor
                                field={field}
                                rules={field.validation || []}
                                schemaSerialized={(field as any).schemaSerialized}
                                onChange={handleValidationChange}
                                onSchemaChange={handleSchemaChange}
                            />
                        </Card.Section>
                    </Card>

                    {/* API vs Studio 数据对比调试信息 */}
                    {process.env.NODE_ENV === 'development' && (
                        <Card withBorder>
                            <Card.Section p="md">
                                <Group gap="xs" mb={2}>
                                    <Icon icon="solar:code-2-bold" size={20} />
                                    <Text fw={600} c={componentStyles.text.caption}>
                                        数据结构调试对比
                                    </Text>
                                    <Badge size="xs" color="orange" variant="light">
                                        Dev模式
                                    </Badge>
                                </Group>

                                <Stack gap="md">
                                    {/* API原始schemaSerialized */}
                                    {(field as any).schemaSerialized && (
                                        <Box>
                                            <Text size="sm" fw={600} c="blue" mb="xs">
                                                📡 API schemaSerialized (原始数据)
                                            </Text>
                                            <Box
                                                style={{
                                                    backgroundColor: 'var(--mantine-color-blue-0)',
                                                    border: '1px solid var(--mantine-color-blue-3)',
                                                    borderRadius: '6px',
                                                    padding: '12px',
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    maxHeight: 150,
                                                    overflow: 'auto',
                                                }}
                                            >
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                    {JSON.stringify(
                                                        (field as any).schemaSerialized,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Studio编辑中的字段数据 */}
                                    <Box>
                                        <Text size="sm" fw={600} c="orange" mb="xs">
                                            🏗️ Studio(实时validation)
                                        </Text>
                                        <Box
                                            style={{
                                                backgroundColor: 'var(--mantine-color-orange-0)',
                                                border: '1px solid var(--mantine-color-orange-3)',
                                                borderRadius: '6px',
                                                padding: '12px',
                                                fontFamily: 'monospace',
                                                fontSize: '12px',
                                                maxHeight: 150,
                                                overflow: 'auto',
                                            }}
                                        >
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                {(() => {
                                                    const studioData = {
                                                        ...(field.description !== undefined && {
                                                            description: field.description,
                                                        }),
                                                        ...(field.typeOptions !== undefined && {
                                                            typeOptions: field.typeOptions,
                                                        }),
                                                        ...((field as any).schema !== undefined && {
                                                            schema: 'Zod对象(复杂)',
                                                        }),
                                                        ...(field.validation &&
                                                            field.validation.length > 0 && {
                                                                validation: field.validation,
                                                            }),
                                                    };

                                                    return JSON.stringify(studioData, null, 2);
                                                })()}
                                            </pre>
                                        </Box>
                                    </Box>

                                    {/* 数据一致性检查 */}
                                    <Alert
                                        color={
                                            (field as any).schemaSerialized
                                                ? Object.keys((field as any).schemaSerialized)
                                                      .length > 1
                                                    ? 'green'
                                                    : 'yellow'
                                                : 'red'
                                        }
                                        variant="light"
                                    >
                                        <Group gap="xs">
                                            <Icon
                                                icon={
                                                    (field as any).schemaSerialized
                                                        ? Object.keys(
                                                              (field as any).schemaSerialized
                                                          ).length > 1
                                                            ? 'solar:check-circle-bold'
                                                            : 'solar:info-circle-bold'
                                                        : 'solar:close-circle-bold'
                                                }
                                                size={16}
                                            />
                                            <Text size="sm">
                                                {(field as any).schemaSerialized
                                                    ? Object.keys((field as any).schemaSerialized)
                                                          .length > 1
                                                        ? 'API数据完整，包含详细Schema信息'
                                                        : 'Schema数据被简化，可能丢失API原始信息'
                                                    : '未配置schemaSerialized数据'}
                                            </Text>
                                        </Group>
                                    </Alert>
                                </Stack>

                                <Text size="xs" c={componentStyles.text.muted} mt="xs">
                                    此调试面板帮助您验证API数据是否正确保留在Studio中。如果看到数据不一致，请检查数据转换流程。
                                </Text>
                            </Card.Section>
                        </Card>
                    )}

                    {/* 类型专用配置 */}
                    {isOptionsFieldType(field.type) && (
                        <Card withBorder>
                            <Card.Section p="md">
                                <Group gap="xs" mb={2}>
                                    <Icon icon="solar:list-bold" size={20} />
                                    <Text fw={600} c={componentStyles.text.caption}>
                                        选项配置
                                    </Text>
                                </Group>
                                <Stack gap={2}>
                                    <Text size="sm" c={componentStyles.text.caption}>
                                        为 {field.type === 'enum' ? '枚举' : '多选'} 字段配置可选项
                                    </Text>

                                    <Textarea
                                        label="选项配置 (JSON格式)"
                                        value={JSON.stringify(
                                            field.typeOptions?.options || [],
                                            null,
                                            2
                                        )}
                                        onChange={(e) => {
                                            try {
                                                const options = JSON.parse(e.target.value);
                                                updateField({
                                                    typeOptions: { ...field.typeOptions, options },
                                                });
                                            } catch {
                                                // 忽略无效 JSON
                                            }
                                        }}
                                        rows={4}
                                        description='例如: [{"value": "option1", "label": "选项1"}, {"value": "option2", "label": "选项2"}]'
                                    />
                                </Stack>
                            </Card.Section>
                        </Card>
                    )}

                    {/* 关系字段配置 */}
                    {isRelationFieldType(field.type) && (
                        <Card withBorder>
                            <Card.Section p="md">
                                <Group gap="xs" mb={2}>
                                    <Icon icon="solar:link-bold" size={20} />
                                    <Text fw={600} c={componentStyles.text.caption}>
                                        关联配置
                                    </Text>
                                </Group>
                                <Stack gap={2}>
                                    <Select
                                        label="关联模型"
                                        value={field.refModel || ''}
                                        onChange={(value) => updateField({ refModel: value })}
                                        data={allModels.map((model) => ({
                                            value: model.name,
                                            label: `${model.title} (${model.name})`,
                                        }))}
                                        required
                                        styles={{
                                            dropdown: {
                                                zIndex: 1200, // 确保在模态框内的 Select 下拉菜单可见
                                            },
                                        }}
                                    />

                                    <TextInput
                                        label="关联字段"
                                        value={field.refField || ''}
                                        onChange={(e) => updateField({ refField: e.target.value })}
                                        description="可选：指定关联的具体字段"
                                    />
                                </Stack>
                            </Card.Section>
                        </Card>
                    )}

                    {/* 默认值配置 */}
                    <Card withBorder>
                        <Card.Section p="md">
                            <Group gap="xs" mb={2}>
                                <Icon icon="solar:database-bold" size={20} />
                                <Text fw={600} c={componentStyles.text.caption}>
                                    默认值配置
                                </Text>
                            </Group>
                            <TextInput
                                label="默认值"
                                value={field.defaultValue || ''}
                                onChange={(e) => updateField({ defaultValue: e.target.value })}
                                description={`为 ${getFieldTypeInfo(field.type)?.title || field.type} 字段设置默认值`}
                            />
                        </Card.Section>
                    </Card>
                </Stack>
            </Box>
        );
    }, [
        fieldEditorState,
        updateField,
        handleValidationChange,
        handleSchemaChange,
        allModels,
        fieldTypeOptions,
        getFieldTypeInfo,
        isOptionsFieldType,
        isRelationFieldType,
        fieldTypesLoading,
    ]);

    // 渲染编辑器内容
    const renderEditorContent = useCallback(() => {
        if (!selectedNode) return null;

        switch (selectedNode.type) {
            case 'basic-info':
                return renderBasicInfoEditor();
            case 'fields-config':
                return renderFieldsConfigEditor();
            case 'field-item':
                return renderFieldItemEditor();
            default:
                return (
                    <Box p="lg" style={{ textAlign: 'center' }}>
                        <Text c={componentStyles.text.caption}>请选择左侧的配置项进行编辑</Text>
                    </Box>
                );
        }
    }, [selectedNode, renderBasicInfoEditor, renderFieldsConfigEditor, renderFieldItemEditor]);

    // 4.3 主渲染
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
                            flex: '0 0 200px', // 从240px减少到200px，让树状结构更紧凑
                            height: '100%', // 确保Paper填满容器高度
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <ScrollArea.Autosize
                            mah="100%"
                            type="auto"
                            scrollbarSize={8}
                            style={{ flex: 1, minHeight: 0 }}
                            px={4}
                            py={8}
                        >
                            <List>{configTree.map((node) => renderTreeNode(node))}</List>
                        </ScrollArea.Autosize>
                    </Paper>

                    {/* 右栏：配置编辑器 */}
                    <Paper
                        withBorder
                        shadow="sm"
                        radius="md"
                        style={{
                            flex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <ScrollArea.Autosize
                            mah="100%"
                            type="auto"
                            scrollbarSize={8}
                            style={{ flex: 1, minHeight: 0 }}
                            px={12}
                            py={8}
                        >
                            {renderEditorContent()}
                        </ScrollArea.Autosize>
                    </Paper>
                </Box>

                {/* 字段选择器对话框 */}
                <FieldSelectorDialog
                    open={editorState.showFieldSelector}
                    onClose={() =>
                        setEditorState((prev) => ({ ...prev, showFieldSelector: false }))
                    }
                    onSelect={handleFieldSelection}
                    modelConfig={config}
                    usedFieldNames={usedFieldNames}
                />
            </>
        </Box>
    );
}

// 导出声明

export { FieldSelectorDialog };
