import { Handle, Position } from '@xyflow/react';

import { Box, Stack, IconButton, Typography } from '@mui/material';

import { IconifyEx } from 'src/components/iconify';

export function SceneNode({ data }: { data: any }) {
  return (
    <Box
      sx={{
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        minWidth: 300,
        p: 0,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Box>
        <Stack
          spacing={1}
          direction="row"
          alignContent="center"
          alignItems="center"
          sx={{
            px: 1,
            width: '100%',
            bgcolor: 'background.neutral',
            borderRadius: '6px 6px 0 0',
          }}
        >
          <IconifyEx icon="material-icon-theme:webpack" sx={{ width: 24, height: 24 }} />
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {data.values?.name || '场景节点'}
          </Typography>
          <IconButton color="primary">
            <IconifyEx icon="mingcute:edit-line" sx={{ width: 16, height: 16 }} />
          </IconButton>
        </Stack>
        <Box
          sx={{
            p: 2,
            width: '100%',
            bgcolor: 'background.default',
            borderRadius: '0 0 6px 6px',
          }}
        >
          <Typography variant="caption">场景类型</Typography>
        </Box>
      </Box>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
}
