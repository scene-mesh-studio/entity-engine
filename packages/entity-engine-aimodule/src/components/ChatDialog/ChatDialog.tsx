// 'use client' directive is added by tsup banner

/**
 * Entity Engine AI - ChatDialog Component
 * 
 * Main dialog component implementing complete AI chat interface
 * with support for all chat features.
 */

import type { FileUIPart, ChatDialogProps } from '../../types';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  X,
  Send,
  Square, 
  Paperclip, 
  AlertCircle, 
  SparklesIcon
} from 'lucide-react';
import { Box, Text, Badge, Group, Paper, Stack, Title, Button, Textarea, ActionIcon, ScrollArea } from '@mantine/core';

import { useChat } from '../../hooks/useChat';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { componentStyles, getThemedTextProps } from '../../utils/theme';

/**
 * Main chat dialog component
 */
export function ChatDialog({
  chatOptions = {},
  title = "AI Assistant",
  description = "Chat with your AI assistant",
  open = false,
  onOpenChange,
  placeholder = "Type your message here...",
  className,
  showHeader = true,
  allowFileUpload = true,
  acceptedFileTypes = ['image/*', 'text/*', 'application/pdf'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  messageRenderer,
  theme = 'system',
  // 新增的增强功能选项
  enableReasoning = true,
  enableGenerativeUI = true,
  showReasoningByDefault = false,
}: ChatDialogProps) {
  
  // Frontend tool execution state
  const [frontendToolStatus, setFrontendToolStatus] = useState({
    isProcessing: false,
    currentTool: undefined as string | undefined,
    processedTools: new Set<string>() // 防止重复处理
  });
  
  // 创建友好的错误处理函数
  const handleError = useCallback((err: Error) => {
    console.error('ChatDialog useChat error:', err);
    
    // 创建友好的错误消息，避免泄漏服务器信息
    let friendlyError = err;
    const originalMessage = err.message || 'Unknown occurred';
    
    // 如果错误消息包含HTML标签或看起来像HTML响应
    if (originalMessage.includes('<!DOCTYPE') || originalMessage.includes('<html>') || originalMessage.includes('<body>')) {
      friendlyError = new Error('AI服务连接失败，请检查服务器是否正在运行');
      friendlyError.name = err.name;
    }
    // 检查常见的网络错误
    else if (originalMessage.includes('fetch') || originalMessage.includes('NetworkError') || originalMessage.includes('Failed to fetch')) {
      friendlyError = new Error('AI服务连接失败，请检查网络连接');
      friendlyError.name = err.name;
    }
    // 检查404错误 
    else if (originalMessage.includes('404') || originalMessage.includes('Not Found')) {
      friendlyError = new Error('AI API端点未找到，请确保AI服务器正在运行并且端点配置正确');
      friendlyError.name = err.name;
    }
    // 检查连接被拒绝
    else if (originalMessage.includes('ECONNREFUSED') || originalMessage.includes('Connection refused')) {
      friendlyError = new Error('AI服务器连接被拒绝');
      friendlyError.name = err.name;
    }
    
    
    // 调用原始错误处理器
    chatOptions.onError?.(friendlyError);
  }, [chatOptions]);


  // Chat hook implementation
  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
    clearError,
    resumeStream,
    addToolResult,
    setMessages,
  } = useChat({
    // Use standard properties from chatOptions
    ...(chatOptions as any),
    // Standard onFinish callback
    onFinish: (options) => {
      // AI回复完成后重新聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      // 调用原始onFinish回调
      chatOptions.onFinish?.(options);
    },
    onError: handleError,
    // Standard onToolCall - for listening only, no return value
    onToolCall: chatOptions.onToolCall,
  });

  // Frontend tool listener - monitors AI tool calls and sends HTTP requests
  useEffect(() => {
    const handleFrontendToolCall = async (toolName: string, input: any) => {
      // 前端工具名单
      const frontendToolNames = [
        'recordGetValues',
        'recordSetValues', 
        'recordGetFieldInfo',
        'recordResetForm',
        'recordValidateForm'
      ];
      
      if (!frontendToolNames.includes(toolName)) {
        return; // 不是前端工具，忽略
      }
      
      
      // 更新状态显示正在处理
      setFrontendToolStatus(prev => ({
        ...prev,
        isProcessing: true,
        currentTool: toolName
      }));
      
      // 生成等待ID（与后端匹配）
      const waitId = `frontend-${toolName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        if ((window as any).__ENTITY_ENGINE_AI_BRIDGE__) {
          // 执行前端工具
          const result = await (window as any).__ENTITY_ENGINE_AI_BRIDGE__.executeViewControllerTool(
            toolName,
            input || {}
          );
          
          
          // 直接通过HTTP发送结果给后端
          const finalResult = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
          
          // 发送HTTP请求到后端
          await fetch('/api/ee/servlet/ai/frontend-tool-result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              waitId: `frontend-${toolName}`, // 简化waitId匹配
              result: finalResult,
              timestamp: Date.now()
            })
          });
          
          
        }
        
      } catch (_error) {
        
        // 发送错误给后端
        await fetch('/api/ee/servlet/ai/frontend-tool-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            waitId: `frontend-${toolName}`,
            error: (error as Error).message,
            timestamp: Date.now()
          })
        });
        
      } finally {
        // 重置状态
        setFrontendToolStatus(prev => ({
          ...prev,
          isProcessing: false,
          currentTool: undefined
        }));
      }
    };
    
    // 暴露给ai-form-renderer使用
    (window as any).__FRONTEND_TOOL_HANDLER__ = handleFrontendToolCall;
    
    return () => {
      if ((window as any).__FRONTEND_TOOL_HANDLER__) {
        delete (window as any).__FRONTEND_TOOL_HANDLER__;
      }
    };
  }, []);



  // Local input state management
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileUIPart[]>([]);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);



  // Handle form submission with sendMessage API
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && attachedFiles.length === 0) return;
    if (status === 'streaming') return;

    try {
      // Use sendMessage API
      if (attachedFiles.length > 0) {
        // Send message with attachments
        sendMessage({
          text: input.trim(),
          files: attachedFiles
        });
      } else {
        // Send text-only message
        sendMessage({
          text: input.trim()
        });
      }

      // Reset form state
      setInput('');
      setAttachedFiles([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (sendError) {
      console.error('Failed to send message:', sendError);
    }
  }, [input, attachedFiles, status, sendMessage]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileUIPart[] = [];

    Array.from(files).forEach((file, index) => {
      // Validate file size
      if (file.size > maxFileSize) {
        return;
      }

      // Validate file type
      const isAccepted = acceptedFileTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        return;
      }

      // Create file URL
      const fileUrl = URL.createObjectURL(file);

      newFiles.push({
        type: 'file',
        filename: file.name,
        mediaType: file.type,
        url: fileUrl,
      });
    });

    setAttachedFiles(prev => [...prev, ...newFiles]);
  }, [maxFileSize, acceptedFileTypes]);

  // Remove attached file
  const removeFile = useCallback((index: number) => {
    setAttachedFiles(prev => {
      const newFiles = prev.slice();
      // Revoke URL to prevent memory leaks
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  // Handle input key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Submit form (Shift+Enter for newline)
      e.preventDefault();
      handleFormSubmit(e as any);
    }
  }, [handleFormSubmit]);


  const isLoading = status === 'streaming' || status === 'submitted';
  const canSend = !isLoading && (input.trim() || attachedFiles.length > 0);

  return (
    <Box
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 'auto',
        minHeight: 0,
        overflow: 'hidden',
        background: `
          radial-gradient(
            circle at 85% 85%,
            rgba(34, 139, 230, 0.18) 0%,
            rgba(34, 139, 230, 0.09) 25%,
            rgba(34, 139, 230, 0.03) 50%,
            rgba(255, 255, 255, 1) 75%
          )
        `,
      }}
    >
        {/* Header - 精致标题栏 */}
        {showHeader && (
          <Paper 
            p="lg"
            bg="white"
            radius={0}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 100
            }}
          >
            <Group justify="space-between" align="center" style={{ width: '100%' }}>
              <Group gap="md" style={{ flex: 1 }}>
                <Box
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                  }}
                >
                  <SparklesIcon size={24} color="#1976d2" />
                </Box>
                <div>
                  <Title order={4} c="var(--mantine-color-gray-9)" mb={2}>
                    {title}
                  </Title>
                  <Group gap="xs" align="center">
                    <Badge 
                      size="xs" 
                      color={error ? "red" : "green"} 
                      variant="light"
                      leftSection={
                        <Box w={6} h={6} bg={error ? "red" : "green"} style={{ borderRadius: '50%' }} />
                      }
                    >
                      {error ? 'Offline' : 'Online'}
                    </Badge>
                    
                    {description && (
                      <Text size="xs" c="var(--mantine-color-gray-6)">
                        {description}
                      </Text>
                    )}
                  </Group>
                </div>
              </Group>
              
              <ActionIcon 
                variant="subtle" 
                color="gray" 
                size="lg"
                onClick={() => onOpenChange?.(false)}
                aria-label="关闭对话框"
                style={{ flexShrink: 0 }}
              >
                <X size={18} />
              </ActionIcon>
            </Group>
          </Paper>
        )}

        {/* Messages Area */}
        <ScrollArea style={{ flex: 1 }} p="xl">
          <Stack gap="md" maw="none" w="100%">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {messageRenderer ? (
                    React.createElement(messageRenderer, { message: message as any })
                  ) : (
                    <MessageBubble
                      message={message as any}
                      showAvatar
                      showTimestamp
                      enableReasoning={enableReasoning}
                      enableGenerativeUI={enableGenerativeUI}
                      showReasoningByDefault={showReasoningByDefault}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Group gap="sm" justify="space-between">
                  <Group gap="sm">
                    <Group gap="xs">
                      <Box w={8} h={8} bg="gray.4" style={{ borderRadius: '50%', animation: 'bounce 1s infinite' }} />
                      <Box w={8} h={8} bg="gray.4" style={{ borderRadius: '50%', animation: 'bounce 1s infinite 0.1s' }} />
                      <Box w={8} h={8} bg="gray.4" style={{ borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
                    </Group>
                    <Text size="sm" {...getThemedTextProps('muted')}>
                      AI is thinking...
                    </Text>
                  </Group>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={stop}
                    size="sm"
                  >
                    <Square size={16} />
                  </ActionIcon>
                </Group>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        </ScrollArea>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ margin: '1rem' }}
          >
            <Paper
              p="md"
              style={{
                backgroundColor: componentStyles.status.error.background,
                borderLeft: `4px solid ${componentStyles.status.error.border}`,
              }}
            >
              <Group align="flex-start" gap="sm">
                <AlertCircle size={20} color={componentStyles.status.error.text} />
                <Box style={{ flex: 1 }}>
                  <Text size="sm" fw={500} c={componentStyles.status.error.text}>
                    Connection Error
                  </Text>
                  <Text size="sm" c={componentStyles.status.error.text} mt="xs">
                    {error.message}
                  </Text>
                  <Group gap="sm" mt="md">
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => clearError()}
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      onClick={() => resumeStream()}
                    >
                      Retry Connection
                    </Button>
                  </Group>
                </Box>
              </Group>
            </Paper>
          </motion.div>
        )}

        {/* File Attachments - 专业预览区域 */}
        {attachedFiles.length > 0 && (
          <Paper 
            p="lg" 
            shadow="xs"
            style={{ 
              borderTop: '1px solid var(--mantine-color-gray-2)',
              backgroundColor: 'var(--mantine-color-gray-0)'
            }}
          >
            <Text size="sm" fw={500} c="var(--mantine-color-gray-7)" mb="md">
              📎 附件预览
            </Text>
            <Group gap="md" wrap="wrap">
              {attachedFiles.map((file, index) => (
                <Paper 
                  key={`${file.filename}-${index}`}
                  p="sm" 
                  shadow="xs" 
                  withBorder
                  style={{ 
                    maxWidth: '280px',
                    backgroundColor: 'white',
                    position: 'relative'
                  }}
                >
                  <Group gap="sm" align="center">
                    <Box
                      w={32}
                      h={32}
                      bg="var(--mantine-color-blue-light)"
                      style={{ 
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Paperclip size={16} color="var(--mantine-color-blue-6)" />
                    </Box>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate c="var(--mantine-color-gray-8)">
                        {file.filename}
                      </Text>
                      <Text size="xs" c="var(--mantine-color-gray-6)">
                        {file.mediaType}
                      </Text>
                    </Box>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeFile(index)}
                      style={{ flexShrink: 0 }}
                    >
                      <X size={14} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Group>
          </Paper>
        )}

        {/* Input Area - 专业级交互区域 */}
        <Paper 
          p="lg" 
          shadow="md"
          style={{ 
            borderTop: '1px solid var(--mantine-color-gray-2)',
            backgroundColor: 'white',
            position: 'sticky',
            bottom: 0,
            zIndex: 50
          }}
        >
          <form onSubmit={handleFormSubmit}>
            <Stack gap="sm">
              {/* 主输入区域 */}
              <Group align="center" gap="md">
                {/* 文件上传按钮 - 精致设计 */}
                {allowFileUpload && (
                  <Box>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={acceptedFileTypes.join(',')}
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <ActionIcon
                      variant="light"
                      color="gray"
                      size="lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      style={{
                        border: '2px solid var(--mantine-color-gray-3)',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Paperclip size={20} />
                    </ActionIcon>
                  </Box>
                )}

                {/* 文本输入框 - 高端质感 */}
                <Box style={{ flex: 1 }}>
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={placeholder}
                    disabled={isLoading}
                    minRows={1}
                    maxRows={4}
                    autosize
                    variant="filled"
                    styles={{
                      input: {
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        border: '2px solid var(--mantine-color-gray-2)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        transition: 'all 0.2s ease',
                        '&:focus': {
                          backgroundColor: 'white',
                          borderColor: 'var(--mantine-color-blue-4)',
                          boxShadow: '0 0 0 3px var(--mantine-color-blue-1)',
                        },
                        '&::placeholder': {
                          color: 'var(--mantine-color-gray-5)',
                        }
                      }
                    }}
                  />
                </Box>

                {/* 发送按钮 - 渐变高端效果 */}
                <ActionIcon
                  type="submit"
                  disabled={!canSend}
                  size="lg"
                  variant="filled"
                  style={{
                    background: canSend 
                      ? 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-blue-5))'
                      : 'var(--mantine-color-gray-4)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: canSend 
                      ? '0 4px 12px var(--mantine-color-blue-2)' 
                      : 'none',
                    transform: canSend ? 'scale(1)' : 'scale(0.95)',
                    transition: 'all 0.2s ease',
                    cursor: canSend ? 'pointer' : 'not-allowed',
                    '&:hover': canSend ? {
                      transform: 'scale(1.05)',
                      boxShadow: '0 6px 16px var(--mantine-color-blue-3)',
                    } : {}
                  }}
                >
                  <Send size={20} />
                </ActionIcon>
              </Group>

              {/* 输入提示 - 微妙的状态指示 */}
              {input.length > 0 && (
                <Group justify="space-between" align="center">
                  <Text size="xs" c="var(--mantine-color-gray-6)">
                    {isLoading ? 'AI正在回复...' : 'Enter发送，Shift+Enter换行'}
                  </Text>
                  <Text size="xs" c="var(--mantine-color-gray-5)">
                    {input.length}/2000
                  </Text>
                </Group>
              )}
            </Stack>
          </form>
        </Paper>
    </Box>
  );
}

/**
 * 默认导出ChatDialog组件
 */
export default ChatDialog;