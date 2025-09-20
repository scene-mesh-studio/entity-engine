import type { IEntityNamedRenderer } from '../../../../components';

import { Text, Avatar, Button } from '@mantine/core';

import { useEntityEngine, useEntitySession } from '../../../../uikit';

const sellSettingsTarget: IEntityNamedRenderer = {
    name: 'auth-shell-settings-target-renderer',
    slotName: 'shell-settings-target',
    renderer: SettingsButton, //(props) => <SettingsButton {...props} />,
};

function SettingsButton(props: any) {
    const engine = useEntityEngine();
    const { session, sessionLoading } = useEntitySession();

    if (!engine.settings.authenticationEnabled) {
        return null;
    }

    if (session && session.isAuthenticated()) {
        return (
            <Button
                variant="transparent"
                size="xs"
                leftSection={
                    <Avatar
                        src={
                            session?.userInfo?.avatar
                                ? `/uploads/${session?.userInfo?.avatar}`
                                : null
                        }
                        alt="it's me"
                        size={30}
                        variant="filled"
                        p={1}
                        color="initials"
                        radius="xl"
                    />
                }
            >
                <Text size="sm" c="dark">
                    {session?.userInfo?.name || '-'}
                </Text>
            </Button>
        );
    } else {
        return (
            <Button
                variant="transparent"
                size="xs"
                leftSection={<Avatar size={30} p={1} radius="xl" />}
            >
                <Text size="sm" c="dark">
                    未登录
                </Text>
            </Button>
        );
    }

    // return null;
}

export default sellSettingsTarget;
