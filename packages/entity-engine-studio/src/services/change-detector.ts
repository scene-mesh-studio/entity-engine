import type { IEntityView, IEntityModel, IEntityField } from '../types/entities';

// ================================================================================
// SECTION 1: 类型定义
// ================================================================================

/**
 * 变更类型枚举
 */
export type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * 变更分类
 */
export type ChangeCategory = 'model' | 'view';

/**
 * 单个变更项
 */
export interface ChangeItem {
    type: ChangeType;
    category: ChangeCategory;
    target: string; // 目标对象名称
    path?: string; // 变更路径（如 fields.0.name）
    oldValue?: any;
    newValue?: any;
    description: string; // 人类可读的变更描述
    riskLevel?: 'low' | 'medium' | 'high'; // 风险级别
    impact?: string; // 影响说明
    // 字段聚合相关属性
    fieldName?: string; // 字段名称（用于字段级变更聚合）
    propertyChanges?: Array<{
        property: string;
        oldValue: any;
        newValue: any;
        description: string;
    }>; // 属性变更列表（用于聚合显示）
}

/**
 * 变更集合
 */
export interface ChangeSet {
    model: ChangeItem[];
    views: ChangeItem[];
    summary: {
        totalChanges: number;
        creates: number;
        updates: number;
        deletes: number;
        riskLevel: 'low' | 'medium' | 'high'; // 整体风险级别
    };
}

/**
 * 配置数据快照
 */
export interface ConfigSnapshot {
    model: IEntityModel | null;
    views: IEntityView[];
    timestamp: number;
}

// ================================================================================
// SECTION 2: 工具函数
// ================================================================================

/**
 * 深度比较两个对象是否相等 - 修复版本，增强变更检测精度
 */
function deepEquals(obj1: any, obj2: any, depth = 0): boolean {
    // 防止无限递归
    if (depth > 10) {
        console.warn('[ChangeDetector.deepEquals] 递归深度过大，停止比较');
        return obj1 === obj2;
    }

    // 严格相等检查
    if (obj1 === obj2) return true;

    // 处理null/undefined情况
    if (obj1 == null || obj2 == null) return obj1 === obj2;

    // 类型检查
    if (typeof obj1 !== typeof obj2) return false;

    // 基础类型直接比较
    if (typeof obj1 !== 'object') return obj1 === obj2;

    // 函数类型处理：忽略函数差异，因为React组件中函数引用经常变化
    if (typeof obj1 === 'function' && typeof obj2 === 'function') {
        // 在配置对象比较中，我们通常忽略函数属性的差异
        return true;
    }

    // 数组类型特殊处理
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        for (let i = 0; i < obj1.length; i++) {
            if (!deepEquals(obj1[i], obj2[i], depth + 1)) return false;
        }
        return true;
    }

    // 处理Date等特殊对象
    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }

    // 处理RegExp
    if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
        return obj1.toString() === obj2.toString();
    }

    // 获取对象键
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // 键数量检查
    if (keys1.length !== keys2.length) return false;

    // 优化：使用Set提高查找效率
    const keySet2 = new Set(keys2);

    // 递归比较每个键值对
    for (const key of keys1) {
        if (!keySet2.has(key)) return false;

        // 特殊处理：跳过某些不重要的属性比较
        if (key === '__proto__' || key === 'constructor') continue;

        // 忽略React组件内部状态相关的键
        if (key.startsWith('_') || key === 'key' || key === 'ref') continue;

        // 递归比较，传递深度参数
        if (!deepEquals(obj1[key], obj2[key], depth + 1)) {
            return false;
        }
    }

    return true;
}

/**
 * 获取对象的差异路径
 */
function getObjectDifferences(
    obj1: any,
    obj2: any,
    basePath = ''
): Array<{ path: string; oldValue: any; newValue: any }> {
    const differences: Array<{ path: string; oldValue: any; newValue: any }> = [];

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        if (obj1 !== obj2) {
            differences.push({ path: basePath, oldValue: obj1, newValue: obj2 });
        }
        return differences;
    }

    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of allKeys) {
        const currentPath = basePath ? `${basePath}.${key}` : key;
        const value1 = obj1?.[key];
        const value2 = obj2?.[key];

        if (!deepEquals(value1, value2)) {
            if (
                typeof value1 === 'object' &&
                typeof value2 === 'object' &&
                value1 !== null &&
                value2 !== null
            ) {
                differences.push(...getObjectDifferences(value1, value2, currentPath));
            } else {
                differences.push({ path: currentPath, oldValue: value1, newValue: value2 });
            }
        }
    }

    return differences;
}

