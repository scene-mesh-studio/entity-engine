'use client';

import type { IEntityNamedRenderer } from '@scenemesh/entity-engine';

import { Menu } from '@mantine/core';
import { modals } from '@mantine/modals';
import { SettingsIcon } from 'lucide-react';

import { StudioModal } from './studio-modal';
import { componentStyles } from '../../utils/theme';

export const EntityEngineStudioLauncher: IEntityNamedRenderer = {
    name: 'shell-settings-studio-launch-menu',
    slotName: 'shell-settings-menu',
    disabled: false,
    renderer: (props) => <EntityStudioLaunchComp {...props} />,
};

function EntityStudioLaunchComp(_props: any) {
    const handleOpenStudio = () => {
        modals.open({
            modalId: 'entity-engine-studio',
            size: '95%', // 设置为原来的95%大小
            centered: true,
            padding: 0,
            withCloseButton: false,
            closeOnClickOutside: false,
            closeOnEscape: true,
            zIndex: 1000, // 设置适中的 z-index，允许内部弹层显示在上方
            children: <StudioModal />,
            styles: {
                body: {
                    height: '95vh', // 高度为原来的95%
                    padding: 0,
                    // 使用具体的 overflow 属性而不是简写
                    overflowX: 'visible',
                    overflowY: 'visible',
                },
                content: {
                    height: '95vh', // 高度为原来的95%
                    maxHeight: '95vh',
                    width: '95vw', // 宽度为原来的95%
                    maxWidth: '95vw',
                    margin: 'auto',
                    borderRadius: '8px', // 添加适中的圆角
                    // 使用具体的 overflow 属性而不是简写
                    overflowX: 'visible',
                    overflowY: 'visible',
                },
                // 确保模态框内容不会阻挡内部弹层
                inner: {
                    zIndex: 1000,
                    padding: '2.5vh 2.5vw', // 外边距为剩余空间的一半，保持居中
                    // 使用具体的 overflow 属性而不是简写
                    overflowX: 'visible',
                    overflowY: 'visible',
                },
                // 背景遮罩使用更低的 z-index
                overlay: {
                    zIndex: 999,
                },
                // 模态框根容器样式
                root: {
                    padding: 0,
                },
                // 标题区域样式优化
                header: {
                    padding: '16px 24px',
                    borderBottom: `1px solid ${componentStyles.toolbar.border}`,
                    backgroundColor: componentStyles.toolbar.background,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1001, // 确保标题栏始终可见
                },
            },
        });
    };

    return (
        <Menu.Item leftSection={<SettingsIcon size={14} />} onClick={handleOpenStudio}>
            打开 Studio
        </Menu.Item>
    );
}
