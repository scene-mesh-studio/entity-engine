// Studio类型定义 - 基于主包类型系统

import type { IEntityView, IEntityViewField } from './entities';

// ================================================================================
// 🔄 类型别名 - 基于主包类型，便于Studio使用
// ================================================================================

/**
 * Studio页面配置 - 基于主包的IEntityView
 * 添加Studio特有的属性
 */
export interface StudioPageConfig extends IEntityView {
    id: string; // Studio特有的ID字段
    createdAt?: string; // Studio特有的时间戳
    updatedAt?: string; // Studio特有的时间戳
}

/**
 * Studio页面配置项 - 基于主包的IEntityViewField
 * 添加Studio特有的属性
 */
export interface StudioPageConfigItem extends IEntityViewField {
    id: string; // Studio特有的ID字段
    hiddenWhen?: string; // Studio特有的条件显示
    showWhen?: string; // Studio特有的条件显示
    readOnlyWhen?: string; // Studio特有的条件只读
    requiredWhen?: string; // Studio特有的条件必填
}

// Studio特有的类型别名
export type PageConfig = StudioPageConfig;
export type PageConfigItem = StudioPageConfigItem;

// ================================================================================
// 🎯 Studio独有类型 - UI和工作流特有
// ================================================================================

/**
 * Studio菜单结构 - 用于构建Studio的导航菜单
 */
export interface MenuStructure {
    id: string;
    title: string;
    path?: string;
    children?: MenuStructure[];
    icon?: string;
    description?: string;
}

/**
 * Studio页面信息 - 用于页面创建和编辑工作流
 */
export interface StudioPageInfo {
    mode: 'create' | 'edit';
    modelName: string;
    viewName?: string;
    title: string;
    description?: string;
    existingViewName?: string;
}

/**
 * 新建页面表单 - Studio UI表单数据
 */
export interface NewPageForm {
    name: string;
    title: string;
    description: string;
}

/**
 * 编辑页面表单 - Studio UI表单数据
 */
export interface EditPageForm {
    selectedPage: string;
}
