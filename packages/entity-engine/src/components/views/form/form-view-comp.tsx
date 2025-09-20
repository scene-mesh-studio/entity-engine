'use client';

import type { IEntityObject, IEntityDataSource } from '../../../types';
import type { EntityViewProps, IEntityViewController } from '../../types';
import type { IEntityFieldDelegate, IEntityViewFieldDelegate } from '../../../core';

import zod from 'zod';
import { createId } from '@paralleldrive/cuid2';
import { zodResolver } from '@hookform/resolvers/zod';
import { notifications } from '@mantine/notifications';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { SaveIcon, RefreshCcwIcon, GripVerticalIcon } from 'lucide-react';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
import { Box, Flex, Grid, Title, Loader, Button, Divider, LoadingOverlay } from '@mantine/core';

import { toDataSourceHook } from '../../../lib/hooks';
import { useEntityEngineTheme } from '../../../uikit/provider/entity-engine-theme-provider';
import {
    useEntityEngine,
    EntityNamedRenderer,
    EntityWidgetRenderer,
    useEntityPermissionGuard,
} from '../../../uikit';

// 条件判断工具函数
function createConditionEvaluator(expression: string): (values: any) => boolean {
    try {
        return new Function(
            'values',
            `
        try {
        with (values) {
            return ${expression};
        }
    } catch (error) {
        return false;
    }
    `
        ) as (values: any) => boolean;
    } catch (error) {
        console.error('条件表达式创建失败:', expression, error);
        return () => false;
    }
}

// 缓存条件评估器
const conditionEvaluatorCache = new Map<string, (values: any) => boolean>();

function getConditionEvaluator(expression: string): (values: any) => boolean {
    if (!conditionEvaluatorCache.has(expression)) {
        conditionEvaluatorCache.set(expression, createConditionEvaluator(expression));
    }
    return conditionEvaluatorCache.get(expression)!;
}

function shouldRequireField(field: IEntityViewFieldDelegate, formValues: any): boolean | null {
    const { requiredWhen } = field;
    if (!requiredWhen) {
        return null;
    }
    try {
        const requiredEvaluator = getConditionEvaluator(requiredWhen);
        return requiredEvaluator(formValues);
    } catch (error) {
        console.error('requiredWhen 条件判断失败:', requiredWhen, error);
        return null;
    }
}

// 判断字段是否应该显示
function shouldShowField(field: IEntityViewFieldDelegate, formValues: any): boolean {
    const { hiddenWhen, showWhen } = field;

    if (!hiddenWhen && !showWhen) {
        return true;
    }

    // showWhen 优先级更高
    if (showWhen) {
        try {
            const showEvaluator = getConditionEvaluator(showWhen);
            return showEvaluator(formValues);
        } catch (error) {
            console.error('showWhen 条件判断失败:', showWhen, error);
            return true;
        }
    }

    if (hiddenWhen) {
        try {
            const hiddenEvaluator = getConditionEvaluator(hiddenWhen);
            return !hiddenEvaluator(formValues);
        } catch (error) {
            console.error('hiddenWhen 条件判断失败:', hiddenWhen, error);
            return true;
        }
    }

    return true;
}

export function EntityFormViewComp(props: EntityViewProps) {
    const { model, baseObjectId, viewData, behavior } = props;
    const { theme } = useEntityEngineTheme();
    const engine = useEntityEngine();

    const formSchema = model.schema;

    const dataSource = engine.datasourceFactory.getDataSource();

    const dataSourceHooks = toDataSourceHook(dataSource);

    const {
        data: formData,
        loading: formLoading,
        error: formError,
        refetch: formRefresh,
        isFetching: formIsFetching,
    } = dataSourceHooks.useFindOne(
        { id: baseObjectId || '', modelName: model.name },
        {
            keepPreviousData: true,
        }
    );

    if (formIsFetching && !formData) {
        return <Loader color="blue" type="dots" size="sm" />;
    }

    if (formError) {
        return <div>Error loading form data: {formError.message}</div>;
    }

    return (
        <InnerEditForm
            key={`${props.model.name}-${baseObjectId}-${formData?.id || 'new'}`}
            {...props}
            data={formData}
            dataSource={dataSource}
            reload={formRefresh}
        />
    );
}

