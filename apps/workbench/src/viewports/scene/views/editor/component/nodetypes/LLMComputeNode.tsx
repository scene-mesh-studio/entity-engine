import type { NodeProps } from '@xyflow/react';
import type { IEntityObject } from '@scenemesh/entity-engine';
// Import official types from the types file
import type { LlmNodeData, SceneFlowNode } from '../scene-flow-types';

import { useEntityEngine } from '@scenemesh/entity-engine';
import React, { useMemo, useState, useEffect } from 'react';
import { Handle, Position, NodeToolbar, useReactFlow } from '@xyflow/react';

// Import necessary Material-UI components
import {
  Box,
  Chip,
  Stack,
  Badge,
  Slider,
  Dialog,
  Button,
  Select,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  InputLabel,
  IconButton,
  Typography,
  FormControl,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

// Import custom icon component and types
import { IconifyEx } from 'src/components/iconify';

import { useSceneFlowEditorContext } from '../../context/editor-context-provider';

// This local type is now an alias for the official LlmNodeData.
type LlmNodeComponentState = LlmNodeData;

/**
 * LLMComputeNode is a React component for rendering and managing
 * a Large Language Model inference node within a React Flow graph.
 */
const LLMComputeNode: React.FC<NodeProps<SceneFlowNode>> = (props) => {
  const { data: nodeData, selected, id } = props;
  const { setNodes, setEdges } = useReactFlow();
  const { product } = useSceneFlowEditorContext();
  const engine = useEntityEngine();

  // Get data sources from the e-engine
  const llmProviderDataSource = engine.datasourceFactory.getDataSource();
  const mcpDataSource = engine.datasourceFactory.getDataSource();

  // Cast incoming data to the official LlmNodeData type
  const data = nodeData as LlmNodeData;

  // --- State for dynamic data ---
  const [modelProviders, setModelProviders] = useState<IEntityObject[]>([]);
  const [mcpOptions, setMcpOptions] = useState<IEntityObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- State Management for Dialogs ---
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState<LlmNodeComponentState | null>(null);

  // --- Data fetching logic ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!llmProviderDataSource || !mcpDataSource) {
          console.error('Data sources not available.');
          return;
        }

        const [providersResult, mcpsResult] = await Promise.all([
          llmProviderDataSource.findManyWithReferences({
            modelName: 'languageModelProvider',
            childrenFieldName: 'models',
          }),
          mcpDataSource.findMany({
            modelName: 'mcpService',
          }),
        ]);

        setModelProviders(providersResult.data);
        setMcpOptions(mcpsResult.data.filter((mcp) => mcp.values.enable));
      } catch (error) {
        console.error('Failed to fetch node options:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [llmProviderDataSource, mcpDataSource]);

  // --- Event Handlers ---
  const handleOpenEditDialog = () => {
    setEditedData({
      ...data,
      modelProvider: data.modelProvider || '',
      temperature: data.temperature ?? 0.7,
      topP: data.topP ?? 1.0,
      promptVariables: data.promptVariables || [],
      outputActions: data.outputActions || [],
      mcps: data.mcps || [],
    });
    setEditDialogOpen(true);
  };
  const handleCloseEditDialog = () => setEditDialogOpen(false);
  const handleOpenDeleteDialog = () => setDeleteDialogOpen(true);
  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);

  const handleDataChange = <K extends keyof LlmNodeComponentState>(
    field: K,
    value: LlmNodeComponentState[K]
  ) => {
    if (editedData) {
      setEditedData((prev) => ({ ...prev!, [field]: value }));
    }
  };

  const handleProviderChange = (newProviderName: string) => {
    if (editedData) {
      const provider = modelProviders.find((p) => p.values.name === newProviderName);
      const newModels = (provider?.values.models as IEntityObject[]) || [];
      setEditedData((prev) => ({
        ...prev!,
        modelProvider: newProviderName,
        model: newModels.length > 0 ? (newModels[0].values.name as string) : '',
      }));
    }
  };

  // --- Handlers for Prompt Variables ---
  const handleAddPromptVariable = () => {
    if (editedData) {
      const newVariables = [...(editedData.promptVariables || []), { variable: '', value: '' }];
      handleDataChange('promptVariables', newVariables);
    }
  };

  const handleRemovePromptVariable = (index: number) => {
    if (editedData) {
      const newVariables = editedData.promptVariables.filter((_, i) => i !== index);
      handleDataChange('promptVariables', newVariables);
    }
  };

  const handlePromptVariableChange = (
    index: number,
    field: 'variable' | 'value',
    newValue: string
  ) => {
    if (editedData) {
      const newVariables = editedData.promptVariables.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: newValue };
        }
        return item;
      });
      handleDataChange('promptVariables', newVariables);
    }
  };

  const handleSave = () => {
    if (editedData) {
      const dataToSave: LlmNodeData = {
        name: editedData.name,
        label: editedData.label,
        type: 'LLM_INFERENCE',
        modelProvider: editedData.modelProvider,
        model: editedData.model,
        promptTemplate: editedData.promptTemplate,
        promptVariables: editedData.promptVariables,
        temperature: editedData.temperature,
        topP: editedData.topP,
        mcps: editedData.mcps,
        outputActions: editedData.outputActions,
        errors: editedData.errors,
      };
      setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data: dataToSave } : node)));
    }
    handleCloseEditDialog();
  };

  const handleConfirmDelete = () => {
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
    setNodes((nds) => nds.filter((node) => node.id !== id));
    handleCloseDeleteDialog();
  };

  const displayProviderLabel = useMemo(() => {
    const provider = modelProviders.find((p) => p.values.name === data.modelProvider);
    return (provider?.values.name as string) || data.modelProvider || '未知';
  }, [data.modelProvider, modelProviders]);

  const availableActions = (product.values?.actions as IEntityObject[]) || [];
  const actionsMap = useMemo(
    () =>
      new Map(
        availableActions.map((action) => [
          action.id,
          (action.values?.title as string) || (action.values?.name as string),
        ])
      ),
    [availableActions]
  );

  // --- MODIFICATION START: Create a lookup map for MCP names ---
  const mcpsMap = useMemo(
    () => new Map(mcpOptions.map((mcp) => [mcp.id, mcp.values?.name as string])),
    [mcpOptions]
  );
  // --- MODIFICATION END ---

  const currentModels = useMemo(() => {
    if (!editedData?.modelProvider) return [];
    const provider = modelProviders.find((p) => p.values.name === editedData.modelProvider);
    return (provider?.values.models as IEntityObject[]) || [];
  }, [editedData?.modelProvider, modelProviders]);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'grey.300',
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
          top: '50%',
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          backgroundColor: '#0000ff',
        }}
      >
        <IconifyEx icon="material-icon-theme:input" sx={{ width: 24, height: 24 }} />
      </Handle>
      {/* <Handle
        type="target"
        position={Position.Left}
        id="repositories"
        style={{
          top: '60%',
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          backgroundColor: '#aa0066',
        }}
      /> */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          backgroundColor: '#00dddd',
        }}
      />

      <Stack sx={{ p: '12px 16px' }} spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ width: '100%' }}>
            <IconifyEx icon="material-icon-theme:robots" sx={{ width: 24, height: 24 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {data.label || '大模型计算'}
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: '4px 8px',
            borderRadius: '6px',
            backgroundColor: 'background.neutral',
          }}
        >
          <IconifyEx icon="mdi:brain" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {displayProviderLabel} / {data.model}
          </Typography>
        </Box>
        <Divider sx={{ pt: 1 }} />
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            指令
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.promptTemplate || '未定义提示词模板。'}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            提示词变量
          </Typography>
          <Stack spacing={1}>
            {data.promptVariables && data.promptVariables.length > 0 ? (
              data.promptVariables.map((item) => (
                <Box
                  key={item.variable}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: 'grey.300',
                  }}
                >
                  <Tooltip title="变量名">
                    <IconifyEx icon="mdi:variable-box" sx={{ mr: 1, color: 'text.secondary' }} />
                  </Tooltip>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {item.variable}
                  </Typography>
                  <IconifyEx
                    icon="mdi:arrow-left-thin"
                    sx={{ ml: 1, mr: 1, color: 'text.secondary' }}
                  />
                  <Tooltip title="映射值或来源">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {String(item.value)}
                    </Typography>
                  </Tooltip>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.disabled">
                无提示词变量
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            参数
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', pl: '8px' }}>
            温度:{' '}
            <Typography component="span" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
              {data.temperature ?? 0.7}
            </Typography>
            {' / '}
            Top-P:{' '}
            <Typography component="span" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
              {data.topP ?? 1.0}
            </Typography>
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            能力 (MCPs)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {/* --- MODIFICATION START: Display MCP name from ID --- */}
            {data.mcps && data.mcps.length > 0 ? (
              data.mcps.map((mcpId) => (
                <Chip key={mcpId} label={mcpsMap.get(mcpId) || mcpId} size="small" />
              ))
            ) : (
              <Typography variant="body2" color="text.disabled">
                未配置能力
              </Typography>
            )}
            {/* --- MODIFICATION END --- */}
          </Box>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            动作
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {data.outputActions && data.outputActions.length > 0 ? (
              data.outputActions.map((actionId) => (
                <Chip
                  key={actionId}
                  label={actionsMap.get(actionId) || actionId}
                  size="small"
                  variant="filled"
                  color="info"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.disabled">
                未配置动作
              </Typography>
            )}
          </Box>
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
      >
        <DialogTitle>编辑大模型计算节点: {editedData?.name}</DialogTitle>
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
                  onChange={(e) => handleDataChange('label', e.target.value)}
                  helperText="给这个推理步骤起一个清晰易懂的名称。"
                />
                <Divider />
                <Typography variant="overline" color="text.secondary">
                  大模型配置
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>模型供应商</InputLabel>
                    <Select
                      value={editedData.modelProvider || ''}
                      label="模型供应商"
                      onChange={(e) => handleProviderChange(e.target.value as string)}
                    >
                      {modelProviders.map((provider) => (
                        <MenuItem key={provider.id} value={provider.values.name as string}>
                          {provider.values.name as string}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>模型名称</InputLabel>
                    <Select
                      value={editedData.model || ''}
                      label="模型名称"
                      onChange={(e) => handleDataChange('model', e.target.value)}
                      disabled={!editedData.modelProvider || currentModels.length === 0}
                    >
                      {currentModels.map((model) => (
                        <MenuItem key={model.id} value={model.values.name as string}>
                          {model.values.name as string}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                {/* --- MODIFICATION START: Updated MCP Autocomplete logic --- */}
                <Autocomplete
                  multiple
                  options={mcpOptions}
                  getOptionLabel={(option) => (option.values?.name as string) || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={editedData.mcps
                    .map((mcpId) => mcpOptions.find((opt) => opt.id === mcpId))
                    .filter((m): m is IEntityObject => !!m)}
                  onChange={(_, newValue) => {
                    handleDataChange(
                      'mcps',
                      newValue.map((v) => v.id)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="模型能力包 (MCPs)"
                      helperText="选择此节点需要启用的外部工具或特殊能力。"
                    />
                  )}
                />
                {/* --- MODIFICATION END --- */}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="提示词模板"
                  value={editedData.promptTemplate}
                  onChange={(e) => handleDataChange('promptTemplate', e.target.value)}
                  helperText="定义模型的指令。您可以使用 {占位符} 来引用输入变量。"
                />

                <Divider />
                <Typography variant="overline" color="text.secondary">
                  提示词变量配置
                </Typography>
                <Stack spacing={2}>
                  {editedData.promptVariables.map((item, index) => (
                    <Stack direction="row" spacing={2} key={index} alignItems="center">
                      <TextField
                        label="变量名"
                        value={item.variable}
                        onChange={(e) =>
                          handlePromptVariableChange(index, 'variable', e.target.value)
                        }
                        helperText="模板中的变量名"
                      />
                      <TextField
                        label="映射值或来源"
                        value={item.value}
                        fullWidth
                        onChange={(e) => handlePromptVariableChange(index, 'value', e.target.value)}
                        helperText="变量的值或上游节点的输出"
                      />
                      <Tooltip title="删除此变量">
                        <IconButton onClick={() => handleRemovePromptVariable(index)}>
                          <IconifyEx icon="mdi:delete-outline" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                  <Button
                    startIcon={<IconifyEx icon="mdi:plus" />}
                    onClick={handleAddPromptVariable}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    添加变量
                  </Button>
                </Stack>

                <Divider />
                <Typography variant="overline" color="text.secondary">
                  微调参数
                </Typography>
                <Stack direction="row" spacing={4} alignItems="center">
                  <Tooltip
                    title="控制输出的随机性。值越高(如 1.0)，输出越随机、越有创造性；值越低(如 0.2)，输出越确定、越保守。"
                    placement="top"
                    arrow
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography gutterBottom>
                        温度 (Temperature): {editedData.temperature}
                      </Typography>
                      <Slider
                        value={editedData.temperature}
                        onChange={(_, value) => handleDataChange('temperature', value as number)}
                        valueLabelDisplay="auto"
                        step={0.1}
                        min={0}
                        max={2}
                      />
                    </Box>
                  </Tooltip>
                  <Tooltip
                    title="一种替代温度采样的技术。模型会从概率最高的词中进行选择，直到这些词的累积概率达到 Top-P 的值。例如 0.9 表示仅考虑构成前 90% 概率质量的词汇。"
                    placement="top"
                    arrow
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography gutterBottom>Top-P: {editedData.topP}</Typography>
                      <Slider
                        value={editedData.topP}
                        onChange={(_, value) => handleDataChange('topP', value as number)}
                        valueLabelDisplay="auto"
                        step={0.05}
                        min={0}
                        max={1}
                      />
                    </Box>
                  </Tooltip>
                </Stack>
                <Divider />

                <Typography variant="overline" color="text.secondary">
                  输出配置
                </Typography>
                <Autocomplete
                  multiple
                  options={availableActions}
                  value={(editedData.outputActions || [])
                    .map((actionId) => availableActions.find((a) => a.id === actionId))
                    .filter((a): a is IEntityObject => !!a)}
                  onChange={(_, newValue) => {
                    handleDataChange(
                      'outputActions',
                      newValue.map((v) => v.id)
                    );
                  }}
                  getOptionLabel={(option) => (option?.values?.title as string) || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={(option?.values?.title as string) || option.id}
                          {...tagProps}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="输出动作"
                      helperText="定义此节点执行后可能触发的动作或状态，用于逻辑判断和流程分支。"
                    />
                  )}
                />
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

export default React.memo(LLMComputeNode);
