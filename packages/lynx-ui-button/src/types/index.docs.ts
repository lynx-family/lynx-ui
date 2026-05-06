// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { CSSProperties, ViewProps } from '@lynx-js/types'

/**
 * The root component of the Button, containing all of its child components.
 * @zh 按钮的根组件，包含其所有子组件。
 */
export interface ButtonProps {
  /**
   * Determines whether the button is disabled.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 决定按钮是否被禁用。
   */
  disabled?: boolean
  /**
   * children
   * @Android
   * @iOS
   * @Harmony
   * @zh 子组件
   * @docTypeFallback | ReactNode | ((state: {active: boolean, disabled: boolean}) => ReactNode)
   */
  children?:
    | ReactNode
    | ((
      state: {
        active: boolean
        disabled: boolean
      },
    ) => ReactNode)
  /**
   * className
   * @Android
   * @iOS
   * @Harmony
   * @zh 类名
   */
  className?: string
  /**
   * style
   * @Android
   * @iOS
   * @Harmony
   * @zh 样式
   */
  style?: CSSProperties
  /**
   * Button supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh 按钮支持将原始视图属性直接展开到这个属性中。
   */
  buttonProps?: ViewProps
  /**
   * Triggered when the button is clicked.
   * @Android
   * @iOS
   * @Harmony
   * @zh 按钮被点击时触发。
   */
  onClick?: () => void
}

/**
 * The interactive status passed to Button's render-prop children.
 * @zh 传入 Button render-prop children 的交互状态。
 */
export interface ButtonRenderProps {
  /**
   * Whether the button is currently being pressed (and not disabled).
   * @zh 按钮当前是否处于按下态（且未被禁用）。
   */
  active?: boolean

  /**
   * Whether the button is disabled.
   * @zh 按钮是否处于禁用态。
   */
  disabled?: boolean
}

/**
 * UI variants applied by Button based on its interactive status.
 * Use them as CSS selectors to style different states.
 * @zh Button 根据交互状态注入的 ui-variants，可用于 CSS selector 按状态定制样式。
 */
export interface ButtonUiVariants {
  /**
   * Applied when `status.active` is true.
   * @zh 当 status.active 为 true 时生效，可用于 `.ui-active { ... }`。
   */
  'ui-active'?: boolean

  /**
   * Applied when `status.disabled` is true.
   * @zh 当 status.disabled 为 true 时生效，可用于 `.ui-disabled { ... }`。
   */
  'ui-disabled'?: boolean
}
