/**
 * 直接HTTP API客户端
 */

export interface APIModelResponse {
    name: string;
    title: string;
    description?: string;
    fields: APIFieldResponse[];
}

export interface APIFieldResponse {
    name: string;
    title: string;
    type: string;
    description?: string;
    defaultValue?: any;
    isRequired?: boolean;
    isPrimaryKey?: boolean;
    isUnique?: boolean;
    editable?: boolean;
    searchable?: boolean;
    refModel?: string;
    refField?: string;
    order?: number;
    typeOptions?: Record<string, any>;
    schemaSerialized?: any; // 关键字段
    validation?: Array<{
        type: string;
        value?: any;
        message?: string;
    }>;
}

/**
 * 直接HTTP API服务
 */
export class DirectAPIService {
    private baseUrl = 'http://localhost:8082/api/ee/services/meta';

    /**
     * 直接从API获取模型列表
     */
    async fetchModels(): Promise<APIModelResponse[]> {
        try {
            console.log('[DirectAPIService] 获取模型列表');
            const response = await fetch(`${this.baseUrl}/models/`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // API响应已接收

            // 🔧 修复：处理API包装格式 {target, result, success}
            let actualData: any;

            if (data && typeof data === 'object') {
                // 检查是否为包装格式
                if (data.success !== undefined && data.result !== undefined) {
                    // 检测到包装格式，提取result字段
                    if (!data.success) {
                        throw new Error(`API请求失败: ${data.error || 'Unknown error'}`);
                    }
                    actualData = data.result;
                } else {
                    actualData = data;
                }
            } else {
                actualData = data;
            }

            // 验证提取的数据格式
            if (!Array.isArray(actualData)) {
                console.warn('[DirectAPIService] 提取的数据不是数组，尝试进一步提取:', actualData);
                // 检查常见的数据包装属性
                if (actualData && typeof actualData === 'object') {
                    if (actualData.models && Array.isArray(actualData.models)) {
                        actualData = actualData.models;
                    } else if (actualData.data && Array.isArray(actualData.data)) {
                        actualData = actualData.data;
                    } else if (actualData.items && Array.isArray(actualData.items)) {
                        actualData = actualData.items;
                    } else {
                        throw new Error(
                            '无法解析API返回的数据格式，期望数组但得到: ' + typeof actualData
                        );
                    }
                } else {
                    throw new Error('API返回的数据格式不正确，期望对象或数组');
                }
            }

            console.log(`[DirectAPIService] 模型数量: ${actualData.length}`);
            return actualData;
        } catch (error) {
            console.error('[DirectAPIService] 获取模型失败:', error);
            throw error;
        }
    }

    /**
     * 根据名称获取单个模型
     */
    async fetchModel(modelName: string): Promise<APIModelResponse | null> {
        try {
            console.log(`[DirectAPIService] 获取模型: ${modelName}`);
            const response = await fetch(`${this.baseUrl}/models/${encodeURIComponent(modelName)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // 模型原始响应已接收

            // 🔧 修复：处理API包装格式 {target, result, success}
            let actualData: any;

            if (data && typeof data === 'object') {
                // 检查是否为包装格式
                if (data.success !== undefined && data.result !== undefined) {
                    // 检测到包装格式，提取result字段
                    if (!data.success) {
                        throw new Error(`API请求失败: ${data.error || 'Unknown error'}`);
                    }
                    actualData = data.result;
                } else {
                    actualData = data;
                }
            } else {
                actualData = data;
            }

            // 模型解析完成
            return actualData;
        } catch (error) {
            console.error(`[DirectAPIService] 获取模型 ${modelName} 失败:`, error);
            throw error;
        }
    }

    /**
     * 检查API连接状态
     */
    async checkConnection(): Promise<{ connected: boolean; error?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/status`, {
                method: 'GET',
                timeout: 5000,
            } as any);

            return { connected: response.ok };
        } catch (error) {
            console.warn('[DirectAPIService] API连接检查失败:', error);
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * 保存模型和视图配置到API
     */
    async saveMetaData(saveData: {
        model?: APIModelResponse;
        models?: APIModelResponse[];
        views?: any[];
        _isIncremental?: boolean;
        _incrementalChanges?: any;
        _changesSummary?: any;
    }): Promise<{ success: boolean; message?: string }> {
        try {
            console.log('[DirectAPIService] 保存元数据');

            // 构建请求体，遵循主包API期望的格式
            const requestBody: any = {};

            // 🔧 处理模型数据：支持单个模型或多个模型
            if (saveData.model) {
                // 单个模型的情况
                requestBody.models = [saveData.model];
            } else if (saveData.models) {
                // 多个模型的情况
                requestBody.models = saveData.models;
            }

            // 🔧 处理视图数据
            if (saveData.views && saveData.views.length > 0) {
                requestBody.views = saveData.views;
            }

            // 🔧 附带增量信息用于调试和优化
            if (saveData._isIncremental) {
                requestBody._meta = {
                    isIncremental: true,
                    incrementalChanges: saveData._incrementalChanges,
                    changesSummary: saveData._changesSummary,
                };
            }

            // 请求体已构建

            // 发送POST请求到主包API - 使用update端点（带尾部斜杠）
            const response = await fetch(`${this.baseUrl}/update/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            // 保存响应状态已接收

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
            }

            const responseData = await response.json();

            // 🔧 处理API包装格式响应
            let actualResult: any = responseData;
            if (responseData && typeof responseData === 'object') {
                if (responseData.success !== undefined && responseData.result !== undefined) {
                    if (!responseData.success) {
                        throw new Error(`保存失败: ${responseData.message || 'Unknown error'}`);
                    }
                    actualResult = responseData.result;
                }
            }

            console.log('[DirectAPIService] 保存成功');

            return {
                success: true,
                message: actualResult?.message || '保存成功',
            };
        } catch (error) {
            console.error('[DirectAPIService] 保存元数据失败:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : '保存失败',
            };
        }
    }

    /**
     * 获取视图列表
     */
    async fetchViews(): Promise<any[]> {
        try {
            console.log('[DirectAPIService] 获取视图列表');
            const response = await fetch(`${this.baseUrl}/views/`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // 视图API响应已接收

            // 🔧 修复：处理API包装格式 {target, result, success}
            let actualData: any;

            if (data && typeof data === 'object') {
                if (data.success !== undefined && data.result !== undefined) {
                    // 检测到包装格式，提取result字段
                    if (!data.success) {
                        throw new Error(`API请求失败: ${data.error || 'Unknown error'}`);
                    }
                    actualData = data.result;
                } else {
                    actualData = data;
                }
            } else {
                actualData = data;
            }

            // 确保返回数组
            if (!Array.isArray(actualData)) {
                console.warn('[DirectAPIService] 视图数据不是数组格式:', actualData);
                return [];
            }

            console.log(`[DirectAPIService] 视图数量: ${actualData.length}`);
            return actualData;
        } catch (error) {
            console.error('[DirectAPIService] 获取视图失败:', error);
            return [];
        }
    }

    /**
     * 设置API基础URL
     */
    setBaseUrl(url: string) {
        this.baseUrl = url.replace(/\/+$/, ''); // 移除尾部斜杠
        // 基础URL已更新
    }
}

// 导出单例
export const directAPIService = new DirectAPIService();
