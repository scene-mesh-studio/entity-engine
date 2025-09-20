'use client';

import '@xyflow/react/dist/style.css';

import type { NodeChange, EdgeChange } from '@xyflow/react';

import { createId } from '@paralleldrive/cuid2';
import { useAsync, EntityViewContainer } from '@scenemesh/entity-engine';
import React, { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  useEntityEngine,
  type EntityTreeNode,
  useMasterDetailViewContainer,
} from '@scenemesh/entity-engine';
import {
  Panel,
  addEdge,
  MiniMap,
  Controls,
  ReactFlow,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';

import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { IconifyEx } from 'src/components/iconify';

import { SceneNode } from './scene-node-type';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, type: 'scene', data: { label: '星宝根场景' } },
  { id: '2', position: { x: 0, y: 100 }, type: 'scene', data: { label: '星宝学习场景' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

function setupNodesAndEdges(nodes: any[], edges: any[], rootNode: EntityTreeNode | null) {
  if (rootNode == null) return;
  if (rootNode.data?.id) {
    nodes.push({
      id: rootNode.data?.id,
      position: { x: 0, y: 0 },
      type: 'scene',
      data: rootNode.data,
    });
    if (rootNode.parentId) {
      edges.push({
        id: createId(),
        source: rootNode.parentId,
        target: rootNode.data?.id,
      });
    }
  }
  if (rootNode.children && Array.isArray(rootNode.children)) {
    rootNode.children.forEach((child: EntityTreeNode) => {
      setupNodesAndEdges(nodes, edges, child);
    });
  }
}

export function SceneDesignHomeView() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rootSceneId, setRootSceneId] = useState<string | undefined>(undefined);
  const engine = useEntityEngine();
  const { currentAction } = useMasterDetailViewContainer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  const nodeTypes = useMemo(() => ({ scene: SceneNode }), []);

  useLayoutEffect(() => {
    function updateHeight() {
      if (containerRef.current) {
        const top = containerRef.current.getBoundingClientRect().top;
        setHeight(window.innerHeight - top);
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const { state, data, error } = useAsync(async () => {
    const rs = await engine.datasourceFactory.getDataSource()?.findMany({
      modelName: 'scene',
      query: {
        pageIndex: 1,
        pageSize: 1,
        references: {
          fromModelName: 'product',
          fromFieldName: 'rootScene',
          fromObjectId: currentAction?.contextObject?.id || '',
          toModelName: 'scene',
        },
      },
    });
    if (rs && rs.data && rs.data.length > 0) {
      const rootScene = rs.data[0];
      setRootSceneId(rootScene.id);
      const ret = await engine.datasourceFactory.getDataSource()?.findTreeObjects({
        modelName: 'scene',
        fieldName: 'children',
        rootObjectId: rootScene.id,
      });
      if (ret) {
        const newNodes: any[] = [];
        const newEdges: any[] = [];
        if (Array.isArray(ret)) {
          ret.forEach((node: EntityTreeNode) => {
            setupNodesAndEdges(newNodes, newEdges, node);
          });
        } else {
          setupNodesAndEdges(newNodes, newEdges, ret);
        }
        setNodes(newNodes);
        setEdges(newEdges);
      }
      return ret;
    }
    return null;
  }, [currentAction]);

  useEffect(() => {}, [rootSceneId]);

  function nodeColor(node: any) {
    switch (node.type) {
      case 'input':
        return '#6ede87';
      case 'scene':
        return '#6865A5';
      default:
        return '#ff0072';
    }
  }

  const onNodesChange = useCallback(
    (changes: NodeChange<any>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<any>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: any) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleSceneCreate = () => {
    setDialogOpen(true);
  };

  const renderRootSceneCreator = () => (
    <Stack
      direction="row"
      spacing={1}
      sx={{ p: 3, width: '100%', height: '100%' }}
      alignContent="center"
      alignItems="center"
    >
      <Button
        variant="soft"
        size="large"
        startIcon={<IconifyEx icon="mdi:plus" />}
        color="primary"
        onClick={handleSceneCreate}
      >
        添加主场景
      </Button>
    </Stack>
  );

  const onObjectChanged = useCallback((object: any) => {
    if (object && object.id) {
      setRootSceneId(object.id);
    }
  }, []);

  return (
    <>
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: height ? `${height}px` : 'calc(100vh - 190px)',
          position: 'relative',
        }}
      >
        {/* {state}/{JSON.stringify(data)}/{JSON.stringify(error)} */}
        {/* {JSON.stringify(currentAction?.contextObject)} */}
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitViewOptions={{ padding: 2 }}
            style={{ backgroundColor: 'background.default' }}
          >
            {rootSceneId && (
              <MiniMap
                pannable
                zoomable
                position="bottom-right"
                nodeStrokeWidth={1}
                nodeColor="#999"
              />
            )}
            <Controls style={{ backgroundColor: 'background.default' }} />
            <Background color="#999" variant={BackgroundVariant.Dots} />

            <Panel
              position="top-center"
              style={{ height: '60%', backgroundColor: 'background.default' }}
            >
              {!rootSceneId && renderRootSceneCreator()}
            </Panel>
            {/* <Panel position="top-right">center-right</Panel> */}
          </ReactFlow>
        </ReactFlowProvider>
      </Box>
      <Dialog open={dialogOpen} fullWidth maxWidth="md" onClose={() => setDialogOpen(false)}>
        <DialogTitle>创建主场景</DialogTitle>

        <DialogContent>
          {/* <ViewContainer
            modelName="scene"
            viewType="form"
            viewName="sceneFormViewNew"
            baseObjectId={createId()}
            reference={{
              fromModelName: 'product',
              fromFieldName: 'rootScene',
              fromObjectId: currentAction?.contextObject?.id || '',
              toModelName: 'scene',
            }}
            callbacks={{
              onObjectUpdated: onObjectChanged,
              onObjectDeleted: onObjectChanged,
              onObjectCreated: onObjectChanged,
            }}
            maintain={{ toCreating: true }}
          /> */}
          <EntityViewContainer
            modelName="scene"
            viewType="form"
            viewName="sceneFormViewNew"
            baseObjectId={createId()}
            reference={{
              fromModelName: 'product',
              fromFieldName: 'rootScene',
              fromObjectId: currentAction?.contextObject?.id || '',
              toModelName: 'scene',
            }}
            callbacks={{
              onObjectUpdated: onObjectChanged,
              onObjectDeleted: onObjectChanged,
              onObjectCreated: onObjectChanged,
            }}
            behavior={{ toCreating: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
