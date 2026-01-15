// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clsx } from 'clsx'

import type { PresenceAnimationStatus } from './types'

export enum PresenceState {
  Initial = 0,
  Entering = 1,
  DelayedEntering = 2, // Special state for delaying the showAnimation. This is used to prevent the content from being layout before the showAnimation.
  Entered = 3,
  Leaving = 4,
  Left = 5,
}

// Convert abstract state to clear animation status for users
export const resolveAnimationStatus: ({
  state,
  enableDelay,
  grouped,
}: {
  state: PresenceState
  enableDelay: boolean
  grouped?: boolean
}) => PresenceAnimationStatus = ({
  state,
  enableDelay,
  grouped = false,
}) => {
  const enteringStateWithDelay = enableDelay
    ? PresenceState.DelayedEntering
    : PresenceState.Entering
  const isOpen = state === enteringStateWithDelay
    || state === PresenceState.Entered
  const groupedOpen = isOpen || state === PresenceState.Leaving

  const isClose = state === PresenceState.Leaving
    || state === PresenceState.Left
    || (enableDelay && state === PresenceState.Entering)
  const groupedClosed = state === PresenceState.Left
  return {
    leaving: state === PresenceState.Leaving,
    entering: state === enteringStateWithDelay,
    animating: state === PresenceState.Leaving
      || state === enteringStateWithDelay,

    // In grouped state, even the member has entered their animation(leaving) state, it has to remain open so it won't hide its children.
    // grouped: open = entering/delayedEntering/entered/leaving
    // normal: open = entering/delayedEntering/entered
    open: grouped ? groupedOpen : isOpen,
    // In grouped state, the grouped element has to wait all its member exit their animations.
    // grouped: closed = left
    // normal: closed = leaving/left
    closed: grouped ? groupedClosed : isClose,
  }
}

interface PresenceClassVariantsProps {
  state: PresenceState
  enableDelay: boolean
  className?: string
  transition?: boolean
  grouped?: boolean
}

export const presenceClassVariants = ({
  state,
  enableDelay,
  className,
  transition,
  grouped,
}: PresenceClassVariantsProps) => {
  const status = resolveAnimationStatus({
    state,
    enableDelay,
    grouped,
  })
  if (transition) {
    return clsx(
      className,
      {
        'ui-entering': status.entering,
        'ui-leaving': status.leaving,
        'ui-animating': status.animating,
        'ui-open': status.open,
        'ui-closed': status.closed,
      },
    )
  } else {
    return clsx(className, {
      'ui-open': status.open,
      'ui-closed': status.closed,
    })
  }
}
