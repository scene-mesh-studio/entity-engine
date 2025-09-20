/**
 * AI Settings Complete Integration
 * 
 * Complete settings functionality:
 * - All common setting parameters
 * - Provider-specific configurations
 * - Settings validation and presets
 * - Dynamic settings management
 */

import { z } from 'zod';
import { EventEmitter } from 'events';

import { ENTITY_ENGINE_SYSTEM_PROMPT } from './system-prompt';

// System-level unified configuration - single data source for all AI features

/**
 * AI system default configuration - manages only AI-related parameters
 * Focused on AI model and parameter configuration, excludes HTTP/network layer config
 */
export const AI_SYSTEM_DEFAULTS = {
  // Model configuration - 从环境变量读取
  defaultProvider: process.env.EEAI_MODEL_PROVIDER,
  defaultModel: process.env.EEAI_TEXT_MODELS?.split(',')[0],
  defaultEmbeddingModel: process.env.EEAI_EMBEDDING_MODELS?.split(',')[0],
  
  // AI参数默认值
  temperature: 0.7,
  maxOutputTokens: 4000,
  topP: 0.95,
  // topK: 50, // qwen模型不支持topK参数
  presencePenalty: 0,
  frequencyPenalty: 0,
  
  // 系统提示词 - 从单独文件导入
  systemPrompt: ENTITY_ENGINE_SYSTEM_PROMPT,
  
  // 功能开关
  enableTools: true,
  enableEmbeddings: true
} as const;

// ================================
// Type Definitions
// ================================

/**
 * 通用模型设置 - 基于 Settings.md 官方规范
 */
export interface CommonModelSettings {
  // 生成控制参数
  maxOutputTokens?: number;     // 最大输出令牌数
  temperature?: number;         // 温度设置 (0-1+ 取决于提供商)
  topP?: number;               // 核采样 (0-1)
  topK?: number;               // Top-K 采样
  presencePenalty?: number;    // 存在性惩罚
  frequencyPenalty?: number;   // 频率惩罚
  stopSequences?: string[];    // 停止序列
  seed?: number;               // 随机种子

  // 控制参数
  maxRetries?: number;         // 最大重试次数，默认 2
  abortSignal?: AbortSignal;   // 取消信号
  headers?: Record<string, string>; // 自定义 HTTP 头
}

/**
 * JSON值类型 - 严格按照AI SDK官方规范
 */
type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

/**
 * 提供商特定设置 - 严格按照AI SDK官方规范
 * 必须兼容SharedV2ProviderOptions类型，格式为Record<string, Record<string, JSONValue>>
 */
export interface ProviderSpecificSettings {
  // 严格按照AI SDK SharedV2ProviderOptions类型定义
  [key: string]: Record<string, JSONValue>;
}

/**
 * 完整的模型设置配置
 */
export interface ModelSettings extends CommonModelSettings {
  providerOptions?: ProviderSpecificSettings;
}

/**
 * 设置预设定义
 */
export interface SettingsPreset {
  name: string;
  description: string;
  settings: ModelSettings;
  tags?: string[];                             // 用于分类和搜索
  useCases?: string[];                         // 适用场景
}

/**
 * 设置验证结果
 */
export interface SettingsValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value: any;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    value: any;
  }>;
}

/**
 * 动态设置配置
 */
export interface DynamicSettingsConfig {
  // 基于条件的设置调整
  conditions: Array<{
    name: string;
    condition: (context: any) => boolean;
    settings: Partial<ModelSettings>;
  }>;

  // 默认设置
  default: ModelSettings;

  // 回退设置
  fallback?: ModelSettings;
}

// ================================
// Settings presets - best practices
// ================================

/**
 * 预定义的设置预设 - 基于官方文档建议和最佳实践
 */
