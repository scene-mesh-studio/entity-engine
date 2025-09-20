/**
 * JSON Schema 校验规则解析器
 * 负责在 JSON Schema 和用户友好的校验规则配置之间进行双向转换
 */

import type { EntityFieldType } from '../types/entities';
import type { IEntityFieldValidation } from '../components/model-editor';

// 扩展的校验规则配置
export interface ValidationRuleConfig {
    key?: string; // 添加可选的 key 属性
    label: string;
    valueType: 'number' | 'string' | 'date' | 'boolean' | 'none';
    forTypes: readonly EntityFieldType[];
    zodKey: string;
    description?: string;
    example?: string;
}

// 增强的校验规则配置
export const ENHANCED_VALIDATION_CONFIGS: Record<string, ValidationRuleConfig> = {
    // 字符串类型校验
    minLength: {
        label: '最小长度',
        valueType: 'number',
        forTypes: ['string'],
        zodKey: 'minLength',
        description: '字符串最少包含的字符数',
        example: '5',
    },
    maxLength: {
        label: '最大长度',
        valueType: 'number',
        forTypes: ['string'],
        zodKey: 'maxLength',
        description: '字符串最多包含的字符数',
        example: '100',
    },
    pattern: {
        label: '正则表达式',
        valueType: 'string',
        forTypes: ['string'],
        zodKey: 'regex',
        description: '字符串必须匹配的正则表达式',
        example: '^[A-Za-z0-9]+$',
    },
    email: {
        label: '邮箱格式',
        valueType: 'none',
        forTypes: ['string'],
        zodKey: 'email',
        description: '验证是否为有效的邮箱地址格式',
    },
    url: {
        label: 'URL格式',
        valueType: 'none',
        forTypes: ['string'],
        zodKey: 'url',
        description: '验证是否为有效的URL地址格式',
    },
    uuid: {
        label: 'UUID格式',
        valueType: 'none',
        forTypes: ['string'],
        zodKey: 'uuid',
        description: '验证是否为有效的UUID格式',
    },

    // 数字类型校验
    min: {
        label: '最小值',
        valueType: 'number',
        forTypes: ['number'],
        zodKey: 'min',
        description: '数值的最小值',
        example: '0',
    },
    max: {
        label: '最大值',
        valueType: 'number',
        forTypes: ['number'],
        zodKey: 'max',
        description: '数值的最大值',
        example: '1000',
    },
    gt: {
        label: '大于',
        valueType: 'number',
        forTypes: ['number'],
        zodKey: 'gt',
        description: '数值必须大于指定值',
        example: '0',
    },
    lt: {
        label: '小于',
        valueType: 'number',
        forTypes: ['number'],
        zodKey: 'lt',
        description: '数值必须小于指定值',
        example: '100',
    },
    gte: {
        label: '大于等于',
        valueType: 'number',
        forTypes: ['number'],
        zodKey: 'gte',
        description: '数值必须大于或等于指定值',
        example: '0',
    },
    lte: {
        label: '小于等于',
        valueType: 'number',
        forTypes: ['number'],
        zodKey: 'lte',
        description: '数值必须小于或等于指定值',
        example: '100',
    },
    int: {
        label: '整数',
        valueType: 'none',
        forTypes: ['number'],
        zodKey: 'int',
        description: '验证是否为整数',
    },
    positive: {
        label: '正数',
        valueType: 'none',
        forTypes: ['number'],
        zodKey: 'positive',
        description: '验证是否为正数',
    },
    negative: {
        label: '负数',
        valueType: 'none',
        forTypes: ['number'],
        zodKey: 'negative',
        description: '验证是否为负数',
    },
    nonnegative: {
        label: '非负数',
        valueType: 'none',
        forTypes: ['number'],
        zodKey: 'nonnegative',
        description: '验证是否为非负数（≥0）',
    },
    nonpositive: {
        label: '非正数',
        valueType: 'none',
        forTypes: ['number'],
        zodKey: 'nonpositive',
        description: '验证是否为非正数（≤0）',
    },

    // 日期类型校验
    minDate: {
        label: '最早日期',
        valueType: 'date',
        forTypes: ['date'],
        zodKey: 'min',
        description: '日期不能早于指定日期',
        example: '2024-01-01',
    },
    maxDate: {
        label: '最晚日期',
        valueType: 'date',
        forTypes: ['date'],
        zodKey: 'max',
        description: '日期不能晚于指定日期',
        example: '2024-12-31',
    },

    // 数组类型校验
    minItems: {
        label: '最少项目数',
        valueType: 'number',
        forTypes: ['array'],
        zodKey: 'min',
        description: '数组最少包含的项目数',
        example: '1',
    },
    maxItems: {
        label: '最多项目数',
        valueType: 'number',
        forTypes: ['array'],
        zodKey: 'max',
        description: '数组最多包含的项目数',
        example: '10',
    },

    // 布尔类型校验
    required: {
        label: '必须为真',
        valueType: 'none',
        forTypes: ['boolean'],
        zodKey: 'literal',
        description: '布尔值必须为 true',
    },

    // 枚举类型校验
    enumValue: {
        label: '枚举值',
        valueType: 'string',
        forTypes: ['enum'],
        zodKey: 'enum',
        description: '值必须是预定义的枚举值之一',
        example: 'option1,option2,option3',
    },
} as const;

