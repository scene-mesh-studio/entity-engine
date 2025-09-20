# Entity Engine Studio Plugin

这个插件为 Entity Engine 提供了一个弹框式的 Studio 工作空间，允许用户通过 shell 设置菜单快速打开和使用 Studio 功能。

## 功能特性

- 🎯 **弹框式界面**: 通过模态框形式打开 Studio，无需离开当前页面
- 🔧 **集成设置菜单**: 在 shell-settings-menu 插槽中添加"打开 Studio"选项
- 🚀 **完整工作空间**: 包含完整的 UnifiedConfigurationWorkspace 功能
- 💾 **配置保存**: 支持配置保存和取消操作

## 使用方法

### 1. 导入插件

```typescript
import { studioRenderers, EntityEngineStudioLauncher } from '@scenemesh/entity-engine-studio';
```

### 2. 注册渲染器

在你的 Entity Engine 配置中注册 Studio 渲染器：

```typescript
// 方式一：批量注册
engine.registerRenderers(studioRenderers);

// 方式二：单独注册
engine.registerRenderer(EntityEngineStudioLauncher);
```

### 3. 确保依赖

确保你的应用已经安装了必要的依赖：

- `@mantine/core`
- `@mantine/modals`
- `lucide-react`

### 4. 模态框提供者

确保你的应用根部包含了 Mantine 的 ModalsProvider：

```typescript
import { ModalsProvider } from '@mantine/modals';

function App() {
  return (
    <ModalsProvider>
      {/* 你的应用内容 */}
    </ModalsProvider>
  );
}
```

## 工作原理

1. **插槽注册**: 插件注册到 `shell-settings-menu` 插槽
2. **菜单显示**: 在 shell 视图的设置菜单中显示"打开 Studio"选项
3. **弹框打开**: 点击后通过 `@mantine/modals` 打开大尺寸模态框
4. **工作空间加载**: 模态框内加载完整的 UnifiedConfigurationWorkspace
5. **引擎共享**: 使用当前页面的 EntityEngine 实例

## 组件结构

```
src/renderers/studio/
├── index.tsx           # 主渲染器和菜单组件
└── studio-modal.tsx    # 弹框内容组件
```

## 配置选项

弹框默认配置：
- 大小: 95% 视口宽度
- 高度: 90% 视口高度
- 居中显示
- 支持 ESC 键关闭
- 不支持点击外部关闭（防止意外关闭）

## 自定义样式

你可以通过 Mantine 的主题系统自定义弹框样式：

```typescript
// 在你的主题配置中
const theme = {
  components: {
    Modal: {
      styles: {
        modal: {
          // 自定义模态框样式
        }
      }
    }
  }
};
```

## 注意事项

1. **引擎依赖**: 插件需要在 EntityEngine 上下文中使用
2. **模态框管理**: 使用 Mantine 的模态框系统，确保正确的提供者配置
3. **性能考虑**: Studio 工作空间较重，建议按需加载
4. **兼容性**: 需要现代浏览器支持，建议 ES2020+ 环境

## 故障排除

### 常见问题

1. **模态框不显示**: 检查 ModalsProvider 是否正确配置
2. **样式异常**: 确保 Mantine CSS 已正确导入
3. **功能缺失**: 检查 EntityEngine 实例是否可用

### 调试信息

插件会在控制台输出相关日志，可通过浏览器开发者工具查看。