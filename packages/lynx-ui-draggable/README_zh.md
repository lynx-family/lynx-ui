# @lynx-js/lynx-ui-draggable

一个适用于 ReactLynx 的无样式拖拽组件，通过主线程执行提供拖拽基础能力。

## 安装

强烈建议通过主包 `@lynx-js/lynx-ui` 安装并使用该包：

```bash
# pnpm（推荐）
pnpm add @lynx-js/lynx-ui

# npm
npm install @lynx-js/lynx-ui

# yarn
yarn add @lynx-js/lynx-ui
```

_（如有需要，也可以通过 `pnpm add @lynx-js/lynx-ui-draggable` 单独安装该包）_

## 使用

[查看完整示例](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Draggable)

## 组件结构

当整个组件都需要响应拖拽时，使用 `Draggable`。

```tsx
<Draggable>
  {/* Your content */}
</Draggable>
```

当只有特定区域需要响应拖拽时，使用 `DraggableRoot` 和 `DraggableArea`。

```tsx
<DraggableRoot>
  <DraggableArea>{/* Your draggable area content */}</DraggableArea>
</DraggableRoot>
```

- **`Draggable`**：独立的可拖拽组件。
- **`DraggableRoot`**：提供拖拽上下文并管理拖拽逻辑。
- **`DraggableArea`**：消费拖拽上下文，并将拖拽行为应用到指定区域。
- **`useDraggable`**：用于自定义拖拽实现的 Hook。

## 关于 @lynx-js/lynx-ui

该包是 `@lynx-js/lynx-ui` 的一部分。`@lynx-js/lynx-ui` 是 Lynx 团队维护的无样式 UI 组件库，用于构建灵活、通用且高性能的 ReactLynx 组件。

## 许可证

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) 基于 [**Apache License 2.0**](./LICENSE) 许可发布。
