import type { NodeProps } from '@xyflow/react';
import type {
  TimeUnit,
  SceneFlowNode,
  PatternNodeData,
  QuantifierProperty,
} from '../scene-flow-types';

import React, { useState } from 'react';
import { Handle, Position, NodeToolbar, useReactFlow } from '@xyflow/react';

// 导入所有需要的 Material-UI 组件
import {
  Box,
  Stack,
  Badge,
  Dialog,
  Button,
  Select,
  Divider,
  Tooltip,
  MenuItem,
  Checkbox,
  TextField,
  IconButton,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  FormControlLabel,
  DialogContentText,
} from '@mui/material';

import { IconifyEx } from 'src/components/iconify';

// --- 辅助函数 ---
const getQuantifierText = (data: PatternNodeData): string => {
  const props = data.quantifier.properties;
  const isOptional = props.includes('OPTIONAL');
  const isRepeating = props.includes('TIMES') || props.includes('LOOPING');
  let text: string;
  if (isRepeating && data.times) {
    if (data.times.from === data.times.to) {
      text = `重复 ${data.times.from} 次`;
    } else {
      text = `重复 ${data.times.from} - ${data.times.to} 次`;
    }
  } else if (isRepeating) {
    text = '循环发生';
  } else {
    text = '发生一次';
  }
  if (isOptional) {
    if (!isRepeating) {
      return '可选发生';
    }
    return `可选 (${text})`;
  }
  return text;
};

const mapUnitToText = (unit: TimeUnit): string => {
  const unitMap: Record<TimeUnit, string> = {
    SECONDS: '秒',
    MINUTES: '分钟',
    HOURS: '小时',
    DAYS: '天',
    MILLISECONDS: '毫秒',
  };
  return unitMap[unit] || unit;
};

const getQuantifierIcon = (properties: QuantifierProperty[]): string => {
  if (properties.includes('OPTIONAL')) return '?';
  if (properties.includes('LOOPING') || properties.includes('TIMES')) return '+';
  return '';
};

