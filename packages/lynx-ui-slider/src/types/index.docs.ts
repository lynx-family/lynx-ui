// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'

/**
 * Source of a value change.
 *
 * - `external`: value updated by imperative API calls.
 * - `drag`: value updated by pointer/touch dragging.
 *
 * @zh 值变更的来源。
 *
 * - `external`：通过命令式 API 调用更新。
 * - `drag`：通过指针/触摸拖拽更新。
 */
export type SliderValueChangeSource = 'external' | 'drag'

/**
 * Ordered lower and upper values for a range slider. Both values use the normalized `[0, 1]` scale.
 * During dragging, the lower and upper thumbs may meet, but they never cross,
 * swap identities, or push one another.
 * @zh 区间滑块的下限值和上限值。两个值都使用标准化的 `[0, 1]` 范围。
 * 拖拽时，下限和上限拇指可以相遇，但不会交叉、交换身份或推动彼此。
 */
export type SliderRangeValue = readonly [number, number]

/**
 * Value accepted by `SliderRoot`: either one normalized value or an ordered
 * lower/upper tuple.
 * @zh `SliderRoot` 接受的值：单个标准化数值，或有序的下限/上限二元组。
 */
export type SliderValue = number | SliderRangeValue

type ResolvedSliderValue<Value extends SliderValue> = Value extends
  SliderRangeValue ? SliderRangeValue : number

/**
 * Index of a slider thumb. A single-value slider uses index `0`; a range
 * slider uses index `0` for the lower value and `1` for the upper value.
 * @zh 滑块拇指的索引。单值滑块使用索引 `0`；区间滑块使用索引 `0` 表示下限、索引 `1` 表示上限。
 */
export type SliderThumbIndex = 0 | 1

/**
 * UI variants applied by slider primitives based on interaction state.
 * Use them as CSS selectors to style active and disabled states.
 * @zh 滑块原语根据交互状态注入的 ui-variants，可用于 CSS selector 定制激活态和禁用态。
 */
export interface SliderUIVariants {
  /**
   * Applied while the slider is actively being interacted with. On `SliderThumb`, only the active thumb receives this variant.
   * @zh 滑块处于交互中时生效。在 `SliderThumb` 上，仅当前活动的拇指会获得此状态。
   * @iOS
   * @Android
   * @Harmony
   */
  'ui-active'?: boolean

  /**
   * Applied when the slider is disabled.
   * @zh 滑块被禁用时生效。
   * @iOS
   * @Android
   * @Harmony
   */
  'ui-disabled'?: boolean
}

/**
 * Options used by `SliderRef.updateValue`.
 * @zh `SliderRef.updateValue` 使用的选项。
 */
export interface SliderUpdateValueOptions {
  /**
   * Mark the update source for analytics/logic branching.
   * @defaultValue 'external'
   * @zh 标记更新来源，用于分析或逻辑分支。
   */
  source?: SliderValueChangeSource
  /**
   * Bypass drag-time guard and force update even while dragging.
   * @defaultValue false
   * @zh 跳过拖拽保护，在拖拽过程中也强制更新。
   */
  force?: boolean
}

/**
 * Imperative methods exposed by `SliderRoot` for the selected value shape.
 * The generic defaults to `number` for compatibility with existing
 * single-value refs; use `SliderRef<SliderRangeValue>` for a range slider.
 * @zh `SliderRoot` 针对所选值形态暴露的命令式方法。泛型默认为 `number`，以兼容现有单值 ref；区间滑块请使用 `SliderRef<SliderRangeValue>`。
 */
export interface SliderRef<in out Value extends SliderValue = number> {
  /**
   * Imperatively set the slider value. Every number in the selected value
   * shape uses the normalized range `[0, 1]`.
   * @docTypeFallback (value: number | SliderRangeValue, options?: SliderUpdateValueOptions) => void
   * @zh 命令式地设置滑块值。所选值形态中的每个数值都使用标准化范围 `[0, 1]`。
   */
  updateValue: (
    value: ResolvedSliderValue<Value>,
    options?: SliderUpdateValueOptions,
  ) => void
  /**
   * Read the current slider value using the selected value shape.
   * @docTypeFallback () => number | SliderRangeValue
   * @zh 使用所选值形态读取当前滑块值。
   */
  getValue: () => ResolvedSliderValue<Value>
}

