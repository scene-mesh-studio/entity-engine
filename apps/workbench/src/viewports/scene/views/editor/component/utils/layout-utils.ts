import type { Node } from '@xyflow/react';
import type { SceneFlowNode } from '../scene-flow-types';

import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph({ compound: true }); // 使用复合图以更好支持层级
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 300;
const nodeHeight = 170;

const getNodeWidth = (node: SceneFlowNode): number =>
  node.style?.width !== undefined
    ? Number(node.style.width)
    : node.measured?.width !== undefined
      ? Number(node.measured.width)
      : node.width !== undefined
        ? Number(node.width)
        : nodeWidth;

const getNodeHeight = (node: SceneFlowNode): number =>
  node.style?.height !== undefined
    ? Number(node.style.height)
    : node.measured?.height !== undefined
      ? Number(node.measured.height)
      : node.height !== undefined
        ? Number(node.height)
        : nodeHeight;

export const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  // dagreGraph.setGraph({ rankdir: direction, align: 'UL', nodesep: 50, ranksep: 100 });

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  // 同时设置节点和它们的层级关系
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: getNodeWidth(node), height: getNodeHeight(node) });
    // 如果有父节点，告诉 Dagre 这种嵌套关系
    if (node.parentNode) {
      dagreGraph.setParent(node.id, node.parentNode);
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 运行布局
  dagre.layout(dagreGraph);

  // 创建一个方便查找节点绝对位置的 Map
  const nodePositions = new Map();
  dagreGraph.nodes().forEach((nodeId) => {
    nodePositions.set(nodeId, dagreGraph.node(nodeId));
  });

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = nodePositions.get(node.id);

    // 检查是否有父节点
    if (node.parentId) {
      const parentNodeWithPosition = nodePositions.get(node.parentId);

      // 计算相对于父节点的坐标
      // 减去父节点的坐标，并考虑父节点尺寸的一半（因为Dagre坐标是中心点）
      node.position = {
        x: nodeWithPosition.x - parentNodeWithPosition.x,
        y: nodeWithPosition.y - parentNodeWithPosition.y,
      };
    } else {
      // 如果是父节点或独立节点，使用其绝对坐标
      // 同样需要从中心点转换到左上角
      node.position = {
        x: nodeWithPosition.x - getNodeWidth(node) / 2,
        y: nodeWithPosition.y - getNodeHeight(node) / 2,
      };
    }

    return node;
  });

  return layoutedNodes;
};

export const getCorrectedPosition = (
  draggedNode: SceneFlowNode,
  parentNode: SceneFlowNode,
  headerHeight: number
): { x: number; y: number } => {
  const padding = 10;
  const contentArea = {
    minX: padding,
    minY: headerHeight + padding,
    maxX: parentNode.width! - (draggedNode.width || 0) - padding,
    maxY: parentNode.height! - (draggedNode.height || 0) - padding,
  };

  return {
    x: Math.max(contentArea.minX, Math.min(draggedNode.position.x, contentArea.maxX)),
    y: Math.max(contentArea.minY, Math.min(draggedNode.position.y, contentArea.maxY)),
  };
};

export const getAbsolutePosition = (
  nodeId: string,
  getNode: (id: string) => Node | undefined
): { x: number; y: number } => {
  let currentNode = getNode(nodeId);
  if (!currentNode) {
    return { x: 0, y: 0 };
  }

  let absX = currentNode.position.x;
  let absY = currentNode.position.y;

  // 循环向上查找父节点，并累加它们的相对位置
  while (currentNode?.parentId) {
    const parent = getNode(currentNode.parentId);
    if (!parent) {
      break; // 如果找不到父节点，停止循环
    }
    absX += parent.position.x;
    absY += parent.position.y;
    currentNode = parent;
  }

  return { x: absX, y: absY };
};

/**
 * 递归地向上调整所有祖先 Group 节点的尺寸 (纯状态版本)
 * @param nodeId 开始检查的节点ID
 * @param getNodes React Flow 的 getNodes hook
 * @param getNode React Flow 的 getNode hook
 * @param setNodes React Flow 的 setNodes hook
 * @param padding 父节点边框与子节点内容之间的内边距
 */
export function recursivelyResizeAncestors(
  nodeId: string,
  getNodes: () => Node[],
  getNode: (id: string) => Node | undefined,
  setNodes: (nodes: any[]) => void,
  padding: number = 20 // <--- 关键修改 1: 添加为参数并设置默认值
) {
  const node = getNode(nodeId);

  if (!node?.parentId) {
    return;
  }

  const parentNode = getNode(node.parentId);
  if (!parentNode) {
    return;
  }

  console.log('------- ' + JSON.stringify(parentNode));

  const allNodes = getNodes();
  const childNodes = allNodes.filter((n) => n.parentId === parentNode.id);

  if (childNodes.length === 0) {
    return;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;

  childNodes.forEach((child) => {
    console.log(`[Resize] Child ${JSON.stringify(child)}`);
    if (child.width && child.height) {
      const { x, y } = child.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + child.width);
      maxY = Math.max(maxY, y + child.height);
    } else if (child.measured?.width && child.measured?.height) {
      const { x, y } = child.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + child.measured?.width);
      maxY = Math.max(maxY, y + child.measured?.height);
    }
  });

  if (maxX === 0 || maxY === 0) {
    return;
  }

  // --- 关键修改 2: 使用参数 'padding' ---
  const newWidth = maxX + padding;
  const newHeight = maxY + padding;

  const parentCurrentWidth = parentNode.width || 0;
  const parentCurrentHeight = parentNode.height || 0;

  const hasSizeChanged =
    Math.abs(parentCurrentWidth - newWidth) > 1 || Math.abs(parentCurrentHeight - newHeight) > 1;

  if (hasSizeChanged) {
    const newNodes = allNodes.map((n) => {
      if (n.id === parentNode.id) {
        return {
          ...n,
          style: { ...n.style, width: newWidth, height: newHeight },
          width: newWidth,
          height: newHeight,
        };
      }
      return n;
    });
    setNodes(newNodes);

    setTimeout(() => {
      // 在递归调用时，将 padding 值继续传递下去
      recursivelyResizeAncestors(parentNode.id, getNodes, getNode, setNodes, padding);
    }, 0);
  }
}
