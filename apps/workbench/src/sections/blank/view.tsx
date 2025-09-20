'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useEntityEngine, EntityViewContainer } from '@scenemesh/entity-engine';

import Box from '@mui/material/Box';
import { Button } from '@mui/material';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

type Props = {
  title?: string;
  description?: string;
  sx?: SxProps<Theme>;
};

export function BlankView({ title = 'Blank', description, sx }: Props) {
  const [editMode, setEditMode] = useState(false);
  const engine = useEntityEngine();

  const renderContent = () => (
    <Box
      sx={[
        (theme) => ({
          mt: 5,
          width: 1,
          height: 320,
          borderRadius: 2,
          border: `dashed 1px ${theme.vars.palette.divider}`,
          bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography variant="h6" sx={{ p: 2 }}>
        {engine.toString()}
      </Typography>
    </Box>
  );

  return (
    <DashboardContent maxWidth={false}>
      <Typography variant="h4"> {title} </Typography>
      {description && <Typography sx={{ mt: 1 }}> {description} </Typography>}
      <Button variant="contained" onClick={() => setEditMode(!editMode)} sx={{ mb: 2 }}>
        {editMode ? 'Display' : 'Edit'}
      </Button>

      <EntityViewContainer
        modelName="product"
        viewType="mastail"
        baseObjectId="z1cv5emekgc0jpoyue65n5c4"
        behavior={{ mode: editMode ? 'edit' : 'display' }}
      />
    </DashboardContent>
  );
}
