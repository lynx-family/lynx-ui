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
  open?: boolean
  closed?: boolean

  leaving?: boolean
  entering?: boolean
  animating?: boolean
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
    handleKFEnd: EventHandler<AnimationEvent>
    handleTransitionStart: EventHandler<TransitionEvent>
    handleTransitionEnd: EventHandler<TransitionEvent>
  }
}

export type usePresenceReturnType = PresenceContextType
