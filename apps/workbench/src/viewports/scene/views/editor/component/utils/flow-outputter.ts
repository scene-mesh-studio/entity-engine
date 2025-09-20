// =================================================================
// 1. 从您的类型定义文件中导入所有必需的类型
// =================================================================
import type {
  CepNodeType,
  LlmNodeData, // 新增导入 LlmNodeData 类型
  SceneFlowNode,
  SceneFlowEdge,
  PatternNodeData,
  ICepPatternNode,
  ICepPatternEdge,
  FlinkCEP_Pattern,
} from '../scene-flow-types';

// =================================================================
// 2. 新增的 'When-Then' 结构类型定义
// =================================================================
export interface WhenThenClause {
  when: FlinkCEP_Pattern;
  then: LlmNodeData;
}

// =================================================================
// 3. TypeScript 版本的转换函数 (包含之前的逻辑)
// =================================================================

// convertNode 和 collectNodesRecursively 函数保持不变...

const isComputeNodeType = (type: string): boolean =>
  ['LLM_INFERENCE', 'FORMAT_OUTPUT'].includes(type);

/**
 * 将单个 React Flow 节点转换为 Flink CEP JSON 格式。
 * (此函数保持不变)
 */
const convertNode = (
  node: SceneFlowNode,
  allPatternNodes: SceneFlowNode[],
  allPatternEdges: SceneFlowEdge[],
  idToCepNameMap: Map<string, string>
): ICepPatternNode => {
  const { data, id } = node;
  const patternData = data as PatternNodeData;

  const cepNode: ICepPatternNode = {
    name: idToCepNameMap.get(id)!,
    type: patternData.type as CepNodeType & ('ATOMIC' | 'COMPOSITE'),
    quantifier: patternData.quantifier,
    condition: patternData.condition
      ? { type: 'AVIATOR', expression: patternData.condition }
      : null,
    times: patternData.times || null,
    window: patternData.window || null,
    untilCondition: null,
    afterMatchSkipStrategy: {
      type: 'SKIP_TILL_NEXT',
      patternName: null,
    },
    graph: null,
  };

  if (patternData.type === 'COMPOSITE') {
    const childNodes = allPatternNodes.filter((n) => n.parentId === id);
    const childNodeIds = new Set(childNodes.map((n) => n.id));
    const internalEdges = allPatternEdges.filter(
      (e) => childNodeIds.has(e.source) && childNodeIds.has(e.target)
    );
    cepNode.graph = {
      nodes: childNodes.map((child) =>
        convertNode(child, allPatternNodes, allPatternEdges, idToCepNameMap)
      ),
      edges: internalEdges.map((edge) => ({
        source: idToCepNameMap.get(edge.source)!,
        target: idToCepNameMap.get(edge.target)!,
        type: edge.data!.consumingStrategy,
      })),
    };
  }
  return cepNode;
};

/**
 * 递归收集节点及其所有子孙节点。
 * (此函数保持不变)
 */
const collectNodesRecursively = (
  nodeId: string,
  allNodes: SceneFlowNode[],
  collectedIds: Set<string>
) => {
  if (collectedIds.has(nodeId)) return;
  collectedIds.add(nodeId);
  const children = allNodes.filter((n) => n.parentId === nodeId);
  for (const child of children) {
    collectNodesRecursively(child.id, allNodes, collectedIds);
  }
};

/**
 * [原有函数] 识别并转换事件模式为 Flink CEP 兼容的 JSON。
 * (此函数保持不变)
 */