export const BuiltinSettingsPresets: Record<string, SettingsPreset> = {
  // 确定性输出
  DETERMINISTIC: {
    name: 'Deterministic',
    description: 'Highly deterministic output with minimal randomness',
    settings: {
      temperature: 0,
      topP: 0.1,
      seed: 42,
      maxRetries: 3
    },
    tags: ['deterministic', 'consistent', 'reproducible'],
    useCases: ['data extraction', 'classification', 'structured output']
  },

  // 创意输出
  CREATIVE: {
    name: 'Creative',
    description: 'High creativity and randomness for creative tasks',
    settings: {
      temperature: 0.9,
      topP: 0.95,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1
    },
    tags: ['creative', 'diverse', 'imaginative'],
    useCases: ['creative writing', 'brainstorming', 'story generation']
  },

  // 平衡模式 - 作为系统默认设置
  BALANCED: {
    name: 'Balanced',
    description: 'Balanced creativity and consistency',
    settings: {
      temperature: 0.7,
      topP: 0.95,
      topK: 50,
      maxOutputTokens: 2048
    },
    tags: ['balanced', 'general', 'versatile'],
    useCases: ['general conversation', 'content generation', 'Q&A']
  },

  // 精确模式
  PRECISE: {
    name: 'Precise',
    description: 'Low temperature for factual and precise responses',
    settings: {
      temperature: 0.2,
      topP: 0.5,
      topK: 10,
      maxRetries: 2
    },
    tags: ['precise', 'factual', 'focused'],
    useCases: ['technical documentation', 'factual queries', 'analysis']
  },

  // 快速响应
  FAST_RESPONSE: {
    name: 'Fast Response', 
    description: 'Optimized for quick responses',
    settings: {
      maxOutputTokens: 500,
      temperature: 0.5,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(5000)
    },
    tags: ['fast', 'efficient', 'quick'],
    useCases: ['chat applications', 'real-time responses', 'mobile apps']
  },

  // 长文本生成
  LONG_FORM: {
    name: 'Long Form',
    description: 'Optimized for long-form content generation',
    settings: {
      maxOutputTokens: 4000,
      temperature: 0.8,
      presencePenalty: 0.05,
      frequencyPenalty: 0.05
    },
    tags: ['long-form', 'detailed', 'comprehensive'],
    useCases: ['articles', 'reports', 'documentation', 'essays']
  },

  // 推理模式（OpenAI 专用）
  REASONING: {
    name: 'Reasoning',
    description: 'Enhanced reasoning capabilities',
    settings: {
      temperature: 0.1,
      maxOutputTokens: 10000,
      providerOptions: {
        // 通用推理配置
        reasoning: {
          effort: 'high',
          stepByStep: true
        }
      }
    },
    tags: ['reasoning', 'analysis', 'problem-solving'],
    useCases: ['complex analysis', 'math problems', 'logical reasoning']
  },

  // 代码生成
  CODE_GENERATION: {
    name: 'Code Generation',
    description: 'Optimized for code generation tasks',
    settings: {
      temperature: 0.2,
      maxOutputTokens: 2000,
      stopSequences: ['```', 'END_CODE'],
      seed: 123
    },
    tags: ['code', 'programming', 'technical'],
    useCases: ['code generation', 'debugging', 'code review']
  }
};

// ================================
// Settings validation mode
// ================================

/**
 * 设置验证的 Zod 模式
 */
