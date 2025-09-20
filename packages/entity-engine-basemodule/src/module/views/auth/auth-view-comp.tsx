'use client';

import classes from './auth-view-comp.module.css';

import type { EntityViewProps } from '@scenemesh/entity-engine';

import { useEntityEngine } from '@scenemesh/entity-engine';
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

export function AuthViewLoginComp(props: EntityViewProps) {
    const { model, baseObjectId, viewData, behavior } = props;
    const engine = useEntityEngine();

    return (
        <div className={classes.wrapper}>
            <Paper className={classes.form}>
                <Title order={2} className={classes.title}>
                    欢迎登录
                </Title>

                <TextInput label="邮箱地址" placeholder="hello@gmail.com" size="md" radius="md" />
                <PasswordInput
                    label="登录密码"
                    placeholder="Your password"
                    mt="md"
                    size="md"
                    radius="md"
                />
                <Checkbox label="保持登录" mt="xl" size="md" />
                <Button fullWidth mt="xl" size="md" radius="md">
                    登录
                </Button>

                <Text ta="center" mt="md">
                    还没有密码?{' '}
                    <Anchor href="#" fw={500} onClick={(event) => event.preventDefault()}>
                        注册
                    </Anchor>
                </Text>
            </Paper>
        </div>
    );
}
