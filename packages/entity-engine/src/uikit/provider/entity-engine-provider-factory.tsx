import type { ReactNode } from 'react';
import type { IEntityView, IEntityModel, IModelFieldTyper } from '../../types';
import type { IEntityNamedRenderer, IEntityComponentSuiteAdapter } from '../../components';
import type {
    IEntityModule,
    IEntityEngineTheme,
    IEntityEngineRouter,
    IEntityPermissionGuard,
} from '../../core';

import { TRPCReactProvider } from '../../services/api/trpc/react';
import { EngineInitializer } from '../../core/engine/engine.initializer';
import { EntityEngineThemeProvider } from './entity-engine-theme-provider';
import { EntityEngineProvider as InternalProvider } from './client-engine-provider';
import { type AdapterType, EntitySuiteAdapterProvider } from './suite-adapter-provider';

// 定义开发者需要传入的配置对象类型
type EntityEngineInitConfig = {
    config?: { models: IEntityModel[]; views: IEntityView[] };
    suiteAdapters?: IEntityComponentSuiteAdapter[];
    theme?: Partial<IEntityEngineTheme>;
    suiteAdapter?: AdapterType;
    loading?: ReactNode;
    router?: IEntityEngineRouter;
    permissionGuard?: IEntityPermissionGuard;
    renderers?: IEntityNamedRenderer[];
    fieldTypers?: IModelFieldTyper[];
    modules?: (IEntityModule | string)[];
    settings?: {
        baseUrl?: string;
        endpoint?: string;
        authenticationEnabled?: boolean;
    };
};

/**
 * 工厂函数：
 * 接收开发者的配置，然后返回一个已经完全配置好的 Provider 组件。
 */
export function createEntityEngineProvider(config: EntityEngineInitConfig) {
    process.env.EE_SERVICE_ROOT_PATH = config.settings?.endpoint || '/api/ee';

    // 1. 在客户端安全地创建实例，因为配置对象在这里是可用的
    const initializer = new EngineInitializer({
        config: config.config,
        suiteAdapters: config.suiteAdapters,
        renderers: config.renderers,
        fieldTypers: config.fieldTypers,
        modules: config.modules,
        settings: config.settings,
    });

    // 2. 返回一个新的 React 组件，它已经封装了所有初始化逻辑
    const ConfiguredProvider = ({ children }: { children: ReactNode }) => (
        <EntitySuiteAdapterProvider
            adapter={config.suiteAdapter || { suiteName: 'build-in', suiteVersion: '1.0.0' }}
        >
            <InternalProvider
                initializer={initializer}
                loading={config.loading}
                router={config.router}
                permissionGuard={config.permissionGuard}
            >
                <EntityEngineThemeProvider theme={config.theme}>
                    <TRPCReactProvider>{children}</TRPCReactProvider>
                </EntityEngineThemeProvider>
            </InternalProvider>
        </EntitySuiteAdapterProvider>
    );

    ConfiguredProvider.displayName = 'EntityEngineProvider(Configured)';
    return ConfiguredProvider;
}
