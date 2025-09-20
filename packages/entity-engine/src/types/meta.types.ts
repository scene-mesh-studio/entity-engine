import type { ZodTypeAny } from 'zod';

export type EntityFieldType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'enum'
    | 'array'
    | 'json'
    | 'binary'
    | 'one_to_one'
    | 'one_to_many'
    | 'many_to_many'
    | 'many_to_one';

export type EntityViewDensity = 'small' | 'medium' | 'large';

type OptionPrimitive = string | number | boolean | undefined;

export type OptionValue = OptionPrimitive | OptionPrimitive[] | Options | Options[];

export interface Options extends Record<string, OptionValue> {
    [key: string]: OptionValue;
}

export interface IEntityField {
    name: string;
    title: string;
    type: EntityFieldType;
    typeOptions?: Options;
    description?: string;
    defaultValue?: any;
    isRequired?: boolean;
    isPrimaryKey?: boolean;
    isUnique?: boolean;
    editable?: boolean;
    searchable?: boolean;
    refModel?: string;
    refField?: string;
    schema?: ZodTypeAny;
    order?: number;
}

export interface IEntityModelExternalConfig {
    type: string;
    url: string;
    tableName: string;
    mappings: Array<{ local: string; remote: string }>;
    features: string[];
}

export interface IEntityModel {
    name: string;
    title: string;
    description?: string;
    fields: IEntityField[];
    external?: boolean;
    externalConfig?: IEntityModelExternalConfig;
}

export interface IEntityViewField {
    name: string;
    title?: string;
    description?: string;
    icon?: string;
    widget?: string;
    widgetOptions?: Options;
    width?: number;
    flex?: 1 | 0;
    spanCols?: number;
    order?: number;
    fields?: IEntityViewField[];

    hiddenWhen?: string;
    showWhen?: string;
    requiredWhen?: string;

    readOnlyWhen?: string;
    disabledWhen?: string;
}

export interface IEntityGridViewHilite {
    when: string;
    color: string;
}

export interface IEntityViewPanel extends IEntityViewField {
    fields: IEntityViewField[];
}

export interface IEntityViewReference extends IEntityViewField {
    referenceView?: { modelName: string; viewType: string };
    referenceComp?: { moudlePath: string; componentName: string };
    fields?: IEntityViewField[];
}

export interface IEntityView {
    name: string;
    title: string;
    description?: string;
    modelName: string;
    viewType: string;
    viewOptions?: Options;
    items: IEntityViewField[];
    hilites?: IEntityGridViewHilite[];
    canEdit?: boolean;
    canNew?: boolean;
    canDelete?: boolean;
    density?: EntityViewDensity;
}

// export interface IEntityViewAction {
//     type: string;
//     payload?: { [key: string]: any };
//     icon?: string;
// }

// export interface IEntityViewMenuItem {
//     name: string;
//     title: string;
//     icon?: string;
//     items?: IEntityViewMenuItem[];
//     action?: IEntityViewAction;
// }
