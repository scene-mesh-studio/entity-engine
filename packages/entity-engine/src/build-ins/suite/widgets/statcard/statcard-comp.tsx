'use client';

import type { EntityWidgetProps } from '../../../../components/types';
import type { IEntityQuery, IEntityModel, IEntityDataSource } from '../../../../types';

import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';
import { AreaChart } from '@mantine/charts';
import { Flex, Text, Stack, Space } from '@mantine/core';
import { ArrowRightIcon, ArrowUpRightIcon, ArrowDownRightIcon } from 'lucide-react';

import { useEntityEngine } from '../../../../uikit';

type StatCardOptions = {
    title?: string;
    value?: number;
    growth?: number;
    query?: IEntityQuery;
    modelName?: string;
    icon?: string;
};
export function StatCardComp(props: EntityWidgetProps) {
    const { model } = props;
    const options = (props.field.widgetOptions || {}) as StatCardOptions;
    const engine = useEntityEngine();
    const datasource = engine.datasourceFactory.getDataSource();

    const { data, growth, loading } = useGraphData(options, model, datasource);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <InnerStatCardComp {...props} statData={data} growth={growth} options={options} />;
}

type InnerStatCardCompProps = EntityWidgetProps & {
    statData: { key: string; data: number }[];
    growth: number | undefined;
    options: StatCardOptions;
};

function InnerStatCardComp(props: InnerStatCardCompProps) {
    const { field, statData, growth, options } = props;
    console.log(`>>>>>>>>>>>>>>>>>>>>> growth: ${growth}`);

    if (statData && statData.length > 0) {
        return (
            <Flex gap={0} align="center" justify="center" w="100%" h="100%" p={16} pr={16}>
                <Stack gap={8} justify="space-evenly" align="start" h="100%" w="100%">
                    <Text variant="text" size="sm">
                        {field.title}
                    </Text>
                    <Text variant="text" size="xl" fw={900}>
                        {statData[statData.length - 1]?.data}
                    </Text>
                    <Flex gap={2}>
                        {growth !== undefined && growth > 0 && (
                            <ArrowUpRightIcon color="red" size={16} />
                        )}
                        {growth !== undefined && growth == 0 && <ArrowRightIcon size={16} />}
                        {growth !== undefined && growth < 0 && (
                            <ArrowDownRightIcon color="green" size={16} />
                        )}
                        <Text variant="text" size="xs">
                            {((growth || 0) * 100).toFixed(1)}%{' '}
                        </Text>
                    </Flex>
                </Stack>
                {options.query ? (
                    <AreaChart
                        h={100}
                        data={statData}
                        dataKey="key"
                        series={[{ name: 'data', color: 'indigo.6' }]}
                        curveType="monotone"
                    />
                ) : (
                    <Icon
                        icon={options.icon || 'flat-color-icons:combo-chart'}
                        width={64}
                        height={64}
                    />
                )}
                <Space w={16} />
            </Flex>
        );
    } else {
        return null;
    }
}

function useGraphData(
    options: StatCardOptions,
    model: IEntityModel,
    datasource: IEntityDataSource
) {
    const { title, value, growth: growthValue, query, modelName } = options; // eslint-disable-line @typescript-eslint/no-unused-vars
    const [data, setData] = useState<{ key: string; data: number }[]>([]);
    const [growth, setGrowth] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!query) {
            setData([{ key: 'default', data: value || 0 }]);
            setGrowth(growthValue || 0);
            setLoading(false);
        } else {
            const mName = modelName || model.name;
            const fetchData = async () => {
                try {
                    const { groups, totalCount } = await datasource.findGroupedObjects({
                        modelName: mName,
                        groupBy: {
                            field: '$$createdAt',
                            format: {
                                type: 'time',
                                pattern: 'YYYY-MM-DD',
                            },
                            withoutDetails: true,
                        },
                        aggregations: {
                            name: 'count',
                        },
                        groupSortBy: {
                            name: 'asc',
                        },
                        query,
                    });
                    console.log(
                        `>>>>>>>>>>>>>>>>>>>>> groups: ${JSON.stringify(groups, (key, val) =>
                            typeof val === 'bigint' ? val.toString() : val
                        )}`
                    );
                    console.log(`>>>>>>>>>>>>>>>>>>>>> groups size: ${groups.length}`);
                    console.log(`>>>>>>>>>>>>>>>>>>>>> totalCount: ${totalCount}`);
                    // TODO: map groups into chart/stat data when backend shape confirmed
                    const chartData = groups.map((group, index) => ({
                        data: group.count,
                        key: group.key?.['$$createdAt'] || `G${index}`,
                    }));
                    setData(chartData);
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching grouped objects:', error);
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [query, value, growthValue, datasource]);

    return {
        data,
        growth,
        loading,
    };
}

const demodata = [
    {
        date: 'Mar 22',
        Apples: 2890,
        Oranges: 2338,
        Tomatoes: 2452,
    },
    {
        date: 'Mar 23',
        Apples: 2756,
        Oranges: 2103,
        Tomatoes: 2402,
    },
    {
        date: 'Mar 24',
        Apples: 3322,
        Oranges: 986,
        Tomatoes: 1821,
    },
    {
        date: 'Mar 25',
        Apples: 3470,
        Oranges: 2108,
        Tomatoes: 2809,
    },
    {
        date: 'Mar 26',
        Apples: 3129,
        Oranges: 1726,
        Tomatoes: 2290,
    },
];
