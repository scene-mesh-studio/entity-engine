/**
 * Complete AI Integration
 * 
 * Core AI functionality implementation:
 * - generateText: Text generation
 * - streamText: Streaming text generation  
 * - generateObject: Structured object generation
 */

import type { z } from 'zod';

import { EventEmitter } from 'events';
import {
  tool,
  type Tool,
  streamText,
  generateText,
  streamObject,
  smoothStream,
  type ToolSet,
  generateObject,
  type CoreMessage,
  type FinishReason,
  type LanguageModel,
  type TextStreamPart,
  type StreamTextResult,
  type GenerateTextResult,
  type StreamObjectResult,
  type LanguageModelUsage,
  type GenerateObjectResult,
  type LanguageModelRequestMetadata,
  type LanguageModelResponseMetadata
} from 'ai';

// Type Definitions

/**
 * Complete generateText options interface
 */
export interface GenerateTextOptions<TOOLS extends ToolSet = {}> {
  // Core parameters
  model: LanguageModel;
  system?: string;
  prompt?: string | Array<any>; // Supports SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage
  messages?: CoreMessage[];
  
  // Tool calling parameters
  tools?: TOOLS;
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'tool'; toolName: string };
  activeTools?: Array<keyof TOOLS>;
  
  // Generation control parameters
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  seed?: number;
  
  // Flow control parameters
  maxRetries?: number;
  stopWhen?: any; // StopCondition<TOOLS> | Array<StopCondition<TOOLS>>
  prepareStep?: (options: {
    steps: Array<any>; // Array<StepResult<TOOLS>>
    stepNumber: number;
    model: LanguageModel;
    messages: Array<any>; // Array<ModelMessage>
  }) => any | Promise<any>; // PrepareStepResult<TOOLS>
  
  // Network and control
  abortSignal?: AbortSignal;
  headers?: Record<string, string>;
  
  // Experimental features
  experimental_telemetry?: {
    isEnabled?: boolean;
    recordInputs?: boolean;
    recordOutputs?: boolean;
    functionId?: string;
    metadata?: Record<string, string | number | boolean | Array<null | undefined | string> | Array<null | undefined | number> | Array<null | undefined | boolean>>;
  };
  experimental_context?: unknown;
  experimental_download?: (requestedDownloads: Array<{ url: URL; isUrlSupportedByModel: boolean }>) => Promise<Array<null | { data: Uint8Array; mediaType?: string }>>;
  experimental_repairToolCall?: (options: {
    system?: string;
    messages: Array<any>; // ModelMessage[]
    toolCall: any; // LanguageModelV2ToolCall
    tools: TOOLS;
    parameterSchema: (options: { toolName: string }) => any; // JSONSchema7
    error: any; // NoSuchToolError | InvalidToolInputError
  }) => Promise<any | null>; // LanguageModelV2ToolCall | null
  experimental_output?: {
    format: 'text' | 'object';
    schema?: any;
  };
  
  // Provider options
  providerOptions?: Record<string, Record<string, any>>;
  
  // Callback functions
  onStepFinish?: (result: {
    finishReason: FinishReason;
    usage: LanguageModelUsage;
    text: string;
    toolCalls: Array<any>;
    toolResults: Array<any>;
    warnings?: Array<any>;
    response?: {
      id: string;
      model: string;
      timestamp: Date;
      headers?: Record<string, string>;
      body?: unknown;
    };
    isContinued: boolean;
    providerMetadata?: Record<string, Record<string, any>>;
  }) => Promise<void> | void;
}

/**
 * Complete streamText options interface
 */
