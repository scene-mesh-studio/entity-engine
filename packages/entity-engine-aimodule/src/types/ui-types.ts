/**
 * Entity Engine AI - Complete Type Definitions
 * 
 * Complete type system for AI integration
 * 确保所有功能的类型安全性
 */

import type { z } from 'zod';
import type { 
  UIMessage, 
  DataUIPart, 
  FileUIPart,
  TextUIPart,
  UIMessagePart,
  ToolResultPart
} from 'ai';

// Base message types

/**
 * Standard UI message types
 * 不添加任何非标准字段，确保完全兼容
 */
export type StandardUIMessage = UIMessage;

/**
 * 消息角色类型
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * 消息状态类型
 */
export type MessageStatus = 'submitted' | 'streaming' | 'ready' | 'error';

// Tool related types

/**
 * Tool call status types
 * 支持流式工具调用的完整状态，包括input-streaming
 */
export type ToolCallState = 
  | 'input-streaming'    // 工具输入正在流式传输
  | 'input-available'    // 工具输入已完成，准备执行（显示加载状态）
  | 'output-available'   // 工具执行完成，输出可用
  | 'output-error';      // 工具执行出错

/**
 * 工具类型定义
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  type: 'server-side' | 'client-side' | 'user-interaction';
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: any;
  error?: string;
  executionTime?: number;
}

/**
 * 用户交互工具选项
 */
export interface UserInteractionToolOptions {
  title: string;
  description?: string;
  actions: Array<{
    label: string;
    value: any;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  }>;
}

// Chat functionality types

/**
 * Chat configuration options
 */
export interface ChatOptions<TMessage extends StandardUIMessage = StandardUIMessage> {
  /** 聊天ID */
  id?: string;
  /** 初始消息 */
  initialMessages?: TMessage[];
  /** Transport configuration */
  transport?: any; // ChatTransport type
  /** API端点 - 向后兼容 */
  api?: string;
  /** 请求头 - 向后兼容 */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** 请求体 - 向后兼容 */
  body?: Record<string, any> | (() => Record<string, any>);
  /** 凭据模式 - 向后兼容 */
  credentials?: RequestCredentials;
  /** 工具调用回调 */
  onToolCall?: (options: { toolCall: any }) => void | Promise<void>;
  /** 自动发送条件 */
  sendAutomaticallyWhen?: (options: { messages: TMessage[] }) => boolean | PromiseLike<boolean>;
  /** 完成回调 */
  onFinish?: (options: {
    message: TMessage;
    messages: TMessage[];
    isAbort: boolean;
    isDisconnect: boolean;
    isError: boolean;
  }) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 数据回调 */
  onData?: (dataPart: DataUIPart<any>) => void;
  /** UI更新节流 */
  experimental_throttle?: number;
  /** 是否恢复流 */
  resume?: boolean;
  
  // ================================
  // ✅ Entity Engine Integration
  // ================================
  /** 视图控制器实例 - 支持客户端工具调用 */
  viewController?: any; // IEntityViewController from @scenemesh/entity-engine
}

/**
 * Chat return values
 */
export interface ChatReturn<TMessage extends StandardUIMessage = StandardUIMessage> {
  /** 聊天ID */
  id: string;
  /** 消息列表 */
  messages: TMessage[];
  /** 当前状态 */
  status: MessageStatus;
  /** 错误信息 */
  error: Error | undefined;
  /** 发送消息 */
  sendMessage: (message: string | { text: string; files?: FileList | FileUIPart[] }, options?: any) => void;
  /** 重新生成 */
  regenerate: (options?: { messageId?: string }) => void;
  /** 停止生成 */
  stop: () => void;
  /** 清除错误 */
  clearError: () => void;
  /** 恢复流 */
  resumeStream: () => void;
  /** 添加工具结果 */
  addToolResult: (options: { tool: string; toolCallId: string; output: unknown }) => void;
  /** 设置消息 */
  setMessages: (messages: TMessage[] | ((messages: TMessage[]) => TMessage[])) => void;
}

