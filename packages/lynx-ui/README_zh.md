# @lynx-js/lynx-ui

`@lynx-js/lynx-ui` 是 ReactLynx 官方无样式 UI 组件库，用于构建灵活、通用且高性能的 Lynx 组件。

## 介绍

我们通过前端组件扩展原生组件能力，面向高性能、接近原生体验且具备广泛兼容性的 Lynx 组件生态。

同一平台上的 UI 特性通常在行为、API 甚至设计理念上都存在差异，尤其是高级能力。跨平台框架必须弥合这些差异，Lynx 也不例外。

这正是 `lynx-ui` 的价值所在：它精简并统一分散的原子 API，调和底层行为和限制，在不同平台上提供一致体验。

## 安装

`lynx-ui` 支持完整引入，也支持按组件单独引入。

### 方式 1：完整引入（推荐）

引入完整的 `lynx-ui` 包。支持 tree-shaking，未使用的组件不会增加最终构建产物大小。

```bash
pnpm add @lynx-js/lynx-ui
```

**使用：**

```tsx
import { Button } from '@lynx-js/lynx-ui'

export default function App() {
  return (
    <view>
      <Button>Hello</Button>
    </view>
  )
}
```

### 方式 2：按组件单独引入

每个 `lynx-ui` 组件都会作为独立包分发。可在兼容性或特定需求场景下使用这种方式。

**以 `<Button>` 为例：**

```bash
pnpm add @lynx-js/lynx-ui-button
```

**使用：**

```tsx
import { Button } from '@lynx-js/lynx-ui-button'

export default function App() {
  return (
    <view>
      <Button>Hello</Button>
    </view>
  )
}
```

## 配置

如果你正在使用 `rspeedy`，请按如下方式配置 `pluginReactLynx`：

```typescript
// lynx.config.ts
import { defineConfig } from '@lynx-js/rspeedy'

export default defineConfig({
  plugins: [
    pluginReactLynx({
      enableNewGesture: true,
    }),
  ],
})
```

## 兼容性

- **LynxSDK**: >= 3.2

> 这些是完整引入的要求。单个组件可能有不同的版本要求。

## 开发

如果你有兴趣为 `lynx-ui` 贡献代码，请阅读我们的[贡献指南](./CONTRIBUTING.md)。

## 许可证

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) 基于 [**Apache License 2.0**](./LICENSE) 许可发布。
