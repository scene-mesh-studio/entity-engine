import type {
    EntityView,
    IEntityNamedRenderer,
    IEntityViewController,
    IEntityComponentRegistry,
    IEntityComponentSuiteAdapter,
} from './types';

import { FormView } from './views/form/form.view';
import { GridView } from './views/grid/grid.view';
import { ShellView } from './views/shell/shell.view';
import { KanbanView } from './views/kanban/kanban.view';
import { EntityBuildinSuiteAdapter } from '../build-ins';
import { MasterDetailView } from './views/mastail/mastail.view';
import { DashboardView } from './views/dashboard/dashboard.view';

export class EntityComponentRegistry implements IEntityComponentRegistry {
    private _viewMap: Map<string, EntityView>;
    private _viewFuncMap: Map<string, () => EntityView> = new Map();
    private _suiteAdapters: Map<string, IEntityComponentSuiteAdapter>;
    private _renderers: IEntityNamedRenderer[] = [];
    private _viewControllers: Map<string, IEntityViewController>;

    constructor() {
        this._viewMap = new Map();
        this._suiteAdapters = new Map();
        this._viewControllers = new Map();

        this.registerView(new FormView());
        this.registerView(new GridView());
        this.registerView(new MasterDetailView());
        this.registerView(new ShellView());
        this.registerView(new KanbanView());
        this.registerView(new DashboardView());

        this.registerAdapter(new EntityBuildinSuiteAdapter());
    }

    getView(viewName: string): EntityView | undefined {
        if (this._viewMap.has(viewName)) return this._viewMap.get(viewName);
        const viewFunc = this._viewFuncMap.get(viewName);
        if (viewFunc) {
            const view = viewFunc();
            this.registerView(view);
            return view;
        }
        return undefined;
    }

    getViews(): EntityView[] {
        return Array.from(this._viewMap.values());
    }

    registerView(view: EntityView): void {
        this._viewMap.set(view.info.viewName, view);
    }

    registerViewLoader(viewName: string, loader: () => EntityView): void {
        this._viewFuncMap.set(viewName, loader);
    }

    registerAdapter(adapter: IEntityComponentSuiteAdapter): void {
        this._suiteAdapters.set(adapter.suiteName, adapter);
    }
    getAdapter(suiteName: string): IEntityComponentSuiteAdapter | undefined {
        return this._suiteAdapters.get(suiteName);
    }
    getAdapters(): IEntityComponentSuiteAdapter[] {
        return Array.from(this._suiteAdapters.values());
    }

    registerRenderer(renderer: IEntityNamedRenderer): void {
        if (!this._renderers.some((r) => r.name === renderer.name)) {
            this._renderers.push(renderer);
        }
    }

    getRenderer(name: string): IEntityNamedRenderer | undefined {
        return this._renderers.find((renderer) => renderer.name === name);
    }

    getRenderersBySlot(slotName: string): IEntityNamedRenderer[] {
        return this._renderers.filter((renderer) => renderer.slotName === slotName);
    }

    registerViewController(controller: IEntityViewController): void {
        this._viewControllers.set(controller.viewId, controller);
    }

    unregisterViewController(viewId: string): void {
        this._viewControllers.delete(viewId);
    }

    getViewController(
        modelName?: string,
        viewType?: string,
        viewId?: string
    ): IEntityViewController | undefined {
        if (viewId) {
            return this._viewControllers.get(viewId);
        }
        return Array.from(this._viewControllers.values()).find(
            (controller) =>
                (!modelName || controller.modelName === modelName) &&
                (!viewType || controller.viewType === viewType)
        );
    }

    getAllViewControllers(): IEntityViewController[] {
        return Array.from(this._viewControllers.values());
    }
}
