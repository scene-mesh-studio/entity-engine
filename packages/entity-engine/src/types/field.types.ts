import type { ZodTypeAny } from 'zod';
import type { IEntityFieldDelegate } from '../core';
import type { IEntityQueryItemMeta } from './data.types';

export interface IModelFieldTyper {
    get title(): string;
    get type(): string;
    get description(): string;
    getDefaultValue(field: IEntityFieldDelegate): any;
    getDefaultSchema(field: IEntityFieldDelegate): ZodTypeAny;
    getQueryItemMeta(field: IEntityFieldDelegate): IEntityQueryItemMeta | undefined;
    getDefaultWidgetType(viewType: string): string;
}
