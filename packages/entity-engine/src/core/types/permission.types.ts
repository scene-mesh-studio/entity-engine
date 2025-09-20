import type { IEntityObject } from '../../types';

export type EntityPermissionActionType = {
    modelName: string;
    action: 'create' | 'read' | 'update' | 'delete';
    objectId?: string;
    object?: IEntityObject;
};

export interface IEntityPermissionGuard {
    checkPermission: (action: EntityPermissionActionType) => Promise<boolean>;
}
