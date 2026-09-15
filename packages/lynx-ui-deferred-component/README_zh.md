# @lynx-js/lynx-ui-deferred-component

适用于 ReactLynx 的延迟渲染组件。`DeferredComponent` 在首次布局后或等待指定帧数后挂载子节点，并支持自定义占位内容。

## 安装

推荐通过主包 `@lynx-js/lynx-ui` 安装：

```bash
pnpm add @lynx-js/lynx-ui
```

也可以单独安装 `@lynx-js/lynx-ui-deferred-component`。

## 组件结构

```tsx
import { DeferredComponent } from '@lynx-js/lynx-ui'

<DeferredComponent estimatedStyle={{ width: '100%', minHeight: '120px' }}>
  <text>延迟显示的内容</text>
</DeferredComponent>
```

`DeferredComponent` 是一个独立组件，不包含子组件。

## 文档

- [完整示例](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/DeferredComponent)
- [API 参考](./docs/APIReference.mdx)
- [组件使用指南](./SKILL.md)

## 关于 @lynx-js/lynx-ui

该组件是 `@lynx-js/lynx-ui` 的一部分。`lynx-ui` 是 Lynx 团队维护的 ReactLynx 无样式组件库。

## 许可证

[Apache License 2.0](./LICENSE)
