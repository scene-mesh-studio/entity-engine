import type { ZodTypeAny } from 'zod';
import type {
    IEntityView,
    IEntityField,
    IEntityModel,
    IEntityQueryMeta,
    IEntityViewField,
} from '../../types';

export interface IEntityFieldDelegate extends IEntityField {}

export interface IEntityModelDelegate extends IEntityModel {
    findPrimaryKeyFields(): IEntityField[];
    findUniqueFields(): IEntityField[];
    findFieldByName(name: string): IEntityField | undefined;
    findFieldByTitle(title: string): IEntityField | undefined;
    findSearchableFields(): IEntityField[];
    isSupportFeature(feature: string): boolean;
    get schema(): ZodTypeAny;
    toSupplementedValues(input: Record<string, any>): Record<string, any>;
    getQueryMeta(): IEntityQueryMeta;
}

export interface IEntityViewFieldDelegate extends IEntityViewField {}

export interface IEntityViewDelegate extends IEntityView {
    toSupplementedView(viewOptions?: Record<string, any>): IEntityViewDelegate;
}

export interface IEntityMetaRegistry {
    getModel(name: string): IEntityModelDelegate | undefined;
    findView(modelName: string, viewType: string, name?: string): IEntityViewDelegate | undefined;
    getView(name: string): IEntityViewDelegate | undefined;
    get models(): IEntityModelDelegate[];
    get views(): IEntityViewDelegate[];
    registerModel(model: IEntityModel): void;
    registerView(view: IEntityView): void;
    cleanup(): void;

    updateOrRegisterByPlainObject(config: { models: any[]; views: any[] }): void;

    toJSONString(): string;
    toPlainModelObject(model: IEntityModelDelegate): Record<string, any>;
    toPlainViewObject(view: IEntityViewDelegate): Record<string, any>;
    fromJSONString(json: string): void;
}
