'use client';

import * as React from 'react';

export type AdapterType = {
    suiteName: string;
    suiteVersion: string;
};

// 创建一个值为 null 的 Context
const SuiteAdapterContext = React.createContext<AdapterType | null>(null);

// 创建 Provider 组件
export const EntitySuiteAdapterProvider: React.FC<{
    adapter: AdapterType;
    children: React.ReactNode;
}> = ({ adapter, children }) => (
    <SuiteAdapterContext.Provider value={adapter}>{children}</SuiteAdapterContext.Provider>
);

// 创建一个自定义 Hook，方便消费 Context
export const useEntitySuiteAdapter = () => {
    const context = React.useContext(SuiteAdapterContext);
    if (!context) {
        throw new Error('useEntitySuiteAdapter must be used within a WidgetProvider');
    }
    return context;
};
