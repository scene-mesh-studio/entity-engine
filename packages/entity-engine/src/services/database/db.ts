import type { IEntityEventRegistry } from '../../core';

import { PrismaClient } from '@prisma/client';

const extendsClient = (client: PrismaClient, eventRegistry?: IEntityEventRegistry) => {
    const extendedClient = client.$extends({
        name: 'entity-engine-extensions',
        query: {
            entityObject: {
                update: async ({ args, query }: any) => {
                    const result = await query(args);
                    eventRegistry?.emit({
                        name: 'entityObject.updated',
                        parameter: { id: args.where.id, values: args.data },
                    });
                    // console.log('Prisma Client Extension: update result:', result);
                    return result;
                },
                delete: async ({ args, query }: any) => {
                    const result = await query(args);
                    eventRegistry?.emit({
                        name: 'entityObject.deleted',
                        parameter: { id: args.where.id },
                    });
                    // console.log('Prisma Client Extension: delete result:', result);
                    return result;
                },
                deleteMany: async ({ args, query }: any) => {
                    const result = await query(args);
                    eventRegistry?.emit({
                        name: 'entityObject.deletedMany',
                        parameter: { filter: args.where },
                    });
                    // console.log('Prisma Client Extension: deleteMany result:', result);
                    return result;
                },
                create: async ({ args, query }: any) => {
                    const result = await query(args);
                    eventRegistry?.emit({
                        name: 'entityObject.created',
                        parameter: { id: result.id, values: args.data },
                    });
                    // console.log('Prisma Client Extension: create result:', result);
                    return result;
                },
            },
        },
    });

    return extendedClient as PrismaClient;
};

const createPrismaClient = (eventRegistry?: IEntityEventRegistry) => {
    const client = new PrismaClient({
        errorFormat: 'pretty',
    });

    return extendsClient(client, eventRegistry);
};

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// export const db = globalForPrisma.prisma ?? createPrismaClient();

// // if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// globalForPrisma.prisma = db;

export const getDatabaseClient = (eventRegistry?: IEntityEventRegistry) => {
    const database = globalForPrisma.prisma ?? createPrismaClient(eventRegistry);
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = database;
    }
    return database;
};
