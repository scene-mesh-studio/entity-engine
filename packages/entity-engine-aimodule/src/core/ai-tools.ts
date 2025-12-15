/**
 * AI Tool Calling Complete Integration
 * 
 * Complete tool calling functionality:
 * - Basic tool calling and execution
 * - Multi-step calling system (stopWhen, stepCountIs)  
 * - Dynamic tools (dynamicTool)
 * - Tool selection strategies (toolChoice)
 * - Error handling and tool repair
 * - MCP tool integration
 * - Complete type safety system
 */

import type { z } from 'zod';

import { EventEmitter } from 'events';
import {
  tool,
  type Tool,
  dynamicTool,
  stepCountIs,
  type ToolSet,
  NoSuchToolError,
  type CoreMessage,
  type FinishReason,
  type LanguageModel,
  type TypedToolCall,
  type TypedToolResult,
  type StreamTextResult,
  InvalidToolInputError,
  type LanguageModelUsage,
  type LanguageModelResponseMetadata
} from 'ai';

// Type Definitions

/**
 * Complete tool choice strategy definition
 */
export type ToolChoice<TOOLS extends ToolSet = {}> = 
  | 'auto'      // Model automatically chooses whether to call tools
  | 'required'  // Model must call tools
  | 'none'      // 模型不得调用工具
  | { type: 'tool'; toolName: Extract<keyof TOOLS, string> }; // 必须调用指定工具

/**
 * 停止条件类型 - 支持各种停止策略
 */
export type StopCondition<TOOLS extends ToolSet = {}> = 
  | ((options: { stepNumber: number; steps: Array<StepResult<TOOLS>>; }) => boolean)
  | { type: 'stepCount'; value: number }
  | { type: 'custom'; condition: (context: any) => boolean };

/**
 * 工具执行选项 - 完整参数
 */
export interface ToolExecutionOptions {
  toolCallId: string;
  messages: CoreMessage[];
  abortSignal?: AbortSignal;
  experimental_context?: unknown;
}

/**
 * 工具定义接口 - 支持所有官方功能
 */
export interface AdvancedTool<TParameters = any, TResult = any> {
  description?: string;
  inputSchema: z.ZodSchema<TParameters>;
  execute?: (
    parameters: TParameters, 
    options: ToolExecutionOptions
  ) => Promise<TResult> | TResult | AsyncIterable<TResult>;
  
  // 多模态工具结果支持
  toModelOutput?: (result: TResult) => {
    type: 'content';
    value: Array<{
      type: 'text' | 'image';
      text?: string;
      data?: string;
      mediaType?: string;
    }>;
  };
}

/**
 * 动态工具接口 - 完全匹配 AI SDK 的 dynamicTool 返回类型
 */
export type DynamicTool = ReturnType<typeof dynamicTool>;

/**
 * 步骤结果类型 - 完整步骤信息
 */
export interface StepResult<TOOLS extends ToolSet = {}> {
  stepType: 'initial' | 'continue' | 'tool-result';
  stepNumber: number;
  text: string;
  reasoning?: string;
  toolCalls: Array<TypedToolCall<TOOLS>>;
  toolResults: Array<TypedToolResult<TOOLS>>;
  finishReason: FinishReason;
  usage: LanguageModelUsage;
  warnings?: Array<any>;
  response?: LanguageModelResponseMetadata;
  isContinued: boolean;
  providerMetadata?: Record<string, Record<string, any>>;
}

/**
 * 工具调用选项 - 完整参数集合
 */
export interface ToolCallOptions<TOOLS extends ToolSet = {}> {
  // 基础参数
  model: LanguageModel;
  system?: string;
  prompt?: string;
  messages?: CoreMessage[];
  
  // 工具相关
  tools: TOOLS;
  toolChoice?: ToolChoice<TOOLS>;
  activeTools?: Array<keyof TOOLS>;
  
  // 多步调用
  stopWhen?: StopCondition<TOOLS> | Array<StopCondition<TOOLS>>;
  maxSteps?: number;
  
  // 生成控制
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  seed?: number;
  
  // 控制选项
  maxRetries?: number;
  abortSignal?: AbortSignal;
  headers?: Record<string, string>;
  
