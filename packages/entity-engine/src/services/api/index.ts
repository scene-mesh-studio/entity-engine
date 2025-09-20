// Server-safe exports
export * from './utils';
export * from './trpc/trcp.handler';
// Client-only helpers (Next.js/React). Do NOT import this from server code.
// Keeping it exported for UI package consumers only.
export { trpc } from './trpc/client';

export * from './services/model.handler';
