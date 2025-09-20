import type { IEntityQuery, IEntityObject } from '../../../../types';
import type { EntityWidgetProps } from '../../../../components/types';

import React from 'react';
import { modals } from '@mantine/modals';
import { CheckIcon } from 'lucide-react';
import { Box, Text, Flex, Badge, Group, Loader, Select, MultiSelect } from '@mantine/core';

import { toDataSourceHook } from '../../../../lib/hooks';
import { type IEntityViewFieldDelegate } from '../../../../core';
import { useEntityEngine, EntityViewContainer } from '../../../../uikit';

export function SelectComp(props: EntityWidgetProps) {
    const { model, field: viewField, behavior } = props;
    const field = model.findFieldByName(viewField.name);

    if (behavior.mode === 'edit') {
        if (field?.type === 'enum' || field?.type === 'array') {
            return <InnerEnumSelect {...props} />;
        }

        if (field?.type === 'many_to_one' || field?.type === 'one_to_one') {
            return <InnerReferenceSelect {...props} />;
        }
    } else {
        // 显示模式
        if (field?.type === 'enum' || field?.type === 'array') {
            return <InnerEnumDisplay {...props} />;
        }

        if (field?.type === 'many_to_one' || field?.type === 'one_to_one') {
            return <InnerReferenceDisplay {...props} />;
        }

        return <div className="rounded w-full p-2">{props.value || '无内容'}</div>;
    }

    return <div>select</div>;
}

function InnerReferenceSelect(props: EntityWidgetProps) {
    const { model, field, maintain } = props;
    const readonly = maintain?.readonly || false;
    const modelField = model.findFieldByName(field?.name || '');
    const refModelName = modelField?.refModel;
    const engine = useEntityEngine();

    const refModel = engine.metaRegistry.getModel(refModelName || '');

    if (!refModelName || !refModel) {
        return <div>字段 {field?.name} 的引用模型未定义</div>;
    }

    const ds = engine.datasourceFactory.getDataSource();
    const dsHooks = toDataSourceHook(ds);

    const widgetOptions = field.widgetOptions?.filter || {};
    const queryFilter = widgetOptions as IEntityQuery['filter'];

    console.log('》〉》〉》〉》〉 queryFilter', queryFilter);

    const {
        data: refData,
        loading: refLoading,
        refetch: refetchRefData,
    } = dsHooks.useFindMany({
        modelName: refModelName,
        query: {
            pageIndex: 1,
            pageSize: 100,
            filter: queryFilter ? { and: [queryFilter] } : undefined,
        },
    });

    if (refLoading) {
        return <Loader size="sm" />;
    }
    if (refData) {
        const titleField = refModel?.fields[0];
        const options = refData?.data?.map((item) => ({
            label: item.values[titleField?.name || ''] || item.id,
            value: item.id,
        }));

        return (
            <InnerSelect
                field={field}
                options={options}
                readonly={readonly}
                fieldControl={props.fieldControl}
                refetchOptions={refetchRefData}
                modelName={refModelName}
            />
        );
    }

    return <div>reference select</div>;
}

function InnerReferenceDisplay(props: EntityWidgetProps) {
    const { model, field, value, object } = props;
    const modelField = model.findFieldByName(field?.name || '');
    const refModelName = modelField?.refModel;
    const engine = useEntityEngine();

    const refModel = engine.metaRegistry.getModel(refModelName || '');

    if (!refModelName || !refModel || !value) {
        return (
            <Text size="sm" c="dimmed">
                无内容
            </Text>
        );
    }

    const ds = engine.datasourceFactory.getDataSource();
    const dsHooks = toDataSourceHook(ds);

    const {
        data: refData,
        loading: refLoading,
        refetch: refetchRefData,
    } = dsHooks.useFindMany({
        modelName: refModelName,
        query: {
            pageIndex: 1,
            pageSize: 1,
            references: {
                fromModelName: model.name,
                fromFieldName: modelField?.name || '',
                fromObjectId: object?.id || '',
                toModelName: refModelName,
            },
        },
    });

    if (refLoading) {
        return <Loader size="sm" />;
    }

    if (refData && refData.data && refData.data.length > 0) {
        const titleField = refModel?.fields[0];
        const displayValue = refData.data[0].values[titleField.name] || '';
        return (
            <Badge variant="light" size="md" style={props.style} className={props.className}>
                {displayValue}
            </Badge>
        );
    }

    return (
        <Text size="xs" c="dimmed">
            无数据
        </Text>
    );
}

