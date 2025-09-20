/**
 * AI Core Manager - Unified Core Management
 * 
 * 协调所有AI功能组件，提供统一的管理接口
 * 这是所有AI功能的中央协调器和主要入口点
 */

import type { AISDKIntegration } from './ai-core';
import type { AIToolsIntegration } from './ai-tools';
import type { AIProviderManagement } from './ai-provider';
import type { AISettingsManagement } from './ai-settings';
import type { AIEmbeddingsIntegration } from './ai-embeddings';
import type { AIStructuredDataIntegration } from './ai-structured';

import { EventEmitter } from 'events';

// ================================
// Type definitions
// ================================

/**
 * AI Core配置
 */
export interface AICoreConfig {
  // 组件启用配置
  components?: {
    aiSDK?: boolean;
    providerManagement?: boolean;
    toolsIntegration?: boolean;
    embeddingsIntegration?: boolean;
    settingsManagement?: boolean;
    structuredData?: boolean;
  };

  // AI SDK配置
  aiSDK?: {
    defaultSettings?: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
    };
  };

  // Provider配置
  providers?: {
    autoHealthCheck?: boolean;
    healthCheckInterval?: number;
    fallbackEnabled?: boolean;
  };

  // 工具配置
  tools?: {
    enableMCP?: boolean;
    enableDynamic?: boolean;
    maxSteps?: number;
    timeout?: number;
  };

  // 嵌入配置
  embeddings?: {
    defaultModel?: string;
    batchSize?: number;
    maxParallelCalls?: number;
  };

  // 设置配置
  settings?: {
    enablePresets?: boolean;
    enableValidation?: boolean;
    enableDynamic?: boolean;
  };

  // 监控配置
  monitoring?: {
    enabled?: boolean;
    collectMetrics?: boolean;
    enableEvents?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
  };

  // Entity Engine配置
  entity?: {
    enabled?: boolean;
    autoToolGeneration?: boolean;
    contextExtraction?: boolean;
    permissionChecking?: boolean;
  };
}

/**
 * AI Core统计信息
 */
export interface AICoreStats {
  // 初始化状态
  isInitialized: boolean;
  initializationTime: number;
  uptime: number;

  // 组件状态
  components: {
    aiSDK: boolean;
    providerManagement: boolean;
    toolsIntegration: boolean;
    embeddingsIntegration: boolean;
    settingsManagement: boolean;
    structuredData: boolean;
  };

  // 使用统计
  usage: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    totalTokens: number;
    errorRate: number;
  };

  // Provider统计
  providers: {
    totalProviders: number;
    healthyProviders: number;
    unhealthyProviders: number;
    totalModels: number;
  };

  // 性能指标
  performance: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    gcStats?: any;
  };
}

/**
 * 组件健康状态
 */
export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  error?: string;
  details?: Record<string, any>;
}

// ================================
// AI Core Manager class
// ================================

/**
 * AI Core Manager - 统一的AI功能管理器
 */
export class AICoreManager extends EventEmitter {
  private initialized: boolean = false;
  private config: Required<AICoreConfig>;
  private startTime: number = 0;
  private initializationTime: number = 0;
  private stats: AICoreStats;

  // 核心组件实例
  public aiSDK!: AISDKIntegration;
  public providerManagement!: AIProviderManagement;
  public toolsIntegration!: AIToolsIntegration;
  public embeddingsIntegration!: AIEmbeddingsIntegration;
  public settingsManagement!: AISettingsManagement;
  public structuredData!: AIStructuredDataIntegration;

