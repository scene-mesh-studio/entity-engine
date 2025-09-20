export type EntityEvent<T = any> = {
    name: string;
    modelName?: string;
    objectId?: string;
    parameter: T;
};

export interface IEntityEventEmitter {
    emit(event: EntityEvent): void;
}

export interface IEntityEventNextDispatcher {
    dispatch(): Promise<void>;
}

export interface IEntityEventListener<T = any> {
    (event: EntityEvent<T>, next: IEntityEventNextDispatcher): Promise<void>;
}

export interface IEntityEventRegistry {
    registerListener(eventName: string, listener: IEntityEventListener): void;
    unregisterListener(eventName: string, listener: IEntityEventListener): void;
    emit(event: EntityEvent): void;
    getListeners(eventName: string): IEntityEventListener[];
}
