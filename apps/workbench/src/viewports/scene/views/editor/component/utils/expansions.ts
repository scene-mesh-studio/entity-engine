import type { Node, Dimensions, XYPosition } from '@xyflow/react';

type Expansion = {
  dimension: Dimensions;
  offset: XYPosition;
  position: XYPosition;
  changed: boolean;
};

type Bounds = { x1: number; x2: number; y1: number; y2: number };

function resolveExpansion(parent: Node, childBounds: Bounds): Expansion {
  const { x1, y1, x2, y2 } = childBounds;
  const { width = 0, height = 0 } = parent.measured ?? {};
  const { x, y } = parent.position;

  const dimension = { width: x2 - x1, height: y2 - y1 };
  const offset = { x: x1, y: y1 };
  const position = { x: x + x1, y: y + y1 };

  // We check if there is even is an expansion happening
  const changed =
    dimension.width !== width || dimension.height !== height || offset.x !== 0 || offset.y !== 0;

  return { dimension, offset, position, changed };
}

export function expandGroupNodes<T extends Node>(nodes: T[], padding = 25, headerHeight = 0) {
  // A map for the children of each parent node
  const childMap = new Map<string, Node[]>();
  // A lookup of the parent nodes themselves
  const parents = new Map<string, Node>();

  // We want to iterate over the nodes in a reverse manner
  // because we first fill the childMap up
  // and then determine if a node is a parent node by looking at the childMap
  for (const node of nodes.toReversed()) {
    // node is a child node
    if (node.parentId) {
      let childNodes = childMap.get(node.parentId);
      if (!childNodes) {
        childNodes = [];
        childMap.set(node.parentId, childNodes);
      }
      childNodes.push(node);
    }

    // node is a parent node
    // Note: a node can be both: parent and child
    if (childMap.has(node.id)) {
      parents.set(node.id, node);
    }
  }

  // here we calculate for each parent the expansion of its child nodes
  const parentExpansions = new Map<string, Expansion>();

  for (const [parentId, childNodes] of childMap) {
    const parent = parents.get(parentId);
    if (!parent) continue;

    // The child bounds are made up of x1, y1, x2, y2 coordinates
    // we calculate the actual expansion that should occur in the following step
    const childBounds = childNodes.reduce(
      (acc: Bounds, childNode: Node) => {
        const { width = 0, height = 0 } = childNode.measured ?? {};
        const { x, y } = childNode.position;

        const x1 = x - padding;
        const y1 = y - padding - headerHeight;
        acc.x1 = x1 < acc.x1 ? x1 : acc.x1;
        acc.y1 = y1 < acc.y1 ? y1 : acc.y1;

        const x2 = x + width + padding;
        const y2 = y + height + padding;
        acc.x2 = x2 > acc.x2 ? x2 : acc.x2;
        acc.y2 = y2 > acc.y2 ? y2 : acc.y2;

        return acc;
      },
      {
        x1: Infinity,
        y1: Infinity,
        x2: -Infinity,
        y2: -Infinity,
      }
    );

    const expansion = resolveExpansion(parent, childBounds);

    // if there was no change we want to skip setting nodes
    if (expansion.changed) {
      parentExpansions.set(parentId, expansion);
    }
  }

  const newNodes = nodes.map((node) => {
    const expansion = parentExpansions.get(node.id);
    const parentExpansion = parentExpansions.get(node.parentId ?? '');

    // node can be parent and child at the same time
    // and both expansions can happen at once
    if (expansion && parentExpansion) {
      return {
        ...node,
        ...expansion.dimension,
        position: {
          x: expansion.position.x - parentExpansion.offset.x,
          y: expansion.position.y - parentExpansion.offset.y,
        },
      };
    }

    if (expansion) {
      return {
        ...node,
        ...expansion.dimension,
        position: expansion.position,
      };
    }

    if (parentExpansion) {
      return {
        ...node,
        position: {
          x: node.position.x - parentExpansion.offset.x,
          y: node.position.y - parentExpansion.offset.y,
        },
      };
    }

    return node;
  });

  return newNodes;
}
