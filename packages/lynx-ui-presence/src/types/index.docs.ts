// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type {
  AnimationEvent,
  EventHandler,
  TransitionEvent,
} from '@lynx-js/types'

import type { PresenceState } from '../utils'

export interface PresenceAnimationStatus {
  /**
   * The popper is opened.
   * @zh 弹层处于打开状态。
   */
  open?: boolean

  /**
   * The popper is closed.
   * If it's force mounted, the initial status will be closed.
   * @zh 弹层处于关闭状态。如果开启了 forceMount，初始状态会是 ui-closed。
   */
  closed?: boolean

  /**
   * The popper is performing the leaving animation. Takes effect when transition:true.
   * @zh 弹层正在执行离开动画。仅在 transition:true 时生效。
   */
  leaving?: boolean

  /**
   * The popper is performing the entering animation. Takes effect when transition:true.
   * @zh 弹层正在执行进入动画。仅在 transition:true 时生效。
   */
  entering?: boolean

  /**
   * The popper is doing the animations. Takes effect when transition:true.
   * @zh 弹层正在执行动画。仅在 transition:true 时生效。
   */
  animating?: boolean
}

/**
 * UI variants applied by Presence based on animation status.
 * Use them as CSS selectors to style different states.
 * @zh Presence 根据状态注入的 ui-variants，可用于 CSS selector 按状态定制样式。
 */
export interface PresenceUiVariants {
  /**
   * Applied when `status.open` is true.
   * @zh 当 status.open 为 true 时生效，可用于 `.ui-open { ... }`。
   */
  'ui-open'?: boolean

  /**
   * Applied when `status.closed` is true.
   * @zh 当 status.closed 为 true 时生效，可用于 `.ui-closed { ... }`。
   */
  'ui-closed'?: boolean

  /**
   * Applied when `status.entering` is true.
   * @zh 当 status.entering 为 true 时生效，可用于 `.ui-entering { ... }`。
   */
  'ui-entering'?: boolean

  /**
   * Applied when `status.leaving` is true.
   * @zh 当 status.leaving 为 true 时生效，可用于 `.ui-leaving { ... }`。
   */
  'ui-leaving'?: boolean

  /**
   * Applied when `status.animating` is true.
   * @zh 当 status.animating 为 true 时生效，可用于 `.ui-animating { ... }`。
   */
  'ui-animating'?: boolean
}

export type PresenceChildrenType = (
  status: PresenceAnimationStatus,
) => ReactNode

export interface PresenceProps {
  show: boolean // The one and only entry for showing the presence content.
  forceMount?: boolean // Force to mount the presence container event the content is not shown.
  children?: ReactNode | PresenceChildrenType
  state?: PresenceState // The core animation state of Presence.
  setPresenceState?: (state: PresenceState) => void
  enableDelay?: boolean // Adding 'DelayedEntering' state in PresenceState.
  // Presence takes charge of sending the events.
  onClose?: () => void
  onOpen?: () => void
  debugLog?: boolean
}

export interface usePresenceProps {
  show: boolean // The one and only entry for showing the presence content.
  forceMount?: boolean // Force to mount the presence container event the content is not shown.
  state: PresenceState // The core animation state of Presence.
  setPresenceState: (state: PresenceState) => void
  enableDelay?: boolean // Adding 'DelayedEntering' state in PresenceState.
  // Presence takes charge of sending the events.
  onOpen?: () => void
  onClose?: () => void
  debugLog?: boolean
}

export interface PresenceContextType {
  controllers: {
    state: PresenceState
    mount: boolean
    setPresenceState: (state: PresenceState) => void
    // if the change of show is set by XTriggers and XCloseButtons, this change should be called by this method rather than pass thru the props of Presence.
    // This method is used to make sure the controlled props and uncontrolled mode can be handled correctly.
    // setUncontrolledShow: (show: boolean) => void
  }
  animationHandlers: {
    handleKFStart: EventHandler<AnimationEvent>
    handleKFCancel: EventHandler<AnimationEvent>
    handleTransitionCancel: EventHandler<TransitionEvent>
    handleKFEnd: EventHandler<AnimationEvent>
    handleTransitionStart: EventHandler<TransitionEvent>
    handleTransitionEnd: EventHandler<TransitionEvent>
  }
}

export type usePresenceReturnType = PresenceContextType
