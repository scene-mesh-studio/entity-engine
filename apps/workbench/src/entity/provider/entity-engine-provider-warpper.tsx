'use client';

import type { EntityPermissionActionType } from '@scenemesh/entity-engine';

import { Button } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { ComingSoonView } from '@/sections/coming-soon/view';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';
import { SceneFlowEditorContainer } from '@/viewports/scene/views/editor';
import { AdditionsSuiteAdapter } from '@scenemesh/entity-suite-additions';
import { EntityEngineStudioLauncher } from '@scenemesh/entity-engine-studio';
import {
  useEntityEngine,
  EntityViewInspector,
  createEntityEngineProvider,
} from '@scenemesh/entity-engine';

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
      navigate: (path: string, state?: any) => {
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
        renderer: (p: any) => <div>Settings Component</div>,
      },
      {
        name: 'view-tool-2',
        slotName: 'view-tool',
        renderer: (p: any) => <ViewTestItem {...p} />,
      },
      {
        ...EntityViewInspector,
      },
      {
        ...EntityEngineStudioLauncher,
      },
      {
        name: 'SceneFlowEditorContainer',
        renderer: (p: any) => <SceneFlowEditorContainer />,
      },
      {
        name: 'ComingSoonView',
        renderer: (p: any) => <ComingSoonView />,
      },
    ],
    settings: {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082',
      endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '/api/ee',
      authenticationEnabled: true,
    },
    modules: (() => {
      const aiModule = new EntityAIModule();
      const modules = [aiModule];
      return modules;
    })(),
  });

  return (
    // <TRPCReactProvider>
    <EntityEngineProvider>{props.children}</EntityEngineProvider>
    // </TRPCReactProvider>
  );
}

function ViewTestItem(props: any) {
  const engine = useEntityEngine();
  const viewId = props.addationalProps?.viewId;
  const vc = engine.componentRegistry.getViewController(undefined, undefined, viewId);

  const handleTest = () => {
    const desc = vc?.describe();
    vc?.invoke('record.setValues', { values: { name: 'test' } });
  };

  return <Button onClick={handleTest}>Test</Button>;
}
