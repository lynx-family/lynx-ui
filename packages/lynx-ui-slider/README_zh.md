# @lynx-js/lynx-ui-slider

一个适用于 ReactLynx 的 Slider 组件包，优先提供可组合的基础能力。

## 安装

建议通过主包 `@lynx-js/lynx-ui` 安装并使用该包：

```bash
# pnpm（推荐）
pnpm add @lynx-js/lynx-ui

# npm
npm install @lynx-js/lynx-ui

# yarn
yarn add @lynx-js/lynx-ui
```

_（如有需要，也可以通过 `pnpm add @lynx-js/lynx-ui-slider` 单独安装该包）_

## 使用

[查看完整示例](https://github.com/lynx-family/lynx-ui/tree/main/apps/examples/Slider)

## 组件结构

```tsx
<SliderRoot>
  <SliderTrack>
    <SliderIndicator />
    <SliderThumb>
      <view />
    </SliderThumb>
  </SliderTrack>
</SliderRoot>
```

## 关于 @lynx-js/lynx-ui

该包是 `@lynx-js/lynx-ui` 的一部分。`@lynx-js/lynx-ui` 是 Lynx 团队维护的无样式 UI 组件库，用于构建灵活、通用且高性能的 ReactLynx 组件。

## 许可证

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) 基于 [**Apache License 2.0**](./LICENSE) 许可发布。
