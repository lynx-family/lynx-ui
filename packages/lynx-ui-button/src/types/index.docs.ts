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