/**
 * 评估变更的风险级别
 */
function assessRiskLevel(changes: ChangeItem[]): 'low' | 'medium' | 'high' {
    const hasDeletes = changes.some((c) => c.type === 'DELETE');
    const hasHighRiskChanges = changes.some((c) => c.riskLevel === 'high');
    const hasMediumRiskChanges = changes.some((c) => c.riskLevel === 'medium');

    if (hasDeletes || hasHighRiskChanges) return 'high';
    if (hasMediumRiskChanges) return 'medium';
    return 'low';
}

// ================================================================================
// SECTION 3: 变更检测服务
// ================================================================================

/**
 * 变更检测器
 * 负责比较配置快照并生成详细的变更报告
 */
export class ChangeDetector {
    /**
     * 检测所有变更
     */
    detectChanges(original: ConfigSnapshot, current: ConfigSnapshot): ChangeSet {
        const modelChanges = this.detectModelChanges(original.model, current.model);
        const viewChanges = this.detectViewChanges(original.views, current.views);

        const allChanges = [...modelChanges, ...viewChanges];
        const summary = this.generateSummary(allChanges);

        return {
            model: modelChanges,
            views: viewChanges,
            summary,
        };
    }

    /**
     * 检测模型变更
     */
    private detectModelChanges(
        originalModel: IEntityModel | null,
        currentModel: IEntityModel | null
    ): ChangeItem[] {
        const changes: ChangeItem[] = [];

        // 新增模型
        if (!originalModel && currentModel) {
            changes.push({
                type: 'CREATE',
                category: 'model',
                target: currentModel.name,
                description: `新增数据模型: ${currentModel.title || currentModel.name}`,
                newValue: currentModel,
                riskLevel: 'low',
            });
            return changes;
        }

        // 删除模型
        if (originalModel && !currentModel) {
            changes.push({
                type: 'DELETE',
                category: 'model',
                target: originalModel.name,
                description: `删除数据模型: ${originalModel.title || originalModel.name}`,
                oldValue: originalModel,
                riskLevel: 'high',
                impact: '删除模型将影响所有相关视图和数据',
            });
            return changes;
        }

        // 修改模型
        if (originalModel && currentModel) {
            // 基础信息变更
            const basicDifferences = getObjectDifferences(
                {
                    name: originalModel.name,
                    title: originalModel.title,
                    description: originalModel.description,
                },
                {
                    name: currentModel.name,
                    title: currentModel.title,
                    description: currentModel.description,
                }
            );

            for (const diff of basicDifferences) {
                changes.push({
                    type: 'UPDATE',
                    category: 'model',
                    target: currentModel.name,
                    path: diff.path,
                    oldValue: diff.oldValue,
                    newValue: diff.newValue,
                    description: this.formatBasicChangeDescription(
                        diff.path,
                        diff.oldValue,
                        diff.newValue,
                        currentModel.name
                    ),
                    riskLevel: diff.path === 'name' ? 'high' : 'low',
                });
            }

            // 字段变更
            const fieldChanges = this.detectFieldChanges(
                originalModel.fields || [],
                currentModel.fields || [],
                currentModel.name
            );
            changes.push(...fieldChanges);
        }

        return changes;
    }

