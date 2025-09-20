import type { NodeProps } from '@xyflow/react';
import type { IEntityObject } from '@scenemesh/entity-engine';
// Import official types from the types file
import type { SceneFlowNode, FormatOutputNodeData } from '../scene-flow-types';

import { useEntityEngine } from '@scenemesh/entity-engine';
import React, { useMemo, useState, useEffect } from 'react';
import { Handle, Position, NodeToolbar, useReactFlow } from '@xyflow/react';

// Import necessary Material-UI components
import {
  Box,
  Stack,
  Badge,
  Dialog,
  Button,
  Divider,
  Tooltip,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

// Import custom icon component and types
import { IconifyEx } from 'src/components/iconify';

/**
 * FormatOutputNode is a React component for rendering and managing
 * a formatted output node within a React Flow graph.
 */
const FormatOutputNode: React.FC<NodeProps<SceneFlowNode>> = (props) => {
  const { data: nodeData, selected, id } = props;
  const { setNodes, setEdges } = useReactFlow();
  const engine = useEntityEngine();

  // Get data sources from the e-engine
  const actionDataSource = engine.datasourceFactory.getDataSource();

  // Cast incoming data to the official FormatOutputNodeData type
  const data = nodeData as FormatOutputNodeData;

  // --- State for dynamic data ---
  const [availableActions, setAvailableActions] = useState<IEntityObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- State Management for Dialogs ---
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState<FormatOutputNodeData | null>(null);

  // --- Data fetching logic ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!actionDataSource) {
          console.error('Action data source not available.');
          return;
        }
        // Fetch actions and their related fields
        const actionsResult = await actionDataSource.findManyWithReferences({
          modelName: 'action',
          childrenFieldName: 'fields',
        });
        setAvailableActions(actionsResult.data);
      } catch (error) {
        console.error('Failed to fetch node options:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [actionDataSource]);

  // A map for quick lookup of action titles by ID
  const actionsMap = useMemo(
    () =>
      new Map(
        availableActions.map((action) => [
          action.id,
          {
            title: (action.values?.title as string) || (action.values?.name as string),
            fields: (action.values?.fields as IEntityObject[]) || [],
          },
        ])
      ),
    [availableActions]
  );

  // --- Event Handlers ---
  const handleOpenEditDialog = () => {
    setEditedData({ ...data, outputActions: data.outputActions || [] });
    setEditDialogOpen(true);
  };
  const handleCloseEditDialog = () => setEditDialogOpen(false);
  const handleOpenDeleteDialog = () => setDeleteDialogOpen(true);
  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);

  // --- Handlers for editing the outputActions array ---

  const handleAddAction = () => {
    setEditedData((prev) => {
      if (!prev) return null;
      const newActions = [...prev.outputActions, { actionId: '', values: [] }];
      return { ...prev, outputActions: newActions };
    });
  };

  const handleRemoveAction = (index: number) => {
    setEditedData((prev) => {
      if (!prev) return null;
      const newActions = prev.outputActions.filter((_, i) => i !== index);
      return { ...prev, outputActions: newActions };
    });
  };

  const handleActionChange = (index: number, newActionId: string | null) => {
    setEditedData((prev) => {
      if (!prev) return null;
      const newActions = [...prev.outputActions];
      newActions[index] = { actionId: newActionId || '', values: [] }; // Reset values on action change
      return { ...prev, outputActions: newActions };
    });
  };

  const handleAddFieldMapping = (actionIndex: number) => {
    setEditedData((prev) => {
      if (!prev) return null;
      const newActions = [...prev.outputActions];
      newActions[actionIndex].values.push({ fieldName: '', value: '' });
      return { ...prev, outputActions: newActions };
    });
  };

  const handleRemoveFieldMapping = (actionIndex: number, valueIndex: number) => {
    setEditedData((prev) => {
      if (!prev) return null;
      const newActions = [...prev.outputActions];
      newActions[actionIndex].values = newActions[actionIndex].values.filter(
        (_, i) => i !== valueIndex
      );
      return { ...prev, outputActions: newActions };
    });
  };

  const handleFieldMappingChange = (
    actionIndex: number,
    valueIndex: number,
    field: 'fieldName' | 'value',
    newValue: any
  ) => {
    setEditedData((prev) => {
      if (!prev) return null;
      const newActions = [...prev.outputActions];
      newActions[actionIndex].values[valueIndex] = {
        ...newActions[actionIndex].values[valueIndex],
        [field]: newValue,
      };
      return { ...prev, outputActions: newActions };
    });
  };

  const handleSave = () => {
    if (editedData) {
      setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data: editedData } : node)));
    }
    handleCloseEditDialog();
  };

  const handleConfirmDelete = () => {
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
    setNodes((nds) => nds.filter((node) => node.id !== id));
    handleCloseDeleteDialog();
  };

  return (
    <Box
      sx={{
        border: '2px solid',
        borderColor: selected ? 'secondary.main' : 'grey.300',
        borderRadius: '12px',
        p: 0,
        cursor: 'pointer',
        backgroundColor: 'background.paper',
        width: 300,
        boxShadow: selected ? '0px 4px 12px rgba(0,0,0,0.1)' : '0px 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          backgroundColor: '#0000ff',
        }}
      />

      <Stack sx={{ p: '12px 16px' }} spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ width: '100%' }}>
            <IconifyEx icon="material-icon-theme:supabase" sx={{ width: 24, height: 24 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {data.label || '格式化输出'}
              </Typography>
            </Box>
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
        </Stack>
        <Divider />
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            输出动作
          </Typography>
          <Stack spacing={1}>
            {data.outputActions && data.outputActions.length > 0 ? (
              data.outputActions.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    p: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: 'grey.300',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {actionsMap.get(item.actionId)?.title || '未选择动作'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    设置了 {item.values.length} 个字段
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.disabled">
                未配置输出动作
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>

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
          <Tooltip title="删除节点">
            <IconButton size="small" color="error" onClick={handleOpenDeleteDialog}>
              <IconifyEx icon="mdi:delete" />
            </IconButton>
          </Tooltip>
          <Tooltip title="配置节点">
            <IconButton size="small" color="info" onClick={handleOpenEditDialog}>
              <IconifyEx icon="mdi:settings" />
            </IconButton>
          </Tooltip>
        </Stack>
      </NodeToolbar>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen && editedData !== null}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="md"
        keepMounted
      >
        <DialogTitle>编辑格式化输出节点: {editedData?.label}</DialogTitle>
        <DialogContent dividers>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            editedData && (
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="单元名称"
                  value={editedData.label || ''}
                  onChange={(e) => setEditedData({ ...editedData, label: e.target.value })}
                  helperText="给这个输出步骤起一个清晰易懂的名称。"
                />
                <Divider />
                <Typography variant="overline" color="text.secondary">
                  输出动作配置
                </Typography>

                {editedData.outputActions.map((action, actionIndex) => {
                  const selectedAction = availableActions.find((a) => a.id === action.actionId);
                  const availableFields = (selectedAction?.values?.fields as IEntityObject[]) || [];

                  return (
                    <Stack
                      key={actionIndex}
                      spacing={2}
                      sx={{
                        border: '1px dashed',
                        borderColor: 'grey.400',
                        borderRadius: 1,
                        p: 2,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Autocomplete
                          fullWidth
                          options={availableActions}
                          getOptionLabel={(option) =>
                            (option.values.title as string) || (option.values.name as string) || ''
                          }
                          value={selectedAction || null}
                          onChange={(_, newValue) =>
                            handleActionChange(actionIndex, newValue?.id || null)
                          }
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          renderInput={(params) => (
                            <TextField {...params} label={`动作 #${actionIndex + 1}`} />
                          )}
                        />
                        <Tooltip title="删除此动作">
                          <IconButton onClick={() => handleRemoveAction(actionIndex)}>
                            <IconifyEx icon="mdi:delete-outline" />
                          </IconButton>
                        </Tooltip>
                      </Stack>

                      <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                        字段映射
                      </Typography>

                      <Stack spacing={2} sx={{ pl: 2 }}>
                        {action.values.map((valueItem, valueIndex) => (
                          <Stack direction="row" spacing={2} key={valueIndex} alignItems="center">
                            <Autocomplete
                              sx={{ width: 250 }}
                              options={availableFields}
                              getOptionLabel={(option) =>
                                (option.values.fieldTitle as string) || ''
                              }
                              value={
                                availableFields.find(
                                  (f) => f.values.fieldName === valueItem.fieldName
                                ) || null
                              }
                              onChange={(_, newValue) =>
                                handleFieldMappingChange(
                                  actionIndex,
                                  valueIndex,
                                  'fieldName',
                                  newValue?.values?.fieldName || ''
                                )
                              }
                              renderInput={(params) => <TextField {...params} label="字段名称" />}
                            />
                            <TextField
                              fullWidth
                              label="字段值"
                              value={valueItem.value}
                              onChange={(e) =>
                                handleFieldMappingChange(
                                  actionIndex,
                                  valueIndex,
                                  'value',
                                  e.target.value
                                )
                              }
                            />
                            <Tooltip title="删除此字段映射">
                              <IconButton
                                onClick={() => handleRemoveFieldMapping(actionIndex, valueIndex)}
                              >
                                <IconifyEx icon="mdi:delete-outline" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ))}
                        <Button
                          startIcon={<IconifyEx icon="mdi:plus" />}
                          onClick={() => handleAddFieldMapping(actionIndex)}
                          sx={{ alignSelf: 'flex-start' }}
                          disabled={!action.actionId}
                        >
                          添加字段映射
                        </Button>
                      </Stack>
                    </Stack>
                  );
                })}

                <Button
                  startIcon={<IconifyEx icon="mdi:plus-circle-outline" />}
                  onClick={handleAddAction}
                  sx={{ alignSelf: 'center' }}
                  variant="outlined"
                >
                  添加一个输出动作
                </Button>
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>确认删除节点</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除节点 “{data.label || data.name}” 吗？
            <br />
            所有与此节点相关的连线也将被一并删除。此操作无法撤销。
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

export default React.memo(FormatOutputNode);
