// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext, useMainThreadRef, useRef } from '@lynx-js/react'

import { getRectById } from '@lynx-js/lynx-ui-common'
import type { Rect } from '@lynx-js/lynx-ui-common'
import {
  PresenceContext,
  PresenceState,
  presenceClassVariants,
  useVisibilityFromPresence,
} from '@lynx-js/lynx-ui-presence'
import type {
  AnimationEvent,
  EventHandler,
  MainThread,
  NodesRef,
} from '@lynx-js/types'

import { ToastContext } from './toastContext'
import type { ToastDraggableContentProps } from './types'
import { useSlideAnimation } from './useSlideAnimation'
import { useSwipe } from './useSwipe'

export const ToastDraggableContent = (
  props: ToastDraggableContentProps,
) => {
  const {
    children,
    className,
    style,
    duration = 100,
    swipeDirection = 'top',
    easing = 'linear',
    transition,
    draggableToastContentProps,
    debugLog = false,
  } = props

  const rectRef = useRef<Rect>({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  })

  const { toastId } = useContext(ToastContext)
  const toastIdStr = `lynx-ui-toast-animate-${toastId}`
  const positionerIdStr = `lynx-ui-toast-positioner-${toastId}`
  const { controllers, animationHandlers } = useContext(PresenceContext)
  const { handleKFStart, handleKFEnd } = animationHandlers
  const { state, setPresenceState } = controllers
  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: true,
    className,
    transition,
  })
  const toastWrapperMTSRef = useMainThreadRef<MainThread.Element | null>(null)
  const toastWrapperRef = useRef<NodesRef>(null)
  const duringSwipe = useRef<boolean>(false)

  useSlideAnimation({
    // We now only support default animation in draggableContent
    enableAnimation: true,
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

  const swipeHandlers = useSwipe({
    draggableToastId: toastIdStr,
    mainThreadRef: toastWrapperMTSRef,
    containerRectRef: rectRef,
    animationOptions: {
      easing,
      duration,
      swipeDirection: swipeDirection,
    },
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

  const handleAnimationStart: EventHandler<AnimationEvent> = (e) => {
    if (!duringSwipe.current) {
      handleKFStart(e)
    }
  }

  const handleAnimationEnd: EventHandler<AnimationEvent> = (e) => {
    if (duringSwipe.current) {
      duringSwipe.current = false
      setPresenceState(PresenceState.Left)
    } else {
      handleKFEnd(e)
    }
  }

  const handleTouchStart = () => (duringSwipe.current = true)

  const visibility = useVisibilityFromPresence(state)

  return (
    <view
      id={`lynx-ui-toast-animate-${toastId}`}
      main-thread:ref={toastWrapperMTSRef}
      ref={toastWrapperRef}
      bindlayoutchange={handleLayoutChange}
      bindanimationstart={handleAnimationStart}
      bindanimationend={handleAnimationEnd}
      bindtouchstart={handleTouchStart}
      bindanimationcancel={handleKFEnd}
      event-through={false}
      {...swipeHandlers}
      // Only show the toast when it's animating or showing
      style={{ visibility: visibility, ...style }}
      className={presenceClassName}
      {...draggableToastContentProps}
    >
      {children}
    </view>
  )
}
