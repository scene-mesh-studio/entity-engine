// 'use client' directive is added by tsup banner

import type { IEntityNamedRenderer } from '@scenemesh/entity-engine';

import { Bot } from 'lucide-react';
import { modals } from '@mantine/modals';
import { DefaultChatTransport } from 'ai';
import { Menu, Drawer } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { useState, useEffect, useCallback } from 'react';

import { ChatDialog } from '../../components';

function AIModal() {
    const { width } = useViewportSize();
    const [drawerOpened, setDrawerOpened] = useState(false);

    // When Modal opens, delay opening Drawer slightly for animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setDrawerOpened(true);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // Responsive size calculation
    const getDrawerSize = useCallback(() => {
        if (width <= 768) return '80%';
        if (width <= 1024) return '40%';
        return '30%';
    }, [width]);

    const handleClose = useCallback(() => {
        setDrawerOpened(false);
        // Close Modal after animation completes
        setTimeout(() => {
            modals.close('entity-engine-ai');
        }, 200);
    }, []);

    const handleExitTransitionEnd = useCallback(() => {
    }, []);

    const handleEnterTransitionEnd = useCallback(() => {
    }, []);

    return (
        <Drawer
            opened={drawerOpened}
            onClose={handleClose}
            position="right"
            withOverlay={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
            withCloseButton={false}
            zIndex={1001}
            onExitTransitionEnd={handleExitTransitionEnd}
            onEnterTransitionEnd={handleEnterTransitionEnd}
            transitionProps={{
                transition: 'slide-left',
                duration: 200,
                timingFunction: 'ease-out',
            }}
            styles={{
                content: {
                    height: '100vh',
                    borderRadius: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
                },
                body: {
                    height: '100vh',
                    padding: 0,
                    overflow: 'hidden',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }
            }}
            size={getDrawerSize()}
        >
            <ChatDialog
                title="AI Assistant"
                description="scenemesh ai"
                open
                onOpenChange={(open) => {
                    if (!open) {
                        handleClose();
                    }
                }}
                placeholder="Enter your question or request..."
                showHeader
                allowFileUpload
                acceptedFileTypes={['image/*', 'text/*', 'application/pdf', 'application/json']}
                maxFileSize={10 * 1024 * 1024} // 10MB
                theme="system"
                chatOptions={{
                    id: 'ai-assistant-chat',
                    transport: new DefaultChatTransport({
                        api: '/api/ee/servlet/ai/chat',
                    }),
                    onFinish: (options) => {
                    },
                    onError: (error) => {
                    },
                }}
            />
        </Drawer>
    );
}

function EntityAILaunchComp(_props: any) {
    const handleOpenAI = () => {
        modals.open({
            modalId: 'entity-engine-ai',
            size: 'full',
            withCloseButton: false,
            closeOnClickOutside: false,
            closeOnEscape: true,
            withOverlay: false,
            padding: 0,
            styles: {
                body: { padding: 0, backgroundColor: 'transparent' },
                content: { backgroundColor: 'transparent' },
                inner: { padding: 0 },
            },
            children: <AIModal />,
        });
    };

    return (
        <Menu.Item leftSection={<Bot size={14} />} onClick={handleOpenAI}>
            AI Assistant
        </Menu.Item>
    );
}

export const EntityEngineAIModalRenderer: IEntityNamedRenderer = {
    name: 'shell-settings-ai-launch-menu',
    slotName: 'shell-settings-menu',
    disabled: false,
    renderer: (props) => <EntityAILaunchComp {...props} />,
};