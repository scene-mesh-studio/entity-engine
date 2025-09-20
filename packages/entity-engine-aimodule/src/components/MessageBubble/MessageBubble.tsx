// 'use client' directive is added by tsup banner

/**
 * Entity Engine AI - MessageBubble Component
 * 
 * Complete message display component with support for various content types
 * 参考：docs/aisdkui/Generative User Interfaces.md
 * 
 * 🏗️ 混合架构设计：
 * - GenerativeUI/: 固定UI组件（静态工具专用）
 * - DynamicUI/: 动态UI组件（动态工具专用）
 * - 支持两种渲染模式：tool-${name} 和 dynamic-tool
 * - Supports text, tool calls, data parts, and file attachments
 */



import type { MessageBubbleProps } from '../../types';

import React from 'react';
import { Box, Text, Badge, Group, Paper, Stack } from '@mantine/core';

// 🔧 动态组件导入 - DynamicUI文件夹（动态工具专用）
import { DynamicToolRenderer } from '../DynamicUI';
// 🎨 静态组件导入 - GenerativeUI文件夹（基础工具专用）
import { 
  WeatherComponent, 
  LocationComponent, 
  CodeExecutionComponent
} from '../GenerativeUI/PrebuiltComponents';

// Components are directly imported and used
// WeatherComponent, LocationComponent 等都从 PrebuiltComponents 导入

// 推理显示组件 - 精简设计
const ReasoningDisplay = ({ reasoning, step }: { reasoning: string; step?: number }) => (
  <Paper
    p="sm"
    withBorder
    style={{
      backgroundColor: 'var(--mantine-color-yellow-0)',
      borderColor: 'var(--mantine-color-yellow-2)',
      borderLeft: '3px solid var(--mantine-color-yellow-4)'
    }}
  >
    <Text size="xs" fw={500} c="var(--mantine-color-yellow-8)" mb={4}>
      💭 {step ? `Step ${step}:` : 'Reasoning:'}
    </Text>
    <Text size="xs" c="var(--mantine-color-gray-7)" style={{ lineHeight: 1.3 }}>
      {reasoning}
    </Text>
  </Paper>
);