const CommonSettingsSchema = z.object({
  maxOutputTokens: z.number().int().min(1).max(100000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().min(1).max(1000).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  stopSequences: z.array(z.string()).max(10).optional(),
  seed: z.number().int().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  headers: z.record(z.string(), z.string()).optional()
});

// ================================
// Core Settings Management Class
// ================================

/**
 * AI SDK Settings 完整集成类
 */
export class AISettingsManagement extends EventEmitter {
  private initialized: boolean = false;
  private customPresets: Map<string, SettingsPreset> = new Map();
  private dynamicConfigs: Map<string, DynamicSettingsConfig> = new Map();
  private settingsHistory: Array<{ timestamp: Date; settings: ModelSettings; context?: any }> = [];

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
      this.emit('ai_settings:initializing');
      this.initialized = true;
      this.emit('ai_settings:initialized');
    } catch (error) {
      this.emit('ai_settings:initialization_failed', { error });
      throw error;
    }
  }

  // ================================
  // ⚙️ 设置验证
  // ================================

  /**
   * 验证模型设置 - 官方规范验证
   */
  validateSettings(settings: ModelSettings): SettingsValidationResult {
    const errors: Array<{ field: string; message: string; value: any }> = [];
    const warnings: Array<{ field: string; message: string; value: any }> = [];

    try {
      // 基础设置验证
      CommonSettingsSchema.parse(settings);
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            value: err.received
          });
        });
      }
    }

    // 逻辑验证和警告
    if (settings.temperature !== undefined && settings.topP !== undefined) {
      warnings.push({
        field: 'temperature/topP',
        message: 'It is recommended to set either temperature or topP, but not both',
        value: { temperature: settings.temperature, topP: settings.topP }
      });
    }

    // 停止序列验证
    if (settings.stopSequences && settings.stopSequences.length > 4) {
      warnings.push({
        field: 'stopSequences',
        message: 'Some providers may limit the number of stop sequences to 4',
        value: settings.stopSequences.length
      });
    }

    // 输出令牌数验证
    if (settings.maxOutputTokens && settings.maxOutputTokens > 8192) {
      warnings.push({
        field: 'maxOutputTokens',
        message: 'Large token counts may not be supported by all models',
        value: settings.maxOutputTokens
      });
    }

    this.emit('ai_settings:validation_completed', {
      isValid: errors.length === 0,
      errorsCount: errors.length,
      warningsCount: warnings.length
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ================================
  // Preset management
  // ================================

  /**
   * 获取所有可用预设
   */
  getAllPresets(): Record<string, SettingsPreset> {
    const allPresets = { ...BuiltinSettingsPresets };
    
    this.customPresets.forEach((preset, name) => {
      allPresets[name] = preset;
    });

    return allPresets;
  }

  /**
   * 获取特定预设
   */
  getPreset(name: string): SettingsPreset | null {
    return BuiltinSettingsPresets[name] || this.customPresets.get(name) || null;
  }

  /**
   * 创建自定义预设
   */
  createPreset(name: string, preset: SettingsPreset): void {
    const validation = this.validateSettings(preset.settings);
    if (!validation.isValid) {
      throw new Error('Invalid preset settings: ' + validation.errors.map(e => e.message).join(', '));
    }

    this.customPresets.set(name, preset);
    this.emit('ai_settings:preset_created', { name, preset });
  }

  /**
   * 根据标签搜索预设
   */
  findPresetsByTag(tag: string): SettingsPreset[] {
    const allPresets = this.getAllPresets();
    
    return Object.values(allPresets)
      .filter(preset => preset.tags?.includes(tag));
  }

  /**
   * 根据使用场景搜索预设
   */
  findPresetsByUseCase(useCase: string): SettingsPreset[] {
    const allPresets = this.getAllPresets();
    
    return Object.values(allPresets)
      .filter(preset => preset.useCases?.some(uc => 
        uc.toLowerCase().includes(useCase.toLowerCase())
      ));
  }

  // ================================
  // 🔀 动态设置管理
  // ================================

  /**
   * 注册动态设置配置
   */
  registerDynamicConfig(name: string, config: DynamicSettingsConfig): void {
    this.dynamicConfigs.set(name, config);
    this.emit('ai_settings:dynamic_config_registered', { name, config });
  }

  /**
   * 根据上下文解析动态设置
   */
  resolveDynamicSettings(configName: string, context: any): ModelSettings {
    const config = this.dynamicConfigs.get(configName);
    if (!config) {
      throw new Error('Dynamic config "' + configName + '" not found');
    }

    // 查找匹配的条件
    for (const conditionConfig of config.conditions) {
      try {
        if (conditionConfig.condition(context)) {
          const resolvedSettings = this.mergeSettings(config.default, conditionConfig.settings);
          
          this.emit('ai_settings:dynamic_settings_resolved', {
            configName,
            conditionName: conditionConfig.name,
            context,
            resolvedSettings
          });

          return resolvedSettings;
        }
      } catch (error) {
        this.emit('ai_settings:dynamic_condition_error', {
          configName,
          conditionName: conditionConfig.name,
          error
        });
      }
    }

    // 如果没有匹配的条件，使用默认设置
    return config.default;
  }

  // ================================
  // 🛠️ 设置工具方法
  // ================================

  /**
   * 合并设置对象
   */
  mergeSettings(...settingsArray: Partial<ModelSettings>[]): ModelSettings {
    const merged: ModelSettings = {};

    settingsArray.forEach(settings => {
      if (!settings) return;

      // 合并基础设置
      Object.assign(merged, settings);

      // 特殊处理 providerOptions
      if (settings.providerOptions) {
        merged.providerOptions = {
          ...merged.providerOptions,
          ...settings.providerOptions
        };
      }

      // 特殊处理数组字段
      if (settings.stopSequences) {
        merged.stopSequences = [...(merged.stopSequences || []), ...settings.stopSequences];
      }

      // 特殊处理 headers
      if (settings.headers) {
        merged.headers = {
          ...merged.headers,
          ...settings.headers
        };
      }
    });

    return merged;
  }

  /**
   * 创建提供商特定设置
   */
  createProviderSettings(
    providerId: string,
    settings: Record<string, any>
  ): { providerOptions: ProviderSpecificSettings } {
    return {
      providerOptions: {
        [providerId]: settings
      }
    };
  }

  /**
   * 创建超时设置
   */
  createTimeoutSettings(timeoutMs: number): { abortSignal: AbortSignal } {
    return {
      abortSignal: AbortSignal.timeout(timeoutMs)
    };
  }

  /**
   * 创建确定性设置
   */
  createDeterministicSettings(seed?: number): ModelSettings {
    return {
      temperature: 0,
      topP: 0.1,
      seed: seed || 42,
      maxRetries: 3
    };
  }

  /**
   * 创建创意设置
   */
  createCreativeSettings(): ModelSettings {
    return {
      temperature: 0.9,
      topP: 0.95,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1
    };
  }

  // ================================
  // Settings analysis and history
  // ================================

  /**
   * 记录设置使用历史
   */
  recordSettingsUsage(settings: ModelSettings, context?: any): void {
    this.settingsHistory.push({
      timestamp: new Date(),
      settings: { ...settings },
      context
    });

    // 保持历史记录在合理范围内
    if (this.settingsHistory.length > 1000) {
      this.settingsHistory = this.settingsHistory.slice(-1000);
    }

    this.emit('ai_settings:usage_recorded', { settings, context });
  }

  /**
   * 分析设置使用模式
   */
  analyzeSettingsUsage(): {
    totalRecords: number;
    mostUsedSettings: Array<{ setting: string; count: number }>;
    averageValues: Partial<ModelSettings>;
    timeRange: { earliest: Date; latest: Date } | null;
  } {
    if (this.settingsHistory.length === 0) {
      return {
        totalRecords: 0,
        mostUsedSettings: [],
        averageValues: {},
        timeRange: null
      };
    }

    const settingCounts: Record<string, Record<any, number>> = {};
    const numericValues: Record<string, number[]> = {};

    // 收集统计数据
    this.settingsHistory.forEach(record => {
      Object.entries(record.settings).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // 计数统计
          if (!settingCounts[key]) settingCounts[key] = {};
          const valueKey = JSON.stringify(value);
          settingCounts[key][valueKey] = (settingCounts[key][valueKey] || 0) + 1;

          // 数值统计
          if (typeof value === 'number') {
            if (!numericValues[key]) numericValues[key] = [];
            numericValues[key].push(value);
          }
        }
      });
    });

    // 计算最常用设置
    const mostUsedSettings = Object.entries(settingCounts)
      .flatMap(([setting, counts]) => 
        Object.entries(counts).map(([value, count]) => ({
          setting: setting + '=' + value,
          count
        }))
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 计算平均值
    const averageValues: Partial<ModelSettings> = {};
    Object.entries(numericValues).forEach(([key, values]) => {
      (averageValues as any)[key] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    // 时间范围
    const timestamps = this.settingsHistory.map(r => r.timestamp);
    const timeRange = {
      earliest: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      latest: new Date(Math.max(...timestamps.map(t => t.getTime())))
    };

    return {
      totalRecords: this.settingsHistory.length,
      mostUsedSettings,
      averageValues,
      timeRange
    };
  }

  // ================================
  // 🎛️ 实用方法
  // ================================

  /**
   * 获取系统默认设置 - 统一配置入口
   * 返回AI_SYSTEM_DEFAULTS作为唯一配置源
   */
  getDefaultSettings(): ModelSettings {
    return {
      temperature: AI_SYSTEM_DEFAULTS.temperature,
      maxOutputTokens: AI_SYSTEM_DEFAULTS.maxOutputTokens,
      topP: AI_SYSTEM_DEFAULTS.topP,
      // topK: AI_SYSTEM_DEFAULTS.topK, // qwen模型不支持topK参数
      presencePenalty: AI_SYSTEM_DEFAULTS.presencePenalty,
      frequencyPenalty: AI_SYSTEM_DEFAULTS.frequencyPenalty,
    };
  }

  /**
   * 获取系统级配置 - 包含所有配置项
   */
  getSystemDefaults() {
    return AI_SYSTEM_DEFAULTS;
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
    isInitialized: boolean;
    builtinPresets: number;
    customPresets: number;
    dynamicConfigs: number;
    historyRecords: number;
  } {
    return {
      isInitialized: this.initialized,
      builtinPresets: Object.keys(BuiltinSettingsPresets).length,
      customPresets: this.customPresets.size,
      dynamicConfigs: this.dynamicConfigs.size,
      historyRecords: this.settingsHistory.length
    };
  }

  /**
   * 清理历史记录
   */
  clearHistory(): void {
    this.settingsHistory = [];
    this.emit('ai_settings:history_cleared');
  }

  /**
   * 导出设置配置
   */
  exportSettings(): {
    customPresets: Record<string, SettingsPreset>;
    dynamicConfigs: Record<string, DynamicSettingsConfig>;
    history: Array<{ timestamp: Date; settings: ModelSettings; context?: any }>;
  } {
    const customPresets: Record<string, SettingsPreset> = {};
    this.customPresets.forEach((preset, name) => {
      customPresets[name] = preset;
    });

    const dynamicConfigs: Record<string, DynamicSettingsConfig> = {};
    this.dynamicConfigs.forEach((config, name) => {
      dynamicConfigs[name] = config;
    });

    return {
      customPresets,
      dynamicConfigs,
      history: [...this.settingsHistory]
    };
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.customPresets.clear();
    this.dynamicConfigs.clear();
    this.settingsHistory = [];
    this.removeAllListeners();
    this.initialized = false;
  }
}

// ================================
// Exports
// ================================

export {
  // 验证模式
  CommonSettingsSchema
};

// 默认导出
export default AISettingsManagement;