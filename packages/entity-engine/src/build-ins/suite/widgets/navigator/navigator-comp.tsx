'use client';

import type { JSX } from 'react';
import type { IEntityViewField } from '../../../../types';
import type { EntityWidgetProps } from '../../../../components/types';

import { Icon } from '@iconify/react';
import { Text, Stack, NavLink } from '@mantine/core';

import { useMasterDetailViewContainer } from '../../../../uikit';

export function NavigatorComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;
    const { performAction, currentAction } = useMasterDetailViewContainer();

    const handleItemClick = (item: IEntityViewField) => {
        // 处理导航项点击事件
        console.log('Item clicked:', item);
        if (item.widgetOptions) {
            const { actionType, payload, target } = item.widgetOptions;
            if (actionType) {
                // performAction(actionType, payload, object);
                console.log('Performing action:', actionType, payload, object);
                performAction({
                    actionType: actionType as string,
                    payload: { ...(payload as any), timestamp: Date.now() },
                    contextObject: object,
                    target: target as string | undefined,
                });
            }
            // performAction('navigate', item.field);
        }
    };

    const fields = field.fields || [];
    const comps: JSX.Element[] = [];
    fields.forEach((f, index) => {
        const comp = renderField(props, f, index, 0, handleItemClick);
        if (comp) {
            comps.push(comp);
        }
    });

    return (
        <Stack
            style={{
                ...props.style,
            }}
            className={props.className}
        >
            {comps}
        </Stack>
    );
}

function renderField(
    props: EntityWidgetProps,
    field: IEntityViewField,
    index: number,
    level: number,
    handleItemClick: (item: IEntityViewField) => void
): JSX.Element | null {
    const { value, object, model, view, behavior, fieldControl, fieldState } = props;
    const children: JSX.Element[] = [];

    field.fields?.forEach((f: IEntityViewField, idx: number) => {
        const comp = renderField(props, f, idx, level + 1, handleItemClick);
        if (comp) {
            children.push(comp);
        }
    });

    const hasChildren = children.length > 0;

    const navLinkProps = {
        label: (
            <Text size={hasChildren ? 'xs' : 'sm'} fw={500} c={hasChildren ? 'dimmed' : undefined}>
                {field.title}
            </Text>
        ),
        leftSection: field.icon ? <Icon icon={field.icon} /> : null,
        defaultOpened: true,
        childrenOffset: 15,
        ...(hasChildren && { children }),
        ...(!hasChildren && {
            onClick: (e: any) => {
                handleItemClick(field);
            },
        }),
    };

    return (
        <NavLink
            component="div"
            key={`${field.name}-${index}-${level}`}
            description={field.description}
            style={{
                cursor: 'pointer',
                padding: '4px 4px',
            }}
            {...navLinkProps}
        />
    );
}
