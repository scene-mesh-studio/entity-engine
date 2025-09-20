# @scenemesh/entity-engine 文档站大纲（Nextra）

本文档面向三类读者：

- 使用者（集成 / 快速开发）
- 扩展者（自定义字段类型 / 模块 / 视图 / 渲染器）
- 贡献者（理解内部架构并参与改进）

目标：提供从 0 上手、到架构理解、到高级扩展与性能/安全实践的全栈式知识结构。

***

## 顶层目录结构（建议）

```text
docs/
  index.mdx
  getting-started/
  concepts/
  architecture/
  data-model/
  field-types/
  views/
  actions-events/
  modules/
  datasource/
  session-auth/
  cli/
  extension/
  recipes/
  advanced/
  api-reference/
  migration/
  performance/
  security/
  troubleshooting/
  roadmap/
  glossary/
  faq/
```

***

## 首页 `index.mdx`

**目的：** 总览与快速导流。

**建议内容：**

1. 标题 & 一句话定位（“元数据驱动的实体与视图运行引擎”）
2. 适用与不适用场景列表
3. 特色亮点（动态模型/模块化/统一 DataSource/字段类型策略/事件+动作/可插槽视图）
4. 60 秒快速体验代码块（安装 → API Route → Provider → 第一个视图）
5. 架构小图（Server / Shared / Client）
6. 生态模块区（AI Module / Studio / Additions）
7. 与传统手写 CRUD / 低代码平台对比（简表）
8. 下一步入口按钮（“快速开始” / “核心概念” / “API 参考”）
9. 徽章（npm, license）与贡献指南链接

***

## 1. Getting Started (`getting-started/`)

| 文件 | 目的 | 核心要点 |
|------|------|----------|
| installation.mdx | 安装与前置条件 | Node/DB 要求、依赖、安装命令、环境变量 |
| quick-start-nextjs.mdx | Next.js 快速集成 | API Route + Provider + ViewContainer 示例 |
| project-structure.mdx | 项目结构建议 | server/client 导出、模型/视图/模块文件组织 |
| first-model-and-view.mdx | 第一个模型视图 | 定义 Product 模型 + grid/form 视图步骤 |
| config-runtime-load.mdx | 运行时加载配置 | 服务端初始化 vs 客户端加载 vs 远程模块 |
| faq-beginner.mdx | 入门常见问题 | 样式不生效、Prisma 连接失败、endpoint 404 等 |

***

## 2. 核心概念 (`concepts/`)

| 文件 | 内容要点 |
|------|----------|
| entity-model.mdx | 字段属性：isRequired/unique/searchable/refModel/defaultValue/schema/external |
| entity-view.mdx | viewType / items / panels / hilites / density / canEdit 等 |
| field-typer.mdx | Typer 作用：默认值、Schema、QueryMeta、Widget 推导 |
| module.mdx | 模块接口：setupConfig/setupComponents/setupData/info 流程 |
| engine.mdx | 引擎对象组成（registries/settings/session/datasource）与初始化顺序 |
| registry-system.mdx | metaRegistry/moduleRegistry/actionRegistry/eventRegistry/componentRegistry 关系图 |
| config-persistence.mdx | `__config__` 存储、JSON 序列化、updateOrRegister 机制 |
| session-and-security-basics.mdx | SessionManager/permissionGuard 初步使用 |
| event-and-action.mdx | 事件广播 vs 动作调用对比、典型场景 |

***

## 3. 架构与内部机制 (`architecture/`)

| 文件 | 内容要点 |
|------|----------|
| overview.mdx | 分层：Server(tRPC+Prisma)/Shared(Core)/Client(UI) |
| lifecycle.mdx | beforeInit → init → afterInit → applyModules → 加载配置/数据 |
| data-flow.mdx | View → DataSource → tRPC → Service → Prisma → Event → Listener |
| module-loading.mdx | 本地 vs 远程 esm.sh 加载逻辑与风险 |
| config-refresh.mdx | config.updated 事件、客户端同步策略 |
| storage-strategy.mdx | 通用表 + 引用表设计 rationale、优缺点 |
| extensibility-points.mdx | 可扩展点总览（字段类型/模块/动作/事件/renderer/servlet） |

***

## 4. 数据模型 (`data-model/`)

| 文件 | 内容要点 |
|------|----------|
| model-definition.mdx | 字段属性详解 + 示例 JSON |
| relationships.mdx | one_to_one/many_to_one/one_to_many/many_to_many/树结构 & 引用表说明 |
| values-json-structure.mdx | `values` JSON 组织、约束建议、性能考虑 |
| external-models.mdx | externalConfig 映射、features、只读策略 |
| validation.mdx | Zod 覆盖/默认 schema 推导策略 |
| query-meta.mdx | QueryOperator 列表与生成 UI 的过程 |

***

