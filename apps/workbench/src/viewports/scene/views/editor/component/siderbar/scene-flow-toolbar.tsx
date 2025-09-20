import type { IEntityObject } from '@scenemesh/entity-engine';
import type { SceneFlowEdge, SceneFlowNode } from '../scene-flow-types';

import { useReactFlow } from '@xyflow/react';

import { Stack, Button } from '@mui/material';

import { fToNow } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { IconifyEx } from 'src/components/iconify';

import { validateFlow } from '../utils/flow-exporter';
import { generateWhenThenJson } from '../utils/flow-outputter';

type SceneFlowToolbarProps = {
  handleSceneFlowSave: () => void;
  handleSceneFlowPublish?: (flowJson: any) => void;
  scene: IEntityObject;
};

export function SceneFlowToolbar(props: SceneFlowToolbarProps) {
  const { handleSceneFlowSave, handleSceneFlowPublish, scene } = props;
  const { getNodes, getEdges, setNodes } = useReactFlow<SceneFlowNode, SceneFlowEdge>();

  function handleFlowPublish() {
    const { errors, nodes: validatedNodes } = validateFlow(
      getNodes(),
      getEdges(),
      true // <-- 传入 true
    );
    setNodes(validatedNodes);
    if (errors.length > 0) {
      const errorMsgs = errors.map((error, index) => <li key={index}>- {error.message}</li>);
      toast.error(
        <>
          <div>场景流程设计校验失败, 请先解决这些问题:</div>
          <ul>{errorMsgs}</ul>
        </>
      );
      return;
    }
    // const cep = exportFlowToJson(getNodes(), getEdges());
    // console.log(JSON.stringify(cep));
    // const data = {nodes: getNodes(), edges: getEdges()};
    const flinkCepJson = generateWhenThenJson(getNodes(), getEdges(), true);
    if (handleSceneFlowPublish) {
      handleSceneFlowPublish(flinkCepJson);
    } else {
      console.log(JSON.stringify(flinkCepJson, null, 2));
    }
  }

  function handleFlowValidate() {
    const { errors, nodes: validatedNodes } = validateFlow(
      getNodes(),
      getEdges(),
      true // <-- 传入 true
    );

    // 2. 使用返回的、已附加错误信息的新节点数组来更新 React Flow 的状态
    setNodes(validatedNodes);
  }

  return (
    <Stack
      direction="row"
      flex={1}
      alignItems="start"
      alignContent="start"
      justifyContent="flex-end"
      gap={1}
      sx={{
        p: 0,
        m: 0,
      }}
    >
      <Button
        onClick={() => {
          handleSceneFlowSave();
        }}
        variant="text"
        startIcon={
          <IconifyEx icon="mdi:content-save" width={24} height={24} sx={{ color: 'primary' }} />
        }
      >
        保存
      </Button>
      <Button
        onClick={() => {
          handleFlowValidate();
        }}
        variant="text"
        startIcon={<IconifyEx icon="material-icon-theme:test-ts" width={24} height={24} />}
      >
        校验
      </Button>
      <Button
        variant="text"
        startIcon={
          <IconifyEx icon="mdi:publish" width={24} height={24} sx={{ color: 'primary' }} />
        }
        onClick={handleFlowPublish}
      >
        发布
        {scene.values?.flowDataPublishTime
          ? '(上次发布于: ' + fToNow(scene.values.flowDataPublishTime) + ' )'
          : ''}
      </Button>
    </Stack>
  );
}
