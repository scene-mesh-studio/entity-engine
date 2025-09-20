import type { IEntityView, IEntityModel, IModelFieldTyper } from '../../types';
import type { IEntityNamedRenderer, IEntityComponentSuiteAdapter } from '../../components';
import type {
    IEntityEngine,
    IEntityModule,
    IEntitySessionProvider,
    IEntityEngineInitializer,
    IEntityEnginePrimitiveInitializer,
} from '../types';

export class EngineInitializer implements IEntityEngineInitializer {
    // private _models: IEntityModel[];
    // private _views: IEntityView[];
    private _config?: { models: IEntityModel[]; views: IEntityView[] };
    private _suiteAdapters: IEntityComponentSuiteAdapter[] | undefined;
    private _renderers: IEntityNamedRenderer[] | undefined;
    private _fieldTypers: IModelFieldTyper[] | undefined;
    private _modules: (IEntityModule | string)[] | undefined;
    private _sessionProvider: IEntitySessionProvider | undefined;
    private _settings:
        | { baseUrl?: string; endpoint?: string; authenticationEnabled?: boolean }
        | undefined;

    constructor(args: {
        // models?: IEntityModel[];
        // views?: IEntityView[];
        config?: { models: IEntityModel[]; views: IEntityView[] };
        suiteAdapters?: IEntityComponentSuiteAdapter[];
        renderers?: IEntityNamedRenderer[];
        fieldTypers?: IModelFieldTyper[];
        settings?: { baseUrl?: string; endpoint?: string; authenticationEnabled?: boolean };
        modules?: (IEntityModule | string)[];
        sessionProvider?: IEntitySessionProvider;
    }) {
        // this._models = args.models;
        // this._views = args.views;
        this._config = args.config;
        this._suiteAdapters = args.suiteAdapters;
        this._renderers = args.renderers;
        this._fieldTypers = args.fieldTypers;
        this._settings = args.settings;
        this._modules = args.modules;
        this._sessionProvider = args.sessionProvider;
    }

    async init(engine: IEntityEngine): Promise<void> {
        if (this._config) {
            const { models, views } = this._config;
            if (models.length > 0) {
                for (const model of models) {
                    engine.metaRegistry.registerModel(model);
                }
            }
            if (views.length > 0) {
                for (const view of views) {
                    engine.metaRegistry.registerView(view);
                }
            }
        }

        if (this._suiteAdapters && this._suiteAdapters.length > 0) {
            for (const adapter of this._suiteAdapters) {
                engine.componentRegistry.registerAdapter(adapter);
            }
        }

        if (this._renderers && this._renderers.length > 0) {
            for (const renderer of this._renderers) {
                engine.componentRegistry.registerRenderer(renderer);
            }
        }

        if (this._fieldTypers && this._fieldTypers.length > 0) {
            for (const typer of this._fieldTypers) {
                engine.fieldTyperRegistry.registerFieldTyper(typer);
            }
        }

        if (this._modules && this._modules.length > 0) {
            for (const mod of this._modules) {
                await engine.moduleRegistry.registerModule(mod, true);
            }
        }

        if (this._sessionProvider) {
            engine.sessionManager.setProvider(this._sessionProvider);
        }

        // 应用模块:
        // const modules = engine.moduleRegistry.getAllModules();
        // if (modules) {
        //     for (const module of modules) {
        //         try {
        //             const ms: IEntityModel[] = [];
        //             const vs: IEntityView[] = [];
        //             const ehs: {
        //                 focusEventNames: string[];
        //                 handler: IEntityEventListener<EntityEvent>;
        //             }[] = [];
        //             await module.setupConfig({ models: ms, views: vs, eventHandlers: ehs });
        //             for (const m of ms) {
        //                 engine.metaRegistry.registerModel(m);
        //             }
        //             for (const v of vs) {
        //                 engine.metaRegistry.registerView(v);
        //             }
        //             for (const eh of ehs) {
        //                 for (const eventName of eh.focusEventNames) {
        //                     console.log(
        //                         '################## register event listener',
        //                         eventName,
        //                         eh.handler,
        //                         module.info.name
        //                     );
        //                     engine.eventRegistry.registerListener(eventName, eh.handler);
        //                 }
        //             }
        //         } catch (e) {
        //             console.error(e);
        //         }
        //         try {
        //             const views: EntityView[] = [];
        //             const widgets: EntityWidget[] = [];
        //             const renderers: IEntityNamedRenderer[] = [];
        //             await module.setupComponents({ views, widgets, renderers });
        //             for (const v of views) {
        //                 engine.componentRegistry.registerView(v);
        //             }
        //             // for(const w of widgets){
        //             //     engine.componentRegistry.registerWidget(w);
        //             // }
        //             for (const r of renderers) {
        //                 engine.componentRegistry.registerRenderer(r);
        //             }
        //         } catch (e) {
        //             console.error(e);
        //         }
        //     }
        // }

        if (this._settings) {
            engine.settings.setBaseUrl(this._settings.baseUrl || '');
            engine.settings.setEndpoint(
                this._settings.endpoint || process.env.EE_SERVICE_ROOT_PATH || '/api/ee'
            );
            engine.settings.authenticationEnabled = this._settings.authenticationEnabled || false;
        }

        console.log(
            `Entity Engine initialized with models(${this._config?.models.length || 0}) and views(${this._config?.views.length || 0})`
        );
    }
}

export class EnginePrimitiveInitializer implements IEntityEnginePrimitiveInitializer {
    private _models: IEntityModel[];
    private _views: IEntityView[];
    private _fieldTypers: IModelFieldTyper[] | undefined;
    private _modules: (IEntityModule | string)[] | undefined;
    private _settings:
        | { baseUrl?: string; endpoint?: string; authenticationEnabled?: boolean }
        | undefined;

    constructor(args: {
        models: IEntityModel[];
        views: IEntityView[];
        fieldTypers?: IModelFieldTyper[];
        modules?: (IEntityModule | string)[] | undefined;
        settings?: { baseUrl?: string; endpoint?: string; authenticationEnabled?: boolean };
    }) {
        this._models = args.models;
        this._views = args.views;
        this._fieldTypers = args.fieldTypers;
        this._settings = args.settings;
        this._modules = args.modules;
    }

    async init(engine: IEntityEngine): Promise<void> {
        if (this._models.length > 0) {
            for (const model of this._models) {
                engine.metaRegistry.registerModel(model);
            }
        }
        if (this._views.length > 0) {
            for (const view of this._views) {
                engine.metaRegistry.registerView(view);
            }
        }

        if (this._modules && this._modules.length > 0) {
            for (const mod of this._modules) {
                await engine.moduleRegistry.registerModule(mod);
            }
        }

        if (this._fieldTypers && this._fieldTypers.length > 0) {
            for (const typer of this._fieldTypers) {
                engine.fieldTyperRegistry.registerFieldTyper(typer);
            }
        }

        if (this._settings) {
            engine.settings.setBaseUrl(this._settings.baseUrl || '');
            engine.settings.setEndpoint(
                this._settings.endpoint || process.env.EE_SERVICE_ROOT_PATH || '/api/ee'
            );
            engine.settings.authenticationEnabled = this._settings.authenticationEnabled || false;
        }

        console.log(
            `Entity Engine initialized with models(${this._models.length}) and views(${this._views.length})`
        );
    }
}
