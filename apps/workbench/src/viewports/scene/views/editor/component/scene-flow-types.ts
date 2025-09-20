import type { Node, Edge } from '@xyflow/react';

// =================================================================
// 基础类型定义
// =================================================================

export interface FlowNodeTemplate {
  title: string;
  icon?: string;
  description?: string;
  nodeType: string;
  initParas: AllNodeData;
}

export interface FlowNodeTemplateCatalog {
  title: string;
  nodes: FlowNodeTemplate[];
}

// =================================================================
// 1. 类型标识符：将所有节点类型集中管理
// =================================================================
export type CepNodeType = 'ATOMIC' | 'COMPOSITE';
export type ComputeNodeType = 'LLM_INFERENCE' | 'SCRIPT' | 'FORMAT_OUTPUT';
export type AllNodeTypes = CepNodeType | ComputeNodeType;

// =================================================================
// CEP 相关类型定义
// =================================================================
export type QuantifierProperty =
  | 'SINGLE'
  | 'OPTIONAL'
  | 'LOOPING'
  | 'TIMES'
  | 'TIMES_OR_MORE'
  | 'GREEDY';
export type ConsumingStrategy = 'SKIP_TILL_NEXT' | 'STRICT' | 'SKIP_TILL_ANY';
export type TimeUnit = 'MILLISECONDS' | 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';

export interface TimeSpec {
  unit: TimeUnit;
  size: number;
}
export interface CepWindow {
  type: 'FIRST_AND_LAST';
  time: TimeSpec;
}
export interface CepTimes {
  from: number;
  to: number;
  windowTime: CepWindow | null;
}
export interface CepQuantifier {
  consumingStrategy: ConsumingStrategy;
  innerConsumingStrategy: ConsumingStrategy;
  properties: QuantifierProperty[];
}
export interface CepCondition {
  type: 'AVIATOR';
  expression: string;
}

// =================================================================
// “计算节点” 的基础类型
// =================================================================
export interface BaseComputeNodeData extends Record<string, unknown> {
  name: string;
  label?: string;
  type: ComputeNodeType; // 使用联合类型作为辨别符
  errors?: FlowValidationError[];
}

// =================================================================
// 具体的计算节点类型，都继承自基础类型
// =================================================================

// 大模型推理节点
export interface LlmNodeData extends BaseComputeNodeData {
  type: 'LLM_INFERENCE';
  modelProvider: string;
  model: string;
  promptTemplate: string;
  promptVariables: { variable: string; value: string | number | boolean | null }[];
  temperature?: number;
  topP?: number;
  mcps: string[];
  outputActions: string[];
}

// 脚本计算节点
export interface ScriptNodeData extends BaseComputeNodeData {
  type: 'SCRIPT';
  language: 'javascript';
  script: string;
}

// 制定输出节点
export interface FormatOutputNodeData extends BaseComputeNodeData {
  type: 'FORMAT_OUTPUT';
  outputActions: Array<{ actionId: string; values: { fieldName: string; value: any }[] }>;
}

// =================================================================
// “计算节点” 的联合类型
// =================================================================
export type ComputeNodeData = LlmNodeData | ScriptNodeData | FormatOutputNodeData;

// =================================================================
// “模式匹配节点” 的类型定义
// =================================================================
export interface PatternNodeData extends Record<string, unknown> {
  name: string;
  label?: string;
  type: CepNodeType;
  quantifier: CepQuantifier;
  condition?: string;
  times?: CepTimes;
  window?: CepWindow;
  errors?: FlowValidationError[];
}

// =================================================================
// 包含所有节点数据类型的顶层联合类型
// =================================================================
export type AllNodeData = PatternNodeData | ComputeNodeData;

// =================================================================
// 核心 React Flow 节点和边类型 (已改回原始名称)
// =================================================================
export type SceneFlowNode = Node<AllNodeData>; // <-- 已改回 CEP_Node

export interface StrategyEdgeData extends Record<string, unknown> {
  consumingStrategy: ConsumingStrategy;
}
export type SceneFlowEdge = Edge<StrategyEdgeData>; // <-- 已改回 CEP_Edge

// =================================================================
// 用于导出/导入的后端 JSON 类型
// =================================================================

// CEP 模式节点
export interface ICepPatternNode {
  name: string;
  type: 'ATOMIC' | 'COMPOSITE';
  quantifier: CepQuantifier;
  condition: CepCondition | null;
  graph: {
    nodes: ICepPatternNode[];
    edges: ICepPatternEdge[];
  } | null;
  times: CepTimes | null;
  window: CepWindow | null;
  untilCondition: null;
  afterMatchSkipStrategy: {
    type: string;
    patternName: string | null;
  };
}

// 计算节点
export interface ILlmPatternNode {
  name: string;
  type: 'LLM_INFERENCE';
  model: string;
  promptTemplate: string;
  inputVariables: Array<{ name: string; source: string }>;
  outputVariable: string;
}
export interface IScriptPatternNode {
  name: string;
  type: 'SCRIPT';
  language: 'javascript' | 'python';
  script: string;
}
export interface IFormatOutputPatternNode {
  name: string;
  type: 'FORMAT_OUTPUT';
  outputMapping: Array<{ outputKey: string; inputValueSource: string }>;
}

// 计算节点的联合类型
export type IComputePatternNode = ILlmPatternNode | IScriptPatternNode | IFormatOutputPatternNode;

// 所有后端节点的联合类型
export type IPatternNode = ICepPatternNode | IComputePatternNode;

// 后端边的类型
export interface ICepPatternEdge {
  source: string;
  target: string;
  type: ConsumingStrategy;
}

// 最终导出的 JSON 结构 (已改回原始名称)
export interface FlinkCEP_Pattern {
  // <-- 已改回 FlinkCEP_Pattern
  nodes: IPatternNode[];
  edges: ICepPatternEdge[];
}

// =================================================================
// 校验错误的类型定义
// =================================================================
export interface FlowValidationError {
  nodeId: string;
  nodeName: string;
  type:
    | 'ISOLATED_NODE'
    | 'MISSING_CONDITION'
    | 'EMPTY_GROUP'
    | 'CIRCULAR_DEPENDENCY'
    | 'INVALID_SCRIPT'
    | 'MISSING_MODEL';
  message: string;
}
