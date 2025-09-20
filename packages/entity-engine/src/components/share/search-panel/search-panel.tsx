import type { IEntityModelDelegate } from '../../../core/types';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Group, Select, TextInput, ActionIcon, MultiSelect } from '@mantine/core';

import { QueryOperator, type IEntityQueryMeta, type IEntityQueryItemMeta } from '../../../types';
import {
    convertFilterToQuery,
    getQueryOperatorName,
    isQueryOperatorWithoutValues,
} from './query-utils';

// 操作符选择组件
function SearchOperatorSelect({
    meta,
    value,
    onChange,
}: {
    meta: IEntityQueryItemMeta;
    value: QueryOperator;
    onChange: (value: QueryOperator) => void;
}) {
    const selectData = [
        { value: QueryOperator.NONE, label: `${meta.field.title} - 无` },
        ...meta.operators.map((operator) => ({
            value: operator,
            label: `${meta.field.title} - ${getQueryOperatorName(operator)}`,
        })),
    ];

    return (
        <Select
            value={value}
            onChange={(val) => val && onChange(val as QueryOperator)}
            size="xs"
            radius="sm"
            data={selectData}
            maw={200} // 设置最大宽度
            width={200} // 设置宽度
        />
    );
}

// 值输入组件
function SearchValueInput({
    meta,
    value,
    onChange,
}: {
    meta: IEntityQueryItemMeta;
    value: any;
    onChange: (value: any) => void;
}) {
    // 根据字段类型渲染不同的输入组件
    if (meta.field.type === 'array' && meta.options) {
        const selectData = meta.options.map((option) => ({
            value: option.value,
            label: option.label,
        }));

        return (
            <MultiSelect
                value={value || []}
                onChange={onChange}
                size="xs"
                radius="sm"
                placeholder={`搜索 ${meta.field.title}...`}
                data={selectData}
                style={{ width: 120 }}
            />
        );
    }

    if (meta.field.type === 'enum' && meta.options) {
        const selectData = meta.options.map((option) => ({
            value: option.value,
            label: option.label,
        }));

        return (
            <Select
                value={value || ''}
                onChange={onChange}
                size="xs"
                radius="sm"
                placeholder={`搜索 ${meta.field.title}...`}
                data={selectData}
                style={{ width: 120 }}
            />
        );
    }

    // 默认文本输入
    return (
        <TextInput
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            size="xs"
            radius="sm"
            placeholder={`搜索 ${meta.field.title}...`}
            style={{ width: 120 }}
        />
    );
}

type SearchPanelProps = {
    model: IEntityModelDelegate;
    queryMeta?: IEntityQueryMeta;
    values?: { [fieldName: string]: { operator: string; value: any } };
    onSearch?: (data: { [fieldName: string]: any }, model: IEntityModelDelegate) => void;
    onQuerySearch?: (query: any, model: IEntityModelDelegate) => void; // 新增：支持查询对象格式
    store?: any;
};

export function EntitySearchPanel(props: SearchPanelProps) {
    const { model, onSearch, onQuerySearch, queryMeta: cusQueryMeta, values } = props;
    const [searchValues, setSearchValues] = useState<{
        [fieldName: string]: { operator: string; value: any };
    }>(values || {});
    const queryMeta = cusQueryMeta || model.getQueryMeta();

    const handleChange = async (fieldName: string, operator: string, value: any) => {
        setSearchValues((prev) => ({
            ...prev,
            [fieldName]: { operator, value },
        }));
    };

    const handleSearch = () => {
        // 调用原有的搜索回调
        onSearch?.(searchValues, model);

        // 如果提供了查询搜索回调，则转换为查询格式并调用
        if (onQuerySearch) {
            const query = convertFilterToQuery(searchValues);
            onQuerySearch(query, model);
        }
    };

    const handleCleanSearch = () => {
        setSearchValues({});
        onSearch?.({}, model);
        onQuerySearch?.(undefined, model);
    };

    return (
        <Group gap="xs" align="center">
            {queryMeta.queryItemMetas.map((meta, index) => {
                const fieldValue = searchValues[meta.field.name];
                const currentOperator = (fieldValue?.operator ||
                    QueryOperator.NONE) as QueryOperator;
                const currentValue = fieldValue?.value || '';
                const showValueInput =
                    !isQueryOperatorWithoutValues(currentOperator) &&
                    currentOperator !== QueryOperator.NONE;

                return (
                    <Group
                        key={index}
                        gap="xs"
                        align="end"
                        style={{
                            backgroundColor: 'var(--mantine-color-white)',
                            borderRadius: 'var(--mantine-radius-sm)',
                        }}
                    >
                        <SearchOperatorSelect
                            meta={meta}
                            value={currentOperator}
                            onChange={(operator) =>
                                handleChange(meta.field.name, operator, currentValue)
                            }
                        />
                        {showValueInput && (
                            <SearchValueInput
                                meta={meta}
                                value={currentValue}
                                onChange={(value) =>
                                    handleChange(meta.field.name, currentOperator, value)
                                }
                            />
                        )}
                    </Group>
                );
            })}
            <Group gap={2} align="center">
                <ActionIcon
                    color="blue"
                    variant="light"
                    aria-label="搜索"
                    size="md"
                    onClick={handleSearch}
                >
                    <Icon icon="eva:search-fill" />
                </ActionIcon>
                <ActionIcon
                    color="blue"
                    variant="light"
                    aria-label="清空"
                    size="md"
                    onClick={handleCleanSearch}
                >
                    <Icon icon="mdi:delete-outline" color="red" />
                </ActionIcon>
            </Group>
        </Group>
    );
}
