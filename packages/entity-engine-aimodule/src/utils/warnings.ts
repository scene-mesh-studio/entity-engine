/**
 * Entity Engine AI - Warning System
 * 
 * Global warning handling system compliant with AI SDK standards
 */

// Warning type definitions

/**
 * Warning type
 */
export type WarningType = 
  | 'unsupported-setting'
  | 'unsupported-tool'
  | 'deprecated-feature'
  | 'validation-error'
  | 'performance-warning'
  | 'unknown';

/**
 * Warning object
 */
export interface Warning {
  type: WarningType;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  source?: string;
}

/**
 * Warning handler function type
 */
export type WarningHandler = (warnings: Warning[]) => void;

// Global warning manager

/**
 * Global warning manager
 */
class WarningManager {
  private warnings: Warning[] = [];
  private handler: WarningHandler | boolean | null = null;
  private maxWarnings = 100; // Maximum warnings to prevent memory leaks

  /**
   * Initialize warning system
   */
  initialize(): void {
    // Check global configuration
    if (typeof globalThis !== 'undefined') {
      // Support AI SDK global configuration format
      const globalHandler = (globalThis as any).AI_SDK_LOG_WARNINGS;
      if (globalHandler !== undefined) {
        this.handler = globalHandler;
      } else {
        // Enable warnings by default
        this.handler = true;
      }
    } else {
      this.handler = true;
    }
  }

  /**
   * Set warning handler
   */
  setHandler(handler: WarningHandler | boolean): void {
    this.handler = handler;
  }

  /**
   * Add warning
   */
  warn(type: WarningType, message: string, details?: Record<string, any>, source?: string): void {
    const warning: Warning = {
      type,
      message,
      details,
      timestamp: Date.now(),
      source,
    };

    // Add to warning list
    this.warnings.push(warning);
    
    // Limit warning count
    if (this.warnings.length > this.maxWarnings) {
      this.warnings = this.warnings.slice(-this.maxWarnings);
    }

    // Process warning
    this.processWarning(warning);
  }

  /**
   * Process warning
   */
  private processWarning(warning: Warning): void {
    if (this.handler === false) {
      // Warnings are disabled
      return;
    }

    if (typeof this.handler === 'function') {
      // Use custom handler
      try {
        this.handler([warning]);
      } catch (error) {
        // Fallback to default handling
        this.defaultHandler([warning]);
      }
    } else {
      // Use default handler
      this.defaultHandler([warning]);
    }
  }

  /**
   * Default warning handler
   */
  private defaultHandler(warnings: Warning[]): void {
    warnings.forEach(warning => {
      const prefix = 'AI SDK Warning:';
      const message = `${prefix} ${warning.message}`;
      
    });
  }

  /**
   * Get all warnings
   */
  getWarnings(): Warning[] {
    return [...this.warnings];
  }

  /**
   * Clear warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Get warnings by type
   */
  getWarningsByType(type: WarningType): Warning[] {
    return this.warnings.filter(w => w.type === type);
  }

  /**
   * Get warning statistics
   */
  getWarningStats(): Record<WarningType, number> {
    const stats: Record<string, number> = {};
    
    this.warnings.forEach(warning => {
      stats[warning.type] = (stats[warning.type] || 0) + 1;
    });

    return stats as Record<WarningType, number>;
  }
}

// Create global instance
const warningManager = new WarningManager();

// Initialize
if (typeof globalThis !== 'undefined') {
  warningManager.initialize();
}

// Exported warning functions

/**
 * Warn about unsupported setting
 */
export function warnUnsupportedSetting(setting: string, model?: string): void {
  warningManager.warn(
    'unsupported-setting',
    `The "${setting}" setting is not supported${model ? ` by the ${model} model` : ''}`,
    { setting, model },
    'entity-engine-aiui'
  );
}

/**
 * Warn about unsupported tool
 */
export function warnUnsupportedTool(toolName: string, model?: string): void {
  warningManager.warn(
    'unsupported-tool',
    `The tool "${toolName}" is not supported${model ? ` by the ${model} model` : ''}`,
    { toolName, model },
    'entity-engine-aiui'
  );
}

/**
 * Warn about deprecated feature
 */
export function warnDeprecatedFeature(feature: string, replacement?: string): void {
  const message = `The "${feature}" feature is deprecated${replacement ? ` and will be replaced with "${replacement}"` : ''}`;
  warningManager.warn(
    'deprecated-feature',
    message,
    { feature, replacement },
    'entity-engine-aiui'
  );
}

/**
 * Warn about validation error
 */
export function warnValidationError(message: string, details?: Record<string, any>): void {
  warningManager.warn(
    'validation-error',
    message,
    details,
    'entity-engine-aiui'
  );
}

/**
 * Warn about performance issue
 */
export function warnPerformance(message: string, details?: Record<string, any>): void {
  warningManager.warn(
    'performance-warning',
    message,
    details,
    'entity-engine-aiui'
  );
}

/**
 * Emit general warning
 */
export function warn(message: string, details?: Record<string, any>): void {
  warningManager.warn(
    'unknown',
    message,
    details,
    'entity-engine-aiui'
  );
}

/**
 * Set warning handler
 */
export function setWarningHandler(handler: WarningHandler | boolean): void {
  warningManager.setHandler(handler);
}

/**
 * Get all warnings
 */
export function getWarnings(): Warning[] {
  return warningManager.getWarnings();
}

/**
 * Clear warnings
 */
export function clearWarnings(): void {
  warningManager.clearWarnings();
}

/**
 * Get warning statistics
 */
export function getWarningStats(): Record<WarningType, number> {
  return warningManager.getWarningStats();
}

// Development environment enhancements

// Provide additional functionality in development environment
if (process.env.NODE_ENV === 'development') {
  // Add warning manager to global object for debugging
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__ENTITY_ENGINE_AIUI_WARNINGS__ = {
      manager: warningManager,
      getWarnings,
      clearWarnings,
      getWarningStats,
      setWarningHandler,
    };
  }

  // Add more detailed stack tracing
  const originalWarn = warningManager.warn.bind(warningManager);
  (warningManager as any).warn = (
    type: WarningType,
    message: string,
    details?: Record<string, any>,
    source?: string
  ) => {
    const stack = new Error().stack;
    const enhancedDetails = {
      ...details,
      stack: stack?.split('\n').slice(2, 5).join('\n'), // Keep only first 3 stack levels
    };
    
    originalWarn(type, message, enhancedDetails, source);
  };
}

// Default export

export default {
  warn,
  warnUnsupportedSetting,
  warnUnsupportedTool,
  warnDeprecatedFeature,
  warnValidationError,
  warnPerformance,
  setWarningHandler,
  getWarnings,
  clearWarnings,
  getWarningStats,
};