import type { IEntityModule, IEntityModuleRegistry } from '../types/module.types';

export class EntityModuleRegistry implements IEntityModuleRegistry {
    #modules: IEntityModule[];

    constructor() {
        this.#modules = [];
    }

    private async loadModuleByName(
        name: string
    ): Promise<IEntityModule | IEntityModule[] | undefined> {
        const url = new URL(`https://esm.sh/${name}/dist/index.js`);
        try {
            const md = await import(/* @vite-ignore */ /* webpackIgnore: true */ url.href);
            if (md && 'default' in md) {
                return md.default;
            } else {
                return undefined;
            }
        } catch (e) {
            console.error(e);
            return undefined;
        }
    }

    private async loadModuleOnServer(
        name: string
    ): Promise<IEntityModule | IEntityModule[] | undefined> {
        try {
            const md = await import(/* @vite-ignore */ /* webpackIgnore: true */ name);
            if (md && 'default' in md) {
                return md.default;
            } else {
                return undefined;
            }
        } catch (e) {
            console.error(e);
            return undefined;
        }
    }

    async registerModule(
        module: IEntityModule | string,
        clientSide?: boolean
    ): Promise<IEntityModule[] | undefined> {
        if (typeof module === 'object') {
            const existModule = this.#modules.find((m) => m.info.name === module.info.name);
            if (!existModule) {
                this.#modules.push(module);
            }
            return [module];
        } else if (typeof module === 'string') {
            const addModules = [];
            try {
                const mod = clientSide
                    ? await this.loadModuleByName(module)
                    : await this.loadModuleOnServer(module);
                if (Array.isArray(mod)) {
                    for (const m of mod) {
                        if (this.isEntityModule(m)) {
                            const existModule = this.#modules.find(
                                (em) => em.info.name === m.info.name
                            );
                            if (!existModule) {
                                this.#modules.push(m);
                                addModules.push(m);
                            }
                        }
                    }
                } else {
                    const m = mod;
                    if (this.isEntityModule(m)) {
                        const existModule = this.#modules.find(
                            (em) => em.info.name === m.info.name
                        );
                        if (!existModule) {
                            this.#modules.push(m);
                            addModules.push(m);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
            return addModules;
        }
        return undefined;
    }

    private isEntityModule(val: unknown): val is IEntityModule {
        if (!val || typeof val !== 'object') return false;
        const m = val as any;
        return (
            typeof m.setupConfig === 'function' &&
            typeof m.setupComponents === 'function' &&
            m.info != null &&
            typeof m.info === 'object' &&
            typeof m.info.name === 'string'
        );
    }

    getModule(name: string): IEntityModule | undefined {
        return this.#modules.find((m) => m.info.name === name);
    }
    getAllModules(): IEntityModule[] {
        return this.#modules;
    }
}
