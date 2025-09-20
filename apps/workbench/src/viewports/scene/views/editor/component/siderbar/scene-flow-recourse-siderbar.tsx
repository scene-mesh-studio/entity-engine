import type { FlowNodeTemplate, FlowNodeTemplateCatalog } from '../scene-flow-types';

import { useState, useCallback } from 'react';

import { Box, Stack, IconButton, Typography } from '@mui/material';

import { IconifyEx } from 'src/components/iconify';

import { useFlowDnD } from '../utils/dnd-context';

// 命名修正
export type SceneFlowResourceSidebarProps = {
  templateCatalogs: FlowNodeTemplateCatalog[];
};
export function SceneFlowResourceSidebar({ templateCatalogs }: SceneFlowResourceSidebarProps) {
  const [show, setShow] = useState(false);

  const handleShowTaggle = () => {
    setShow((prev) => !prev);
  };
  return (
    <>
      <Stack
        direction="row"
        flex={1}
        alignItems="end"
        alignContent="end"
        justifyContent="flex-end"
        sx={{
          p: 0,
          m: 0,
          mt: -2,
          mr: -1,
        }}
      >
        <IconButton
          title="打开节点库"
          aria-label="打开节点库"
          color="primary"
          size="large"
          onClick={handleShowTaggle}
          sx={{
            m: 0,
          }}
        >
          <IconifyEx
            icon={show ? 'material-icon-theme:folder-app-open' : 'material-icon-theme:folder-app'}
            width={32}
            height={32}
          />
        </IconButton>
      </Stack>
      {show && (
        <Box
          sx={{
            gap: 2,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          {templateCatalogs.map((catalog, index) => (
            <TemplateCatalog key={`catalog-${index}`} templateCatalog={catalog} />
          ))}
        </Box>
      )}
    </>
  );
}

type TemplateCatalogProps = {
  templateCatalog: FlowNodeTemplateCatalog;
};

function TemplateCatalog({ templateCatalog }: TemplateCatalogProps) {
  const [, setType] = useFlowDnD();

  const onDragStart = useCallback(
    (evt: React.DragEvent<HTMLDivElement>, node: FlowNodeTemplate) => {
      setType?.(node);
      evt.dataTransfer.effectAllowed = 'move';
    },
    [setType]
  );

  return (
    <Box
      sx={{
        width: '100%',
        flexDirection: 'column',
        gap: 1,
        display: 'flex',
      }}
    >
      <Typography variant="caption">{templateCatalog.title}</Typography>
      {templateCatalog.nodes.map((node, index) => (
        <Stack
          key={`node-${index}`}
          direction="row"
          flexWrap="nowrap"
          gap={1}
          alignItems="flex-start"
          onDragStart={(evt) => onDragStart(evt, node)}
          draggable
          sx={{
            cursor: 'pointer',
            borderRadius: 0.5,
            ':hover': {
              backgroundColor: 'background.neutral',
            },
            p: 1,
          }}
        >
          <IconifyEx icon={node.icon || 'material-icon-theme:pdm'} width={24} height={24} />
          <Stack direction="column" flexWrap="nowrap" gap={1} alignItems="flex-start">
            <Typography variant="subtitle2">{node.title}</Typography>
            <Typography variant="caption">{node.description}</Typography>
          </Stack>
        </Stack>
      ))}
    </Box>
  );
}
