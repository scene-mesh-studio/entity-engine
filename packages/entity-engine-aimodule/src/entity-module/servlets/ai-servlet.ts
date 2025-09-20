/**
 * AI Unified Servlet - Unified AI service endpoint handler
 * 
 * Handles all AI-related endpoints:
 * - /api/ee/servlet/ai/chat - AI chat conversation (useChat hook)
 * - /api/ee/servlet/ai/completion - AI text completion (useCompletion hook)
 * - /api/ee/servlet/ai/object - AI structured object generation (useObject hook)
 * - /api/ee/servlet/ai/embeddings - AI embedding vector generation
 */

import type { IEntityServlet, IEntityServletRequest, IEntityServletResponse } from '@scenemesh/entity-engine';

import { stepCountIs, type UIMessage } from 'ai';

// CORS配置 - HTTP层职责，保留在servlet中
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};



/**
 * Chat request interface
 */
interface ChatRequest {
  messages: UIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  seed?: number;
  system?: string;
  tools?: boolean;
  [key: string]: any;
}

/**
 * 补全请求接口
 */
interface CompletionRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * 对象生成请求接口
 */
interface ObjectRequest {
  prompt?: string;
  schema?: any;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * 嵌入向量请求接口
 */
interface EmbeddingsRequest {
  input: string | string[];
  model?: string;
  dimensions?: number;
  [key: string]: any;
}

/**
 * 获取AICoreManager实例
 */
async function getCoreManager() {
  const { EntityAIModule } = await import('../ai.module');
  const moduleInstance = EntityAIModule.getInstance();
  
  if (!moduleInstance?.coreManager) {
    throw new Error('AICoreManager not initialized. Please ensure EntityAIModule is properly setup.');
  }
  
  return moduleInstance.coreManager;
}


/**
 * 处理聊天请求
 */
async function handleChatRequest(req: IEntityServletRequest, res: IEntityServletResponse) {
  let body: ChatRequest;
  let systemDefaults: any;
  
  try {
    const request = req.req;
    body = await request.json();
  } catch (error: any) {
    // 获取系统配置用于错误响应
    const coreManager = await getCoreManager();
    systemDefaults = coreManager.settingsManagement.getSystemDefaults();
    
    const errorResponse = new Response(
      JSON.stringify({ error: 'Failed to parse request body', details: error.message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }}
    );
    res.write(errorResponse);
    return;
  }
  
  const coreManager = await getCoreManager();
  systemDefaults = coreManager.settingsManagement.getSystemDefaults();
  
  if (!body.messages || !Array.isArray(body.messages)) {
    const response = new Response(
      JSON.stringify({ error: 'Invalid request: messages array is required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }}
    );
    res.write(response);
    return;
  }

  const modelId = body.model || `${systemDefaults.defaultProvider}:${systemDefaults.defaultModel}`;
  const resolvedModel = await coreManager.providerManagement.getLanguageModel(modelId);

  // 检查模型是否解析成功
  if (!resolvedModel) {
    const errorResponse = new Response(
      JSON.stringify({ 
        error: 'Model not available', 
        details: `Failed to resolve model: ${modelId}`,
        modelId
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }}
    );
    res.write(errorResponse);
    return;
  }

  // 处理前端消息格式 - 支持parts数组和content字段
  const messagesWithId = body.messages.map((msg, index) => {
    let content = (msg as any).content;
    
    // 如果消息使用parts格式，提取文本内容
    if (!content && (msg as any).parts && Array.isArray((msg as any).parts)) {
      const textParts = (msg as any).parts.filter((part: any) => part.type === 'text');
      content = textParts.map((part: any) => part.text).join(' ');
    }
    
    return {
      ...msg,
      content,
      id: (msg as any).id || `msg-${Date.now()}-${index}`
    };
  });

  try {
    // 按照AI SDK官方规范构建streamText选项，支持多步调用
    const finalMessages = messagesWithId.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    

    const systemPromptToUse = body.system || systemDefaults.systemPrompt;

    const streamTextOptions = {
      model: resolvedModel,
      messages: finalMessages,
      system: systemPromptToUse,
      maxOutputTokens: body.maxTokens || systemDefaults.maxOutputTokens,
      temperature: body.temperature ?? systemDefaults.temperature,
      topP: body.topP ?? systemDefaults.topP,
      topK: body.topK ?? systemDefaults.topK, 
      presencePenalty: body.presencePenalty ?? systemDefaults.presencePenalty,
      frequencyPenalty: body.frequencyPenalty ?? systemDefaults.frequencyPenalty,
      seed: body.seed,
      onError: ({ error }: { error: unknown }) => {
        console.error('AI Chat Stream Error:', error);
      }
    };

    if (body.tools !== false && systemDefaults.enableTools) {
      try {
        // 导入AI SDK的tool函数和Zod
        const { tool } = await import('ai');
        const { z } = await import('zod');
        
        // 导入标准化注册的所有工具（包括前端代理工具）
        const { 
          weatherTool, 
          locationTool, 
          entityQueryTool,
          recordGetValuesTool,
          recordSetValuesTool,
          recordResetFormTool,
          recordValidateFormTool,
          recordGetFieldInfoTool
        } = await import('../../tools');
        
        // Construct tools object according to AI SDK specifications
        const tools = {
          // Static tools - server-side execution
          getWeather: weatherTool,
          getLocation: locationTool,
          
          // Dynamic tools - server-side execution
          entityQuery: entityQueryTool,
          
          // Frontend proxy tools - registered via standard AI SDK, proxied to frontend during execution
          recordGetValues: recordGetValuesTool,
          recordSetValues: recordSetValuesTool,
          recordResetForm: recordResetFormTool,
          recordValidateForm: recordValidateFormTool,
          recordGetFieldInfo: recordGetFieldInfoTool,
        };
        
        (streamTextOptions as any).tools = tools;
        // Add AI SDK multi-step configuration - allows continued text generation after tool calls
        (streamTextOptions as any).stopWhen = stepCountIs(5);
      } catch (error) {
        console.error('Failed to load tools:', error);
      }
    }

    const result = coreManager.aiSDK.streamText(streamTextOptions);
    
    const response = result.toUIMessageStreamResponse({ 
      headers: CORS_HEADERS,
      onToolResult: ({ toolResult }: { toolResult: any }) => {
        // Tool result received and processed
      }
    });
    res.write(response);
  } catch (error: any) {
    const errorResponse = new Response(
      JSON.stringify({ 
        error: 'AI service error', 
        details: error.message,
        type: error.constructor.name
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }}
    );
    res.write(errorResponse);
    return;
  }
}

/**
 * 处理补全请求
 */
async function handleCompletionRequest(req: IEntityServletRequest, res: IEntityServletResponse) {
  const request = req.req;
  const body: CompletionRequest = await request.json();
  
  if (!body.prompt || typeof body.prompt !== 'string') {
    const response = new Response(
      JSON.stringify({ error: 'Invalid request: prompt string is required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }}
    );
    res.write(response);
    return;
  }

  const coreManager = await getCoreManager();
  const modelId = body.model || 'qwen:qwen-plus-2025-01-25';
  const resolvedModel = await coreManager.providerManagement.getLanguageModel(modelId);

  const generateTextOptions = {
    model: resolvedModel,
    prompt: body.prompt,
    maxOutputTokens: body.maxTokens || 4000,
    temperature: body.temperature ?? 0.7
  };

  const result = coreManager.aiSDK.streamText(generateTextOptions);
  const response = result.toTextStreamResponse({ headers: CORS_HEADERS });
  res.write(response);
}

/**
 * 处理对象生成请求
 */
async function handleObjectRequest(req: IEntityServletRequest, res: IEntityServletResponse) {
  const request = req.req;
  const body: ObjectRequest = await request.json();
  
  if (!body.prompt && !body.schema) {
    const response = new Response(
      JSON.stringify({ error: 'Invalid request: prompt or schema is required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }}
    );
    res.write(response);
    return;
  }

  const coreManager = await getCoreManager();
  const modelId = body.model || 'qwen:qwen-plus-2025-01-25';
  const resolvedModel = await coreManager.providerManagement.getLanguageModel(modelId);

  const streamObjectOptions = {
    model: resolvedModel,
    prompt: body.prompt || 'Generate structured data according to the schema',
    schema: body.schema,
    maxOutputTokens: body.maxTokens || 4000,
    temperature: body.temperature ?? 0.7
  };

  const result = coreManager.aiSDK.streamObject(streamObjectOptions);
  const response = result.toTextStreamResponse({ headers: CORS_HEADERS });
  res.write(response);
}




/**
 * Handle frontend tool result requests
 */
async function handleFrontendToolResultRequest(req: IEntityServletRequest, res: IEntityServletResponse) {
  const request = req.req;
  
  try {
    const body = await request.json();
    const { waitId, result, error } = body;
    
    
    // 调用全局回调函数处理结果
    if (result) {
      if (typeof (global as any).resolveFrontendTool === 'function') {
        (global as any).resolveFrontendTool(waitId, result);
      }
    } else if (error) {
      if (typeof (global as any).rejectFrontendTool === 'function') {
        (global as any).rejectFrontendTool(waitId, error);
      }
    }
    
    // 返回成功响应
    const successResponse = new Response(
      JSON.stringify({ 
        success: true, 
        waitId,
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );
    res.write(successResponse);
    
  } catch (parseError: any) {
    
    const errorResponse = new Response(
      JSON.stringify({ 
        error: 'Failed to parse frontend tool result request', 
        details: parseError.message 
      }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );
    res.write(errorResponse);
  }
}

/**
 * 处理嵌入向量请求
 */
async function handleEmbeddingsRequest(req: IEntityServletRequest, res: IEntityServletResponse) {
  const request = req.req;
  const body: EmbeddingsRequest = await request.json();
  
  if (!body.input) {
    const response = new Response(
      JSON.stringify({ error: 'Invalid request: input is required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }}
    );
    res.write(response);
    return;
  }

  const coreManager = await getCoreManager();
  const modelId = body.model || 'text-embedding-v1';
  const resolvedModel = await coreManager.providerManagement.getLanguageModel(modelId);

  const embedOptions = {
    model: resolvedModel,
    value: body.input,
    dimensions: body.dimensions
  };

  let result;
  let embeddings;
  
  if (Array.isArray(body.input)) {
    result = await coreManager.aiSDK.embedMany(embedOptions);
    embeddings = result.embeddings;
  } else {
    result = await coreManager.aiSDK.embed(embedOptions);
    embeddings = [result.embedding];
  }

  const responseData = {
    object: 'list',
    data: embeddings.map((embedding: number[], index: number) => ({
      object: 'embedding',
      embedding,
      index
    })),
    model: modelId,
    usage: {
      prompt_tokens: Array.isArray(body.input) 
        ? body.input.reduce((acc, text) => acc + text.length, 0)
        : body.input.length,
      total_tokens: Array.isArray(body.input) 
        ? body.input.reduce((acc, text) => acc + text.length, 0)
        : body.input.length
    }
  };

  const response = new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
  res.write(response);
}


/**
 * 统一AI Servlet
 */
export const aiUnifiedServlet: IEntityServlet = {
  path: '/ai',
  methods: ['POST', 'GET'],
  
  async handle(req: IEntityServletRequest, res: IEntityServletResponse) {
    const request = req.req;
    
    // 获取系统配置用于CORS处理
    const coreManager = await getCoreManager();
    const systemDefaults = coreManager.settingsManagement.getSystemDefaults();
    
    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      const response = new Response(null, {
        status: 200,
        headers: CORS_HEADERS
      });
      res.write(response);
      return;
    }

    // 根据端点路由到不同的处理函数
    const endpoint = req.endpoint;
    
    try {
      // 处理流式GET请求 (AI SDK可能会发送GET请求进行重连)
      if (request.method === 'GET') {
        // 对于GET请求，返回一个简单的流响应
        const response = new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data: {"type":"error","error":"Please use POST method to start a conversation"}\n\n'));
              controller.close();
            }
          }),
          {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            }
          }
        );
        res.write(response);
        return;
      }
      
      switch (endpoint) {
        case '/chat':
          await handleChatRequest(req, res);
          return;
        case '/completion':
          await handleCompletionRequest(req, res);
          return;
        case '/object':
          await handleObjectRequest(req, res);
          return;
        case '/embeddings':
          await handleEmbeddingsRequest(req, res);
          return;
        case '/frontend-tool-result':
          await handleFrontendToolResultRequest(req, res);
          return;
        default:{
          const errorResponse = new Response(
            JSON.stringify({ 
              error: 'Unsupported endpoint', 
              endpoint,
              supportedEndpoints: ['/chat', '/completion', '/object', '/embeddings', '/frontend-tool-result']
            }),
            {
              status: 404,
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            }
          );
          res.write(errorResponse);
        }
      }
    } catch (error: any) {
      const errorResponse = new Response(
        JSON.stringify({
          error: error.message || 'Internal server error',
          type: error.constructor.name,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }),
        {
          status: 500,
          headers: { ...systemDefaults.corsHeaders, 'Content-Type': 'application/json' }
        }
      );
      res.write(errorResponse);
    }
  }
};