export interface StreamTextOptions<TOOLS extends ToolSet = {}> 
  extends Omit<GenerateTextOptions<TOOLS>, 'onStepFinish'> {
  
  // Stream-specific parameters
  experimental_generateMessageId?: () => string;
  experimental_transform?: any | any[]; // StreamTextTransform | Array<StreamTextTransform>
  includeRawChunks?: boolean;
  
  // Stream callback functions
  onChunk?: (event: { chunk: TextStreamPart<TOOLS> }) => Promise<void> | void;
  onError?: (event: { error: unknown }) => Promise<void> | void;
  onStepFinish?: (result: {
    stepType: 'initial' | 'continue' | 'tool-result';
    finishReason: FinishReason;
    usage: LanguageModelUsage;
    text: string;
    reasoning?: string;
    sources: Array<{
      sourceType: 'url';
      id: string;
      url: string;
      title?: string;
      providerMetadata?: any;
    }>;
    files: Array<{
      base64: string;
      uint8Array: Uint8Array;
      mediaType: string;
    }>;
    toolCalls: Array<any>;
    toolResults: Array<any>;
    warnings?: Array<any>;
    response?: {
      id: string;
      model: string;
      timestamp: Date;
      headers?: Record<string, string>;
      messages: Array<any>; // Array<ResponseMessage>
    };
    isContinued: boolean;
    providerMetadata?: Record<string, Record<string, any>>;
  }) => Promise<void> | void;
  onFinish?: (result: {
    finishReason: FinishReason;
    usage: LanguageModelUsage;
    totalUsage: LanguageModelUsage;
    providerMetadata?: Record<string, Record<string, any>>;
    text: string;
    reasoning?: string;
    reasoningDetails: Array<{
      type: 'text' | 'redacted';
      text?: string;
      signature?: string;
      data?: string;
    }>;
    sources: Array<{
      sourceType: 'url';
      id: string;
      url: string;
      title?: string;
      providerMetadata?: any;
    }>;
    files: Array<{
      base64: string;
      uint8Array: Uint8Array;
      mediaType: string;
    }>;
    toolCalls: Array<any>;
    toolResults: Array<any>;
    warnings?: Array<any>;
    response?: {
      id: string;
      model: string;
      timestamp: Date;
      headers?: Record<string, string>;
      messages: Array<any>; // Array<ResponseMessage>
    };
    steps: Array<any>; // Array<StepResult>
  }) => Promise<void> | void;
  onAbort?: (event: { steps: Array<any> }) => Promise<void> | void;
}

/**
 * Result types
 */
export type GenerateResult<TOOLS extends ToolSet = {}> = GenerateTextResult<TOOLS, any> & {
  // All return value properties
  content: Array<any>; // ContentPart<TOOLS>
  text: string;
  reasoning: Array<any>; // ReasoningPart
  reasoningText: string | undefined;
  sources: Array<any>; // Source
  files: Array<any>; // GeneratedFile
  toolCalls: Array<any>; // ToolCallArray<TOOLS>
  toolResults: Array<any>; // ToolResultArray<TOOLS>
  finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown';
  usage: LanguageModelUsage;
  totalUsage: LanguageModelUsage;
  request?: LanguageModelRequestMetadata;
  response?: LanguageModelResponseMetadata;
  warnings?: Array<any>;
  providerMetadata?: any;
  experimental_output?: any;
  steps: Array<any>; // StepResult<TOOLS>
};
export type StreamResult<TOOLS extends ToolSet = {}> = StreamTextResult<TOOLS, any> & {
  // All Promise properties for streaming
  content: Promise<Array<any>>; // ContentPart<TOOLS>
  finishReason: Promise<'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'>;
  usage: Promise<LanguageModelUsage>;
  totalUsage: Promise<LanguageModelUsage>;
  providerMetadata: Promise<any>;
  text: Promise<string>;
  reasoning: Promise<Array<any>>; // ReasoningPart
  reasoningText: Promise<string | undefined>;
  sources: Promise<Array<any>>; // Source
  files: Promise<Array<any>>; // GeneratedFile
  toolCalls: Promise<Array<any>>; // TypedToolCall<TOOLS>
  toolResults: Promise<Array<any>>; // TypedToolResult<TOOLS>
  request: Promise<LanguageModelRequestMetadata>;
  response: Promise<LanguageModelResponseMetadata & { messages: Array<any> }>;
  warnings: Promise<Array<any> | undefined>;
  steps: Promise<Array<any>>; // StepResult
  
  // Stream properties
  textStream: AsyncIterable<string> & ReadableStream<string>;
  fullStream: AsyncIterable<any> & ReadableStream<any>; // TextStreamPart<TOOLS>
};

// Core Integration Class

/**
 * Complete AI integration class
 */
export class AISDKIntegration extends EventEmitter {
  private initialized: boolean = false;
  private requestCounter: number = 0;

  constructor() {
    super();
  }