export const generateFlinkCepJson = (
  reactFlowNodes: SceneFlowNode[],
  reactFlowEdges: SceneFlowEdge[],
  useId: boolean = false
): FlinkCEP_Pattern => {
  const llmNodes = reactFlowNodes.filter((n) => isComputeNodeType(n.data.type));
  if (llmNodes.length === 0) {
    // 如果没有LLM节点，我们假定所有非计算节点构成一个模式
    const patternNodes = reactFlowNodes.filter((n) => isComputeNodeType(n.data.type) === false);
    if (patternNodes.length === 0) return { nodes: [], edges: [] };

    const patternNodeIds = new Set(patternNodes.map((n) => n.id));
    const allPatternEdges = reactFlowEdges.filter(
      (e) => e.type === 'strategy' && patternNodeIds.has(e.source) && patternNodeIds.has(e.target)
    );
    const allPatternNodes = patternNodes;
    const idToCepNameMap = new Map<string, string>();
    allPatternNodes.forEach((n) => {
      const cepName = useId ? n.id : n.data.label || n.data.name;
      idToCepNameMap.set(n.id, cepName);
    });
    const topLevelPatternNodes = allPatternNodes.filter(
      (n) => !n.parentId || !patternNodeIds.has(n.parentId)
    );
    const finalCepNodes = topLevelPatternNodes.map((n) =>
      convertNode(n, allPatternNodes, allPatternEdges, idToCepNameMap)
    );
    const topLevelNodeIds = new Set(topLevelPatternNodes.map((n) => n.id));
    const finalCepEdges: ICepPatternEdge[] = allPatternEdges
      .filter((e) => topLevelNodeIds.has(e.source) && topLevelNodeIds.has(e.target))
      .map((edge) => ({
        source: idToCepNameMap.get(edge.source)!,
        target: idToCepNameMap.get(edge.target)!,
        type: edge.data!.consumingStrategy,
      }));

    return { nodes: finalCepNodes, edges: finalCepEdges };
  }

  // --- 原有逻辑保持不变 ---
  const patternNodeIds = new Set<string>();
  const queue: string[] = [];
  reactFlowEdges.forEach((edge) => {
    if (edge.type === 'compute' && llmNodes.some((llm) => llm.id === edge.target)) {
      queue.push(edge.source);
    }
  });
  const initialPatternStarters = [...queue];
  initialPatternStarters.forEach((startNodeId) => {
    let currentNodeId: string | undefined = startNodeId;
    while (currentNodeId && !patternNodeIds.has(currentNodeId)) {
      collectNodesRecursively(currentNodeId, reactFlowNodes, patternNodeIds);
      const incomingEdge = reactFlowEdges.find(
        (e) => e.target === currentNodeId && e.type === 'strategy'
      );
      currentNodeId = incomingEdge?.source;
    }
  });
  const allPatternEdges = reactFlowEdges.filter(
    (e) => e.type === 'strategy' && patternNodeIds.has(e.source) && patternNodeIds.has(e.target)
  );
  const allPatternNodes = reactFlowNodes.filter((n) => patternNodeIds.has(n.id));
  const idToCepNameMap = new Map<string, string>();
  allPatternNodes.forEach((n) => {
    const cepName = useId ? n.id : n.data.label || n.data.name;
    idToCepNameMap.set(n.id, cepName);
  });
  const topLevelPatternNodes = allPatternNodes.filter(
    (n) => !n.parentId || !patternNodeIds.has(n.parentId)
  );
  const finalCepNodes = topLevelPatternNodes.map((n) =>
    convertNode(n, allPatternNodes, allPatternEdges, idToCepNameMap)
  );
  const topLevelNodeIds = new Set(topLevelPatternNodes.map((n) => n.id));
  const finalCepEdges: ICepPatternEdge[] = allPatternEdges
    .filter((e) => topLevelNodeIds.has(e.source) && topLevelNodeIds.has(e.target))
    .map((edge) => ({
      source: idToCepNameMap.get(edge.source)!,
      target: idToCepNameMap.get(edge.target)!,
      type: edge.data!.consumingStrategy,
    }));
  return { nodes: finalCepNodes, edges: finalCepEdges };
};

/**
 * [新增函数] 生成一个或多个 "when-then" 结构，每个结构包含一个事件模式和匹配后执行的计算。
 *
 * @param reactFlowNodes - 来自 React Flow 的节点数组。
 * @param reactFlowEdges - 来自 React Flow 的边数组。
 * @param useId - 如果为true, 则生成的节点name和关系使用 react flow 中的节点id; 否则使用 label || name.
 * @returns 'WhenThenClause' 对象的数组。
 */