    /**
     * 检测字段变更 - 按字段聚合变更
     */
    private detectFieldChanges(
        originalFields: IEntityField[],
        currentFields: IEntityField[],
        modelName: string
    ): ChangeItem[] {
        const changes: ChangeItem[] = [];
        const originalFieldMap = new Map(originalFields.map((f) => [f.name, f]));
        const currentFieldMap = new Map(currentFields.map((f) => [f.name, f]));

        // 检测新增字段
        for (const [fieldName, field] of currentFieldMap) {
            if (!originalFieldMap.has(fieldName)) {
                changes.push({
                    type: 'CREATE',
                    category: 'model',
                    target: modelName,
                    fieldName,
                    path: `fields.${fieldName}`,
                    description: `新增字段: ${field.title || fieldName} (${field.type})`,
                    newValue: field,
                    riskLevel: 'low',
                });
            }
        }

        // 检测删除字段
        for (const [fieldName, field] of originalFieldMap) {
            if (!currentFieldMap.has(fieldName)) {
                changes.push({
                    type: 'DELETE',
                    category: 'model',
                    target: modelName,
                    fieldName,
                    path: `fields.${fieldName}`,
                    description: `删除字段: ${field.title || fieldName}`,
                    oldValue: field,
                    riskLevel: 'high',
                    impact: '删除字段可能导致数据丢失',
                });
            }
        }

        // 检测修改字段 - 按字段聚合，智能处理Studio字段差异
        for (const [fieldName, currentField] of currentFieldMap) {
            const originalField = originalFieldMap.get(fieldName);
            if (originalField) {
                // 在比较前智能标准化原始字段，确保结构一致性
                const normalizedOriginalField = this.normalizeFieldForComparison(originalField);
                const normalizedCurrentField = this.normalizeFieldForComparison(currentField);

                if (!deepEquals(normalizedOriginalField, normalizedCurrentField)) {
                    const differences = getObjectDifferences(
                        normalizedOriginalField,
                        normalizedCurrentField
                    );

                    // 过滤掉Studio内部数据标准化产生的无意义变更
                    const meaningfulDifferences = differences.filter((diff) =>
                        this.isUserMeaningfulChange(diff.path, diff.oldValue, diff.newValue)
                    );

                    if (meaningfulDifferences.length > 0) {
                        // 聚合同一字段的所有属性变更
                        const propertyChanges = meaningfulDifferences.map((diff) => ({
                            property: diff.path,
                            oldValue: diff.oldValue,
                            newValue: diff.newValue,
                            description: this.formatFieldPropertyDescription(
                                diff.path,
                                diff.oldValue,
                                diff.newValue
                            ),
                        }));

                        // 计算整体风险级别
                        const fieldRiskLevel = this.assessFieldChangesRisk(meaningfulDifferences);

                        // 生成聚合描述
                        const aggregatedDescription = this.formatAggregatedFieldDescription(
                            currentField.title || fieldName,
                            propertyChanges
                        );

                        changes.push({
                            type: 'UPDATE',
                            category: 'model',
                            target: modelName,
                            fieldName,
                            path: `fields.${fieldName}`,
                            description: aggregatedDescription,
                            riskLevel: fieldRiskLevel,
                            propertyChanges,
                            // 保留原始的旧值和新值用于详细对比
                            oldValue: originalField,
                            newValue: currentField,
                        });
                    }
                }
            }
        }

        return changes;
    }

    /**
     * 检测视图变更
     */
    private detectViewChanges(
        originalViews: IEntityView[],
        currentViews: IEntityView[]
    ): ChangeItem[] {
        const changes: ChangeItem[] = [];
        const originalViewMap = new Map(originalViews.map((v) => [`${v.modelName}.${v.name}`, v]));
        const currentViewMap = new Map(currentViews.map((v) => [`${v.modelName}.${v.name}`, v]));

        // 检测新增视图
        for (const [viewKey, view] of currentViewMap) {
            if (!originalViewMap.has(viewKey)) {
                changes.push({
                    type: 'CREATE',
                    category: 'view',
                    target: view.name,
                    description: `新增视图: ${view.title || view.name} (${view.viewType})`,
                    newValue: view,
                    riskLevel: 'low',
                });
            }
        }

        // 检测删除视图
        for (const [viewKey, view] of originalViewMap) {
            if (!currentViewMap.has(viewKey)) {
                changes.push({
                    type: 'DELETE',
                    category: 'view',
                    target: view.name,
                    description: `删除视图: ${view.title || view.name}`,
                    oldValue: view,
                    riskLevel: 'medium',
                    impact: '删除视图可能影响菜单配置',
                });
            }
        }

        // 检测修改视图 - 应用智能比较逻辑，过滤Studio特有字段的误报
        for (const [viewKey, currentView] of currentViewMap) {
            const originalView = originalViewMap.get(viewKey);
            if (originalView) {
                // 在比较前智能标准化原始视图，确保结构一致性
                const normalizedOriginalView = this.normalizeViewForComparison(originalView);
                const normalizedCurrentView = this.normalizeViewForComparison(currentView);

                if (!deepEquals(normalizedOriginalView, normalizedCurrentView)) {
                    const differences = getObjectDifferences(
                        normalizedOriginalView,
                        normalizedCurrentView
                    );

                    // 过滤掉Studio内部数据标准化产生的无意义变更
                    const meaningfulDifferences = differences.filter((diff) =>
                        this.isUserMeaningfulChange(diff.path, diff.oldValue, diff.newValue)
                    );

                    for (const diff of meaningfulDifferences) {
                        changes.push({
                            type: 'UPDATE',
                            category: 'view',
                            target: currentView.name,
                            path: diff.path,
                            oldValue: diff.oldValue,
                            newValue: diff.newValue,
                            description: this.formatViewChangeDescription(
                                currentView.name,
                                diff.path,
                                diff.oldValue,
                                diff.newValue
                            ),
                            riskLevel: 'low',
                        });
                    }
                }
            }
        }

        return changes;
    }