// Completion functionality types

/**
 * 补全配置选项
 */
export interface CompletionOptions {
  /** API端点 */
  api?: string;
  /** 补全ID */
  id?: string;
  /** 初始输入 */
  initialInput?: string;
  /** 初始补全 */
  initialCompletion?: string;
  /** 完成回调 */
  onFinish?: (prompt: string, completion: string) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 请求头 */
  headers?: Record<string, string> | Headers;
  /** 请求体 */
  body?: any;
  /** 凭据模式 */
  credentials?: RequestCredentials;
  /** 流协议 */
  streamProtocol?: 'text' | 'data';
  /** 自定义fetch */
  fetch?: typeof fetch;
  /** UI更新节流 */
  experimental_throttle?: number;
}

/**
 * 补全返回值
 */
export interface CompletionReturn {
  /** 补全文本 */
  completion: string;
  /** 执行补全 */
  complete: (prompt: string, options?: { headers?: any; body?: any }) => void;
  /** 错误信息 */
  error: Error | undefined;
  /** 设置补全 */
  setCompletion: (completion: string) => void;
  /** 停止生成 */
  stop: () => void;
  /** 输入值 */
  input: string;
  /** 设置输入 */
  setInput: React.Dispatch<React.SetStateAction<string>>;
  /** 输入变化处理 */
  handleInputChange: (event: any) => void;
  /** 表单提交处理 */
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
  /** 是否加载中 */
  isLoading: boolean;
}

// Object generation types

/**
 * 对象生成配置选项
 */
export interface ObjectOptions<T = any> {
  /** API端点 */
  api: string;
  /** Zod Schema */
  schema: z.ZodSchema<T>;
  /** 对象ID */
  id?: string;
  /** 初始值 */
  initialValue?: Partial<T>;
  /** 自定义fetch */
  fetch?: typeof fetch;
  /** 请求头 */
  headers?: Record<string, string> | Headers;
  /** 凭据模式 */
  credentials?: RequestCredentials;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 完成回调 */
  onFinish?: (result: { object: T | undefined; error: unknown | undefined }) => void;
}

/**
 * 对象生成返回值
 */
export interface ObjectReturn<T = any> {
  /** 提交请求 */
  submit: (input: any) => void;
  /** 生成的对象 */
  object: Partial<T> | undefined;
  /** 错误信息 */
  error: Error | unknown;
  /** 是否加载中 */
  isLoading: boolean;
  /** 停止生成 */
  stop: () => void;
  /** 清除对象 */
  clear: () => void;
}

// UI component types

/**
 * 聊天对话框属性 - 扩展支持更多UI功能
 */
export interface ChatDialogProps {
  /** 聊天选项 */
  chatOptions?: ChatOptions;
  /** 对话框标题 */
  title?: string;
  /** 对话框描述 */
  description?: string;
  /** 是否打开 */
  open?: boolean;
  /** 打开状态变化回调 */
  onOpenChange?: (open: boolean) => void;
  /** 输入框占位符 */
  placeholder?: string;
  /** 自定义样式类 */
  className?: string;
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 是否允许文件上传 */
  allowFileUpload?: boolean;
  /** 接受的文件类型 */
  acceptedFileTypes?: string[];
  /** 最大文件大小 */
  maxFileSize?: number;
  /** 工具渲染器 */
  toolRenderers?: Record<string, React.ComponentType<any>>;
  /** 消息渲染器 */
  messageRenderer?: React.ComponentType<any>;
  /** 主题配置 */
  theme?: ThemeConfig | string;
  /** 启用推理显示 */
  enableReasoning?: boolean;
  /** 启用生成式UI */
  enableGenerativeUI?: boolean;
  /** 默认显示推理 */
  showReasoningByDefault?: boolean;
  
