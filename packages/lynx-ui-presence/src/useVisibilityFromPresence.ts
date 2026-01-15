// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useState } from '@lynx-js/react'

import type { CSSProperties } from '@lynx-js/types'

import { PresenceState } from './utils'

/**
 * A hook that derives visibility state from a PresenceState.
 * It returns 'visible' when the presence state indicates the component
 * is entering, present, or leaving, and 'hidden' otherwise.
 *
 * @param state The current PresenceState.
 * @returns CSSProperties['visibility'] ('visible' or 'hidden').
 */
export function useVisibilityFromPresence(
  state: PresenceState,
): CSSProperties['visibility'] {
  const [visibility, setVisibility] = useState<CSSProperties['visibility']>(
    'hidden',
  )

  useEffect(() => {
    if (
      state === PresenceState.DelayedEntering
      || state === PresenceState.Entered
      || state === PresenceState.Leaving
    ) {
      setVisibility('visible')
    } else {
      setVisibility('hidden')
    }
  }, [state])

  return visibility
}
