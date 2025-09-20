// 实体相关类型定义
// 直接引用主包的类型定义，确保完全一致

// 导入主包的核心类型
import type {
    IEntityView,
    IEntityField,
    IEntityModel,
    EntityFieldType,
    IEntityViewField,
    IEntityViewPanel,
    EntityViewDensity,
    IEntityViewDelegate,
    IEntityMetaRegistry,
    IEntityViewReference,
    IEntityFieldDelegate,
    IEntityModelDelegate,
    IEntityGridViewHilite,
    IEntityViewFieldDelegate,
} from '@scenemesh/entity-engine';

// 重新导出主包的核心类型
export type {
    IEntityView,
    IEntityField,
    IEntityModel,
    EntityFieldType,
    IEntityViewField,
    IEntityViewPanel,
    EntityViewDensity,
    IEntityViewDelegate,
    IEntityMetaRegistry,
    IEntityViewReference,
    IEntityFieldDelegate,
    IEntityModelDelegate,
    IEntityGridViewHilite,
    IEntityViewFieldDelegate,
};

// Studio特有的类型定义（不与主包冲突的部分）

// Studio扩展的字段接口
export interface ExtendedEntityField extends Omit<IEntityField, 'title'> {
    // 基础字段属性（确保TypeScript知道这些属性存在）
    name: string;
    title: string; // Required for Studio
    type: EntityFieldType;
    description?: string;
    defaultValue?: any;
    isRequired?: boolean;
    isPrimaryKey?: boolean;
    isUnique?: boolean;
    editable?: boolean;
    searchable?: boolean;
    order?: number;

    // 关系字段属性
    refModel?: string;
    refField?: string;

    // 类型选项和模式 - 使用更宽松的类型来避免Zod依赖
    typeOptions?: Record<string, any>;

    // Studio特有的扩展属性
    widget?: string; // Studio特有的widget属性
    validation?: Array<{
        type: string;
        value?: any;
        message?: string;
    }>;

    // Schema相关属性 - 支持从API获取的schemaSerialized字段
    schemaSerialized?: any; // JSON Schema格式的序列化schema
    schema?: any; // 原始的Zod schema（如果存在）
}

// Studio扩展的模型接口（使用ExtendedEntityField）
export interface StudioEntityModel extends Omit<IEntityModel, 'fields'> {
    fields: ExtendedEntityField[]; // 使用扩展的字段类型，必须提供
    // Studio特有的模型扩展可以在这里添加
    id?: string; // Studio可能需要的ID字段
    createdAt?: string; // Studio特有的时间戳
    updatedAt?: string; // Studio特有的时间戳
}

// 向后兼容的类型别名
export type ExtendedEntityModel = StudioEntityModel;

// Studio的实体引擎接口（基于主包的类型）
export interface IEntityEngine {
    metaRegistry: IEntityMetaRegistry;
    componentRegistry: {
        getAdapters: () => any[];
        getViews: () => any[];
        getView: (viewName: string) => any;
    };
    fieldTyperRegistry: {
        getFieldTypers: () => any[];
        getFieldTyper: (type: string) => any;
    };
    datasourceFactory?: {
        getDataSource: () => any;
    };
    [key: string]: any;
}
