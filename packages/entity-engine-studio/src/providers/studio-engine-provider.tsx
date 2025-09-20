/**
 * Studio Engine Provider - 为 Studio 组件提供 EntityEngine 实例
 */

import type { ReactNode } from 'react';
import type { IEntityEngine } from '@scenemesh/entity-engine';

import { Text, Stack, Center, LoadingOverlay } from '@mantine/core';
import { useState, useEffect, useContext, createContext } from 'react';

import { componentStyles } from '../utils/theme';

// EntityEngine Context
const StudioEngineContext = createContext<IEntityEngine | null>(null);

export interface StudioEngineProviderProps {
    children: ReactNode;
    engine?: IEntityEngine;
    engineInitializer?: () => Promise<IEntityEngine>;
    fallback?: ReactNode;
}

/**
 * Studio Engine Provider - 管理 EntityEngine 实例的生命周期
 */
export function StudioEngineProvider({
    children,
    engine,
    engineInitializer,
    fallback,
}: StudioEngineProviderProps) {
    const [currentEngine, setCurrentEngine] = useState<IEntityEngine | null>(engine || null);
    const [loading, setLoading] = useState(!engine && !!engineInitializer);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (engine) {
            setCurrentEngine(engine);
            setLoading(false);
            return;
        }

        if (engineInitializer) {
            setLoading(true);
            engineInitializer()
                .then((engineInstance) => {
                    setCurrentEngine(engineInstance);
                    setError(null);
                })
                .catch((err) => {
                    setError(err.message || '引擎初始化失败');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [engine, engineInitializer]);

    // 加载状态
    if (loading) {
        return (
            fallback || (
                <LoadingOverlay visible overlayProps={{ blur: 2 }}>
                    <Center h="100vh">
                        <Stack align="center" gap="md">
                            <Text size="lg">正在初始化 Entity Engine...</Text>
                            <Text size="sm" c={componentStyles.text.secondary}>
                                请稍候
                            </Text>
                        </Stack>
                    </Center>
                </LoadingOverlay>
            )
        );
    }

    // 错误状态
    if (error) {
        return (
            fallback || (
                <Center h="100vh">
                    <Stack align="center" gap="md">
                        <Text size="lg" c="red">
                            引擎初始化失败
                        </Text>
                        <Text size="sm" c={componentStyles.text.secondary}>
                            {error}
                        </Text>
                    </Stack>
                </Center>
            )
        );
    }

    // 未提供引擎实例
    if (!currentEngine) {
        return (
            fallback || (
                <Center h="100vh">
                    <Stack align="center" gap="md">
                        <Text size="lg" c="orange">
                            未提供 EntityEngine 实例
                        </Text>
                        <Text size="sm" c={componentStyles.text.secondary}>
                            请通过 engine 或 engineInitializer 属性提供引擎实例
                        </Text>
                    </Stack>
                </Center>
            )
        );
    }

    return (
        <StudioEngineContext.Provider value={currentEngine}>
            {children}
        </StudioEngineContext.Provider>
    );
}

/**
 * Hook: 获取当前的 EntityEngine 实例
 */
export function useStudioEngine(): IEntityEngine {
    const engine = useContext(StudioEngineContext);

    if (!engine) {
        throw new Error('useStudioEngine must be used within a StudioEngineProvider');
    }

    return engine;
}

/**
 * Hook: 安全地获取 EntityEngine 实例（可能为 null）
 */
export function useStudioEngineOptional(): IEntityEngine | null {
    return useContext(StudioEngineContext);
}