  // 实验性功能
  experimental_context?: unknown;
  experimental_telemetry?: {
    isEnabled?: boolean;
    recordInputs?: boolean;
    recordOutputs?: boolean;
    functionId?: string;
    metadata?: Record<string, any>;
  };
  experimental_repairToolCall?: (options: {
    toolCall: any;
    tools: TOOLS;
    error: NoSuchToolError | InvalidToolInputError;
    messages: CoreMessage[];
    system?: string;
    inputSchema: (options: { toolName: string }) => any;
  }) => Promise<any | null>;
  
  // 回调函数
  onStepFinish?: (result: StepResult<TOOLS>) => Promise<void> | void;
  prepareStep?: (options: {
    stepNumber: number;
    steps: Array<StepResult<TOOLS>>;
    model: LanguageModel;
    messages: CoreMessage[];
  }) => Promise<{
    model?: LanguageModel;
    toolChoice?: ToolChoice<TOOLS>;
    activeTools?: Array<keyof TOOLS>;
    system?: string;
    messages?: CoreMessage[];
  } | void> | {
    model?: LanguageModel;
    toolChoice?: ToolChoice<TOOLS>;
    activeTools?: Array<keyof TOOLS>;
    system?: string;
    messages?: CoreMessage[];
  } | void;
}

/**
 * MCP客户端配置
 */
export interface MCPClientConfig {
  transport: 
    | { type: 'sse'; url: string; headers?: Record<string, string> }
    | { type: 'stdio'; command: string; args?: string[] }
    | { type: 'custom'; transport: any }; // MCPTransport
    
  schemas?: Record<string, {
    inputSchema: z.ZodSchema<any>;
  }>;
}

/**
 * MCP客户端接口
 */
export interface MCPClient {
  tools(config?: { schemas?: Record<string, { inputSchema: z.ZodSchema<any> }> }): Promise<ToolSet>;
  close(): Promise<void>;
}

// Core Tools Integration Class

/**
 * Complete tools integration class
 */
export class AIToolsIntegration extends EventEmitter {
  private initialized: boolean = false;
  private requestCounter: number = 0;
  private registeredTools: Map<string, AdvancedTool> = new Map();
  private dynamicTools: Map<string, DynamicTool> = new Map();
  private mcpClients: Map<string, MCPClient> = new Map();

  constructor() {
    super();
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.emit('ai_tools:initializing');
      this.initialized = true;
      this.emit('ai_tools:initialized');
    } catch (error) {
      this.emit('ai_tools:initialization_failed', { error });
      throw error;
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `ai-tools-${Date.now()}-${++this.requestCounter}`;
  }

  // Tool Management

  /**
   * Create tool - following official specifications
   */
  createTool(
    description: string,
    inputSchema: z.ZodSchema<any>,
    execute?: (parameters: any, options?: any) => Promise<any> | any
  ): any {
    if (execute) {
      return tool({
        description,
        inputSchema,
        execute: async (params: any) => execute(params, {
            // 传递标准的AI SDK执行选项
            toolCallId: 'tool-call-' + Date.now(),
            messages: [],
            abortSignal: undefined,
            experimental_context: undefined
          })
      });
    } else {
      return tool({
        description,
        inputSchema
      });
    }
  }

  /**
   * 创建动态工具 - 完全基于 AI SDK 的 dynamicTool
   */
  createDynamicTool(
    description: string,
    inputSchema: z.ZodSchema<any>,
    execute?: (input: unknown, options: ToolExecutionOptions) => Promise<unknown>
  ): DynamicTool {
    // 完全基于 AI SDK 的 dynamicTool，返回类型完全匹配
    return dynamicTool({
      description,
      inputSchema,
      execute: execute ? async (input: unknown, options: any) => {
        const toolOptions: ToolExecutionOptions = {
          toolCallId: options.toolCallId || 'unknown',
          messages: options.messages || [],
          abortSignal: options.abortSignal,
          experimental_context: options.experimental_context
        };
        return execute(input, toolOptions);
      } : async (input: unknown, options: any) => 
        // 默认实现：返回输入参数
         input
      
    });
  }

  /**
   * 注册工具到集成器
   */
  registerTool<TParameters, TResult>(
    name: string,
    toolInstance: AdvancedTool<TParameters, TResult>
  ): void {
    this.registeredTools.set(name, toolInstance);
    this.emit('ai_tools:tool_registered', { name, tool: toolInstance });
  }

