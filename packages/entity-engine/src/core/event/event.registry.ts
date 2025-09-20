import type {
    EntityEvent,
    IEntityEventListener,
    IEntityEventRegistry,
    IEntityEventNextDispatcher,
} from '../types';

class EntityEventDispatchChain {
    #listeners: IEntityEventListener[];
    #event: EntityEvent;
    #dispathIndex: number = 0;
    constructor(event: EntityEvent, listeners: IEntityEventListener[]) {
        this.#event = event;
        this.#listeners = listeners;
    }

    async dispatch(): Promise<void> {
        console.log(
            `Dispatching event: ${this.#event.name} to ${this.#listeners.length} listeners.`
        );
        if (this.#listeners.length === 0) {
            return;
        }
        await this.next();
    }

    async next(): Promise<void> {
        if (this.#dispathIndex >= this.#listeners.length) {
            return;
        }
        const listener = this.#listeners[this.#dispathIndex];
        const next: IEntityEventNextDispatcher = {
            dispatch: this.next.bind(this),
        };
        try {
            await listener(this.#event, next);
        } catch (error) {
            console.error(`Error in listener for event ${this.#event.name}:`, error);
        }
        this.#dispathIndex++;
    }
}

export class EntityEventRegistry implements IEntityEventRegistry {
    private listeners: Record<string, IEntityEventListener[]> = {};
    constructor() {
        // Initialize the listeners object
    }

    registerListener(eventName: string, listener: IEntityEventListener): void {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(listener);
    }
    unregisterListener(eventName: string, listener: IEntityEventListener): void {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter((l) => l !== listener);
        }
    }
    emit(event: EntityEvent): void {
        console.log(`Emitting event: ${event.name}`);
        const listeners = this.listeners[event.name];
        if (listeners) {
            new EntityEventDispatchChain(event, listeners).dispatch();
        }
    }
    getListeners(eventName: string): IEntityEventListener[] {
        return this.listeners[eventName] || [];
    }
}