## 5. 字段类型 (`field-types/`)

| 文件 | 内容要点 |
|------|----------|
| builtin-types.mdx | 内置类型清单 + 默认值/Widget/Operators 表格 |
| custom-typer.mdx | CurrencyTyper 示例：实现 + 注册 + 使用 |
| schema-inference.mdx | 何时需要自定义 schema（高级校验） |
| query-operators.mdx | 各类型 → 运算符映射矩阵 |
| widget-mapping.mdx | Widget 选取优先级（显式 > typer 默认 > fallback） |

***

## 6. 视图系统 (`views/`)

| 文件 | 内容要点 |
|------|----------|
| view-types.mdx | grid/form/mastail/shell/kanban/dashboard 用途与差异 |
| items-and-panels.mdx | 嵌套 panel、字段组合、order/flex/spanCols |
| hilites.mdx | 条件表达式语法、渲染时机、性能建议 |
| behaviors.mdx | edit/display 模式及行为切换策略 |
| view-container.mdx | `EntityViewContainer` 属性（modelName/viewType/viewName/baseObjectId/behavior） |
| renderers-and-slots.mdx | slotName 机制、renderer 注册/销毁、示例 |
| view-controller.mdx | controller.describe / invoke / 生命周期钩子 |

***

## 7. 动作与事件 (`actions-events/`)

| 文件 | 内容要点 |
|------|----------|
| events.mdx | 事件结构、注册/注销、调度链（同步顺序） |
| actions.mdx | ActionHandler 结构、注册与调用流程（通过 service.handleAction） |
| prisma-events.mdx | Prisma 扩展触发的 entityObject.* 事件说明 |
| use-cases.mdx | 审计/通知/缓存失效/派生计算场景 |
| best-practices.mdx | 幂等、错误隔离、监听器性能优化 |

***

## 8. 模块系统 (`modules/`)

| 文件 | 内容要点 |
|------|----------|
| module-interface.mdx | 接口：info/setupConfig/setupComponents/setupData |
| data-initialization.mdx | setupData 导入策略、引用构建、事务建议 |
| remote-modules.mdx | 远程 ESM 加载、版本固定、缓存/安全注意 |
| buildin-module.mdx | BuildinModule 功能（默认组件/基础模型） |
| ai-module-example.mdx | AI 模块结构、扩展点说明 |
| studio-integration.mdx | Studio Launcher renderer 注入流程 |

***

## 9. DataSource 与 API (`datasource/`)

| 文件 | 内容要点 |
|------|----------|
| datasource-overview.mdx | IEntityDataSource 接口、TRPCEntityObjectDataSource 工作流 |
| trpc-endpoints.mdx | model & service 路由概要（方法 + 简述） |
| query-examples.mdx | findOne/findMany/findTree/findGroupedObjects 实战片段 |
| group-and-aggregation.mdx | 分组 + 聚合参数结构、返回格式 |
| references.mdx | 引用增删查计数、批量操作、约束建议 |
| tree-objects.mdx | 树查询构造与节点结构 EntityTreeNode |
| upload-and-binary.mdx | binary 字段与文件上传规范（预留） |

***

## 10. 会话与权限 (`session-auth/`)

| 文件 | 内容要点 |
|------|----------|
| session-manager.mdx | DefaultEntitySessionProvider 流程、缓存刷新机制 |
| auth-integration.mdx | 与 next-auth / 自建 / JWT 接入样例 |
| permission-guard.mdx | checkPermission 设计、Action 分类示例 |
| future-acl-plan.mdx | 字段级/行级/动作级权限规划草案 |

---

## 11. CLI (`cli/`)

| 文件 | 内容要点 |
|------|----------|
| overview.mdx | `setup-ee` 用途与场景 |
| schema-merge.mdx | 检测已有 schema 并合并模型的流程 |
| no-schema-flow.mdx | 无本地 schema 时的临时 generate / push 说明 |
| common-errors.mdx | Prisma 报错/权限/路径问题排查 |

---

## 12. 扩展开发 (`extension/`)

| 文件 | 内容要点 |
|------|----------|
| adding-field-typer.mdx | 自定义字段类型全流程（示例 + 注册 + 覆盖） |
| adding-module.mdx | 新模块目录结构与发布/远程加载策略 |
| custom-renderer.mdx | 自定义 renderer 与 slot 注入实例 |
| custom-view-type.mdx | 新视图类型：继承/组合建议 |
| action-handler.mdx | 业务动作：批量操作/导出任务案例 |
| event-driven-enhancements.mdx | 事件驱动扩展：审计/异步派送/消息队列（规划） |

---

## 13. Recipes (`recipes/`)