  /**
   * 获取已注册的工具
   */
  getRegisteredTools(): Record<string, AdvancedTool> {
    const tools: Record<string, AdvancedTool> = {};
    this.registeredTools.forEach((registeredTool, name) => {
      tools[name] = registeredTool;
    });
    return tools;
  }

  /**
   * 注册动态工具
   */
  registerDynamicTool(name: string, dynamicToolInstance: DynamicTool): void {
    this.dynamicTools.set(name, dynamicToolInstance);
    this.emit('ai_tools:dynamic_tool_registered', { name, tool: dynamicToolInstance });
  }

  // ================================
  // 🔄 多步调用系统 - 按照官方文档规范实现
  // ================================

  /**
   * 使用工具执行文本生成 - 遵循官方 generateText + tools 模式
   * 这是 AI SDK 工具调用的标准方式
   */
  async generateTextWithTools<TOOLS extends ToolSet = {}>(
    options: ToolCallOptions<TOOLS>
  ): Promise<{
    text: string;
    steps: Array<StepResult<TOOLS>>;
    toolCalls: Array<TypedToolCall<TOOLS>>;
    toolResults: Array<TypedToolResult<TOOLS>>;
    finishReason: FinishReason;
    usage: LanguageModelUsage;
    totalUsage: LanguageModelUsage;
    content: Array<any>;
    reasoning?: Array<any>;
    reasoningText?: string;
    sources?: Array<any>;
    files?: Array<any>;
    warnings?: Array<any>;
    response?: any;
    providerMetadata?: any;
  }> {
    const { generateText } = await import('ai');
    
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    try {
      this.emit('ai_tools:multi_step_started', {
        requestId,
        model: typeof options.model === 'string' ? options.model : 'unknown',
        hasTools: !!options.tools,
        stopWhen: !!options.stopWhen,
        maxSteps: options.maxSteps || 5
      });

      // 构建参数
      const generateOptions: any = {
        model: options.model,
        system: options.system,
        prompt: options.prompt,
        messages: options.messages,
        tools: options.tools,
        toolChoice: options.toolChoice,
        activeTools: options.activeTools,
        maxOutputTokens: options.maxOutputTokens,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
        presencePenalty: options.presencePenalty,
        frequencyPenalty: options.frequencyPenalty,
        seed: options.seed,
        maxRetries: options.maxRetries,
        abortSignal: options.abortSignal,
        headers: options.headers,
        experimental_context: options.experimental_context,
        experimental_telemetry: options.experimental_telemetry,
        experimental_repairToolCall: options.experimental_repairToolCall,
        onStepFinish: options.onStepFinish,
        prepareStep: options.prepareStep
      };

      // 处理停止条件
      if (options.stopWhen) {
        generateOptions.stopWhen = Array.isArray(options.stopWhen) 
          ? options.stopWhen.map(cond => this.parseStopCondition(cond))
          : this.parseStopCondition(options.stopWhen);
      } else if (options.maxSteps) {
        generateOptions.stopWhen = stepCountIs(options.maxSteps);
      }

      const result = await generateText(generateOptions);

      this.emit('ai_tools:multi_step_completed', {
        requestId,
        latency: Date.now() - startTime,
        steps: result.steps?.length || 1,
        toolCalls: result.toolCalls?.length || 0,
        toolResults: result.toolResults?.length || 0,
        finishReason: result.finishReason,
        usage: result.usage
      });

      // 返回完整的 generateText 结果，符合官方规范
      return {
        text: result.text,
        steps: (result.steps || []) as unknown as Array<StepResult<TOOLS>>,
        toolCalls: result.toolCalls || [],
        toolResults: result.toolResults || [],
        finishReason: result.finishReason,
        usage: result.usage,
        totalUsage: result.totalUsage || result.usage,
        content: (result as any).content || [],
        reasoning: (result as any).reasoning || [],
        reasoningText: (result as any).reasoningText,
        sources: (result as any).sources || [],
        files: (result as any).files || [],
        warnings: result.warnings,
        response: (result as any).response,
        providerMetadata: (result as any).providerMetadata
      };

    } catch (error: any) {
      this.emit('ai_tools:generate_text_with_tools_failed', {
        requestId,
        error: error.message,
        latency: Date.now() - startTime,
        errorType: error.constructor.name
      });

      throw error;
    }
  }

