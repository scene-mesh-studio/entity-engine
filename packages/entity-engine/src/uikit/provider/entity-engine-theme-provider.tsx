'use client';

import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-datatable/styles.layer.css';
import '../../styles/layout.css';

import type { ReactNode } from 'react';
import type { IEntityEngineTheme } from '../../core';

import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { useEffect, useContext, createContext } from 'react';
import { createTheme, MantineProvider } from '@mantine/core';

import { entityEngineDefaultTheme } from '../../core';

interface ThemeContextValue {
    theme: IEntityEngineTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const mantineTheme = createTheme({
    fontFamily: 'Arial, sans-serif',
    fontFamilyMonospace: 'Courier, monospace',
    primaryColor: 'blue',
    defaultRadius: 'md',
    components: {
        Button: {
            defaultProps: {
                variant: 'filled',
            },
        },
        TextInput: {
            defaultProps: {
                radius: 'md',
            },
        },
        Textarea: {
            defaultProps: {
                radius: 'md',
            },
        },
        Loader: {
            defaultProps: {
                color: 'blue',
                size: 'xs',
                type: 'dots',
            },
        },
        DataTable: {
            defaultProps: {
                withBorder: true,
                withColumnBorders: true,
                striped: true,
                highlightOnHover: true,
                borderRadius: 'md',
            },
        },
        DatePickerInput: {
            defaultProps: {
                popoverProps: {
                    zIndex: 99999,
                },
            },
        },
        Select: {
            defaultProps: {
                comboboxProps: {
                    zIndex: 99999,
                },
            },
        },
        MultiSelect: {
            defaultProps: {
                comboboxProps: {
                    zIndex: 99999,
                },
            },
        },
    },
});

interface ThemeProviderProps {
    theme?: Partial<IEntityEngineTheme>;
    children: ReactNode;
}

export function EntityEngineThemeProvider({
    theme: customTheme = {},
    children,
}: ThemeProviderProps) {
    // 深度合并默认主题和自定义主题
    const mergedTheme = mergeThemes(entityEngineDefaultTheme, customTheme);

    useEffect(() => {
        // 将主题变量注入到 CSS 自定义属性中
        applyThemeToCSS(mergedTheme);
    }, [mergedTheme]);

    return (
        <ThemeContext.Provider value={{ theme: mergedTheme }}>
            <MantineProvider theme={mantineTheme} defaultColorScheme="auto">
                <Notifications position="top-right" zIndex={99999999} />
                <ModalsProvider modalProps={{ centered: true, zIndex: 2000 }}>
                    <div className="entity-engine-root" data-theme="entity-engine">
                        {children}
                    </div>
                </ModalsProvider>
            </MantineProvider>
        </ThemeContext.Provider>
    );
}

export function useEntityEngineTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useEntityEngineTheme must be used within EntityEngineThemeProvider');
    }
    return context;
}

// 深度合并主题对象
function mergeThemes(
    defaultTheme: IEntityEngineTheme,
    customTheme: Partial<IEntityEngineTheme>
): IEntityEngineTheme {
    const merged = { ...defaultTheme };

    if (customTheme.colors) {
        merged.colors = { ...merged.colors, ...customTheme.colors };
        if (customTheme.colors.background) {
            merged.colors.background = {
                ...merged.colors.background,
                ...customTheme.colors.background,
            };
        }
        if (customTheme.colors.text) {
            merged.colors.text = {
                ...merged.colors.text,
                ...customTheme.colors.text,
            };
        }
        if (customTheme.colors.border) {
            merged.colors.border = {
                ...merged.colors.border,
                ...customTheme.colors.border,
            };
        }
    }

    if (customTheme.spacing) {
        merged.spacing = { ...merged.spacing, ...customTheme.spacing };
    }

    if (customTheme.typography) {
        merged.typography = { ...merged.typography, ...customTheme.typography };
        if (customTheme.typography.fontFamily) {
            merged.typography.fontFamily = {
                ...merged.typography.fontFamily,
                ...customTheme.typography.fontFamily,
            };
        }
        if (customTheme.typography.fontSize) {
            merged.typography.fontSize = {
                ...merged.typography.fontSize,
                ...customTheme.typography.fontSize,
            };
        }
    }

    if (customTheme.borderRadius) {
        merged.borderRadius = {
            ...merged.borderRadius,
            ...customTheme.borderRadius,
        };
    }

    if (customTheme.shadows) {
        merged.shadows = { ...merged.shadows, ...customTheme.shadows };
    }

    return merged;
}

// 将主题应用到 CSS 变量
function applyThemeToCSS(theme: IEntityEngineTheme) {
    const root = document.documentElement;

    // 颜色变量
    root.style.setProperty('--ee-color-primary', theme.colors.primary);
    root.style.setProperty('--ee-color-secondary', theme.colors.secondary);
    root.style.setProperty('--ee-color-success', theme.colors.success);
    root.style.setProperty('--ee-color-warning', theme.colors.warning);
    root.style.setProperty('--ee-color-error', theme.colors.error);

    root.style.setProperty('--ee-bg-main', theme.colors.background.main);
    root.style.setProperty('--ee-bg-secondary', theme.colors.background.secondary);
    root.style.setProperty('--ee-bg-accent', theme.colors.background.accent);

    root.style.setProperty('--ee-text-primary', theme.colors.text.primary);
    root.style.setProperty('--ee-text-secondary', theme.colors.text.secondary);
    root.style.setProperty('--ee-text-muted', theme.colors.text.muted);

    root.style.setProperty('--ee-border-default', theme.colors.border.default);
    root.style.setProperty('--ee-border-light', theme.colors.border.light);
    root.style.setProperty('--ee-border-strong', theme.colors.border.strong);

    // 间距变量
    Object.entries(theme.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--ee-spacing-${key}`, value);
    });

    // 字体变量
    root.style.setProperty('--ee-font-sans', theme.typography.fontFamily.sans);
    root.style.setProperty('--ee-font-mono', theme.typography.fontFamily.mono);

    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
        root.style.setProperty(`--ee-font-size-${key}`, value);
    });

    // 圆角变量
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
        root.style.setProperty(`--ee-radius-${key}`, value);
    });

    // 阴影变量
    Object.entries(theme.shadows).forEach(([key, value]) => {
        root.style.setProperty(`--ee-shadow-${key}`, value);
    });
}
