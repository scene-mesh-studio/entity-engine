import type { EdgeProps } from '@xyflow/react';

import React from 'react';
import { BaseEdge, useReactFlow, getBezierPath } from '@xyflow/react';

// 引入 Box 用于样式化

const ComputeEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeStyle = {
    ...style,
    strokeDasharray: '5 5',
    strokeWidth: 2,
  };

  return <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />;
};

export default React.memo(ComputeEdge);
