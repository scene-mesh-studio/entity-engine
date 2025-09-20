# @scenemesh/entity-engine

一个“元数据驱动 + 组件适配 + 动态关系 + 视图管线”式的实体引擎。以 **Model + View + FieldType + SuiteAdapter + DataSource** 为五大支点，统一 CRUD / 查询 / 引用管理 / 视图渲染 / 扩展注册，支持在运行期无侵入拼装出 **表单、网格、主从、看板、仪表盘、流程/树形视图** 等多形态界面。

**设计原则：配置驱动、运行补全、插槽扩展、最小绑定、可模块化注入。** 适合构建中后台、数据工作台、领域建模平台、低代码/AI 辅助生成系统。


## 目录一览

1. 特性速览
2. 与 workbench 集成全景示例（真实用法）
3. 安装与 Peer 依赖
4. 快速上手（客户端 / 服务端 / 混合渲染）
5. 核心概念与架构示意
6. 模型 (Model) 与视图 (View) 元数据
7. 视图渲染与插槽扩展 (Renderers & Slots)
8. 组件套件 (Suite Adapter) 与自定义 Widget
9. 数据源与引用关系（References / Trees / Grouping）
10. 查询 DSL（条件表达表达式结构）
11. 服务端接入（Next.js Route Handler / tRPC 端点）
12. 模块化扩展（动态加载 & AI 模块示例）
13. 权限 / 导航 / 会话集成
14. 多对多引用编辑组件使用（ReferenceEditMMComp）
15. 调试与开发辅助（View Inspector / Studio Launcher）
16. Roadmap
17. FAQ
18. License


## 1. 特性速览

| 能力 | 说明 |
| ---- | ---- |
| 元数据驱动 | 使用 `IEntityModel` + `IEntityView` 描述领域与 UI 形态，减少硬编码。 |
| 运行时补全 | 视图缺省字段、Widget、顺序等由 FieldTyper 与模型自动推导。 |
| 插槽扩展 | 通过命名渲染器 (Named Renderer) 在壳层 / 工具栏 / 行内插入自定义区域。 |
| 多视图内置 | `form` / `grid` / `master-detail` / `shell` / `kanban` / `dashboard`。 |
| 引用关系统一 | 基于引用表抽象支持一对多、多对多、树、反向查询、计数。 |
| 多对多编辑 | 内置 `ReferenceEditMMComp` 管理选择/删除/批量操作。 |
| 查询 DSL | 嵌套 AND/OR/NOT、Between/In/Contains 等操作符统一结构表达。 |
| 数据源抽象 | `IEntityDataSource` 屏蔽实现，默认 tRPC + Prisma（可扩展 REST / GraphQL）。 |
| 模块化 | 运行期动态加载模块（esm.sh / 本地），扩展模型、组件、动作、AI 工具。 |
| 组件套件 | UI 套件适配器（Mantine / 自定义 / additions suite），解耦 UI 风格。 |
| 行为注册 | Action / Event / Servlet 三类行为管线统一注册与调用。 |
| DevTools | View Inspector / Studio Launcher 提供运行态调试与可视化。 |
| 类型安全 | TypeScript + zod（字段 schema 可选）保障运行与编译期安全。 |

