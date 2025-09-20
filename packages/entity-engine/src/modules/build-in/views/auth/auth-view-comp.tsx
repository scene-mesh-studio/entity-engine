'use client';

import type { EntityViewProps } from '../../../../components';

import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
    Text,
    Paper,
    Title,
    Anchor,
    Button,
    Checkbox,
    TextInput,
    PasswordInput,
} from '@mantine/core';

import { useEntityEngine, useEntitySession, useMasterDetailViewContainer } from '../../../../uikit';

export function AuthViewLoginComp(props: EntityViewProps) {
    const { model, baseObjectId, viewData, behavior } = props;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const engine = useEntityEngine();
    const { session, sessionRefresh } = useEntitySession();
    const { performAction } = useMasterDetailViewContainer();

    const getCsrfToken = async () => {
        const response = await fetch(engine.settings.getUrl('/auth/csrf'));
        const { csrfToken } = await response.json();
        return csrfToken;
    };

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();

        const csrfToken = await getCsrfToken();
        if (!csrfToken) {
            setError('Could not retrieve CSRF token.');
            return;
        }

        // 注意：Auth.js 期望的是 x-www-form-urlencoded 格式的数据
        const body = new URLSearchParams();
        body.append('csrfToken', csrfToken);
        body.append('username', username);
        body.append('password', password);
        body.append('remember', rememberMe ? 'true' : 'false');
        body.append('json', 'true'); // 告诉 Auth.js 返回 JSON 格式的响应
        body.append('redirect', 'false'); // 不要重定向，保持在当前页面

        const response = await fetch(engine.settings.getUrl('/auth/callback/credentials'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        });

        if (response.ok && response.status === 200) {
            console.log('Login successful', response);
            // 登录成功，浏览器会自动设置 cookie
            // 你可以刷新页面或重定向到受保护的路由
            // window.location.href = '/profile';
            notifications.show({
                title: '登录成功',
                message: '欢迎回来，你已成功登录。',
                color: 'green',
                autoClose: 5000,
            });
            await sessionRefresh?.();
            // performAction({
            //     actionType: 'view',
            //     payload: {
            //         modelName: '__default__',
            //         viewType: 'shell',
            //     },
            //     contextObject: {
            //         objectId: '', // newObject.id,
            //     },
            //     target: '__root__',
            // });
            window.location.reload();
        } else {
            setError('邮箱或密码错误.');
        }
    };

    return (
        <div className="entity-auth-wrapper">
            <Paper className="entity-auth-form">
                <Title order={2} className="entity-auth-title">
                    欢迎登录
                </Title>
                <form onSubmit={handleSubmit}>
                    {error && <Text c="red">{error}</Text>}
                    <TextInput
                        label="邮箱地址"
                        placeholder="hello@gmail.com"
                        size="md"
                        radius="md"
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <PasswordInput
                        label="登录密码"
                        placeholder="Your password"
                        mt="md"
                        size="md"
                        radius="md"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Checkbox
                        label="保持登录"
                        mt="xl"
                        size="md"
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <Button
                        fullWidth
                        mt="xl"
                        size="md"
                        radius="md"
                        type="submit"
                        onClick={handleSubmit}
                    >
                        登录
                    </Button>

                    <Text ta="center" mt="md">
                        还没有密码?{' '}
                        <Anchor href="#" fw={500} onClick={(event) => event.preventDefault()}>
                            注册
                        </Anchor>
                    </Text>
                </form>
            </Paper>
        </div>
    );
}
