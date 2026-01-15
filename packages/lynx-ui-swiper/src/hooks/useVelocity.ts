// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'

import type { MainThread } from '@lynx-js/types'

import { SwipeDirection } from '../types'
import type { SwiperProps } from '../types'

export function useVelocity({ RTL }: { RTL: SwiperProps<unknown>['RTL'] }) {
  const positionQueueRef = useMainThreadRef<number[]>([])
  const timeQueueRef = useMainThreadRef<number[]>([])

  const reset = () => {
    'main thread'
    timeQueueRef.current = []
    positionQueueRef.current = []
  }

  const pruneQueue = (ms: number) => {
    'main thread'
    const timeQueue = timeQueueRef.current
    const positionQueue = positionQueueRef.current

    const nowTs = Date.now()
    // pull old values off of the queue
    while (timeQueue.length > 0 && timeQueue[0] < nowTs - ms) {
      timeQueue.shift()
      positionQueue.shift()
    }
  }

  const getVelocity = () => {
    'main thread'
    pruneQueue(500)
    const timeQueue = timeQueueRef.current
    const positionQueue = positionQueueRef.current
    const { length } = timeQueue
    if (length < 2) {
      return {
        velocity: 0,
        direction: SwipeDirection.REVERT,
      }
    }
    const distance = RTL
      ? positionQueue[0] - positionQueue[length - 1]
      : positionQueue[length - 1] - positionQueue[0]
    const time = (timeQueue[length - 1] - timeQueue[0]) / 1000
    return {
      velocity: distance / time,
      direction: distance > 0 ? SwipeDirection.REVERT : SwipeDirection.NORMAL,
    }
  }

  const updatePosition = (position: number) => {
    'main thread'
    const timeQueue = timeQueueRef.current
    const positionQueue = positionQueueRef.current

    positionQueue.push(position)
    timeQueue.push(Date.now())
    pruneQueue(50)
  }

  function velocityTouchStart(_event) {
    'main thread'
    reset()
  }

  function velocityTouchMove(event: MainThread.TouchEvent) {
    'main thread'

    updatePosition(event.detail.x)
  }

  return {
    getVelocity,
    velocityTouchStart,
    velocityTouchMove,
  }
}
