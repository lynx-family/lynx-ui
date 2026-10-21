// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect } from '@lynx-js/react'
import type { MutableRefObject } from '@lynx-js/react'

import { getRectByRef, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import type { Rect } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'
import type { NodesRef } from '@lynx-js/types'

import type { ToastContentProps } from './types'

export const calculateTargetPoint = (
  toastRect: Rect,
  swipeDirection: ToastContentProps['swipeDirection'],
) => {
  const { width, height, left, top } = toastRect
  const right = left + width
  const bottom = top + height
  const screenWidth = SystemInfo.pixelWidth / SystemInfo.pixelRatio
  const screenHeight = SystemInfo.pixelHeight / SystemInfo.pixelRatio

  const includesDirection = (dir: string) =>
    Array.isArray(swipeDirection)
      ? swipeDirection.includes(dir)
      : swipeDirection === dir

  let x = 0
  let y = 0

  if (includesDirection('right')) x = screenWidth - right + width
  if (includesDirection('left')) x = -left - width
  if (includesDirection('top')) y = -top - height
  if (includesDirection('bottom')) y = screenHeight - bottom + height
  return { x, y }
}

export const performAnimation = (
  id: string,
  fromTransform: string,
  toTransform: string,
  duration: number,
  easing: string,
) => {
  // (TODO) Currently the animate API can not be used on ref. Change it when it is supported.
  lynx
    .getElementById(id)
    .animate([{ transform: fromTransform }, { transform: toTransform }], {
      duration,
      fill: 'forwards',
      easing: easing,
    })
}

interface useSlideAnimationOptions {
  enableAnimation: boolean
  state: PresenceState
  animationOptions: {
    swipeDirection: ToastContentProps['swipeDirection']
    duration: ToastContentProps['duration']
    easing: ToastContentProps['easing']
  }
  toastId: string
  toastWrapperRef: MutableRefObject<NodesRef | null>
  debugLog: ToastContentProps['debugLog']
  containerRectRef: MutableRefObject<Rect>
}

export const useSlideAnimation = (options: useSlideAnimationOptions) => {
  const {
    animationOptions,
    debugLog,
    toastId,
    toastWrapperRef,
    enableAnimation,
    state,
    containerRectRef,
  } = options
  const { swipeDirection, duration = 100, easing = 'linear' } = animationOptions

  useEffect(() => {
    if (enableAnimation) {
      if (state === PresenceState.DelayedEntering) {
        showAnimate()
      }
      if (state === PresenceState.Leaving) {
        dismissAnimate()
      }
    }
  }, [state])

  const showAnimate = useMemoizedFn(() => {
    if (debugLog) {
      console.info('showAnimate')
    }

    const targetPosition = calculateTargetPoint(
      containerRectRef.current,
      swipeDirection,
    )
    performAnimation(
      toastId,
      `translate(${targetPosition.x}px, ${targetPosition.y}px)`,
      'translate(0px, 0px)',
      duration,
      easing,
    )
  })

  const dismissAnimate = useMemoizedFn(() => {
    getRectByRef(toastWrapperRef, false, 'overlay').then((res) => {
      if (debugLog) {
        console.info('dismissAnimate', res)
      }

      const targetPosition = calculateTargetPoint(
        containerRectRef.current,
        swipeDirection,
      )
      performAnimation(
        toastId,
        'translate(0px, 0px)',
        `translate(${targetPosition.x}px, ${targetPosition.y}px)`,
        duration,
        easing,
      )
    })
  })
}
