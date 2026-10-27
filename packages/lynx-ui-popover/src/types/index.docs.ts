// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Dispatch, ReactNode, SetStateAction } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type { OverlayViewProps } from '@lynx-js/lynx-ui-overlay'
import type {
  PresenceChildrenType,
  PresenceState,
  PresenceUIVariants,
} from '@lynx-js/lynx-ui-presence'
import type { OverlayProps, ViewProps } from '@lynx-js/types'

import type {
  Coords,
  Dimensions,
  ElementInfo,
  Placement,
  Rect,
} from '../floating'

export type { PresenceAnimationStatus } from '@lynx-js/lynx-ui-presence'

/**
 * The arrow of the Popover.
 * @zh Popover 的箭头。
 */
export interface PopoverArrowProps extends ComponentBasicProps {
  /**
   * Custom arrow artwork, pointing down before rotation. Its layout size must match `size`; `color` only affects the default triangle. Keep PopoverArrow a direct child of PopoverContent so coordinates use the bubble as their origin.
   * @zh 自定义箭头，旋转前朝下，布局尺寸应与 size 一致。color 仅作用于默认三角形。PopoverArrow 应作为 PopoverContent 的直接子节点，确保定位以气泡为参照。
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * Arrow size. A number retains the square positioning box and protrusion of that size. With custom children, `{ width, height }` describes the original artwork: width is the base and height is the protrusion for every placement. Left/right placements rotate the box automatically. Without children, object sizes retain the default triangle’s legacy behavior using the larger dimension.
   * @zh 箭头尺寸。数字保持原有正方形定位盒及同等突出距离。自定义箭头的 `{ width, height }` 表示旋转前的底边宽度和突出高度；左右方向由底层自动旋转。未传 children 时，对象尺寸仍取最大值绘制默认三角形。
   * @Android
   * @iOS
   * @Harmony
   */
  size: number | { width: number, height: number }
  /**
   * The color of the arrow. Defaults to 'black'
   * @zh 箭头的颜色。默认为 'black'
   * @defaultValue 'black'
   * @Android
   * @iOS
   * @Harmony
   */
  color?: string
  /**
   * Adjusts the positioning of the arrow along the edge of PopoverContent. For example, this can be used to keep the arrow clear of rounded corners.
   * @zh 调整箭头在 PopoverContent 边缘上的定位偏移，例如可用于避让圆角。
   * @defaultValue 0
   * @Android
   * @iOS
   * @Harmony
   */
  offset?: number
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
}

/**
 * The element that triggers the Popover to show.
 * @zh 触发 Popover 显示的元素。
 */
export interface PopoverTriggerProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * Disable this Trigger
   * @zh 禁用此触发器
   */
  disabled?: boolean
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * Callback function triggered when the component is clicked
   * @zh 组件被点击时触发的回调函数
   * @Android
   * @iOS
   * @Harmony
   */
  onClick?: () => void
}

/**
 * A transparent backdrop that can be used to close the Popover when clicked.
 * @zh 一个透明的背景板，点击时可以关闭 Popover。
 */
export interface PopoverBackdropProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * Callback function triggered when the component is clicked
   * @zh 组件被点击时触发的回调函数
   * @Android
   * @iOS
   * @Harmony
   */
  onClick?: () => void
}

/**
 * If this component is used, the Popover will use it rather than PopoverTrigger as the real anchor.
 */
export interface PopoverAnchorProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
}

/**
 * The view container of the Popover. Can be overlay or view. Controls the z-index of the popover.
 * @zh Popover 的视图容器。可以是 overlay 或 view。控制 Popover 的 z-index。
 */