    /**
     * 生成变更摘要
     */
    private generateSummary(changes: ChangeItem[]) {
        const creates = changes.filter((c) => c.type === 'CREATE').length;
        const updates = changes.filter((c) => c.type === 'UPDATE').length;
        const deletes = changes.filter((c) => c.type === 'DELETE').length;

        return {
            totalChanges: changes.length,
            creates,
            updates,
            deletes,
            riskLevel: assessRiskLevel(changes),
        };
    }

    /**
     * 格式化基础属性变更描述
     */
    private formatBasicChangeDescription(
        path: string,
        oldValue: any,
        newValue: any,
        modelName: string
    ): string {
        const pathLabels: Record<string, string> = {
            name: '模型名称',
            title: '模型标题',
            description: '模型描述',
        };

        const label = pathLabels[path] || path;
        return `修改${label}: "${oldValue}" → "${newValue}"`;
    }

    /**
     * 格式化字段属性变更描述
     */
    private formatFieldPropertyDescription(path: string, oldValue: any, newValue: any): string {
        const pathLabels: Record<string, string> = {
            title: '标题',
            type: '类型',
            isRequired: '必填',
            isPrimaryKey: '主键',
            description: '描述',
            defaultValue: '默认值',
            searchable: '可搜索',
            editable: '可编辑',
            order: '排序',
        };

        const label = pathLabels[path] || path;

        if (typeof oldValue === 'boolean' && typeof newValue === 'boolean') {
            return `${label}: ${oldValue ? '是' : '否'} → ${newValue ? '是' : '否'}`;
        }

        return `${label}: "${oldValue}" → "${newValue}"`;
    }

    /**
     * 生成聚合字段变更描述
     */
    private formatAggregatedFieldDescription(
        fieldTitle: string,
        propertyChanges: Array<{ property: string; description: string }>
    ): string {
        if (propertyChanges.length === 1) {
            return `字段 ${fieldTitle} 的${propertyChanges[0].description}`;
        }

        const changeList = propertyChanges.map((change) => change.description).join('，');
        return `字段 ${fieldTitle} 更新了 ${propertyChanges.length} 个属性：${changeList}`;
    }

    /**
     * 评估字段多项变更的整体风险级别
     */
    private assessFieldChangesRisk(
        differences: Array<{ path: string; oldValue: any; newValue: any }>
    ): 'low' | 'medium' | 'high' {
        // 检查是否有高风险变更
        const hasHighRisk = differences.some((diff) => {
            // 类型变更风险较高
            if (diff.path === 'type') return true;
            // 主键变更风险较高
            if (diff.path === 'isPrimaryKey' && diff.oldValue !== diff.newValue) return true;
            return false;
        });

        if (hasHighRisk) return 'high';

        // 检查是否有中等风险变更
        const hasMediumRisk = differences.some((diff) => {
            // 必填属性变更风险中等
            if (diff.path === 'isRequired' && diff.oldValue !== diff.newValue) return true;
            return false;
        });

        if (hasMediumRisk) return 'medium';

        return 'low';
    }

    /**
     * 格式化视图变更描述
     */
    private formatViewChangeDescription(
        viewName: string,
        path: string,
        oldValue: any,
        newValue: any
    ): string {
        const pathLabels: Record<string, string> = {
            title: '标题',
            viewType: '类型',
            canEdit: '可编辑',
            canNew: '可新增',
            canDelete: '可删除',
        };

        const label = pathLabels[path] || path;

        if (typeof oldValue === 'boolean' && typeof newValue === 'boolean') {
            return `视图 ${viewName} 的${label}: ${oldValue ? '是' : '否'} → ${newValue ? '是' : '否'}`;
        }

        return `视图 ${viewName} 的${label}: "${oldValue}" → "${newValue}"`;
    }

