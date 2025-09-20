/**
 * Studio保存服务
 * 负责将Studio的配置数据保存到主包API
 */

import type { IEntityView, IEntityModel } from '../types/entities';

import { directAPIService, type APIModelResponse } from './direct-api-service';

export interface StudioSaveData {
    model: IEntityModel;
    views: IEntityView[];
    _incrementalChanges?: any;
    _changesSummary?: any;
    _isIncremental?: boolean;
}

export interface SaveResult {
    success: boolean;
    message?: string;
    error?: string;
    savedData?: {
        model?: APIModelResponse;
        views?: any[];
    };
}

/**
 * Studio保存服务类
 */
export class StudioSaveService {
    /**
     * 保存Studio配置到主包API
     */
    async save(saveData: StudioSaveData): Promise<SaveResult> {
        try {
            console.log('[StudioSaveService] 开始保存Studio配置...');

            // 🔧 数据清理和转换：确保数据格式符合API要求
            const cleanedModel = this.cleanModelForAPI(saveData.model);
            const cleanedViews = this.cleanViewsForAPI(saveData.views);

            // 数据清理完成

            // 🚀 调用DirectAPI保存
            const apiSaveData = {
                model: cleanedModel,
                views: cleanedViews,
                _isIncremental: saveData._isIncremental,
                _incrementalChanges: saveData._incrementalChanges,
                _changesSummary: saveData._changesSummary,
            };

            const result = await directAPIService.saveMetaData(apiSaveData);

            if (!result.success) {
                return {
                    success: false,
                    error: result.message || '保存失败',
                };
            }

            console.log('[StudioSaveService] 保存成功');

            return {
                success: true,
                message: result.message || '配置保存成功',
                savedData: {
                    model: cleanedModel,
                    views: cleanedViews,
                },
            };
        } catch (error) {
            console.error('[StudioSaveService] 保存过程中发生错误:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : '保存过程中发生未知错误',
            };
        }
    }

    /**
     * 清理模型数据用于API提交
     */
    private cleanModelForAPI(model: IEntityModel): APIModelResponse {
        // 清理模型数据

        // 移除Studio特有的字段，只保留API需要的字段
        const cleanedModel: APIModelResponse = {
            name: model.name,
            title: model.title,
            description: model.description,
            fields:
                model.fields?.map((field) => {
                    // 🔧 关键：移除validation字段，只保留schemaSerialized
                    const { ...cleanField } = field as any;

                    // 构建API字段格式
                    const apiField = {
                        name: cleanField.name,
                        title: cleanField.title,
                        type: cleanField.type,
                        description: cleanField.description,
                        defaultValue: cleanField.defaultValue,
                        isRequired: cleanField.isRequired,
                        isPrimaryKey: cleanField.isPrimaryKey,
                        isUnique: cleanField.isUnique,
                        editable: cleanField.editable,
                        searchable: cleanField.searchable,
                        refModel: cleanField.refModel,
                        refField: cleanField.refField,
                        order: cleanField.order,
                        typeOptions: cleanField.typeOptions,
                        // 🎯 关键：保留schemaSerialized用于校验规则
                        schemaSerialized: cleanField.schemaSerialized,
                    };

                    // 字段清理完成

                    return apiField;
                }) || [],
        };

        // 模型数据清理完成

        return cleanedModel;
    }

    /**
     * 清理视图数据用于API提交
     */
    private cleanViewsForAPI(views: IEntityView[]): any[] {
        // 清理视图数据

        return views.map((view) => {
            // 移除Studio特有的字段和方法，只保留API需要的数据
            const cleanedView = {
                name: view.name,
                title: view.title,
                description: view.description,
                modelName: view.modelName,
                viewType: view.viewType,
                viewOptions: view.viewOptions,
                canEdit: view.canEdit,
                canNew: view.canNew,
                canDelete: view.canDelete,
                canExport: (view as any).canExport,
                density: (view as any).density,
                items:
                    view.items?.map((item) => ({
                        name: item.name,
                        title: item.title,
                        spanCols: item.spanCols,
                        order: item.order,
                        required: (item as any).required,
                        disabled: (item as any).disabled,
                        readonly: (item as any).readonly,
                        widget: (item as any).widget,
                        widgetOptions: (item as any).widgetOptions,
                    })) || [],
                hilites: (view as any).hilites,
            };

            // 视图清理完成

            return cleanedView;
        });
    }

    /**
     * 验证保存数据的完整性
     */
    validateSaveData(saveData: StudioSaveData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 验证模型
        if (!saveData.model) {
            errors.push('缺少模型数据');
        } else {
            if (!saveData.model.name) {
                errors.push('模型名称不能为空');
            }
            if (!saveData.model.title) {
                errors.push('模型标题不能为空');
            }
        }

        // 验证视图（可选）
        if (saveData.views) {
            saveData.views.forEach((view, index) => {
                if (!view.name) {
                    errors.push(`视图 ${index} 的名称不能为空`);
                }
                if (!view.modelName) {
                    errors.push(`视图 ${index} 缺少关联的模型名称`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

// 导出单例
export const studioSaveService = new StudioSaveService();
