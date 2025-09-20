import { defineConfig } from 'tsup';
import path from 'path';
import alias from 'esbuild-plugin-alias';

const external = [
    'react',
    'react-dom',
    '@iconify/react',
    'lucide-react',
    '@mantine/core',
    '@mantine/hooks',
    '@mantine/notifications',
    '@mantine/modals',
    'mantine-datatable',
    '@tanstack/react-query',
    '@trpc/client',
    '@trpc/server',
    '@trpc/react-query',
    '@prisma/client',
    'zod',
    'superjson',
    'clsx',
    'react-hook-form',
    '@hookform/resolvers',
    'class-variance-authority',
    'jotai',
    '@uiw/react-json-view',
    'next-themes',
    'tailwind-merge',
    'tw-animate-css',
];

export default defineConfig([
    // UI/Client bundle
    {
        entry: ['src/index.ts'],
        format: ['esm', 'cjs'],
        outDir: 'dist',
        sourcemap: true,
        clean: false,
        dts: true,
        target: 'es2020',
        platform: 'browser',
        splitting: true,
        treeshake: false,
        external
    },
    // Server-only bundle (no shared chunks with client)
    {
        entry: ['src/server.ts'],
        format: ['esm', 'cjs'],
        outDir: 'dist',
        sourcemap: true,
        clean: false,
        dts: true,
        target: 'es2020',
        platform: 'node',
        splitting: true, // critical: avoid shared chunks leaking client deps
        treeshake: false,
        external,
    },
    {
        entry: ['src/scripts/cli.ts'],
        format: ['cjs', 'esm'],
        dts: true,
        splitting: false,
        sourcemap: true,
        clean: true,
    }

]);
