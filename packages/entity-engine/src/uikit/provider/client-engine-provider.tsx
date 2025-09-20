'use client';

import type {
    IEntityEngine,
    IEntitySession,
    IEntityEngineRouter,
    IEntityPermissionGuard,
    IEntityEngineInitializer,
    EntityPermissionActionType,
} from '../../core';

import * as React from 'react';

import { getEntityEngine } from '../../core';

type EntityEngineContextType = {
    engine: IEntityEngine | null;
    router?: IEntityEngineRouter;
    permissionGuard?: IEntityPermissionGuard;
};

const EntityEngineContext = React.createContext<EntityEngineContextType | null>(null);

export type EntityEngineProviderProps = {
    initializer: IEntityEngineInitializer;
    children: React.ReactNode;
    loading?: React.ReactNode;
    router?: IEntityEngineRouter;
    permissionGuard?: IEntityPermissionGuard;
};

// 创建 Provider 组件
export const EntityEngineProvider = (props: EntityEngineProviderProps) => {
    const { initializer, children, loading, router, permissionGuard } = props;

    const [isInitialized, setIsInitialized] = React.useState(false);
    const [engine, setEngine] = React.useState<IEntityEngine | null>(null);

    // 如果希望外部更新能生效，最好用 useMemo 而不是一次性 useState 缓存
    const routerInstance = React.useMemo<IEntityEngineRouter | undefined>(() => router, [router]);

    const permissionGuardInstance = React.useMemo<IEntityPermissionGuard>(
        () =>
            permissionGuard ||
            ({
                checkPermission: (_action: EntityPermissionActionType) => Promise.resolve(true), // 默认允许所有操作
            } as IEntityPermissionGuard),
        [permissionGuard]
    );

    // 防止 React 18 严格模式下开发环境重复初始化
    const didInitRef = React.useRef(false);

    React.useEffect(() => {
        let active = true;

        if (!didInitRef.current) {
            didInitRef.current = true;

            void getEntityEngine(initializer)
                .then((eg) => {
                    if (!active) return;
                    setEngine(eg);
                    console.log('Entity Engine initialized:', eg);
                    setIsInitialized(true);
                })
                .catch((error) => {
                    if (!active) return;
                    console.error('Failed to initialize EntityEngine:', error);
                });
        }

        // 始终返回清理函数，避免早退路径不返回
        return () => {
            active = false;
        };
    }, [initializer]);

    const contextValue = React.useMemo<EntityEngineContextType>(
        () => ({
            engine,
            router: routerInstance,
            permissionGuard: permissionGuardInstance,
        }),
        [engine, routerInstance, permissionGuardInstance]
    );

    if (!isInitialized || engine === null) {
        if (loading) {
            return loading;
        } else {
            return <div>...</div>;
        }
    }

    return (
        <EntityEngineContext.Provider value={contextValue}>{children}</EntityEngineContext.Provider>
    );
};

// 创建一个自定义 Hook 以方便地使用 Context
export const useEntityEngine = () => {
    const context = React.useContext(EntityEngineContext);
    if (context === null || context.engine === null) {
        throw new Error('useEntityEngine 必须在 EntityEngineProvider 内使用');
    }
    return context.engine;
};

export const useEntitySession = () => {
    const engine = useEntityEngine();
    const [refreshIndex, setRefreshIndex] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<Error | null>(null);
    const [session, setSession] = React.useState<IEntitySession | null>(null);

    React.useEffect(() => {
        setLoading(true);
        setSession(null);
        engine.sessionManager
            .getSession()
            .then((s) => {
                setSession(s);
                setLoading(false);
            })
            .catch((er) => {
                console.error('Failed to get session:', err);
                setSession(null);
                setErr(er);
                setLoading(false);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [engine, err, refreshIndex]);

    const refresh = React.useCallback(async () => {
        if (session) {
            await session.update();
        }
        setRefreshIndex((idx) => idx + 1);
    }, []);

    return {
        sessionLoading: loading,
        sessionError: err,
        session,
        sessionRefresh: refresh,
    };
};

export const useEntityEngineRouter = () => {
    const context = React.useContext(EntityEngineContext);
    if (context === null || context.router === undefined) {
        throw new Error('useEntityEngineRouter 必须在 EntityEngineProvider 内使用');
    }
    return context.router;
};

export const useEntityPermissionGuard = () => {
    const context = React.useContext(EntityEngineContext);
    if (context === null || context.permissionGuard === undefined) {
        throw new Error('useEntityPermissionGuard 必须在 EntityEngineProvider 内使用');
    }
    return context.permissionGuard;
};

export type EntityPermissionGuardProps = {
    action: EntityPermissionActionType;
    children: React.ReactNode;
    noPermissionComponent?: React.ComponentType;
};

export function EntityPermissionGuard(props: EntityPermissionGuardProps) {
    const { action, children, noPermissionComponent } = props;
    const [checked, setChecked] = React.useState(false);
    const permissionGuard = useEntityPermissionGuard();

    const [checkState, setCheckState] = React.useState({ loading: true, hasPermission: false });

    React.useEffect(() => {
        let active = true;
        // 每次 action / guard 变化开始新的检查
        setCheckState({ loading: true, hasPermission: false });
        const checkPermission = async () => {
            try {
                const hasPermission = await permissionGuard.checkPermission(action);
                if (active) {
                    setCheckState({ loading: false, hasPermission });
                }
            } catch (error) {
                if (active) {
                    console.error('Failed to check permission:', error);
                    setCheckState({ loading: false, hasPermission: false });
                }
            } finally {
                setChecked(true);
            }
        };
        if (!checked) {
            checkPermission();
        } else {
            setCheckState({ loading: false, hasPermission: true });
        }
        return () => {
            active = false;
        };
    }, [action, permissionGuard, checked]);

    if (checkState.loading) {
        return <div>...</div>;
    } else if (checkState.hasPermission) {
        return <>{children}</>;
    } else {
        if (noPermissionComponent) {
            const NoPermissionComponent = noPermissionComponent;
            return <NoPermissionComponent />;
        }
        return <div>Permission denied.</div>;
    }
}
