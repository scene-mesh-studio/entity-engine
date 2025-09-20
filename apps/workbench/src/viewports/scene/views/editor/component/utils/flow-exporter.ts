import type {
  SceneFlowNode,
  SceneFlowEdge,
  ICepPatternNode,
  ICepPatternEdge,
  PatternNodeData,
  FlinkCEP_Pattern,
  FlowValidationError,
} from '../scene-flow-types';

/**
 * 将 React Flow 的扁平化 state 转换回 Flink CEP 的层级化 JSON 结构。
 *
 * @param nodes - React Flow 的节点数组。
 * @param edges - React Flow 的边数组。
 * @returns 符合 FlinkCEP_Pattern 格式的层级化对象。
 */
export function exportFlowToJson(nodes: SceneFlowNode[], edges: SceneFlowEdge[]): FlinkCEP_Pattern {
  // 步骤 1: 创建一个 ID -> 名称的映射表，用于后续转换边。
  const idToNameMap = new Map<string, string>(nodes.map((node) => [node.id, node.data.name]));

  /**
   * 递归辅助函数，用于为给定的父节点构建其内部的图。
   * @param parentId - 父节点的ID。如果为 undefined，则构建顶层图。
   * @returns 一个包含 nodes 和 edges 的图对象。
   */
  const buildGraph = (
    parentId: string | undefined
  ): { nodes: ICepPatternNode[]; edges: ICepPatternEdge[] } => {
    // 步骤 2: 找到当前层级的所有子节点。
    const childNodes = nodes.filter((node) => node.parentId === parentId);

    // 步骤 3: 找到连接这些子节点的边。
    const childNodeIds = childNodes.map((node) => node.id);
    const childEdges = edges.filter(
      (edge) => childNodeIds.includes(edge.source) && childNodeIds.includes(edge.target)
    );

    // 步骤 4: 将 React Flow 的边转换为 Flink CEP 的边格式。
    const cepEdges: ICepPatternEdge[] = childEdges.map((edge) => ({
      source: idToNameMap.get(edge.source)!,
      target: idToNameMap.get(edge.target)!,
      type: edge.data?.consumingStrategy || 'SKIP_TILL_NEXT', // 提供默认值
    }));

    // 步骤 5: 将 React Flow 的节点转换为 Flink CEP 的节点格式。
    const cepNodes: ICepPatternNode[] = childNodes
      .filter((node) => node.type === 'atomic' || node.type === 'composite')
      .map((node) => {
        const { data: nodeData, type } = node;
        const data = nodeData as PatternNodeData;
        // 创建一个 Flink CEP 节点对象
        const cepNode: ICepPatternNode = {
          name: data.name,
          type: data.type,
          quantifier: data.quantifier,
          // 将简化的 condition 字符串转换回对象格式
          condition: data.condition ? { type: 'AVIATOR', expression: data.condition } : null,
          times: data.times || null,
          window: data.window || null,
          // 对于目前未在UI中编辑的属性，可以提供一个默认值
          untilCondition: null,
          afterMatchSkipStrategy: {
            type: 'NO_SKIP',
            patternName: null,
          },
          // 核心：如果当前节点是分组，则递归构建其内部的 graph
          graph: type === 'composite' ? buildGraph(node.id) : null,
        };

        return cepNode;
      });

    return { nodes: cepNodes, edges: cepEdges };
  };

  // 步骤 6: 从根节点 (parentId 为 undefined) 开始构建整个图。
  const finalGraph = buildGraph(undefined);

  return {
    nodes: finalGraph.nodes,
    edges: finalGraph.edges,
  };
}

/**
 * 校验一个流程图（flow）的状态，检查是否存在异常情况。
 * 如果 updateNodes 为 true，则会将错误信息附加到对应节点的 data.errors 属性中。
 *
 * @param nodes - React Flow 的原始节点数组。
 * @param edges - React Flow 的原始边数组。
 * @param updateNodes - (可选) 是否要返回一个附加了错误信息的新节点数组。
 * @returns 一个包含错误列表和（可能已更新的）节点数组的对象。
 */
