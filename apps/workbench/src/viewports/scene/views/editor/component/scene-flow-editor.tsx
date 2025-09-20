import '@xyflow/react/dist/style.css';

import type { IEntityObject } from '@scenemesh/entity-engine';
import type { Connection, OnNodesChange, ReactFlowInstance } from '@xyflow/react';
import type { SceneFlowEdge, SceneFlowNode, FlowNodeTemplateCatalog } from './scene-flow-types';

import { createId } from '@paralleldrive/cuid2';
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  useAsyncEffect,
  useEntityEngine,
  useMasterDetailViewContainer,
} from '@scenemesh/entity-engine';
import {
  Panel,
  Controls,
  ReactFlow,
  Background,
  useReactFlow,
  useEdgesState,
  useNodesState,
  applyNodeChanges,
  ReactFlowProvider,
  useNodesInitialized,
  useUpdateNodeInternals,
} from '@xyflow/react';

import { Box } from '@mui/material';

import { toast } from 'src/components/snackbar';

import GroupNode from './nodetypes/GroupNode';
import AtomicNode from './nodetypes/AtomicNode';
import ComputeEdge from './edgetypes/ComputeEdge';
import StrategyEdge from './edgetypes/StrategyEdge';
import { expandGroupNodes } from './utils/expansions';
import LLMComputeNode from './nodetypes/LLMComputeNode';
import FormatOutputNode from './nodetypes/FormatOutputNode';
import { SceneFlowToolbar } from './siderbar/scene-flow-toolbar';
import { useFlowDnD, FlowDnDProvider } from './utils/dnd-context';
import { SceneFlowEditorProvider } from '../context/editor-context-provider';
import { compressAndEncode, decodeAndDecompress } from './utils/compression';
import { getAbsolutePosition, getCorrectedPosition } from './utils/layout-utils';
import { SceneFlowResourceSidebar } from './siderbar/scene-flow-recourse-siderbar';

const PADDING = 40;
const GROUP_NODE_TYPE = 'composite';

const nodeTypes = {
  atomic: AtomicNode as React.ComponentType<any>,
  [GROUP_NODE_TYPE]: GroupNode as React.ComponentType<any>,
  LLM_INFERENCE: LLMComputeNode as React.ComponentType<any>,
  FORMAT_OUTPUT: FormatOutputNode as React.ComponentType<any>,
};

const edgeTypes = {
  strategy: StrategyEdge, // 当 edge.type 为 'strategy' 时，使用 StrategyEdge 组件
  compute: ComputeEdge,
};

const nodeTemplateCatalogs: FlowNodeTemplateCatalog[] = [
  {
    title: '事件判断',
    nodes: [
      {
        title: '判断单元',
        description: '对事件进行判断, 包括事件类型、事件字段等',
        icon: 'material-icon-theme:simulink',
        nodeType: 'atomic',
        initParas: {
          name: '判断单元',
          type: 'ATOMIC',
          label: '判断单元',
          quantifier: {
            consumingStrategy: 'STRICT',
            innerConsumingStrategy: 'SKIP_TILL_NEXT',
            properties: ['SINGLE'],
          },
        },
      },
      {
        title: '判断分组',
        description: '可以把多个判断单元组合成一个判断分组',
        icon: 'material-icon-theme:drawio',
        nodeType: GROUP_NODE_TYPE,
        initParas: {
          name: '判断分组',
          type: 'COMPOSITE',
          label: '判断分组',
          quantifier: {
            consumingStrategy: 'STRICT',
            innerConsumingStrategy: 'SKIP_TILL_NEXT',
            properties: ['SINGLE'],
          },
        },
      },
    ],
  },
  {
    title: '事件处理',
    nodes: [
      {
        title: '大模型处理',
        description: '通过大语言模型进行事件处理',
        icon: 'material-icon-theme:robots',
        nodeType: 'LLM_INFERENCE',
        initParas: {
          name: '大模型处理',
          label: '大模型处理',
          type: 'LLM_INFERENCE',
          modelProvider: 'openai',
          model: 'gpt-3.5-turbo',
          promptTemplate: '',
          promptVariables: [],
          temperature: 0.7,
          topP: 1,
          mcps: [],
          outputActions: [],
        },
      },
      // {
      //   title: '脚本处理',
      //   description: '通过脚本进行事件处理',
      //   icon: 'material-icon-theme:javascript-map',
      //   nodeType: 'group',
      //   initParas: {},
      // },
      {
        title: '直接输出',
        description: '通过简单的设置完成事件处理',
        icon: 'material-icon-theme:supabase',
        nodeType: 'FORMAT_OUTPUT',
        initParas: {
          name: '直接输出',
          label: '直接输出',
          type: 'FORMAT_OUTPUT',
          outputActions: [],
        },
      },
    ],
  },
];

