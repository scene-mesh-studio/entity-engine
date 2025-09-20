import type { ReactNode } from 'react';
// NodeContext.js
import type { IEntityObject } from '@scenemesh/entity-engine';

import { useContext, createContext } from 'react';

interface SceneFlowEditorContextType {
  product: IEntityObject;
  scene: IEntityObject;
}

// 创建 Context，可以提供一个默认值
export const SceneFlowEditorContext = createContext<SceneFlowEditorContextType>(
  {} as SceneFlowEditorContextType
);

export function SceneFlowEditorProvider({
  children,
  product,
  scene,
}: {
  children: ReactNode;
  product: IEntityObject;
  scene: IEntityObject;
}) {
  return (
    <SceneFlowEditorContext.Provider value={{ product, scene }}>
      {children}
    </SceneFlowEditorContext.Provider>
  );
}

// 创建一个自定义 Hook，方便在组件中使用
export const useSceneFlowEditorContext = () => useContext(SceneFlowEditorContext);
