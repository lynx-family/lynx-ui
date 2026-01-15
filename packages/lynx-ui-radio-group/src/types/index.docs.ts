// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type { ViewProps } from '@lynx-js/types'

/**
 * The root component of the RadioGroup, containing all of its child components.
 * @zh RadioGroup 的根组件，包含其所有子组件。
 */
export interface RadioGroupRootProps {
  /**
   * children
   * @Android
   * @iOS
   * @Harmony
   * @zh 子节点
   */
  children?:
    | ReactNode
    | ((state: RadioGroupRenderProps) => ReactNode)
  /**
   * If set to true, the RadioGroup can not accept interactions.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，RadioGroup 将不能接受交互。
   */
  disabled?: boolean
  /**
   * If the Radio is initially selected with certain value.  Use this property means the RadioGroup is uncontrolled. If the value matches none of the Radio's value, the RadioGroup will be unselected.
   * @Android
   * @iOS
   * @Harmony
   * @zh RadioGroup 被选中的初始值。使用此属性意味着 RadioGroup 是非受控的。如果值不匹配任何一个 Radio 的值，RadioGroup 将不会被选中。
   */
  defaultValue?: string
  /**
   * Control the selected value of the RadioGroup.  Use this property means the RadioGroup is controlled. If the value matches none of the Radio's value, the RadioGroup will be unselected.
   * @Android
   * @iOS
   * @Harmony
   * @zh RadioGroup 被选中的值。使用此属性意味着 RadioGroup 是受控的。如果值不匹配任何一个 Radio 的值，RadioGroup 将不会被选中。
   */
  value?: string
  /**
   * Send when selected value changed
   * @Android
   * @iOS
   * @Harmony
   * @zh 选中状态改变时触发
   */
  onValueChange?: (value: string) => void
}

/** Render state props passed to custom RadioGroup content.
 * @zh RadioGroup 自定义渲染的状态属性
 */
export interface RadioGroupRenderProps {
  /**
   * The current selected value of the RadioGroup.
   * @zh RadioGroup 当前被选中的值。
   * @iOS
   * @Android
   */
  value: string | null

  /**
   * Whether the RadioGroup is disabled.
   * @zh RadioGroup 是否整体被禁用。
   * @iOS
   * @Android
   */
  disabled: boolean
}

/**
 * The item inside RadioGroup.
 * @zh RadioGroup 的子项
 */
export interface RadioProps extends ComponentBasicProps {
  /**
   * children
   * @Android
   * @iOS
   * @Harmony
   * @zh 子组件
   */
  children?: ReactNode
  /**
   * The identifier of this Radio
   * @Android
   * @iOS
   * @Harmony
   * @zh Radio 的标识
   */
  value: string
  /**
   * Disable this Radio. If set to true, this single Radio can not accept interactions.
   * @Android
   * @iOS
   * @Harmony
   * @zh Radio 是否被禁用。如果设置为 true，则该 Radio 无法接受交互。
   */
  disabled?: boolean

  /**
   * Radio supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @zh Radio 支持将原始视图属性直接展开到这个属性中。
   */
  radioProps?: ViewProps
}

/**
 * The check slot indicating this Radio is now selected. Normally a circle. It's children will only be rendered when selected so it can be a custom inner selected indicator. Can be a ReactNode or a render function returns a ReactNode.
 * @zh Radio 被选中时的指示器，一般是一个圆圈。当被选中时，它的 children 才会被渲染，因此被作为一个自定义的选中指示器。可以是 ReactNode 也可以是一个返回 ReactNode 的 render 函数。
 */
export interface RadioIndicatorProps extends ComponentBasicProps {
  /**
   * children.
   * @Android
   * @iOS
   * @Harmony
   * @zh 子节点
   */
  children?: ReactNode
  /**
   * Force mount the children. If set to true, the children will always be mounted even when checked is false.
   * @zh 强制挂载子节点。如果设置为 true，即使 checked 为 false，子节点也会被挂载。
   * @defaultValue false
   * @iOS
   * @Android
   */
  forceMount?: boolean
}
