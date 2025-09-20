import type { IEntityEnginePrimitiveInitializer } from '../../../core';

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { appRouter } from '../root';
import { createTRPCContext } from '../trpc';

interface fetchEntityTrpcHandlerProps {
    request: Request;
    endpoint: string;
    initializer: IEntityEnginePrimitiveInitializer;
}

const showError = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const createContext = async (req: Request, initializer: IEntityEnginePrimitiveInitializer) =>
    createTRPCContext(
        {
            headers: req.headers,
        },
        initializer
    );

export async function fetchEntityTrpcHandler(props: fetchEntityTrpcHandlerProps) {
    const { request, endpoint, initializer } = props;

    return fetchRequestHandler({
        endpoint,
        req: request,
        router: appRouter,
        createContext: () => createContext(request, initializer),
        onError: showError
            ? ({ path, error }) => {
                  console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
              }
            : undefined,
    });
}