/**
 * Root primitive props for the selected value shape.
 *
 * `SliderRoot` owns interaction logic (dragging and value tracking)
 * and provides context for child primitives. Pass a `number` for a
 * single-value slider or a `SliderRangeValue` tuple for a range slider. The
 * generic defaults to `number` for compatibility and is normally inferred
 * from `value` or `defaultValue`.
 * @zh 针对所选值形态的根原语组件属性。
 *
 * `SliderRoot` 负责交互逻辑（拖拽、值跟踪）并为子原语组件提供上下文。传入 `number` 创建单值滑块，传入 `SliderRangeValue` 二元组创建区间滑块。泛型默认为 `number` 以保持兼容，通常可根据 `value` 或 `defaultValue` 自动推断。
 */
interface SliderRootBaseProps<Value extends SliderValue>
  extends ComponentBasicProps
{
  /**
   * Stepping interval in range `[0, 1]`. When set, the value snaps to the nearest multiple of `step`.
   * @zh 步进间隔，范围 `[0, 1]`。设置后值会吸附到最近的 `step` 倍数。
   */
  step?: number
  /**
   * Disable the slider and prevent pointer/touch interaction.
   * @defaultValue false
   * @zh 禁用滑块，阻止指针/触摸交互。
   */
  disabled?: boolean
  /**
   * Enable right-to-left layout. When `true`, the slider range grows from right to left.
   * @defaultValue false
   * @zh 启用从右到左的布局。为 `true` 时，滑块范围从右向左增长。
   */
  enableRTL?: boolean
  /**
   * Triggered when dragging state changes, with the current slider value.
   * The callback fires when dragging starts and when dragging ends.
   * @docTypeFallback (value: number | SliderRangeValue) => void
   * @zh 拖拽状态变化时触发，传入当前滑块值。开始拖拽和结束拖拽时都会触发。
   */
  onDragging?: (value: ResolvedSliderValue<Value>) => void
  /**
   * Triggered after slider-driven value updates, including dragging and
   * `SliderRef.updateValue`. In controlled mode, use this callback to keep
   * the external `value` prop in sync with the rendered value.
   * @docTypeFallback (value: number | SliderRangeValue, source: SliderValueChangeSource) => void
   * @zh 由滑块自身驱动的值更新后触发，包括拖拽和 `SliderRef.updateValue`。在受控模式下，请通过此回调让外部 `value` 属性与渲染值保持同步。
   */
  onValueChange?: (
    value: ResolvedSliderValue<Value>,
    source: SliderValueChangeSource,
  ) => void
  /**
   * Triggered at the end of a drag interaction with the final value.
   * @docTypeFallback (value: number | SliderRangeValue) => void
   * @zh 拖拽交互结束时以最终值触发。适用于只需要最终提交值的场景，例如持久化到后端。
   */
  onValueCommit?: (value: ResolvedSliderValue<Value>) => void
  /**
   * Primitive children composition, usually: `SliderTrack` containing `SliderIndicator` and optional `SliderThumb`.
   * @zh 子原语组件组合，通常为：`SliderTrack` 内包含 `SliderIndicator` 以及可选的 `SliderThumb`。
   */
  children?: ReactNode
}

type SliderExclusiveValueProps<Value extends SliderValue> =
  | {
    value: Value
    defaultValue?: never
  }
  | {
    value?: never
    defaultValue: Value
  }

