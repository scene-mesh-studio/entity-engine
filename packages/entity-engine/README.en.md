# @scenemesh/entity-engine (English)

A metadata‑driven entity engine for building data‑intensive React applications. It unifies **Model + View + Field Type + Component Suite Adapter + Data Source** into a cohesive runtime so that CRUD, querying, relationship management, forms, grids, master‑detail layouts, kanban, dashboards and tree/flow style exploration can be assembled dynamically without hard‑coding UI structure.

**Core Principles:** configuration first • runtime completion • slot based extensibility • minimal coupling • modular injection.

---

## Table of Contents

1. Feature Overview
2. Real Integration (workbench app example)
3. Installation & Peer Dependencies
4. Quick Start (Client / Server / Mixed)
5. Core Concepts & Architecture
6. Model & View Metadata
7. Rendering & Slot Extensions (Named Renderers)
8. Component Suite Adapters & Custom Widgets
9. Data Source & Relationships (References / Trees / Grouping)
10. Query DSL Structure
11. Server Integration (Next.js Route Handler)
12. Modular Extensions & AI Module
13. Permissions / Navigation / Session Integration
14. Many‑to‑Many Editing (`ReferenceEditMMComp`)
15. Dev & Debug Utilities
16. Roadmap
17. FAQ
18. License

---

## 1. Feature Overview

| Capability | Description |
| ---------- | ----------- |
| Metadata Driven | `IEntityModel` + `IEntityView` define domain + UI — no hard‑coded layout. |
| Runtime Completion | Missing widget / order / labels auto‑inferred from field type + model. |
| Slot Based Extension | Named renderers inject UI into view shell / toolbar / inline positions. |
| Multiple Built‑in Views | `form`, `grid`, `master-detail`, `shell`, `kanban`, `dashboard`. |
| Unified Relationships | Single reference abstraction enabling 1-1 / 1-N / N-N / tree / reverse count. |
| Many‑to‑Many UI | Built‑in `ReferenceEditMMComp` for managing multi select and batch removal. |
| Query DSL | Nested `and / or / not`, operators: eq/contains/between/in/null... |
| Data Source Abstraction | `IEntityDataSource` hides transport; default implementation: tRPC + Prisma. |
| Modular Runtime | Dynamic module loading (local or remote) extends models / views / actions / AI tools. |
| Component Suites | Adapter pattern maps semantic field to concrete UI implementation. |
| Behavior Pipelines | Action / Event / Servlet registries unify runtime callable behaviors. |
| Dev Tools | View Inspector & Studio Launcher for introspection and runtime tooling. |
| Type Safety | TypeScript + optional zod field schemas. |

> Goal: express the *minimum semantic metadata* to unlock the *maximum amount of runtime UI & behavior*.

---

## 2. Real Integration (workbench)

The `apps/workbench` folder demonstrates a full integration: provider wrapping, server route handler, model/view metadata injection, AI module, slot renderers, reference + tree usage.

### Client Provider (simplified)

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { createEntityEngineProvider, EntityViewInspector } from '@scenemesh/entity-engine';
import { AdditionsSuiteAdapter } from '@scenemesh/entity-suite-additions';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';
import { EntityEngineStudioLauncher } from '@scenemesh/entity-engine-studio';

export function EntityEngineProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const Provider = createEntityEngineProvider({
    suiteAdapters: [new AdditionsSuiteAdapter()],
    suiteAdapter: { suiteName: 'additions', suiteVersion: '1.0.0' },
    router: { navigate: (path) => router.push(path) },
    permissionGuard: { checkPermission: async () => true },
    renderers: [
      { ...EntityViewInspector },
      { ...EntityEngineStudioLauncher },
      { name: 'view-tool-2', slotName: 'view-tool', renderer: () => <button>Extra Tool</button> },
    ],
    settings: { baseUrl: 'http://localhost:8082', endpoint: '/api/ee', authenticationEnabled: true },
    modules: [new EntityAIModule()],
  });
  return <Provider>{children}</Provider>;
}
```

### Server Route (Next.js App Router)

```ts
// app/api/ee/[[...slug]]/route.ts
import { EnginePrimitiveInitializer, fetchEntityEntranceHandler } from '@scenemesh/entity-engine/server';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';
import { models, views } from 'src/entity/model-config';