  /**
   * 使用工具执行流式文本生成 - 遵循官方 streamText + tools 模式
   */
  async streamTextWithTools<TOOLS extends ToolSet = {}>(
    options: ToolCallOptions<TOOLS>
  ): Promise<StreamTextResult<TOOLS, any>> {
    const { streamText } = await import('ai');
    
    const requestId = this.generateRequestId();
    
    this.emit('ai_tools:multi_step_stream_started', {
      requestId,
      model: typeof options.model === 'string' ? options.model : 'unknown',
      hasTools: !!options.tools,
      stopWhen: !!options.stopWhen
    });

    // 包装回调
    const wrappedOptions = {
      ...options,
      onStepFinish: (result: any) => {
        this.emit('ai_tools:step_finished', {
          requestId,
          stepType: result.stepType,
          stepNumber: result.stepNumber || 0,
          toolCalls: result.toolCalls?.length || 0,
          toolResults: result.toolResults?.length || 0,
          finishReason: result.finishReason
        });
        if (options.onStepFinish) {
          options.onStepFinish(result);
        }
      }
    };

    // 构建参数并处理停止条件
    const streamOptions: any = { ...wrappedOptions };
    if (options.stopWhen) {
      streamOptions.stopWhen = Array.isArray(options.stopWhen) 
        ? options.stopWhen.map(cond => this.parseStopCondition(cond))
        : this.parseStopCondition(options.stopWhen);
    }

    const streamResult = streamText(streamOptions);
    
    // 增强流式结果，添加工具调用相关的便利方法
    const enhancedStreamResult = {
      ...streamResult,
      
      // 工具调用分析方法
      analyzeToolUsage: async () => {
        const steps = await streamResult.steps;
        return this.analyzeToolUsage(steps as unknown as Array<StepResult<TOOLS>>);
      },
      
      // 提取所有工具调用
      getAllToolCalls: async () => {
        const steps = await streamResult.steps;
        return this.extractToolCallsFromSteps(steps as unknown as Array<StepResult<TOOLS>>);
      },
      
      // 提取所有工具结果
      getAllToolResults: async () => {
        const steps = await streamResult.steps;
        return this.extractToolResultsFromSteps(steps as unknown as Array<StepResult<TOOLS>>);
      },
      
      // 获取响应消息 - 官方文档重点功能
      getResponseMessages: async () => {
        const response = await streamResult.response;
        return this.extractResponseMessages({ response });
      }
    } as any;
    
    return enhancedStreamResult;
  }

  /**
   * 创建步骤计数停止条件
   */
  createStepCountCondition(maxSteps: number): StopCondition<any> {
    return { type: 'stepCount', value: maxSteps };
  }

  /**
   * 创建自定义停止条件  
   */
  createCustomStopCondition<TOOLS extends ToolSet = {}>(
    condition: (options: { stepNumber: number; steps: Array<StepResult<TOOLS>>; }) => boolean
  ): StopCondition<TOOLS> {
    return condition;
  }

  /**
   * 解析停止条件
   */
  private parseStopCondition<TOOLS extends ToolSet = {}>(
    condition: StopCondition<TOOLS>
  ): any {
    if (typeof condition === 'function') {
      return condition;
    }
    
    if (condition.type === 'stepCount') {
      return stepCountIs(condition.value);
    }
    
    if (condition.type === 'custom') {
      return condition.condition;
    }
    
    return stepCountIs(5); // 默认最多5步
  }

  // ================================
  // Tool repair system
  // ================================