export const generateWhenThenJson = (
  reactFlowNodes: SceneFlowNode[],
  reactFlowEdges: SceneFlowEdge[],
  useId: boolean = false
): WhenThenClause[] => {
  // 1. 找到图中所有作为 "then" 部分的 LLM 节点
  const llmNodes = reactFlowNodes.filter(
    (n): n is SceneFlowNode & { data: LlmNodeData } => isComputeNodeType(n.data.type) as boolean
  );

  if (llmNodes.length === 0) {
    console.warn("未找到 计算 节点，无法生成 'when-then' 结构。");
    return [];
  }

  // 2. 为每个 LLM 节点生成一个 "when-then" 对象
  const whenThenClauses = llmNodes.map((llmNode) => {
    // 3. 隔离出当前 LLM 节点的上游子图（即它的 "when" 部分）
    const patternNodeIds = new Set<string>();
    const queue: string[] = [];

    reactFlowEdges.forEach((edge) => {
      if (edge.type === 'compute' && edge.target === llmNode.id) {
        queue.push(edge.source);
      }
    });

    const initialPatternStarters = [...queue];

    initialPatternStarters.forEach((startNodeId) => {
      let currentNodeId: string | undefined = startNodeId;
      while (currentNodeId && !patternNodeIds.has(currentNodeId)) {
        collectNodesRecursively(currentNodeId, reactFlowNodes, patternNodeIds);
        const incomingEdge = reactFlowEdges.find(
          (e) => e.target === currentNodeId && e.type === 'strategy'
        );
        currentNodeId = incomingEdge?.source;
      }
    });

    // 4. 构建只包含当前模式和其对应LLM节点的子图，用于生成"when"部分
    const subgraphNodes = reactFlowNodes.filter(
      (n) => patternNodeIds.has(n.id) || n.id === llmNode.id
    );

    // 5. 调用现有函数来生成 "when" 部分
    const whenClause = generateFlinkCepJson(subgraphNodes, reactFlowEdges, useId);

    // 6. "then" 部分就是 LLM 节点的数据
    const thenClause = {
      id: llmNode.id,
      ...llmNode.data,
    };

    return {
      when: whenClause,
      then: thenClause,
    };
  });

  return whenThenClauses;
};

// =================================================================
// 4. 示例用法
// =================================================================

