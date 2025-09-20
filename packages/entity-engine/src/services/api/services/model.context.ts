import type { ApiContext } from './model.service';
import type { IEntityEnginePrimitiveInitializer } from '../../../core';

import { getDatabaseClient } from '../../database';
import { getEntityEnginePrimitive } from '../../../core/engine/engine.primitive';

export async function createModelContext(
    init?: IEntityEnginePrimitiveInitializer
): Promise<ApiContext> {
    const engine = await getEntityEnginePrimitive(init);
    const db = await getDatabaseClient(engine.eventRegistry);
    return { db, engine };
}
