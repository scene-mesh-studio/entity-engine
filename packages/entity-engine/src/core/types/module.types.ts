import type { IEntityServlet } from './servlet.types';
import type { IEntityActionHandler } from './action.types';
import type { IEntityView, IEntityModel } from '../../types';
import type { EntityEvent, IEntityEventListener } from './event.types';
import type { EntityView, EntityWidget, IEntityNamedRenderer } from '../../components';

export interface ImportReferenceData {
    fromFieldName: string;
    toObjectId: string;
}

export interface ImportEntityData {
    id: string;
    modelName: string;
    values: Record<string, any>;
    references?: ImportReferenceData[];
}

export type EntityModuleInfo = {
    name: string;
    description: string;
    provider: string;
    version: string;
    url?: string | undefined;
    dependencies?: string[] | undefined;
};

export interface IEntityModule {
    readonly info: EntityModuleInfo;

    setupConfig(args: {
        models: IEntityModel[];
        views: IEntityView[];
        eventHandlers: { focusEventNames: string[]; handler: IEntityEventListener<EntityEvent> }[];
        actionHandlers: IEntityActionHandler[];
        servlets: IEntityServlet[];
    }): Promise<void>;

    setupComponents(args: {
        views: EntityView[];
        renderers: IEntityNamedRenderer[];
        widgets: EntityWidget[];
    }): Promise<void>;

    setupData(args: { entities: ImportEntityData[] }): Promise<void>;
}

export interface IEntityModuleRegistry {
    registerModule(
        module: IEntityModule | string,
        clientSide?: boolean
    ): Promise<IEntityModule[] | undefined>;
    getModule(name: string): IEntityModule | undefined;
    getAllModules(): IEntityModule[];
}