// const nodes: SceneFlowNode[] = [{"id":"vi3csmmkqq7bts6c992sl83d","position":{"x":-3.9215895475255422,"y":-97.8299163919822},"type":"atomic","data":{"name":"判断单元","type":"ATOMIC","label":"判断单元1","quantifier":{"consumingStrategy":"STRICT","innerConsumingStrategy":"SKIP_TILL_NEXT","properties":["LOOPING"]},"condition":"event.type === 'voice'","times":{"from":1,"to":5,"windowTime":null},"errors":[],"window":{"type":"FIRST_AND_LAST","time":{"unit":"SECONDS","size":60}}},"measured":{"width":350,"height":130},"selected":false,"dragging":false},{"id":"y4vuedyodwzqbs1ejgpkxl44","position":{"x":476.20435159916076,"y":-100.60313376859118},"type":"LLM_INFERENCE","data":{"name":"大模型处理","label":"大模型处理","type":"LLM_INFERENCE","modelProvider":"OpenAI","model":"o1","promptTemplate":"我希望你能扮演一个使用TPOT的自动机器学习(AutoML)机器人。我正在研究一个预测[...]的模型。请编写Python代码来找到具有最高AUC测试集分数的最佳分类模型。","promptVariables":[],"temperature":0.7,"topP":1,"mcps":["dwmwpos580dvs0gpypc78xx8","owfu52n4jqli2mlg7o19tbvs"],"outputActions":["voaexrgt4f6a0ccw73ldu6t6","gae9o9tgnl0i30se7bdsd1gs"],"errors":[]},"measured":{"width":300,"height":437},"selected":false,"dragging":false},{"id":"iwsnot91r1shz92ustq97ks2","position":{"x":-559.3996294567372,"y":-116.02182010504549},"type":"atomic","data":{"name":"判断单元","type":"ATOMIC","label":"判断单元0","quantifier":{"consumingStrategy":"STRICT","innerConsumingStrategy":"SKIP_TILL_NEXT","properties":["SINGLE"]},"errors":[],"condition":"event.type === 'hello'"},"measured":{"width":350,"height":104},"selected":false,"dragging":false},{"id":"qif0bnzrecry1pqcpmracrg7","position":{"x":-739.7551479418822,"y":286.98891153563926},"type":"composite","data":{"name":"判断分组","type":"COMPOSITE","label":"判断分组","quantifier":{"consumingStrategy":"STRICT","innerConsumingStrategy":"SKIP_TILL_NEXT","properties":["SINGLE"]},"errors":[]},"measured":{"width":1078,"height":290},"width":1077.7778784578954,"height":290,"selected":false,"dragging":false},{"id":"fwei14de7fftaq8bgey77imy","position":{"x":40,"y":124.02910883203856},"type":"atomic","data":{"name":"判断单元","type":"ATOMIC","label":"分组内判断A","quantifier":{"consumingStrategy":"STRICT","innerConsumingStrategy":"SKIP_TILL_NEXT","properties":["SINGLE","OPTIONAL"]},"condition":"event.type === 'voice'","errors":[]},"parentId":"qif0bnzrecry1pqcpmracrg7","expandParent":true,"measured":{"width":350,"height":104},"selected":false,"dragging":false},{"id":"c0sr4jw8wwmr5lill2c0g80h","position":{"x":687.7778784578954,"y":120},"type":"atomic","data":{"name":"判断单元","type":"ATOMIC","label":"分组内判断B","quantifier":{"consumingStrategy":"STRICT","innerConsumingStrategy":"SKIP_TILL_NEXT","properties":["LOOPING"]},"condition":"event.type === 123","times":{"from":1,"to":5,"windowTime":null},"window":{"type":"FIRST_AND_LAST","time":{"unit":"SECONDS","size":60}},"errors":[]},"parentId":"qif0bnzrecry1pqcpmracrg7","expandParent":true,"measured":{"width":350,"height":130},"selected":false,"dragging":false}];
// const edges: SceneFlowEdge[] = [{"id":"fy0xo1bmd64oepm7roh6c6ey","source":"iwsnot91r1shz92ustq97ks2","target":"vi3csmmkqq7bts6c992sl83d","type":"strategy","data":{"consumingStrategy":"SKIP_TILL_NEXT"},"style":{"strokeWidth":5},"animated":true,"selected":false},{"id":"b61pehwpkyot3cnj3qdiu0yi","source":"vi3csmmkqq7bts6c992sl83d","target":"y4vuedyodwzqbs1ejgpkxl44","type":"compute","animated":true,"style":{"strokeWidth":5},"selected":false},{"id":"tclufp25n5n52ippjhrkiquj","source":"qif0bnzrecry1pqcpmracrg7","target":"y4vuedyodwzqbs1ejgpkxl44","type":"compute","animated":true,"style":{"strokeWidth":5}},{"id":"la0h86y50roobzq3v47odybl","source":"fwei14de7fftaq8bgey77imy","target":"c0sr4jw8wwmr5lill2c0g80h","type":"strategy","data":{"consumingStrategy":"SKIP_TILL_NEXT"},"style":{"strokeWidth":5},"animated":true}];

// // 调用新函数
// console.log("--- 生成 'When-Then' 结构 ---");
// const whenThenResult = generateWhenThenJson(nodes, edges, false);
// console.log(JSON.stringify(whenThenResult, null, 2));