> 目标：用最少的“约束 + 元信息”表达，驱动出尽可能多的动态 UI 与行为。
		- [新增视图实现](#新增视图实现)
		- [自定义 Widget](#自定义-widget)
		- [命名 Renderer (Slot)](#命名-renderer-slot)
	- [字段类型扩展 (Field Type Extension)](#字段类型扩展-field-type-extension)
	- [数据源扩展 (DataSource Extension)](#数据源扩展-datasource-extension)
	- [校验与默认值 (Validation \& Defaults)](#校验与默认值-validation--defaults)
	- [tRPC 集成 (tRPC Integration)](#trpc-集成-trpc-integration)
	- [常用接口参考 (API Reference Snapshot)](#常用接口参考-api-reference-snapshot)
		- [IEntityModel](#ientitymodel)
		- [IEntityField](#ientityfield)
		- [IEntityView](#ientityview)
		- [IEntityDataSource (节选)](#ientitydatasource-节选)
	- [Roadmap](#roadmap)
	- [贡献指南 (Contributing)](#贡献指南-contributing)
	- [许可 (License)](#许可-license)
	- [常见问题 (FAQ)](#常见问题-faq)
	- [致谢 (Acknowledgements)](#致谢-acknowledgements)

---

## 2. 与 workbench 集成全景示例

`apps/workbench` 展示了一个真实集成：

**客户端 Provider 封装示例**（简化自 `entity-engine-provider-warpper.tsx`）：

```tsx
// src/entity/provider/entity-engine-provider-warpper.tsx
'use client';
import { useRouter } from 'next/navigation';
import { createEntityEngineProvider, useEntityEngine, EntityViewInspector } from '@scenemesh/entity-engine';
import { AdditionsSuiteAdapter } from '@scenemesh/entity-suite-additions';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';
import { EntityEngineStudioLauncher } from '@scenemesh/entity-engine-studio';

export function EntityEngineProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const EntityEngineProvider = createEntityEngineProvider({
    // config: { models, views }, // 可按需注入模型与视图
    suiteAdapters: [new AdditionsSuiteAdapter()],
    suiteAdapter: { suiteName: 'additions', suiteVersion: '1.0.0' },
    router: { navigate: (path, state) => router.push(path) },
    permissionGuard: { checkPermission: async () => true },
    renderers: [
      { ...EntityViewInspector },
      { ...EntityEngineStudioLauncher },
      { name: 'view-tool-2', slotName: 'view-tool', renderer: (ctx) => <button>工具扩展</button> },
    ],
    settings: {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082',
      endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '/api/ee',
      authenticationEnabled: true,
    },
    modules: [new EntityAIModule()],
  });
  return <EntityEngineProvider>{children}</EntityEngineProvider>;
}
```

**服务端路由集成（Next.js App Router）**：

```ts
// app/api/ee/[[...slug]]/route.ts
import { EnginePrimitiveInitializer, fetchEntityEntranceHandler } from '@scenemesh/entity-engine/server';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';
import { models, views } from 'src/entity/model-config';

const init = new EnginePrimitiveInitializer({ models, views, modules: [new EntityAIModule()] });
const handler = (req: Request) => fetchEntityEntranceHandler({ request: req, endpoint: '/api/ee', initializer: init });
export { handler as GET, handler as POST };
```

**在界面中使用容器组件（动态视图渲染）**：

```tsx
import { EntityViewContainer } from '@scenemesh/entity-engine';

export function ProductGrid() {
	return (
		<EntityViewContainer
			modelName="product"
			viewType="grid"
			viewName="productGridView"
			maintain={{ pageSize: 20 }}
		/>
	);
}
```

**树 + 引用 + 流程可视化结合（节选自场景设计器）**：

```ts
const ds = engine.datasourceFactory.getDataSource();
// 基于引用关系查找根节点
await ds.findMany({
	modelName: 'scene',
	query: {
		pageIndex: 1,
		pageSize: 1,
		references: {
			fromModelName: 'product',
			fromFieldName: 'rootScene',
			fromObjectId: currentProductId,
			toModelName: 'scene',
		},
	},
});
// 树结构展开
await ds.findTreeObjects({ modelName: 'scene', fieldName: 'children', rootObjectId });
```

**AI 模块集成**：`EntityAIModule` 注入后可在渲染器/工具链中暴露 AI 辅助功能（例如智能填表、生成字段描述、查询建议等）。

> 更多完整示例可参考：`apps/workbench/src/entity` 与 `apps/workbench/src/viewports/scene`。

---

## 3. 安装与 Peer 依赖

安装

```bash
# npm
npm i @scenemesh/entity-engine

# yarn
yarn add @scenemesh/entity-engine

# pnpm
pnpm add @scenemesh/entity-engine
```

必需 peer 依赖

- react >=18 <20
- react-dom >=18 <20
- react-hook-form >=7 <8
- Mantine（供内置视图与检查器使用）
	- @mantine/core 8.2.5
	- @mantine/hooks 8.2.5
	- @mantine/modals 8.2.5
	- @mantine/notifications 8.2.5
	- mantine-datatable 8.2.0

可选 peer（仅使用 server 能力时）

- @prisma/client（与 prisma CLI）

样式引入（必需）

```ts
import '@scenemesh/entity-engine/main.css'
```


## 4. 快速上手

> 假设你在一个包含本包的 monorepo（已安装依赖）中开发。

Next.js（App Router）最小用法：

```tsx
// app/layout.tsx
import '@scenemesh/entity-engine/main.css'
import { EntityEngineProvider } from 'src/entity-provider' // 参考下文示例或自行封装 Provider

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
			<body>
				<EntityEngineProvider>{children}</EntityEngineProvider>
			</body>
		</html>
	)
}
```

Vite（或 CRA）最小用法：

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@scenemesh/entity-engine/main.css'
import { EngineInitializer, getEntityEngine } from '@scenemesh/entity-engine'

async function bootstrap() {
	const initializer = new EngineInitializer([], [])
	await getEntityEngine(initializer)
	ReactDOM.createRoot(document.getElementById('root')!).render(
		<React.StrictMode>
			<div>Entity Engine Ready</div>
		</React.StrictMode>
	)
}
bootstrap()
```

提示：本包将 React/ReactDOM、部分 UI 库设为 peer 依赖；构建产物 external 常见 UI 库，避免与你的应用重复打包或版本冲突。

### 构建 / 开发

```bash
# 构建产物 (dist)
yarn build

# 持续编译 (tsc --watch)
yarn dev

# 数据库（生成 Prisma Client / 迁移）
yarn db:generate     # prisma migrate dev
yarn db:migrate      # prisma migrate deploy
yarn db:push         # prisma db push
yarn db:studio       # 启动数据浏览
```

### 初始化引擎（最小）

```ts
import { EngineInitializer, getEntityEngine } from '@scenemesh/entity-engine';

// 1. 定义模型（最小示例）
const UserModel = {
	name: 'user',
	title: '用户',
	fields: [
		{ name: 'id', title: 'ID', type: 'string', isPrimaryKey: true },
		{ name: 'name', title: '姓名', type: 'string', searchable: true, isRequired: true },
		{ name: 'age', title: '年龄', type: 'number', searchable: true },
		{ name: 'role', title: '角色', type: 'enum', typeOptions: { options: [ { label: '管理员', value: 'admin' }, { label: '访客', value: 'guest' } ] }, searchable: true },
	],
} as const;

// 2. 定义视图（若不定义，也可由元数据自动补全创建默认视图）
const UserGridView = {
	name: 'user-grid',
	title: '用户列表',
	modelName: 'user',
	viewType: 'grid',
	items: [
		{ name: 'id', width: 120 },
		{ name: 'name', flex: 1 },
		{ name: 'age', width: 80 },
		{ name: 'role', width: 120 },
	],
};

// 3. 初始化（一次性调用）
async function bootstrap() {
	const initializer = new EngineInitializer([UserModel], [UserGridView]);
	const engine = await getEntityEngine(initializer);
	console.log(engine.toString());
}

bootstrap();
```

### 在 React 中使用某个视图（手动装配模式）

```tsx
import React from 'react';
import { getEntityEngine } from '@scenemesh/entity-engine';

export function UserGridContainer() {
	const [engine, setEngine] = React.useState<any>();
	React.useEffect(() => {
		getEntityEngine().then(setEngine); // 已初始化后无需再次传入 initializer
	}, []);
	if (!engine) return <div>Loading...</div>;

	const view = engine.metaRegistry.findView('user', 'grid');
	if (!view) return <div>View not found</div>;
	const supplemented = view.toSupplementedView();

	const gridView = engine.componentRegistry.getView('grid');
	if (!gridView) return <div>Grid view component missing</div>;
	const Comp = gridView.Component;
	return <Comp model={engine.metaRegistry.getModel('user')!} viewData={supplemented} behavior={{ mode: 'display' }} />;
}
```


---

## 5. 核心概念与架构

| 概念 | 接口 / 类 | 作用 |
| ---- | --------- | ---- |
| 实体字段 | `IEntityField` | 描述字段元信息（类型、校验、引用、搜索能力等）。 |
| 实体模型 | `IEntityModel` / `EntityModelDelegate` | 字段集合 + 行为补全（默认值 / Schema / QueryMeta）。 |
| 实体视图 | `IEntityView` / `EntityViewDelegate` | 描述一个模型的某种可视化（grid / form / master-detail / shell）。 |
| 视图字段项 | `IEntityViewField` | 与模型字段映射，可定义 widget、顺序、显示条件等。 |
| 引擎 | `EntityEngine` | 单例；聚合 metaRegistry / fieldTyperRegistry / dataSourceFactory / componentRegistry。 |
| 元数据注册表 | `EntityMetaRegistry` | 管理模型、视图、菜单；生成缺省视图。 |
| 组件注册表 | `EntityComponentRegistry` | 管理视图实现、Widget 套件、命名 Renderer。 |
| 组件套件适配器 | `IEntityComponentSuiteAdapter` | 一组 Widget 的命名空间（built-in 套件）。 |
| Widget | `EntityWidget` | 针对单字段或容器/引用呈现的可复用 UI 单元。 |
| 渲染器 | `IEntityNamedRenderer` | Slot 渲染扩展点（装饰 / 布局 / 行内渲染）。 |
| 字段类型 Typer | `IModelFieldTyper` | 决定默认值 / 默认 Widget / 查询能力。 |
| 数据源 | `IEntityDataSource` | CRUD + 引用 + 树形查询抽象。默认实现：tRPCEntityObjectDataSource。 |
| 初始化器 | `EngineInitializer` | 首次创建引擎时批量注册模型、视图、套件、渲染器。 |

---

### 架构概览

```text
									 +---------------------------+
									 |        EntityEngine       | (Singleton)
									 +---------------------------+
										 |       |         |     |
										 v       v         v     v
							 +---------+ +-----------+ +--------+ +----------------+
							 | Meta    | | FieldType | | Data   | | Component      |
							 | Registry| | Registry  | |Source  | | Registry       |
							 +----+----+ +-----+-----+ +---+----+ +-------+--------+
										|            |          |              |
					Models <->|            |          |              |<-> Views Impl
					Views  <->|            |          |              |<-> Widget Suites
										|            |          |              |<-> Renderers
										|            |          |              |
										v            v          v              v
							 Delegates    FieldTypers   TRPC DS     React Components
```

关键流：
1. 初始化阶段：`EngineInitializer` 注册模型 / 视图 / 套件 / 渲染器。
2. 运行时请求某视图：从 `metaRegistry` 获取 `IEntityViewDelegate`，补全 => 视图组件执行数据加载（通过 `datasourceFactory.getDataSource()`）。
3. 用户操作（增删改） -> DataSource (tRPC) -> Server (Prisma) -> 结果回显。

---

## 6. 目录结构概览

简化摘录：

```
src/
	core/
		engine/                # 引擎与初始化
		datasources/           # 数据源工厂 & tRPC 实现
		delegate/              # Delegate 封装 (Model/View/Menu)
		fieldtypes/            # 字段类型注册表
		theme/                 # 主题 (占位 / 可扩展)
		types/                 # 核心类型接口 (engine / delegate / datasource ...)
	components/
		views/                 # 视图实现 (form / grid / mastail / shell)
		types/                 # 视图 & widget 类型定义
		share/                 # 公共共享组件 (search-panel 等)
	build-ins/
		suite/                 # 内置组件套件 & widgets
	services/api/trpc/       # tRPC 客户端工具
	lib/data/                # 数据转换工具 (convertRawEntityObject 等)
	types/                   # 元数据 / 数据 / 字段 / 样式 类型
	uikit/                   # UI 基础 (provider / surface 等)
```

---

## 7. 模型与视图元数据

模型（`IEntityModel`）定义领域结构，视图（`IEntityView`）定义展现形态。未定义的视图可按模型自动补全生成。大型项目建议将模型拆分多个文件并汇总导出。

### 示例：片段（来自 workbench `model-config.ts`）

```ts
export const models: IEntityModel[] = [
	{
		name: 'product',
		title: '产品',
		fields: [
			{ name: 'name', title: '名称', type: 'string', isRequired: true, searchable: true },
			{ name: 'price', title: '价格', type: 'number' },
			{ name: 'rootScene', title: '根场景', type: 'one_to_one', refModel: 'scene' },
		],
	},
	{
		name: 'scene',
		title: '场景',
		fields: [
			{ name: 'title', title: '标题', type: 'string', isRequired: true },
			{ name: 'children', title: '子场景', type: 'one_to_many', refModel: 'scene' },
		],
	},
];
```

### 视图定义示例

```ts
export const views: IEntityView[] = [
	{
		name: 'productGridView',
		title: '产品列表',
		modelName: 'product',
		viewType: 'grid',
		items: [ { name: 'name' }, { name: 'price' }, { name: 'rootScene' } ],
	},
	{
		name: 'sceneFormView',
		title: '场景表单',
		modelName: 'scene',
		viewType: 'form',
		items: [ { name: 'title' }, { name: 'children', widget: 'reference-many' } ],
	},
];
```

## 8. 视图渲染与插槽扩展

通过注册命名渲染器（`IEntityNamedRenderer`）向视图生命周期插入 UI：

| slotName 示例 | 典型用途 |
| -------------- | -------- |
| `view-tool` | 表格/表单顶部工具条扩展 |
| `shell-settings-item2` | 系统壳层设置菜单条目 |
| `record-inline` | 行内扩展按钮/标签 |

注册示例：

```ts
renderers: [
	{ name: 'view-tool-2', slotName: 'view-tool', renderer: (ctx) => <span>工具扩展 {ctx.model.name}</span> },
	{ ...EntityViewInspector }, // 内置调试器
]
```

> 上层应用可通过 DSL + 权限系统动态控制哪些渲染器激活。

## 9. 组件套件 (Suite Adapter) 与自定义 Widget

组件套件用于将“抽象字段语义”映射为“具体 UI 实现”，不同 `suiteAdapter` 可复用同一组模型与视图元数据。

实现要点：
1. 实现接口 `IEntityComponentSuiteAdapter`
2. 提供 `suiteName`、版本与 `getWidget(name)`
3. 在 Provider 中通过 `suiteAdapters` 注册，并指定当前使用的 `suiteAdapter`

> 你可以同时注册多套适配器（例如 Mantine / Additions），再让用户在运行时切换主题或 UI 表现。

## 10. 数据源与引用 / 树 / 分组

数据源接口：`IEntityDataSource`，默认实现：`TRPCEntityObjectDataSource`。

常用方法：

| 方法 | 作用 |
| ---- | ---- |
| `findMany` | 分页查询实体对象 |
| `create / update / delete` | 基础 CRUD |
| `findReferences / findReferencesCount` | 引用关系列表与计数 |
| `createReference / deleteReference / deleteReferences` | 多对多关系增删 |
| `findTreeObjects` | 递归树结构（支持 children 字段） |
| `findGroupedObjects` | 根据字段或时间/范围聚合分组 |

多对多引用 UI 可直接使用内置组件：

```tsx
import { ReferenceEditMMComp } from '@scenemesh/entity-engine';
// 在一个自定义表单 Widget 内：
<ReferenceEditMMComp
	fieldType={{ /* 来自 view 字段解析 */ }}
	object={currentObject}
	value={selectedIds}
	onChange={(ids) => setSelectedIds(ids)}
/>
```

## 11. 查询 DSL

查询结构由 `IEntityQuery` + `IEntityQueryItem` 组成：

```ts
const query = {
	pageIndex: 1,
	pageSize: 20,
	filter: {
		and: [
			{ field: 'name', operator: 'contains', value: 'x' },
			{ or: [ { field: 'status', operator: 'eq', value: 'active' }, { field: 'status', operator: 'eq', value: 'draft' } ] },
		],
	},
};
```

> 未来规划：提供“可视化 Query Builder + 表达式编译器”生成最终 Prisma where 条件。

## 12. 服务端接入（Next.js）

沿用 tRPC 风格：

1. 创建 `EnginePrimitiveInitializer` 注入模型与视图
2. 在 Route Handler 中调用 `fetchEntityEntranceHandler`
3. 客户端 Provider 使用相同 endpoint

已支持的后端能力：对象 CRUD / 引用 / 树 / 分组 / 视图+模型增量下发。

## 13. 模块化扩展 & AI 集成

模块（`IEntityModule`）可：
- 注册额外模型 / 视图
- 注册渲染器 / 动作 / Servlet
- 注入 AI 功能（见 `EntityAIModule`）

动态加载：客户端可通过 `esm.sh/<package>/dist/index.js` 按需拉取（需保证导出 default）。

## 14. 权限 / 导航 / 会话

Provider 选项：

| 选项 | 作用 |
| ---- | ---- |
| `router.navigate(path,state)` | 桥接到应用路由（Next.js push / React Router） |
| `permissionGuard.checkPermission(action)` | 统一权限校验入口 |
| `settings` | baseUrl / endpoint / authenticationEnabled |
| `modules` | 注入模块数组 |

> 你可在 `checkPermission` 里访问全局用户上下文，实现模型/字段/操作级别控制。

## 15. 调试与开发工具

| 工具 | 描述 |
| ---- | ---- |
| `EntityViewInspector` | 在运行时查看当前视图的补全后结构（模型 / 字段 / widget 解析结果）。 |
| `EntityEngineStudioLauncher` | 打开交互式运行时面板，未来扩展模型编辑 / 视图热更新。 |
| 日志 | `TRPCEntityObjectDataSource` 在 URL 变更时输出新客户端创建日志。 |

## 16. Roadmap

- [ ] 查询 DSL -> 编译器 + 单元测试
- [ ] 模型 / 视图 版本化与快照导出
- [ ] 引用关系附加属性（排序 / 标签 / 权重）
- [ ] 渲染器 DevTools 面板
- [ ] 模块远程签名校验与缓存策略
- [ ] 多数据源聚合（federation）
- [ ] 表达式求值沙箱化 (CEL / jsep)
- [ ] 视图性能探针 & 监控面板
- [ ] AI 辅助：模型结构生成 / 视图建议 / 查询自然语言解析

## 17. FAQ

**Q: 可以只用数据源而不使用内置视图吗？**  
A: 可以。直接 `getEntityEngine().datasourceFactory.getDataSource()` 调用 CRUD。

**Q: 如何扩展一个新视图类型？**  
A: 实现 `EntityView` 接口（或继承内置基类），在 `componentRegistry.registerView()` 注册。

**Q: 可以在多引擎实例间隔离吗？**  
A: 当前主设计是单例。后续将加入多实例 + context 方案。

**Q: 引用是否支持附加元数据？**  
A: 当前结构最简。可在后端扩展引用表（例如增加 jsonb 列）并在数据源扩展。

**Q: SSR 支持吗？**  
A: 是。服务端使用 `EnginePrimitiveInitializer`，客户端使用 `createEntityEngineProvider`。注意避免重复初始化。

## 18. License

MIT © scenemesh

---

> 如果你在集成上遇到困难，或希望我进一步为你的场景定制示例/脚手架，可直接在仓库发起 Issue 或讨论。


### 1. 注册额外视图与组件套件

```ts
import { EngineInitializer, getEntityEngine } from '@scenemesh/entity-engine';

class MySuiteAdapter { /* implements IEntityComponentSuiteAdapter */ }
class MyRenderer { name = 'toolbar-extra'; slotName = 'toolbar'; renderer = () => <div>Extra</div>; }

const initializer = new EngineInitializer([UserModel], [UserGridView], [new MySuiteAdapter()], [new MyRenderer()]);
await getEntityEngine(initializer);
```

### 2. 访问数据源 CRUD

```ts
const engine = await getEntityEngine();
const ds = engine.datasourceFactory.getDataSource();
await ds.create({ modelName: 'user', data: { values: { name: 'Lucy', age: 20, role: 'guest' } } });
const { data, count } = await ds.findMany({ modelName: 'user', query: { pageIndex: 1, pageSize: 10 } });
```

### 3. 动态生成默认视图

如果未显式注册某模型的某种 viewType（例如 `grid`），调用：

```ts
const v = engine.metaRegistry.findView('user', 'grid'); // 若无则按模型字段生成
```

### 4. 条件显示 / 只读 / 必填逻辑

`IEntityViewField` 支持：

| 属性 | 含义 | 示例 |
| ---- | ---- | ---- |
| hiddenWhen | 条件表达式为 true 时隐藏 | `role=="guest"` |
| showWhen | 条件表达式为 true 时显示 | `age>18` |
| readOnlyWhen | 条件成立时只读 | `role=="admin"` |
| disabledWhen | 条件成立时禁用 | `age<1` |
| requiredWhen | 条件成立时必填 | `role=="admin"` |

（表达式解析器按需在上层应用实现，可替换为任意逻辑解析方案）

### 5. 在应用中通过 Provider 集成（Provider Integration）

`apps/workbench/src/entity/provider` 目录展示了如何在 Next.js (App Router) 环境中一次性封装引擎：

核心点：

1. 使用 `createEntityEngineProvider` 生成 React 上下文 Provider（内部完成 `EntityEngine` 初始化与依赖注入）。
2. 注入多套组件套件：示例中同时使用 `SemiSuiteAdapter` 与 `MUISuiteAdapter`，并指定一个当前使用的套件 `suiteAdapter`（可作为默认/首选套件描述）。
3. 包裹在 `TRPCReactProvider` 外层（或内层）以提供数据访问上下文。
4. 自定义 `router.navigate` 以适配 Next.js 的 `useRouter().push()`。
5. 提供 `permissionGuard.checkPermission` 异步函数集中处理权限校验（此处示例直接放行）。
6. 注册自定义 `renderers`（命名插槽扩展）以及内置 `EntityViewInspector` 以调试视图元数据。

示例代码（建议放在 `src/entity-provider.tsx`）：

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { createEntityEngineProvider, EntityViewInspector } from '@scenemesh/entity-engine';
import { MUISuiteAdapter } from '@scenemesh/entity-suite-mui';
import { SemiSuiteAdapter } from '@scenemesh/entity-suite-semi';
import { TRPCReactProvider } from '@scenemesh/entity-engine/services/api/trpc/react';

import { models, views } from 'src/entity/model-config'; // 你的模型与视图配置

import React from 'react'
import { createEntityEngineProvider, EntityViewInspector, type IEntityNamedRenderer } from '@scenemesh/entity-engine'

// 你的模型与视图（最小示例）
const models = [ { name: 'user', title: '用户', fields: [ { name: 'id', title: 'ID', type: 'string', isPrimaryKey: true }, { name: 'name', title: '姓名', type: 'string' } ] } ] as any
const views = [ { name: 'user-grid', title: '用户列表', modelName: 'user', viewType: 'grid', items: [ { name: 'id' }, { name: 'name' } ] } ] as any

// 自定义插槽渲染器（可选）
const ViewToolbar: IEntityNamedRenderer = { name: 'view-tool-2', slotName: 'view-tool', renderer: (ctx) => <div>工具区 {ctx.model.name}</div> }

export function EntityEngineProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter()

	// 使用 memo 避免每次渲染都重新创建 Provider 组件
	const Provider = React.useMemo(() => createEntityEngineProvider({
		models,
		views,
		suiteAdapter: { suiteName: 'build-in', suiteVersion: '1.0.0' },
		router: { navigate: (path, state) => router.push(path) },
		permissionGuard: { checkPermission: async () => true },
		renderers: [ ViewToolbar, { ...EntityViewInspector } ],
		serverInfo: { baseUrl: '', endpoint: '/api/ee' },
	}), [router])

	return <Provider>{children}</Provider>
}
```

在页面中直接使用：

```tsx
// app/layout.tsx 或某上层布局
import { EntityEngineProvider } from 'src/entity-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
			<body>
				<EntityEngineProvider>
					{children}
				</EntityEngineProvider>
			</body>
		</html>
	);
}
```

这样任意子组件即可通过（假设库已导出相应 hooks，如未来 `useEntityEngine()`）获取引擎实例与上下文数据，实现：

- 视图渲染（Grid/Form/MasterDetail）
- 数据 CRUD / 引用查询
- 自定义插槽渲染扩展（toolbar / shell settings）
- 权限与路由统一入口

> 若需按租户/用户隔离实例，可在 `createEntityEngineProvider` 外再包一层，根据参数动态构建不同 initializer。

---

## 查询与过滤 (Query & Filter)

查询结构：`IEntityQuery`。

```ts
type IEntityQuery = {
	pageSize?: number;
	pageIndex?: number;
	sortBy?: Record<string, 'asc' | 'desc'>;
	references?: { fromModelName; fromFieldName; fromObjectId; toModelName };
	filter?: IEntityQueryItem; // 递归 AND / OR / NOT 结构
}
```

叶子条件：

```ts
{ field: 'age', operator: QueryOperator.GT, value: 18 }
```

复合条件：

```ts
{
	and: [
		{ field: 'role', operator: QueryOperator.EQ, value: 'admin' },
		{ or: [
				{ field: 'age', operator: QueryOperator.GT, value: 30 },
				{ field: 'age', operator: QueryOperator.IS_NULL, value: null }
			]
		}
	]
}
```

支持操作符（QueryOperator）：`EQ, NE, GT, GTE, LT, LTE, CONTAINS, STARTS_WITH, ENDS_WITH, IN, NOT_IN, BETWEEN, IS_NULL, IS_NOT_NULL` 等。

引擎可通过 `modelDelegate.getQueryMeta()` 给 UI 构建器提供字段支持的操作符列表及枚举选项。

---

## 组件与视图扩展 (Views & Widgets Extensibility)

### 新增视图实现

```ts
import { EntityView } from '@scenemesh/entity-engine';
export class TimelineView extends EntityView { 
	readonly info = { viewName: 'timeline', displayName: '时间线视图' };
	readonly Component = (props) => <div>TODO Timeline of {props.model.name}</div>;
}

// 注册
engine.componentRegistry.registerView(new TimelineView());
```

### 自定义 Widget

```ts
import { EntityWidget } from '@scenemesh/entity-engine';
class BadgeWidget extends EntityWidget {
	readonly info = { widgetName: 'badge', displayName: '徽章' };
	readonly Component = ({ value }) => <span className="badge">{value}</span>;
}

class BadgeSuiteAdapter { // implements IEntityComponentSuiteAdapter
	suiteName = 'badge-suite'; suiteVersion = '0.0.1';
	private widgets = new Map([['badge', new BadgeWidget()]]);
	getWidget(n){ return this.widgets.get(n); }
	getWidgets(){ return [...this.widgets.values()]; }
}
engine.componentRegistry.registerAdapter(new BadgeSuiteAdapter());
```

### 命名 Renderer (Slot)

```ts
engine.componentRegistry.registerRenderer({
	name: 'grid-toolbar-extra',
	slotName: 'grid.toolbar.right',
	renderer: () => <button>导出 CSV</button>
});
```

---

## 字段类型扩展 (Field Type Extension)

实现 `IModelFieldTyper`：

```ts
import { z } from 'zod';
class GeoPointFieldTyper { // implements IModelFieldTyper
	get title(){ return '地理点'; }
	get type(){ return 'geopoint'; }
	get icon(){ return 'map_pin'; }
	get description(){ return '经纬度'; }
	getDefaultValue(){ return { lat: 0, lng: 0 }; }
	getDefaultSchema(){ return z.object({ lat: z.number(), lng: z.number() }); }
	getQueryItemMeta(field){ return { field, operators: [/* ... */] }; }
	getDefaultWidgetType(viewType:string){ return 'map'; }
}
engine.fieldTyperRegistry.registerFieldTyper(new GeoPointFieldTyper());
```

随后在模型字段中使用 `type: 'geopoint'`。

---

## 数据源扩展 (DataSource Extension)

默认实现：`TRPCEntityObjectDataSource`。

自定义：

```ts
class RestEntityDataSource { // implements IEntityDataSource
	async findOne({ id }) { /* fetch(`/api/entity/${id}`) */ }
	async findMany({ modelName, query }) { /* ... */ return { data: [], count: 0 }; }
	// 其余方法按接口补全
}

class MyDataSourceFactory { // implements IEntityDataSourceFactory
	private ds = new RestEntityDataSource();
	getDataSource(){ return this.ds; }
}

// 在初始化时替换
// 方式一：fork 引擎创建逻辑
// 方式二：后续扩展 createEntityEngine 暴露工厂注入（TODO: 参见 Roadmap）
```

---

## 校验与默认值 (Validation & Defaults)

1. 字段可以直接提供 `schema: ZodTypeAny`；否则按类型自动推导。
2. 模型委托 `EntityModelDelegate.schema` 聚合所有字段 schema -> 用于 form 校验。
3. 未提供值时，通过 `toSupplementedValues` 使用字段默认值或类型默认值填充。

> 注意：复杂业务校验（交叉字段、异步校验）可在上层表单库 / 后端再补充。

---

## tRPC 集成 (tRPC Integration)

文件：`src/services/api/trpc/utils.ts`

```ts
export const vanillaTrpcClient = createTRPCClient<AppRouter>({ links: [ httpBatchLink({ url, transformer: superjson }) ] });
```

数据源 `TRPCEntityObjectDataSource` 通过 `vanillaTrpcClient.model.*` 调用，例如：

```ts
await vanillaTrpcClient.model.listObjects.query({ modelName, pagination, reference, filter });
```

> SSR 关闭 (`ssr: false`)，如需要服务端渲染可扩展配置。

---

## 常用接口参考 (API Reference Snapshot)

> 摘要列出关键接口字段，详见源码 `src/**`。

### IEntityModel

```ts
interface IEntityModel { name: string; title: string; description?: string; fields: IEntityField[] }
```

### IEntityField

```ts
interface IEntityField { name; title; type; isRequired?; isPrimaryKey?; isUnique?; searchable?; defaultValue?; refModel?; refField?; schema?; order?; }
```

### IEntityView

```ts
interface IEntityView { name; title; modelName; viewType; items: IEntityViewField[]; density?; canEdit?; canNew?; canDelete?; }
```

### IEntityDataSource (节选)

```ts
interface IEntityDataSource {
	findOne({ id }): Promise<IEntityObject | null | undefined>;
	findMany({ modelName, query }): Promise<{ data: IEntityObject[]; count: number }>;
	create({ modelName, data, reference? }): Promise<IEntityObject | null | undefined>;
	update({ id, data }): Promise<boolean>;
	delete({ id }): Promise<boolean>;
}
```

---

## Roadmap

| 状态 | 目标 | 说明 |
| ---- | ---- | ---- |
| ✅ | 基础引擎单例 / 模型 / 视图补全 | 当前实现 |
| ✅ | tRPC 数据源 CRUD & 引用 & 树 | `TRPCEntityObjectDataSource` |
| ✅ | 内置视图 (form / grid / mastail / shell) | 可扩展注册更多 |
| ⏳ | 数据源注入定制 API | 允许外部直接提供自定义 factory |
| ⏳ | 视图运行时条件解析器抽象 | 允许替换表达式解析策略 |
| ⏳ | 字段类型可配置默认 WidgetMap | 细粒度控制 per viewType |
| ⏳ | 国际化 (i18n) 插件化 | 与 `locales` 目录集成 |
| ⏳ | 权限与操作策略接口 | 结合 `permission.types` |
| ⏳ | 测试覆盖提升 | Unit + Integration + 可视回归 |

欢迎在 Issue / PR 中补充你的需求。

---

## 贡献指南 (Contributing)

1. Fork / 新建分支：`feat/x`、`fix/x`。
2. 安装依赖并执行 `yarn build` 确保通过。
3. 提交前运行：

	```bash
	yarn lint && yarn fm:check
	```

4. 附带最小复现或使用示例。
5. 遵循语义化提交（建议）：`feat: ...` / `fix: ...` / `docs: ...` 等。

---

## 许可 (License)

当前 `package.json` 标记为 `private: true`，尚未明确开源 License。若计划公开发布，建议：

1. 选择合适协议（MIT / Apache-2.0 / MPL-2.0 等）。
2. 添加 `LICENSE` 文件并在 `package.json` 中声明 `"license": "MIT"`（示例）。
3. 更新本 README 中的许可章节。

---

## 常见问题 (FAQ)

| 问题 | 说明 |
| ---- | ---- |
| 为什么需要 EngineInitializer? | 保证首次创建时批量注册，避免重复注册与竞态。 |
| 可以二次调用 getEntityEngine(initializer)? | 第二次会忽略传入的 initializer（已存在实例）；如需重置需扩展清理逻辑。 |
| 未定义视图时字段顺序如何? | 使用字段的 `order`，缺省为 0；同序时按声明顺序。 |
| 查询表达式如何解析? | 核心未内置解析器，留给上层（前端构造统一结构后传至后端）。 |
| 如何做权限控制? | 未来 Roadmap 中将引入权限接口，可对模型 / 字段 / 动作进行裁剪。 |

---

## 致谢 (Acknowledgements)

本项目借鉴了多种低代码 / 元数据驱动思想（如 Ad Hoc Admin、Headless CMS、tRPC 模式），感谢社区生态。

---

如有问题或改进建议，欢迎提交 Issue / PR。

> Keep building data-driven UI with less boilerplate.

