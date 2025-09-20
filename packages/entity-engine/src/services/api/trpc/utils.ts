// Split client and server utilities to avoid leaking client/Next deps into server exports.
export { trpc } from './client';
export { createVanillaTrpcClient } from './vanilla-client';
