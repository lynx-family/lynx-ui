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
   * Checkbox supports original view props to be directly spread in this prop.
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

/**
 * The interactive status passed to Checkbox's render-prop children.
 * @zh 传入 Checkbox render-prop children 的交互状态。
 */
export interface CheckboxRenderProps {
  /**
   * Whether the checkbox is currently checked.
   * @zh 复选框当前是否处于选中态。
   */
  checked?: boolean

  /**
   * Whether the checkbox is in an indeterminate state.
   * @zh 复选框是否处于不确定态。
   */
  indeterminate?: boolean

  /**
   * Whether the checkbox is currently being pressed (and not disabled).
   * @zh 复选框当前是否处于按下态（且未被禁用）。
   */
  active?: boolean

  /**
   * Whether the checkbox is disabled.
   * @zh 复选框是否处于禁用态。
   */
  disabled?: boolean
}

/**
 * UI variants applied by Checkbox based on its interactive status.
 * Use them as CSS selectors to style different states.
 * @zh Checkbox 根据交互状态注入的 ui-variants，可用于 CSS selector 按状态定制样式。
 */
export interface CheckboxUiVariants {
  /**
   * Applied when `status.checked` is true.
   * @zh 当 status.checked 为 true 时生效，可用于 `.ui-checked { ... }`。
   */
  'ui-checked'?: boolean

  /**
   * Applied when `status.indeterminate` is true.
   * @zh 当 status.indeterminate 为 true 时生效，可用于 `.ui-indeterminate { ... }`。
   */
  'ui-indeterminate'?: boolean

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