export function validateFlow(
  nodes: SceneFlowNode[],
  edges: SceneFlowEdge[],
  updateNodes?: boolean
): { errors: FlowValidationError[]; nodes: SceneFlowNode[] } {
  const errors: FlowValidationError[] = [];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  // --- 准备工作: 获取已连接的节点ID ---
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // --- 规则 1, 2, 3: 单点校验 ---
  nodes.forEach((node) => {
    const { id, data, type } = node;

    // 规则1：检测孤立节点 (已更新逻辑)
    if (!connectedNodeIds.has(id)) {
      // 节点没有连接，但需要检查是否是分组内的唯一子节点（允许孤立）
      if (node.parentId) {
        // 此节点在分组内，统计其父节点下的子节点数量
        const siblingCount = nodes.filter((n) => n.parentId === node.parentId).length;

        // 只有当分组内有多个子节点，而当前节点仍然孤立时，才算错误
        if (siblingCount > 1) {
          errors.push({
            nodeId: id,
            nodeName: data.label || data.name,
            type: 'ISOLATED_NODE',
            message: '节点在分组内是孤立的，请与其他兄弟节点连接。',
          });
        }
        // 如果 siblingCount === 1，则它是唯一子节点，允许孤立，所以什么都不做。
      } else {
        // 顶层节点孤立，这始终是一个错误
        errors.push({
          nodeId: id,
          nodeName: data.label || data.name,
          type: 'ISOLATED_NODE',
          message: '节点是孤立的，没有任何输入或输出连接。',
        });
      }
    }

    // 规则2：检测未设置条件的 AtomicNode
    if (type === 'atomic' && !data.condition) {
      errors.push({
        nodeId: id,
        nodeName: data.label || data.name,
        type: 'MISSING_CONDITION',
        message: '原子节点缺少必要的触发条件。',
      });
    }

    // 规则3：检测空的分组节点
    if (type === 'composite' && !nodes.some((childNode) => childNode.parentId === id)) {
      errors.push({
        nodeId: id,
        nodeName: data.label || data.name,
        type: 'EMPTY_GROUP',
        message: '分组节点内部不能为空。',
      });
    }
  });

  // --- 规则 4: 检测循环依赖 ---
  const adj = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push(edge.target);
  });
  const visitState = new Map<string, 'VISITING' | 'VISITED'>();
  const reportedCycleNodeIds = new Set<string>();
  const hasCycleDfs = (nodeId: string, path: string[]): boolean => {
    visitState.set(nodeId, 'VISITING');
    path.push(nodeId);
    const neighbors = adj.get(nodeId) || [];
    for (const neighborId of neighbors) {
      const neighborState = visitState.get(neighborId);
      if (neighborState === 'VISITING') {
        const cyclePath = [...path.slice(path.indexOf(neighborId)), neighborId];
        const cyclePathNames = cyclePath.map((id) => nodeMap.get(id)?.data.name).join(' → ');
        cyclePath.forEach((idInCycle) => {
          if (!reportedCycleNodeIds.has(idInCycle)) {
            errors.push({
              nodeId: idInCycle,
              nodeName: nodeMap.get(idInCycle)!.data.name,
              type: 'CIRCULAR_DEPENDENCY',
              message: `节点存在于一个循环依赖中: ${cyclePathNames}`,
            });
            reportedCycleNodeIds.add(idInCycle);
          }
        });
        return true;
      }
      if (!neighborState) {
        if (hasCycleDfs(neighborId, path)) return true;
      }
    }
    visitState.set(nodeId, 'VISITED');
    path.pop();
    return false;
  };
  for (const node of nodes) {
    if (!visitState.has(node.id)) {
      hasCycleDfs(node.id, []);
    }
  }

  // 对所有收集到的错误进行去重
  const uniqueErrors = Array.from(
    new Map(errors.map((error) => [`${error.nodeId}-${error.type}`, error])).values()
  );

  // --- 新增逻辑：如果需要，则更新节点数据 ---
  if (!updateNodes) {
    // 如果不需要更新节点，直接返回错误和原始节点数组
    return { errors: uniqueErrors, nodes };
  }

  // 按 nodeId 对错误进行分组
  const errorsByNodeId = new Map<string, FlowValidationError[]>();
  uniqueErrors.forEach((error) => {
    if (!errorsByNodeId.has(error.nodeId)) {
      errorsByNodeId.set(error.nodeId, []);
    }
    errorsByNodeId.get(error.nodeId)!.push(error);
  });

  // 创建一个新的节点数组，附加或清空 errors 属性
  const updatedNodes = nodes.map((node) => {
    const nodeErrors = errorsByNodeId.get(node.id) || []; // 获取当前节点的错误，如果没有则为空数组

    // 返回一个新对象，以确保 React 能够检测到状态变化
    return {
      ...node,
      data: {
        ...node.data,
        errors: nodeErrors, // 更新或清空 errors 属性
      },
    };
  });

  return { errors: uniqueErrors, nodes: updatedNodes };
}
