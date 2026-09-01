// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnBackground, useMainThreadRef } from '@lynx-js/react'
import type { MutableRefObject, RefObject } from '@lynx-js/react'

import type { Point, Rect } from '@lynx-js/lynx-ui-common'
import type { MainThread, Touch } from '@lynx-js/types'

import { calculateTargetPoint, performAnimation } from './useSlideAnimation'

interface useSwipeOptions {
  mainThreadRef: RefObject<MainThread.Element | undefined>
  draggableToastId: string
  containerRectRef: MutableRefObject<Rect>
  animationOptions: {
    easing: string
    duration: number
    swipeDirection?:
      | 'top'
      | 'bottom'
      | 'left'
      | 'right'
      | 'none'
  }
  minTranslateX?: number
  maxTranslateX?: number
  minTranslateY?: number
  maxTranslateY?: number
}

export const useSwipe = (options: useSwipeOptions) => {
  const {
    mainThreadRef,
    draggableToastId = '',
    animationOptions,
    minTranslateX,
    maxTranslateX,
    minTranslateY,
    maxTranslateY,
    containerRectRef,
  } = options
  const transition = useMainThreadRef<Point>({ x: 0, y: 0 })
  const touchStartPosition = useMainThreadRef<Touch[]>()
  const { easing, duration, swipeDirection } = animationOptions
  // pitfall: Do not use Number.NEGATIVE_INFINITY or Number.POSITIVE_INFINITY here because currently it can not be serialization in ReactLynx, which might cause this mainThreadRef.current to be null
  const translateXLowerBound = useMainThreadRef<number>(
    swipeDirection === 'none'
      ? 0
      : (minTranslateX
          ?? (Array.isArray(swipeDirection)
            ? swipeDirection.includes('left')
            : swipeDirection === 'left')
        ? Number.MIN_SAFE_INTEGER
        : 0),
  )
  const translateXUpperBound = useMainThreadRef<number>(
    swipeDirection === 'none'
      ? 0
      : (maxTranslateX
          ?? (Array.isArray(swipeDirection)
            ? swipeDirection.includes('right')
            : swipeDirection === 'right')
        ? Number.MAX_SAFE_INTEGER
        : 0),
  )
  const translateYLowerBound = useMainThreadRef<number>(
    swipeDirection === 'none'
      ? 0
      : (minTranslateY
          ?? (Array.isArray(swipeDirection)
            ? swipeDirection.includes('top')
            : swipeDirection === 'top')
        ? Number.MIN_SAFE_INTEGER
        : 0),
  )
  const translateYUpperBound = useMainThreadRef<number>(
    swipeDirection === 'none'
      ? 0
      : (maxTranslateY
          ?? (Array.isArray(swipeDirection)
            ? swipeDirection.includes('bottom')
            : swipeDirection === 'bottom')
        ? Number.MAX_SAFE_INTEGER
        : 0),
  )
  const getCurrentDelta: (event: MainThread.TouchEvent) => Point = (
    event: MainThread.TouchEvent,
  ) => {
    'main thread'
    if (touchStartPosition.current) {
      return {
        x: event.touches[0].pageX - touchStartPosition.current?.[0].pageX,
        y: event.touches[0].pageY - touchStartPosition.current?.[0].pageY,
      }
    }
    return { x: 0, y: 0 }
  }

  const handleTouchStart = (event: MainThread.TouchEvent) => {
    'main thread'
    touchStartPosition.current = event.touches
  }

  const clamp = (value: number, min: number, max: number): number => {
    'main thread'
    return Math.min(Math.max(value, min), max)
  }

  const handleTouchMove = (event: MainThread.TouchEvent) => {
    'main thread'
    const delta = getCurrentDelta(event)
    const deltaX = clamp(
      delta.x,
      translateXLowerBound.current,
      translateXUpperBound.current,
    )
    const deltaY = clamp(
      delta.y,
      translateYLowerBound.current,
      translateYUpperBound.current,
    )
    mainThreadRef.current?.setStyleProperty(
      'transform',
      `translate(${deltaX}px, ${deltaY}px)`,
    )
    transition.current = { x: deltaX, y: deltaY }
  }

  const swipeEndAnimation = (startPosition: Point) => {
    const targetPosition = calculateTargetPoint(
      containerRectRef.current,
      swipeDirection,
    )

    const { width, height } = containerRectRef.current
    const shouldSwipeOut = Math.abs(startPosition.x) > width / 3
      || Math.abs(startPosition.y) > height / 3

    const fromTransform = `translate(
      ${targetPosition.x === 0 ? 0 : startPosition.x}px,
      ${targetPosition.y === 0 ? 0 : startPosition.y}px
    )`

    const toTransform = shouldSwipeOut
      ? `translate(${targetPosition.x}px, ${targetPosition.y}px)`
      : 'translate(0px, 0px)'

    performAnimation(
      draggableToastId,
      fromTransform,
      toTransform,
      duration,
      easing,
    )
  }

  const handleTouchEnd = (_event: MainThread.TouchEvent) => {
    'main thread'
    runOnBackground(swipeEndAnimation)(transition.current)
  }

  return {
    'main-thread:bindtouchstart': handleTouchStart,
    'main-thread:bindtouchmove': handleTouchMove,
    'main-thread:bindtouchend': handleTouchEnd,
  }
}
