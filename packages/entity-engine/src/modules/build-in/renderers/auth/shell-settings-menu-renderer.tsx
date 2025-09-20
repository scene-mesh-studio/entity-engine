import type { IEntityNamedRenderer } from '../../../../components';

import { Menu } from '@mantine/core';
import { modals } from '@mantine/modals';
import { LogInIcon, LogOutIcon, UserCircleIcon } from 'lucide-react';

import { useEntityEngine, useEntitySession, useMasterDetailViewContainer } from '../../../../uikit';

const sellSettingsMenu: IEntityNamedRenderer = {
    name: 'auth-shell-settings-menu-renderer',
    slotName: 'shell-settings-menu',
    renderer: (props) => <AuthSettingsMenu {...props} />,
};

function AuthSettingsMenu(props: any) {
    const engine = useEntityEngine();
    const { session, sessionLoading, sessionRefresh } = useEntitySession();
    const { currentAction, performAction } = useMasterDetailViewContainer();

    const handleUserView = () => {
        performAction({
            actionType: 'view',
            payload: {
                modelName: 'ee-base-user',
                viewType: 'grid',
            },
            contextObject: {
                objectId: session?.userInfo?.id || '',
            },
        });
    };

    const handleLoginView = () => {
        performAction({
            actionType: 'view',
            payload: {
                modelName: '__default__',
                viewType: 'auth',
            },
            contextObject: {
                objectId: session?.userInfo?.id || '',
            },
            target: '__root__',
        });
    };

    async function getCsrfToken() {
        const response = await fetch(engine.settings.getUrl('/auth/csrf') /*'/api/ee/auth/csrf'*/);
        const { csrfToken } = await response.json();
        return csrfToken;
    }

    const handleLogout = async () => {
        const performLogout = async () => {
            const csrfToken = await getCsrfToken();
            await fetch(engine.settings.getUrl('/auth/signout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ csrfToken, json: 'true' }),
            });

            await sessionRefresh();
            window.location.reload();
        };

        modals.openConfirmModal({
            title: '确认退出登录?',
            centered: true,
            children: <p>你确定要退出登录吗？</p>,
            labels: { confirm: '退出登录', cancel: '取消' },
            confirmProps: { color: 'red' },
            onCancel: () => {},
            onConfirm: async () => {
                await performLogout();
            },
        });
    };

    if (!engine.settings.authenticationEnabled) {
        return null;
    }

    if (session && session.isAuthenticated()) {
        return (
            <>
                <Menu.Item leftSection={<UserCircleIcon size={14} />} onClick={handleUserView}>
                    用户管理
                </Menu.Item>
                <Menu.Item leftSection={<LogOutIcon size={14} />} onClick={handleLogout}>
                    退出登录
                </Menu.Item>
            </>
        );
    } else {
        return (
            <Menu.Item leftSection={<LogInIcon size={14} />} onClick={handleLoginView}>
                登录...
            </Menu.Item>
        );
    }

    // return null;
}

export default sellSettingsMenu;