  /**
   * Initialize the AI integration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.emit('ai_sdk:initializing');
      this.initialized = true;
      this.emit('ai_sdk:initialized');
    } catch (error) {
      this.emit('ai_sdk:initialization_failed', { error });
      throw error;
    }
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `ai-sdk-${Date.now()}-${++this.requestCounter}`;
  }

  // generateText methods

  /**
   * Text generation
   */
  async generateText<TOOLS extends ToolSet = {}>(
    options: GenerateTextOptions<TOOLS>
  ): Promise<GenerateResult<TOOLS>> {
    if (!this.initialized) {
      throw new Error('AISDKIntegration not initialized. Call initialize() first.');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      this.emit('ai_sdk:generate_started', {
        requestId,
        model: typeof options.model === 'string' ? options.model : 'unknown',
        hasTools: !!options.tools,
        hasMessages: !!options.messages?.length,
        hasSystem: !!options.system,
        hasPrompt: !!options.prompt
      });

      const result = await generateText(options as any);

      this.emit('ai_sdk:generate_completed', {
        requestId,
        latency: Date.now() - startTime,
        finishReason: result.finishReason,
        usage: result.usage,
        totalUsage: result.totalUsage,
        toolCalls: result.toolCalls?.length || 0,
        toolResults: result.toolResults?.length || 0,
        steps: result.steps?.length || 1,
        textLength: result.text?.length || 0,
        hasReasoning: !!result.reasoning?.length,
        hasFiles: !!result.files?.length,
        hasSources: !!result.sources?.length,
        warnings: result.warnings?.length || 0
      });

      return result as unknown as GenerateResult<TOOLS>;

    } catch (error: any) {
      this.emit('ai_sdk:generate_failed', {
        requestId,
        error: error.message,
        latency: Date.now() - startTime,
        errorType: error.constructor.name
      });

      throw error;
    }
  }

  // streamText methods

