'use client';

import { useAsync, useEntityEngine, useMasterDetailViewContainer } from '@scenemesh/entity-engine';

import { SceneFlowEditor } from './component/scene-flow-editor';

export function SceneFlowEditorContainer() {
  const engine = useEntityEngine();
  const { currentAction, parentContext, broadcast } = useMasterDetailViewContainer();
  const sceneObject = currentAction?.contextObject;
  const productId = parentContext?.id;

  const { state, data, error } = useAsync(async () => {
    if (productId) {
      const ret = await engine.datasourceFactory.getDataSource()?.findOneWithReferences({
        modelName: 'product',
        id: productId,
      });
      return ret;
    }
    return null;
  }, [productId]);

  if (state === 'hasData' && data && sceneObject) {
    return <SceneFlowEditor scene={sceneObject} product={data} />;
  }
  return <div>...</div>;
}
