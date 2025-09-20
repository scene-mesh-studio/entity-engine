'use client';

import type { IEntityDataSource } from '../../../types';

import { useMemo, useState, useEffect } from 'react';

type AsyncFunction = (...args: any[]) => Promise<any>;

// 定义 Hook 的返回类型
interface IUseDataSourceHookReturn<T> {
    data: T | undefined;
    loading: boolean;
    error: any;
    refetch: () => void;
    isFetching: boolean; // 新增：是否正在获取数据
    isPreviousData: boolean; // 新增：当前数据是否为之前的数据
}

// 定义生成的 Hook 的函数签名
type DataSourceHook<T extends AsyncFunction> = (
    input: Parameters<T>[0],
    options?: {
        enabled?: boolean;
        select?: (data: Awaited<ReturnType<T>>) => any;
        keepPreviousData?: boolean;
    }
) => IUseDataSourceHookReturn<Awaited<ReturnType<T>>>;

function createDataSourceHook<T extends AsyncFunction>(asyncFn: T): DataSourceHook<T> {
    return (
        input: Parameters<T>[0],
        options: {
            enabled?: boolean;
            select?: (data: Awaited<ReturnType<T>>) => any;
            keepPreviousData?: boolean;
        } = {
            enabled: true,
            keepPreviousData: false,
        }
    ) => {
        const { enabled = true, select, keepPreviousData = false } = options;
        const [data, setData] = useState<Awaited<ReturnType<T>> | undefined>(undefined);
        const [isFetching, setIsFetching] = useState<boolean>(false);
        const [loading, setLoading] = useState<boolean>(enabled);
        const [error, setError] = useState<any>(null);
        const [trigger, setTrigger] = useState(0);
        const [currentDependencies, setCurrentDependencies] = useState<string>('');

        const dependencies = useMemo(() => JSON.stringify(input), [input]);

        // 检查是否使用了之前的数据
        const isPreviousData =
            keepPreviousData && currentDependencies !== dependencies && data !== undefined;

        const refetch = () => {
            if (enabled) {
                setTrigger((t) => t + 1);
            }
        };

        useEffect(() => {
            let isMounted = true;

            if (enabled) {
                const fetchData = async () => {
                    setIsFetching(true);

                    // 如果是初次加载或者不保留之前数据，设置 loading 为 true
                    if (!keepPreviousData || data === undefined) {
                        setLoading(true);
                    }

                    setError(null);

                    try {
                        console.log('DataHooks Fetching data with input:', input);
                        const result = await asyncFn(input);
                        if (isMounted) {
                            const processedResult = select ? select(result) : result;
                            setData(processedResult);
                            setCurrentDependencies(dependencies);
                        }
                    } catch (e) {
                        if (isMounted) {
                            setError(e);
                            // 如果不保留之前数据，清除当前数据
                            if (!keepPreviousData) {
                                setData(undefined);
                            }
                        }
                    } finally {
                        if (isMounted) {
                            setIsFetching(false);
                            setLoading(false);
                        }
                    }
                };

                void fetchData();
            } else {
                setLoading(false);
                setIsFetching(false);
            }

            return () => {
                isMounted = false;
            };
        }, [dependencies, trigger, enabled]);

        return {
            data,
            loading,
            error,
            refetch,
            isFetching,
            isPreviousData,
        };
    };
}

// 定义转换后 Hooks 集合的类型
type DataSourceHooks<T> = {
    [K in keyof T as T[K] extends AsyncFunction
        ? `use${Capitalize<string & K>}`
        : never]: T[K] extends AsyncFunction ? DataSourceHook<T[K]> : never;
};

/**
 * 将 IEntityDataSource 实例转换为一组 React Hooks。
 * @param dataSource - IEntityDataSource 的实例。
 * @returns 返回一个包含所有对应 Hooks 的对象。
 */
export function toDataSourceHook<T extends IEntityDataSource>(dataSource: T): DataSourceHooks<T> {
    const hooks: any = {};
    let currentProto = Object.getPrototypeOf(dataSource);

    // 遍历 dataSource 实例自身及其原型链
    while (currentProto && currentProto !== Object.prototype) {
        const propNames = Object.getOwnPropertyNames(currentProto);

        for (const key of propNames) {
            // 排除构造函数并确保是函数类型
            if (
                key !== 'constructor' &&
                !key.startsWith('_') &&
                typeof dataSource[key as keyof T] === 'function'
            ) {
                const functionName = key as keyof T;
                // 避免重复添加（如果子类覆盖了父类方法）
                if (!hooks[functionName]) {
                    const hookName = `use${String(functionName).charAt(0).toUpperCase() + String(functionName).slice(1)}`;
                    const property = dataSource[functionName] as AsyncFunction;
                    hooks[hookName] = createDataSourceHook(property.bind(dataSource));
                }
            }
        }
        currentProto = Object.getPrototypeOf(currentProto);
    }
    return hooks as DataSourceHooks<T>;
}
