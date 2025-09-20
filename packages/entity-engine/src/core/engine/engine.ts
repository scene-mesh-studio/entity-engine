import type { IEntityComponentRegistry } from '../../components';
import type { IEntityModuleRegistry } from '../types/module.types';
import type {
    IEntityEngine,
    IEntityMetaRegistry,
    IEntityEventRegistry,
    IEntityActionRegistry,
    IEntitySessionManager,
    IEntityEngineSettings,
    IEntityServletRegistry,
    IEntityDataSourceFactory,
    IModelFieldTyperRegistry,
    IEntityEngineInitializer,
} from '../../core';

// 通过导入本包的 package.json 以获取版本号
import pkg from '../../../package.json';
import { entityEngineWatcher } from '../watcher';
import { EntityComponentRegistry } from '../../components';
import { EntityModuleRegistry } from '../module/module.registry';
import { EntityServletRegistry } from '../servlet/servlet.registry';
import {
    EntityMetaRegistry,
    EntityEventRegistry,
    EntityActionRegistry,
    EntitySessionManager,
    ModelFieldTyperRegistry,
    EntityDataSourceFactory,
} from '../../core';

class EntityEngineSettings implements IEntityEngineSettings {
    private _baseUrl: string = '';
    private _endpoint: string = '';
    private _authenticationEnabled: boolean = false;

    get baseUrl(): string {
        return this._baseUrl;
    }
    get endpoint(): string {
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

export class EntityEngine implements IEntityEngine {
    private _metaRegistry: IEntityMetaRegistry;
    private _fieldTyperRegistry: IModelFieldTyperRegistry;
    private _moduleRegistry: IEntityModuleRegistry;
    private _datasourceFactory: IEntityDataSourceFactory;
    private _eventRegistry: IEntityEventRegistry;
    private _actionRegistry: IEntityActionRegistry;
    private _servletRegistry: IEntityServletRegistry;
    private _sessionManager: IEntitySessionManager;
    private _componentRegistry: IEntityComponentRegistry;
    private _settings: IEntityEngineSettings;
    private _createTime: number = 0;

    constructor(
        metaRegistry: IEntityMetaRegistry,
        fieldTyperRegistry: IModelFieldTyperRegistry,
        moduleRegistry: IEntityModuleRegistry,
        datasourceFactory: IEntityDataSourceFactory,
        eventRegistry: IEntityEventRegistry,
        actionRegistry: IEntityActionRegistry,
        servletRegistry: IEntityServletRegistry,
        sessionManager: IEntitySessionManager,
        renderRegistry: IEntityComponentRegistry,
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
        this._componentRegistry = renderRegistry;
        this._settings = settings;
        this._createTime = Date.now();
    }

    get metaRegistry(): IEntityMetaRegistry {
        return this._metaRegistry;
    }

    get fieldTyperRegistry(): IModelFieldTyperRegistry {
        return this._fieldTyperRegistry;
    }

    get moduleRegistry(): IEntityModuleRegistry {
        return this._moduleRegistry;
    }

    get datasourceFactory(): IEntityDataSourceFactory {
        return this._datasourceFactory;
    }

    get eventRegistry(): IEntityEventRegistry {
        return this._eventRegistry;
    }

    get actionRegistry(): IEntityActionRegistry {
        return this._actionRegistry;
    }

    get servletRegistry(): IEntityServletRegistry {
        return this._servletRegistry;
    }

    get sessionManager(): IEntitySessionManager {
        return this._sessionManager;
    }

    get componentRegistry(): IEntityComponentRegistry {
        return this._componentRegistry;
    }

    get isClientSide(): boolean {
        return typeof window !== 'undefined';
    }

    get createTime(): number {
        return this._createTime;
    }

    toString(): string {
        return `EntityEngine { metaRegistry: models=${this._metaRegistry.models.length}, views=${this._metaRegistry.views.length}, fieldTyperRegistry: ${this._fieldTyperRegistry.getFieldTypers().length}, componentRegistry: views=${this._componentRegistry.getViews().length} adapters=${this._componentRegistry.getAdapters().length}, createTime: ${this._createTime} }`;
    }
    get version(): string {
        return pkg.version;
    }

    get settings(): IEntityEngineSettings {
        return this._settings;
    }

    private static instance: IEntityEngine | null = null;
    private static instancePromise: Promise<IEntityEngine> | null = null;

    public static async getInstance(
        initializer?: IEntityEngineInitializer
    ): Promise<IEntityEngine> {
        if (!EntityEngine.instancePromise) {
            EntityEngine.instancePromise = (async () => {
                if (!initializer) {
                    throw new Error(
                        'Engine has not been initialized. You must provide an initializer function on the first call to getInstance().'
                    );
                }
                if (!EntityEngine.instance) {
                    EntityEngine.instance = await createEntityEngine(initializer);
                }
                return EntityEngine.instance;
            })();
        }
        return EntityEngine.instancePromise;
    }
}

const createEntityEngine = async (
    initializer?: IEntityEngineInitializer
): Promise<IEntityEngine> => {
    const eventRegistry: IEntityEventRegistry = new EntityEventRegistry();
    const fieldTyperRegistry: IModelFieldTyperRegistry = new ModelFieldTyperRegistry();
    const metaRegistry: IEntityMetaRegistry = new EntityMetaRegistry(
        fieldTyperRegistry,
        eventRegistry
    );
    const moduleRegistry: IEntityModuleRegistry = new EntityModuleRegistry();
    const settings: IEntityEngineSettings = new EntityEngineSettings();
    const datasourceFactory: IEntityDataSourceFactory = new EntityDataSourceFactory(settings);
    const componentRegistry: IEntityComponentRegistry = new EntityComponentRegistry();
    const actionRegistry = new EntityActionRegistry();
    const servletRegistry = new EntityServletRegistry();
    const sessionManager = new EntitySessionManager(settings);
    const engine = new EntityEngine(
        metaRegistry,
        fieldTyperRegistry,
        moduleRegistry,
        datasourceFactory,
        eventRegistry,
        actionRegistry,
        servletRegistry,
        sessionManager,
        componentRegistry,
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

export const getEntityEngine = EntityEngine.getInstance;
