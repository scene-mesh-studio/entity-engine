import type {
    IEntitySession,
    IEntityEngineSettings,
    IEntitySessionManager,
    IEntitySessionProvider,
} from '../types';

import { DefaultEntitySessionProvider } from './session.provider';

export class EntitySessionManager implements IEntitySessionManager {
    #provider: IEntitySessionProvider | undefined;
    #settings: IEntityEngineSettings;

    constructor(settings: IEntityEngineSettings) {
        this.#settings = settings;
        this.setProvider(new DefaultEntitySessionProvider(this.#settings));
    }

    setProvider(provider: IEntitySessionProvider): void {
        this.#provider = provider;
    }

    getProvider(): IEntitySessionProvider | undefined {
        return this.#provider;
    }

    async getSession(): Promise<IEntitySession> {
        const se = await this.#provider?.session();
        if (se) {
            return se;
        }
        return {
            isAuthenticated: () => false,
            update: () => {},
            updateTime: new Date().getTime(),
        };
    }
}
