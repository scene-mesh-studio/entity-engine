# SceneMesh Studio

SceneMesh Studio 是一个专注于场景化技术解决方案的创新技术工作室，致力于通过技术融合创新，构建高效的应用开发场景。

## 🎯 工作室定位

**SceneMesh Studio** 是一个技术创新驱动的开源产品孵化器，专注于：

- **元数据驱动架构**: 工作室核心技术理念和专长领域
- **React生态深耕**: 专注于React技术栈的深度应用和创新
- **企业级解决方案**: 擅长构建可扩展的企业级技术产品
- **开源生态建设**: 通过开源推动技术进步和社区发展

## 🚀 项目概述

SceneMesh Platform Workbench 是工作室的核心产品之一，一个基于现代技术栈构建的企业级平台工作台，采用 Monorepo 架构，集成了实体引擎和可视化工作台。

## 🚀 项目概述

SceneMesh Platform Workbench 是一个多包管理的全栈项目，旨在提供一个功能丰富、可扩展的企业级管理平台。项目采用 Turborepo 构建系统，支持高效的开发工作流和模块化架构。

### 主要特性

- 🏗️ **Monorepo 架构**: 基于 Turborepo 的多包管理
- ⚡ **Next.js 14**: 现代化的 React 全栈框架
- 🎨 **现代化 UI**: 基于 Material-UI 和自定义组件库
- 🗃️ **实体引擎**: 强大的数据建模和管理引擎
- 🔐 **身份认证**: 集成 Auth0 认证系统
- 📊 **数据可视化**: 内置图表和数据展示组件
- 💾 **数据持久化**: Prisma ORM + PostgreSQL
- 🔧 **开发体验**: TypeScript、ESLint、Prettier 完整工具链

## 📁 项目结构

```text
scenemesh-platform-workbench5/
├── apps/
│   └── workbench/           # 主要的 Next.js 应用
│       ├── src/
│       │   ├── app/         # App Router 页面
│       │   ├── components/  # 可复用组件
│       │   ├── sections/    # 页面级组件
│       │   ├── auth/        # 认证相关
│       │   ├── entity/      # 实体管理
│       │   └── ...
│       └── public/          # 静态资源
│
├── packages/
│   ├── entity-engine/       # 实体引擎核心包
│   │   ├── src/            # 源代码
│   │   └── prisma/         # 数据库模式
│   ├── eslint-config/      # ESLint 配置
│   └── tsconfig/           # TypeScript 配置
│
├── package.json            # 根配置文件
└── turbo.json             # Turborepo 配置
```

## 🛠️ 技术栈

### 前端技术

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **UI 库**: Material-UI (MUI)
- **状态管理**: React Context + Hooks
- **认证**: Auth0 React SDK
- **图表**: Chart.js / Recharts
- **拖拽**: dnd-kit
- **国际化**: next-intl

### 后端技术

- **ORM**: Prisma
- **数据库**: PostgreSQL / SQLite
- **API**: Next.js API Routes

### 开发工具

- **构建工具**: Turborepo + Next.js
- **代码质量**: ESLint + Prettier
- **类型检查**: TypeScript
- **包管理**: Yarn

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- Yarn 1.22.x
- PostgreSQL (生产环境)

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd scenemesh-platform-workbench5

# 安装依赖
yarn install
```

### 环境配置

1. 复制环境变量文件：

```bash
cp .env.example .env.local
```

2. 配置数据库连接：

```bash
# 在 .env.local 中配置
DATABASE_URL="postgresql://username:password@localhost:5432/scenemesh"
```

3. 配置 Auth0（可选）：

```bash
AUTH0_SECRET='your-auth0-secret'
AUTH0_BASE_URL='http://localhost:8082'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
```

### 初始化数据库

```bash
# 生成 Prisma 客户端
yarn db:generate

# 运行数据库迁移
yarn db:migrate
```

### 启动开发服务器

```bash
# 启动所有服务
yarn dev

# 或者只启动工作台应用
yarn dev:wk
```

应用将在 `http://localhost:8082` 启动。

## 📖 开发指南

### 可用脚本

```bash
# 开发命令
yarn dev                    # 启动所有包的开发模式
yarn dev:wk                # 仅启动工作台应用

# 构建命令
yarn build                 # 构建所有包
yarn build:wk              # 仅构建工作台应用
yarn build:ee              # 仅构建实体引擎

# 代码质量
yarn lint                  # 运行 ESLint 检查
yarn lint:fix              # 自动修复 ESLint 错误
yarn format                # 格式化代码

# 数据库操作
yarn db:generate           # 生成 Prisma 客户端
yarn db:migrate            # 运行数据库迁移
yarn db:studio             # 打开 Prisma Studio

# 清理
yarn clean                 # 清理所有构建产物和依赖
```

### 包结构说明

#### `@scenemesh/workbench`

主要的 Next.js 应用，包含：

- 用户界面和交互逻辑
- 路由和页面组件
- 身份认证和权限管理
- 数据展示和可视化

#### `@scenemesh/entity-engine`

实体引擎核心包，提供：

- 数据模型定义和管理
- CRUD 操作抽象
- 数据验证和转换
- 数据库交互层

### 代码规范

项目采用统一的代码规范：

- **TypeScript**: 严格模式，完整类型定义
- **ESLint**: 基于推荐规则 + 自定义规则
- **Prettier**: 统一代码格式化
- **文件命名**: kebab-case 用于文件名，PascalCase 用于组件

### 开发最佳实践

1. **组件开发**:
   - 优先使用函数组件和 Hooks
   - 保持组件单一职责
   - 合理使用 TypeScript 类型定义

2. **状态管理**:
   - 使用 React Context 进行全局状态管理
   - 避免过度嵌套的 Context
   - 合理使用 useReducer 管理复杂状态

3. **性能优化**:
   - 合理使用 React.memo 和 useMemo
   - 避免不必要的重渲染
   - 使用 Next.js 的 SSR/SSG 特性

## 🏗️ 部署

### 构建生产版本

```bash
# 构建所有包
yarn build

# 构建特定包
yarn build:wk
```

### Docker 部署（推荐）

```bash
# 构建 Docker 镜像
docker build -t scenemesh-workbench .

# 运行容器
docker run -p 8082:8082 -e DATABASE_URL="your-db-url" scenemesh-workbench
```

### Vercel 部署

项目支持一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/scenemesh-platform-workbench5)

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交信息规范

请使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```text
feat: 添加新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 重构代码
test: 添加或修改测试
chore: 构建过程或辅助工具的变动
```

## 📝 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🙋‍♂️ 支持

如果您在使用过程中遇到问题，请通过以下方式获取帮助：

- 🐛 [提交 Issue](../../issues)
- 💬 [讨论区](../../discussions)
- 📧 邮箱：<support@scenemesh.com>

## 🎯 路线图

- [ ] 增强实体引擎功能
- [ ] 添加更多数据可视化组件
- [ ] 改进移动端适配
- [ ] 添加插件系统
- [ ] 性能优化和缓存策略

## 📊 项目状态

![GitHub last commit](https://img.shields.io/github/last-commit/your-username/scenemesh-platform-workbench5)
![GitHub issues](https://img.shields.io/github/issues/your-username/scenemesh-platform-workbench5)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/scenemesh-platform-workbench5)
![GitHub](https://img.shields.io/github/license/your-username/scenemesh-platform-workbench5)

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！