| 文件 | 场景 |
|------|------|
| product-crud.mdx | 产品模型 CRUD 流程（列表+详情+编辑） |
| tree-management.mdx | 场景树/层级管理界面搭建 |
| reference-linking.mdx | 多对多引用管理 UI 模式 |
| dashboard-building.mdx | 仪表盘视图 + slot renderer 注入 |
| switch-config-set.mdx | 运行时切换两套模型配置（演示模式） |
| inline-action.mdx | Grid 行内动作按钮（Action 调用） |
| file-upload.mdx | binary 字段文件上传与预览 |
| external-model-readonly.mdx | 只读 external 模型接入 Postgres 表 |

---

## 14. 高级主题 (`advanced/`)

| 文件 | 内容要点 |
|------|----------|
| performance-tuning.mdx | 索引策略/分页/批量引用查询优化 |
| caching-strategy.mdx | 本地缓存/react-query/服务端缓存思路 |
| distributed-deployment.mdx | 多节点部署 & 配置一致性处理 |
| observability.mdx | 日志、事件追踪、调试技巧 |
| config-versioning.mdx | 配置版本化 / 差量更新 / 回滚设计建议 |
| security-hardening.mdx | 远程模块供应链、输入校验、权限基线 |

---

## 15. API 参考 (`api-reference/`)

| 文件 | 内容要点 |
|------|----------|
| typescript-interfaces.mdx | 核心接口汇总（IEntityModel/IEntityView/...） |
| engine-api.mdx | 引擎实例 API、getEntityEnginePrimitive 用法 |
| registries.mdx | 各 Registry 方法与职责表 |
| datasource-api.mdx | DataSource 方法签名/参数/返回值 |
| action-event-types.mdx | 事件名称清单 + 动作接口形式 |
| cli-api.mdx | CLI 选项与执行流程 |
| modules-contract.mdx | 模块接口 contract 详细说明 |

> 可后续用脚本从 d.ts 自动生成部分表格。
***

## 16. 迁移与升级 (`migration/`)

| 文件 | 内容要点 |
|------|----------|
| releases.mdx | 版本发布日志结构模板 |
| upgrade-guide.mdx | 升级步骤/破坏性变更提示 |
| breaking-changes.mdx | 历史破坏性变更列表 |

***

## 17. 性能 (`performance/`) （可与 advanced 合并或保留为速览）

| 文件 | 内容要点 |
|------|----------|
| overview.mdx | 关键性能指标（查询耗时/初始化时长）与快速建议 |

***

## 18. 安全 (`security/`)

| 文件 | 内容要点 |
|------|----------|
| overview.mdx | 安全基线、最常见风险速览 |
| remote-modules-security.mdx | 远程模块签名/版本锁定建议 |
| validation-and-sanitization.mdx | Zod 校验、输入清洗、上传安全 |

***

## 19. 故障排查 (`troubleshooting/`)

| 文件 | 内容要点 |
|------|----------|
| common-errors.mdx | 常见错误对照解决方案 |
| debug-mode.mdx | 如何添加调试日志与事件监听 |
| faq-performance.mdx | 性能热点排查流程 |
| faq-module-load.mdx | 模块加载失败排查（网络/缓存/路径） |

***

## 20. Roadmap (`roadmap/`)

| 文件 | 内容要点 |
|------|----------|
| roadmap.mdx | 已完成 / 进行中 / 计划（权限/查询 DSL/配置版本化/多租户） |

***

## 21. 术语表 (`glossary/`)

| 文件 | 内容要点 |
|------|----------|
| glossary.mdx | 统一术语定义（Model/View/FieldTyper/Renderer/Slot/Module/External Model/Primitive Engine/Action/Event/DataSource 等） |

***

## 22. FAQ (`faq/`)

| 文件 | 内容要点 |
|------|----------|
| faq.mdx | 设计类问题：为什么使用通用表？为什么事件是同步链？为什么采用模块远程加载？ |

***

## MVP 首批建议编写的页面（上线优先）

1. index.mdx
1. getting-started/installation.mdx
1. getting-started/quick-start-nextjs.mdx
1. concepts/entity-model.mdx
1. concepts/entity-view.mdx
1. field-types/builtin-types.mdx
1. views/view-types.mdx
1. modules/module-interface.mdx
1. datasource/datasource-overview.mdx
1. api-reference/engine-api.mdx

***

## 生产协作建议

| 事项 | 说明 |
|------|------|
| 规范 | 每文档首行添加简要摘要，用于生成搜索摘要 |
| 示例 | 代码统一使用 TypeScript，真实可运行片段放入 `examples/` 并 import |
| 自动化 | 后续可用脚本校验 `_meta.json` 与实际文件一致性 |
| 版本标注 | 如接口处于试验阶段，添加 `> Stability: experimental` 提示 |
| 多语言 | 先中文，后续通过多语言路由扩展英文 |

***

## 后续可扩展方向（预留章节）

> 本大纲如需裁剪或重排，可在 PR 中就章节顺序提出讨论。


