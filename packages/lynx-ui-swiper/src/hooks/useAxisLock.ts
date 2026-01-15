// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'

import type { MainThread } from '@lynx-js/types'

import { GESTURE_THRESHOLD } from '../const'
import type { SwiperProps } from '../types'

function isAngleInRanges(angle: number, ranges: [number, number][]) {
  'main thread'
  return ranges.some(([start, end]) => {
    if (start <= end) {
      return angle >= start && angle <= end
    } else {
      return angle >= start || angle <= end // Handles wrap-around cases like [-180, -135] or [135, 180]
    }
  })
}

export function useAxisLock({
  consumeSlideEvent,
  experimentalHorizontalSwipeOnly,
}: {
  consumeSlideEvent: NonNullable<SwiperProps<unknown>['consumeSlideEvent']>
  experimentalHorizontalSwipeOnly: boolean
}) {
  const gestureLockedRef = useMainThreadRef<boolean>(false)
  const isMainAxisLockedRef = useMainThreadRef<boolean>(false)
  const touchStartRef = useMainThreadRef<number>(0)
  const touchStartCrossAxisRef = useMainThreadRef<number>(0)

  function handleTouchStart(event: MainThread.TouchEvent) {
    'main thread'

    touchStartRef.current = event.detail.x

    touchStartCrossAxisRef.current = event.detail.y

    gestureLockedRef.current = false
    isMainAxisLockedRef.current = false
  }

  function handleTouchMove(event: MainThread.TouchEvent) {
    'main thread'

    if (!experimentalHorizontalSwipeOnly) {
      return false
    }

    const deltaX = event.detail.x - touchStartRef.current

    const deltaY = event.detail.y - touchStartCrossAxisRef.current

    // Calculate total displacement (distance)
    const displacement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (!gestureLockedRef.current && displacement > GESTURE_THRESHOLD) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

      if (isAngleInRanges(angle, consumeSlideEvent)) {
        gestureLockedRef.current = true
        isMainAxisLockedRef.current = false
      } else {
        gestureLockedRef.current = true
        isMainAxisLockedRef.current = true
      }
    }

    return isMainAxisLockedRef.current
  }

  function handleVelocity() {
    'main thread'
    return isMainAxisLockedRef.current
  }

  function handleTouchEnd() {
    'main thread'
    gestureLockedRef.current = false
    isMainAxisLockedRef.current = false
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleVelocity,
  }
}
