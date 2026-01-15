// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactElement } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'

export type SwipeAction = (props: SwipeActionProps) => ReactElement

export interface SwipeActionProps extends ComponentBasicProps {
  /**
   * Whether allow swipe action. When it set to false, this item can only be used to display content.
   * @zh 是否允许滑动操作。当设置为 false 时，SwipeAction 只能用来显示内容。
   * @defaultValue true
   * @Android
   * @iOS
   */
  enableSwipe: boolean
  /**
   * Id of the SwipeAction. The onSwipeStart, onSwipeEnd and onAction will be called with this id.
   * @zh SwipeAction 的id。
   * @Android
   * @iOS
   */
  swipeActionId: string
  /**
   * Display area of the SwipeAction. The content of this area will be displayed on the left side of the SwipeAction.
   * @zh SwipeAction 的内容。内容会显示在 SwipeAction 的左侧。
   * @Android
   * @iOS
   */
  displayArea: ReactElement
  /**
   * Action area of the SwipeAction. The content of this area will be displayed on the right side of the SwipeAction. Before swipe or showActionArea called, this area will be hidden.
   * @zh SwipeAction 的内容。内容会显示在 SwipeAction 的右侧。在用手滚动或调用 showActionArea 前，actionArea 不会显示。
   * @Android
   * @iOS
   */
  actionArea: ReactElement
  /**
   * The size of the action area. If the swipeAction is used inside List, the reuse of the List may cause the actionArea to have wrong size. You can use this property to set the initial size of the actionArea.
   * @zh actionArea 的大小。如果在 list 中使用 SwipeAction，list 的复用可能会导致操作区域大小错误。这个属性可用于指定一个初始大小，尽可能接近于排版渲染后的大小。
   * @defaultValue 0
   * @Android
   * @iOS
   */
  estimatedActionAreaSize?: number
  /**
   * The content of the SwipeAction. The content will be displayed on the left side of the SwipeAction.
   * @zh SwipeAction 的内容. 内容会显示在 SwipeAction 的左侧.
   * @Android
   * @iOS
   */
  children?: ReactElement
  /**
   * Force touch event to send to SwipeAction.
   * @zh 制触摸事件发送到 SwipeAction.
   * @defaultValue true
   * @iOS
   */
  iosEnableSimultaneousTouch?: boolean
  /**
   * Display debug logs. Open it when you find a bug.
   * @zh 显示调试日志。当你发现 bug 时打开它
   * @Android
   * @iOS
   */
  debugLog?: boolean
  /**
   * Triggered when the SwipeAction is swiped.
   * @zh SwipeAction 手动滚动开始时触发。
   * @Android
   * @iOS
   */
  onSwipeStart?: (id: string) => void
  /**
   * Triggered when the SwipeAction swipe ends.
   * @zh SwipeAction 手动滚动结束时触发。
   * @Android
   * @iOS
   */
  onSwipeEnd?: (id: string) => void
  /**
   * Triggered when the actionArea was tapped. Can be used to delete or other actions.
   * @zh ActionArea 被点击时触发，可用于实现删除或其他操作。
   * @Android
   * @iOS
   */
  onAction?: (id: string) => void
}

export interface SwipeActionRef {
  /**
   * Call to display the actionArea. If animated is true, the actionArea will be displayed with animation.
   * @zh 调用以显示 actionArea。如果 animated 为 true，则显示过程将带有动画效果。
   * @Android
   * @iOS
   */
  showActionArea: (animated: boolean) => void
  /**
   * Call to hide the actionArea. If animated is true, the actionArea will be hidden with animation.
   * @zh 调用以隐藏 actionArea. 如果 animated 为 true，则隐藏过程将带有动画效果。
   * @Android
   * @iOS
   */
  closeActionArea: (animated: boolean) => void
}
