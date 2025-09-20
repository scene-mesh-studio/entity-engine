import type { IEntityEnginePrimitive } from './engine';

export type EntityAction<T = any> = {
    name: string;
    modelName?: string;
    objectId?: string;
    parameter: T;
};

export type EntityActionResultPayload<T = any> = {
    type: string;
    data?: T;
};

export type EntityActionResult<T = any> = {
    success: boolean;
    message?: string;
    payload: EntityActionResultPayload<T>;
};

export interface IEntityActionHandler<T = any, R = any> {
    actionNames: string[];
    handle: (
        action: EntityAction<T>,
        context: { engine: IEntityEnginePrimitive }
    ) => Promise<EntityActionResult<R>>;
}

export interface IEntityRequestHandler {
    pathStartWith: string;
    handle: (req: Request) => Promise<Response>;
}

export interface IEntityActionRegistry {
    registerActionHandler(handler: IEntityActionHandler): void;
    getActionHandler(actionName: string): IEntityActionHandler | undefined;

    registerRequestHandler(handler: IEntityRequestHandler): void;
    getRequestHandler(path: string): IEntityRequestHandler | undefined;
}
