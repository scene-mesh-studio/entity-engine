/**
 * AI Structured Data Complete Integration
 * 
 * Core structured data functionality:
 * - generateObject: Structured object generation
 * - streamObject: Streaming structured object generation
 * 
 * Supports all output strategies: object, array, enum, no-schema
 */

import type { z } from 'zod';

import { EventEmitter } from 'events';
import {
  streamObject,
  generateObject,
  type CoreMessage,
  type FinishReason,
  type LanguageModel,
  type StreamObjectResult,
  type LanguageModelUsage,
  type GenerateObjectResult,
  type LanguageModelRequestMetadata,
  type LanguageModelResponseMetadata
} from 'ai';

// Type Definitions

/**
 * Complete generateObject options interface
 */
export interface GenerateObjectOptions<T = any> {
  // Core parameters
  model: LanguageModel;
  
  // Output strategy - supports all official strategies
  output?: 'object' | 'array' | 'enum' | 'no-schema';
  
  // Generation mode
  mode?: 'auto' | 'json' | 'tool';
  
  // Schema related - supports Zod Schema or JSON Schema
  schema?: z.ZodSchema<T> | any; // JSON Schema
  schemaName?: string;
  schemaDescription?: string;
  
  // Enum output specific
  enum?: string[];
  
  // Messages and prompts
  system?: string;
  prompt?: string | Array<any>; // SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage
  messages?: CoreMessage[];
  
  // Generation control parameters
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  seed?: number;
  
  // Retry and control
  maxRetries?: number;
  abortSignal?: AbortSignal;
  headers?: Record<string, string>;
  
  // Experimental features
  experimental_repairText?: (options: {
    text: string;
    error: any; // JSONParseError | TypeValidationError
  }) => Promise<string>;
  experimental_download?: (requestedDownloads: Array<{ url: URL; isUrlSupportedByModel: boolean }>) => Promise<Array<null | { data: Uint8Array; mediaType?: string }>>;
  experimental_telemetry?: {
    isEnabled?: boolean;
    recordInputs?: boolean;
    recordOutputs?: boolean;
    functionId?: string;
    metadata?: Record<string, string | number | boolean | Array<null | undefined | string> | Array<null | undefined | number> | Array<null | undefined | boolean>>;
  };
  
  // 提供商选项
  providerOptions?: Record<string, Record<string, any>>;
}

/**
 * streamObject 完整参数接口 - 基于 streamObject.md 规范
 */
export interface StreamObjectOptions<T = any> extends GenerateObjectOptions<T> {
  // 错误处理回调
  onError?: (event: { error: unknown }) => Promise<void> | void;
  
  // 完成回调
  onFinish?: (result: {
    usage: LanguageModelUsage;
    providerMetadata?: Record<string, Record<string, any>>;
    object?: T;
    error?: unknown;
    warnings?: Array<any>;
    response?: {
      id: string;
      model: string;
      timestamp: Date;
      headers?: Record<string, string>;
    };
  }) => void;
}

/**
 * generateObject 返回结果类型 - 基于 generateObject().md 规范
 */
export type GenerateObjectResultType<T> = {
  object: T;
  finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown';
  usage: LanguageModelUsage;
  request?: LanguageModelRequestMetadata;
  response?: LanguageModelResponseMetadata & {
    body?: unknown;
  };
  reasoning?: string;  // 官方文档明确定义的返回字段
  warnings?: Array<any>;
  providerMetadata?: any;
  toJsonResponse: (init?: any) => Response; // 官方文档要求的标准方法
};

/**
 * streamObject 返回结果类型 - 基于 streamObject.md 规范
 */
export type StreamObjectResultType<T> = {
  // Promise 属性 - 完整列表
  usage: Promise<LanguageModelUsage>;
  providerMetadata: Promise<Record<string, Record<string, any>> | undefined>;
  object: Promise<T>;
  
  // 流属性 - 完整列表
  partialObjectStream: AsyncIterable<any> & ReadableStream<any>; // DeepPartial<T>
  elementStream: AsyncIterable<T> & ReadableStream<T>; // 仅在 array 模式下可用
  textStream: AsyncIterable<string> & ReadableStream<string>;
  fullStream: AsyncIterable<any> & ReadableStream<any>; // ObjectStreamPart<T>
  
  // 元数据 - 完整列表
  request: Promise<LanguageModelRequestMetadata>;
  response: Promise<LanguageModelResponseMetadata>;
  warnings?: Array<any>;
  
  // 响应转换方法 - 完整列表
  pipeTextStreamToResponse: (response: any, init?: any) => void;
  toTextStreamResponse: (init?: any) => Response;
  
  // 遗漏的方法 - 补充
  pipeObjectStreamToResponse?: (response: any, init?: any) => void;
  toObjectStreamResponse?: (init?: any) => Response;
};