function InnerEnumDisplay(props: EntityWidgetProps) {
    const { model, field, value } = props;
    const modelField = model.findFieldByName(field?.name || '');

    if (!modelField || !field || !value) {
        return (
            <Text size="sm" c="dimmed">
                无内容
            </Text>
        );
    }

    const options: { label: any; value: any }[] = [];
    if (modelField.type === 'enum' || modelField.type === 'array') {
        if (modelField.typeOptions?.options && Array.isArray(modelField.typeOptions.options)) {
            modelField.typeOptions.options.forEach((option) => {
                if (typeof option === 'object' && option !== null && 'value' in option) {
                    options.push({
                        label: option.label || option.value,
                        value: option.value,
                    });
                } else {
                    options.push({
                        label: option,
                        value: option,
                    });
                }
            });
        }
    }

    if (modelField.type === 'array' && Array.isArray(value)) {
        // 多选显示
        if (value.length === 0) {
            return (
                <Text size="sm" c="dimmed">
                    无选择
                </Text>
            );
        }

        return (
            <Group gap="xs">
                {value.map((val, index) => {
                    const option = options.find((opt) => opt.value === val);
                    const displayLabel = option ? option.label : val;
                    return (
                        <Badge
                            key={index}
                            variant="light"
                            size="md"
                            style={props.style}
                            className={props.className}
                        >
                            {displayLabel}
                        </Badge>
                    );
                })}
            </Group>
        );
    } else {
        // 单选显示
        const option = options.find((opt) => opt.value === value);
        const displayLabel = option ? option.label : value;
        return (
            <Badge variant="light" size="md">
                {displayLabel}
            </Badge>
        );
    }
}

function InnerEnumSelect(props: EntityWidgetProps) {
    const { model, field, maintain } = props;
    const readonly = maintain?.readonly || false;
    const modelField = model.findFieldByName(field?.name || '');

    if (!modelField || !field) {
        return <div>字段 {field?.name} 在模型中未找到</div>;
    }

    const options: { label: any; value: any }[] = [];
    if (modelField.type === 'enum' || modelField.type === 'array') {
        if (modelField.typeOptions?.options && Array.isArray(modelField.typeOptions.options)) {
            modelField.typeOptions.options.forEach((option) => {
                if (typeof option === 'object' && option !== null && 'value' in option) {
                    options.push({
                        label: option.label || option.value,
                        value: option.value,
                    });
                } else {
                    options.push({
                        label: option,
                        value: option,
                    });
                }
            });
        }
    }
    if (modelField.type === 'array') {
        return (
            <InnerMultiSelect
                field={field}
                options={options}
                readonly={readonly}
                fieldControl={props.fieldControl}
            />
        );
    } else {
        return (
            <InnerSelect
                field={field}
                options={options}
                readonly={readonly}
                fieldControl={props.fieldControl}
                modelName={model.name}
            />
        );
    }
}

function InnerSelect({
    field,
    options,
    readonly,
    fieldControl,
    refetchOptions,
    modelName,
}: {
    field: IEntityViewFieldDelegate;
    options: { label: string; value: any }[];
    readonly: boolean;
    fieldControl?: EntityWidgetProps['fieldControl'];
    refetchOptions?: () => void;
    modelName: string;
}) {
    const opts = options.map((option) => ({
        value: option.value,
        label: option.label,
    }));
    opts.unshift({
        label: '添加选项...',
        value: '__add_option__',
    });

    const handleSelectChange = (value: string | null) => {
        if (value === '__add_option__') {
            let modelId: string | undefined = undefined;
            const handleCreateResult = (obj: IEntityObject) => {
                if (obj) {
                    fieldControl?.onChange?.(obj.id);
                }
                refetchOptions?.();
                if (modelId) {
                    modals.close(modelId);
                }
            };

            modelId = modals.open({
                title: <Text fw={700}>创建</Text>,
                children: (
                    <Box p="md">
                        <EntityViewContainer
                            modelName={modelName}
                            viewType="form"
                            behavior={{ mode: 'edit', toCreating: true }}
                            callbacks={{ onObjectCreated: handleCreateResult }}
                        />
                    </Box>
                ),
                size: '90%',
            });
        } else {
            fieldControl?.onChange?.(value);
        }
    };

    return (
        <Flex>
            <Select
                flex={1}
                data={opts}
                value={fieldControl?.value}
                onChange={handleSelectChange}
                onBlur={fieldControl?.onBlur}
                ref={fieldControl?.ref}
                disabled={readonly}
                placeholder={field?.description}
                style={{ width: '100%' }}
                renderOption={(option) => {
                    if (option.option.value === '__add_option__') {
                        return (
                            <Text size="sm" fw={900}>
                                {option.option.label}
                            </Text>
                        );
                    } else {
                        return (
                            <Badge
                                variant="light"
                                size="md"
                                leftSection={
                                    option.checked ? <CheckIcon width={16} height={16} /> : null
                                }
                            >
                                {option.option.label}
                            </Badge>
                        );
                    }
                }}
            />
        </Flex>
    );
}

function InnerMultiSelect({
    field,
    options,
    readonly,
    fieldControl,
}: {
    field: IEntityViewFieldDelegate;
    options: { label: string; value: any }[];
    readonly: boolean;
    fieldControl?: EntityWidgetProps['fieldControl'];
}) {
    return (
        <MultiSelect
            data={options}
            value={fieldControl?.value || []}
            onChange={(values: string[]) => fieldControl?.onChange?.(values)}
            onBlur={fieldControl?.onBlur}
            ref={fieldControl?.ref}
            disabled={readonly}
            placeholder={field?.description}
            style={{ width: '100%' }}
        />
    );
}
