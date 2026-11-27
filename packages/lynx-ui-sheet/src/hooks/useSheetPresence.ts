// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { runOnBackground, useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { PresenceState } from '@lynx-js/lynx-ui-presence'

import type { SheetPresenceState } from '../types'

// Define valid state transitions to enforce state machine correctness
const VALID_TRANSITIONS: Record<PresenceState, PresenceState[]> = {
  [PresenceState.Initial]: [PresenceState.Entering, PresenceState.Left],
  [PresenceState.Left]: [PresenceState.Entering],
  [PresenceState.Entering]: [PresenceState.Entered, PresenceState.Leaving],
  [PresenceState.Entered]: [PresenceState.Leaving],
  [PresenceState.Leaving]: [PresenceState.Left, PresenceState.Entering],
  [PresenceState.DelayedEntering]: [PresenceState.Entering],
}

export interface SheetPresenceCallbacks {
  onEntered?: () => void
  onDismiss?: () => void
  onUnmount?: (closedEpoch?: number) => void
  onBeforeDismiss?: (leavingEpoch?: number) => void
  onPresenceChangeMT?: (state: SheetPresenceState) => void
}

function mapPresenceStateMT(
  state: PresenceState,
): SheetPresenceState | null {
  'main thread'
  switch (state) {
    case PresenceState.Entering:
      return 'entering'
    case PresenceState.Entered:
      return 'entered'
    case PresenceState.Leaving:
      return 'exiting'
    case PresenceState.Left:
      return 'exited'
    default:
      return null
  }
}

export function useSheetPresence(
  callbacks: SheetPresenceCallbacks,
  externalRef?: MainThreadRef<PresenceState>,
  openEpochMTRef?: MainThreadRef<number>,
) {
  const internalRef = useMainThreadRef<PresenceState>(
    PresenceState.Left,
  )
  const presenceStateMTRef = externalRef ?? internalRef

  const {
    onEntered,
    onDismiss,
    onUnmount,
    onBeforeDismiss,
    onPresenceChangeMT,
  } = callbacks

  const transitionTo = (next: PresenceState) => {
    'main thread'
    // console.log('Sheet presenceState', presenceStateMTRef.current, next)
    if (presenceStateMTRef.current === next) {
      return
    }

    // Validate the transition is legal - warn in dev but don't block to avoid breaking user pages
    const validNext = VALID_TRANSITIONS[presenceStateMTRef.current]
    if (!validNext?.includes(next)) {
      console.error(
        `[Sheet] Invalid state transition: ${presenceStateMTRef.current} → ${next}. `
          + `Valid transitions from ${presenceStateMTRef.current}: [${
            validNext?.join(', ') ?? 'none'
          }]`,
      )
      // Continue anyway to avoid breaking user pages
    }

    presenceStateMTRef.current = next
    const mapped = mapPresenceStateMT(next)
    if (mapped) {
      onPresenceChangeMT?.(mapped)
    }

    switch (next) {
      case PresenceState.Entered:
        if (onEntered) {
          runOnBackground(onEntered)()
        }
        break
      case PresenceState.Leaving:
        if (onBeforeDismiss) {
          runOnBackground(onBeforeDismiss)(openEpochMTRef?.current)
        }
        break
      case PresenceState.Left:
        if (onDismiss) {
          runOnBackground(onDismiss)()
        }
        if (onUnmount) {
          runOnBackground(onUnmount)(openEpochMTRef?.current)
        }
        break
      default:
        break
    }
  }

  return {
    presenceStateMTRef,
    enter: () => {
      'main thread'
      transitionTo(PresenceState.Entering)
    },
    entered: () => {
      'main thread'
      transitionTo(PresenceState.Entered)
    },
    leave: () => {
      'main thread'
      transitionTo(PresenceState.Leaving)
    },
    left: () => {
      'main thread'
      transitionTo(PresenceState.Left)
    },
  }
}
