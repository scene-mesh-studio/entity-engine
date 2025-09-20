/**
 * 🎯 Entity Engine AIUI - Message Persistence Utils
 * 
 * 消息持久化工具，支持消息验证、ID生成和存储管理
 */

import type { z } from 'zod';
import type { UIMessage } from 'ai';

// ================================
// 🎯 ID生成器
// ================================

/**
 * ID生成器选项
 */
export interface IdGeneratorOptions {
  prefix?: string;
  size?: number;
}

/**
 * 创建ID生成器
 */
export function createIdGenerator(options: IdGeneratorOptions = {}) {
  const { prefix = '', size = 12 } = options;
  
  return (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < size; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return prefix ? `${prefix}-${result}` : result;
  };
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return createIdGenerator()();
}

// ================================
// 🎯 消息验证
// ================================

/**
 * 消息验证选项
 */
export interface ValidateUIMessagesOptions<T extends Record<string, any> = any> {
  messages: UIMessage[];
  tools?: T;
  dataPartsSchema?: z.ZodSchema;
  metadataSchema?: z.ZodSchema;
}

/**
 * 验证UI消息
 */
export async function validateUIMessages<T extends Record<string, any>>({
  messages,
  tools,
  dataPartsSchema,
  metadataSchema,
}: ValidateUIMessagesOptions<T>): Promise<UIMessage[]> {
  const validatedMessages: UIMessage[] = [];

  for (const message of messages) {
    try {
      const validatedMessage = await validateSingleMessage(message, {
        tools,
        dataPartsSchema,
        metadataSchema,
      });
      validatedMessages.push(validatedMessage);
    } catch (error) {
      // 如果验证失败，记录错误但继续处理
      // 可以选择跳过无效消息或使用默认值
      validatedMessages.push(sanitizeMessage(message));
    }
  }

  return validatedMessages;
}

/**
 * 验证单个消息
 */
async function validateSingleMessage<T extends Record<string, any>>(
  message: UIMessage,
  options: Omit<ValidateUIMessagesOptions<T>, 'messages'>
): Promise<UIMessage> {
  const { tools, dataPartsSchema, metadataSchema } = options;

  // 验证消息结构
  if (!message.id || !message.role || !Array.isArray(message.parts)) {
    throw new Error('Invalid message structure');
  }

  // 验证消息部分
  const validatedParts = [];
  for (const part of message.parts) {
    const validatedPart = await validateMessagePart(part, tools);
    validatedParts.push(validatedPart);
  }

  // 验证元数据
  let validatedMetadata = message.metadata;
  if (metadataSchema && message.metadata) {
    try {
      validatedMetadata = metadataSchema.parse(message.metadata);
    } catch (error) {
      validatedMetadata = undefined;
    }
  }

  return {
    ...message,
    parts: validatedParts,
    metadata: validatedMetadata,
  };
}

/**
 * 验证消息部分
 */
async function validateMessagePart(part: any, tools?: Record<string, any>): Promise<any> {
  // 验证文本部分
  if (part.type === 'text') {
    if (typeof part.text !== 'string') {
      throw new Error('Text part must have a string text property');
    }
    return part;
  }

  // 验证文件部分
  if (part.type === 'file') {
    if (!part.filename || !part.url) {
      throw new Error('File part must have filename and url properties');
    }
    return part;
  }

  // 验证工具调用部分
  if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
    const toolName = part.type === 'dynamic-tool' ? part.toolName : part.type.replace('tool-', '');
    
    // 如果提供了工具定义，验证工具是否存在
    if (tools && toolName && !tools[toolName]) {
      console.warn(`Tool ${toolName} not found in provided tools`);
    }
    
    return part;
  }

  // 验证数据部分
  if (part.type.startsWith('data-')) {
    if (!part.data) {
      throw new Error('Data part must have a data property');
    }
    return part;
  }

  return part;
}

/**
 * 清理消息（移除无效部分）
 */
function sanitizeMessage(message: UIMessage): UIMessage {
  const sanitizedParts = message.parts.filter(part => 
    // 保留有效的部分类型
     part && typeof part === 'object' && part.type
  );

  return {
    ...message,
    parts: sanitizedParts.length > 0 ? sanitizedParts : [
      { type: 'text', text: '[Message content could not be validated]' }
    ],
  };
}

// ================================
// 🎯 类型验证错误
// ================================