export type ValidationRuleType = keyof typeof ENHANCED_VALIDATION_CONFIGS;

/**
 * JSON Schema 校验规则解析器类
 */
export class SchemaValidationParser {
    /**
     * 从 JSON Schema 提取校验规则
     */
    extractValidationRules(
        schemaSerialized: any,
        fieldType: EntityFieldType
    ): IEntityFieldValidation[] {
        if (!schemaSerialized || typeof schemaSerialized !== 'object') {
            return [];
        }

        // 🔧 修复：如果是空对象或只包含基础type信息，返回空规则
        const schemaKeys = Object.keys(schemaSerialized);
        if (
            schemaKeys.length === 0 ||
            (schemaKeys.length <= 2 &&
                schemaKeys.includes('type') &&
                schemaKeys.includes('$schema'))
        ) {
            console.log(
                `📝 [SchemaValidationParser] 空schema或基础schema，返回空规则:`,
                schemaSerialized
            );
            return [];
        }

        const rules: IEntityFieldValidation[] = [];

        try {
            // 处理字符串类型的校验规则
            if (schemaSerialized.type === 'string' || fieldType === 'string') {
                // 最小长度
                if (typeof schemaSerialized.minLength === 'number') {
                    rules.push({
                        type: 'minLength',
                        value: schemaSerialized.minLength,
                        message: `最小长度为 ${schemaSerialized.minLength} 个字符`,
                    });
                }

                // 最大长度
                if (typeof schemaSerialized.maxLength === 'number') {
                    rules.push({
                        type: 'maxLength',
                        value: schemaSerialized.maxLength,
                        message: `最大长度为 ${schemaSerialized.maxLength} 个字符`,
                    });
                }

                // 正则表达式
                if (schemaSerialized.pattern) {
                    rules.push({
                        type: 'pattern',
                        value: schemaSerialized.pattern,
                        message: '格式不正确',
                    });
                }

                // 邮箱格式
                if (schemaSerialized.format === 'email') {
                    rules.push({
                        type: 'email',
                        message: '请输入有效的邮箱地址',
                    });
                }

                // URL格式
                if (schemaSerialized.format === 'uri' || schemaSerialized.format === 'url') {
                    rules.push({
                        type: 'url',
                        message: '请输入有效的URL地址',
                    });
                }

                // UUID格式
                if (schemaSerialized.format === 'uuid') {
                    rules.push({
                        type: 'uuid',
                        message: '请输入有效的UUID格式',
                    });
                }
            }

            // 处理数字类型的校验规则
            if (
                schemaSerialized.type === 'number' ||
                schemaSerialized.type === 'integer' ||
                fieldType === 'number'
            ) {
                // 最小值
                if (typeof schemaSerialized.minimum === 'number') {
                    rules.push({
                        type: 'min',
                        value: schemaSerialized.minimum,
                        message: `最小值为 ${schemaSerialized.minimum}`,
                    });
                }

                // 最大值
                if (typeof schemaSerialized.maximum === 'number') {
                    rules.push({
                        type: 'max',
                        value: schemaSerialized.maximum,
                        message: `最大值为 ${schemaSerialized.maximum}`,
                    });
                }

                // 大于
                if (typeof schemaSerialized.exclusiveMinimum === 'number') {
                    rules.push({
                        type: 'gt',
                        value: schemaSerialized.exclusiveMinimum,
                        message: `必须大于 ${schemaSerialized.exclusiveMinimum}`,
                    });
                }

                // 小于
                if (typeof schemaSerialized.exclusiveMaximum === 'number') {
                    rules.push({
                        type: 'lt',
                        value: schemaSerialized.exclusiveMaximum,
                        message: `必须小于 ${schemaSerialized.exclusiveMaximum}`,
                    });
                }
            }

            // 处理数组类型的校验规则
            if (schemaSerialized.type === 'array' || fieldType === 'array') {
                // 最少项目数
                if (typeof schemaSerialized.minItems === 'number') {
                    rules.push({
                        type: 'minItems',
                        value: schemaSerialized.minItems,
                        message: `至少需要 ${schemaSerialized.minItems} 项`,
                    });
                }

                // 最多项目数
                if (typeof schemaSerialized.maxItems === 'number') {
                    rules.push({
                        type: 'maxItems',
                        value: schemaSerialized.maxItems,
                        message: `最多允许 ${schemaSerialized.maxItems} 项`,
                    });
                }
            }

            // 处理日期类型的校验规则
            if (
                schemaSerialized.format === 'date' ||
                schemaSerialized.format === 'date-time' ||
                fieldType === 'date'
            ) {
                // 最早日期
                if (schemaSerialized.formatMinimum) {
                    rules.push({
                        type: 'minDate',
                        value: schemaSerialized.formatMinimum,
                        message: `日期不能早于 ${schemaSerialized.formatMinimum}`,
                    });
                }

                // 最晚日期
                if (schemaSerialized.formatMaximum) {
                    rules.push({
                        type: 'maxDate',
                        value: schemaSerialized.formatMaximum,
                        message: `日期不能晚于 ${schemaSerialized.formatMaximum}`,
                    });
                }
            }

            // 处理枚举类型的校验规则
            if (fieldType === 'enum' && Array.isArray(schemaSerialized.enum)) {
                rules.push({
                    type: 'enumValue',
                    value: schemaSerialized.enum.join(','),
                    message: '请选择有效的选项',
                });
            }
        } catch (error) {
            console.warn('解析 JSON Schema 校验规则时出错:', error, schemaSerialized);
        }

        return rules;
    }