    /**
     * 智能标准化字段用于比较
     * 确保原始API数据和Studio数据在比较时具有相同的结构，但不修改原始值
     */
    private normalizeFieldForComparison(field: any): any {
        const result = { ...field };

        // 移除validation字段，这是过程数据，不参与变更检测
        delete result.validation;

        if (result.order === undefined) result.order = 0;
        if (result.description === undefined) result.description = '';

        // 对于boolean类型字段，只在原始数据完全缺少时才提供默认值
        if (result.isRequired === undefined) result.isRequired = false;
        if (result.searchable === undefined) result.searchable = false;
        if (result.isPrimaryKey === undefined) result.isPrimaryKey = false;
        if (result.isUnique === undefined) result.isUnique = false;
        if (result.editable === undefined) result.editable = true;

        return result;
    }

    /**
     * 智能标准化视图用于比较
     * 确保原始API视图数据和Studio视图数据在比较时具有相同的结构
     */
    private normalizeViewForComparison(view: any): any {
        const result = { ...view };

        // 为缺少的Studio特有字段提供默认值，用于公平比较
        if (result.title === undefined) result.title = view.name || '未命名视图';
        if (result.viewType === undefined) result.viewType = 'form';
        if (result.items === undefined) result.items = [];

        // 递归处理视图项
        if (result.items && Array.isArray(result.items)) {
            result.items = result.items.map((item: any) =>
                this.normalizeViewItemForComparison(item)
            );
        }

        // 对于权限字段，只在原始数据完全缺少时才提供默认值
        if (result.canEdit === undefined) result.canEdit = true;
        if (result.canNew === undefined) result.canNew = true;
        if (result.canDelete === undefined) result.canDelete = true;
        if (result.canExport === undefined) result.canExport = false;

        return result;
    }

    /**
     * 智能标准化视图项用于比较
     */
    private normalizeViewItemForComparison(item: any): any {
        const result = { ...item };

        // 保持widget相关的原有配置，不做任何默认值设置
        // widget和widgetOptions必须从视图模型中获取，不能被标准化覆盖

        // 为缺少的Studio特有字段提供默认值（但不包括widget相关字段）
        if (result.spanCols === undefined) result.spanCols = 12;
        if (result.order === undefined) result.order = 0;
        if (result.title === undefined) result.title = item.name || '';

        // 对于boolean类型属性，只在完全缺少时设置
        if (result.required === undefined) result.required = false;
        if (result.disabled === undefined) result.disabled = false;
        if (result.readonly === undefined) result.readonly = false;

        // widget和widgetOptions保持原值，不设置默认值

        return result;
    }

