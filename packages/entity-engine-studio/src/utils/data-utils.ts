/**
 * 数据工具函数 - 支持Studio数据管理器
 * 包含基础数据操作和数据完整性验证
 */

import type { IEntityModel } from '../types/entities';

/**
 * 深度比较两个对象是否相等
 */
export function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (a == null || b == null) return a === b;

    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return a === b;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;

    if (obj instanceof Date) return new Date(obj.getTime()) as any;

    if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as any;

    const cloned = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }

    return cloned;
}

// ==================== 数据完整性验证 ====================

export interface DataIntegrityReport {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    statistics: {
        originalFieldCount: number;
        currentFieldCount: number;
        lostFields: string[];
        addedFields: string[];
        modifiedFields: string[];
    };
}

/**
 * 验证数据完整性
 */
export function validateDataIntegrity(
    originalModel: IEntityModel | null,
    currentModel: IEntityModel | null,
    context: string = 'unknown'
): DataIntegrityReport {
    const report: DataIntegrityReport = {
        isValid: true,
        errors: [],
        warnings: [],
        statistics: {
            originalFieldCount: 0,
            currentFieldCount: 0,
            lostFields: [],
            addedFields: [],
            modifiedFields: [],
        },
    };

    // 如果都是null，认为是有效的
    if (!originalModel && !currentModel) {
        return report;
    }

    // 如果只有一个为null，可能是新建或删除场景
    if (!originalModel && currentModel) {
        report.statistics.currentFieldCount = currentModel.fields?.length || 0;
        return report; // 新建场景，认为是有效的
    }

    if (originalModel && !currentModel) {
        report.errors.push(`数据模型在 ${context} 中被意外删除`);
        report.isValid = false;
        return report;
    }

    // 两个都存在，进行详细对比
    const original = originalModel!;
    const current = currentModel!;

    report.statistics.originalFieldCount = original.fields?.length || 0;
    report.statistics.currentFieldCount = current.fields?.length || 0;

    // 检查字段完整性
    if (original.fields && current.fields) {
        const originalFieldMap = new Map(original.fields.map((f) => [f.name, f]));
        const currentFieldMap = new Map(current.fields.map((f) => [f.name, f]));

        // 检查丢失的字段
        for (const [fieldName] of originalFieldMap) {
            if (!currentFieldMap.has(fieldName)) {
                report.statistics.lostFields.push(fieldName);
                report.errors.push(`字段 "${fieldName}" 在 ${context} 中丢失`);
                report.isValid = false;
            }
        }

        // 检查新增的字段
        for (const [fieldName] of currentFieldMap) {
            if (!originalFieldMap.has(fieldName)) {
                report.statistics.addedFields.push(fieldName);
            }
        }

        // 检查修改的字段（简单检查）
        for (const [fieldName, currentField] of currentFieldMap) {
            const originalField = originalFieldMap.get(fieldName);
            if (originalField && !deepEqual(originalField, currentField)) {
                report.statistics.modifiedFields.push(fieldName);
            }
        }
    }

    // 检查基本属性
    if (original.name !== current.name) {
        report.warnings.push(`模型名称从 "${original.name}" 变更为 "${current.name}"`);
    }

    if (original.title !== current.title) {
        report.warnings.push(`模型标题从 "${original.title}" 变更为 "${current.title}"`);
    }

    return report;
}