// 文件显示组件 - 精简设计
const FileDisplay = ({ file }: { file: any }) => {
  if (!file) return null;
  
  return (
    <Paper
      p="sm"
      withBorder
      style={{
        backgroundColor: 'var(--mantine-color-gray-0)',
        borderColor: 'var(--mantine-color-gray-3)'
      }}
    >
      <Group gap="xs" align="center">
        <Box
          w={24}
          h={24}
          bg="var(--mantine-color-gray-1)"
          style={{
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
        >
          📎
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="xs" fw={500} c="var(--mantine-color-gray-8)">
            {file.name || 'File'}
          </Text>
          {file.size && (
            <Text size="xs" c="var(--mantine-color-gray-6)">
              {Math.round(file.size / 1024)}KB
            </Text>
          )}
          {file.url && (
            <Text 
              size="xs" 
              component="a" 
              href={file.url} 
              target="_blank" 
              rel="noopener noreferrer"
              c="var(--mantine-color-blue-6)"
              td="none"
              style={{ cursor: 'pointer' }}
            >
              View File
            </Text>
          )}
        </Box>
      </Group>
    </Paper>
  );
};

/**
 * Message bubble component with hybrid architecture implementation
 * 
 * Supports two rendering modes:
 * 1. 静态工具模式：tool-${toolName} → 使用GenerativeUI组件
 * 2. 动态工具模式：dynamic-tool → 使用DynamicUI组件
 * 
 * Standard state handling and naming conventions
 */
export function MessageBubble({ 
  message,
  showAvatar = false, // 不再使用头像
  showTimestamp = true,
  onToolResult,
  enableReasoning = true,
  enableGenerativeUI = true,
  showReasoningByDefault = false
}: MessageBubbleProps) {

  const isUser = message.role === 'user';

  return (
    <Stack gap="xs" mb="md" style={{ width: '100%' }}>
      {/* 极简角色标识 - 用户消息右对齐 */}
      <Group 
        gap="xs" 
        align="center"
        justify={isUser ? "flex-end" : "flex-start"}
      >
        <Badge
          variant="light"
          color={isUser ? "blue" : "gray"}
          size="xs"
          radius="sm"
        >
          {isUser ? "You" : "AI"}
        </Badge>
        {showTimestamp && (
          <Text size="xs" c="var(--mantine-color-gray-5)">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </Group>

      {/* 消息内容区域 - 用户消息右对齐 */}
      <Box 
        style={{ 
          width: '100%',
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start'
        }}
      >
        <Box 
          style={{ 
            maxWidth: '100%',
            width: isUser ? 'fit-content' : '100%'
          }}
        >
        {message.parts.map((part: any, index: number) => {
          // Text part - simple and direct rendering
          if (part.type === 'text') {
            return (
              <Text 
                key={index}
                size="sm"
                style={{
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  textAlign: isUser ? 'right' : 'left'
                }}
                c="var(--mantine-color-text)"
              >
                {part.text}
              </Text>
            );
          }

          // File part - standard file display
          if (part.type === 'file') {
            return <FileDisplay key={index} file={part} />;
          }

          // Data part - supports reasoning display
          if (part.type === 'data') {
            if (part.data?.type === 'reasoning' && enableReasoning) {
              return (
                <ReasoningDisplay 
                  key={index}
                  reasoning={part.data.content}
                  step={part.data.step}
                />
              );
            }
            // 其他数据类型可以在这里扩展
            return null;
          }

          // ================================
          // Static tool handling
          // 模式：part.type === 'tool-${toolName}' → GenerativeUI组件
          // 每个工具对应一个预构建的固定组件
          // ================================

          // getWeather tool handling
          if (part.type === 'tool-getWeather') {
            switch (part.state) {
              case 'input-streaming':
                return <Text key={index} size="xs" c="var(--mantine-color-gray-6)">Preparing weather request...</Text>;
              case 'input-available':
                return <Text key={index} size="xs" c="var(--mantine-color-gray-6)">Getting weather for {part.input?.location}...</Text>;
              case 'output-available':{
                // 触发回调
                if (onToolResult) {
                  onToolResult({
                    toolName: 'getWeather',
                    input: part.input,
                    output: part.output,
                    state: part.state
                  });
                }
                // 解包工具返回的数据：使用 part.output.data 而不是 part.output
                const rawData = part.output.data || part.output;
                // 适配字段名：condition -> weather
                const weatherData = {
                  ...rawData,
                  weather: rawData.condition || rawData.weather
                };
                return (
                  <div key={index}>
                    <WeatherComponent {...weatherData} />
                  </div>
                );
              }
              case 'output-error':
                return (
                  <Paper key={index} p="sm" withBorder style={{
                    backgroundColor: 'var(--mantine-color-red-0)',
                    borderColor: 'var(--mantine-color-red-2)',
                    borderLeft: '3px solid var(--mantine-color-red-4)'
                  }}>
                    <Text size="xs" c="var(--mantine-color-red-8)">
                      ❌ Weather Error: {part.errorText}
                    </Text>
                  </Paper>
                );
              default:
                return null;
            }
          }

          // getLocation tool handling
          if (part.type === 'tool-getLocation') {
            switch (part.state) {
              case 'input-streaming':
                return <Text key={index} size="xs" c="var(--mantine-color-gray-6)">Preparing location request...</Text>;
              case 'input-available':
                return <Text key={index} size="xs" c="var(--mantine-color-gray-6)">Getting location for {part.input?.city}...</Text>;
              case 'output-available':{
                // 触发回调
                if (onToolResult) {
                  onToolResult({
                    toolName: 'getLocation',
                    input: part.input,
                    output: part.output,
                    state: part.state
                  });
                }
                // 解包工具返回的数据：使用 part.output.data 而不是 part.output
                const locationData = part.output.data || part.output;
                return (
                  <div key={index}>
                    <LocationComponent {...locationData} />
                  </div>
                );
              }
              case 'output-error':
                return (
                  <Paper key={index} p="sm" withBorder style={{
                    backgroundColor: 'var(--mantine-color-red-0)',
                    borderColor: 'var(--mantine-color-red-2)',
                    borderLeft: '3px solid var(--mantine-color-red-4)'
                  }}>
                    <Text size="xs" c="var(--mantine-color-red-8)">
                      ❌ Location Error: {part.errorText}
                    </Text>
                  </Paper>
                );
              default:
                return null;
            }
          }

          // displayWeather tool handling
          if (part.type === 'tool-displayWeather') {
            switch (part.state) {
              case 'input-streaming':
                return <Text key={index} size="xs" c="var(--mantine-color-gray-6)">Preparing weather display...</Text>;
              case 'input-available':
                return <Text key={index} size="xs" c="var(--mantine-color-gray-6)">Loading weather display for {part.input?.location}...</Text>;
              case 'output-available':
                // 直接传递工具返回的数据到组件
                return (
                  <div key={index}>
                    <WeatherComponent {...part.output} />
                  </div>
                );
              case 'output-error':
                return (
                  <Paper key={index} p="sm" withBorder style={{
                    backgroundColor: 'var(--mantine-color-red-0)',
                    borderColor: 'var(--mantine-color-red-2)',
                    borderLeft: '3px solid var(--mantine-color-red-4)'
                  }}>
                    <Text size="xs" c="var(--mantine-color-red-8)">
                      ❌ Weather Display Error: {part.errorText}
                    </Text>
                  </Paper>
                );
              default:
                return null;
            }
          }

          // executeCode tool handling
          if (part.type === 'tool-executeCode') {
            switch (part.state) {
              case 'input-streaming':
                return <Text key={index} size="xs" c="var(--mantine-color-gray-6)">Preparing code execution...</Text>;
              case 'input-available':
                return <Text key={index} size="xs" c="var(--mantine-color-gray-6)">Executing code...</Text>;
              case 'output-available':
                // 触发回调
                if (onToolResult) {
                  onToolResult({
                    toolName: 'executeCode',
                    input: part.input,
                    output: part.output,
                    state: part.state
                  });
                }
                return (
                  <div key={index}>
                    <CodeExecutionComponent {...part.output} />
                  </div>
                );
              case 'output-error':
                return (
                  <Paper key={index} p="sm" withBorder style={{
                    backgroundColor: 'var(--mantine-color-red-0)',
                    borderColor: 'var(--mantine-color-red-2)',
                    borderLeft: '3px solid var(--mantine-color-red-4)'
                  }}>
                    <Text size="xs" c="var(--mantine-color-red-8)">
                      ❌ Code Execution Error: {part.errorText}
                    </Text>
                  </Paper>
                );
              default:
                return null;
            }
          }

          // 实体数据查询已统一到动态工具 entityQuery
          // 使用 dynamic-tool 类型进行处理

          // ================================
          // Dynamic tool handling
          // 模式：part.type === 'dynamic-tool' → DynamicUI组件
          // 根据_renderHint智能选择合适的动态组件进行渲染
          // ================================
          
          if (part.type === 'dynamic-tool') {
            return (
              <DynamicToolRenderer
                key={index}
                toolName={part.toolName}
                input={part.input}
                output={part.output}
                state={part.state}
              />
            );
          }

          // Tool result part - simplified display
          if (part.type === 'tool-result') {
            return (
              <Paper key={index} p="sm" withBorder style={{
                backgroundColor: 'var(--mantine-color-blue-0)',
                borderColor: 'var(--mantine-color-blue-2)',
                borderLeft: '3px solid var(--mantine-color-blue-4)'
              }}>
                <Text size="xs" fw={500} c="var(--mantine-color-blue-8)" mb={4}>
                  🔧 Tool Result
                </Text>
                <Text component="pre" size="xs" style={{ 
                  fontFamily: 'monospace', 
                  margin: 0, 
                  lineHeight: 1.3,
                  overflow: 'auto'
                }} c="var(--mantine-color-gray-7)">
                  {JSON.stringify(part.result, null, 2)}
                </Text>
              </Paper>
            );
          }

          // Unknown type - return null
          return null;
        })}
        </Box>
      </Box>
    </Stack>
  );
}

/**
 * 默认导出MessageBubble组件
 */
export default MessageBubble;