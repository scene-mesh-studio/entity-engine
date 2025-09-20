import type { NextRequest } from 'next/server';

import {
  EnginePrimitiveInitializer,
  fetchEntityEntranceHandler,
} from '@scenemesh/entity-engine/server';

import { views, models } from '../../../../entity/cms-model-config';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';
// import { views, models } from 'src/entity/pet-store-config';

const init = new EnginePrimitiveInitializer({
  models,
  views,
  modules: [new EntityAIModule()],
});

const rootPath = '/api/ee';

const handler = (req: NextRequest) =>
  // console.log('Entity Engine TRPC Handler: ', req.url);
  fetchEntityEntranceHandler({
    request: req,
    endpoint: rootPath,
    initializer: init,
  });
export { handler as GET, handler as POST };
