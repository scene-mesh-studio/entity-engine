'use client';

// 基础类型（最小化定义，避免外部依赖）
type IEntityObject = { id?: string; [k: string]: any };

import * as React from 'react';

let __container_index = 0;
function generateContainerName() {
    return `ec-${__container_index++}-${Math.random().toString(36).substring(2, 9)}`;
}

export type EntityViewPerfromActionType = {
    actionType: 'view' | 'comp' | 'reference-view' | string;
    payload: any;
    contextObject: any;
    // 目标容器：
    // - '__self__'：当前容器
    // - '__parent__'：父容器
    // - '__root__'：根容器
    // - 具体容器名：直达该容器
    // - 缺省（undefined）：若仅有一个子容器则投递给它，否则在当前容器处理
    target?: string | '__root__' | '__self__' | '__parent__';
};

interface MasterDetailViewContextType {
    performAction: (action: EntityViewPerfromActionType) => void;
    currentAction?: EntityViewPerfromActionType;

    broadcast: (actionType: string, payload: any) => void;
    broadcastData?: { actionType: string; payload: any; timestamp: number };

    parentContext?: IEntityObject;

    containerName?: string;

    registerContainer: (
        name: string,
        handler: (action: EntityViewPerfromActionType) => void
    ) => void;
    unregisterContainer: (name: string) => void;
}

const viewContainerContext = React.createContext<MasterDetailViewContextType | undefined>(
    {} as MasterDetailViewContextType
);

export function ViewContainerProvider({
    children,
    parentContext,
    containerName,
}: {
    children: React.ReactNode;
    parentContext?: IEntityObject;
    containerName?: string;
}) {
    const parentCtx = React.useContext(viewContainerContext);
    const [_parentContext] = React.useState(parentContext);

    // 根容器名固定为 __root__
    const localContainerName = !parentCtx?.containerName
        ? '__root__'
        : containerName || generateContainerName();
    const [_containerName] = React.useState(localContainerName);

    const [currentAction, setCurrentAction] = React.useState<EntityViewPerfromActionType>();

    // 子容器注册表：name -> handler
    const childContainersRef = React.useRef<
        Map<string, (action: EntityViewPerfromActionType) => void>
    >(new Map());

    const registerContainer = React.useCallback(
        (name: string, handler: (action: EntityViewPerfromActionType) => void) => {
            childContainersRef.current.set(name, handler);
        },
        []
    );

    const unregisterContainer = React.useCallback((name: string) => {
        childContainersRef.current.delete(name);
    }, []);

    const handleAction = React.useCallback(
        (action: EntityViewPerfromActionType) => {
            console.log(
                'handleAction',
                action,
                _containerName,
                parentCtx?.containerName,
                childContainersRef
            );

            // 1) 目标为当前容器
            if (action.target === '__self__' || action.target === _containerName) {
                console.log('Handling action in current container:', _containerName);
                console.log('Current action:', currentAction);
                setCurrentAction(action);
                return;
            }

            // 2) 路由到根容器：向上递交直到根
            if (action.target === '__root__') {
                if (parentCtx?.performAction) {
                    parentCtx.performAction(action);
                } else {
                    // 已是根
                    setCurrentAction(action);
                }
                return;
            }

            // 3) 路由到父容器：冒泡
            if (action.target === '__parent__') {
                if (parentCtx?.performAction) {
                    parentCtx.performAction(action);
                    return;
                }
                // 无父时在当前容器处理
                setCurrentAction(action);
                return;
            }

            // 4) 指定子容器名：直达转发
            if (action.target && typeof action.target === 'string') {
                const handler = childContainersRef.current.get(action.target);
                if (handler) {
                    handler({ ...action, target: '__self__' });
                    return;
                }
                // 未找到该子容器，则尝试向上交给父级（可能是兄弟在更高层注册）
                if (parentCtx?.performAction) {
                    parentCtx.performAction(action);
                    return;
                }
                // 兜底：当前处理
                setCurrentAction(action);
                return;
            }

            // 5) 未指定 target：若仅有一个子容器，作为默认目标
            if (!action.target) {
                const entries = Array.from(childContainersRef.current.entries());
                if (entries.length === 1) {
                    console.log('Only one child container, forwarding action:', entries[0][0]);
                    const [, onlyHandler] = entries[0];
                    onlyHandler({ ...action, target: '__self__' });
                    return;
                }
                // 否则在当前容器处理
                setCurrentAction(action);
                return;
            }
        },
        [_containerName, parentCtx, currentAction]
    );

    // 向父容器注册当前容器
    React.useEffect(() => {
        if (parentCtx?.registerContainer && parentCtx?.unregisterContainer) {
            parentCtx.unregisterContainer(_containerName);
            parentCtx.registerContainer(_containerName, handleAction);
        }
        return () => {
            parentCtx?.unregisterContainer?.(_containerName);
        };
    }, [_containerName, parentCtx, handleAction]);

    // 简单广播：写入状态并向子容器分发
    const [broadcastData, setBroadcastData] = React.useState<{
        actionType: string;
        payload: any;
        timestamp: number;
    }>();

    const handleBroadcast = React.useCallback(
        (actionType: string, payload: any) => {
            setBroadcastData({ actionType, payload, timestamp: Date.now() });
            // 将广播封装为 action 分发给所有子容器（如需过滤可在子容器判断）
            childContainersRef.current.forEach((handler) => {
                handler({
                    actionType: 'broadcast',
                    payload: { actionType, payload },
                    contextObject: _parentContext,
                    target: '__self__',
                });
            });
        },
        [_parentContext]
    );

    const value = React.useMemo<MasterDetailViewContextType>(
        () => ({
            performAction: handleAction,
            currentAction,
            broadcast: handleBroadcast,
            broadcastData,
            parentContext: _parentContext,
            containerName: _containerName,
            registerContainer,
            unregisterContainer,
        }),
        [
            handleAction,
            currentAction,
            handleBroadcast,
            broadcastData,
            _parentContext,
            _containerName,
            registerContainer,
            unregisterContainer,
        ]
    );

    return <viewContainerContext.Provider value={value}>{children}</viewContainerContext.Provider>;
}

