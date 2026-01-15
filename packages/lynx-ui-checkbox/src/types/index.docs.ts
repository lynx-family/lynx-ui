// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type { ViewProps } from '@lynx-js/types'

export interface CheckboxProps extends ComponentBasicProps {
  /**
   * Determines whether the Checkbox is checked by default. Use this property means the Checkbox is uncontrolled.
   * @defaultValue false
   * @zh 默认是否选中。使用此属性意味着 Checkbox 为非受控状态。
   * @iOS
   * @Android
   */
  defaultChecked?: boolean
  /**
   * Whether the Checkbox is checked. If this property is set, the Checkbox will be in controlled mode, meaning the defaultChecked property will take no effects.
   * @zh 是否选中。如果设置了此属性，Checkbox 将处于受控模式，这意味着 defaultChecked 属性将不起作用。
   * @iOS
   * @Android
   */
  checked?: boolean
  /**
   * The indeterminate state of the Checkbox.
   * @defaultValue false
   * @zh 是否为不确定状态。
   * @iOS
   * @Android
   */
  indeterminate?: boolean
  /**
   * Disables the Checkbox. The Checkbox cannot be interacted with.
   * @defaultValue false
   * @zh 是否禁用。如果设置了此属性，Checkbox 将无法交互。
   * @iOS
   * @Android
   */
  disabled?: boolean
  /**
   * The callback function that is triggered when the state changes
   * @zh 状态变化时触发的回调函数
   * @iOS
   * @Android
   */
  onChange?: (checked: boolean) => void
  /**
   * Radio supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @zh Checkbox 支持将原始视图属性直接展开到这个属性中。
   */
  checkboxProps?: ViewProps
  /**
   * children
   * @zh 子节点
   * @iOS
   * @Android
   * @docTypeFallback ReactNode | ((status: { checked: boolean; indeterminate: boolean; active: boolean; disabled: boolean }) => ReactNode)
   */
  children?:
    | ReactNode
    | ((
      status: {
        checked: boolean
        indeterminate: boolean
        active: boolean
        disabled: boolean
      },
    ) => ReactNode)
}

export interface CheckboxIndicatorProps extends ComponentBasicProps {
  /**
   * The indicator of the Checkbox. Only displays child nodes when checked or indeterminate is true. If you need to keep it displayed when checked or indeterminate is false, set forceMount to true.
   * @zh Checkbox 的提示框，仅当 checked 或 indeterminate 为 true 时显示子节点。如果需要在 checked 或 indeterminate 为 false 时也保持子节点的显示，需要将 forceMount 设置为 true。
   * @iOS
   * @Android
   */
  children?: ReactNode
  /**
   * Force mount the children. If set to true, the children will always be mounted even when checked or indeterminate is false.
   * @zh 强制挂载子节点。如果设置为 true，即使 checked 或 indeterminate 为 false，子节点也会被挂载。
   * @defaultValue false
   * @iOS
   * @Android
   */
  forceMount?: boolean
}
