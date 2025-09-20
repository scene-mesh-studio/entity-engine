'use client';

import type { EntityPermissionActionType } from '@scenemesh/entity-engine';

import { useRouter } from 'next/navigation';
import { AdditionsSuiteAdapter } from '@scenemesh/entity-suite-additions';
import { EntityEngineStudioLauncher } from '@scenemesh/entity-engine-studio';
import { EntityViewInspector, createEntityEngineProvider } from '@scenemesh/entity-engine';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';

// import { views, models } from '../model-config';

type EntityEngineProviderWrapperProps = {
  children: React.ReactNode;
};
export function EntityEngineProviderWrapper(props: EntityEngineProviderWrapperProps) {
  const router = useRouter();

  const EntityEngineProvider = createEntityEngineProvider({
    // config: {
    //   models,
    //   views,
    // },
    suiteAdapters: [new AdditionsSuiteAdapter()],
    suiteAdapter: { suiteName: 'additions', suiteVersion: '1.0.0' },
    router: {
      navigate: (path: string, state) => {
        console.log(`Navigating to ${path} with state:`, state);
        router.push(path, undefined);
      },
    },
    permissionGuard: {
      checkPermission: async (action: EntityPermissionActionType) => {
        // 这里可以添加权限检查逻辑
        console.log(`Checking permission for action: ${action}`);
        return true;
      },
    },
    renderers: [
      {
        name: 'shell-settings2',
        slotName: 'shell-settings-item2',
        renderer: (_p) => <div>Settings Component</div>,
      },
      // {
      //   name: 'view-tool-2',
      //   slotName: 'view-tool',
      //   renderer: (p: any) => <div>测试{p.model.name}</div>,
      // },
      {
        ...EntityViewInspector,
      },
      {
        ...EntityEngineStudioLauncher,
      },
    ],
    settings: {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '/api/ee',
      authenticationEnabled: true,
    },
    modules: [new EntityAIModule()],
  });

  return (
    // <TRPCReactProvider>
    <EntityEngineProvider>{props.children}</EntityEngineProvider>
    // </TRPCReactProvider>
  );
}
