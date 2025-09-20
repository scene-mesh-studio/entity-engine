import type { AppRouter } from '../root';

import superjson from 'superjson';
import { httpBatchLink, createTRPCClient } from '@trpc/client';

// A minimal, framework-agnostic TRPC client factory for server-side usage.
// Note: This file intentionally avoids importing any React/Next specific libs.
export function createVanillaTrpcClient(url: string) {
    return createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                url,
                transformer: superjson,
                maxURLLength: 2048, // Set a safe max URL length
            }),
        ],
    });
}