export interface PopoverOverlayProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   * @docTypeFallback ReactNode | (status: {open?: boolean, closed?: boolean, leaving?: boolean, entering?: boolean, animating?: boolean}) => ReactNode
   */
  children?: ReactNode | PresenceChildrenType
  /**
   * The position of the popover
   * @zh Popover 的位置
   * @Android
   * @iOS
   * @Harmony
   */
  placement: Placement
  /**
   * The offset of the popover overlay position
   * @zh Popover 覆盖层位置的偏移量
   * @Android
   * @iOS
   * @Harmony
   */
  placementOffset: number
  /**
   * The parent container of the popover overlay
   * @zh Popover 覆盖层的父容器
   * @Android
   * @iOS
   * @Harmony
   */
  container?: OverlayViewProps['container']
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * PopoverOverlay supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh PopoverOverlay 支持将原始 view 属性直接展开到这个属性中。
   */
  popoverOverlayProps?: ViewProps
}

/**
 * The content of the Popover.
 * @zh Popover 的内容。
 */
export interface PopoverContentProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * PopoverContent supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh PopoverContent 支持将原始 view 属性直接展开到这个属性中。
   */
  popoverContentProps?: ViewProps
}

/**
 * Helps position the Content and Arrow correctly.
 * @zh 帮助正确定位内容和箭头。
 */
export interface PopoverPositionerProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   * @docTypeFallback ReactNode | (status: {open?: boolean, closed?: boolean, leaving?: boolean, entering?: boolean, animating?: boolean}) => ReactNode
   */
  children?: ReactNode | PresenceChildrenType
  /**
   * The position of the popover
   * @zh Popover 的位置
   * @Android
   * @iOS
   * @Harmony
   */
  placement: Placement
  /**
   * The offset of the popover position
   * @zh Popover 位置的偏移量
   * @Android
   * @iOS
   * @Harmony
   */
  placementOffset?: number
  /**
   * The auto-adjustment strategy for the popover. Defaults to 'size', which automatically adjusts maxHeight/maxWidth based on the popover size; 'shift' automatically adjusts the position based on the popover width/height.
   * @zh Popover 的自动调整策略。默认为 'size'，会根据 Popover 大小自动调整 maxHeight/maxWidth；'shift' 会根据 Popover 的宽度/高度自动调整位置。
   * @Android
   * @iOS
   * @Harmony
   */
  autoAdjust?: 'size' | 'shift'
  /**
   * Additional crossAxis offset. If this prop is set, the popover will be offset by the specified amount in the crossAxis direction.
   * @zh 额外的 crossAxis 偏移量。如果设置了此属性，Popover 会在 crossAxis 方向上额外偏移指定的量。
   * @Android
   * @iOS
   * @Harmony
   */
  crossAxisOffset?: number
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * popoverPositioner supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh popoverPositioner 支持将原始 view 或 overlay 属性直接展开到这个属性中。
   */
  popoverPositionerProps?: ViewProps | OverlayProps
}

/**
 * The root component of the Popover, containing all of its child components.
 * @zh Popover 的根组件，包含其所有子组件。
 */
export interface PopoverRootProps extends ComponentBasicProps {
  /**
   * Determines whether the dialog should be shown. Use this property means the Dialog is controlled. Do not use this props with 'defaultShow'.
   * @zh 确定是否应显示对话框。使用此属性意味着对话框是受控的。请勿与 'defaultShow' 属性一起使用。
   * @Android
   * @iOS
   * @Harmony
   */
  show?: boolean
  /**
   * Determines whether the dialog should be shown by default. Use this property means the Dialog is uncontrolled.
   * @zh 确定对话框是否默认显示。使用此属性意味着对话框是非受控的。
   * @Android
   * @iOS
   * @Harmony
   */
  defaultShow?: boolean
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * Mount the toast and render the content even when it's not shown. At this time, the internal state is "initial".
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 即使弹窗未显示，也会挂载弹窗并渲染内容。此时内部状态处于 closed
   */
  forceMount?: boolean
  /**
   * Triggered when the popover is closed
   * @zh 当 Popover 关闭时触发
   * @Android
   * @iOS
   * @Harmony
   */
  onClose?: () => void
  /**
   * Triggered when the popover is shown
   * @zh 当 Popover 显示时触发
   * @Android
   * @iOS
   * @Harmony
   */
  onOpen?: () => void
  /**
   * Enable debug log for Popover and its sub-components.
   * @zh 开启 Popover 及其子组件的调试日志。
   * @Android
   * @iOS
   * @Harmony
   */
  debugLog?: boolean
  /**
   * Callback fired when the visibility of the popover changes. This is only called in controlled mode.
   * @zh Popover 显示状态改变时触发的回调，仅在受控模式下被调用。
   * @param visible - The new visibility state.
   * @Android
   * @iOS
   * @Harmony
   */
  onVisibleChange?: (visible: boolean) => void
}

