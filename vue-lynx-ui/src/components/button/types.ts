// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties, ViewProps } from '@lynx-js/types'

/**
 * The props of the Button root component, containing all of its child
 * components.
 *
 * Mirrors the ReactLynx `ButtonProps` API. The two presentational props that
 * React exposes as `className` / `style` are kept under the same names here so
 * the public API matches 1:1, even though Vue templates ultimately bind them
 * to the native `class` / `style` attributes.
 * @zh 按钮的根组件 props，包含其所有子组件。
 */
export interface ButtonProps {
  /**
   * Determines whether the button is disabled.
   * @defaultValue false
   * @zh 决定按钮是否被禁用。
   */
  disabled?: boolean
  /**
   * className
   * @zh 类名
   */
  className?: string
  /**
   * style
   * @zh 样式
   */
  style?: CSSProperties
  /**
   * Button supports original view props to be directly spread in this prop.
   * @zh 按钮支持将原始视图属性直接展开到这个属性中。
   */
  buttonProps?: ViewProps
}

/**
 * Events emitted by Button.
 *
 * Mirrors ReactLynx's `onClick` callback. In Vue this surfaces as a `click`
 * event so consumers can write `@click="..."`.
 * @zh Button 触发的事件，对齐 ReactLynx 的 `onClick`。
 */
export interface ButtonEmits {
  /**
   * Triggered when the button is clicked (and not disabled).
   * @zh 按钮被点击时触发（且未被禁用）。
   */
  (e: 'click'): void
}

/**
 * The interactive status passed to Button's default scoped slot.
 *
 * This is the Vue equivalent of ReactLynx's render-prop children:
 * `({ active, disabled }) => ReactNode`. In Vue it becomes a scoped slot:
 * `<template #default="{ active, disabled }">`.
 * @zh 传入 Button 默认作用域插槽的交互状态，对齐 ReactLynx 的 render-prop children。
 */
export interface ButtonRenderProps {
  /**
   * Whether the button is currently being pressed (and not disabled).
   * @zh 按钮当前是否处于按下态（且未被禁用）。
   */
  active: boolean
  /**
   * Whether the button is disabled.
   * @zh 按钮是否处于禁用态。
   */
  disabled: boolean
}

/**
 * UI variants applied by Button based on its interactive status.
 * Use them as CSS selectors to style different states.
 * @zh Button 根据交互状态注入的 ui-variants，可用于 CSS selector 按状态定制样式。
 */
export interface ButtonUiVariants {
  /**
   * Applied when `status.active` is true. Use `.ui-active { ... }`.
   * @zh 当 status.active 为 true 时生效。
   */
  'ui-active'?: boolean
  /**
   * Applied when `status.disabled` is true. Use `.ui-disabled { ... }`.
   * @zh 当 status.disabled 为 true 时生效。
   */
  'ui-disabled'?: boolean
}
