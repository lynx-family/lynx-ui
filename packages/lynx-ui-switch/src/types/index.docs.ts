// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { CSSProperties, ViewProps } from '@lynx-js/types'

interface ComponentBasicProps {
  /**
   * className
   * @zh 类名
   * @Android
   * @iOS
   */
  className?: string
  /**
   * style
   * @zh 样式
   * @Android
   * @iOS
   */
  style?: CSSProperties
}

/** Props for the Switch component.
 * @zh Switch 组件的属性
 */
export interface SwitchProps extends ComponentBasicProps {
  /**
   * Whether the Switch is checked.
   * If `checked` is provided, the component is controlled and `defaultChecked` is ignored.
   * @zh 是否选中。如果设置了 `checked`，则 Switch 将处于受控模式，此时 `defaultChecked` 将被忽略。
   * @iOS
   * @Android
   */
  checked?: boolean
  /**
   * The initial checked state when used as an uncontrolled component.
   * @defaultValue false
   * @zh 默认选中状态，仅在非受控模式下生效。
   * @iOS
   * @Android
   */
  defaultChecked?: boolean

  /**
   * Whether the user can interact with the Switch.
   * When `true`, the Switch cannot be toggled.
   * @defaultValue false
   * @zh 是否禁用，当为 `true` 时用户无法操作。
   * @Android
   * @iOS
   */
  disabled?: boolean

  /**
   * Callback fired when the checked state changes.
   * @param checked - The new checked state.
   * @zh 状态变化时触发的回调函数。参数 `checked` 表示最新的选中状态。
   * @Android
   * @iOS
   */
  onChange?: (checked: boolean) => void

  /**
   * Switch supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @zh Switch 支持将原始视图属性直接展开到这个属性中。
   */
  switchProps?: ViewProps

  /**
   * Content displayed inside or next to the Switch.
   * @zh Switch 的内容，可以是节点或根据状态动态渲染的函数。
   * @docTypeFallback ReactNode | ((status: { checked: boolean; active: boolean; disabled: boolean }) => ReactNode)
   * @iOS
   * @Android
   */
  children?:
    | ReactNode
    | ((
      status: SwitchRenderProps,
    ) => ReactNode)
}

/** Render state props passed to custom Switch content.
 * @zh Switch 自定义渲染的状态属性
 */
export interface SwitchRenderProps {
  /**
   * Whether the Switch is currently checked.
   * @zh 是否选中。
   * @iOS
   * @Android
   */
  checked: boolean

  /**
   * Whether the Switch is active (pressed or being interacted with).
   * @zh 是否处于激活状态（按下或交互中）。
   * @iOS
   * @Android
   */
  active: boolean

  /**
   * Whether the Switch is disabled.
   * @zh 是否禁用。
   * @iOS
   * @Android
   */
  disabled: boolean
}

/**
 * The thumb of the Switch.
 * The draggable/clickable handle that toggles the state.
 * @zh Switch 的手柄部分。用于点击或拖动以切换状态。
 */
export interface SwitchThumbProps extends ComponentBasicProps {
  /**
   * Content slot of the thumb.
   * Allows custom elements such as icons.
   * @zh 手柄的内容插槽，可放置自定义元素（如图标）。
   * @iOS
   * @Android
   */
  children?: ReactNode
}

/**
 * The track of the Switch.
 * Represents the background area on which the thumb slides.
 * Can also be used for pressed overlays or state decorations.
 *
 * @zh Switch 的轨道部分。拇指滑动的背景区域，也可用于绘制按下态覆盖层或状态装饰。
 */
export interface SwitchTrackProps extends ComponentBasicProps {
  /**
   * Content slot of the track.
   * Allows custom elements, can be used to add overlays or state decorations.
   * @zh 轨道的内容插槽，可用于添加覆盖层或状态装饰。
   * @iOS
   * @Android
   */
  children?: ReactNode
}