  // ================================
  // ✅ 页面上下文支持
  // ================================
  /** 页面上下文信息 */
  pageContext?: any;
}

/**
 * 消息气泡属性 - 扩展支持更多显示选项
 */
export interface MessageBubbleProps {
  /** 消息对象 */
  message: UIMessage;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 是否显示时间戳 */
  showTimestamp?: boolean;
  /** 工具结果回调 */
  onToolResult?: (result: any) => void;
  /** 启用推理显示 */
  enableReasoning?: boolean;
  /** 启用生成式UI */
  enableGenerativeUI?: boolean;
  /** 默认显示推理 */
  showReasoningByDefault?: boolean;
}


/**
 * 文件查看器属性
 */
export interface FileViewerProps {
  /** 文件对象 */
  file: FileUIPart;
  /** 是否显示下载按钮 */
  showDownload?: boolean;
  /** 是否显示删除按钮 */
  showRemove?: boolean;
  /** 删除回调 */
  onRemove?: (file: FileUIPart) => void;
  /** 自定义样式类 */
  className?: string;
}

// Transport related types

/**
 * 自定义Transport配置
 */
export interface CustomTransportOptions {
  /** API端点 */
  api?: string;
  /** 请求头 */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** 请求体 */
  body?: Record<string, any> | (() => Record<string, any>);
  /** 凭据模式 */
  credentials?: RequestCredentials | (() => RequestCredentials);
  /** 请求准备函数 */
  prepareSendMessagesRequest?: (options: any) => any;
  /** 重连请求准备函数 */
  prepareReconnectToStreamRequest?: (options: any) => any;
}

// Streaming data types

/**
 * 自定义数据部分类型
 */
export interface CustomDataParts {
  /** 天气数据 */
  weather: {
    city: string;
    weather?: string;
    temperature?: number;
    status: 'loading' | 'success' | 'error';
  };
  /** 通知数据 */
  notification: {
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
    duration?: number;
  };
  /** 进度数据 */
  progress: {
    current: number;
    total: number;
    label?: string;
  };
  /** 状态数据 */
  status: {
    type: 'processing' | 'complete' | 'error' | 'cancelled';
    message: string;
    details?: any;
  };
}

/**
 * 扩展的UI消息类型，包含自定义数据部分
 */
export type CustomUIMessage = UIMessage;

/**
 * 扩展的UI消息类型 - 向后兼容
 */
export type ExtendedUIMessage = UIMessage;

// Theme and style types

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 主题模式 */
  mode: 'light' | 'dark' | 'system';
  /** 主色调 */
  primaryColor?: string;
  /** 圆角大小 */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** 字体族 */
  fontFamily?: string;
  /** 动画持续时间 */
  animationDuration?: 'fast' | 'normal' | 'slow';
}

/**
 * 样式变体
 */
export interface StyleVariants {
  /** 消息气泡变体 */
  messageBubble?: 'default' | 'minimal' | 'rounded' | 'bordered';
  /** 输入框变体 */
  inputField?: 'default' | 'filled' | 'outlined' | 'underlined';
  /** 按钮变体 */
  button?: 'default' | 'ghost' | 'outline' | 'solid';
}

// Event types

/**
 * 聊天事件类型
 */
export interface ChatEvents {
  /** 消息发送 */
  'message:sent': { message: UIMessage };
  /** 消息接收 */
  'message:received': { message: UIMessage };
  /** 工具调用 */
  'tool:called': { toolName: string; input: any };
  /** 工具结果 */
  'tool:result': { toolName: string; output: any };
  /** 错误发生 */
  'error:occurred': { error: Error };
  /** 流开始 */
  'stream:started': { timestamp: number };
  /** 流结束 */
  'stream:ended': { timestamp: number; duration: number };
}

// Export all types

export type {
  // 从ai包重新导出的类型
  UIMessage,
  DataUIPart,
  FileUIPart,
  TextUIPart,
  UIMessagePart,
  ToolResultPart
};