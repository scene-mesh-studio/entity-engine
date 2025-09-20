// 导入服务层的所有功能
import * as modelService from '../services/model.service';
import { publicProcedure, createTRPCRouter } from '../trpc';
import {
    findObjectInputSchema,
    listObjectsInputSchema,
    treeObjectsInputSchema,
    countObjectsInputSchema,
    createObjectInputSchema,
    deleteObjectInputSchema,
    updateObjectInputSchema,
    updateValuesInputSchema,
    deleteObjectsInputSchema,
    findPlainConfigInputSchema,
    listWithChildrenInputSchema,
    findGroupedObjectsInputSchema,
    createObjectReferenceInputSchema,
    deleteObjectReferenceInputSchema,
    findObjectReferenceOOInputSchema,
    findOneWithReferencesInputSchema,
    deleteObjectReferencesInputSchema,
    findObjectReferencesOMInputSchema,
    createObjectReferencesInputSchema,
    findObjectReferencesCountOMInputSchema,
} from '../services/model.service';

export const modelRouter = createTRPCRouter({
    // --- Read Operations ---
    findObject: publicProcedure
        .input(findObjectInputSchema)
        .query(({ ctx, input }) => modelService.findObjectLogic(ctx, input)),

    listObjects: publicProcedure
        .input(listObjectsInputSchema)
        .query(({ ctx, input }) => modelService.listObjectsLogic(ctx, input)),

    treeObjects: publicProcedure
        .input(treeObjectsInputSchema)
        .query(({ ctx, input }) => modelService.treeObjectsLogic(ctx, input)),

    listWithChildren: publicProcedure
        .input(listWithChildrenInputSchema)
        .query(({ ctx, input }) => modelService.listWithChildrenLogic(ctx, input)),

    findOneWithReferences: publicProcedure
        .input(findOneWithReferencesInputSchema)
        .query(({ ctx, input }) => modelService.findOneWithReferencesLogic(ctx, input)),

    countObjects: publicProcedure
        .input(countObjectsInputSchema)
        .query(({ ctx, input }) => modelService.countObjectsLogic(ctx, input)),

    // --- Write Operations ---
    createObject: publicProcedure
        .input(createObjectInputSchema)
        .mutation(({ ctx, input }) => modelService.createObjectLogic(ctx, input)),

    deleteObject: publicProcedure
        .input(deleteObjectInputSchema)
        .mutation(({ ctx, input }) => modelService.deleteObjectLogic(ctx, input)),

    deleteObjects: publicProcedure
        .input(deleteObjectsInputSchema)
        .mutation(({ ctx, input }) => modelService.deleteObjectsLogic(ctx, input)),

    updateObject: publicProcedure
        .input(updateObjectInputSchema)
        .mutation(({ ctx, input }) => modelService.updateObjectLogic(ctx, input)),

    updateValues: publicProcedure
        .input(updateValuesInputSchema)
        .mutation(({ ctx, input }) => modelService.updateValuesLogic(ctx, input)),

    // --- Reference Operations ---
    findObjectReferenceOO: publicProcedure
        .input(findObjectReferenceOOInputSchema)
        .query(({ ctx, input }) => modelService.findObjectReferenceOOLogic(ctx, input)),

    findObjectReferencesOM: publicProcedure
        .input(findObjectReferencesOMInputSchema)
        .query(({ ctx, input }) => modelService.findObjectReferencesOMLogic(ctx, input)),

    findObjectReferencesCountOM: publicProcedure
        .input(findObjectReferencesCountOMInputSchema)
        .query(({ ctx, input }) => modelService.findObjectReferencesCountOMLogic(ctx, input)),

    createObjectReference: publicProcedure
        .input(createObjectReferenceInputSchema)
        .mutation(({ ctx, input }) => modelService.createObjectReferenceLogic(ctx, input)),

    createObjectReferences: publicProcedure
        .input(createObjectReferencesInputSchema)
        .mutation(({ ctx, input }) => modelService.createObjectReferencesLogic(ctx, input)),

    deleteObjectReference: publicProcedure
        .input(deleteObjectReferenceInputSchema)
        .mutation(({ ctx, input }) => modelService.deleteObjectReferenceLogic(ctx, input)),

    deleteObjectReferences: publicProcedure
        .input(deleteObjectReferencesInputSchema)
        .mutation(({ ctx, input }) => modelService.deleteObjectReferencesLogic(ctx, input)),

    findGroupedObjects: publicProcedure
        .input(findGroupedObjectsInputSchema)
        .query(({ ctx, input }) => modelService.findGroupedObjectsLogic(ctx, input)),

    findPlainConfig: publicProcedure
        .input(findPlainConfigInputSchema)
        .query(({ ctx, input }) => modelService.findPlainConfigLogic(ctx, input)),
});
