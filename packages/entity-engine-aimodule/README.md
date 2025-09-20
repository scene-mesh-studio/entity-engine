# @scenemesh/entity-engine-aimodule

[![npm version](https://badge.fury.io/js/%40scenemesh%2Fentity-engine-aimodule.svg)](https://badge.fury.io/js/%40scenemesh%2Fentity-engine-aimodule)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Entity Engine AI集成模块** - 为SceneMesh Entity Engine提供完整AI功能集成

## 目录一览

1. [重要说明](#重要说明)
2. [核心功能](#核心功能)
3. [与 Entity Engine 集成全景示例](#与-entity-engine-集成全景示例)
4. [安装与 Peer 依赖](#安装与-peer-依赖)
5. [快速上手](#快速上手)
6. [Entity Engine 集成详解](#entity-engine-集成详解)
7. [AI 工具系统架构](#ai-工具系统架构)
8. [使用示例](#使用示例)
9. [高级配置](#高级配置)
10. [技术架构](#技术架构)
11. [API 参考](#api-参考)
12. [故障排除](#故障排除)
13. [Roadmap](#roadmap)
14. [许可证](#许可证)

---

## 📌 重要说明

**该包专门为 SceneMesh Entity Engine 框架设计**，提供与Entity Engine深度集成的AI功能。

**设计原则：模块化集成、视图控制器驱动、前后端工具混合、类型安全优先。** 适合为基于Entity Engine构建的中后台、数据工作台、领域建模平台添加AI辅助功能。

> **如果你不是Entity Engine用户，请使用其他通用AI SDK。**

---

## 🎯 核心功能

| 功能 | 说明 |
| ---- | ---- |
| AI模块自动注册 | 作为Entity Engine模块自动集成到系统中，无需手动配置 |
| 表单智能填写 | 通过AI直接操作Entity Engine表单组件，支持字段读取/写入/验证 |
| 视图控制器工具 | AI可直接调用视图控制器的操作方法，实现表单自动化 |
| 实体查询工具 | AI可查询和操作Entity Engine实体数据，支持复杂查询条件 |
| 多提供商支持 | OpenAI、Anthropic、通义千问等AI服务统一接口 |
| 流式对话 | 基于AI SDK的实时对话能力，支持工具调用 |
| 结构化生成 | 类型安全的对象生成，基于Zod schema验证 |
| 前后端工具混合 | 独特的前后端工具调用架构，支持客户端直接操作 |

> 目标：用最少的配置为Entity Engine应用添加完整的AI辅助能力。

---

## 2. 与 Entity Engine 集成全景示例

### 服务端模块注册（Next.js App Router）

```typescript
// app/api/ee/[[...slug]]/route.ts
import { EnginePrimitiveInitializer, fetchEntityEntranceHandler } from '@scenemesh/entity-engine/server';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';
import { models, views } from 'src/entity/model-config';

// AI模块与Entity Engine一起初始化
const init = new EnginePrimitiveInitializer({ 
  models, 
  views, 
  modules: [new EntityAIModule()] // 注册AI模块
});

const handler = (req: Request) => fetchEntityEntranceHandler({ 
  request: req, 
  endpoint: '/api/ee', 
  initializer: init 
});

export { handler as GET, handler as POST };
```

### 客户端Provider集成

```tsx
// src/entity/provider/entity-engine-provider-wrapper.tsx
'use client';
import { useRouter } from 'next/navigation';
import { createEntityEngineProvider } from '@scenemesh/entity-engine';
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';

export function EntityEngineProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const EntityEngineProvider = createEntityEngineProvider({
    suiteAdapter: { suiteName: 'additions', suiteVersion: '1.0.0' },
    router: { navigate: (path, state) => router.push(path) },
    permissionGuard: { checkPermission: async () => true },
    settings: {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082',
      endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '/api/ee',
      authenticationEnabled: true,
    },
    modules: [new EntityAIModule()], // 客户端也注册AI模块
  });
  return <EntityEngineProvider>{children}</EntityEngineProvider>;
}
```

### 表单自动获得AI功能

```tsx
// AI模块注册后，任何Entity Engine表单都自动获得AI功能
import { EntityViewContainer } from '@scenemesh/entity-engine';

export function UserForm() {
  return (
    <EntityViewContainer
      modelName="user"
      viewType="form"
      viewName="userFormView"
      // AI功能自动可用 - 表单右上角会出现"智能填表"按钮
    />
  );
}
```

### AI与Entity Engine数据交互

```typescript
// AI可以通过工具直接查询Entity Engine数据
const ds = engine.datasourceFactory.getDataSource();

// AI工具调用示例：查询用户数据
await ds.findMany({
  modelName: 'user',
  query: {
    pageIndex: 1,
    pageSize: 10,
    filter: {
      and: [
        { field: 'role', operator: 'eq', value: 'admin' },
        { field: 'active', operator: 'eq', value: true }
      ]
    }
  }
});
```

> 完整示例参考：`apps/workbench` 中的Entity Engine + AI模块集成。

---

## 3. 安装与 Peer 依赖

### 安装

```bash
# npm
npm install @scenemesh/entity-engine-aimodule

# yarn  
yarn add @scenemesh/entity-engine-aimodule

# pnpm
pnpm add @scenemesh/entity-engine-aimodule
```

### 必需 Peer 依赖

- **@scenemesh/entity-engine** (必需 - 核心框架)
- **react** >=18 <20
- **react-dom** >=18 <20  
- **@mantine/core** 8.2.5 (Entity Engine UI套件)
- **@mantine/modals** 8.2.5
- **typescript** >=5.0.0

### 可选 Peer（按需）

- AI提供商SDK会自动管理，无需手动安装

### 环境变量配置

```bash
# .env 或 .env.local
# 至少配置一个AI提供商
OPENAI_API_KEY=sk-your-openai-key
# 或者
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key  
# 或者
QWEN_API_KEY=sk-your-qwen-key
```

---

## 4. 快速上手

> 假设你已有基于Entity Engine的应用。

### 最小集成步骤

**1. 注册AI模块（3行代码）：**

```typescript
// 在你的Entity Engine初始化代码中
import { EntityAIModule } from '@scenemesh/entity-engine-aimodule';

// 添加到modules数组
const modules = [new EntityAIModule()];
```

**2. 配置AI提供商：**

```bash
# 添加环境变量
OPENAI_API_KEY=your-api-key
```

**3. 使用AI功能：**

- 表单视图自动出现"智能填表"按钮
- 点击按钮即可与AI对话，AI可直接操作表单

### Entity Engine集成验证

```typescript
// 检查AI模块是否正确注册
const engine = await getEntityEngine();
const aiModule = engine.moduleRegistry.getModule('entity-engine-ai-module');
console.log('AI Module registered:', !!aiModule);

// 检查AI服务端点
const response = await fetch('/api/ee/servlet/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    messages: [{ role: 'user', content: 'Hello' }] 
  })
});
console.log('AI Servlet available:', response.ok);
```

---

## 5. Entity Engine 集成详解

### 自动注册的组件

AI模块会向Entity Engine注册以下组件：

| 组件 | 注册信息 | 作用 |
| ---- | -------- | ---- |
| AI表单渲染器 | `name: 'view-form-tool-1', slotName: 'view-form-tool'` | 在表单中添加"智能填表"按钮 |
| AI模态渲染器 | `name: 'ai-modal-renderer', slotName: 'ai-modal'` | 提供AI对话界面 |
| AI统一Servlet | `path: '/ai', methods: ['POST', 'GET']` | 处理所有AI请求 |

### AI Servlet端点映射

```typescript
// 模块提供的统一AI服务端点
const endpoints = {
  '/api/ee/servlet/ai/chat': 'AI对话服务(useChat hook兼容)',
  '/api/ee/servlet/ai/completion': '文本补全服务', 
  '/api/ee/servlet/ai/object': '结构化对象生成',
  '/api/ee/servlet/ai/embeddings': '嵌入向量生成',
  '/api/ee/servlet/ai/frontend-tool-result': '前端工具结果回传'
};
```

### 视图控制器工具集

AI自动获得与Entity Engine视图控制器交互的能力：

```typescript
// AI可以调用的表单操作工具
const frontendTools = {
  recordGetValues: '获取表单所有字段值',
  recordSetValues: '设置表单字段值', 
  recordGetFieldInfo: '获取字段信息和准确字段名',
  recordResetForm: '重置表单到初始状态',
  recordValidateForm: '验证表单数据'
};

// AI可以调用的后端工具  
const backendTools = {
  entityQuery: 'Entity Engine实体数据查询',
  getWeather: '天气信息查询',
  getLocation: '位置信息获取'
};
```

### 模块生命周期

```typescript
export class EntityAIModule implements IEntityModule {
  // 1. 配置阶段 - 注册模型、视图、Servlet
  async setupConfig(args: {
    models: IEntityModel[];
    views: IEntityView[]; 
    servlets: IEntityServlet[];
  }): Promise<void>

  // 2. 组件阶段 - 注册渲染器和组件
  async setupComponents(args: {
    renderers: IEntityNamedRenderer[];
    widgets: EntityWidget[];
  }): Promise<void>

  // 3. 数据阶段 - 初始化AI核心服务
  async setupData(args: { entities: ImportEntityData[] }): Promise<void>
}
```

---

## 6. AI 工具系统架构

### 前后端混合工具架构

该模块采用独特的前后端工具混合调用架构：

```text
   AI Assistant
        |
   ┌────┴────┐
   │ AI SDK  │ (后端)
   └────┬────┘
        │ 工具调用
   ┌────┴────┐
   │ 工具路由 │
   └─┬─────┬─┘
     │     │
 前端工具  后端工具
     │     │
   ┌─▼─┐ ┌─▼──┐
   │浏览器││服务器│
   │执行  ││执行  │
   └───┘ └────┘
```

### 前端工具执行流程

```typescript
// 1. AI调用前端工具
AI: "调用 recordSetValues 工具"

// 2. 后端生成 waitId，通过HTTP通知前端
Backend -> Frontend: POST /api/frontend-tool-execute 
{ waitId: 'frontend-recordSetValues', toolName: 'recordSetValues', input: {...} }

// 3. 前端执行视图控制器操作  
Frontend: vc.invoke('record.setValues', input) 

// 4. 前端通过HTTP回传结果
Frontend -> Backend: POST /api/ee/servlet/ai/frontend-tool-result
{ waitId: 'frontend-recordSetValues', result: '操作成功' }

// 5. 后端返回结果给AI
Backend -> AI: "操作成功"
```

### 全局桥接机制

```typescript
// 前端全局桥接对象
window.__ENTITY_ENGINE_AI_BRIDGE__ = {
  executeViewControllerTool: async (toolName: string, input: any) => {
    const vc = engine.componentRegistry.getViewController(undefined, undefined, viewId);
    return await vc.invoke(operationMap[toolName], input);
  }
};

// HTTP通信桥接函数
window.resolveFrontendTool = (waitId: string, result: string) => {
  fetch('/api/ee/servlet/ai/frontend-tool-result', {
    method: 'POST',
    body: JSON.stringify({ waitId, result })
  });
};
```

---

## 7. 使用示例

### 基本AI对话功能

```typescript
// AI模块注册后，表单自动拥有AI功能
// 用户点击"智能填表"按钮即可与AI交互

// AI可以理解并执行这些指令：
"帮我填写用户信息，姓名是张三，年龄28岁"
"获取当前表单的所有字段值" 
"重置表单到初始状态"
"验证当前表单数据是否正确"
```

### 自定义AI工具扩展

```typescript
// 在AI模块中添加自定义工具
import { tool } from 'ai';
import { z } from 'zod';

// 定义业务工具
const businessTool = tool({
  description: '执行特定业务逻辑',
  inputSchema: z.object({
    action: z.string().describe('业务动作'),
    params: z.record(z.any()).describe('业务参数')
  }),
  execute: async ({ action, params }) => {
    // 业务逻辑实现
    const engine = await getEntityEngine();
    const ds = engine.datasourceFactory.getDataSource();
    
    if (action === 'createUser') {
      return await ds.create({
        modelName: 'user',
        data: { values: params }
      });
    }
    
    return '执行结果';
  }
});

// 工具会自动在AI对话中可用
```

### Entity Engine数据查询

```typescript
// AI可以通过entityQuery工具查询数据
const queryExamples = {
  // 简单查询
  "查询所有活跃用户": {
    model: 'user',
    query: {
      filter: { field: 'active', operator: 'eq', value: true }
    }
  },
  
  // 复杂条件查询  
  "查询管理员或年龄大于30的用户": {
    model: 'user', 
    query: {
      filter: {
        or: [
          { field: 'role', operator: 'eq', value: 'admin' },
          { field: 'age', operator: 'gt', value: 30 }
        ]
      }
    }
  },
  
  // 引用关系查询
  "查询某个产品关联的场景": {
    model: 'scene',
    query: {
      references: {
        fromModelName: 'product',
        fromFieldName: 'rootScene', 
        fromObjectId: 'product-123',
        toModelName: 'scene'
      }
    }
  }
};
```

### 表单智能填写示例

```typescript
// AI可以执行的表单操作示例
const formOperations = [
  // 获取字段信息
  "AI: 调用 recordGetFieldInfo()",
  "返回: [{ name: 'userName', title: '用户名', type: 'string' }, ...]",
  
  // 智能填写
  "用户: 帮我创建一个管理员用户，名字叫李四",
  "AI: 调用 recordSetValues({ values: { userName: '李四', role: 'admin' } })",
  "返回: 字段设置成功",
  
  // 表单验证
  "AI: 调用 recordValidateForm()",  
  "返回: { valid: true, errors: [] }",
  
  // 重置表单
  "用户: 重新开始",
  "AI: 调用 recordResetForm()",
  "返回: 表单已重置"
];
```

---

## 8. 高级配置

### 自定义AI提供商

```typescript
// AI Core Manager会自动从环境变量读取配置
// 支持的提供商：
const supportedProviders = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY', 
  qwen: 'QWEN_API_KEY', // 通义千问
  custom: 'CUSTOM_AI_API_KEY'
};

// 自定义提供商配置示例
const customConfig = {
  id: 'custom-ai',
  name: 'My Custom AI',
  baseURL: 'https://my-ai-service.com/v1',
  apiKey: process.env.CUSTOM_AI_KEY,
  models: ['my-model-v1', 'my-model-v2']
};
```

### AI核心服务配置

```typescript
// AICoreManager初始化配置
const coreConfig = {
  providers: { 
    autoHealthCheck: true,  // 自动健康检查
    fallbackEnabled: true   // 启用提供商回退
  },
  tools: { 
    enableMCP: true,        // 启用MCP工具
    enableDynamic: true     // 启用动态工具
  },
  embeddings: { 
    defaultModel: 'text-embedding-v1' // 默认嵌入模型
  }
};
```

### 工具系统定制

```typescript
// 扩展前端工具映射
const customOperationMap = {
  'recordGetValues': 'record.getValues',
  'recordSetValues': 'record.setValues', 
  'customOperation': 'custom.execute', // 自定义操作
};

// 自定义工具执行逻辑
const executeCustomTool = async (toolName: string, input: any) => {
  const vc = engine.componentRegistry.getViewController(undefined, undefined, viewId);
  
  if (toolName === 'customOperation') {
    // 自定义操作逻辑
    return await vc.invoke('custom.execute', input);
  }
  
  return await vc.invoke(customOperationMap[toolName], input);
};
```

---

## 9. 技术架构

### 包结构

```
@scenemesh/entity-engine-aimodule/
├── src/
│   ├── entity-module/           # Entity Engine集成层  
│   │   ├── ai.module.ts        # 主模块文件 - IEntityModule实现
│   │   ├── renderers/          # AI渲染器注册
│   │   │   ├── ai-form-renderer.tsx   # 表单AI按钮渲染器
│   │   │   └── ai-renderer.tsx        # AI模态对话渲染器  
│   │   ├── servlets/           # AI服务端点
│   │   │   └── ai-servlet.ts   # 统一AI Servlet处理器
│   │   ├── models/             # Entity模型定义
│   │   └── views/              # Entity视图定义
│   ├── core/                   # AI核心服务
│   │   ├── ai-core-manager.ts  # 核心管理器 - 统一AI功能管理
│   │   ├── ai-provider.ts      # 提供商管理 - 多AI服务商支持
│   │   ├── ai-tools.ts         # 工具集成 - MCP和动态工具
│   │   ├── ai-embeddings.ts    # 嵌入向量服务
│   │   └── ai-structured.ts    # 结构化数据生成
│   ├── tools/                  # 工具定义
│   │   ├── frontend-tools/     # 前端工具 - 视图控制器操作
│   │   ├── dynamic-tools/      # 动态工具 - Entity查询等
│   │   └── static-tools/       # 静态工具 - 天气、位置等
│   ├── components/             # React组件
│   │   └── ChatDialog/         # AI对话组件
│   └── types/                  # TypeScript定义
```

### 核心类关系

```typescript
// 主要类和接口
interface IEntityModule {
  setupConfig(args): Promise<void>    // 注册模型、视图、Servlet
  setupComponents(args): Promise<void> // 注册渲染器、组件  
  setupData(args): Promise<void>      // 初始化数据
}

class EntityAIModule implements IEntityModule {
  private coreManager: AICoreManager  // AI核心管理器
  // Entity Engine模块接口实现
}

class AICoreManager {
  aiSDK: AISDKIntegration            // AI SDK集成
  providerManagement: AIProviderManagement  // 提供商管理
  toolsIntegration: AIToolsIntegration      // 工具集成
  embeddingsIntegration: AIEmbeddingsIntegration // 嵌入向量
}
```

### 打包配置

```typescript
// tsup.config.ts - 三个独立bundle
export default defineConfig([
  // 主bundle - Entity Engine集成 (Universal)
  { entry: ['src/index.ts'], platform: 'neutral' },
  
  // UI bundle - React组件 (Browser)
  { entry: ['src/ui-index.ts'], platform: 'browser', banner: { js: '"use client";' } },
  
  // 核心bundle - AI服务 (Node.js/Browser)
  { entry: ['src/core-index.ts'], platform: 'neutral' }
]);
```

---

## 10. API 参考

### Entity Engine集成API

```typescript
// AI模块类
class EntityAIModule implements IEntityModule {
  constructor()
  static getInstance(): EntityAIModule | null
  async setupConfig(args): Promise<void>
  async setupComponents(args): Promise<void>  
  async setupData(args): Promise<void>
}

// 模块工厂函数
async function createEntityAIModule(): Promise<EntityAIModule>
```

### AI核心API

```typescript
// 工厂函数
async function createaimodule(config?: AIModuleConfig): Promise<AIModule>
async function createQuickAI(providers?: ProviderConfig[]): Promise<AIModule>

// 配置接口
interface AIModuleConfig {
  providers?: CustomProviderConfig[];
  settings?: Partial<ModelSettings>;
  enableEmbeddings?: boolean;
  enableTools?: boolean;
}
```

### 视图控制器工具API

```typescript
// 前端工具接口
interface ViewControllerTools {
  recordGetValues(): Promise<Record<string, any>>
  recordSetValues(values: Record<string, any>): Promise<string>
  recordGetFieldInfo(fieldName?: string): Promise<FieldInfo[]>
  recordResetForm(): Promise<string>
  recordValidateForm(): Promise<ValidationResult>
}

// Entity查询工具
interface EntityQueryTool {
  execute(options: {
    model: string;
    query: IEntityQuery;
  }): Promise<{ data: IEntityObject[]; count: number }>
}
```

### Servlet API

```typescript
// AI对话接口
interface ChatRequest {
  messages: UIMessage[];
  model?: string;
  temperature?: number;
  tools?: boolean;
}

// 结构化生成接口
interface ObjectRequest {
  prompt: string;
  schema: ZodSchema;
  model?: string;
}

// 前端工具结果接口
interface FrontendToolResult {
  waitId: string;
  result?: string;
  error?: string;
  timestamp: number;
}
```

---

## 11. 故障排除

### 常见问题诊断

**Q: AI按钮没有出现在表单中？**

```typescript
// 1. 检查AI模块注册
const engine = await getEntityEngine();
const modules = engine.moduleRegistry.getAllModules();
console.log('Registered modules:', modules.map(m => m.info.name));

// 2. 检查渲染器注册
const renderers = engine.componentRegistry.getAllRenderers();
const aiRenderer = renderers.find(r => r.name === 'view-form-tool-1');
console.log('AI Form Renderer:', aiRenderer);

// 3. 检查环境变量
console.log('AI Keys configured:', {
  openai: !!process.env.OPENAI_API_KEY,
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  qwen: !!process.env.QWEN_API_KEY
});
```

**Q: AI无法操作表单字段？**

```typescript  
// 1. 检查视图控制器
const vc = engine.componentRegistry.getViewController(undefined, undefined, viewId);
console.log('View Controller:', vc);
console.log('View Controller operations:', vc?.describe?.());

// 2. 检查字段映射
const fieldInfo = await vc.invoke('record.getFieldInfo', {});
console.log('Available fields:', fieldInfo);

// 3. 检查前端桥接
console.log('Frontend bridge:', window.__ENTITY_ENGINE_AI_BRIDGE__);
```

**Q: 工具调用失败或超时？**

```typescript
// 1. 检查工具注册
const coreManager = EntityAIModule.getInstance()?.coreManager;
console.log('Tools available:', coreManager?.toolsIntegration?.getAllTools?.());

// 2. 检查前后端通信
// 前端监听
window.addEventListener('beforeunload', () => {
  console.log('Frontend tool wait pool:', frontendToolWaitPool.size);
});

// 3. 检查HTTP端点
const response = await fetch('/api/ee/servlet/ai/frontend-tool-result', {
  method: 'POST',
  body: JSON.stringify({ waitId: 'test', result: 'test' })
});
console.log('Frontend tool endpoint:', response.status);
```

### 调试模式

```typescript
// 1. 启用AI调试日志
process.env.AI_DEBUG = 'true';

// 2. 启用详细工具执行日志  
localStorage.setItem('ai-tools-debug', 'true');

// 3. 监控工具调用
console.log('Tool call:', { toolName, input, timestamp: Date.now() });
console.log('Tool result:', { result, duration: Date.now() - start });

// 4. 检查网络请求
// 在DevTools Network面板监控:
// - /api/ee/servlet/ai/chat (AI对话)
// - /api/ee/servlet/ai/frontend-tool-result (前端工具结果)
```

### 性能优化

```typescript
// 1. 工具调用缓存
const toolResultCache = new Map();

// 2. 减少不必要的重渲染
const ChatDialogMemo = React.memo(ChatDialog);

// 3. 前端工具执行超时设置
const FRONTEND_TOOL_TIMEOUT = 30000; // 30秒

// 4. AI请求去重
const requestDeduplication = new Set();
```

---

## 12. Roadmap

| 状态 | 目标 | 说明 |
| ---- | ---- | ---- |
| ✅ | Entity Engine模块集成 | 完整的IEntityModule实现 |  
| ✅ | 前后端工具混合调用 | 独特的工具执行架构 |
| ✅ | 视图控制器直接操作 | AI可直接操作表单组件 |
| ✅ | 多AI提供商支持 | OpenAI、Anthropic、通义千问 |
| ⏳ | 工具执行可视化面板 | 调试和监控工具调用过程 |
| ⏳ | AI辅助视图生成 | 基于模型自动生成视图配置 |
| ⏳ | 智能查询构建 | 自然语言转换为Entity查询DSL |
| ⏳ | 批量操作工具 | 支持批量数据处理和导入 |
| ⏳ | 工作流集成 | 与Entity Engine动作系统集成 |
| ⏳ | 多模态支持 | 图像、文件上传与AI分析 |

欢迎在 Issue / PR 中提出你的需求和建议。

---

## 13. 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🤝 技术支持

- 🐛 **问题反馈**: [GitHub Issues](https://github.com/scenemesh/entity-engine-aimodule/issues)
- 📧 **邮件支持**: contact@scenemesh.com  
- 📖 **Entity Engine文档**: [@scenemesh/entity-engine](https://github.com/scenemesh/entity-engine)

---

> **重要提醒**: 该包仅适用于基于SceneMesh Entity Engine框架构建的应用系统。如需通用AI集成方案，请选择其他AI SDK。

> Keep building AI-powered data applications with Entity Engine.