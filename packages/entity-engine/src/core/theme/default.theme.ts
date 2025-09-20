import type { IEntityEngineTheme } from '../types';

export const entityEngineDefaultTheme: IEntityEngineTheme = {
    colors: {
        primary: '#1d4ed8',
        secondary: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: {
            main: '#ffffff',
            secondary: '#f8fafc',
            accent: '#fef2f2',
        },
        text: {
            primary: '#111827',
            secondary: '#6b7280',
            muted: '#9ca3af',
        },
        border: {
            default: '#d1d5db',
            light: '#e5e7eb',
            strong: '#9ca3af',
        },
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    typography: {
        fontFamily: {
            sans: 'Inter, system-ui, sans-serif',
            mono: 'JetBrains Mono, Fira Code, monospace',
        },
        fontSize: {
            xs: '0.7rem',
            sm: '0.8rem',
            base: '0.875rem',
            lg: '1rem',
            xl: '1.125rem',
        },
    },
    borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
    },
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
};
