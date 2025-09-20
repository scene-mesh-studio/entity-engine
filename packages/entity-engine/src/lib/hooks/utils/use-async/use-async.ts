'use client';

import type { DependencyList } from 'react';

import { useState, useDeferredValue } from 'react';

import { useAsyncEffect } from '../use-async-effect';

export function useAsync<T>(
    func: () => Promise<T>,
    deps?: DependencyList
): {
    state: 'loading' | 'hasData' | 'hasError';
    data?: T;
    error?: any;
} {
    const [{ state, data, error }, setState] = useState<{
        state?: 'loading' | 'hasData' | 'hasError';
        data?: T;
        error?: any;
    }>({});

    useAsyncEffect(async () => {
        setState((draft) => ({ ...draft, state: 'loading' }));
        try {
            const result = await func();
            setState({ state: 'hasData', data: result });
        } catch (e) {
            setState((draft) => ({ ...draft, state: 'hasError', error: e }));
        }
    }, deps);

    return {
        state: state ?? 'loading',
        data,
        error,
    };
}

export function useAsyncWithCache<T>(
    func: () => Promise<T>,
    deps?: DependencyList
): {
    state: 'loading' | 'hasData' | 'hasError';
    data?: T;
    error?: any;
} {
    // internalState 用于存储异步操作的最新结果，它会立即更新
    const [internalState, setInternalState] = useState<{
        state: 'loading' | 'hasData' | 'hasError';
        data?: T;
        error?: any;
    }>({ state: 'loading' }); // 初始状态为 loading

    // deferredResult 是 internalState 的延迟版本
    // 它会保持旧的数据和状态，直到 internalState 稳定并完成非紧急更新
    const deferredResult = useDeferredValue(internalState);

    // loadingState 用于立即反馈异步操作的开始，即使旧数据仍然显示
    const [loadingState, setLoadingState] = useState(false);

    useAsyncEffect(async () => {
        setLoadingState(true); // 立即设置为 loading 状态
        try {
            const result = await func();
            setInternalState({ state: 'hasData', data: result, error: undefined });
        } catch (e) {
            setInternalState({ state: 'hasError', data: undefined, error: e });
        } finally {
            setLoadingState(false); // 异步操作完成后取消 loading 状态
        }
    }, deps);

    // 返回给调用者的数据和状态
    // data 和 error 使用 deferredResult，以保持旧数据直到新数据加载完成
    // state 则优先显示 loadingState，如果不在加载中，则显示 deferredResult 的状态
    return {
        state: loadingState ? 'loading' : (deferredResult.state ?? 'loading'),
        data: deferredResult.data,
        error: deferredResult.error,
    };
}
