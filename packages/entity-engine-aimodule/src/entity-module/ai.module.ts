import type { EntityView, IEntityView, EntityWidget ,
  IEntityModel,
  IEntityModule,
  IEntityServlet,
  ImportEntityData,
  IEntityNamedRenderer
} from '@scenemesh/entity-engine';

import { config } from 'dotenv';

import info from './module.json';
import { aiViews } from './views';
import { aiModels } from './models';
import { aiServlets } from './servlets';

export class EntityAIModule implements IEntityModule {
  readonly info = info;

  // 单例模式支持 - 用于servlet访问
  private static instance: EntityAIModule | null = null;

  public coreManager: any = null;
  private streamManager: any = null;
  private apiHandlers: any = null;

  constructor() {
    // 设置单例实例
    EntityAIModule.instance = this;
    
    // 立即加载环境变量 - 确保在所有服务初始化之前完成
    this.loadEnvironmentVariables();
  }

  /**
   * 获取单例实例 - 用于servlet依赖注入
   */
  static getInstance(): EntityAIModule | null {
    return EntityAIModule.instance;
  }

  async setupConfig(args: {
    models: IEntityModel[];
    views: IEntityView[];
    eventHandlers: any[];
    actionHandlers: any[];
    servlets: IEntityServlet[];
  }): Promise<void> {

    // 初始化AI核心服务 - 必须在servlet注册之前完成
    await this.initializeAICore();

    // 注册模型
    args.models.push(...aiModels);

    // 注册视图
    args.views.push(...aiViews);

    // 注册AI Servlets (核心功能) - 直接使用Entity Engine格式
    args.servlets.push(...aiServlets);

    
    // 验证servlet是否正确添加到args.servlets中
  }

  async setupComponents(args: {
    views: EntityView[];
    renderers: IEntityNamedRenderer[];
    widgets: EntityWidget[];
  }): Promise<void> {

    // 动态加载AI Modal渲染器 - 使用绝对路径避免bundler分析
    if (typeof window !== 'undefined') {
      // 只在客户端环境执行
      try {
        const { EntityEngineAIModalRenderer } = await import('./renderers/ai-renderer');
        const { EntityEngineAIFormRenderer } = await import('./renderers/ai-form-renderer');
        args.renderers.push(EntityEngineAIModalRenderer);
        args.renderers.push(EntityEngineAIFormRenderer);
      } catch {
        // Ignore renderer registration errors
      }
    }
  }

  async setupData(args: { entities: ImportEntityData[] }): Promise<void> {
    // AI module doesn't need to setup data entities - configuration is handled by settings management
    // This follows separation of concerns: ai.module.ts handles Entity Engine integration only
  }

  // 核心适配器方法
  private async initializeAICore(): Promise<void> {
    // 初始化AI Core Manager - 统一管理所有AI功能
    const { AICoreManager } = await import('../core/ai-core-manager');
    
    this.coreManager = new AICoreManager({
      providers: { autoHealthCheck: true, fallbackEnabled: true },
      tools: { enableMCP: true, enableDynamic: true },
      embeddings: { defaultModel: 'text-embedding-v1' } // 使用通用嵌入模型名称
    });

    await this.coreManager.initialize();
    
  }

  /**
   * 加载环境变量 - 在模块构造时立即执行
   * 确保在所有AI服务初始化之前环境变量就已经可用
   */
  private loadEnvironmentVariables(): void {
    try {
      // 固定使用 workbench 应用的 .env 文件
      config({ path: './apps/workbench/.env', override: false });
    } catch (error) {
      console.error('❌ Failed to load environment variables:', error);
    }
  }

  private adaptEntityRequestToAI(req: any): Request {
    // 将Entity Engine的请求格式转换为标准Web API Request
    const url = new URL(req.endpoint, 'http://localhost');
    return new Request(url.toString(), {
      method: req.req.method,
      headers: req.req.headers,
      body: req.req.body
    });
  }

  /**
   * 将Web API Response适配到Entity Engine响应格式
   */
  private async adaptWebResponseToEntity(webResponse: Response, entityRes: any): Promise<void> {
    // 复制响应头
    webResponse.headers.forEach((value, key) => {
      entityRes.setHeader(key, value);
    });

    // 设置状态码
    entityRes.statusCode = webResponse.status;

    // 处理流式响应
    if (webResponse.body && webResponse.body.getReader) {
      const reader = webResponse.body.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // 写入流式数据
          entityRes.write(value);
        }
      } finally {
        reader.releaseLock();
      }
      
      entityRes.end();
    } else {
      // 处理非流式响应
      const text = await webResponse.text();
      entityRes.end(text);
    }
  }

  private adaptAIResponseToEntity(response: Response): Response {
    // AI响应已经是标准Response格式，可以直接返回
    return response;
  }
}