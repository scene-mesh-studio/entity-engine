import type { IEntityView, IEntityModel } from '../../types';
import type {
    IEntityMetaRegistry,
    IEntityViewDelegate,
    IEntityEventEmitter,
    IEntityModelDelegate,
    IModelFieldTyperRegistry,
} from '../types';

import { EntityViewDelegate, EntityModelDelegate } from './delegate';
import {
    serializeEntityView,
    serializeEntityModel,
    deserializeEntityView,
    deserializeEntityModel,
} from './meta.serializer';

export class EntityMetaRegistry implements IEntityMetaRegistry {
    private _typeRegistry: IModelFieldTyperRegistry;
    private _models: Map<string, IEntityModelDelegate> = new Map();
    private _views: Map<string, IEntityViewDelegate> = new Map();
    private _eventEmitter: IEntityEventEmitter;

    constructor(typeRegistry: IModelFieldTyperRegistry, eventEmitter: IEntityEventEmitter) {
        this._typeRegistry = typeRegistry;
        this._eventEmitter = eventEmitter;
    }

    getModel(name: string): IEntityModelDelegate | undefined {
        return this._models.get(name);
    }

    get models(): IEntityModelDelegate[] {
        return Array.from(this._models.values());
    }

    get views(): IEntityViewDelegate[] {
        return Array.from(this._views.values());
    }

    getView(name: string): IEntityViewDelegate | undefined {
        return this._views.get(name);
    }

    cleanup(): void {
        this._models.clear();
        this._views.clear();
    }

    findView(modelName: string, viewType: string, name?: string): IEntityViewDelegate | undefined {
        let _view: IEntityViewDelegate | undefined = undefined;
        if (name) {
            _view = this._views.get(name);
        }
        if (!_view) {
            const values = Array.from(this._views.values());
            _view = values.find(
                (view) => view.modelName === modelName && view.viewType === viewType
            );
        }
        if (!_view) {
            const m = this.getModel(modelName);
            if (m) {
                const _viewData: IEntityView = {
                    name: `${modelName}-${viewType}`,
                    title: `${m.title}`,
                    description: `${m.description}`,
                    modelName: m.name,
                    viewType,
                    density: 'medium',
                    items: m.fields.map((field) => ({
                        name: field.name,
                        title: field.title,
                        description: field.description,
                        order: field.order || 0,
                        flex: 0,
                    })),
                };
                _view = new EntityViewDelegate(_viewData, this, this._typeRegistry);
            }
        }
        return _view;
    }

    registerModel(model: IEntityModel): void {
        if (!model) {
            throw new Error('Model cannot be undefined or null');
        }
        if (!model.name) {
            throw new Error('Model must have a name');
        }
        this._models.set(model.name, new EntityModelDelegate(model, this._typeRegistry));
    }

    registerView(view: IEntityView): void {
        if (!view) {
            throw new Error('View cannot be undefined or null');
        }
        if (!view.modelName || !view.name || !view.viewType) {
            throw new Error('View must have modelName, name, and viewType defined');
        }
        this._views.set(view.name, new EntityViewDelegate(view, this, this._typeRegistry));
    }

    toPlainModelObject(model: IEntityModelDelegate): Record<string, any> {
        return serializeEntityModel(model);
    }

    toPlainViewObject(view: IEntityViewDelegate): Record<string, any> {
        return serializeEntityView(view.toSupplementedView());
    }

    updateOrRegisterByPlainObject(config: { models: any[]; views: any[] }): void {
        let ref = 0;
        if (Array.isArray(config.models)) {
            config.models.forEach((m) => {
                const model = deserializeEntityModel(JSON.stringify(m));
                if (model) {
                    if (this.getModel(model.name)) {
                        this._models.delete(model.name);
                    }
                    this.registerModel(model);
                    ref++;
                }
            });
        }
        if (Array.isArray(config.views)) {
            config.views.forEach((v) => {
                const view = deserializeEntityView(JSON.stringify(v));
                console.log(`Deserialized view:`, view);
                if (view) {
                    if (this.getView(view.name)) {
                        this._views.delete(view.name);
                    }
                    this.registerView(view);
                    ref++;
                }
            });
        }
        if (ref > 0) {
            this._eventEmitter.emit({
                name: 'config.updated',
                parameter: {
                    modelIds: config.models?.map((m) => m.name) || [],
                    viewIds: config.views?.map((v) => v.name) || [],
                },
            });
        }
    }

    toJSONString(): string {
        const models = this.models.map((model) => serializeEntityModel(model));
        const views = this.views.map((view) => serializeEntityView(view));
        return JSON.stringify({ models, views });
    }

    fromJSONString(json: string): void {
        if (!json) return;
        try {
            const obj = JSON.parse(json);
            if (!obj || typeof obj !== 'object') return;
            const { models, views } = obj as { models?: any[]; views?: any[] };

            // 先清空再注册，保持与输入一致
            this.cleanup();

            if (Array.isArray(models)) {
                models.forEach((m, idx) => {
                    try {
                        const model = deserializeEntityModel(JSON.stringify(m));
                        if (model) {
                            this.registerModel(model);
                        }
                    } catch (e) {
                        console.warn('[EntityMetaRegistry] Failed to load model index', idx, e);
                    }
                });
            }

            if (Array.isArray(views)) {
                views.forEach((v, idx) => {
                    try {
                        const view = deserializeEntityView(JSON.stringify(v));
                        if (view) {
                            // 只有在其引用的 model 已加载或为 __default__ 时注册
                            if (view.modelName === '__default__' || this.getModel(view.modelName)) {
                                this.registerView(view);
                            } else {
                                console.warn(
                                    `[EntityMetaRegistry] Skip view '${view.name}' because model '${view.modelName}' not found.`
                                );
                            }
                        }
                    } catch (e) {
                        console.warn('[EntityMetaRegistry] Failed to load view index', idx, e);
                    }
                });
            }
        } catch (e) {
            console.error('[EntityMetaRegistry] fromJSONString parse error:', e);
        }
    }
}
