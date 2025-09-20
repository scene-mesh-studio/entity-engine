import type { IEntityFieldDelegate } from '../../core';

import { z, type ZodTypeAny } from 'zod';

import { BaseFieldTyper } from './common.types';
import { QueryOperator, type IEntityQueryItemMeta } from '../../types';

export class StringFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '字符串',
            type: 'string',
            widgetType: 'textfield',
            defaultValue: '',
            description: '字符串/文本类型的字段',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired ? z.string().min(1) : z.string().optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [
                QueryOperator.EQ,
                QueryOperator.CONTAINS,
                QueryOperator.STARTS_WITH,
                QueryOperator.ENDS_WITH,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL,
            ],
            options: [],
        };
    }
}

export class NumberFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '数字',
            type: 'number',
            widgetType: 'number',
            defaultValue: 0,
            description: '数字类型的字段',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired ? z.number() : z.number().optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [
                QueryOperator.EQ,
                QueryOperator.GT,
                QueryOperator.LT,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL,
            ],
            options: [],
        };
    }
}

export class BooleanFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '布尔',
            type: 'boolean',
            widgetType: 'switch',
            defaultValue: false,
            description: '布尔类型的字段',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired ? z.boolean() : z.boolean().optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [QueryOperator.EQ, QueryOperator.IS_NOT_NULL, QueryOperator.IS_NULL],
            options: [
                { label: '是', value: true },
                { label: '否', value: false },
            ],
        };
    }
}

export class DateFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '日期',
            type: 'date',
            widgetType: 'date',
            defaultValue: new Date(),
            description: '日期/时间类型的字段',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired ? z.coerce.date() : z.coerce.date().optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [
                QueryOperator.EQ,
                QueryOperator.GT,
                QueryOperator.LT,
                QueryOperator.BETWEEN,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL,
            ],
            options: [],
        };
    }
}

export class EnumFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '枚举',
            type: 'enum',
            widgetType: 'select',
            defaultValue: undefined,
            description: '枚举下拉选择类型的字段',
        });
    }

    getDefaultValue(field: IEntityFieldDelegate) {
        if (field.typeOptions?.options && Array.isArray(field.typeOptions.options)) {
            if (!field.typeOptions?.options || field.typeOptions.options.length === 0) {
                return undefined;
            }
            return field.typeOptions?.options[0];
        }
        return undefined;
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        if (!field.typeOptions?.options || !Array.isArray(field.typeOptions.options)) {
            return field.isRequired ? z.string().min(1) : z.string().optional();
        }
        const options = (field.typeOptions?.options || []).map((opt: any) =>
            opt && typeof opt === 'object' && 'value' in opt ? opt.value : opt
        );
        if (!options || options.length === 0) {
            // 回退到 string，避免 z.enum([]) 运行时异常
            return field.isRequired ? z.string().min(1) : z.string().optional();
        }
        const tuple = options as [string, ...string[]];
        return field.isRequired
            ? z.enum(tuple, { message: '必须进行选择' })
            : z.enum(tuple).optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        const options = Array.isArray(field.typeOptions?.options)
            ? (field.typeOptions?.options as any[])
            : [];
        return {
            field,
            operators: [
                QueryOperator.EQ,
                QueryOperator.NE,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL,
            ],
            options,
        };
    }
}

export class ArrayFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '多选数组',
            type: 'array',
            widgetType: 'select',
            defaultValue: [],
            description: '多选数组/枚举集合类型的字段',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        if (!field.typeOptions?.options || !Array.isArray(field.typeOptions.options)) {
            return field.isRequired ? z.array(z.string()) : z.array(z.string()).optional();
        }
        const options = (field.typeOptions?.options || []).map((opt: any) =>
            opt && typeof opt === 'object' && 'value' in opt ? opt.value : opt
        );
        if (!options || options.length === 0) {
            return field.isRequired ? z.array(z.string()) : z.array(z.string()).optional();
        }
        const tuple = options as [string, ...string[]];
        return field.isRequired
            ? z.array(z.enum(tuple, { message: '必须进行选择' }))
            : z.array(z.enum(tuple)).optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        const options = Array.isArray(field.typeOptions?.options)
            ? (field.typeOptions?.options as any[])
            : [];
        return {
            field,
            operators: [
                QueryOperator.IN,
                QueryOperator.NOT_IN,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL,
            ],
            options,
        };
    }
}

export class ManyToOneFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '多对一',
            type: 'many_to_one',
            widgetType: 'select',
            defaultValue: '',
            description: '引用单个其他实体（多对一）',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired ? z.string() : z.string().optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [QueryOperator.EQ, QueryOperator.IS_NOT_NULL, QueryOperator.IS_NULL],
            options: [],
        };
    }
}

export class OneToOneFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '一对一',
            type: 'one_to_one',
            widgetType: 'select',
            defaultValue: '',
            description: '引用单个其他实体（一对一）',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired ? z.string() : z.string().optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [QueryOperator.EQ, QueryOperator.IS_NOT_NULL, QueryOperator.IS_NULL],
            options: [],
        };
    }
}

export class OneToManyFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '一对多',
            type: 'one_to_many',
            widgetType: 'reference',
            defaultValue: undefined,
            description: '引用多个其他实体（一对多）',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired ? z.array(z.string()) : z.array(z.string()).optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [
                QueryOperator.IN,
                QueryOperator.NOT_IN,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL,
            ],
            options: [],
        };
    }
}

export class ManyToManyFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '多对多',
            type: 'many_to_many',
            widgetType: 'reference',
            defaultValue: undefined,
            description: '引用多个其他实体（多对多）',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired ? z.array(z.string()) : z.array(z.string()).optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [
                QueryOperator.IN,
                QueryOperator.NOT_IN,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL,
            ],
            options: [],
        };
    }
}

export class BinaryFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: '文件',
            type: 'binary',
            widgetType: 'file',
            defaultValue: undefined,
            description: '文件/二进制类型的字段（含文件名/类型/大小/路径）',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        const obj = z.object({
            fileName: z.string().min(1, { message: 'File name is required' }),
            fileType: z.string().min(1, { message: 'File type is required' }),
            fileSize: z.number().min(0, { message: 'File size must be a positive number' }),
            filePath: z.string().min(1, { message: 'File path is required' }),
        });
        return field.isRequired ? obj : obj.partial().optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [QueryOperator.IS_NOT_NULL, QueryOperator.IS_NULL],
            options: [],
        };
    }
}

export class JsonFieldTyper extends BaseFieldTyper {
    constructor() {
        super({
            title: 'JSON',
            type: 'json',
            widgetType: 'json',
            defaultValue: {},
            description: 'JSON 对象类型的字段',
        });
    }

    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny {
        return field.isRequired
            ? z.record(z.string(), z.unknown())
            : z.record(z.string(), z.unknown()).optional();
    }

    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined {
        return {
            field,
            operators: [QueryOperator.IS_NOT_NULL, QueryOperator.IS_NULL],
            options: [],
        };
    }
}