type SceneFlowEditorProps = {
  scene: IEntityObject;
  product: IEntityObject;
};

export function SceneFlowEditor(props: SceneFlowEditorProps) {
  const { scene, product } = props;

  return (
    <ReactFlowProvider>
      <FlowDnDProvider>
        <InnerSceneDesignFlowEditor scene={scene} product={product} />
      </FlowDnDProvider>
    </ReactFlowProvider>
  );
}

type InnerSceneDesignFlowEditorProps = SceneFlowEditorProps & {};

function InnerSceneDesignFlowEditor(props: InnerSceneDesignFlowEditorProps) {
  const { scene, product } = props;
  const { broadcast } = useMasterDetailViewContainer();
  const engine = useEntityEngine();
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState<SceneFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<SceneFlowEdge>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    SceneFlowNode,
    SceneFlowEdge
  > | null>(null);
  const [height, setHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getIntersectingNodes, getNode, getNodes, getEdges } = useReactFlow<
    SceneFlowNode,
    SceneFlowEdge
  >();
  const [type] = useFlowDnD();
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: false });
  const updateNodeInternals = useUpdateNodeInternals();
  const { setViewport } = useReactFlow();

  useEffect(() => {
    // const cepPattern: FlinkCEP_Pattern = JSON.parse(JSON.stringify(cepDemoData));
    // const { nodes: newNodes, edges: newEdges } = parseFlowJson(cepPattern);
    // setNodes(newNodes);
    // setEdges(newEdges);
    // console.table(newNodes);
    // console.table(newEdges);
  }, []);

  useAsyncEffect(async () => {
    const reloadScene = await engine.datasourceFactory.getDataSource()?.findOne({
      id: scene.id,
    });
    if (reloadScene && reloadScene.values?.flow) {
      const flowData: any = await decodeAndDecompress(reloadScene.values.flow);
      if (flowData) {
        const { x = 0, y = 0, zoom = 1 } = flowData.viewport;
        setNodes(flowData.nodes || []);
        setEdges(flowData.edges || []);
        setViewport({ x, y, zoom });
      }
    }
  }, [rfInstance, scene.id]);

  // useEffect(() => {
  //   const { errors, nodes: validatedNodes } = validateFlow(
  //         getNodes(),
  //         getEdges(),
  //         true // <-- 传入 true
  //       );
  //   setNodes(validatedNodes);
  // }, [nodes.length, edges.length])

  // useAsyncEffect(async () => {
  //   if (!nodesInitialized) {
  //     return;
  //   }
  //   if (nodes && edges) {
  //     const layoutedElements = await getLayoutedElements(nodes, edges, 'LR');
  //     setNodes(layoutedElements as CEP_Node[]);
  //     setEdges(edges);
  //   }
  // }, [nodesInitialized]);

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

  const onNodesChangeCustom = useCallback<OnNodesChange<SceneFlowNode>>(
    (changes) => {
      const newNodes = applyNodeChanges(changes, nodes);
      // setNodes(newNodes);

      const expandedNodes = expandGroupNodes(newNodes, 40, 80);
      setNodes(expandedNodes);
    },
    [nodes]
  );

  const onDragOver = useCallback(
    (event: { preventDefault: () => void; dataTransfer: { dropEffect: string } }) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    []
  );

  const onDrop = (event: { preventDefault: () => void; clientX: any; clientY: any }) => {
    event.preventDefault();
    if (!type) {
      return;
    }
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const newNode: SceneFlowNode = {
      id: createId(),
      position,
      type: type.nodeType,
      data: type.initParas,
    };

    if (newNode.type === 'atomic') {
      const intersectingNodes = getIntersectingNodes({
        x: newNode.position.x,
        y: newNode.position.y,
        width: 1,
        height: 1,
      }).filter((n) => n.id !== newNode.id && n.type === GROUP_NODE_TYPE);
      if (intersectingNodes.length > 0) {
        const parentNode = intersectingNodes[intersectingNodes.length - 1];

        if (parentNode) {
          newNode.parentId = parentNode.id;
          newNode.expandParent = true;
          // newNode.position.x -= parentNode.position.x;
          // newNode.position.y -= parentNode.position.y;

          const parentNodeAbsolutePosition = getAbsolutePosition(parentNode.id, getNode);

          newNode.position = {
            x: position.x - parentNodeAbsolutePosition.x,
            y: position.y - parentNodeAbsolutePosition.y,
          };
        }
      }
    }

    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeDrag = useCallback(
    (event: any, draggedNode: SceneFlowNode) => {
      // console.log(JSON.stringify(draggedNode));
      if (!draggedNode?.parentId) {
        return;
      }
      const parentNode = getNode(draggedNode.parentId);
      // console.log(`parentNode: ${JSON.stringify(parentNode)}`);

      if (!parentNode || !parentNode.width || !parentNode.height) {
        return;
      }

      const newPosition = getCorrectedPosition(draggedNode, parentNode as SceneFlowNode, 40);

      // 更新节点位置
      // 我们直接修改 draggedNode 的位置，React Flow 的内部状态会处理好
      // 但为了确保状态同步，使用 setNodes 更新是更稳妥的做法
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === draggedNode.id) {
            return {
              ...node,
              position: newPosition,
            };
          }
          return node;
        })
      );
    },
    [setNodes, getNode]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: SceneFlowEdge[]) => {
      console.log(`edgesToDelete: ${JSON.stringify(edgesToDelete)}`);
      setEdges((eds) => eds.filter((ed) => !edgesToDelete.includes(ed)));
    },
    [setEdges]
  );

  // =================================================================================
  // ======================= NEW: isValidConnection Implementation =======================
  // =================================================================================
  const isValidConnection = useCallback(
    (connection: Connection | SceneFlowEdge) => {
      // Use getNodes() and getEdges() to get the current state
      const allNodes = getNodes();
      const allEdges = getEdges();
      const sourceNode = allNodes.find((node) => node.id === connection.source);
      const targetNode = allNodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) {
        return false;
      }

      // Rule 1: A node cannot connect to itself.
      if (sourceNode.id === targetNode.id) {
        return false;
      }

      const isSourceCep = sourceNode.type === 'atomic' || sourceNode.type === 'composite'; //

      // highlight-start
      // Rule 5: An AtomicNode or GroupNode can only have one outgoing connection.
      if (isSourceCep) {
        const hasExistingConnection = allEdges.some((edge) => edge.source === sourceNode.id);
        if (hasExistingConnection) {
          return false; // Disallow if an outgoing edge already exists
        }
      }
      // highlight-end

      // Rule 4: AtomicNode/GroupNode can connect to LLMComputeNode's "input" handle.
      if (
        isSourceCep &&
        (targetNode.type === 'LLM_INFERENCE' || targetNode.type === 'FORMAT_OUTPUT') && //
        connection.targetHandle === 'input' //
      ) {
        return true;
      }

      // Rule 2 & 3: General connection rules for Atomic and Group nodes.
      const isTargetCep = targetNode.type === 'atomic' || targetNode.type === 'composite'; //

      if (isSourceCep && isTargetCep) {
        // Rule 2: A node with a parent cannot connect to its parent.
        if (sourceNode.parentId === targetNode.id || targetNode.parentId === sourceNode.id) {
          return false;
        }

        // Rule 2: Nodes must belong to the same parent to connect.
        if (sourceNode.parentId !== targetNode.parentId) {
          //
          return false;
        }

        return true;
      }

      return false;
    },
    // highlight-start
    // Add getEdges to the dependency array
    [getNodes, getEdges]
    // highlight-end
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Get all nodes to check the type of the target node
      const allNodes = getNodes();
      const targetNode = allNodes.find((node) => node.id === params.target);

      // Default edge object
      let newEdge: SceneFlowEdge;

      // Check if the target node is an LLMComputeNode
      if (targetNode?.type === 'LLM_INFERENCE' || targetNode?.type === 'FORMAT_OUTPUT') {
        // Use default edge settings for connections to LLM nodes
        newEdge = {
          id: createId(),
          source: params.source!,
          target: params.target!,
          type: 'compute',
          animated: true,
          style: {
            strokeWidth: 5, //
          },
          // No custom type, data, or style, so it uses React Flow's default
        };
      } else {
        // Use your custom 'strategy' edge for all other connections
        newEdge = {
          id: createId(), //
          source: params.source!, //
          target: params.target!, //
          type: 'strategy', //
          data: {
            consumingStrategy: 'SKIP_TILL_NEXT', //
          },
          style: {
            strokeWidth: 5, //
          },
          animated: true, //
        };
      }

      // Add the newly created edge to the state
      setEdges((eds) => [...eds, newEdge]);
    },
    [getNodes, setEdges] // Add getNodes to the dependency array
  );

  const handleFlowSave = useCallback(async () => {
    if (rfInstance) {
      const flowData = rfInstance.toObject();
      const caeString = await compressAndEncode(flowData);
      const updateSuccess = await engine.datasourceFactory.getDataSource()?.updateValues({
        id: scene.id,
        values: { flow: caeString },
      });

      if (updateSuccess) {
        toast.success(`保存场景设计图成功!`);
        // broadcast('updateData', scene);
      } else {
        toast.error(`保存场景设计图失败!`);
      }
    }
  }, [engine, rfInstance, scene.id]);

  const handleFlowPublish = useCallback(
    async (flowData: any) => {
      if (flowData) {
        const flowDataJson = JSON.stringify(flowData);
        const updateSuccess = await engine.datasourceFactory.getDataSource()?.updateValues({
          id: scene.id,
          values: { flowData: flowDataJson, flowDataPublishTime: new Date() },
        });
        if (updateSuccess) {
          toast.success(`场景设计发布成功!`);
          scene.values.flowDataPublishTime = new Date();
          // broadcast('updateData', scene);
        } else {
          toast.error(`场景设计发布失败!`);
        }
      }
    },
    [engine, scene.id]
  );

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: height ? `${height}px` : 'calc(100vh - 190px)',
        position: 'relative',
      }}
    >
      <SceneFlowEditorProvider product={product} scene={scene}>
        <ReactFlow<SceneFlowNode, SceneFlowEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChangeCustom}
          onEdgesChange={onEdgesChange}
          // onConnect={onConnect}
          onDrop={onDrop}
          // onDragStart={onDragStart}
          onDragOver={onDragOver}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDrag}
          onEdgesDelete={onEdgesDelete}
          isValidConnection={isValidConnection}
          onConnect={onConnect}
          onInit={setRfInstance}
          fitView
          minZoom={0.1}
          maxZoom={2}
          style={{ width: '100%', height: '100%' }}
        >
          <Panel position="top-right">
            <SceneFlowResourceSidebar templateCatalogs={nodeTemplateCatalogs} />
          </Panel>
          <Panel position="top-left">
            <SceneFlowToolbar
              handleSceneFlowSave={handleFlowSave}
              handleSceneFlowPublish={handleFlowPublish}
              scene={scene}
            />
          </Panel>
          <Controls />
          <Background />
        </ReactFlow>
      </SceneFlowEditorProvider>
    </Box>
  );
}