export function useMasterDetailViewContainer() {
    const context = React.useContext(viewContainerContext);
    if (!context) {
        throw new Error('useMasterDetailViewContainer must be used within ViewContainerProvider');
    }
    return context;
}

// 容器内“简易路由”辅助钩子
export function useContainerRouter() {
    const { performAction, containerName } = useMasterDetailViewContainer();

    return {
        containerName,
        // 切换到某个模型视图
        pushView: (args: {
            modelName: string;
            viewType: string;
            viewName?: string;
            contextObject?: any;
            target?: string;
        }) =>
            performAction({
                actionType: 'view',
                payload: {
                    modelName: args.modelName,
                    viewType: args.viewType,
                    viewName: args.viewName,
                },
                contextObject: args.contextObject,
                target: args.target ?? '__self__',
            }),

        // 渲染自定义组件
        pushComponent: (comp: React.ComponentType, target?: string) =>
            performAction({
                actionType: 'comp',
                payload: { comp },
                contextObject: undefined,
                target: target ?? '__self__',
            }),

        // 依据引用显示明细/列表
        pushReferenceView: (args: {
            fromModelName?: string; // 可缺省，由当前容器的 model 决定
            fromFieldName: string;
            toModelName: string;
            viewType?: string;
            contextObject: { id: string } | any;
            target?: string;
        }) =>
            performAction({
                actionType: 'reference-view',
                payload: {
                    fromModelName: args.fromModelName,
                    fromFieldName: args.fromFieldName,
                    toModelName: args.toModelName,
                    viewType: args.viewType,
                },
                contextObject: args.contextObject,
                target: args.target ?? '__self__',
            }),
    };
}
