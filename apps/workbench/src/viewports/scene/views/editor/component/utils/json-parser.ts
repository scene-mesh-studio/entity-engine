import type {
  AllNodeData,
  IPatternNode,
  SceneFlowEdge,
  SceneFlowNode,
  ICepPatternEdge,
  ICepPatternNode,
  FlinkCEP_Pattern,
  IComputePatternNode,
} from '../scene-flow-types'; // Ensure this path is correct for your project structure

import { createId } from '@paralleldrive/cuid2';

const GROUP_NODE_TYPE = 'composite';
const ATOMIC_NODE_TYPE = 'atomic';

/**
 * Recursively processes the graph structure from the backend, creating unique IDs for nodes
 * and then building edges based on those new IDs.
 *
 * @param graph The graph object from the backend, containing nodes and edges.
 * @param allNodes The accumulator array for all SceneFlowNode objects.
 * @param allEdges The accumulator array for all SceneFlowEdge objects.
 * @param parentId The newly generated unique ID of the parent node, if one exists.
 * @param nameToIdMap A map that associates original node names with their new unique IDs.
 */
function processGraph(
  graph: { nodes: IPatternNode[]; edges: ICepPatternEdge[] },
  allNodes: SceneFlowNode[],
  allEdges: SceneFlowEdge[],
  parentId: string | null,
  nameToIdMap: Map<string, string>
) {
  // --- LAYOUT LOGIC CHANGED TO HORIZONTAL ---
  const PADDING = 80; // Padding from the parent's border.
  const NODE_SPACING_X = 300; // Horizontal spacing between sibling nodes.
  let xPos = PADDING; // The running X-coordinate for the next node.

  // 1. Process all nodes in the current graph level
  // This loop creates nodes, assigns them new IDs, and handles recursive calls.
  for (const backendNode of graph.nodes) {
    const newId = createId(); // Generate a new, unique ID for the node.
    nameToIdMap.set(backendNode.name, newId); // Map the original name to the new ID.

    let newNode: SceneFlowNode | null = null;

    if (backendNode.type === 'ATOMIC' || backendNode.type === 'COMPOSITE') {
      const cepNode = backendNode as ICepPatternNode;
      const nodeType = cepNode.type === 'COMPOSITE' ? GROUP_NODE_TYPE : ATOMIC_NODE_TYPE;

      newNode = {
        id: newId, // Use the new ID.
        type: nodeType,
        position: { x: xPos, y: PADDING }, // Assign horizontal position
        data: {
          name: cepNode.name,
          label: cepNode.name,
          type: cepNode.type,
          quantifier: cepNode.quantifier,
          condition: cepNode.condition?.expression,
          times: cepNode.times || undefined,
          window: cepNode.window || undefined,
        },
      };
    } else {
      const computeNode = backendNode as IComputePatternNode;
      newNode = {
        id: newId, // Use the new ID.
        type: computeNode.type,
        position: { x: xPos, y: PADDING }, // Assign horizontal position
        data: {
          ...computeNode,
          label: computeNode.name,
        } as AllNodeData,
      };
    }

    if (parentId) {
      newNode.parentId = parentId;
      newNode.expandParent = true;
    }
    allNodes.push(newNode);
    xPos += NODE_SPACING_X; // Increment the X position for the next node.

    // If the node is a composite group, recurse into its own graph.
    // Pass the NEW ID as the parentId for the next level.
    if (
      (backendNode.type === 'COMPOSITE' || backendNode.type === 'ATOMIC') &&
      (backendNode as ICepPatternNode).type === 'COMPOSITE' &&
      (backendNode as ICepPatternNode).graph
    ) {
      processGraph(
        (backendNode as ICepPatternNode).graph!,
        allNodes,
        allEdges,
        newId, // Pass the new unique ID as the parentId.
        nameToIdMap
      );
    }
  }

  // 2. Process all edges in the current graph level
  // This runs after all nodes in this level have been added to the map.
  for (const backendEdge of graph.edges) {
    // Look up the new unique IDs from the map.
    const sourceId = nameToIdMap.get(backendEdge.source);
    const targetId = nameToIdMap.get(backendEdge.target);

    if (sourceId && targetId) {
      const newEdge: SceneFlowEdge = {
        id: `e-${sourceId}-${targetId}`, // Edge ID based on new node IDs.
        source: sourceId, // Use the new source ID.
        target: targetId, // Use the new target ID.
        type: 'strategy',
        data: {
          consumingStrategy: backendEdge.type,
        },
        animated: true,
        style: {
          strokeWidth: 2,
        },
      };
      allEdges.push(newEdge);
    } else {
      // Log a warning if an edge points to a node name that wasn't found in the map.
      console.warn(
        `Could not create edge for names [${backendEdge.source} -> ${backendEdge.target}] because one or both names could not be mapped to a new ID.`
      );
    }
  }
}

/**
 * Parses the backend JSON data for a Flink CEP pattern into arrays of nodes and edges
 * compatible with React Flow. This version creates unique IDs for all nodes.
 *
 * @param pattern The FlinkCEP_Pattern object from the backend.
 * @returns An object containing the arrays of nodes and edges ready for React Flow.
 */
export function parseFlowJson(pattern: FlinkCEP_Pattern): {
  nodes: SceneFlowNode[];
  edges: SceneFlowEdge[];
} {
  const nodes: SceneFlowNode[] = [];
  const edges: SceneFlowEdge[] = [];
  // The map is created once and passed through all recursive calls to be populated.
  const nameToIdMap = new Map<string, string>();

  processGraph(pattern, nodes, edges, null, nameToIdMap);

  return { nodes, edges };
}
