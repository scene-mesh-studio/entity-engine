import type { EntityViewContainerProps } from './view-container';

import React, { useMemo } from 'react';
import { createId } from '@paralleldrive/cuid2';

// 如果你的数据源 Hook 在其他路径，请调整导入
import { toDataSourceHook } from '../../lib/hooks';
import { EntityViewContainer } from './view-container';
import { useEntityEngine, EntityNamedRenderer } from '../../uikit';
import {
    useEntitySession,
    useMasterDetailViewContainer,
    type EntityViewPerfromActionType,
} from '../provider';

export type EntityViewContainerPlaceholderProps = EntityViewContainerProps & {
    children: React.ReactNode;
    currentAction?: EntityViewPerfromActionType;
    withoutProvider?: boolean; // 是否不使用 ViewContainerProvider 包裹
};

export function EntityViewContainerPlaceholder(props: EntityViewContainerPlaceholderProps) {
    const { modelName, currentAction: localCurrentAction, withoutProvider = false } = props;
    const engine = useEntityEngine();
    const { session, sessionLoading } = useEntitySession();
    const { currentAction: masterCurrentAction } = useMasterDetailViewContainer();
    const currentAction = useMemo(() => {
        if (localCurrentAction) {
            return localCurrentAction;
        }
        return masterCurrentAction;
    }, [localCurrentAction, masterCurrentAction]);

    const compKey = `${modelName}-${currentAction?.actionType}-${currentAction?.payload?.timestamp || 0}`;

    if (engine.settings.authenticationEnabled) {
        if (sessionLoading) {
            return null;
        }
        if (!session || !session.isAuthenticated()) {
            return (
                <EntityViewContainer
                    modelName="__default__"
                    viewType="auth"
                    behavior={props.behavior}
                    callbacks={props.callbacks}
                    reference={props.reference}
                    key={compKey} // 强制重新渲染
                    withoutProvider
                />
            );
        }
    }

    // 1) 直接跳到指定视图
    if (currentAction?.actionType === 'view') {
        let fixProps = {};
        if (currentAction.payload.mode === 'create') {
            fixProps = {
                baseObjectId: createId(),
                behavior: { mode: 'edit', toCreating: true },
            };
        } else if (currentAction.payload.mode === 'edit') {
            fixProps = {
                behavior: { mode: 'edit' },
            };
        }

        return (
            <EntityViewContainer
                modelName={currentAction.payload.modelName}
                viewType={currentAction.payload.viewType}
                viewName={currentAction.payload.viewName}
                baseObjectId={currentAction.contextObject?.id || ''}
                behavior={props.behavior}
                callbacks={props.callbacks}
                reference={props.reference}
                withoutProvider={withoutProvider}
                key={compKey} // 强制重新渲染
                {...fixProps}
            />
        );
    }

    // 2) 渲染自定义组件
    if (currentAction?.actionType === 'comp') {
        const compName =
            typeof currentAction.payload?.comp === 'string'
                ? currentAction.payload?.comp
                : undefined;
        if (compName) {
            return <EntityNamedRenderer name={compName} {...props} key={compKey} />;
        }
    }

    // 3) 引用视图（根据字段关系选择一对一 or 多对一/一对多）
    if (currentAction?.actionType === 'reference-view') {
        const {
            fromModelName: payloadFromModelName,
            fromFieldName,
            toModelName,
            viewType,
        } = currentAction.payload || {};

        let fixProps = {};
        if (currentAction.payload.mode === 'create') {
            fixProps = {
                baseObjectId: createId(),
                behavior: { mode: 'edit', toCreating: true },
            };
        } else if (currentAction.payload.mode === 'edit') {
            fixProps = {
                behavior: { mode: 'edit' },
            };
        }

        const fromModelName = payloadFromModelName || modelName;
        const model = engine.metaRegistry.getModel(fromModelName);
        const fromField = model?.findFieldByName(fromFieldName);
        const fromObjectId = currentAction.contextObject?.id;

        if (fromField && fromObjectId && toModelName) {
            // 简单判断：one_to_one 走单对象，一对多/多对多走列表
            const isToOne = fromField.type === 'one_to_one' || fromField.type === 'many_to_one';
            if (isToOne) {
                return (
                    <InnerOneViewContainer
                        toModelName={toModelName}
                        viewType={viewType || 'form'}
                        behavior={props.behavior}
                        fromModelName={fromModelName}
                        fromFieldName={fromFieldName}
                        fromObjectId={fromObjectId}
                        engine={engine as any}
                        withoutProvider={withoutProvider}
                        key={compKey}
                        {...fixProps}
                    />
                );
            }
            // to-many：用引用过滤渲染列表/网格
            return (
                <EntityViewContainer
                    modelName={toModelName}
                    viewType={viewType || 'grid'}
                    reference={{
                        fromModelName,
                        fromFieldName,
                        fromObjectId,
                        toModelName,
                    }}
                    behavior={props.behavior}
                    callbacks={props.callbacks}
                    withoutProvider={withoutProvider}
                    key={compKey}
                    {...fixProps}
                />
            );
        }
    }

    // 默认：渲染原始 children
    return <>{props.children}</>;
}

type InnerOneViewContainerProps = {
    toModelName: string;
    viewType: string;
    behavior?: any;
    fromModelName: string;
    fromFieldName: string;
    fromObjectId: string;
    engine: any;
    withoutProvider?: boolean; // 是否不使用 ViewContainerProvider 包裹
};

function InnerOneViewContainer(props: InnerOneViewContainerProps) {
    const {
        toModelName,
        viewType,
        behavior,
        fromModelName,
        fromFieldName,
        fromObjectId,
        engine,
        withoutProvider,
    } = props;

    const dataSource = engine.datasourceFactory.getDataSource();
    const dataSourceHooks = toDataSourceHook(dataSource);

    const { data, loading } = dataSourceHooks.useFindMany({
        modelName: toModelName,
        query: {
            pageIndex: 1,
            pageSize: 1,
            references: {
                fromModelName,
                fromFieldName,
                fromObjectId,
                toModelName,
            },
        },
    });

    if (loading) {
        return null;
    }

    const first = data?.data?.[0];
    // 有对象：打开该对象表单；无对象：打开创建表单（携带 reference）
    if (first?.id) {
        return (
            <EntityViewContainer
                modelName={toModelName}
                viewType={viewType || 'form'}
                baseObjectId={first.id}
                behavior={behavior}
                reference={{
                    fromModelName,
                    fromFieldName,
                    fromObjectId,
                    toModelName,
                }}
                withoutProvider={withoutProvider}
            />
        );
    }
    return (
        <EntityViewContainer
            modelName={toModelName}
            viewType={viewType || 'form'}
            behavior={behavior}
            reference={{
                fromModelName,
                fromFieldName,
                fromObjectId,
                toModelName,
            }}
            withoutProvider={withoutProvider}
        />
    );
}
