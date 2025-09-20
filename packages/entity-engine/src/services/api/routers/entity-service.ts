import * as modelService from '../services/model.service';
import { publicProcedure, createTRPCRouter } from '../trpc';
// 导入服务层的所有功能
import { handleActionInputSchema } from '../services/model.service';

export const serviceRouter = createTRPCRouter({
    handleAction: publicProcedure
        .input(handleActionInputSchema)
        .query(({ ctx, input }) => modelService.handleActionLogic(ctx, input)),
});
