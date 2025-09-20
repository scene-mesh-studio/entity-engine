'use client';

import type { IEntityNamedRenderer } from '../../types';
import type { IEntityViewDelegate, IEntityModelDelegate } from '../../../core';

import React from 'react';
import { modals } from '@mantine/modals';
import JsonView from '@uiw/react-json-view';
import { Tabs, ActionIcon } from '@mantine/core';
import { ViewIcon, DatabaseIcon, Settings2Icon } from 'lucide-react';

import { useEntityEngine } from '../../../uikit';

export const EntityViewInspector: IEntityNamedRenderer = {
    name: 'buildin-view-inspector',
    slotName: 'view-inspector',
    disabled: false,
    renderer: (props) => <EntityViewInspectorComp {...props} />,
};

function EntityViewInspectorComp(props: any) {
    const { model, viewData } = props;

    const handleAction = () => {
        modals.open({
            title: '视图配置数据',
            children: (
                <div>
                    <InnerEntityViewInspectorComp {...props} model={model} viewData={viewData} />
                </div>
            ),
            size: '80%',
            centered: true,
            closeOnClickOutside: true,
            closeOnEscape: true,
            onClose: () => {
                console.log('Settings modal closed');
            },
        });
    };

    return (
        <ActionIcon variant="subtle" aria-label="Settings" onClick={handleAction}>
            <Settings2Icon size={14} strokeWidth={2} />
        </ActionIcon>
    );
}

type InnerEntityViewInspectorProps = {
    model: IEntityModelDelegate;
    viewData: IEntityViewDelegate;
    [key: string]: any; // Allow other props to be passed
};

function InnerEntityViewInspectorComp(props: InnerEntityViewInspectorProps) {
    const { model, viewData, ...otherProps } = props;
    const [tab, setTab] = React.useState('model');
    const engine = useEntityEngine();

    const handleTabChange = (value: string | null) => {
        setTab(value || 'model');
    };

    return (
        <Tabs value={tab} variant="outline" color="blue" radius="md" onChange={handleTabChange}>
            <Tabs.List>
                <Tabs.Tab value="model" leftSection={<ViewIcon size={14} strokeWidth={2} />}>
                    模型配置
                </Tabs.Tab>
                <Tabs.Tab value="view" leftSection={<DatabaseIcon size={14} strokeWidth={2} />}>
                    视图配置
                </Tabs.Tab>
                <Tabs.Tab value="other" leftSection={<Settings2Icon size={14} strokeWidth={2} />}>
                    其他数据
                </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="model" pt="xs">
                <JsonView
                    value={JSON.parse(
                        JSON.stringify(model, (key, value) => {
                            if (typeof key === 'string' && key.startsWith('_metaRegistry')) {
                                return undefined;
                            }
                            return value;
                        })
                    )}
                />
            </Tabs.Panel>
            <Tabs.Panel value="view" pt="xs">
                <JsonView
                    value={JSON.parse(
                        JSON.stringify(viewData, (key, value) => {
                            if (typeof key === 'string' && key.startsWith('_metaRegistry')) {
                                return undefined;
                            }
                            return value;
                        })
                    )}
                />
            </Tabs.Panel>
            <Tabs.Panel value="other" pt="xs">
                <JsonView
                    value={JSON.parse(
                        JSON.stringify(otherProps, (key, value) => {
                            if (typeof key === 'string' && key.startsWith('_metaRegistry')) {
                                return undefined;
                            }
                            return value;
                        })
                    )}
                />
            </Tabs.Panel>
        </Tabs>
    );
}
