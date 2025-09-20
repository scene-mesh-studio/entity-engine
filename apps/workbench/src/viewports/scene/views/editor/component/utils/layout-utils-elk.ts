import type { Node, Edge } from '@xyflow/react';
import type { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';

import ELK from 'elkjs/lib/elk.bundled.js';

// 定义布局常量
const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 100;
const GROUP_PADDING = 40;

/**
 * 【V9 - 混合算法】
 * 递归地将 React Flow 的节点/边结构转换为 ELKjs 的层级结构。
 * @param nodesToProcess - 当前层级需要处理的节点
 * @param allNodes - 所有的节点（用于查找父子关系）
 * @param direction - 布局方向
 * @returns ELKjs 的子节点数组
 */
const buildElkHierarchy = (
  nodesToProcess: Node[],
  allNodes: Node[],
  direction: 'RIGHT' | 'DOWN'
): ElkNode[] => {
  const elkNodes: ElkNode[] = [];
  const nodeToElkNodeMap = new Map<string, ElkNode>();

  // 首先，为当前层级的所有节点创建 ELK 节点对象
  nodesToProcess.forEach((node) => {
    const elkNode: ElkNode = {
      id: node.id,
      width: node.width || DEFAULT_NODE_WIDTH,
      height: node.height || DEFAULT_NODE_HEIGHT,
    };
    nodeToElkNodeMap.set(node.id, elkNode);
  });

  // 然后，构建层级关系
  nodesToProcess.forEach((node) => {
    const elkNode = nodeToElkNodeMap.get(node.id)!;
    const isGroup = node.type === 'group';

    if (isGroup) {
      const childNodes = allNodes.filter((n) => n.parentId === node.id);
      // 递归调用，为子节点构建层级
      elkNode.children = buildElkHierarchy(childNodes, allNodes, direction);

      // 关键点 2: Group 内部依然使用 'layered' 算法保持流程清晰
      elkNode.layoutOptions = {
        'elk.algorithm': 'layered',
        'elk.direction': direction,
        'elk.padding': `[top=${GROUP_PADDING + 20}, left=${GROUP_PADDING}, bottom=${GROUP_PADDING}, right=${GROUP_PADDING}]`,
        'elk.spacing.nodeNode': '80', // Group 内部的节点间距
        'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      };
    }

    // 只有顶层节点（相对于当前处理的集合）才会被加入到 children 数组中
    if (!node.parentId || !nodesToProcess.some((n) => n.id === node.parentId)) {
      elkNodes.push(elkNode);
    }
  });

  return elkNodes;
};

/**
 * 使用 ELKjs 混合算法为复杂的层级图计算布局。
 * @param nodes - 所有的 React Flow 节点数组 (必须包含准确的 width/height)
 * @param edges - 所有的 React Flow 边数组
 * @param direction - 'RIGHT' (对应LR) 或 'DOWN' (对应TB)
 * @returns Promise<Node[]> - 返回一个包含新位置信息的全新节点数组的 Promise
 */
export const getLayoutedElementsWithELK = async (
  nodes: Node[],
  edges: Edge[],
  direction: 'RIGHT' | 'DOWN' = 'RIGHT'
): Promise<Node[]> => {
  const elk = new ELK();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // 1. 构建一个完整的、包含所有节点和边的层级结构
  const elkNodes = buildElkHierarchy(nodes, nodes, direction);
  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      // 关键点 1: 顶层使用 'box' 算法进行紧凑打包
      'elk.algorithm': 'rectpacking',
      'elk.direction': direction,
      'elk.aspectRatio': '1.4',
      'elk.spacing.nodeNode': '120', // Group 之间的间距
    },
    children: elkNodes,
    edges: elkEdges, // 将所有的边都放在顶层处理，ELKjs 会自动处理跨层级的边
  };

  // 2. 运行布局
  const layoutedGraph = await elk.layout(graph);

  // 3. 将布局结果递归地应用回 React Flow 节点
  const finalNodes: Node[] = [];
  const applyLayout = (elkNode: ElkNode, parentPosition = { x: 0, y: 0 }) => {
    const originalNode = nodeMap.get(elkNode.id);
    if (!originalNode) return;

    const newPosition = {
      x: parentPosition.x + (elkNode.x || 0),
      y: parentPosition.y + (elkNode.y || 0),
    };

    finalNodes.push({
      ...originalNode,
      position: newPosition,
      width: elkNode.width,
      height: elkNode.height,
    });

    if (elkNode.children) {
      elkNode.children.forEach((child) => applyLayout(child, newPosition));
    }
  };

  layoutedGraph.children?.forEach((node) => applyLayout(node));

  return finalNodes;
};
