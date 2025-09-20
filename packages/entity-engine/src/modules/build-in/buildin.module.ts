import type { IEntityView, IEntityModel } from '../../types';
import type { IEntityModule, IEntityServlet, ImportEntityData } from '../../core';
import type { EntityView, EntityWidget, IEntityNamedRenderer } from '../../components';

import info from './module.json';
import { views, models } from './config/config';

const servletHandler: IEntityServlet = {
    path: '/ttt',
    methods: ['GET', 'POST'],
    async handle(req, res) {
        console.log('BuildinModule: handleRequest called');
        res.write(new Response(`Hello from BuildinModule servlet! ${req.endpoint}`));
    },
};
export class BuildinModule implements IEntityModule {
    readonly info = info;

    async setupConfig(args: {
        models: IEntityModel[];
        views: IEntityView[];
        servlets: IEntityServlet[];
    }): Promise<void> {
        console.log('BuildinModule: loadConfig called');
        args.models.push(...models);
        args.views.push(...views);
        args.servlets.push(servletHandler);
    }

    async setupComponents(args: {
        views: EntityView[];
        renderers: IEntityNamedRenderer[];
        widgets: EntityWidget[];
    }): Promise<void> {
        const authView = await import('./views/auth/auth.view'); // allowImportingTsExtensions 开启时保留 .tsx
        args.views.push(new authView.default() as EntityView);

        const mod = await import('./renderers/auth/shell-settings-target-renderer'); // allowImportingTsExtensions 开启时保留 .tsx
        args.renderers.push(mod.default as IEntityNamedRenderer);

        const menu = await import('./renderers/auth/shell-settings-menu-renderer'); // allowImportingTsExtensions 开启时保留 .tsx
        args.renderers.push(menu.default as IEntityNamedRenderer);

        console.log('BuildinModule: loadComponents called');
    }

    async setupData(args: { entities: ImportEntityData[] }): Promise<void> {
        const demoUser: ImportEntityData = {
            id: '3706a32d89d04423bc84cc1f9366881d',
            modelName: 'ee-base-user',
            values: {
                userName: 'Demo User',
                email: 'demo@demo.com',
                password: 'fe01ce2a7fbac8fafaed7c982a04e229',
                role: [],
            },
        };
        args.entities.push(demoUser);
    }
}
