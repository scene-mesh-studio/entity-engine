import type {
    EntityView,
    IEntityView,
    EntityEvent,
    EntityWidget,
    IEntityModel,
    IEntityModule,
    ImportEntityData,
    IEntityNamedRenderer,
    IEntityEventListener,
    IEntityActionHandler,
} from '@scenemesh/entity-engine';

import info from './module.json';
import { views, models } from './config/config';

export class EntityBaseModule implements IEntityModule {
    readonly info = info;

    setupConfig(args: {
        models: IEntityModel[];
        views: IEntityView[];
        eventHandlers: { focusEventNames: string[]; handler: IEntityEventListener<EntityEvent> }[];
        actionHandlers: IEntityActionHandler[];
    }): Promise<void> {
        args.models.push(...models);
        args.views.push(...views);

        args.eventHandlers.push({
            focusEventNames: ['entityObject.updated', 'entityObject.created'],
            handler: async (event) => {
                console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> focus', event);
            },
        });

        return Promise.resolve();
    }
    async setupComponents(args: {
        views: EntityView[];
        renderers: IEntityNamedRenderer[];
        widgets: EntityWidget[];
    }): Promise<void> {
        const splashViewClass = await import('./views/splash/splash.view');
        const splashView = new splashViewClass.SplashView();
        args.views.push(splashView as EntityView);

        const authViewClass = await import('./views/auth/auth.view');
        const authView = new authViewClass.AuthView();
        args.views.push(authView as EntityView);

        return Promise.resolve();
    }

    async setupData(args: { entities: ImportEntityData[] }): Promise<void> {
        console.log('BuildinModule: setupData called');
        // 在这里处理导入的实体数据
    }
}

// declare module '@scenemesh/entity-engine' {
//     interface IEntityContextTypeRegistry {
//         'session': SessionContext;
//     }
// }
