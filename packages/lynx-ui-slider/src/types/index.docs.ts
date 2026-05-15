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
 * Imperative methods exposed by `SliderRoot`.
 * @zh `SliderRoot` 暴露的命令式方法。
 */
export interface SliderRef {
  /**
   * Imperatively set slider value in range `[0, 1]`.
   * @zh 命令式地设置滑块值，取值范围 `[0, 1]`。
   */
  updateValue: (
    value: number,
    options?: SliderUpdateValueOptions,
  ) => void
  /**
   * Read current slider value in range `[0, 1]`.
   * @zh 读取当前滑块值，取值范围 `[0, 1]`。
   */
  getValue: () => number
}

/**
 * Root primitive props.
 *
 * `SliderRoot` owns interaction logic (dragging and value tracking)
 * and provides context for child primitives.
 *
 * @zh 根原语组件属性。
 *
 * `SliderRoot` 负责交互逻辑（拖拽、值跟踪）并为子原语组件提供上下文。
 */
export interface SliderRootProps extends ComponentBasicProps {
  /**
   * Controlled value in range `[0, 1]`. When provided, the slider is in controlled mode. Do not use together with `defaultValue`.
   * @zh 受控模式下的值，范围 `[0, 1]`。传入此属性时滑块为受控模式，请勿与 `defaultValue` 同时使用。
   */
  value?: number
  /**
   * Initial value for uncontrolled usage.
   * @defaultValue 0
   * @zh 非受控模式下的初始值。
   */
  defaultValue?: number
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
   * Triggered when dragging state changes, with the current progress value. The callback fires when dragging starts and when dragging ends.
   * @zh 拖拽状态变化时触发，传入当前进度值。开始拖拽和结束拖拽时都会触发。
   */
  onDragging?: (value: number) => void
  /**
   * Triggered after slider-driven value updates, including dragging and `SliderRef.updateValue`. In controlled mode, use this callback to keep the external `value` prop in sync with the rendered value.
   * @zh 由滑块自身驱动的值更新后触发，包括拖拽和 `SliderRef.updateValue`。在受控模式下，请通过此回调让外部 `value` 属性与渲染值保持同步。
   */
  onValueChange?: (value: number, source: SliderValueChangeSource) => void
  /**
   * Triggered at the end of a drag interaction with the final value.
   * @zh 拖拽交互结束时以最终值触发。适用于只需要最终提交值的场景，例如持久化到后端。
   */
  onValueCommit?: (value: number) => void
  /**
   * Primitive children composition, usually: `SliderTrack` containing `SliderIndicator` and optional `SliderThumb`.
   * @zh 子原语组件组合，通常为：`SliderTrack` 内包含 `SliderIndicator` 以及可选的 `SliderThumb`。
   */
  children?: ReactNode
}

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
 * `SliderIndicator` is a pure visual layer whose width is controlled by root value.
 *
 * @zh 指示条原语组件属性。
 *
 * `SliderIndicator` 是纯视觉层，其宽度由根组件的值控制。
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
   * Custom thumb content.
   * @zh 自定义拇指内容。
   */
  children?: ReactNode
}
