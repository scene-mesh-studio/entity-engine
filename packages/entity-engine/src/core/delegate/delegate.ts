import type {
    IEntityMetaRegistry,
    IEntityViewDelegate,
    IEntityFieldDelegate,
    IEntityModelDelegate,
    IEntityViewFieldDelegate,
    IModelFieldTyperRegistry,
} from '../types';
import type {
    IEntityView,
    IEntityField,
    IEntityModel,
    EntityFieldType,
    IEntityQueryMeta,
    IEntityViewField,
    IEntityViewPanel,
    EntityViewDensity,
    IEntityQueryItemMeta,
    IEntityGridViewHilite,
    IEntityModelExternalConfig,
} from '../../types';

import { z, type ZodTypeAny } from 'zod';

import { QueryOperator } from '../../types';

export class EntityFieldDelegate implements IEntityFieldDelegate {
    private _field: IEntityField;
    constructor(field: IEntityField) {
        this._field = field;
    }
    get name(): string {
        return this._field.name;
    }
    get title(): string {
        return this._field.title;
    }
    get type(): EntityFieldType {
        return this._field.type;
    }
    get typeOptions(): { [key: string]: any } | undefined {
        return this._field.typeOptions;
    }
    get description(): string | undefined {
        return this._field.description;
    }
    get defaultValue(): any {
        return this._field.defaultValue;
    }
    get isRequired(): boolean {
        return this._field.isRequired ?? false;
    }
    get isPrimaryKey(): boolean {
        return this._field.isPrimaryKey ?? false;
    }
    get isUnique(): boolean {
        return this._field.isUnique ?? false;
    }
    get editable(): boolean {
        return this._field.editable ?? true;
    }
    get searchable(): boolean {
        return this._field.searchable ?? false;
    }
    get refModel(): string | undefined {
        return this._field.refModel;
    }
    get refField(): string | undefined {
        return this._field.refField;
    }
    get schema(): ZodTypeAny | undefined {
        return this._field.schema;
    }
    get order(): number | undefined {
        return this._field.order;
    }
}

export class EntityModelDelegate implements IEntityModelDelegate {
    private _model: IEntityModel;
    private _typeRegistry: IModelFieldTyperRegistry;
    constructor(model: IEntityModel, typeRegistry: IModelFieldTyperRegistry) {
        this._model = model;
        this._typeRegistry = typeRegistry;
    }
    get name(): string {
        return this._model.name;
    }
    get title(): string {
        return this._model.title;
    }
    get description(): string | undefined {
        return this._model.description;
    }
    get external(): boolean | undefined {
        return this._model.external;
    }
    get externalConfig(): IEntityModelExternalConfig | undefined {
        return this._model.externalConfig;
    }

    isSupportFeature(feature: string): boolean {
        if (!this._model.external) return true;
        const fs = this._model.externalConfig?.features || [];
        console.log('@@@@@@@@@@@@@@ Supported features:', this._model.name, fs);
        return fs.includes(feature);
    }

    findPrimaryKeyFields(): IEntityField[] {
        return this._model.fields.filter((field) => field.isPrimaryKey);
    }
    findUniqueFields(): IEntityField[] {
        return this._model.fields.filter((field) => field.isUnique);
    }
    findFieldByName(name: string): IEntityField | undefined {
        return this._model.fields.find((field) => field.name === name);
    }
    findFieldByTitle(title: string): IEntityField | undefined {
        return this._model.fields.find((field) => field.title === title);
    }
    findSearchableFields(): IEntityField[] {
        return this._model.fields.filter((field) => field.searchable);
    }
    get schema(): ZodTypeAny {
        return z.object({
            ...this._model.fields.reduce<Record<string, ZodTypeAny>>((acc, field) => {
                const fschema = this.getFieldSchema(field);
                if (fschema) {
                    acc[field.name] = fschema;
                }
                return acc;
            }, {}),
        });
    }