  /**
   * 创建结构化输出修复器
   */
  createStructuredRepairFunction<TOOLS extends ToolSet = {}>(
    repairModel: LanguageModel
  ) {
    return async (options: {
      toolCall: any;
      tools: TOOLS;
      error: NoSuchToolError | InvalidToolInputError;
      inputSchema: (options: { toolName: string }) => any;
    }) => {
      if (NoSuchToolError.isInstance(options.error)) {
        return null; // 不修复无效工具名称
      }

      try {
        // 使用结构化输出来修复工具参数
        const { generateObject } = await import('ai');
        
        const toolDef = (options.tools as any)[options.toolCall.toolName];
        if (!toolDef) return null;

        const { object: repairedArgs } = await generateObject({
          model: repairModel,
          schema: toolDef.parameters || toolDef.schema,
          prompt: [
            `The model tried to call the tool "${options.toolCall.toolName}" with the following inputs:`,
            JSON.stringify(options.toolCall.input),
            `The tool accepts the following schema:`,
            JSON.stringify(options.inputSchema(options.toolCall)),
            'Please fix the inputs to match the schema.'
          ].join('\n'),
        });

        return { 
          ...options.toolCall, 
          input: JSON.stringify(repairedArgs) 
        };
      } catch (repairError) {
        this.emit('ai_tools:repair_failed', { 
          originalError: options.error, 
          repairError,
          toolCall: options.toolCall 
        });
        return null;
      }
    };
  }

  /**
   * 创建重新询问修复器
   */
  createReaskRepairFunction<TOOLS extends ToolSet = {}>(
    repairModel: LanguageModel
  ) {
    return async (options: {
      toolCall: any;
      tools: TOOLS;
      error: NoSuchToolError | InvalidToolInputError;
      messages: CoreMessage[];
      system?: string;
    }) => {
      try {
        const { generateText } = await import('ai');
        
        const result = await generateText({
          model: repairModel,
          system: options.system,
          messages: [
            ...options.messages,
            {
              role: 'assistant',
              content: [{
                type: 'tool-call',
                toolCallId: options.toolCall.toolCallId,
                toolName: options.toolCall.toolName,
                input: options.toolCall.input,
              }],
            },
            {
              role: 'tool',
              content: [{
                type: 'tool-result',
                toolCallId: options.toolCall.toolCallId,
                toolName: options.toolCall.toolName,
                output: options.error.message,
              }],
            },
          ] as CoreMessage[],
          tools: options.tools,
        });

        const newToolCall = result.toolCalls.find(
          (newCall: any) => newCall.toolName === options.toolCall.toolName,
        );

        return newToolCall ? {
          toolCallType: 'function' as const,
          toolCallId: options.toolCall.toolCallId,
          toolName: options.toolCall.toolName,
          input: JSON.stringify(newToolCall.input),
        } : null;
      } catch (repairError) {
        this.emit('ai_tools:reask_repair_failed', { 
          originalError: options.error, 
          repairError,
          toolCall: options.toolCall 
        });
        return null;
      }
    };
  }

  // ================================
  // 🔗 MCP集成系统
  // ================================

  /**
   * 创建MCP客户端
   */
  async createMCPClient(config: MCPClientConfig): Promise<MCPClient> {
    const dynamicImport = async (moduleId: string): Promise<any> => {
      const importer = new Function('moduleId', 'return import(moduleId)') as (moduleId: string) => Promise<any>;
      return importer(moduleId);
    };

    let experimental_createMCPClient: any;

    // ai@5 has moved MCP helpers into @ai-sdk/mcp. Keep this runtime-resolved to avoid hard dependency.
    try {
      ({ experimental_createMCPClient } = await dynamicImport('@ai-sdk/mcp'));
    } catch {
      // Back-compat: older versions may still export from 'ai'
      try {
        const aiMod = (await import('ai')) as any;
        experimental_createMCPClient = aiMod.experimental_createMCPClient;
      } catch {
        // ignore
      }
    }

    if (typeof experimental_createMCPClient !== 'function') {
      throw new Error('MCP client requires @ai-sdk/mcp (or a compatible AI SDK version). Please install @ai-sdk/mcp to use MCP features.');
    }
    
    let transportConfig: any;
    
    switch (config.transport.type) {
      case 'sse':
        transportConfig = {
          transport: {
            type: 'sse',
            url: config.transport.url,
            headers: config.transport.headers,
          }
        };
        break;
        
      case 'stdio':
        // Conditionally import stdio transport only in Node.js environment
        if (typeof window === 'undefined' && typeof process !== 'undefined') {
          try {
            let Experimental_StdioMCPTransport: any;
            try {
              ({ Experimental_StdioMCPTransport } = await dynamicImport('@ai-sdk/mcp/mcp-stdio'));
            } catch {
              // Back-compat: older versions may have exposed this path under ai
              ({ Experimental_StdioMCPTransport } = await dynamicImport('ai/mcp-stdio'));
            }
            transportConfig = {
              transport: new Experimental_StdioMCPTransport({
                command: config.transport.command,
                args: config.transport.args,
              })
            };
          } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new Error(`stdio transport requires Node.js environment and an MCP stdio transport implementation. Install @ai-sdk/mcp and try again. Original error: ${detail}`);
          }
        } else {
          throw new Error('stdio transport is only available in Node.js environment');
        }
        break;
        
      case 'custom':
        transportConfig = {
          transport: config.transport.transport
        };
        break;
        
      default:
        throw new Error(`Unsupported MCP transport type: ${(config.transport as any).type}`);
    }