export interface PopoverContextType {
  sharedInfo: ElementInfo
  updateRects: Dispatch<UpdateRectsAction>
  forceMount?: boolean
  show: boolean
  setUncontrolledShow?: (show: SetStateAction<boolean>) => void
  hasAnchor?: boolean
  setHasAnchor?: (hasAnchor: SetStateAction<boolean>) => void
  state: PresenceState
  setPresenceState: (state: SetStateAction<PresenceState>) => void
  onOpen?: () => void
  onClose?: () => void
  isControlled?: boolean
  onVisibleChange?: (visible: boolean) => void
  debugLog?: boolean
}

export type UpdateRectsAction =
  | { type: 'updateReference', rect: Rect }
  | { type: 'updateAlternativeReference', rect: Rect }
  | { type: 'updateFloating', rect: Rect }
  | {
    type: 'updateArrowCoords'
    coords: { x: number | null, y: number | null }
  }
  | {
    type: 'updateArrowInfo'
    info: { offset: number, size: number, dimensions?: Dimensions }
  }
  | { type: 'updateFloatingCoords', coords: Coords }
  | { type: 'updateMaxContentSize', dimension: Dimensions }

/**
 * UI variants exposed by PopoverTrigger.
 * @zh PopoverTrigger 暴露的 UI variants。
 */
export interface PopoverTriggerUIVariants extends PresenceUIVariants {
  /**
   * Applied while the composed trigger button is pressed and not disabled.
   * @zh 组合的触发按钮处于按下态且未被禁用时生效。
   */
  'ui-active'?: boolean

  /**
   * Applied when the trigger is explicitly disabled or the popover is busy.
   * @zh 触发器被显式禁用或 Popover 处于忙碌状态时生效。
   */
  'ui-disabled'?: boolean

  /**
   * Applied while the popover is entering or leaving.
   * @zh Popover 正在进入或离开时生效。
   */
  'ui-busy'?: boolean
}

/**
 * UI variants exposed by PopoverBackdrop.
 * @zh PopoverBackdrop 暴露的 UI variants。
 */
export interface PopoverBackdropUIVariants extends PresenceUIVariants {
  /**
   * Applied while the composed backdrop button is pressed and not disabled.
   * @zh 组合的背景按钮处于按下态且未被禁用时生效。
   */
  'ui-active'?: boolean

  /**
   * Applied while the popover is entering or leaving.
   * @zh Popover 正在进入或离开时生效。
   */
  'ui-disabled'?: boolean
}

/**
 * UI variants exposed by PopoverAnchor.
 * @zh PopoverAnchor 暴露的 UI variants。
 */
export interface PopoverAnchorUIVariants extends PresenceUIVariants {}

/**
 * UI variants exposed by PopoverPositioner.
 * @zh PopoverPositioner 暴露的 UI variants。
 */
export interface PopoverPositionerUIVariants extends PresenceUIVariants {}

/**
 * UI variants exposed by PopoverContent.
 * @zh PopoverContent 暴露的 UI variants。
 */
export interface PopoverContentUIVariants extends PresenceUIVariants {}

/**
 * UI variants exposed by PopoverArrow.
 * @zh PopoverArrow 暴露的 UI variants。
 */
export interface PopoverArrowUIVariants extends PresenceUIVariants {}