const initializer = new EnginePrimitiveInitializer({ models, views, modules: [new EntityAIModule()] });
const handler = (req: Request) => fetchEntityEntranceHandler({ request: req, endpoint: '/api/ee', initializer });
export { handler as GET, handler as POST };
```

### View Container Usage

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

### Reference + Tree (excerpt)

```ts
const ds = engine.datasourceFactory.getDataSource();
const rootCandidate = await ds.findMany({
  modelName: 'scene',
  query: {
    pageIndex: 1,
    pageSize: 1,
    references: { fromModelName: 'product', fromFieldName: 'rootScene', fromObjectId, toModelName: 'scene' }
  }
});
if (rootCandidate.data?.length) {
  await ds.findTreeObjects({ modelName: 'scene', fieldName: 'children', rootObjectId: rootCandidate.data[0].id });
}
```

---

## 3. Installation

```bash
# npm
yarn add @scenemesh/entity-engine
# or
npm i @scenemesh/entity-engine
# or
pnpm add @scenemesh/entity-engine
```
 
Peer dependencies (examples): `react`, `react-dom`, UI libs (Mantine or your suite), optional `@prisma/client` for default backend.

Bring global styles:

```ts
import '@scenemesh/entity-engine/main.css';
```
 

---

## 4. Quick Start

### Minimal Initialization

```ts
import { EngineInitializer, getEntityEngine } from '@scenemesh/entity-engine';

const UserModel = { name: 'user', title: 'User', fields: [ { name: 'id', title: 'ID', type: 'string', isPrimaryKey: true }, { name: 'name', title: 'Name', type: 'string', isRequired: true } ] };
const UserGrid = { name: 'user-grid', title: 'Users', modelName: 'user', viewType: 'grid', items: [ { name: 'id' }, { name: 'name' } ] };

async function bootstrap() {
  const initializer = new EngineInitializer([UserModel], [UserGrid]);
  const engine = await getEntityEngine(initializer);
  console.log(engine.toString());
}
bootstrap();
```

### Manual View Rendering

```tsx
const engine = await getEntityEngine();
const view = engine.metaRegistry.findView('user', 'grid');
const supplemented = view?.toSupplementedView();
const viewImpl = engine.componentRegistry.getView('grid');
const Comp = viewImpl?.Component;
return Comp ? <Comp model={engine.metaRegistry.getModel('user')!} viewData={supplemented} behavior={{ mode: 'display' }} /> : null;
```

---

## 5. Core Concepts & Architecture

| Concept | Role |
| ------- | ---- |
| `IEntityField` | Field metadata (type, validation, reference, searchability). |
| `IEntityModel` | Domain structure (collection of fields). |
| `IEntityView` | A projection of a model in a specific UI mode (grid/form/...). |
| `EntityEngine` | Singleton orchestrating registries & settings. |
| `ComponentRegistry` | Holds view implementations, adapters, controllers, named renderers. |
| `Suite Adapter` | Maps semantic field/widget names to UI components. |
| `IEntityDataSource` | Unified CRUD + references + tree + grouping abstraction. |
| Actions / Events / Servlets | Extensible behavior pipelines. |

Architecture sketch:

```text
EntityEngine (singleton)
  ├─ MetaRegistry (models/views)
  ├─ FieldTyperRegistry
  ├─ ComponentRegistry (views + adapters + renderers + controllers)
  ├─ DataSourceFactory → tRPC data source
  ├─ ActionRegistry / EventRegistry / ServletRegistry
  └─ SessionManager / Settings
```

---

## 6. Model & View Metadata


```ts
export const models = [
  { name: 'product', title: 'Product', fields: [ { name: 'name', title: 'Name', type: 'string', isRequired: true }, { name: 'price', title: 'Price', type: 'number' } ] },
  { name: 'scene', title: 'Scene', fields: [ { name: 'title', title: 'Title', type: 'string', isRequired: true }, { name: 'children', title: 'Children', type: 'one_to_many', refModel: 'scene' } ] }
];

