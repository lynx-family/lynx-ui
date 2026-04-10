// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

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
export interface SliderRootProps {
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
   * Make the slider read-only and prevent pointer/touch interaction.
   * @defaultValue false
   * @zh 将滑块设为只读，阻止指针/触摸交互。
   */
  readonly?: boolean
  /**
   * @deprecated Please use `readonly` instead.
   */
  disabled?: boolean
  /**
   * Enable right-to-left layout. When `true`, the slider range grows from right to left.
   * @defaultValue false
   * @zh 启用从右到左的布局。为 `true` 时，滑块范围从右向左增长。
   */
  enableRTL?: boolean
  /**
   * Class name for the root container.
   * @zh 根容器的类名。
   */
  className?: string
  /**
   * Inline style for the root container.
   * @zh 根容器的内联样式。
   */
  style?: Record<string, unknown>
  /**
   * Triggered during dragging with the current progress value.
   * @zh 拖拽过程中触发，传入当前进度值。
   */
  onDragging?: (value: number) => void
  /**
   * Triggered on every value change.  In controlled mode, the slider does **not** update its internal value automatically; use this callback to update the controlled `value` prop.
   * @zh 每次值变更时触发。在受控模式下，滑块不会自动更新内部值，需要通过此回调更新外部的 `value` 属性。
   */
  onValueChange?: (value: number, source: SliderValueChangeSource) => void
  /**
   * Triggered at the end of a drag interaction with the final value.
   * @zh 拖拽交互结束时以最终值触发。适用于只需要最终提交值的场景，例如持久化到后端。
   */
  onValueCommit?: (value: number) => void
  /**
   * Primitive children composition, usually: SliderTrack` + `SliderRange` + `SliderThumb`.
   * @zh 子原语组件组合，通常为：`SliderTrack` + `SliderRange` + `SliderThumb`。
   */
  children?: ReactNode
}

/**
 * Track primitive props.
 * @zh 轨道原语组件属性。
 */
export interface SliderTrackProps {
  /**
   * Class name for the background track.
   * @zh 背景轨道的类名。
   */
  className?: string
  /**
   * Inline style for background track.
   * @zh 背景轨道的内联样式。
   */
  style?: Record<string, unknown>
}

/**
 * Range primitive props.
 *
 * `SliderRange` width and foreground bar are controlled by root value.
 *
 * @zh 范围条原语组件属性。
 *
 * `SliderRange` 的宽度和前景条由根组件的值控制。
 */
export interface SliderRangeProps {
  /**
   * Class name for the foreground range bar.
   * @zh 前景范围条的类名。
   */
  className?: string
  /**
   * Inline style for the foreground range bar.
   * @zh 前景范围条的内联样式。
   */
  style?: Record<string, unknown>
  /**
   * Usually includes `SliderThumb` and optional custom range content.
   * @zh 通常包含 `SliderThumb` 及可选的自定义范围内容。
   */
  children?: ReactNode
}

/**
 * Thumb primitive props.
 * @zh 滑块拇指原语组件属性。
 */
export interface SliderThumbProps {
  /**
   * Class name for the thumb wrapper.
   * @zh 拇指包裹元素的类名。
   */
  className?: string
  /**
   * Inline style for the thumb wrapper.
   * @zh 拇指包裹元素的内联样式。
   */
  style?: Record<string, unknown>
  /**
   * Custom thumb content.
   * @zh 自定义拇指内容。
   */
  children?: ReactNode
}
