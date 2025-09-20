// 'use client' directive is added by tsup banner

import type { IEntityView, IEntityModel, IEntityNamedRenderer } from '@scenemesh/entity-engine';

import { DefaultChatTransport } from 'ai';
import { SparklesIcon } from 'lucide-react';
import { Button, Drawer } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { useState, useEffect, useCallback } from 'react';
import { useEntityEngine } from '@scenemesh/entity-engine';

import { ChatDialog } from '../../components';


function EntityAIFormComp(_props: any) {
    const engine = useEntityEngine();
    const model = _props.model as IEntityModel;
    const viewdata = _props.viewData as IEntityView;
    const viewId = _props.additionalProps?.viewId;
    const vc = engine.componentRegistry.getViewController(undefined, undefined, viewId);
    
    const { width } = useViewportSize();
    const [drawerOpened, setDrawerOpened] = useState(false);

    // Responsive size calculation
    const getDrawerSize = useCallback(() => {
        if (width <= 768) return '80%';
        if (width <= 1024) return '40%';
        return '30%';
    }, [width]);

    const handleOpenAI = () => {
        setDrawerOpened(true);
    };

    const handleClose = useCallback(() => {
        setDrawerOpened(false);
    }, []);

    // Frontend tool executor - executes view controller operations directly in frontend
    const executeViewControllerTool = useCallback(async (toolName: string, input: any): Promise<string> => {
        
        if (!vc) {
            throw new Error('没有可用的视图控制器');
        }

        // 解析工具名称到视图控制器操作
        const operationMap: Record<string, string> = {
            'recordGetValues': 'record.getValues',
            'recordSetValues': 'record.setValues',
            'recordGetFieldInfo': 'record.getFieldInfo',
            'recordResetForm': 'record.resetForm',
            'recordValidateForm': 'record.validateForm',
        };

        // Validate field names and record actual set values
        if (toolName === 'recordSetValues') {
            if (input.values) {
                const fieldNames = Object.keys(input.values);
                
                // 获取当前表单实际的字段名
                const actualFields = await vc.invoke('record.getFieldInfo', {});
                if (actualFields && Array.isArray(actualFields)) {
                    const realFieldNames = actualFields.map((field: any) => field._field?.name).filter(Boolean);
                    
                    // 检查字段名是否匹配
                    const invalidFields = fieldNames.filter(name => !realFieldNames.includes(name));
                    if (invalidFields.length > 0) {
                        
                        // 过滤掉无效字段，只设置有效字段
                        const validValues: Record<string, any> = {};
                        Object.entries(input.values).forEach(([key, value]) => {
                            if (realFieldNames.includes(key)) {
                                validValues[key] = value;
                            }
                        });
                        
                        if (Object.keys(validValues).length > 0) {
                            // 更新input.values为只包含有效字段
                            input.values = validValues;
                        } else {
                            // 🚨 返回详细错误信息，包含准确字段名，让AI重新调用
                            return `Field name error! You used invalid field names.\n\nInvalid fields: [${invalidFields.join(', ')}]\nCorrect field names: [${realFieldNames.join(', ')}]

请重新调用recordSetValues，使用正确的字段名:
示例: recordSetValues({"values": {"${realFieldNames[0]}": "产品值", "${realFieldNames.slice(1, 3).join('": "值", "')}": "值"}})

重要提醒: 必须使用recordGetFieldInfo返回的确切字段名，不能猜测或翻译字段名！`;
                        }
                    }
                }
            }
        }

        const operation = operationMap[toolName];
        if (!operation) {
            throw new Error(`未知的工具: ${toolName}`);
        }

        const result = await vc.invoke(operation, input);
        
        // 返回字符串结果供AI使用
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    }, [vc]);

    // 🌉 注册全局前端工具桥接和HTTP通信
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__ENTITY_ENGINE_AI_BRIDGE__ = {
                executeViewControllerTool
            };

            // Setup frontend to backend HTTP communication bridge
            window.resolveFrontendTool = (waitId: string, result: string) => {
                
                // 通过HTTP POST发送结果给后端
                fetch('/api/ee/servlet/ai/frontend-tool-result', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        waitId,
                        result,
                        timestamp: Date.now()
                    })
                }).then(response => {
                    if (!response.ok) {
                        console.error('Failed to send tool result');
                    }
                }).catch(error => {
                    console.error('Failed to send tool result:', error);
                });
            };
            
            window.rejectFrontendTool = (waitId: string, error: string) => {
                
                fetch('/api/ee/servlet/ai/frontend-tool-result', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        waitId,
                        error,
                        timestamp: Date.now()
                    })
                }).catch(networkError => {
                });
            };

            return () => {
                if (window.__ENTITY_ENGINE_AI_BRIDGE__) {
                    delete (window as any).__ENTITY_ENGINE_AI_BRIDGE__;
                }
                if ((window as any).resolveFrontendTool) {
                    delete (window as any).resolveFrontendTool;
                }
                if ((window as any).rejectFrontendTool) {
                    delete (window as any).rejectFrontendTool;
                }
            };
        }
        return () =>{}
    }, [executeViewControllerTool]);


    return (
        <>
            <Button 
                leftSection={<SparklesIcon size={20} />} 
                onClick={handleOpenAI}
                disabled={!vc}
                variant='light'
            >
                智能填表
            </Button>

            <Drawer
                opened={drawerOpened}
                onClose={handleClose}
                position="right"
                withOverlay={false}
                closeOnClickOutside={false}
                closeOnEscape
                zIndex={9999999}
                withCloseButton={false}
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
                {/* Pass viewController directly to ChatDialog */}
                <ChatDialog
                        title="AI助手"
                        description={`scenemesh ai ${vc ? `• ${vc.viewType}视图` : ''}`}
                        open
                        onOpenChange={(open) => {
                            if (!open) {
                                handleClose();
                            }
                        }}
                        placeholder="输入您的问题或需求..."
                        showHeader
                        allowFileUpload
                        acceptedFileTypes={['image/*', 'text/*', 'application/pdf', 'application/json']}
                        maxFileSize={10 * 1024 * 1024} // 10MB
                        theme="system"
                        // Mixed tool configuration - backend tools + frontend tool interception
                        chatOptions={{
                            id: 'ai-assistant-chat',
                            transport: new DefaultChatTransport({
                                api: '/api/ee/servlet/ai/chat',
                            }),
                            onFinish: (options) => {
                                // Standard AI SDK onFinish callback
                            },
                            onError: (error) => {
                                if (error.message.includes('AI服务连接失败')) {
                                    console.error('AI service connection failed:', error);
                                }
                            },
                            // Tool call listener - calls ChatDialog's frontend tool handler
                            onToolCall: async ({ toolCall }: { toolCall: any }) => {
                                
                                // Try different parameter fields
                                const toolInput = toolCall.args || toolCall.input || toolCall.parameters || {};
                                
                                
                                // Call ChatDialog's frontend tool handler
                                if (typeof (window as any).__FRONTEND_TOOL_HANDLER__ === 'function') {
                                    
                                    // 异步调用，不阻塞AI SDK
                                    setTimeout(() => {
                                        (window as any).__FRONTEND_TOOL_HANDLER__(toolCall.toolName, toolInput);
                                    }, 0);
                                }
                            },
                        }}
                    />
            </Drawer>
        </>
    );
}

export const EntityEngineAIFormRenderer: IEntityNamedRenderer = {
    name: 'view-form-tool-1',
    slotName: 'view-form-tool',
    disabled: false,
    renderer: (props) => <EntityAIFormComp {...props} />,
};