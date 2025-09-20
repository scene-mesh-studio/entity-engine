import type { IEntityEventRegistry } from './event.types';
import type { IEntityMetaRegistry } from './delegate.types';
import type { IEntityModuleRegistry } from './module.types';
import type { IEntityActionRegistry } from './action.types';
import type { IEntitySessionManager } from './session.types';
import type { IModelFieldTyperRegistry } from './field.types';
import type { IEntityServletRegistry } from './servlet.types';
import type { IEntityComponentRegistry } from '../../components';
import type { IEntityDataSourceFactory } from './datasource.types';

export interface IEntityEngineInitializer {
    init(engine: IEntityEngine): Promise<void>;
}

export interface IEntityEnginePrimitiveInitializer {
    init(engine: IEntityEnginePrimitive): Promise<void>;
}

export interface IEntityEngineSettings {
    get baseUrl(): string;
    get endpoint(): string;
    setBaseUrl(baseUrl: string): void;
    setEndpoint(endpoint: string): void;
    getUrl(path: string): string;

    get authenticationEnabled(): boolean;
    set authenticationEnabled(value: boolean);
}

export interface IEntityEnginePrimitive {
    get metaRegistry(): IEntityMetaRegistry;
    get fieldTyperRegistry(): IModelFieldTyperRegistry;
    get moduleRegistry(): IEntityModuleRegistry;
    get eventRegistry(): IEntityEventRegistry;
    get actionRegistry(): IEntityActionRegistry;
    get servletRegistry(): IEntityServletRegistry;
    get datasourceFactory(): IEntityDataSourceFactory;
    get sessionManager(): IEntitySessionManager;
    get settings(): IEntityEngineSettings;
    get createTime(): number;
    toString(): string;
    get version(): string;
    get isClientSide(): boolean;
}

export interface IEntityEngine extends IEntityEnginePrimitive {
    get componentRegistry(): IEntityComponentRegistry;
}

export interface IEntityEngineWatcher {
    onEntityEngineBeforeInit(args: {
        engine: IEntityEnginePrimitive | IEntityEngine;
        clientSide: boolean;
    }): Promise<void>;
    onEntityEngineAfterInit(args: {
        engine: IEntityEnginePrimitive | IEntityEngine;
        clientSide: boolean;
    }): Promise<void>;
}