    private getFieldSchema(field: IEntityField): ZodTypeAny | undefined {
        if (field.schema) {
            return field.schema;
        }

        const typer = this._typeRegistry.getFieldTyper(field.type);
        if (typer) {
            return typer.getDefaultSchema(field);
        }

        // if (field.type === 'string') {
        //     return field.isRequired ? z.string().min(1) : z.string().optional();
        // }
        // if (field.type === 'number') {
        //     return field.isRequired ? z.number() : z.number().optional();
        // }
        // if (field.type === 'boolean') {
        //     return field.isRequired ? z.boolean() : z.boolean().optional();
        // }
        // if (field.type === 'date') {
        //     return field.isRequired ? z.coerce.date() : z.coerce.date().optional();
        // }
        // if (field.type === 'enum') {
        //     const options = (field.typeOptions?.options || []).map(
        //         (opt: { value: any }) => opt.value || opt
        //     );
        //     return field.isRequired
        //         ? z.enum(options, { message: '必须进行选择' })
        //         : z.enum(options).optional();
        // }
        // if (field.type === 'array') {
        //     const options = (field.typeOptions?.options || []).map(
        //         (opt: { value: any }) => opt.value || opt
        //     );
        //     return field.isRequired
        //         ? z.array(z.enum(options, { message: '必须进行选择' }))
        //         : z.array(z.enum(options)).optional();
        // }
        // if (['one_to_many', 'many_to_many'].includes(field.type)) {
        //     return field.isRequired ? z.array(z.string()) : z.array(z.string()).optional();
        // }
        // if (['many_to_one', 'one_to_one'].includes(field.type)) {
        //     return field.isRequired ? z.string() : z.string().optional();
        // }
        // if (field.type === 'binary') {
        //     return field.isRequired
        //         ? z.object({
        //               fileName: z.string().min(1, { message: 'File name is required' }),
        //               fileType: z.string().min(1, { message: 'File type is required' }),
        //               fileSize: z
        //                   .number()
        //                   .min(0, { message: 'File size must be a positive number' }),
        //               filePath: z.string().min(1, { message: 'File path is required' }),
        //           })
        //         : z
        //               .object({
        //                   fileName: z
        //                       .string()
        //                       .min(1, { message: 'File name is required' })
        //                       .optional(),
        //                   fileType: z
        //                       .string()
        //                       .min(1, { message: 'File type is required' })
        //                       .optional(),
        //                   fileSize: z
        //                       .number()
        //                       .min(0, { message: 'File size must be a positive number' })
        //                       .optional(),
        //                   filePath: z
        //                       .string()
        //                       .min(1, { message: 'File path is required' })
        //                       .optional(),
        //               })
        //               .optional();
        // }
        // if (field.type === 'json') {
        //     return field.isRequired
        //         ? z.record(z.string(), z.unknown())
        //         : z.record(z.string(), z.unknown()).optional();
        // }

        return undefined;
    }

    toSupplementedValues(input: Record<string, any>): Record<string, any> {
        const obj = {
            ...input,
            ...this._model.fields.reduce<Record<string, any>>((acc, field) => {
                if (!input[field.name]) {
                    acc[field.name] = input[field.name] || this.getFieldDefaultValue(field);
                    return acc;
                } else {
                    return acc;
                }
            }, {}),
        };
        return obj;
    }

    private getFieldDefaultValue(field: IEntityField): any {
        if (field.defaultValue !== undefined) {
            return field.defaultValue;
        }

        const typer = this._typeRegistry.getFieldTyper(field.type);
        if (typer) {
            return typer.getDefaultValue(field);
        }

        // if (field.type === 'string') {
        //     return '';
        // }
        // if (field.type === 'number') {
        //     return 0;
        // }
        // if (field.type === 'boolean') {
        //     return false;
        // }
        // if (field.type === 'date') {
        //     return new Date();
        // }
        // if (field.type === 'enum') {
        //     if (!field.typeOptions?.options || field.typeOptions.options.length === 0) {
        //         return undefined;
        //     }
        //     return field.typeOptions?.options[0];
        // }
        // if (field.type === 'array') {
        //     // if (!field.typeOptions?.options || field.typeOptions.options.length === 0) {
        //     //   return undefined;
        //     // }
        //     return [];
        // }
        // if (['many_to_one', 'one_to_one'].includes(field.type)) {
        //     return '';
        // }
        return undefined;
    }

