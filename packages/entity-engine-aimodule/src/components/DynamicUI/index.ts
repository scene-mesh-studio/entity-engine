/**
 * Dynamic UI Components Export - Entity Engine Integration
 * 
 * Dynamic UI system integrated with Entity Engine standard components:
 * - Standard component implementation
 * - Uses Entity Engine grid and form components
 * - Clean and focused on data display
 */

// 主要动态工具渲染器
export { DynamicToolRenderer } from './DynamicToolRenderer';

// Entity Engine集成组件
export {
  ENTITY_DYNAMIC_COMPONENTS,
  DynamicEntityGridComponent,
  DynamicEntityFormComponent,
  DynamicEntityKanbanComponent,
  DynamicEntityMastailComponent,
  DynamicEntityDashboardComponent
} from './EntityEngineDynamicComponents';

// 类型导出
export type {
  DynamicEntityGridProps,
  DynamicEntityFormProps,
  DynamicEntityKanbanProps,
  DynamicEntityMastailProps,
  EntityDynamicComponentType,
  DynamicEntityComponentProps,
  DynamicEntityDashboardProps
} from './EntityEngineDynamicComponents';