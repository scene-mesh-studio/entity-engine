/**
 * Entity Engine Studio Renderers
 *
 * 这个模块导出所有 Studio 相关的渲染器，
 * 可以在 entity-engine 中注册使用
 */

import { EntityEngineStudioLauncher } from './studio/index';

export { EntityEngineStudioLauncher };

// 导出所有 Studio 渲染器的数组，便于批量注册
export const studioRenderers = [EntityEngineStudioLauncher];