type InnerEditFormProps = EntityViewProps & {
    data: IEntityObject | undefined | null;
    dataSource: IEntityDataSource;
    reload?: () => void;
};

type FormState = {
    state: 'creating' | 'editing';
    objectId: string;
};

function InnerEditForm(props: InnerEditFormProps) {
    const { model, viewData, data, behavior, reference, dataSource, reload, callbacks } = props;
    const engine = useEntityEngine();
    const permissionGuard = useEntityPermissionGuard();
    const [formState, setFormState] = useState<FormState>({
        state: data && !behavior.toCreating ? 'editing' : 'creating',
        objectId: data?.id || behavior.toCreatingId || createId(),
    });
    const { theme } = useEntityEngineTheme();

    const formInstanceKey = useMemo(
        () => `${model.name}-form-${formState.objectId}-${Date.now()}`,
        [model.name, formState.objectId]
    );

    const defaultValues = useMemo(
        () => model.toSupplementedValues(data?.values || {}),
        [model, data?.values]
    );

    const formSchema = model.schema;

    const methods = useForm<zod.infer<typeof formSchema>>({
        mode: 'onSubmit',
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const {
        reset,
        watch,
        control,
        handleSubmit,
        setValue,
        register,
        getValues,
        formState: { isSubmitting, isDirty, errors },
    } = methods;

    // 条件控制功能 - 使用独立状态避免影响表单提交
    const [conditionValues, setConditionValues] = useState(() => methods.getValues());

    // 监听表单值变化并防抖更新
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const subscription = watch((values) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setConditionValues(values), 200);
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [watch]);

    // 当默认值变化时更新条件控制的值
    useEffect(() => {
        setConditionValues(defaultValues);
    }, [defaultValues]);

    const getFormValues = useCallback(() => conditionValues, [conditionValues]);

    const onReset = () => {
        reset();
    };

    const onSubmit = handleSubmit(async (formValues) => {
        try {
            // await new Promise((resolve) => setTimeout(resolve, 500));

            if (formState.state === 'editing') {
                // 检查权限
                const canUpdate = await permissionGuard.checkPermission({
                    action: 'update',
                    modelName: model.name,
                    objectId: formState.objectId,
                });
                if (!canUpdate) {
                    notifications.show({
                        title: '权限不足',
                        message: `您没有权限更新 ${model.title} 数据。`,
                        position: 'top-right',
                        color: 'red',
                    });
                    return;
                }
                //更新
                const sendData: Partial<IEntityObject> = {
                    values: formValues,
                };
                const ret = await dataSource.update({
                    id: formState.objectId,
                    data: sendData,
                });
                if (ret) {
                    // setFormData(data);
                    // setUpdateIndex(Date.now());
                    // toast.success(`${model.title}更新成功!`);
                    reset(formValues);
                    notifications.show({
                        title: `${model.title}`,
                        message: '数据已成功更新。',
                        position: 'top-right',
                    });
                    reload?.();
                    callbacks?.onObjectUpdated?.({
                        ...data,
                        id: formState.objectId,
                        modelName: model.name,
                        values: formValues,
                    });
                }
            } else {
                // 检查权限
                const canCreate = await permissionGuard.checkPermission({
                    action: 'create',
                    modelName: model.name,
                });
                if (!canCreate) {
                    notifications.show({
                        title: '权限不足',
                        message: `您没有权限创建 ${model.title} 数据。`,
                        position: 'top-right',
                        color: 'red',
                    });
                    return;
                }
                //新建
                const sendData: Partial<IEntityObject> = {
                    id: formState.objectId,
                    modelName: model.name,
                    values: formValues,
                };
                console.log('sendData', sendData);
                const ret = await dataSource.create({
                    data: sendData,
                    reference,
                    modelName: model.name,
                });
                console.info('DATA', ret);
                if (ret) {
                    // setObjectId(ret.id);
                    // toast.success(`${model.title}新建成功!`);
                    reset(formValues);
                    notifications.show({
                        title: `${model.title}`,
                        message: '数据已成功创建。',
                        position: 'top-right',
                    });
                    setFormState({
                        state: 'editing',
                        objectId: ret.id,
                    });
                    callbacks?.onObjectCreated?.(ret);
                }
            }
        } catch (error) {
            console.error(error);
        }
    });

    const formController: IEntityViewController = {
        viewId: formInstanceKey,
        viewType: 'form',
        modelName: model.name,
        describe: () => ({
            operators: [
                {
                    name: 'record.getValues',
                    description: '获取表单字段值',
                    outputSchema: zod.record(zod.any()),
                },
                {
                    name: 'record.setValues',
                    description: '设置表单字段值',
                    inputSchema: zod.object({ values: zod.record(zod.any()) }),
                },
                {
                    name: 'record.getFieldInfo',
                    description: '获得单个或全部字段信息',
                    inputSchema: zod.object({
                        fieldName: zod.string().optional().describe('字段名称'),
                    }),
                },
            ],
        }),
        invoke: async (op, args) => {
            switch (op) {
                case 'record.getValues':
                    return methods.getValues();
                case 'record.setValues': {
                    const { values } = (args as { values?: Record<string, unknown> }) || {};
                    if (values) {
                        Object.entries(values).forEach(([k, v]) =>
                            methods.setValue(k, v, { shouldDirty: true })
                        );
                    }
                    return true;
                }
                case 'record.getFieldInfo': {
                    const { fieldName } = (args as Record<string, unknown>) || {};
                    if (typeof fieldName === 'string') {
                        return model.findFieldByName(fieldName);
                    } else {
                        return model.fields;
                    }
                }
                default:
                    throw new Error(`Unknown op ${op}`);
            }
        },
    };

    useEffect(() => {
        engine.componentRegistry.registerViewController(formController);
        return () => {
            engine.componentRegistry.unregisterViewController(formController.viewId);
        };
    }, [model.name, formState.objectId]);

    return (
        <FormProvider {...methods} key={formInstanceKey}>
            <form onSubmit={onSubmit} style={{ width: '100%' }}>
                <Box component="div" p="2">
                    <LoadingOverlay
                        visible={isSubmitting}
                        zIndex={1000}
                        overlayProps={{ radius: 'sm', blur: 2 }}
                    />
                    <EntityNamedRenderer
                        slotName="form-view-top"
                        {...props}
                        model={model}
                        viewData={viewData}
                    />
                    <Flex
                        align="center"
                        justify="start"
                        gap="2"
                        className="mb-2 border border-accent rounded-md p-1"
                    >
                        <GripVerticalIcon width={18} height={18} />
                        <Title order={6}>{viewData.title}</Title>
                        {behavior.mode === 'edit' && (
                            <>
                                <Divider orientation="vertical" my="xs" mx="xs" />
                                <Button
                                    onClick={onSubmit}
                                    variant="subtle"
                                    size="sm"
                                    radius="sm"
                                    leftSection={<SaveIcon width={16} height={16} />}
                                    px="xs"
                                    py="4"
                                    loaderProps={{ size: 'xs' }}
                                    loading={isSubmitting}
                                    disabled={!isDirty}
                                >
                                    保存
                                </Button>
                                <Button
                                    onClick={onReset}
                                    variant="subtle"
                                    size="sm"
                                    radius="sm"
                                    leftSection={<RefreshCcwIcon width={16} height={16} />}
                                    px="xs"
                                    py="4"
                                    loaderProps={{ size: 'xs' }}
                                    disabled={!isDirty || isSubmitting}
                                >
                                    重置
                                </Button>
                            </>
                        )}
                        <EntityNamedRenderer
                            slotName="view-tool"
                            {...props}
                            addationalProps={{ viewId: formInstanceKey }}
                            model={model}
                            viewData={viewData}
                            render={(comp) => (
                                <>
                                    <Divider orientation="vertical" my="xs" mx="xs" />
                                    {comp}
                                </>
                            )}
                        />
                        <EntityNamedRenderer
                            slotName="view-form-tool"
                            {...props}
                            addationalProps={{ viewId: formInstanceKey }}
                            model={model}
                            viewData={viewData}
                            render={(comp) => (
                                <>
                                    <Divider orientation="vertical" my="xs" mx="xs" />
                                    {comp}
                                </>
                            )}
                        />
                    </Flex>
                    <Grid>
                        {viewData.items.map((viewField) => {
                            const field = model.findFieldByName(viewField.name);
                            const cols = viewField.spanCols || 12;
                            if (!field) {
                                return (
                                    <Grid.Col span={cols} key={viewField.name}>
                                        <div key={viewField.name}>
                                            Field {viewField.name} not found
                                        </div>
                                    </Grid.Col>
                                );
                            }
                            const fieldValue = data?.values[viewField.name];
                            return (
                                <Grid.Col span={cols} key={viewField.name}>
                                    <InnerFieldRenderer
                                        {...props}
                                        viewField={viewField}
                                        field={field}
                                        fieldValue={fieldValue}
                                        control={control}
                                        object={
                                            data || {
                                                id: formState.objectId,
                                                modelName: model.name,
                                                values: {},
                                            }
                                        }
                                        getFormValues={getFormValues}
                                    />
                                </Grid.Col>
                            );
                        })}
                    </Grid>
                    {/* <Typography variant="body2">
                {JSON.stringify(viewData.toSupplementedView(), null, 2)}
            </Typography> */}
                    {/* {JSON.stringify(formState, null, 2)} */}
                    <EntityNamedRenderer
                        slotName="form-view-bottom"
                        {...props}
                        model={model}
                        viewData={viewData}
                    />
                </Box>
            </form>
        </FormProvider>
    );
}

type FieldRendererProps = EntityViewProps & {
    viewField: IEntityViewFieldDelegate;
    field: IEntityFieldDelegate;
    control?: any;
    fieldValue?: any;
    object: IEntityObject | undefined;
    getFormValues: () => any;
};

function InnerFieldRenderer(props: FieldRendererProps) {
    const { model, viewData, behavior, viewField, field, fieldValue, object, getFormValues } =
        props;
    const widgetName = viewField.widget;
    const formContext = useFormContext();
    const control = props.control || formContext.control;

    // 使用 useMemo 来缓存显示状态的计算结果，避免不必要的重新计算
    const shouldShow = useMemo(
        () => shouldShowField(viewField, getFormValues()),
        [viewField.hiddenWhen, viewField.showWhen, getFormValues]
    );

    // 如果不应该显示，返回 null
    if (!shouldShow) {
        return null;
    }

    if (!widgetName) {
        return <div>Widget not specified for field {viewField.name}</div>;
    }

    if (behavior.mode === 'edit') {
        return (
            <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField, fieldState }) => (
                    <EntityWidgetRenderer
                        widgetName={widgetName}
                        view={viewData}
                        model={model}
                        field={viewField}
                        value={fieldValue}
                        behavior={behavior}
                        showLabel
                        fieldControl={controllerField}
                        fieldState={fieldState}
                        object={object}
                    />
                )}
            />
        );
    } else {
        return (
            <div>
                <EntityWidgetRenderer
                    widgetName={widgetName}
                    view={viewData}
                    model={model}
                    field={field}
                    value={fieldValue}
                    behavior={behavior}
                    showLabel
                    object={object}
                />
            </div>
        );
    }
}
