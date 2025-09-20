import type { ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { ModeProps } from './control-panel';
import type { MapProps } from 'src/components/map';

import { useMemo, useState, useCallback } from 'react';

import { Map } from 'src/components/map';

import { MapControlPanel } from './control-panel';

// ----------------------------------------------------------------------

const leftMapStyle: React.CSSProperties = {
  width: '50%',
  height: '100%',
  position: 'absolute',
};

const rightMapStyle: React.CSSProperties = {
  left: '50%',
  width: '50%',
  height: '100%',
  position: 'absolute',
};

// ----------------------------------------------------------------------

export function MapSideBySide({ sx, ...other }: MapProps) {
  const [viewState, setViewState] = useState({
    longitude: -122.43,
    latitude: 37.78,
    zoom: 12,
    pitch: 30,
  });

  const [mode, setMode] = useState<ModeProps>('side-by-side');
  const [activeMap, setActiveMap] = useState<'left' | 'right'>('left');

  const onLeftMoveStart = useCallback(() => setActiveMap('left'), []);
  const onRightMoveStart = useCallback(() => setActiveMap('right'), []);

  const onMove = useCallback((event: ViewStateChangeEvent) => setViewState(event.viewState), []);

  const width = typeof window === 'undefined' ? 100 : window.innerWidth;

  const leftMapPadding = useMemo(
    () => ({
      left: mode === 'split-screen' ? width / 2 : 0,
      top: 0,
      right: 0,
      bottom: 0,
    }),
    [width, mode]
  );

  const rightMapPadding = useMemo(
    () => ({
      right: mode === 'split-screen' ? width / 2 : 0,
      top: 0,
      left: 0,
      bottom: 0,
    }),
    [width, mode]
  );

  const handleChangeMode = useCallback(
    (event: React.MouseEvent<HTMLElement>, newMode: ModeProps | null) => {
      if (newMode !== null) {
        setMode(newMode);
      }
    },
    []
  );

  return (
    <div style={{ position: 'relative' }}>
      <Map
        id="left-map"
        {...viewState}
        padding={leftMapPadding}
        onMoveStart={onLeftMoveStart}
        onMove={(event) => {
          if (activeMap === 'left') {
            onMove(event);
          }
        }}
        mapStyle="mapbox://styles/mapbox/light-v10"
        style={leftMapStyle}
        sx={sx}
        {...other}
      />

      <Map
        id="right-map"
        {...viewState}
        padding={rightMapPadding}
        onMoveStart={onRightMoveStart}
        onMove={(event) => {
          if (activeMap === 'right') {
            onMove(event);
          }
        }}
        mapStyle="mapbox://styles/mapbox/dark-v10"
        style={rightMapStyle}
        sx={{
          top: 0,
          right: 0,
          zIndex: 1,
          position: 'absolute',
          ...sx,
        }}
        {...other}
      />

      <MapControlPanel mode={mode} onModeChange={handleChangeMode} />
    </div>
  );
}