    /**
     * 将校验规则转换为 JSON Schema
     */
    buildJsonSchema(rules: IEntityFieldValidation[], baseType: EntityFieldType): any {
        const schema: any = {
            type: this.getJsonSchemaType(baseType),
            $schema: 'http://json-schema.org/draft-07/schema#', // 🔧 确保总是包含$schema字段
        };

        // 根据基础类型设置 format
        if (baseType === 'date') {
            schema.format = 'date';
        }

        // 处理每个校验规则
        for (const rule of rules) {
            try {
                switch (rule.type) {
                    case 'minLength':
                        schema.minLength = Number(rule.value);
                        break;
                    case 'maxLength':
                        schema.maxLength = Number(rule.value);
                        break;
                    case 'pattern':
                        schema.pattern = String(rule.value);
                        break;
                    case 'email':
                        schema.format = 'email';
                        break;
                    case 'url':
                        schema.format = 'uri';
                        break;
                    case 'uuid':
                        schema.format = 'uuid';
                        break;
                    case 'min':
                    case 'gte':
                        schema.minimum = Number(rule.value);
                        break;
                    case 'max':
                    case 'lte':
                        schema.maximum = Number(rule.value);
                        break;
                    case 'gt':
                        schema.exclusiveMinimum = Number(rule.value);
                        break;
                    case 'lt':
                        schema.exclusiveMaximum = Number(rule.value);
                        break;
                    case 'minDate':
                        schema.formatMinimum = String(rule.value);
                        break;
                    case 'maxDate':
                        schema.formatMaximum = String(rule.value);
                        break;
                    case 'minItems':
                        schema.minItems = Number(rule.value);
                        break;
                    case 'maxItems':
                        schema.maxItems = Number(rule.value);
                        break;
                    case 'enumValue':
                        if (typeof rule.value === 'string') {
                            schema.enum = rule.value.split(',').map((v) => v.trim());
                        }
                        break;
                    default:
                        // 未识别的规则类型，跳过处理
                        console.warn(`未识别的校验规则类型: ${rule.type}`);
                        break;
                }
            } catch (error) {
                console.warn(`处理校验规则 ${rule.type} 时出错:`, error, rule);
            }
        }

        return schema;
    }

