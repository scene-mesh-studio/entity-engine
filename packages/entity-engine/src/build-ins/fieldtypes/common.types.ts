import type { IEntityFieldDelegate } from '../../core';

import { type ZodTypeAny } from 'zod';

import { type IModelFieldTyper, type IEntityQueryItemMeta } from '../../types';

export abstract class BaseFieldTyper implements IModelFieldTyper {
    #title: string;
    #type: string;
    #description: string;
    #widgetType: string;
    #defaultValue: any;

    constructor(options?: {
        title?: string;
        type?: string;
        widgetType?: string;
        defaultValue?: any;
        description?: string;
    }) {
        this.#title = options?.title || '未命名字段类型';
        this.#type = options?.type || 'base';
        this.#description = options?.description || '基础字段类型，未实现任何功能';
        this.#widgetType = options?.widgetType || 'none';
        this.#defaultValue = options?.defaultValue;
    }

    get title(): string {
        return this.#title;
    }

    get type(): string {
        return this.#type;
    }

    get description(): string {
        return this.#description;
    }

    getDefaultValue(field: IEntityFieldDelegate): any {
        return this.#defaultValue;
    }

    getDefaultWidgetType(viewType: string): string {
        return this.#widgetType;
    }

    abstract getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny;
    abstract getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined;
}