    getQueryMeta(): IEntityQueryMeta {
        const itemMetas: IEntityQueryItemMeta[] = [];
        const searchableFields = this.fields.filter((f) => f.searchable);
        searchableFields.forEach((field) => {
            const meta = this.getFieldQueryItemMeta(field);
            if (meta) {
                itemMetas.push(meta);
            }
        });
        return {
            queryItemMetas: itemMetas,
        };
    }

    private getFieldQueryItemMeta(field: IEntityField): IEntityQueryItemMeta | undefined {
        if (!field.searchable) return undefined;

        // const typer = this._typeRegistry.getFieldTyper(field.type);
        // if (typer) {
        //     return typer.getQueryItemMeta(field);
        // }

        const operators: QueryOperator[] = [];
        const options: { [key: string]: any }[] = [];

        const normalizeOptionItem = (item: any) => {
            if (item == null) return undefined;
            if (typeof item === 'object') {
                // 若已是 { label, value } 或 { value }，补齐 label
                const value = 'value' in item ? item.value : item;
                const label = 'label' in item ? item.label : String(value);
                return { label, value };
            }
            // 原始值
            return { label: String(item), value: item };
        };

        if (field.type === 'string') {
            operators.push(
                QueryOperator.EQ,
                QueryOperator.CONTAINS,
                QueryOperator.STARTS_WITH,
                QueryOperator.ENDS_WITH,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL
            );
        }
        if (field.type === 'number') {
            operators.push(
                QueryOperator.EQ,
                QueryOperator.GT,
                QueryOperator.LT,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL
            );
        }
        if (field.type === 'boolean') {
            operators.push(QueryOperator.EQ, QueryOperator.IS_NOT_NULL, QueryOperator.IS_NULL);
            options.push({ label: '是', value: true });
            options.push({ label: '否', value: false });
        }
        if (field.type === 'date') {
            operators.push(
                QueryOperator.EQ,
                QueryOperator.GT,
                QueryOperator.LT,
                QueryOperator.BETWEEN,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL
            );
        }
        if (field.type === 'enum') {
            operators.push(
                QueryOperator.EQ,
                QueryOperator.NE,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL
            );
            const raw = field.typeOptions?.options;
            if (Array.isArray(raw)) {
                for (const r of raw) {
                    const norm = normalizeOptionItem(r);
                    if (norm) options.push(norm);
                }
            } else {
                // 单值或对象也兼容
                const norm = normalizeOptionItem(raw);
                if (norm) options.push(norm);
            }
        }
        if (field.type === 'array') {
            operators.push(
                QueryOperator.IN,
                QueryOperator.NOT_IN,
                QueryOperator.IS_NOT_NULL,
                QueryOperator.IS_NULL
            );
            const raw = field.typeOptions?.options;
            if (Array.isArray(raw)) {
                for (const r of raw) {
                    const norm = normalizeOptionItem(r);
                    if (norm) options.push(norm);
                }
            }
        }

        if (operators.length > 0) {
            return {
                field,
                operators,
                options,
            };
        }

        return undefined;
    }

    get fields(): IEntityField[] {
        return this._model.fields.map((field) => new EntityFieldDelegate(field));
    }
}

export class EntityViewFieldDelegate implements IEntityViewFieldDelegate {
    private _field: IEntityViewField;
    constructor(field: IEntityViewField) {
        this._field = field;
    }
    get name(): string {
        return this._field.name;
    }
    get title(): string | undefined {
        return this._field.title;
    }