    /**
     * 获取字段类型支持的校验规则
     */
    getSupportedValidations(fieldType: EntityFieldType): ValidationRuleConfig[] {
        return Object.entries(ENHANCED_VALIDATION_CONFIGS)
            .filter(([_, config]) => config.forTypes.includes(fieldType))
            .map(([key, config]) => ({ ...config, key })) as ValidationRuleConfig[];
    }

    /**
     * 获取校验规则配置
     */
    getValidationConfig(ruleType: string): ValidationRuleConfig | undefined {
        return ENHANCED_VALIDATION_CONFIGS[ruleType as ValidationRuleType];
    }

    /**
     * 验证校验规则值是否有效
     */
    validateRuleValue(ruleType: string, value: any): boolean {
        const config = this.getValidationConfig(ruleType);
        if (!config) return false;

        switch (config.valueType) {
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'string':
                return typeof value === 'string' && value.length > 0;
            case 'date':
                return typeof value === 'string' && !isNaN(Date.parse(value));
            case 'boolean':
                return typeof value === 'boolean';
            case 'none':
                return true;
            default:
                return false;
        }
    }

    /**
     * 生成默认的错误消息
     */
    generateDefaultMessage(ruleType: string, value?: any): string {
        const config = this.getValidationConfig(ruleType);
        if (!config) return '校验失败';

        switch (ruleType) {
            case 'minLength':
                return `最少需要 ${value} 个字符`;
            case 'maxLength':
                return `最多允许 ${value} 个字符`;
            case 'pattern':
                return '格式不正确';
            case 'email':
                return '请输入有效的邮箱地址';
            case 'url':
                return '请输入有效的URL地址';
            case 'min':
                return `最小值为 ${value}`;
            case 'max':
                return `最大值为 ${value}`;
            case 'gt':
                return `必须大于 ${value}`;
            case 'lt':
                return `必须小于 ${value}`;
            case 'enumValue':
                return '请选择有效的选项';
            default:
                return config.description || '校验失败';
        }
    }

    /**
     * 将 Entity 字段类型转换为 JSON Schema 类型
     */
    private getJsonSchemaType(fieldType: EntityFieldType): string {
        switch (fieldType) {
            case 'string':
                return 'string';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                return 'array';
            case 'json':
                return 'object';
            case 'date':
                return 'string';
            case 'enum':
                return 'string';
            case 'binary':
                return 'string';
            default:
                return 'string';
        }
    }
}

// 导出单例实例
export const schemaValidationParser = new SchemaValidationParser();