  /**
   * Streaming text generation
   */
  streamText<TOOLS extends ToolSet = {}>(
    options: StreamTextOptions<TOOLS>
  ): StreamTextResult<TOOLS, any> {
    if (!this.initialized) {
      throw new Error('AISDKIntegration not initialized. Call initialize() first.');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.emit('ai_sdk:stream_started', {
      requestId,
      model: typeof options.model === 'string' ? options.model : 'unknown',
      hasTools: !!options.tools,
      hasMessages: !!options.messages?.length,
      hasSystem: !!options.system,
      hasPrompt: !!options.prompt,
      hasTransform: !!options.experimental_transform
    });

    // Wrap callbacks to add event emission
    const wrappedOptions = {
      ...options,
      onError: (event: any) => {
        this.emit('ai_sdk:stream_error', {
          requestId,
          error: event.error,
          latency: Date.now() - startTime
        });
        if (options.onError) {
          options.onError(event);
        }
      },
      onFinish: async (result: any) => {
        this.emit('ai_sdk:stream_finished', {
          requestId,
          latency: Date.now() - startTime,
          finishReason: result.finishReason,
          usage: result.usage,
          totalUsage: result.totalUsage,
          toolCalls: result.toolCalls?.length || 0,
          toolResults: result.toolResults?.length || 0,
          steps: result.steps?.length || 1,
          textLength: result.text?.length || 0,
          hasReasoning: !!result.reasoning?.length,
          hasFiles: !!result.files?.length,
          hasSources: !!result.sources?.length,
          warnings: result.warnings?.length || 0
        });

        if (options.onFinish) {
          await options.onFinish(result);
        }
      },
      onAbort: (event: any) => {
        this.emit('ai_sdk:stream_aborted', {
          requestId,
          latency: Date.now() - startTime,
          steps: event.steps?.length || 0
        });
        if (options.onAbort) {
          options.onAbort(event);
        }
      }
    };

    // Return native results directly
    return streamText(wrappedOptions as any);
  }

  // generateObject & streamObject methods

  /**
   * Generate structured object
   */
  async generateObject<SCHEMA>(
    options: {
      model: LanguageModel;
      output?: 'object' | 'array' | 'enum' | 'no-schema';
      mode?: 'auto' | 'json' | 'tool';
      schema?: SCHEMA;
      schemaName?: string;
      schemaDescription?: string;
      enum?: string[];
      system?: string;
      prompt?: string;
      messages?: CoreMessage[];
      maxOutputTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      seed?: number;
      maxRetries?: number;
      abortSignal?: AbortSignal;
      headers?: Record<string, string>;
      experimental_repairText?: (options: { text: string; error: any; }) => Promise<string>;
      experimental_download?: (requestedDownloads: Array<{ url: URL; isUrlSupportedByModel: boolean }>) => Promise<Array<null | { data: Uint8Array; mediaType?: string }>>;
      experimental_telemetry?: {
        isEnabled?: boolean;
        recordInputs?: boolean;
        recordOutputs?: boolean;
        functionId?: string;
        metadata?: Record<string, any>;
      };
      providerOptions?: Record<string, Record<string, any>>;
    }
  ): Promise<GenerateObjectResult<SCHEMA>> {
    if (!this.initialized) {
      throw new Error('AISDKIntegration not initialized. Call initialize() first.');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      this.emit('ai_sdk:generate_object_started', {
        requestId,
        model: typeof options.model === 'string' ? options.model : 'unknown',
        output: options.output || 'object',
        mode: options.mode || 'auto',
        hasSchema: !!options.schema,
        hasEnum: !!options.enum
      });

      const result = await generateObject(options as any);

      this.emit('ai_sdk:generate_object_completed', {
        requestId,
        latency: Date.now() - startTime,
        finishReason: result.finishReason,
        usage: result.usage,
        hasReasoning: !!result.reasoning,
        warnings: result.warnings?.length || 0
      });

      return result as unknown as GenerateObjectResult<SCHEMA>;

    } catch (error: any) {
      this.emit('ai_sdk:generate_object_failed', {
        requestId,
        error: error.message,
        latency: Date.now() - startTime,
        errorType: error.constructor.name
      });

      throw error;
    }
  }

  /**
   * Streaming structured object generation
   */
  streamObject<SCHEMA>(
    options: {
      model: LanguageModel;
      output?: 'object' | 'array' | 'enum' | 'no-schema';
      mode?: 'auto' | 'json' | 'tool';
      schema?: SCHEMA;
      schemaName?: string;
      schemaDescription?: string;
      enum?: string[];
      system?: string;
      prompt?: string;
      messages?: CoreMessage[];
      maxOutputTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      seed?: number;
      maxRetries?: number;
      abortSignal?: AbortSignal;
      headers?: Record<string, string>;
      experimental_repairText?: (options: { text: string; error: any; }) => Promise<string>;
      experimental_download?: (requestedDownloads: Array<{ url: URL; isUrlSupportedByModel: boolean }>) => Promise<Array<null | { data: Uint8Array; mediaType?: string }>>;
      experimental_telemetry?: {
        isEnabled?: boolean;
        recordInputs?: boolean;
        recordOutputs?: boolean;
        functionId?: string;
        metadata?: Record<string, any>;
      };
      providerOptions?: Record<string, Record<string, any>>;
      onError?: (event: { error: unknown }) => Promise<void> | void;
      onFinish?: (result: {
        usage: LanguageModelUsage;
        providerMetadata?: Record<string, Record<string, any>>;
        object?: SCHEMA;
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
  ): StreamObjectResult<any, any, any> {
    if (!this.initialized) {
      throw new Error('AISDKIntegration not initialized. Call initialize() first.');
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.emit('ai_sdk:stream_object_started', {
      requestId,
      model: typeof options.model === 'string' ? options.model : 'unknown',
      output: options.output || 'object',
      mode: options.mode || 'auto',
      hasSchema: !!options.schema,
      hasEnum: !!options.enum
    });

    // Wrap callbacks to add event emission
    const wrappedOptions = {
      ...options,
      onError: (event: any) => {
        this.emit('ai_sdk:stream_object_error', {
          requestId,
          error: event.error,
          latency: Date.now() - startTime
        });
        if (options.onError) {
          options.onError(event);
        }
      },
      onFinish: (result: any) => {
        this.emit('ai_sdk:stream_object_finished', {
          requestId,
          latency: Date.now() - startTime,
          usage: result.usage,
          hasError: !!result.error,
          warnings: result.warnings?.length || 0
        });

        if (options.onFinish) {
          options.onFinish(result);
        }
      }
    };

    // Return native results directly
    return streamObject(wrappedOptions as any);
  }


  // Tool helper methods

  /**
   * Create tool
   */
  createTool<TParameters, TResult>(
    description: string,
    inputSchema: z.ZodSchema<TParameters>,
    execute?: (parameters: TParameters) => Promise<TResult> | TResult
  ): Tool<TParameters, TResult> {
    return tool({
      description,
      parameters: inputSchema,
      execute
    } as any);
  }

  /**
   * Create smooth stream
   */
  createSmoothStream() {
    return smoothStream();
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
   * Reset statistics
   */
  resetStats(): void {
    this.requestCounter = 0;
  }

  /**
   * Destroy instance
   */
  destroy(): void {
    this.removeAllListeners();
    this.initialized = false;
    this.requestCounter = 0;
  }
}

// Exports

export {
  tool,
  type Tool,
  streamText,
  type ToolSet,
  // Core functions
  generateText,
  smoothStream,
  type CoreMessage,
  type FinishReason,
  type LanguageModel,
  
  type TextStreamPart,
  type StreamTextResult,
  // Core types
  type GenerateTextResult,
  type LanguageModelUsage
};

// Default export
export default AISDKIntegration;