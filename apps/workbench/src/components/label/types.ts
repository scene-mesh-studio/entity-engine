import type { Theme, SxProps } from '@mui/material/styles';
import type { PaletteColorKey, CommonColorsKeys } from 'src/theme/core';

// ----------------------------------------------------------------------

export type LabelColor = PaletteColorKey | CommonColorsKeys | 'default';

export type LabelVariant = 'filled' | 'outlined' | 'soft' | 'inverted';

export interface LabelProps extends React.ComponentProps<'span'> {
  sx?: SxProps<Theme>;
  disabled?: boolean;
  color?: LabelColor;
  variant?: LabelVariant;
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
}
