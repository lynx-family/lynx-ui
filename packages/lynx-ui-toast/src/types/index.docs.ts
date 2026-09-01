// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type { OverlayViewProps } from '@lynx-js/lynx-ui-overlay'
import type { PresenceChildrenType } from '@lynx-js/lynx-ui-presence'
import type { OverlayProps, ViewProps } from '@lynx-js/types'

/**
 * The root component of the Toast, containing all of its child components.
 * @zh Toast 的根组件，包含其所有子组件。
 */
export interface ToastRootProps {
  /**
   * If the toast is visible on screen. Controlled
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh Toast 是否在屏幕上可见，可受控
   */
  show?: boolean
  /**
   * Children in content.
   * @Android
   * @iOS
   * @Harmony
   * @zh 内容中的子元素
   * @docTypeFallback ReactNode | (status: {open?: boolean, closed?: boolean, leaving?: boolean, entering?: boolean, animating?: boolean}) => ReactNode
   */
  children?: ReactNode | PresenceChildrenType
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
   * Triggers when the toast dismissed.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 当 Toast 关闭时触发
   */
  onClose?: () => void
  /**
   * Triggers when the toast showed.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 当 Toast 显示时触发
   */
  onOpen?: () => void
  /**
   * Display debug logs. Open it when you find a bug.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 显示调试日志，发现问题时开启。
   */
  debugLog?: boolean
}

/**
 * Controls the final display position of the toast content and also the view container of Toast. Can be x-overlay-ng or view. Controls the z-index of the toast.
 * @zh 控制 Toast 内容的最终显示位置，也是 Toast 的视图容器。可以是 x-overlay-ng 或 view。控制 Toast 的 z-index。
 */
export interface ToastPositionerProps
  extends Omit<OverlayViewProps, 'overlayViewProps'>
{
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * ToastPositioner supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh ToastPositioner 支持将原始 view 属性直接展开到这个属性中。
   */
  toastPositionerProps?: ViewProps | OverlayProps
}

/**
 * Controls the fly-in and fly-out animation of Toast.
 * @zh 控制 Toast 的飞入和飞出动画。
 */
export interface ToastContentProps extends ComponentBasicProps {
  /**
   * The duration of the animation. In ms.
   * @defaultValue 100
   * @Android
   * @iOS
   * @Harmony
   * @zh 动画的持续时间，单位为毫秒。
   */
  duration?: number
  /**
   * The direction of swipe gesture
   * @Android
   * @iOS
   * @Harmony
   * @zh 滑动手势的方向
   */
  swipeDirection?:
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'none'
  /**
   * The easing curve of animation
   * @Android
   * @iOS
   * @Harmony
   * @defaultValue 'linear'
   * @docTypeFallback 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | '<timing-function>'
   * @zh 动画的缓动曲线
   */
  easing?:
    | 'linear'
    | 'ease'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | (string & {})
  /**
   * Children in content.
   * @Android
   * @iOS
   * @Harmony
   * @zh 内容中的子元素
   */
  children?: ReactNode
  /**
   * Enable the default transform animation. The swipe animation will still work.
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   * @zh 启用默认的变换动画，滑动动画仍然可用。
   */
  useDefaultAnimation?: boolean
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * ToastContent supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh ToastContent 支持将原始 view 属性直接展开到这个属性中。
   */
  toastContentProps?: ViewProps
  /**
   * Display debug logs. Open it when you find a bug.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 显示调试日志，发现问题时开启。
   */
  debugLog?: boolean
}

export interface ToastDraggableContentProps
  extends Omit<ToastContentProps, 'useDefaultAnimation' | 'toastContentProps'>
{
  /**
   * ToastDraggableContent supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh ToastDraggableContent 支持将原始 view 属性直接展开到这个属性中。
   */
  draggableToastContentProps?: ViewProps
}
