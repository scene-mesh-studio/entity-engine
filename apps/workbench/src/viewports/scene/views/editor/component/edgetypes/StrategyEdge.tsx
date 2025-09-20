import type { EdgeProps } from '@xyflow/react';
import type { ConsumingStrategy } from '../scene-flow-types';

import React from 'react';
import { BaseEdge, useReactFlow, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

import { Button } from '@mui/material'; // 引入 Box 用于样式化

const StrategyEdge: React.FC<EdgeProps> = ({
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

  const consumingStrategy: ConsumingStrategy =
    data?.consumingStrategy === 'STRICT' ? 'STRICT' : 'SKIP_TILL_NEXT';

  const edgeStyle = {
    ...style,
    strokeDasharray: consumingStrategy === 'SKIP_TILL_NEXT' ? '5 5' : undefined,
    strokeWidth: 2,
  };

  const onEdgeClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const nextStrategy: ConsumingStrategy =
      consumingStrategy === 'STRICT' ? 'SKIP_TILL_NEXT' : 'STRICT';
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          return { ...edge, data: { ...edge.data, consumingStrategy: nextStrategy } };
        }
        return edge;
      })
    );
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      <EdgeLabelRenderer>
        {/* <Box
          sx={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            bgcolor: consumingStrategy === 'STRICT' ? 'primary.light' : 'success.light',
            p: '2px 8px',
            borderRadius: '5px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'text.primary',
            boxShadow: 1,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'background.neutral',
            },
            pointerEvents: 'all', // 确保元素可以接收指针事件
            zIndex: 1, // 提升标签的堆叠层级
          }}
          className="nodrag nopan"
          onClick={onEdgeClick}
        >
          {consumingStrategy === 'STRICT' ? '严格跟随' : '宽松跟随'}
        </Box> */}
        <Button
          variant="contained"
          size="small"
          color={consumingStrategy === 'STRICT' ? 'primary' : 'success'}
          onClick={onEdgeClick}
          className="nodrag nopan"
          sx={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            zIndex: 1,
            pointerEvents: 'all',
            boxShadow: 1,
          }}
        >
          {consumingStrategy === 'STRICT' ? '严格跟随' : '宽松跟随'}
        </Button>
      </EdgeLabelRenderer>
    </>
  );
};

export default React.memo(StrategyEdge);
