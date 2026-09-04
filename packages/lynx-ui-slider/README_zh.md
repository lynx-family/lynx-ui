# @lynx-js/lynx-ui-slider

一个适用于 ReactLynx 的 Slider 组件包，优先提供可组合的基础能力，同时支持单值滑块和双拇指区间滑块。

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

区间模式通过 `value` 或 `defaultValue` 传入有序二元组，并使用两个带索引的 `SliderThumb`：

```tsx
<SliderRoot defaultValue={[0.2, 0.8]}>
  <SliderTrack>
    <SliderIndicator />
    <SliderThumb index={0} />
    <SliderThumb index={1} />
  </SliderTrack>
</SliderRoot>
```

`index={0}` 表示下限，`index={1}` 表示上限。区间值会按升序归一化、限制在 `[0, 1]` 内，并在设置 `step` 时吸附到对应步进。区间拇指明确采用禁止交叉的碰撞策略：两个拇指可以重合，但活动拇指会停在另一个值处，不会交换身份或推动另一个拇指。这是稳定的默认行为。`SliderIndicator` 在区间模式下渲染两个拇指之间的选中范围。

两种值形态共用泛型 `SliderRootProps<Value>` 与 `SliderRef<Value>`。泛型默认为 `number`；需要显式标注区间时使用 `SliderRangeValue`。

## 关于 @lynx-js/lynx-ui

该包是 `@lynx-js/lynx-ui` 的一部分。`@lynx-js/lynx-ui` 是 Lynx 团队维护的无样式 UI 组件库，用于构建灵活、通用且高性能的 ReactLynx 组件。

## 许可证

[**lynx-ui**](https://github.com/lynx-family/lynx-ui) 基于 [**Apache License 2.0**](./LICENSE) 许可发布。