  // 组件健康状态
  private componentHealth: Map<string, ComponentHealth> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config?: AICoreConfig) {
    super();

    // 设置默认配置
    this.config = {
      components: {
        aiSDK: true,
        providerManagement: true,
        toolsIntegration: true,
        embeddingsIntegration: true,
        settingsManagement: true,
        structuredData: true,
        ...config?.components
      },
      // AI SDK配置 - 默认设置现在从 settings management 获取
      aiSDK: {
        ...config?.aiSDK
      },
      providers: {
        autoHealthCheck: true,
        healthCheckInterval: 60000, // 1分钟
        fallbackEnabled: true,
        ...config?.providers
      },
      tools: {
        enableMCP: true,
        enableDynamic: true,
        maxSteps: 10,
        timeout: 30000,
        ...config?.tools
      },
      embeddings: {
        defaultModel: 'text-embedding-3-small',
        batchSize: 100,
        maxParallelCalls: 5,
        ...config?.embeddings
      },
      settings: {
        enablePresets: true,
        enableValidation: true,
        enableDynamic: true,
        ...config?.settings
      },
      monitoring: {
        enabled: true,
        collectMetrics: true,
        enableEvents: true,
        logLevel: 'info',
        ...config?.monitoring
      },
      entity: {
        enabled: false,
        autoToolGeneration: false,
        contextExtraction: false,
        permissionChecking: false,
        ...config?.entity
      }
    };

    // 初始化统计信息
    this.stats = {
      isInitialized: false,
      initializationTime: 0,
      uptime: 0,
      components: {
        aiSDK: false,
        providerManagement: false,
        toolsIntegration: false,
        embeddingsIntegration: false,
        settingsManagement: false,
        structuredData: false
      },
      usage: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        totalTokens: 0,
        errorRate: 0
      },
      providers: {
        totalProviders: 0,
        healthyProviders: 0,
        unhealthyProviders: 0,
        totalModels: 0
      },
      performance: {
        memoryUsage: typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : { rss: 0, heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 },
        cpuUsage: typeof process !== 'undefined' && process.cpuUsage ? process.cpuUsage() : { user: 0, system: 0 }
      }
    };
  }

  /**
   * 初始化AI Core Manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const initStartTime = Date.now();

    try {
      this.emit('ai_core:initializing', { timestamp: new Date() });

      // 1. 创建所有组件实例
      await this.createComponents();

      // 2. 初始化所有组件
      await this.initializeComponents();

      // 3. 设置组件间的依赖关系
      await this.setupComponentRelationships();

      // 4. 启动监控和健康检查
      if (this.config.monitoring.enabled) {
        await this.startMonitoring();
      }

      // 5. 更新状态
      this.startTime = Date.now();
      this.initializationTime = this.startTime - initStartTime;
      this.initialized = true;
      this.stats.isInitialized = true;
      this.stats.initializationTime = this.initializationTime;

      this.emit('ai_core:initialized', {
        timestamp: new Date(),
        duration: this.initializationTime,
        components: Object.keys(this.stats.components)
      });

    } catch (error: any) {
      this.emit('ai_core:initialization_failed', {
        timestamp: new Date(),
        error: error.message,
        duration: Date.now() - initStartTime
      });

      throw error;
    }
  }

  // ================================
  // Component management
  // ================================

  /**
   * 创建所有组件实例
   */
  private async createComponents(): Promise<void> {
    this.emit('ai_core:creating_components');

    // 动态导入以避免循环依赖
    if (this.config.components.aiSDK) {
      const { AISDKIntegration } = await import('./ai-core');
      this.aiSDK = new AISDKIntegration();
    }

    if (this.config.components.providerManagement) {
      const { AIProviderManagement } = await import('./ai-provider');
      this.providerManagement = new AIProviderManagement();
    }

    if (this.config.components.toolsIntegration) {
      const { AIToolsIntegration } = await import('./ai-tools');
      this.toolsIntegration = new AIToolsIntegration();
    }

    if (this.config.components.embeddingsIntegration) {
      const { AIEmbeddingsIntegration } = await import('./ai-embeddings');
      this.embeddingsIntegration = new AIEmbeddingsIntegration();
    }

    if (this.config.components.settingsManagement) {
      const { AISettingsManagement } = await import('./ai-settings');
      this.settingsManagement = new AISettingsManagement();
    }

    if (this.config.components.structuredData) {
      const { AIStructuredDataIntegration } = await import('./ai-structured');
      this.structuredData = new AIStructuredDataIntegration();
    }

    this.emit('ai_core:components_created');
  }

  /**
   * 初始化所有组件
   */
  private async initializeComponents(): Promise<void> {
    this.emit('ai_core:initializing_components');

    const initPromises: Promise<void>[] = [];

    // 按依赖顺序初始化组件
    if (this.settingsManagement) {
      initPromises.push(
        this.settingsManagement.initialize().then(() => {
          this.stats.components.settingsManagement = true;
          this.updateComponentHealth('settingsManagement', 'healthy');
        })
      );
    }

    if (this.providerManagement) {
      initPromises.push(
        this.providerManagement.initialize().then(() => {
          this.stats.components.providerManagement = true;
          this.updateComponentHealth('providerManagement', 'healthy');
        })
      );
    }

    if (this.embeddingsIntegration) {
      initPromises.push(
        this.embeddingsIntegration.initialize().then(() => {
          this.stats.components.embeddingsIntegration = true;
          this.updateComponentHealth('embeddingsIntegration', 'healthy');
        })
      );
    }

    if (this.toolsIntegration) {
      initPromises.push(
        this.toolsIntegration.initialize().then(() => {
          this.stats.components.toolsIntegration = true;
          this.updateComponentHealth('toolsIntegration', 'healthy');
        })
      );
    }

    if (this.structuredData) {
      initPromises.push(
        this.structuredData.initialize().then(() => {
          this.stats.components.structuredData = true;
          this.updateComponentHealth('structuredData', 'healthy');
        })
      );
    }

    if (this.aiSDK) {
      initPromises.push(
        this.aiSDK.initialize().then(() => {
          this.stats.components.aiSDK = true;
          this.updateComponentHealth('aiSDK', 'healthy');
        })
      );
    }

    // 等待所有组件初始化完成
    await Promise.all(initPromises);

    this.emit('ai_core:components_initialized');
  }

  /**
   * 设置组件间的依赖关系
   */
  private async setupComponentRelationships(): Promise<void> {
    this.emit('ai_core:setting_up_relationships');

    // 设置事件监听，用于跨组件通信
    if (this.aiSDK && this.config.monitoring.enableEvents) {
      this.aiSDK.on('ai_sdk:stream_started', (data) => {
        this.stats.usage.totalRequests++;
        this.emit('ai_core:request_started', data);
      });

      this.aiSDK.on('ai_sdk:stream_finished', (data) => {
        this.stats.usage.successfulRequests++;
        if (data.usage?.totalTokens) {
          this.stats.usage.totalTokens += data.usage.totalTokens;
        }
        this.updateAverageLatency(data.latency);
        this.emit('ai_core:request_completed', data);
      });

      this.aiSDK.on('ai_sdk:stream_error', (data) => {
        this.stats.usage.failedRequests++;
        this.updateErrorRate();
        this.emit('ai_core:request_failed', data);
      });
    }

    if (this.providerManagement && this.config.monitoring.enableEvents) {
      this.providerManagement.on('ai_provider:health_check_completed', (data) => {
        this.updateProviderStats();
        this.emit('ai_core:provider_health_updated', data);
      });
    }

    this.emit('ai_core:relationships_setup');
  }

  // ================================
  // Monitoring and health checks
  // ================================

  /**
   * 启动监控系统
   */
  private async startMonitoring(): Promise<void> {
    this.emit('ai_core:starting_monitoring');

    // 启动性能监控
    if (this.config.monitoring.collectMetrics) {
      setInterval(() => {
        this.updatePerformanceStats();
      }, 5000); // 每5秒更新一次性能数据
    }

    // 启动健康检查
    if (this.config.providers.autoHealthCheck) {
      this.healthCheckInterval = setInterval(async () => {
        await this.performHealthCheck();
      }, this.config.providers.healthCheckInterval);
    }

    this.emit('ai_core:monitoring_started');
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const components = [
        'aiSDK',
        'providerManagement', 
        'toolsIntegration',
        'embeddingsIntegration',
        'settingsManagement',
        'structuredData'
      ];

      for (const componentName of components) {
        const component = (this as any)[componentName];
        if (component) {
          try {
            const isHealthy = component.isInitialized?.() ?? true;
            this.updateComponentHealth(
              componentName,
              isHealthy ? 'healthy' : 'unhealthy'
            );
          } catch (error: any) {
            this.updateComponentHealth(componentName, 'unhealthy', error.message);
          }
        }
      }

      // 检查Provider健康状态
      if (this.providerManagement) {
        await this.providerManagement.checkAllProvidersHealth();
      }

    } catch (error: any) {
      this.emit('ai_core:health_check_error', { error: error.message });
    }
  }

  /**
   * 更新组件健康状态
   */
  private updateComponentHealth(
    componentName: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    error?: string
  ): void {
    this.componentHealth.set(componentName, {
      name: componentName,
      status,
      lastCheck: new Date(),
      error
    });
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(): void {
    this.stats.uptime = Date.now() - this.startTime;
    
    // 只在 Node.js 环境中更新性能统计
    if (typeof process !== 'undefined') {
      if (process.memoryUsage) {
        this.stats.performance.memoryUsage = process.memoryUsage();
      }
      if (process.cpuUsage) {
        this.stats.performance.cpuUsage = process.cpuUsage(this.stats.performance.cpuUsage);
      }
    }
  }

  /**
   * 更新平均延迟
   */
  private updateAverageLatency(latency: number): void {
    const total = this.stats.usage.totalRequests;
    this.stats.usage.averageLatency = 
      (this.stats.usage.averageLatency * (total - 1) + latency) / total;
  }

  /**
   * 更新错误率
   */
  private updateErrorRate(): void {
    this.stats.usage.errorRate = 
      this.stats.usage.failedRequests / this.stats.usage.totalRequests;
  }

  /**
   * 更新Provider统计
   */
  private updateProviderStats(): void {
    if (this.providerManagement) {
      const healthReport = this.providerManagement.getHealthReport();
      this.stats.providers = {
        totalProviders: healthReport.totalProviders,
        healthyProviders: healthReport.healthyProviders,
        unhealthyProviders: healthReport.unhealthyProviders,
        totalModels: this.providerManagement.getRegisteredProviders().length
      };
    }
  }

  // ================================
  // Public API methods
  // ================================

  /**
   * 获取完整的统计信息
   */
  getStats(): AICoreStats {
    this.updatePerformanceStats();
    return { ...this.stats };
  }

  /**
   * 获取组件健康状态
   */
  getComponentHealth(): ComponentHealth[] {
    return Array.from(this.componentHealth.values());
  }

  /**
   * 获取整体健康状态
   */
  getOverallHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: ComponentHealth[];
    summary: string;
  } {
    const components = this.getComponentHealth();
    const healthyCount = components.filter(c => c.status === 'healthy').length;
    const totalCount = components.length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    let summary: string;

    if (healthyCount === totalCount) {
      status = 'healthy';
      summary = 'All components are healthy';
    } else if (healthyCount >= totalCount * 0.5) {
      status = 'degraded';
      summary = `${healthyCount}/${totalCount} components are healthy`;
    } else {
      status = 'unhealthy';
      summary = `Only ${healthyCount}/${totalCount} components are healthy`;
    }

    return { status, components, summary };
  }

  /**
   * 获取AI默认设置 - 从设置管理器统一获取
   */
  getDefaultSettings() {
    if (!this.settingsManagement?.isInitialized()) {
      // 如果设置管理器未初始化，返回基本默认值
      return {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 50
      };
    }
    return this.settingsManagement.getDefaultSettings();
  }

  /**
   * 获取配置信息
   */
  getConfig(): AICoreConfig {
    return { ...this.config };
  }

  /**
   * 热重载配置
   */
  async updateConfig(newConfig: Partial<AICoreConfig>): Promise<void> {
    this.emit('ai_core:config_updating', { newConfig });

    // 深度合并配置
    this.config = this.deepMerge(this.config, newConfig) as Required<AICoreConfig>;

    // 应用新配置到各组件（如果需要）
    // 注意：某些配置可能需要重启组件才能生效

    this.emit('ai_core:config_updated', { config: this.config });
  }

  /**
   * 重启指定组件
   */
  async restartComponent(componentName: string): Promise<void> {
    const component = (this as any)[componentName];
    if (!component) {
      throw new Error(`Component '${componentName}' not found`);
    }

    this.emit('ai_core:component_restarting', { componentName });

    try {
      // 销毁组件
      if (component.destroy) {
        await component.destroy();
      }

      // 重新初始化
      await component.initialize();

      this.updateComponentHealth(componentName, 'healthy');
      this.emit('ai_core:component_restarted', { componentName });

    } catch (error: any) {
      this.updateComponentHealth(componentName, 'unhealthy', error.message);
      this.emit('ai_core:component_restart_failed', { 
        componentName, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 优雅关闭
   */
  async gracefulShutdown(): Promise<void> {
    this.emit('ai_core:shutting_down');

    // 停止健康检查
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // 销毁所有组件
    const destroyPromises: Promise<void>[] = [];

    if (this.aiSDK?.destroy) {
      destroyPromises.push(Promise.resolve(this.aiSDK.destroy()));
    }
    if (this.providerManagement?.destroy) {
      destroyPromises.push(Promise.resolve(this.providerManagement.destroy()));
    }
    if (this.toolsIntegration?.destroy) {
      destroyPromises.push(Promise.resolve(this.toolsIntegration.destroy()));
    }
    if (this.embeddingsIntegration?.destroy) {
      destroyPromises.push(Promise.resolve(this.embeddingsIntegration.destroy()));
    }
    if (this.settingsManagement?.destroy) {
      destroyPromises.push(Promise.resolve(this.settingsManagement.destroy()));
    }
    if (this.structuredData?.destroy) {
      destroyPromises.push(Promise.resolve(this.structuredData.destroy()));
    }

    await Promise.all(destroyPromises);

    // 清理状态
    this.removeAllListeners();
    this.initialized = false;
    this.componentHealth.clear();

    this.emit('ai_core:shutdown_complete');
  }

  /**
   * 深度合并对象
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        (result as any)[key] = this.deepMerge((target as any)[key] || {}, source[key] as any);
      } else {
        (result as any)[key] = source[key];
      }
    }

    return result;
  }

  /**
   * 检查初始化状态
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// 默认导出
export default AICoreManager;