export const views = [
  { name: 'productGridView', title: 'Products', modelName: 'product', viewType: 'grid', items: [ { name: 'name' }, { name: 'price' } ] },
  { name: 'sceneFormView', title: 'Scene Form', modelName: 'scene', viewType: 'form', items: [ { name: 'title' }, { name: 'children', widget: 'reference-many' } ] }
];
```

---

## 7. Rendering & Slot Extensions

Named renderers (`IEntityNamedRenderer`) are injected by `slotName`. Common slots:

| Slot | Usage |
| ---- | ----- |
| `view-tool` | Extra toolbar buttons. |
| `shell-settings-item2` | System shell settings menu entries. |
| `record-inline` | Inline record decoration. |

```ts
renderers: [
  { name: 'extra-tools', slotName: 'view-tool', renderer: (ctx) => <span>Tools for {ctx.model.name}</span> }
];
```

---

## 8. Component Suite Adapters & Custom Widgets

Implement `IEntityComponentSuiteAdapter` to supply widget resolvers. You can register multiple adapters and pick one as `suiteAdapter` to control the currently active UI stack (e.g. Mantine vs. custom vs. additions).

---

## 9. Data Source & Relationships

`IEntityDataSource` (default: tRPC + Prisma) provides:

| Method | Purpose |
| ------ | ------- |
| `findMany` | Paginated query. |
| `create / update / delete` | CRUD operations. |
| `findReferences / findReferencesCount` | Retrieve and count relationships. |
| `createReference / deleteReference / deleteReferences` | Manage many‑to‑many edges. |
| `findTreeObjects` | Recursive tree expansion. |
| `findGroupedObjects` | Grouping + aggregations. |

Many‑to‑many UI helper:

```tsx
<ReferenceEditMMComp
  fieldType={fieldMeta}
  object={currentObject}
  value={selectedIds}
  onChange={(ids) => setSelectedIds(ids)}
/>
```

---

## 10. Query DSL Structure

```ts
const query = {
  pageIndex: 1,
  pageSize: 20,
  filter: {
    and: [
      { field: 'name', operator: 'contains', value: 'x' },
      { or: [ { field: 'status', operator: 'eq', value: 'active' }, { field: 'status', operator: 'eq', value: 'draft' } ] }
    ]
  }
};
```
 
Future: visual builder + compiler to database predicates.

---

## 11. Server Integration (Next.js)

Steps:


1. Create `EnginePrimitiveInitializer` with models/views/modules.
2. Mount `fetchEntityEntranceHandler` at a route (`/api/ee`).
3. Client provider points to same endpoint.

---

## 12. Modular Extensions & AI Module

A module (`IEntityModule`) can register additional models, views, renderers, actions, servlets, AI tools. Client side can dynamically import remote modules via `esm.sh` (ensure a `default` export).

---

## 13. Permissions / Navigation / Session

Provider options:

| Option | Description |
| ------ | ----------- |
| `router.navigate(path, state)` | Bridge to application router. |
| `permissionGuard.checkPermission(action)` | Central permission decision. |
| `settings` | `baseUrl`, `endpoint`, `authenticationEnabled`. |
| `modules` | Injected runtime modules. |

---

## 14. Many‑to‑Many Editing Component

The `ReferenceEditMMComp` provides search, add, remove, batch delete and count display for relationship management. Hooks into `createReference`, `deleteReference`, `deleteReferences`, and `findReferencesCount` under the hood.

---

## 15. Dev & Debug Utilities

| Tool | Description |
| ---- | ----------- |
| `EntityViewInspector` | Inspect supplemented view model at runtime. |
| `EntityEngineStudioLauncher` | Launch experimental studio panel (future: live editing). |
| Logging | tRPC data source logs new client instantiation when endpoint changes. |

---

## 16. Roadmap

- [ ] Query DSL compiler + tests
- [ ] Model / view versioning & snapshots
- [ ] Reference metadata (ordering / tagging / weight)
- [ ] Renderer DevTools panel
- [ ] Remote module signature validation & caching
- [ ] Multi data source federation
- [ ] Expression sandbox (CEL / jsep)
- [ ] View performance probes & metrics
- [ ] AI assistance: model generation / view suggestions / NL → query

---

## 17. FAQ

**Q: Can I only use the data layer without built‑in views?**  
Yes. Call `getEntityEngine().datasourceFactory.getDataSource()` directly.

**Q: How to add a new view type?**  
Implement a class with `info.viewName` & `Component`, then `componentRegistry.registerView()`.

**Q: Multiple engine instances supported?**  
Currently singleton; roadmap includes multi‑instance contexts.

**Q: Can references store extra attributes?**  
Not yet. You can extend the backend table (e.g. JSONB column) and extend the data source.

**Q: SSR compatible?**  
Yes. Use `EnginePrimitiveInitializer` server side and the provider client side.

---

## 18. License

MIT © scenemesh

---
If you need more advanced guidance (plugin authoring, adapter design, AI integration patterns), open an issue or discussion.
