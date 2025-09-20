# ReferenceEditMMComp 组件实现文档

## 概述

`ReferenceEditMMComp` 是用于编辑多对多引用关系的React组件，它提供了一个完整的用户界面来管理实体之间的关系。

## 功能特性

- ✅ 显示现有引用关系的数量
- ✅ 通过模态对话框管理引用关系
- ✅ 搜索和选择可用的引用对象
- ✅ 批量删除引用关系
- ✅ 实时更新和错误处理
- ✅ 只读模式支持
- ✅ 完全的TypeScript类型支持

## 实现细节

### 数据层扩展

1. **IEntityDataSource接口扩展** (`src/types/data.types.ts`)
   ```typescript
   // 新增方法
   createReference(sourceId: string, targetId: string, fieldName: string): Promise<any>;
   deleteReference(sourceId: string, targetId: string, fieldName: string): Promise<any>;
   deleteReferences(sourceId: string, fieldName: string): Promise<any>;
   ```

2. **tRPC数据源实现** (`src/core/datasources/trpc.datasource.ts`)
   - 实现了上述三个新方法
   - 处理API调用和错误处理

### 服务层实现

1. **模型服务** (`src/services/api/services/model.service.ts`)
   ```typescript
   // 新增逻辑函数
   createObjectReferenceLogic()
   deleteObjectReferenceLogic() 
   deleteObjectReferencesLogic()
   
   // 新增Zod验证模式
   CreateObjectReferenceSchema
   DeleteObjectReferenceSchema
   DeleteObjectReferencesSchema
   ```

2. **tRPC路由** (`src/services/api/routers/entity-model.ts`)
   ```typescript
   // 新增端点
   createObjectReference: publicProcedure.input(CreateObjectReferenceSchema).mutation()
   deleteObjectReference: publicProcedure.input(DeleteObjectReferenceSchema).mutation()
   deleteObjectReferences: publicProcedure.input(DeleteObjectReferencesSchema).mutation()
   ```

### UI组件实现

**ReferenceEditMMComp** (`src/build-ins/suite/widgets/reference/reference-edit-mm-comp.tsx`)

主要功能模块：

1. **主界面**
   - 显示引用数量的按钮
   - 支持只读模式
   - 点击打开管理模态框

2. **管理模态框**
   - 显示现有引用列表
   - 提供删除单个/全部引用功能
   - 搜索和添加新引用功能

3. **添加引用模态框**
   - 搜索可用对象
   - 分页显示结果
   - 批量选择和添加

## 使用方式

```typescript
import { ReferenceEditMMComp } from '@scenemesh/entity-engine';

// 在EntityWidget中使用
<ReferenceEditMMComp
  model={model}
  view={view}
  field={field}
  behavior={behavior}
  object={object}
  value={referenceIds}
  onChange={handleChange}
/>
```

## API接口

### 创建引用关系
```typescript
POST /api/trpc/entityModel.createObjectReference
Body: {
  sourceId: string;
  targetId: string;
  fieldName: string;
}
```

### 删除单个引用关系
```typescript
POST /api/trpc/entityModel.deleteObjectReference
Body: {
  sourceId: string;
  targetId: string;
  fieldName: string;
}
```

### 删除所有引用关系
```typescript
POST /api/trpc/entityModel.deleteObjectReferences
Body: {
  sourceId: string;
  fieldName: string;
}
```

## 数据流

1. 组件加载时获取现有引用数量
2. 用户点击管理按钮打开模态框
3. 模态框中显示现有引用列表
4. 用户可以删除现有引用或添加新引用
5. 所有操作通过tRPC调用后端API
6. 成功操作后刷新数据并显示通知

## 错误处理

- API调用失败时显示错误通知
- 加载状态的UI反馈
- 网络错误的重试机制（通过TanStack Query）

## 性能优化

- 使用TanStack Query进行数据缓存
- 分页加载避免大数据集性能问题
- debounce搜索输入减少API调用
- 条件渲染优化组件性能

## 类型安全

- 完整的TypeScript类型定义
- Zod运行时验证
- 严格的空值检查

## 国际化支持

组件中的所有用户界面文本都使用中文，可以通过修改文本常量来支持多语言。

## 测试建议

1. 单元测试：测试组件的各个功能模块
2. 集成测试：测试与后端API的交互
3. E2E测试：测试完整的用户工作流程

## 已知限制

1. 目前只支持中文界面
2. 搜索功能基于对象ID，可能需要根据业务需求调整
3. 分页大小固定为10，可考虑配置化

## 后续改进

1. 添加国际化支持
2. 支持自定义显示字段
3. 添加高级搜索功能
4. 支持拖拽排序
5. 添加批量操作功能
