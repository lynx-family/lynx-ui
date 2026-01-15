// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'

import { useTapLock } from '@lynx-js/react-use'
import type { MainThread } from '@lynx-js/types'

/**
 * Determine whether a touch is swipe or click.
 */
export function useSwipeCallback({
  onSwipeStartMT,
  onSwipeStopMT,
}: {
  onSwipeStartMT: () => void
  onSwipeStopMT: () => void
}) {
  const swipeStartedMTRef = useMainThreadRef<boolean>(false)

  const {
    handleTouchStart: tapLockTouchStart,
    handleTouchMove: tapLockTouchMove,
  } = useTapLock()

  function setSwipeStartMT() {
    'main thread'
    if (swipeStartedMTRef.current) {
      return
    }
    swipeStartedMTRef.current = true
    onSwipeStartMT()
  }

  function setSwipeEndMT() {
    'main thread'
    if (swipeStartedMTRef.current) {
      onSwipeStopMT()
      swipeStartedMTRef.current = false
    }
  }

  function handleTouchStart(event: MainThread.TouchEvent) {
    'main thread'

    tapLockTouchStart(event)
  }

  function handleTouchMove(event: MainThread.TouchEvent) {
    'main thread'

    if (!swipeStartedMTRef.current && !tapLockTouchMove(event)) {
      swipeStartedMTRef.current = true
      onSwipeStartMT()
      return
    }
  }

  return {
    handleTouchStart,
    handleTouchMove,
    setSwipeEndMT,
    setSwipeStartMT,
  }
}
