import type { IEntityModuleRegistry } from '../types/module.types';
import type {
    IEntityMetaRegistry,
    IEntityEventRegistry,
    IEntityActionRegistry,
    IEntitySessionManager,
    IEntityEngineSettings,
    IEntityEnginePrimitive,
    IEntityServletRegistry,
    IEntityDataSourceFactory,
    IModelFieldTyperRegistry,
    IEntityEnginePrimitiveInitializer,
} from '../types';

import pkg from '../../../package.json';
import { EntityEventRegistry } from '../event';
import { EntityMetaRegistry } from '../delegate';
import { entityEngineWatcher } from '../watcher';
import { EntityActionRegistry } from '../action';
import { EntitySessionManager } from '../session';
import { EntityServletRegistry } from '../servlet';
import { ModelFieldTyperRegistry } from '../fieldtypes';
import { EntityDataSourceFactory } from '../datasources';
import { EntityModuleRegistry } from '../module/module.registry';

class EntityEngineSettings implements IEntityEngineSettings {
    private _baseUrl = '';
    private _endpoint = '';
    private _authenticationEnabled: boolean = false;
    get baseUrl() {
        return this._baseUrl;
    }
    get endpoint() {
        return this._endpoint;
    }
    setBaseUrl(baseUrl: string): void {
        this._baseUrl = baseUrl;
    }
    setEndpoint(endpoint: string): void {
        this._endpoint = endpoint;
    }
    getUrl(path: string): string {
        if (this._endpoint) {
            return `${this._baseUrl.replace(/\/$/, '')}/${this._endpoint.replace(/^\//, '').replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
        }
        return `${this._baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    }
    get authenticationEnabled(): boolean {
        return this._authenticationEnabled;
    }
    set authenticationEnabled(value: boolean) {
        this._authenticationEnabled = value;
    }
}

export class EntityEnginePrimitive implements IEntityEnginePrimitive {
    private _metaRegistry: IEntityMetaRegistry;
    private _fieldTyperRegistry: IModelFieldTyperRegistry;
    private _moduleRegistry: IEntityModuleRegistry;
    private _datasourceFactory: IEntityDataSourceFactory;
    private _eventRegistry: IEntityEventRegistry;
    private _actionRegistry: IEntityActionRegistry;
    private _servletRegistry: IEntityServletRegistry;
    private _sessionManager: IEntitySessionManager;
    private _settings: IEntityEngineSettings;
    private _createTime = 0;

    constructor(
        metaRegistry: IEntityMetaRegistry,
        fieldTyperRegistry: IModelFieldTyperRegistry,
        moduleRegistry: IEntityModuleRegistry,
        datasourceFactory: IEntityDataSourceFactory,
        eventRegistry: IEntityEventRegistry,
        actionRegistry: IEntityActionRegistry,
        servletRegistry: IEntityServletRegistry,
        sessionManager: IEntitySessionManager,
        settings: IEntityEngineSettings
    ) {
        this._metaRegistry = metaRegistry;
        this._fieldTyperRegistry = fieldTyperRegistry;
        this._moduleRegistry = moduleRegistry;
        this._datasourceFactory = datasourceFactory;
        this._eventRegistry = eventRegistry;
        this._actionRegistry = actionRegistry;
        this._servletRegistry = servletRegistry;
        this._sessionManager = sessionManager;
        this._settings = settings;
        this._createTime = Date.now();
    }
    get moduleRegistry(): IEntityModuleRegistry {
        return this._moduleRegistry;
    }

    get metaRegistry() {
        return this._metaRegistry;
    }
    get fieldTyperRegistry() {
        return this._fieldTyperRegistry;
    }

    get datasourceFactory() {
        return this._datasourceFactory;
    }

    get eventRegistry() {
        return this._eventRegistry;
    }
    get actionRegistry() {
        return this._actionRegistry;
    }
    get servletRegistry() {
        return this._servletRegistry;
    }
    get sessionManager() {
        return this._sessionManager;
    }
    get settings() {
        return this._settings;
    }
    get createTime() {
        return this._createTime;
    }
    toString() {
        return `EntityEnginePrimitive { metaRegistry: models=${this._metaRegistry.models.length}, views=${this._metaRegistry.views.length} }`;
    }
    get version() {
        return pkg.version;
    }

    get isClientSide(): boolean {
        return typeof window !== 'undefined';
    }

    private static instance: IEntityEnginePrimitive | null = null;
    private static instancePromise: Promise<IEntityEnginePrimitive> | null = null;

    public static async getInstance(
        initializer?: IEntityEnginePrimitiveInitializer
    ): Promise<IEntityEnginePrimitive> {
        if (!EntityEnginePrimitive.instancePromise) {
            EntityEnginePrimitive.instancePromise = (async () => {
                if (!initializer) {
                    throw new Error(
                        'Engine has not been initialized. You must provide an initializer function on the first call to getInstance().'
                    );
                }
                if (!EntityEnginePrimitive.instance) {
                    EntityEnginePrimitive.instance = await createEntityEnginePrimitive(initializer);
                }
                return EntityEnginePrimitive.instance;
            })();
        }
        return EntityEnginePrimitive.instancePromise;
    }
}

const createEntityEnginePrimitive = async (
    initializer?: IEntityEnginePrimitiveInitializer
): Promise<IEntityEnginePrimitive> => {
    const eventRegistry: IEntityEventRegistry = new EntityEventRegistry();
    const fieldTyperRegistry: IModelFieldTyperRegistry = new ModelFieldTyperRegistry();
    const metaRegistry: IEntityMetaRegistry = new EntityMetaRegistry(
        fieldTyperRegistry,
        eventRegistry
    );
    const moduleRegistry: IEntityModuleRegistry = new EntityModuleRegistry();
    const settings: IEntityEngineSettings = new EntityEngineSettings();
    const datasourceFactory: IEntityDataSourceFactory = new EntityDataSourceFactory(settings);
    const actionRegistry = new EntityActionRegistry();
    const servletRegistry = new EntityServletRegistry();
    const sessionManager = new EntitySessionManager(settings);
    const engine = new EntityEnginePrimitive(
        metaRegistry,
        fieldTyperRegistry,
        moduleRegistry,
        datasourceFactory,
        eventRegistry,
        actionRegistry,
        servletRegistry,
        sessionManager,
        settings
    );
    if (initializer) {
        await entityEngineWatcher.onEntityEngineBeforeInit({
            engine,
            clientSide: typeof window !== 'undefined',
        });
        await initializer.init(engine);
        await entityEngineWatcher.onEntityEngineAfterInit({
            engine,
            clientSide: typeof window !== 'undefined',
        });
    }
    return engine;
};

export const getEntityEnginePrimitive = EntityEnginePrimitive.getInstance;
