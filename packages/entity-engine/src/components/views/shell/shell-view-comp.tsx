'use client';

import type { EntityViewProps } from '../../types';
import type {
    IEntityViewDelegate,
    IEntityModelDelegate,
    IEntityViewFieldDelegate,
} from '../../../core';

import { modals } from '@mantine/modals';
import { useDisclosure } from '@mantine/hooks';
import { InfoIcon, SettingsIcon } from 'lucide-react';
import { Menu, Flex, Group, Burger, AppShell, ActionIcon } from '@mantine/core';

import { toDataSourceHook } from '../../../lib/hooks';
import {
    useEntityEngine,
    useEntitySession,
    EntityNamedRenderer,
    EntityWidgetRenderer,
    useMasterDetailViewContainer,
} from '../../../uikit';

export function EntityShellViewComp(props: EntityViewProps) {
    const { model, baseObjectId, viewData, behavior } = props;
    const engine = useEntityEngine();
    const { currentAction } = useMasterDetailViewContainer();
    const dataSource = engine.datasourceFactory.getDataSource();
    const dataSourceHooks = toDataSourceHook(dataSource);

    const headerField = findItemByName(viewData, 'header');
    const footerField = findItemByName(viewData, 'footer');
    const sideBarField = findItemByName(viewData, 'navbar');
    const mainField = findItemByName(viewData, 'main');
    const asideField = findItemByName(viewData, 'aside');

    return (
        // <ViewContainerProvider>
        <InnerShellView
            {...props}
            header={headerField}
            footer={footerField}
            sideBar={sideBarField}
            main={mainField}
            aside={asideField}
        />
        // </ViewContainerProvider>
    );
}

type InnerShellViewProps = EntityViewProps & {
    header?: IEntityViewFieldDelegate;
    footer?: IEntityViewFieldDelegate;
    sideBar?: IEntityViewFieldDelegate;
    main?: IEntityViewFieldDelegate;
    aside?: IEntityViewFieldDelegate;
};

function InnerShellView(props: InnerShellViewProps) {
    const { model, viewData, header, footer, sideBar, main, aside } = props;
    const [opened, { toggle }] = useDisclosure();

    const footerProps = {
        ...(footer ? { footer: { height: 60 } } : {}),
    };

    return (
        <AppShell
            header={{ height: 60 }}
            // footer={{ height: 60 }}
            {...footerProps}
            navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            aside={{ width: 300, breakpoint: 'md', collapsed: { desktop: true, mobile: true } }}
            padding="md"
        >
            {header && (
                <AppShell.Header>
                    <Group h="100%" px="md">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <InnerWidgetRenderer targetField={header} {...props} />
                        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <EntityNamedRenderer
                                slotName="shell-settings"
                                viewData={viewData}
                                model={model}
                            >
                                <SettingsButton viewData={viewData} model={model} />
                            </EntityNamedRenderer>
                        </div>
                    </Group>
                </AppShell.Header>
            )}
            {sideBar && (
                <AppShell.Navbar p="md">
                    <InnerWidgetRenderer targetField={sideBar} {...props} />
                </AppShell.Navbar>
            )}
            {main && (
                <AppShell.Main>
                    <InnerWidgetRenderer targetField={main} {...props} />
                </AppShell.Main>
            )}
            {aside && (
                <AppShell.Aside p="md">
                    <InnerWidgetRenderer targetField={aside} {...props} />
                </AppShell.Aside>
            )}
            {footer && (
                <AppShell.Footer p="md">
                    <InnerWidgetRenderer targetField={footer} {...props} />
                </AppShell.Footer>
            )}
        </AppShell>
    );
}

type InnerWidgetRendererProps = EntityViewProps & {
    targetField: IEntityViewFieldDelegate;
};

function InnerWidgetRenderer(props: InnerWidgetRendererProps) {
    return (
        <EntityWidgetRenderer
            view={props.viewData}
            model={props.model}
            field={props.targetField}
            value=""
            behavior={{ mode: 'display' }}
            widgetName={props.targetField.widget || 'default'}
            showLabel={false}
        />
    );
}

function findItemByName(
    viewData: IEntityViewDelegate | undefined,
    name: string
): IEntityViewFieldDelegate | undefined {
    if (!viewData) return undefined;

    for (const field of viewData.items || []) {
        if (field.name === name) {
            return field;
        }
    }

    return undefined;
}

type SettingsButtonProps = {
    viewData: IEntityViewDelegate;
    model: IEntityModelDelegate;
};

function SettingsButton(props: SettingsButtonProps) {
    const engine = useEntityEngine();
    const { session } = useEntitySession();

    const handleShowInfo = () => {
        modals.open({
            title: '@scenemesh/entity-engine',
            children: (
                <div style={{ padding: '10px 10px', fontSize: 13 }}>
                    <p>当前版本: {engine.version}</p>
                    <p>加载模块: {engine.moduleRegistry.getAllModules().length}</p>
                    <p>模型配置: {engine.metaRegistry.models.length}</p>
                    <p>视图配置: {engine.metaRegistry.views.length}</p>
                    <p>视图类型: {engine.componentRegistry.getViews().length}</p>
                    <p>字段类型: {engine.fieldTyperRegistry.getFieldTypers().length}</p>
                    <p>视图实例: {engine.componentRegistry.getAllViewControllers().length}</p>
                </div>
            ),
        });
    };

    return (
        <Menu shadow="md" width={200}>
            <Menu.Target>
                <Flex align="center" gap="0">
                    {/* {engine.settings.authenticationEnabled && session && session.isAuthenticated() && (
                        <Button variant="transparent" size="xs" leftSection={<Avatar src={session?.userInfo?.avatar || null} alt="it's me" size={30} variant="filled" p={1} name={session?.userInfo?.name || undefined} color='initials' radius="xl" />}>
                            <Text size="sm" c="dark">{session?.userInfo?.name || '未登录'}</Text>
                        </Button>
                    )}
                    {(!engine.settings.authenticationEnabled || !session || !session.isAuthenticated()) && (
                        // <Button variant="transparent" size="xs" leftSection={<SettingsIcon size={20} />}/>
                        <ActionIcon variant="subtle" size="xs">
                            <SettingsIcon size={20} />
                        </ActionIcon>
                    )} */}
                    <EntityNamedRenderer slotName="shell-settings-target" {...props}>
                        <ActionIcon variant="subtle" size="xs">
                            <SettingsIcon size={20} />
                        </ActionIcon>
                    </EntityNamedRenderer>
                </Flex>
            </Menu.Target>

            <Menu.Dropdown>
                <EntityNamedRenderer slotName="shell-settings-item" {...props}>
                    <Menu.Label>Entity Engine</Menu.Label>
                    <EntityNamedRenderer slotName="shell-settings-menu" {...props} />
                    <Menu.Divider />
                    <Menu.Item leftSection={<InfoIcon size={14} />} onClick={handleShowInfo}>
                        关于 Entity Engine
                    </Menu.Item>
                </EntityNamedRenderer>
            </Menu.Dropdown>
        </Menu>
    );
}