interface SliderScalarValueProps<Value extends number> {
  /**
   * Controlled slider value. Pass a number in `[0, 1]` or an ordered
   * lower/upper tuple. Do not use together with `defaultValue`.
   * @docTypeFallback number | SliderRangeValue
   * @zh 受控滑块值。传入范围 `[0, 1]` 内的数值或有序的下限/上限二元组。请勿与 `defaultValue` 同时使用。
   */
  value?: Value
  /**
   * Initial value for uncontrolled usage. A single-value slider starts at
   * `0` when omitted; a range slider must provide a tuple.
   * @defaultValue 0
   * @docTypeFallback number | SliderRangeValue
   * @zh 非受控模式下的初始值。省略时，单值滑块从 `0` 开始；区间滑块必须提供二元组。
   */
  defaultValue?: Value
}

type SliderMixedValueProps<Value extends SliderValue> =
  | {
    value?: Extract<Value, number>
    defaultValue?: Extract<Value, number>
  }
  | SliderExclusiveValueProps<Value>

// Keep the pre-range optional scalar pair source-compatible. Range and mixed
// value shapes stay exclusive so controlled mode is unambiguous.
type SliderValueProps<Value extends SliderValue> = [Value] extends [number]
  ? SliderScalarValueProps<Value>
  : [Value] extends [SliderRangeValue] ? SliderExclusiveValueProps<Value>
  : SliderMixedValueProps<Value>

/**
 * Root primitive props for a single-value or range slider. The generic
 * selects the value shape and defaults to `number` for existing single-value
 * usage. A range slider must provide its tuple through either `value` or
 * `defaultValue` so the runtime can determine the shape.
 * Range-thumb collision behavior is intentionally non-crossing: thumbs may
 * meet, but the active thumb stops at the other value without swapping or
 * pushing the other thumb.
 * @zh 单值或区间滑块的根原语组件属性。泛型用于选择值形态，并默认为 `number` 以兼容现有单值用法。区间滑块必须通过 `value` 或 `defaultValue` 提供二元组，以便运行时确定值形态。
 * 区间拇指采用明确的禁止交叉策略：两个拇指可以相遇，但活动拇指会停在另一个值处，不会交换身份或推动另一个拇指。
 * @interface
 */
export type SliderRootProps<Value extends SliderValue = number> =
  & SliderRootBaseProps<Value>
  & SliderValueProps<Value>

/**
 * Track primitive props.
 *
 * `SliderTrack` establishes the measurement/layout coordinate space and renders the base rail.
 *
 * @zh 轨道原语组件属性。
 *
 * `SliderTrack` 建立测量与布局坐标空间，并渲染基础轨道。
 */
export interface SliderTrackProps extends ComponentBasicProps {
  /**
   * Usually includes `SliderIndicator` and optional `SliderThumb`.
   * @zh 通常包含 `SliderIndicator` 以及可选的 `SliderThumb`。
   */
  children?: ReactNode
}

/**
 * Indicator primitive props.
 *
 * `SliderIndicator` is a pure visual layer. It fills from zero to the value in single-value mode and spans the selected interval in range mode.
 *
 * @zh 指示条原语组件属性。
 *
 * `SliderIndicator` 是纯视觉层。单值模式下从零填充到当前值，区间模式下覆盖选中的区间。
 */
export interface SliderIndicatorProps extends ComponentBasicProps {}

/**
 * Thumb primitive props.
 *
 * `SliderThumb` is positioned by the current ratio inside `SliderTrack` and does not own interaction logic.
 *
 * @zh 滑块拇指原语组件属性。
 *
 * `SliderThumb` 在 `SliderTrack` 内按照当前比例定位，不负责独立交互逻辑。
 */
export interface SliderThumbProps extends ComponentBasicProps {
  /**
   * Value index represented by this thumb. A single-value slider uses the
   * default index `0`; a range slider uses `0` for the lower thumb and `1`
   * for the upper thumb.
   * @defaultValue 0
   * @zh 此拇指对应的值索引。单值滑块使用默认索引 `0`；区间滑块使用 `0` 表示下限拇指，使用 `1` 表示上限拇指。
   * @iOS
   * @Android
   * @Harmony
   */
  index?: SliderThumbIndex
  /**
   * Custom thumb content.
   * @zh 自定义拇指内容。
   */
  children?: ReactNode
}