    get description(): string | undefined {
        return this._field.description;
    }
    get icon(): string | undefined {
        return this._field.icon;
    }
    get widget(): string | undefined {
        return this._field.widget;
    }
    get widgetOptions(): { [key: string]: any } | undefined {
        return this._field.widgetOptions;
    }
    get width(): number | undefined {
        return this._field.width;
    }
    get flex(): 1 | 0 | undefined {
        return this._field.flex;
    }
    get spanCols(): number | undefined {
        return this._field.spanCols;
    }
    get order(): number | undefined {
        return this._field.order;
    }
    get fields(): IEntityViewField[] | undefined {
        return this._field.fields?.map((field) => new EntityViewFieldDelegate(field));
    }
    get hiddenWhen(): string | undefined {
        return this._field.hiddenWhen;
    }
    get showWhen(): string | undefined {
        return this._field.showWhen;
    }
    get readOnlyWhen(): string | undefined {
        return this._field.readOnlyWhen;
    }
    get disabledWhen(): string | undefined {
        return this._field.disabledWhen;
    }
    get requiredWhen(): string | undefined {
        return this._field.requiredWhen;
    }
}

export class EntityViewDelegate implements IEntityViewDelegate {
    private _view: IEntityView;
    private _metaRegistry: IEntityMetaRegistry;
    private _typeRegistry: IModelFieldTyperRegistry;
    constructor(
        view: IEntityView,
        metaRegistry: IEntityMetaRegistry,
        typeRegistry: IModelFieldTyperRegistry
    ) {
        this._view = view;
        this._metaRegistry = metaRegistry;
        this._typeRegistry = typeRegistry!;
    }
    get name(): string {
        return this._view.name;
    }
    get title(): string {
        return this._view.title;
    }
    get description(): string | undefined {
        return this._view.description;
    }
    get modelName(): string {
        return this._view.modelName;
    }
    get viewType(): string {
        return this._view.viewType;
    }
    get density(): EntityViewDensity | undefined {
        return this._view.density;
    }
    get viewOptions(): { [key: string]: any } | undefined {
        return this._view.viewOptions;
    }
    get items(): IEntityViewField[] {
        return this._view.items.map((item) => new EntityViewFieldDelegate(item));
    }
    get hilites(): IEntityGridViewHilite[] | undefined {
        return this._view.hilites;
    }
    get canEdit(): boolean | undefined {
        return this._view.canEdit;
    }
    get canNew(): boolean | undefined {
        return this._view.canNew;
    }
    get canDelete(): boolean | undefined {
        return this._view.canDelete;
    }

    toSupplementedView(viewOptions?: Record<string, any>): EntityViewDelegate {
        const view: IEntityView = {
            ...this._view,
            ...(viewOptions && Object.keys(viewOptions).length > 0 ? { viewOptions } : {}),
            density: this._view.density || 'medium',
            items: this._view.items.map((field) => this.supplementField(field)),
        };
        return new EntityViewDelegate(view, this._metaRegistry, this._typeRegistry);
    }

    private supplementField(
        item: IEntityViewField | IEntityViewPanel
    ): IEntityViewField | IEntityViewPanel {
        if ('fields' in item) {
            // panel
            const panel = item as IEntityViewPanel;
            return {
                ...panel,
                fields: panel.fields.map((field) => this.supplementField(field)),
            };
        } else {
            const field = item as IEntityViewField;
            const modelField = this._metaRegistry
                .getModel(this._view.modelName)
                ?.findFieldByName(field.name);
            if (!modelField) {
                return field;
            } else {
                return {
                    ...field,
                    title: field.title || modelField.title,
                    description: field.description || modelField.description,
                    order: field.order || modelField.order || 0,
                    flex: field.flex || 0,
                    widget: this.getFieldWidget(field, modelField),
                };
            }
        }
    }
    private getFieldWidget(field: IEntityViewField, modelField: IEntityField): string {
        if (field.widget) {
            return field.widget;
        }
        if (!modelField) {
            return 'none';
        }

        const typer = this._typeRegistry.getFieldTyper(modelField.type);
        if (typer) {
            return typer.getDefaultWidgetType(this._view.viewType);
        }

        switch (modelField.type) {
            case 'string':
                return 'textfield';
            case 'number':
                return 'number';
            case 'boolean':
                return 'switch';
            case 'date':
                return 'date';
            case 'enum':
            case 'array':
                return 'select';
            case 'one_to_many':
                return 'reference';
            case 'many_to_many':
                return 'reference';
            case 'many_to_one':
            case 'one_to_one':
                return 'select';
            default:
                return 'none';
        }
    }
}