// Core Integration Class

/**
 * Complete structured data integration class
 */
export class AIStructuredDataIntegration extends EventEmitter {
  private initialized: boolean = false;
  private requestCounter: number = 0;

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
      this.emit('ai_structured:initializing');
      this.initialized = true;
      this.emit('ai_structured:initialized');
    } catch (error) {
      this.emit('ai_structured:initialization_failed', { error });
      throw error;
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `ai-structured-${Date.now()}-${++this.requestCounter}`;
  }

  // ================================
  // generateObject methods

  /**
   * Generate structured object - supports all output strategies
   */
  async generateObject<T = any>(
    options: GenerateObjectOptions<T>
  ): Promise<GenerateObjectResultType<T>> {
    if (!this.initialized) {
      throw new Error('AIStructuredDataIntegration not initialized. Call initialize() first.');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      this.emit('ai_structured:generate_object_started', {
        requestId,
        model: typeof options.model === 'string' ? options.model : 'unknown',
        output: options.output || 'object',
        hasSchema: !!options.schema,
        hasEnum: !!options.enum,
        mode: options.mode || 'auto'
      });

      // 根据输出策略构建参数
      const generateOptions: any = {
        model: options.model,
        system: options.system,
        prompt: options.prompt,
        messages: options.messages,
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
        experimental_repairText: options.experimental_repairText,
        experimental_download: options.experimental_download,
        experimental_telemetry: options.experimental_telemetry,
        providerOptions: options.providerOptions
      };

      // 处理不同的输出策略
      if (options.output) {
        generateOptions.output = options.output;
      }
      
      if (options.mode) {
        generateOptions.mode = options.mode;
      }

      // Schema 相关参数
      if (options.schema) {
        generateOptions.schema = options.schema;
      }
      
      if (options.schemaName) {
        generateOptions.schemaName = options.schemaName;
      }
      
      if (options.schemaDescription) {
        generateOptions.schemaDescription = options.schemaDescription;
      }

      // Enum 模式专用参数
      if (options.output === 'enum' && options.enum) {
        generateOptions.enum = options.enum;
      }

      const result = await generateObject(generateOptions);

      this.emit('ai_structured:generate_object_completed', {
        requestId,
        latency: Date.now() - startTime,
        finishReason: result.finishReason,
        usage: result.usage,
        output: options.output || 'object',
        hasObject: !!result.object,
        hasReasoning: !!result.reasoning,
        warnings: result.warnings?.length || 0
      });

      // 增强返回结果，确保包含所有官方规范的方法
      const enhancedResult = {
        ...result,
        // 确保 toJsonResponse 方法存在
        toJsonResponse: (init?: any) => (result as any).toJsonResponse?.(init) || 
            new Response(JSON.stringify(result.object), {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
              ...init
            })
      };

      return enhancedResult as GenerateObjectResultType<T>;

    } catch (error: any) {
      this.emit('ai_structured:generate_object_failed', {
        requestId,
        error: error.message,
        latency: Date.now() - startTime,
        errorType: error.constructor.name,
        output: options.output || 'object'
      });

      throw error;
    }
  }

  // ================================
  // streamObject methods

  /**
   * Stream structured object generation - supports all output strategies and stream modes
   */
  streamObject<T = any>(
    options: StreamObjectOptions<T>
  ): StreamObjectResultType<T> {
    if (!this.initialized) {
      throw new Error('AIStructuredDataIntegration not initialized. Call initialize() first.');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.emit('ai_structured:stream_object_started', {
      requestId,
      model: typeof options.model === 'string' ? options.model : 'unknown',
      output: options.output || 'object',
      hasSchema: !!options.schema,
      hasEnum: !!options.enum,
      mode: options.mode || 'auto'
    });

    // 包装回调以添加事件发射
    const wrappedOptions = {
      ...options,
      onError: (event: any) => {
        this.emit('ai_structured:stream_object_error', {
          requestId,
          error: event.error,
          latency: Date.now() - startTime
        });
        if (options.onError) {
          options.onError(event);
        }
      },
      onFinish: (result: any) => {
        this.emit('ai_structured:stream_object_finished', {
          requestId,
          latency: Date.now() - startTime,
          usage: result.usage,
          hasObject: !!result.object,
          hasError: !!result.error,
          warnings: result.warnings?.length || 0,
          output: options.output || 'object'
        });

        if (options.onFinish) {
          options.onFinish(result);
        }
      }
    };

    // 根据输出策略构建参数
    const streamOptions: any = {
      model: options.model,
      system: options.system,
      prompt: options.prompt,
      messages: options.messages,
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
      experimental_repairText: options.experimental_repairText,
      experimental_download: options.experimental_download,
      experimental_telemetry: options.experimental_telemetry,
      providerOptions: options.providerOptions,
      onError: wrappedOptions.onError,
      onFinish: wrappedOptions.onFinish
    };

    // 处理不同的输出策略
    if (options.output) {
      streamOptions.output = options.output;
    }
    
    if (options.mode) {
      streamOptions.mode = options.mode;
    }

    // Schema 相关参数
    if (options.schema) {
      streamOptions.schema = options.schema;
    }
    
    if (options.schemaName) {
      streamOptions.schemaName = options.schemaName;
    }
    
    if (options.schemaDescription) {
      streamOptions.schemaDescription = options.schemaDescription;
    }

    // Enum 模式专用参数
    if (options.output === 'enum' && options.enum) {
      streamOptions.enum = options.enum;
    }

    const streamResult = streamObject(streamOptions);

    // 增强 StreamResult，确保符合官方规范
    return {
      // Promise 属性
      usage: streamResult.usage,
      providerMetadata: streamResult.providerMetadata,
      object: streamResult.object as Promise<T>,

      // 流属性
      partialObjectStream: streamResult.partialObjectStream,
      elementStream: streamResult.elementStream || streamResult.partialObjectStream, // array 模式下可用
      textStream: streamResult.textStream,
      fullStream: streamResult.fullStream,

      // 元数据
      request: streamResult.request,
      response: streamResult.response,
      warnings: streamResult.warnings,

      // 响应转换方法
      pipeTextStreamToResponse: (response: any, init?: any) => {
        if ((streamResult as any).pipeTextStreamToResponse) {
          (streamResult as any).pipeTextStreamToResponse(response, init);
        } else {
          this.pipeStreamToResponse(streamResult.textStream, response, init);
        }
      },

      toTextStreamResponse: (init?: any) => (streamResult as any).toTextStreamResponse?.(init) || 
          new Response(streamResult.textStream as any, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            ...init
          }),
      
      // 补充遗漏的方法
      pipeObjectStreamToResponse: (response: any, init?: any) => {
        if ((streamResult as any).pipeObjectStreamToResponse) {
          (streamResult as any).pipeObjectStreamToResponse(response, init);
        } else {
          this.pipeStreamToResponse(streamResult.fullStream, response, init);
        }
      },
      
      toObjectStreamResponse: (init?: any) => (streamResult as any).toObjectStreamResponse?.(init) || 
          new Response(streamResult.fullStream as any, {
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            ...init
          })
    } as unknown as StreamObjectResultType<T>;
  }

  /**
   * 辅助方法：将流导入响应 - 标准实现
   */
  private pipeStreamToResponse(stream: any, response: any, options?: any): void {
    if (!stream || !response) return;
    
    // 标准流处理实现
    if (typeof response.write === 'function') {
      // Node.js Response 对象
      if (stream.pipeTo) {
        stream.pipeTo(response).catch((error: any) => {
          this.emit('ai_structured:stream_pipe_error', { error });
        });
      } else if (stream[Symbol.asyncIterator]) {
        // 异步迭代器处理
        this.consumeAsyncIterator(stream, response);
      }
    } else if (response instanceof Response) {
      // Web API Response 对象 - 创建新的可写流
      const writer = new WritableStream({
        write(chunk) {
          // 处理流式数据写入
        }
      });
      stream.pipeTo?.(writer);
    }
  }

  /**
   * 消费异步迭代器并写入响应
   */
  private async consumeAsyncIterator(stream: any, response: any): Promise<void> {
    try {
      for await (const chunk of stream) {
        if (response.write) {
          response.write(typeof chunk === 'string' ? chunk : JSON.stringify(chunk));
        }
      }
      if (response.end) {
        response.end();
      }
    } catch (error) {
      this.emit('ai_structured:async_iterator_error', { error });
    }
  }

  // Convenience methods

  /**
   * Generate object - default object output strategy
   */
  async generateObjectData<T>(
    model: LanguageModel,
    schema: z.ZodSchema<T>,
    prompt: string,
    options?: Partial<GenerateObjectOptions<T>>
  ): Promise<GenerateObjectResultType<T>> {
    return this.generateObject({
      model,
      schema,
      prompt,
      output: 'object',
      ...options
    });
  }

  /**
   * 生成数组 - array 输出策略
   */
  async generateArray<T>(
    model: LanguageModel,
    elementSchema: z.ZodSchema<T>,
    prompt: string,
    options?: Partial<GenerateObjectOptions<T>>
  ): Promise<GenerateObjectResultType<T[]>> {
    return this.generateObject({
      model,
      schema: elementSchema,
      prompt,
      output: 'array',
      ...options
    });
  }

  /**
   * 生成枚举值 - enum 输出策略
   */
  async generateEnum(
    model: LanguageModel,
    enumValues: string[],
    prompt: string,
    options?: Partial<GenerateObjectOptions<string>>
  ): Promise<GenerateObjectResultType<string>> {
    return this.generateObject({
      model,
      prompt,
      output: 'enum',
      enum: enumValues,
      ...options
    });
  }

  /**
   * 生成无模式JSON - no-schema 输出策略
   */
  async generateFreeformJSON(
    model: LanguageModel,
    prompt: string,
    options?: Partial<GenerateObjectOptions<any>>
  ): Promise<GenerateObjectResultType<any>> {
    return this.generateObject({
      model,
      prompt,
      output: 'no-schema',
      mode: 'json',
      ...options
    });
  }

  /**
   * 流式生成对象 - 默认 object 输出策略
   */
  streamObjectData<T>(
    model: LanguageModel,
    schema: z.ZodSchema<T>,
    prompt: string,
    options?: Partial<StreamObjectOptions<T>>
  ): StreamObjectResultType<T> {
    return this.streamObject({
      model,
      schema,
      prompt,
      output: 'object',
      ...options
    });
  }

  /**
   * 流式生成数组 - array 输出策略
   */
  streamArray<T>(
    model: LanguageModel,
    elementSchema: z.ZodSchema<T>,
    prompt: string,
    options?: Partial<StreamObjectOptions<T>>
  ): StreamObjectResultType<T[]> {
    return this.streamObject<T[]>({
      model,
      schema: elementSchema,
      prompt,
      output: 'array',
      ...options
    } as StreamObjectOptions<T[]>);
  }

  /**
   * 流式生成枚举值 - enum 输出策略
   */
  streamEnum(
    model: LanguageModel,
    enumValues: string[],
    prompt: string,
    options?: Partial<StreamObjectOptions<string>>
  ): StreamObjectResultType<string> {
    return this.streamObject({
      model,
      prompt,
      output: 'enum',
      enum: enumValues,
      ...options
    });
  }

  /**
   * 流式生成无模式JSON - no-schema 输出策略
   */
  streamFreeformJSON(
    model: LanguageModel,
    prompt: string,
    options?: Partial<StreamObjectOptions<any>>
  ): StreamObjectResultType<any> {
    return this.streamObject({
      model,
      prompt,
      output: 'no-schema',
      mode: 'json',
      ...options
    });
  }

  // Utility methods

  /**
   * Check initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get statistics
   */
  getStats(): {
    requestCount: number;
    isInitialized: boolean;
  } {
    return {
      requestCount: this.requestCounter,
      isInitialized: this.initialized
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
  destroy(): void {
    this.removeAllListeners();
    this.initialized = false;
    this.requestCounter = 0;
  }
}

// Exports

export {
  streamObject,
  // Core functions
  generateObject,
  type CoreMessage,
  type FinishReason,
  type LanguageModel,
  type StreamObjectResult,
  
  type LanguageModelUsage,
  // Core types
  type GenerateObjectResult
};

// Default export
export default AIStructuredDataIntegration;