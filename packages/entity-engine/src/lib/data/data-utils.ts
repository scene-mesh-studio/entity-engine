import type { EntityObject, EntityObjectReference } from '@prisma/client';
import type { IEntityObject, EntityTreeNode, IEntityObjectReference } from '../../types';

export function convertRawEntityObject(
    eo: EntityObject | null | undefined
): IEntityObject | undefined | null {
    if (eo) {
        const values = (() => {
            if (!eo.values || typeof eo.values !== 'object') {
                return {};
            }
            if (Array.isArray(eo.values)) {
                return {}; // 或者根据需求处理数组
            }
            return eo.values;
        })();
        return {
            id: eo.id,
            modelName: eo.modelName,
            isDeleted: eo.isDeleted,
            createdAt: eo.createdAt,
            updatedAt: eo.updatedAt,
            values,
            // ...(typeof eo.valuesJson === 'object' && eo.valuesJson !== null ? eo.valuesJson : {})
        };
    }
    return null;
}

export function convertRawEntityReference(
    ro: EntityObjectReference | null | undefined
): IEntityObjectReference | undefined | null {
    if (ro) {
        return {
            id: ro.id,
            fromModelName: ro.fromModelName,
            fromFieldName: ro.fromFieldName,
            fromObjectId: ro.fromObjectId,
            toModelName: ro.toModelName,
            toObjectId: ro.toObjectId,
        };
    }
    return null;
}

export function convertEntityTree(
    treeNode: { parentId: string | null; children: any[]; data: any } | null
): EntityTreeNode | null {
    if (!treeNode) return null;
    return {
        children: treeNode.children
            .map((item: any) => convertEntityTree(item))
            .filter((item) => item != null),
        data: convertRawEntityObject(treeNode.data),
        parentId: treeNode.parentId,
    };
}
