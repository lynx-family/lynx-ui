// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'

import type { MainThread } from '@lynx-js/types'

export function useVelocity({ deceleratingRate = 0.99 }) {
  const touchStartRef = useMainThreadRef<number>(0)
  const velocityRef = useMainThreadRef<number>(0)

  function velocityTouchStart(event: MainThread.TouchEvent) {
    'main thread'

    touchStartRef.current = event.detail.x
  }

  function velocityTouchMove(event: MainThread.TouchEvent) {
    'main thread'
    const timeDuration = Date.now() - event.timestamp

    const delta = event.detail.x - touchStartRef.current
    const velocity = delta / timeDuration
    velocityRef.current = velocity
  }

  function getVelocityDistance() {
    'main thread'
    const velocity = velocityRef.current
    const distance = Math.pow(velocity, 2) / (2 * deceleratingRate)
    return distance
  }

  function getVelocity() {
    'main thread'
    const distance = getVelocityDistance()

    return {
      velocity: velocityRef.current,
      distance,
    }
  }

  return {
    getVelocity,
    velocityTouchStart,
    velocityTouchMove,
  }
}
