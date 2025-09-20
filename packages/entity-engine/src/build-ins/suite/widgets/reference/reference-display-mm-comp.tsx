'use client';

import type { IEntityObject } from '../../../../types';
import type { EntityWidgetProps } from '../../../../components/types';

import { Flex, Text, Badge, Group, Tooltip } from '@mantine/core';

import { useEntityEngine } from '../../../../uikit';
import { toDataSourceHook } from '../../../../lib/hooks';

type ReferenceDisplayCompProps = EntityWidgetProps & {
    referenceModelName: string;
};

type widgetOptions = {
    titleField?: string;
};

/**
 * 多对多引用显示组件
 * 展示：
 *  1. 总关联数量 (useFindReferencesCount)
 *  2. 前若干条（默认 5 条）关联对象的简要标识（title|name|id）
 * 交互：目前仅展示，不支持点击跳转（可在后续增强：点击打开对象详情 / 侧栏）。
 */
export function ReferenceDisplayMMComp(props: ReferenceDisplayCompProps) {
    const { object, model, field, referenceModelName } = props;
    const engine = useEntityEngine();
    const { titleField } = (field.widgetOptions as widgetOptions) || {};

    const dataSource = engine.datasourceFactory.getDataSource();
    const dsHooks = toDataSourceHook(dataSource);

    const refModel = engine.metaRegistry.getModel(referenceModelName);

    // 计数（快速返回）
    const { data: count, loading: countLoading } = dsHooks.useFindReferencesCount({
        fromModelName: model.name,
        fromFieldName: field.name,
        fromObjectId: object?.id || '',
        toModelName: referenceModelName,
    });

    // 抽取前 N 条用于预览
    const PREVIEW_LIMIT = 5;
    const { data: listData, loading: listLoading } = dsHooks.useFindMany({
        modelName: referenceModelName,
        query: {
            pageSize: PREVIEW_LIMIT,
            pageIndex: 1,
            references: {
                fromModelName: model.name,
                fromFieldName: field.name,
                fromObjectId: object?.id || '',
                toModelName: referenceModelName,
            },
        },
    });

    if (!object) {
        return (
            <Text c="dimmed" size="sm">
                -
            </Text>
        );
    }

    if (countLoading || listLoading) {
        return <Text size="sm">...</Text>;
    }

    const objects = listData?.data || [];
    const total = count || 0;

    if (total === 0) {
        return (
            <Badge variant="light" size="sm" radius="sm" color="gray">
                无关联
            </Badge>
        );
    }

    const displayText = (obj: IEntityObject) => {
        if (!obj) return '';
        return (
            //TODO: 检查titleField的配置
            obj.values[titleField || 'title'] ||
            obj.values?.['name'] ||
            obj.values?.['label'] ||
            obj.values?.['keyword'] ||
            obj.id?.slice(0, 8) ||
            '未命名'
        );
    };

    const remaining = total - objects.length;

    return (
        <Flex direction="column" gap={4} maw={420}>
            <Group gap={6} wrap="wrap" align="center">
                <Tooltip
                    label={`${refModel?.title || referenceModelName} 总数: ${total}`}
                    withArrow
                >
                    <Badge variant="light" size="sm" radius="sm">
                        {refModel?.title || referenceModelName}({total})
                    </Badge>
                </Tooltip>
                {objects.map((o: IEntityObject) => (
                    <Tooltip key={o.id} label={displayText(o)} withArrow>
                        <Badge variant="outline" size="sm" radius="sm" color="blue">
                            {displayText(o)}
                        </Badge>
                    </Tooltip>
                ))}
                {remaining > 0 && (
                    <Badge variant="dot" size="sm" radius="sm" color="grape">
                        +{remaining}
                    </Badge>
                )}
            </Group>
        </Flex>
    );
}
