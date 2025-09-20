import type { AppRouter } from '../root';

import superjson from 'superjson';
import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';

function getBaseUrl() {
    if (typeof window !== 'undefined') return '';
    return `http://localhost:${process.env.PORT ?? 8082}`;
}

export const trpc = createTRPCNext<AppRouter>({
    config() {
        return {
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/ee/trpc`,
                    transformer: superjson,
                    async headers() {
                        return {};
                    },
                }),
            ],
        };
    },
    ssr: false,
    transformer: superjson,
});
