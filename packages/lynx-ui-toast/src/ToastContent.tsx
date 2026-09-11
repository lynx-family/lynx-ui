// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext, useRef } from '@lynx-js/react'

import { getRectById } from '@lynx-js/lynx-ui-common'
import type { Rect } from '@lynx-js/lynx-ui-common'
import {
  PresenceContext,
  presenceClassVariants,
  useVisibilityFromPresence,
} from '@lynx-js/lynx-ui-presence'
import type { NodesRef } from '@lynx-js/types'

import { ToastContext } from './toastContext'
import type { ToastContentProps } from './types'
import { useSlideAnimation } from './useSlideAnimation'

export const ToastContent = (props: ToastContentProps) => {
  const {
    children,
    duration = 100,
    style,
    className,
    swipeDirection = 'top',
    easing = 'linear',
    useDefaultAnimation = true,
    transition,
    toastContentProps,
    debugLog = false,
  } = props

  const { toastId } = useContext(ToastContext)
  const toastIdStr = `lynx-ui-toast-animate-${toastId}`
  const positionerIdStr = `lynx-ui-toast-positioner-${toastId}`
  const { animationHandlers, controllers } = useContext(PresenceContext)
  const state = controllers.state
  const {
    handleKFStart,
    handleKFEnd,
    handleTransitionStart,
    handleTransitionEnd,
  } = animationHandlers
  const toastWrapperRef = useRef<NodesRef | null>(null)
  const rectRef = useRef<Rect>({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  })

  useSlideAnimation({
    enableAnimation: useDefaultAnimation,
    state,
    animationOptions: {
      swipeDirection,
      duration,
      easing,
    },
    debugLog,
    toastId: toastIdStr,
    toastWrapperRef,
    containerRectRef: rectRef,
  })

  const handleLayoutChange = () => {
    // Since the layout is not correct related to the window as it's inside overlay, we need to get the rect relative to overlay instead of the window
    getRectById(toastIdStr, false, positionerIdStr).then((res) => {
      if (debugLog) {
        console.info('layout change rect result', res)
      }
      rectRef.current = res
    })
  }
  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: true,
    className,
    transition,
  })

  const visibility = useVisibilityFromPresence(state)

  return (
    <view
      id={`${toastIdStr}`}
      ref={toastWrapperRef}
      bindanimationstart={handleKFStart}
      bindanimationend={handleKFEnd}
      bindtransitionstart={handleTransitionStart}
      bindtransitionend={handleTransitionEnd}
      bindanimationcancel={handleKFEnd}
      bindlayoutchange={handleLayoutChange}
      event-through={false}
      // Only show the toast when it's animating or showing
      style={{ visibility: visibility, ...style }}
      className={presenceClassName}
      {...toastContentProps}
    >
      {children}
    </view>
  )
}
