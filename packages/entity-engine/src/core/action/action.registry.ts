import type { IEntityActionHandler, IEntityActionRegistry, IEntityRequestHandler } from '../types';

export class EntityActionRegistry implements IEntityActionRegistry {
    #actionHandlers: Map<string, IEntityActionHandler>;
    #requestHandlers: Map<string, IEntityRequestHandler>;

    constructor() {
        this.#actionHandlers = new Map();
        this.#requestHandlers = new Map();
    }

    registerActionHandler(handler: IEntityActionHandler): void {
        const actionNames = handler.actionNames;
        if (actionNames) {
            for (const actionName of actionNames) {
                this.#actionHandlers.set(actionName, handler);
            }
        }
    }
    getActionHandler<T = any, R = any>(actionName: string): IEntityActionHandler<T, R> | undefined {
        return this.#actionHandlers.get(actionName) as IEntityActionHandler<T, R> | undefined;
    }

    registerRequestHandler(handler: IEntityRequestHandler): void {
        this.#requestHandlers.set(handler.pathStartWith, handler);
    }
    getRequestHandler(path: string): IEntityRequestHandler | undefined {
        return this.#requestHandlers.get(path);
    }
}
