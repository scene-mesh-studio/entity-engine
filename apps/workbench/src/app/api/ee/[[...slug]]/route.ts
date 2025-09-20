import type { NextRequest } from 'next/server';

import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';
import {
  EnginePrimitiveInitializer,
  fetchEntityEntranceHandler,
} from '@scenemesh/entity-engine/server';

import { views, models } from 'src/entity/model-config';
// import { views, models } from 'src/entity/pet-store-config';

// 确保AI模块单例在服务器启动时就创建
const aiModule = new EntityAIModule();
console.log('🚀 Server: AI Module instance created at startup');

const init = new EnginePrimitiveInitializer({
  models,
  views,
  modules: [aiModule],
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
