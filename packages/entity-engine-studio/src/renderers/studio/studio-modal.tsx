'use client';

import { Box } from '@mantine/core';
import { useCallback } from 'react';
import { modals } from '@mantine/modals';
import { useEntityEngine } from '@scenemesh/entity-engine';

import { componentStyles } from '../../utils/theme';
import { UnifiedConfigurationWorkspace } from '../../components/workspace';
import { StudioEngineProvider } from '../../providers/studio-engine-provider';

export function StudioModal() {
    const engine = useEntityEngine();

    const handleSave = useCallback((config: any) => {
        // 这里可以添加保存逻辑，比如调用 API 或更新引擎配置
        modals.close('entity-engine-studio');
    }, []);

    const handleCancel = useCallback(() => {
        modals.close('entity-engine-studio');
    }, []);

    return (
        <Box
            style={{
                height: '100%', // 使用100%而不是100vh，因为现在模态框本身不是全屏的
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                // 确保内部弹层可以正确显示
                position: 'relative',
                zIndex: 'auto',
                minHeight: 0, // 防止高度溢出问题
                overflow: 'hidden', // 防止工作区域溢出到模态框外
                backgroundColor: componentStyles.toolbar.background, // 使用主题适配的背景色
            }}
        >
            <StudioEngineProvider engine={engine}>
                <UnifiedConfigurationWorkspace onSave={handleSave} onCancel={handleCancel} />
            </StudioEngineProvider>
        </Box>
    );
}