    const mcpClient = await experimental_createMCPClient(transportConfig);
    
    const clientId = `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const wrappedClient: MCPClient = {
      async tools(toolConfig?: { schemas?: Record<string, { inputSchema: z.ZodSchema<any> }> }) {
        if (config.schemas || toolConfig?.schemas) {
          return (mcpClient as any).tools({ schemas: config.schemas || toolConfig?.schemas });
        } else {
          return (mcpClient as any).tools();
        }
      },
      
      async close() {
        await (mcpClient as any).close();
        (this as any).mcpClients.delete(clientId);
        (this as any).emit('ai_tools:mcp_client_closed', { clientId });
      }
    };
    
    this.mcpClients.set(clientId, wrappedClient);
    this.emit('ai_tools:mcp_client_created', { clientId, config });
    
    return wrappedClient;
  }

  /**
   * 关闭所有MCP客户端
   */
  async closeAllMCPClients(): Promise<void> {
    const closePromises = Array.from(this.mcpClients.values()).map(client => client.close());
    await Promise.all(closePromises);
    this.mcpClients.clear();
  }

  // Utility methods

  /**
   * Create simple tool call configuration
   */
  createSimpleToolCall<TOOLS extends ToolSet = {}>(
    model: LanguageModel,
    tools: TOOLS,
    prompt: string,
    options?: Partial<ToolCallOptions<TOOLS>>
  ): ToolCallOptions<TOOLS> {
    return {
      model,
      tools,
      prompt,
      ...options
    };
  }

  /**
   * 创建多步工具调用配置 - 使用 stopWhen 参数
   */
  createMultiStepToolCall<TOOLS extends ToolSet = {}>(
    model: LanguageModel,
    tools: TOOLS,
    prompt: string,
    maxSteps: number = 5,
    options?: Partial<ToolCallOptions<TOOLS>>
  ): ToolCallOptions<TOOLS> {
    return {
      model,
      tools,
      prompt,
      stopWhen: this.createStepCountCondition(maxSteps),
      ...options
    };
  }

  /**
   * 直接执行单个工具 - 用于测试或直接调用
   */
  async executeSingleTool<TOOLS extends ToolSet = {}>(
    toolName: keyof TOOLS,
    input: any,
    tools: TOOLS,
    options?: {
      messages?: CoreMessage[];
      abortSignal?: AbortSignal;
      experimental_context?: unknown;
    }
  ): Promise<any> {
    const selectedTool = tools[toolName] as any;
    if (!selectedTool || !selectedTool.execute) {
      throw new Error(`Tool '${String(toolName)}' not found or not executable`);
    }

    const toolOptions: ToolExecutionOptions = {
      toolCallId: `direct-${Date.now()}`,
      messages: options?.messages || [],
      abortSignal: options?.abortSignal,
      experimental_context: options?.experimental_context
    };

    return selectedTool.execute(input, toolOptions);
  }

  /**
   * 获取响应消息 - 官方文档重点推荐的功能
   * 用于将助手和工具消息添加到对话历史
   */
  extractResponseMessages(result: {
    response?: { messages: Array<any> };
  }): Array<any> {
    return result.response?.messages || [];
  }

  /**
   * 将响应消息添加到对话历史 - 官方文档示例
   */
  addResponseMessagesToHistory(
    messages: Array<any>,
    result: {
      response?: { messages: Array<any> };
    }
  ): Array<any> {
    const responseMessages = this.extractResponseMessages(result);
    return [...messages, ...responseMessages];
  }

  /**
   * 批量工具调用验证
   */
  validateBatchToolCalls<TOOLS extends ToolSet = {}>(
    toolCalls: Array<TypedToolCall<TOOLS>>,
    tools: TOOLS
  ): Array<{ toolCall: TypedToolCall<TOOLS>; valid: boolean; error?: string }> {
    return toolCalls.map(toolCall => ({
      toolCall,
      ...this.validateToolCall(toolCall, tools)
    }));
  }

  /**
   * 工具调用结果验证
   */
  validateToolCall<TOOLS extends ToolSet = {}>(
    toolCall: TypedToolCall<TOOLS>,
    tools: TOOLS
  ): { valid: boolean; error?: string } {
    const toolName = toolCall.toolName;
    const targetTool = tools[toolName];
    
    if (!targetTool) {
      return { valid: false, error: `Tool '${String(toolName)}' not found` };
    }

    try {
      // 验证输入参数
      if ((targetTool as any).inputSchema || (targetTool as any).parameters) {
        const schema = (targetTool as any).inputSchema || (targetTool as any).parameters;
        schema.parse(toolCall.input);
      }
      
      return { valid: true };
    } catch (validationError: any) {
      return { 
        valid: false, 
        error: `Invalid tool input: ${validationError.message}` 
      };
    }
  }

  /**
   * 工具调用统计分析
   */
  analyzeToolUsage<TOOLS extends ToolSet = {}>(
    steps: Array<StepResult<TOOLS>>
  ): {
    totalToolCalls: number;
    totalToolResults: number;
    toolUsageByName: Record<string, number>;
    avgToolCallsPerStep: number;
    stepTypes: Record<string, number>;
  } {
    const allToolCalls = this.extractToolCallsFromSteps(steps);
    const allToolResults = this.extractToolResultsFromSteps(steps);
    
    const toolUsageByName: Record<string, number> = {};
    allToolCalls.forEach(call => {
      const toolName = String(call.toolName);
      toolUsageByName[toolName] = (toolUsageByName[toolName] || 0) + 1;
    });

    const stepTypes: Record<string, number> = {};
    steps.forEach(step => {
      stepTypes[step.stepType] = (stepTypes[step.stepType] || 0) + 1;
    });

    return {
      totalToolCalls: allToolCalls.length,
      totalToolResults: allToolResults.length,
      toolUsageByName,
      avgToolCallsPerStep: steps.length > 0 ? allToolCalls.length / steps.length : 0,
      stepTypes
    };
  }

  /**
   * 提取步骤中的所有工具调用
   */
  extractToolCallsFromSteps<TOOLS extends ToolSet = {}>(
    steps: Array<StepResult<TOOLS>>
  ): Array<TypedToolCall<TOOLS>> {
    return steps.flatMap(step => step.toolCalls);
  }

  /**
   * 提取步骤中的所有工具结果
   */
  extractToolResultsFromSteps<TOOLS extends ToolSet = {}>(
    steps: Array<StepResult<TOOLS>>
  ): Array<TypedToolResult<TOOLS>> {
    return steps.flatMap(step => step.toolResults);
  }

  /**
   * 检查初始化状态
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    requestCount: number;
    isInitialized: boolean;
    registeredTools: number;
    dynamicTools: number;
    mcpClients: number;
  } {
    return {
      requestCount: this.requestCounter,
      isInitialized: this.initialized,
      registeredTools: this.registeredTools.size,
      dynamicTools: this.dynamicTools.size,
      mcpClients: this.mcpClients.size,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.requestCounter = 0;
  }

  /**
   * 销毁实例
   */
  async destroy(): Promise<void> {
    await this.closeAllMCPClients();
    this.registeredTools.clear();
    this.dynamicTools.clear();
    this.removeAllListeners();
    this.initialized = false;
    this.requestCounter = 0;
  }
}

// Exports

export {
  // Core functions
  tool,
  // Core types
  type Tool,
  dynamicTool,
  stepCountIs,
  type ToolSet,
  NoSuchToolError,
  type CoreMessage,
  type FinishReason,
  
  type TypedToolCall,
  type LanguageModel,
  type TypedToolResult,
  InvalidToolInputError,
  type LanguageModelUsage
};

// Default export
export default AIToolsIntegration;