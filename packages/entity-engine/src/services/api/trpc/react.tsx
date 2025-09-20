'use client';

import * as React from 'react';
import SuperJSON from 'superjson';
import { createTRPCReact } from '@trpc/react-query';
import { loggerLink, httpBatchStreamLink } from '@trpc/client';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';

import { type AppRouter } from '../root';
import { useEntityEngine } from '../../../uikit';
import { createQueryClient } from './query-client';

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
    if (typeof window === 'undefined') {
        // Server: always make a new query client
        return createQueryClient();
    }
    // Browser: use singleton pattern to keep the same query client
    clientQueryClientSingleton ??= createQueryClient();

    return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
    const engine = useEntityEngine();
    const queryClient = getQueryClient();

    const [trpcClient] = React.useState(() =>
        api.createClient({
            links: [
                loggerLink({
                    enabled: (op: any) => false,
                    // process.env.NODE_ENV === 'development' ||
                    // (op.direction === 'down' && op.result instanceof Error),
                }),
                httpBatchStreamLink({
                    transformer: SuperJSON,
                    url: engine.settings.getUrl('/trpc'), ///api/ee/trpc
                    headers: () => {
                        const headers = new Headers();
                        headers.set('x-trpc-source', 'nextjs-react');
                        return headers;
                    },
                }),
            ],
        })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <api.Provider client={trpcClient} queryClient={queryClient}>
                {props.children}
            </api.Provider>
        </QueryClientProvider>
    );
}

function getBaseUrl() {
    if (typeof window !== 'undefined') return window.location.origin;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return `http://localhost:${process.env.PORT ?? 3000}`;
}
