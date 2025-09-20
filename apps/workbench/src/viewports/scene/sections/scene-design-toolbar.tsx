import { Stack, Button } from '@mui/material';

export function SceneDesignToolbar() {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ p: 1, bgcolor: 'background.neutral', borderRadius: 1 }}
    >
      <Button variant="soft" size="small" startIcon="mdi:plus" color="primary">
        添加节点
      </Button>
    </Stack>
  );
}
