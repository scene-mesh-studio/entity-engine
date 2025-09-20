/**
 * Entity Engine AI Module - Main Entry Point
 * 
 * Complete AI integration with core services and UI components.
 */

// Core Module Exports

// UI components and hooks - commented out to avoid server-side React imports
// export * from './ui';

// 导出所有核心AI功能
export * from './core';

// UI Module Exports (conditional)

export * from './utils';

// Utility Exports

export * from './types';


// ================================
// 🎯 插件集成导出 - Plugin Integration Exports
// ================================

// 新增Entity Module导出
export { EntityAIModule } from './entity-module/ai.module';

// Entity Module Integration

// Renderers are dynamically loaded in ai.module.ts to avoid server-side React imports

// Convenience creation function
export async function createEntityAIModule() {
  const { EntityAIModule } = await import('./entity-module/ai.module');
  return new EntityAIModule();
}

// Note: AIEngineProvider removed, use ChatDialog component directly

// Version Information

export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@scenemesh/entity-engine-aimodule';
export const AI_SDK_COMPATIBLE_VERSION = '^5.0.10';

// Main Factory Function

/**
 * Create a complete AI core instance with optional configuration
 */
export async function createaimodule(config?: {
  // 核心配置
  providers?: import('./core/ai-provider').CustomProviderConfig[];
  settings?: Partial<import('./core/ai-settings').ModelSettings>;
  enableEmbeddings?: boolean;
  enableTools?: boolean;
}): Promise<{
  // 核心功能
  core: {
    aiSDK: import('./core/ai-core').AISDKIntegration;
    providerManagement: import('./core/ai-provider').AIProviderManagement;
    toolsIntegration: import('./core/ai-tools').AIToolsIntegration;
    embeddingsIntegration: import('./core/ai-embeddings').AIEmbeddingsIntegration;
    settingsManagement: import('./core/ai-settings').AISettingsManagement;
    structuredData: import('./core/ai-structured').AIStructuredDataIntegration;
  };
  
  // 便捷API
  api: {
    generateText: (options: import('./core/ai-core').GenerateTextOptions) => Promise<import('./core/ai-core').GenerateResult>;
    streamText: (options: import('./core/ai-core').StreamTextOptions) => import('./core/ai-core').StreamResult;
    generateObject: (options: import('./core/ai-structured').GenerateObjectOptions<any>) => Promise<import('./core/ai-structured').GenerateObjectResultType<any>>;
    streamObject: (options: import('./core/ai-structured').StreamObjectOptions<any>) => import('./core/ai-structured').StreamObjectResultType<any>;
  };
}> {
  // 导入核心模块
  const { createAICore } = await import('./core');
  
  // 创建核心实例
  const core = await createAICore({
    providers: config?.providers,
    settings: config?.settings,
    enableEmbeddings: config?.enableEmbeddings,
    enableTools: config?.enableTools
  });
  
  // 创建便捷API
  const api = {
    generateText: (options: any) => 
      core.aiSDK.generateText(options),
    streamText: (options: any) => 
      core.aiSDK.streamText(options),
    generateObject: (options: any) => 
      core.structuredData.generateObject(options),
    streamObject: (options: any) => 
      core.structuredData.streamObject(options),
  };
  
  return {
    core,
    api
  };
}

// ================================
// 🎯 快速启动函数 - Quick Start Functions
// ================================

/**
 * 快速创建AI实例（仅核心功能）
 * Quick create AI instance (core only)
 */
export async function createQuickAI(providers?: import('./core/ai-provider').CustomProviderConfig[]) {
  return createaimodule({
    providers,
    enableEmbeddings: true,
    enableTools: true
  });
}


/**
 * 向后兼容的默认导出包含所有主要功能
 * Backward compatible default export with all main functionality
 */
export const EntityEngineAIModule = {
  // 工厂函数
  create: createaimodule,
  createQuick: createQuickAI,
  
  // 版本信息
  VERSION,
  PACKAGE_NAME,
  AI_SDK_COMPATIBLE_VERSION,
  
  // 核心类导出（用于高级使用）
  Core: {
    AIProviderManagement: import('./core/ai-provider').then(m => m.AIProviderManagement),
    AISDKIntegration: import('./core/ai-core').then(m => m.AISDKIntegration),
    AIToolsIntegration: import('./core/ai-tools').then(m => m.AIToolsIntegration),
    AIEmbeddingsIntegration: import('./core/ai-embeddings').then(m => m.AIEmbeddingsIntegration),
    AISettingsManagement: import('./core/ai-settings').then(m => m.AISettingsManagement),
    AIStructuredDataIntegration: import('./core/ai-structured').then(m => m.AIStructuredDataIntegration),
  }
};