/**
 * 类型验证错误类
 */
export class TypeValidationError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'TypeValidationError';
  }
}

// ================================
// 🎯 消息存储接口
// ================================

/**
 * 消息存储接口
 */
export interface MessageStore {
  createChat(): Promise<string>;
  loadChat(id: string): Promise<UIMessage[]>;
  saveChat(options: { chatId: string; messages: UIMessage[] }): Promise<void>;
  deleteChat(id: string): Promise<void>;
  listChats(): Promise<Array<{ id: string; title?: string; updatedAt: Date }>>;
}

/**
 * 内存消息存储（用于开发和测试）
 */
export class InMemoryMessageStore implements MessageStore {
  private chats = new Map<string, UIMessage[]>();
  private metadata = new Map<string, { title?: string; updatedAt: Date }>();

  async createChat(): Promise<string> {
    const id = generateId();
    this.chats.set(id, []);
    this.metadata.set(id, { updatedAt: new Date() });
    return id;
  }

  async loadChat(id: string): Promise<UIMessage[]> {
    const messages = this.chats.get(id);
    if (!messages) {
      throw new Error(`Chat ${id} not found`);
    }
    return [...messages];
  }

  async saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }): Promise<void> {
    this.chats.set(chatId, [...messages]);
    
    // 更新元数据
    const existing = this.metadata.get(chatId) || {};
    this.metadata.set(chatId, {
      ...existing,
      updatedAt: new Date(),
      title: (existing as any).title || this.extractTitle(messages),
    });
  }

  async deleteChat(id: string): Promise<void> {
    this.chats.delete(id);
    this.metadata.delete(id);
  }

  async listChats(): Promise<Array<{ id: string; title?: string; updatedAt: Date }>> {
    return Array.from(this.metadata.entries()).map(([id, meta]) => ({
      id,
      ...meta,
    }));
  }

  private extractTitle(messages: UIMessage[]): string {
    // 提取第一个用户消息作为标题
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const textPart = firstUserMessage.parts.find(p => p.type === 'text') as any;
      if (textPart?.text) {
        return textPart.text.slice(0, 50) + (textPart.text.length > 50 ? '...' : '');
      }
    }
    return 'Untitled Chat';
  }
}

/**
 * 本地存储消息存储
 */
export class LocalStorageMessageStore implements MessageStore {
  private readonly keyPrefix = 'entity-engine-aiui-chat-';

  async createChat(): Promise<string> {
    const id = generateId();
    const key = this.keyPrefix + id;
    
    const chatData = {
      id,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(chatData));
    return id;
  }

  async loadChat(id: string): Promise<UIMessage[]> {
    const key = this.keyPrefix + id;
    const data = localStorage.getItem(key);
    
    if (!data) {
      throw new Error(`Chat ${id} not found`);
    }

    try {
      const chatData = JSON.parse(data);
      return chatData.messages || [];
    } catch (error) {
      throw new Error(`Failed to parse chat data: ${error}`);
    }
  }

  async saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }): Promise<void> {
    const key = this.keyPrefix + chatId;
    const existing = localStorage.getItem(key);
    
    const chatData: any = {
      id: chatId,
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      try {
        const parsedExisting = JSON.parse(existing);
        chatData.createdAt = parsedExisting.createdAt || chatData.createdAt;
      } catch {
        // Ignore validation errors
      }
    }

    localStorage.setItem(key, JSON.stringify(chatData));
  }

  async deleteChat(id: string): Promise<void> {
    const key = this.keyPrefix + id;
    localStorage.removeItem(key);
  }

  async listChats(): Promise<Array<{ id: string; title?: string; updatedAt: Date }>> {
    const chats: Array<{ id: string; title?: string; updatedAt: Date }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.keyPrefix)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const chatData = JSON.parse(data);
            chats.push({
              id: chatData.id,
              title: this.extractTitle(chatData.messages || []),
              updatedAt: new Date(chatData.updatedAt || chatData.createdAt),
            });
          }
        } catch {
          // Ignore part validation errors
        }
      }
    }

    return chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  private extractTitle(messages: UIMessage[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const textPart = firstUserMessage.parts.find(p => p.type === 'text') as any;
      if (textPart?.text) {
        return textPart.text.slice(0, 50) + (textPart.text.length > 50 ? '...' : '');
      }
    }
    return 'Untitled Chat';
  }
}