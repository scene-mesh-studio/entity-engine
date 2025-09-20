/**
 * Entity Engine AI - Streaming Utils
 * 
 * Stream processing utilities for message stream reading and processing
 */

import type { UIMessage } from 'ai';

// Message stream reader

/**
 * Read UI message stream options
 */
export interface ReadUIMessageStreamOptions {
  stream: ReadableStream;
  message?: UIMessage;
  onMessage?: (message: UIMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: (finalMessage: UIMessage) => void;
}

/**
 * UI message stream reader
 */
export class UIMessageStreamReader {
  private reader: ReadableStreamDefaultReader | null = null;
  private currentMessage: UIMessage | null = null;
  private isReading = false;

  constructor(private options: ReadUIMessageStreamOptions) {
    this.currentMessage = options.message || null;
  }

  /**
   * Start reading stream
   */
  async *read(): AsyncIterableIterator<UIMessage> {
    if (this.isReading) {
      throw new Error('Stream is already being read');
    }

    this.isReading = true;
    this.reader = this.options.stream.getReader();

    try {
      let done = false;
      
      while (!done) {
        const { value, done: streamDone } = await this.reader.read();
        done = streamDone;

        if (value) {
          const message = this.processChunk(value);
          if (message) {
            this.options.onMessage?.(message);
            yield message;
          }
        }
      }

      if (this.currentMessage) {
        this.options.onComplete?.(this.currentMessage);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.options.onError?.(err);
      throw err;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Process stream chunk
   */
  private processChunk(chunk: any): UIMessage | null {
    try {
      // If chunk is string, try to parse JSON
      if (typeof chunk === 'string') {
        chunk = JSON.parse(chunk);
      }

      // If chunk is Uint8Array, convert to string then parse
      if (chunk instanceof Uint8Array) {
        const decoder = new TextDecoder();
        chunk = JSON.parse(decoder.decode(chunk));
      }

      // Handle different types of stream data
      if (chunk.type) {
        return this.handleStreamData(chunk);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle stream data
   */
  private handleStreamData(data: any): UIMessage | null {
    switch (data.type) {
      case 'message-start':
        return this.handleMessageStart(data);
      
      case 'message-delta':
        return this.handleMessageDelta(data);
      
      case 'message-stop':
        return this.handleMessageStop(data);
      
      case 'text-delta':
        return this.handleTextDelta(data);
      
      case 'tool-call':
        return this.handleToolCall(data);
      
      case 'tool-result':
        return this.handleToolResult(data);
      
      default:
        return null;
    }
  }

  /**
   * Handle message start
   */
  private handleMessageStart(data: any): UIMessage {
    this.currentMessage = {
      id: data.messageId || this.generateId(),
      role: data.role || 'assistant',
      parts: [],
      metadata: data.metadata || {},
      ...data,
    } as UIMessage;

    return { ...this.currentMessage };
  }

  /**
   * Handle message delta
   */
  private handleMessageDelta(data: any): UIMessage | null {
    if (!this.currentMessage) {
      return null;
    }

    // Update message content
    if (data.content) {
      // Find or create text part
      let textPart = this.currentMessage.parts.find(p => p.type === 'text') as any;
      if (!textPart) {
        textPart = { type: 'text', text: '' };
        this.currentMessage.parts.push(textPart);
      }
      
      textPart.text += data.content;
    }

    return { ...this.currentMessage };
  }

  /**
   * Handle message stop
   */
  private handleMessageStop(data: any): UIMessage | null {
    if (!this.currentMessage) {
      return null;
    }

    // Update final state
    if (data.finishReason) {
      this.currentMessage.metadata = {
        ...(this.currentMessage.metadata || {}),
        finishReason: data.finishReason,
      };
    }

    return { ...this.currentMessage };
  }

  /**
   * Handle text delta
   */
  private handleTextDelta(data: any): UIMessage | null {
    if (!this.currentMessage) {
      // Create new message
      this.currentMessage = {
        id: this.generateId(),
        role: 'assistant',
        parts: [{ type: 'text', text: data.text || '' }],
      };
    } else {
      // Update existing message
      let textPart = this.currentMessage.parts.find(p => p.type === 'text') as any;
      if (!textPart) {
        textPart = { type: 'text', text: '' };
        this.currentMessage.parts.push(textPart);
      }
      
      textPart.text += data.text || '';
    }

    return { ...this.currentMessage };
  }

  /**
   * Handle tool call
   */
  private handleToolCall(data: any): UIMessage | null {
    if (!this.currentMessage) {
      this.currentMessage = {
        id: this.generateId(),
        role: 'assistant',
        parts: [],
      };
    }

    // Add tool call part
    const toolPart = {
      type: 'dynamic-tool' as const,
      toolCallId: data.toolCallId,
      toolName: data.toolName,
      input: data.input,
      state: 'input-available' as const,
    } as any;

    this.currentMessage.parts.push(toolPart);
    return { ...this.currentMessage };
  }

  /**
   * Handle tool result
   */
  private handleToolResult(data: any): UIMessage | null {
    if (!this.currentMessage) {
      return null;
    }

    // Find corresponding tool call part and update
    const toolPart = this.currentMessage.parts.find(
      p => p.type.startsWith('tool-') && (p as any).toolCallId === data.toolCallId
    ) as any;

    if (toolPart) {
      toolPart.output = data.result;
      toolPart.state = data.error ? 'output-error' : 'output-available';
      if (data.error) {
        toolPart.errorText = data.error;
      }
    }

    return { ...this.currentMessage };
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Stop reading
   */
  async stop(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel();
    }
    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.isReading = false;
    if (this.reader) {
      this.reader.releaseLock();
      this.reader = null;
    }
  }
}

/**
 * Read UI message stream
 */
export async function* readUIMessageStream(
  options: ReadUIMessageStreamOptions
): AsyncIterableIterator<UIMessage> {
  const reader = new UIMessageStreamReader(options);
  yield* reader.read();
}

// Stream resume utilities

/**
 * Stream resume options
 */
export interface StreamResumeOptions {
  chatId: string;
  messageId?: string;
  endpoint?: string;
  headers?: Record<string, string>;
}

/**
 * Resume stream
 */
export async function resumeStream({
  chatId,
  messageId,
  endpoint = '/api/chat/resume',
  headers = {},
}: StreamResumeOptions): Promise<ReadableStream> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      chatId,
      messageId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resume request failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body received');
  }

  return response.body;
}

// Stream state management

/**
 * Stream state
 */
export type StreamState = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error' | 'aborted';

/**
 * Stream state manager
 */
export class StreamStateManager {
  private state: StreamState = 'idle';
  private listeners = new Set<(state: StreamState) => void>();
  private abortController: AbortController | null = null;

  /**
   * Get current state
   */
  getState(): StreamState {
    return this.state;
  }

  /**
   * Set state
   */
  setState(newState: StreamState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  /**
   * Listen to state changes
   */
  onStateChange(listener: (state: StreamState) => void): () => void {
    this.listeners.add(listener);
    
    // Return function to cancel listening
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Start stream
   */
  startStream(): AbortController {
    this.abortController = new AbortController();
    this.setState('connecting');
    return this.abortController;
  }

  /**
   * Abort stream
   */
  abortStream(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.setState('aborted');
  }

  /**
   * Complete stream
   */
  completeStream(): void {
    this.abortController = null;
    this.setState('complete');
  }

  /**
   * Stream error
   */
  errorStream(): void {
    this.abortController = null;
    this.setState('error');
  }

  /**
   * Reset state
   */
  reset(): void {
    this.abortController = null;
    this.setState('idle');
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        // Ignore listener errors
      }
    });
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.abortController = null;
    this.listeners.clear();
    this.setState('idle');
  }
}