const GroupNode: React.FC<NodeProps<SceneFlowNode>> = (props) => {
  const { id, data: nodeData, selected } = props;
  const { setNodes, getNodes, getEdges, setEdges } = useReactFlow();
  const data = nodeData as PatternNodeData;

  // --- 状态管理和事件处理器 ---
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState<PatternNodeData>(data);
  const handleOpenEditDialog = () => {
    setEditedData(data);
    setEditDialogOpen(true);
  };
  const handleCloseEditDialog = () => setEditDialogOpen(false);
  const handleOpenDeleteDialog = () => setDeleteDialogOpen(true);
  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);
  const handleDataChange = <K extends keyof PatternNodeData>(
    field: K,
    value: PatternNodeData[K]
  ) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };
  const handleSave = () => {
    setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data: editedData } : node)));
    handleCloseEditDialog();
  };
  const handleConfirmDelete = () => {
    const allNodes = getNodes();
    const allEdges = getEdges();
    const getDescendantIds = (nodeId: string): string[] => {
      const children = allNodes.filter((n) => n.parentId === nodeId);
      if (children.length === 0) return [];
      const descendantIds = children.map((c) => c.id);
      children.forEach((c) => descendantIds.push(...getDescendantIds(c.id)));
      return descendantIds;
    };

    const idsToDelete = [id, ...getDescendantIds(id)];
    const edgesToDelete = allEdges
      .filter((edge) => idsToDelete.includes(edge.source) || idsToDelete.includes(edge.target))
      .map((edge) => edge.id);
    setNodes((nds) => nds.filter((node) => !idsToDelete.includes(node.id)));
    setEdges((eds) => eds.filter((edge) => !edgesToDelete.includes(edge.id)));
    handleCloseDeleteDialog();
  };
  const isOptional = editedData.quantifier.properties.includes('OPTIONAL');
  const isRepeating = editedData.quantifier.properties.includes('TIMES');
  const handleModeChange = (isRepeat: boolean) => {
    const newProperties: QuantifierProperty[] = isRepeat ? ['TIMES'] : ['SINGLE'];
    if (!isRepeat && isOptional) {
      newProperties.push('OPTIONAL');
    }
    handleDataChange('quantifier', { ...editedData.quantifier, properties: newProperties });
    if (isRepeat && !editedData.times) {
      handleDataChange('times', { from: 1, to: 1, windowTime: null });
    }
  };
  const handleOptionalChange = (checked: boolean) => {
    const newProperties: QuantifierProperty[] = [...editedData.quantifier.properties].filter(
      (p) => p !== 'OPTIONAL'
    );
    if (checked) {
      newProperties.push('OPTIONAL');
    }
    handleDataChange('quantifier', { ...editedData.quantifier, properties: newProperties });
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'grey.400',
        borderRadius: '5px',
        p: 0,
        m: 0,
        backgroundColor: 'rgba(237, 247, 255, 0.3)',
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: -1,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          backgroundColor: '#0000ff',
        }}
      />

      <Stack
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        gap={1}
        sx={{
          width: '100%',
          p: 1,
          backgroundColor: 'background.neutral',
          borderTopLeftRadius: '5px',
          borderTopRightRadius: '5px',
          cursor: 'move',
        }}
      >
        <IconifyEx icon="material-icon-theme:drawio" sx={{ width: 20, height: 20 }} />
        <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1 }}>
          {data.label || data.name}
        </Typography>
        <Typography variant="h6" sx={{ lineHeight: 1, mx: 0.5 }}>
          {getQuantifierIcon(data.quantifier.properties)}
        </Typography>
        {(data.errors?.length || 0) > 0 && (
          <Tooltip
            title={data.errors?.map((e, index) => (
              <div key={index}>
                {index + 1}. {e.message}
              </div>
            ))}
            placement="bottom-start"
            arrow
          >
            <Badge color="error" badgeContent={data.errors?.length || 0}>
              <IconifyEx
                icon="mdi:warning-box-outline"
                color="primary"
                sx={{ width: 20, height: 20 }}
              />
            </Badge>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ p: '8px 16px', width: '100%' }}>
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconifyEx icon="mdi:repeat" sx={{ color: 'text.secondary', width: 16, height: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
              {getQuantifierText(data)}
            </Typography>
          </Stack>

          {data.condition && (
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <IconifyEx
                icon="mdi:code-tags"
                sx={{ color: 'text.secondary', width: 16, height: 16, mt: '2px', flexShrink: 0 }}
              />
              <Tooltip title={data.condition} placement="bottom-start" arrow>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-all',
                  }}
                >
                  {data.condition}
                </Typography>
              </Tooltip>
            </Stack>
          )}

          {data.window && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconifyEx
                icon="mdi:clock-outline"
                sx={{ color: 'text.secondary', width: 16, height: 16 }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {` within ${data.window.time.size} ${mapUnitToText(data.window.time.unit)}`}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <NodeToolbar position={Position.Top} isVisible={selected}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: '5px',
            p: '2px 4px',
            boxShadow: 3,
          }}
        >
          <IconButton size="small" color="error" onClick={handleOpenDeleteDialog}>
            <IconifyEx icon="mdi:delete" />
          </IconButton>
          <IconButton size="small" color="info" onClick={handleOpenEditDialog}>
            <IconifyEx icon="mdi:settings" />
          </IconButton>
        </Stack>
      </NodeToolbar>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          backgroundColor: '#00dddd',
        }}
      />

      <Dialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
        keepMounted
      >
        <DialogTitle>编辑分组: {data.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="分组名称"
              value={editedData.label || ''}
              onChange={(e) => handleDataChange('label', e.target.value)}
              helperText="为这个分组行为起一个明确的名字"
            />
            <Divider />
            <Typography variant="overline" color="text.secondary">
              发生规则
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl fullWidth>
                <InputLabel>发生模式</InputLabel>
                <Select
                  value={isRepeating ? 'times' : 'single'}
                  label="发生模式"
                  onChange={(e) => handleModeChange(e.target.value === 'times')}
                >
                  <MenuItem value="single">发生一次</MenuItem>
                  <MenuItem value="times">重复组</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isOptional}
                    onChange={(e) => handleOptionalChange(e.target.checked)}
                  />
                }
                label="可选发生"
                disabled={isRepeating}
              />
            </Stack>
            {isRepeating && (
              <Stack direction="row" spacing={2}>
                <TextField
                  type="number"
                  label="从 (From)"
                  value={editedData.times?.from || 1}
                  onChange={(e) =>
                    handleDataChange('times', {
                      ...editedData.times!,
                      from: Number(e.target.value),
                    })
                  }
                />
                <TextField
                  type="number"
                  label="到 (To)"
                  value={editedData.times?.to || 1}
                  onChange={(e) =>
                    handleDataChange('times', { ...editedData.times!, to: Number(e.target.value) })
                  }
                />
              </Stack>
            )}
            <Divider />
            <Typography variant="overline" color="text.secondary">
              触发条件
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="具体触发条件"
              value={editedData.condition || ''}
              onChange={(e) => handleDataChange('condition', e.target.value)}
              helperText="应用于整个分组的条件"
            />
            <Divider />
            <Typography variant="overline" color="text.secondary">
              时间限制
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!editedData.window}
                  onChange={(e) =>
                    handleDataChange(
                      'window',
                      e.target.checked
                        ? { type: 'FIRST_AND_LAST', time: { unit: 'SECONDS', size: 60 } }
                        : undefined
                    )
                  }
                />
              }
              label="设置时间限制"
            />
            {editedData.window && (
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="时长"
                  value={editedData.window.time.size}
                  onChange={(e) =>
                    handleDataChange('window', {
                      ...editedData.window!,
                      time: { ...editedData.window!.time, size: Number(e.target.value) },
                    })
                  }
                />
                <FormControl fullWidth>
                  <InputLabel>单位</InputLabel>
                  <Select
                    value={editedData.window.time.unit}
                    label="单位"
                    onChange={(e) =>
                      handleDataChange('window', {
                        ...editedData.window!,
                        time: {
                          ...editedData.window!.time,
                          unit: e.target.value as TimeUnit,
                        },
                      })
                    }
                  >
                    <MenuItem value="SECONDS">秒</MenuItem>
                    <MenuItem value="MINUTES">分钟</MenuItem>
                    <MenuItem value="HOURS">小时</MenuItem>
                    <MenuItem value="DAYS">天</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>确认删除分组</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除分组 “{data.label || data.name}” 吗？
            <br />
            <strong>其内部的所有节点和连线都将被一并删除。</strong>
            此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default React.memo(GroupNode);
