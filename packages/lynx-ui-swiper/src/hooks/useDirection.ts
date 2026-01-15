// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'

import type { MainThread } from '@lynx-js/types'

import { SwipeDirection } from '../types'
import type { SwiperProps } from '../types'

export function useDirection({ RTL }: { RTL: SwiperProps<unknown>['RTL'] }) {
  const startXRef = useMainThreadRef<number>(0)
  const directionRef = useMainThreadRef<SwipeDirection>(SwipeDirection.NONE)

  function handleTouchStart(event: MainThread.TouchEvent) {
    'main thread'

    startXRef.current = event.detail.x
    directionRef.current = SwipeDirection.NONE
  }

  function handleTouchMove(event: MainThread.TouchEvent) {
    'main thread'

    if (event.detail.x < startXRef.current) {
      directionRef.current = RTL ? SwipeDirection.REVERT : SwipeDirection.NORMAL
    } else if (event.detail.x > startXRef.current) {
      directionRef.current = RTL ? SwipeDirection.NORMAL : SwipeDirection.REVERT
    } else {
      directionRef.current = SwipeDirection.NONE
    }
  }

  function handleTouchEnd(event: MainThread.TouchEvent) {
    'main thread'

    if (event.detail.x < startXRef.current) {
      directionRef.current = RTL ? SwipeDirection.REVERT : SwipeDirection.NORMAL
    } else if (event.detail.x > startXRef.current) {
      directionRef.current = RTL ? SwipeDirection.NORMAL : SwipeDirection.REVERT
    } else {
      directionRef.current = SwipeDirection.NONE
    }
  }

  function overrideDirection(direction: SwipeDirection) {
    'main thread'
    directionRef.current = direction
  }

  return {
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    overrideDirection,
    directionRef,
  }
}