    /**
     * 判断变更是否为用户有意义的操作
     * 过滤掉Studio内部数据标准化产生的无意义变更
     */
    private isUserMeaningfulChange(path: string, oldValue: any, newValue: any): boolean {
        // 过滤validation字段变更，这是过程数据，不参与保存
        if (path.includes('validation') || path.endsWith('.validation')) {
            return false;
        }
        // 特别处理widgetOptions字段：防止不必要的空对象创建被识别为变更
        if (path.includes('widgetOptions') || path.endsWith('.widgetOptions')) {
            // 从undefined变为空对象{}不是有意义的变更
            if (oldValue === undefined && this.isEmptyObject(newValue)) {
                return false;
            }

            // 从空对象{}变为undefined也不是有意义的变更
            if (this.isEmptyObject(oldValue) && newValue === undefined) {
                return false;
            }

            // 只有当widgetOptions中实际有配置时，才认为是有意义的变更
            const isOldEmpty = oldValue === undefined || this.isEmptyObject(oldValue);
            const isNewEmpty = newValue === undefined || this.isEmptyObject(newValue);

            if (isOldEmpty && isNewEmpty) {
                return false;
            }

            // 有实际内容变更才是有意义的
            return !this.areEquivalentWidgetOptions(oldValue, newValue);
        }

        // 特别处理widget相关字段：这些是用户有意义的配置变更
        if (
            path.includes('widget') ||
            (path.includes('items.') && (path.includes('.widget') || path.endsWith('.widget')))
        ) {
            // 区分真正的系统初始化 vs 用户操作
            // 只有当从undefined变为有效widget时，才需要进一步判断是否为系统初始化
            if (oldValue === undefined && typeof newValue === 'string' && newValue.length > 0) {
                // 如果是items字段的widget变更，很可能是用户在字段编辑器中的操作
                const isItemsFieldChange = /^items\.\d+\.widget$/.test(path);

                if (isItemsFieldChange) {
                    // 对于items中的字段widget变更，默认认为是用户操作
                    return true;
                }

                // 非items字段的widget初始化，可能确实是系统初始化
                return false;
            }

            // 其他所有widget变更情况（包括从字符串到字符串的变更），都认为是用户操作
            if (oldValue !== newValue) {
                return true; // 这是用户真正的变更
            }

            return false; // 值没有变化
        }

        // 1. 过滤掉从有值到undefined的变更（通常是数据标准化问题）
        if (oldValue !== null && oldValue !== undefined && newValue === undefined) {
            return false;
        }

        // 2. 过滤掉从undefined到默认值的变更（Studio字段初始化）
        if (oldValue === undefined && this.isStudioDefaultValue(path, newValue)) {
            return false;
        }

        // 3. 对于对象类型，如果从'[object Object]'字符串转为undefined，通常是序列化问题
        if (
            typeof oldValue === 'string' &&
            oldValue.includes('[object Object]') &&
            newValue === undefined
        ) {
            return false;
        }

        // 4. 对于boolean类型，从字符串"false"/"true"到undefined的变更，通常是数据类型不一致
        if ((oldValue === 'false' || oldValue === 'true') && newValue === undefined) {
            return false;
        }

        // 5. 过滤掉相同值的变更（可能由于数据类型转换导致）
        if (this.areEquivalentValues(oldValue, newValue)) {
            return false;
        }

        // 6. 其他变更认为是有意义的用户操作
        return true;
    }

    /**
     * 检查是否为空对象
     */
    private isEmptyObject(obj: any): boolean {
        if (obj === null || obj === undefined) return false;
        if (typeof obj !== 'object') return false;
        return Object.keys(obj).length === 0;
    }

    /**
     * 检查两个widgetOptions是否等价
     */
    private areEquivalentWidgetOptions(options1: any, options2: any): boolean {
        // 都为undefined或null
        if (options1 == null && options2 == null) return true;

        // 都为空对象
        if (this.isEmptyObject(options1) && this.isEmptyObject(options2)) return true;

        // 一个为undefined/null，另一个为空对象，视为等价
        if (
            (options1 == null && this.isEmptyObject(options2)) ||
            (this.isEmptyObject(options1) && options2 == null)
        ) {
            return true;
        }

        // 使用深度比较检查实际内容
        return deepEquals(options1, options2);
    }

    /**
     * 判断两个值是否在业务逻辑上等价（即使数据类型不同）
     */
    private areEquivalentValues(value1: any, value2: any): boolean {
        // 严格相等
        if (value1 === value2) return true;

        // 布尔值和字符串表示的等价性
        if ((value1 === true && value2 === 'true') || (value1 === false && value2 === 'false')) {
            return true;
        }
        if ((value1 === 'true' && value2 === true) || (value1 === 'false' && value2 === false)) {
            return true;
        }

        // 数字和字符串表示的等价性
        if (typeof value1 === 'number' && typeof value2 === 'string' && String(value1) === value2) {
            return true;
        }
        if (typeof value1 === 'string' && typeof value2 === 'number' && value1 === String(value2)) {
            return true;
        }

        // 空值的等价性（null, undefined, 空字符串）
        const isEmptyValue = (val: any) => val === null || val === undefined || val === '';
        if (isEmptyValue(value1) && isEmptyValue(value2)) {
            return true;
        }

        return false;
    }

    /**
     * 判断是否为Studio字段的默认值
     */
    private isStudioDefaultValue(path: string, value: any): boolean {
        const defaultValues: Record<string, any> = {
            order: 0,
            description: '',
            isRequired: false,
            searchable: false,
            isPrimaryKey: false,
            isUnique: false,
            editable: true,
            spanCols: 12,
            required: false,
            disabled: false,
            readonly: false,
        };

        return (
            Object.prototype.hasOwnProperty.call(defaultValues, path) &&
            defaultValues[path] === value
        );
    }
}

// ================================================================================
// SECTION 4: 导出
// ================================================================================

// 创建单例实例
export const changeDetector = new ChangeDetector();
