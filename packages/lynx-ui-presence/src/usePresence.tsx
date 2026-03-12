// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useEffect, useRef, useState } from '@lynx-js/react'

import { delayFrames, log } from '@lynx-js/lynx-ui-common'
import type { AnimationEvent, TransitionEvent } from '@lynx-js/types'

import type {
  PresenceAnimationStatus,
  PresenceContextType,
  PresenceProps,
  usePresenceProps,
  usePresenceReturnType,
} from './types'
import { PresenceState } from './utils'

export const PresenceContext = createContext<PresenceContextType>(null!)

export function usePresence(props: usePresenceProps): usePresenceReturnType {
  const {
    show,
    state,
    enableDelay = false,
    setPresenceState,
    onOpen,
    onClose,
    debugLog = false,
  } = props
  log(
    debugLog,
    `[lynx-ui-presence][usePresence] init, show: ${show}, state: ${state}, enableDelay: ${enableDelay}`,
  )
  const enteringStateWithDelay = enableDelay
    ? PresenceState.DelayedEntering
    : PresenceState.Entering

  const isTransitionAnimating = useRef<boolean>(false)
  const isKFAnimating = useRef<boolean>(false)
  // Track the initial render, to prevent effects from running on mount.
  const isInitialRender = useRef(true)
  const showRef = useRef(show)
  // The core state to control the mounting and unmounting of the component.
  const [mount, setMount] = useState<boolean>(false)
  // These three id record the loop ID for the entering progress animation and show state to prevent race conditions.
  const enteringLoopIdRef = useRef<number>(0)
  const leavingLoopIdRef = useRef<number>(0)
  const showScheduleIdRef = useRef(0)
  // Two timing windows to wait for the animation to start before forcing a state change.
  const enteringWaitFramesRef = useRef<number>(0)
  const leavingWaitFramesRef = useRef<number>(0)

  // The maximum number of frames to wait for an animation to start before forcing a state change.
  const MAX_WAIT_FRAMES = 24

  showRef.current = show

  const notAnimating = () => (isKFAnimating.current === false
    && isTransitionAnimating.current === false)

  const handleAnimationStart = () => {
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] handleAnimationStart state:${state}, show:${show}, isTransition:${isTransitionAnimating.current}, isKFAnimating:${isKFAnimating.current}`,
    )
  }

  const handleAnimationEnd = () => {
    // still need to check if the other kind of animation is running.
    if (
      (state === PresenceState.Entering
        || state === PresenceState.DelayedEntering)
      && notAnimating()
    ) {
      if (showRef.current) {
        setPresenceState(PresenceState.Entered)
      } else {
        // Safeguard: entering animation may still fire after show turns false.
        // Why not Left? Because Left will also cancel the ongoing leaving animation.
        setPresenceState(PresenceState.Leaving)
      }
    }
    if (state === PresenceState.Leaving && notAnimating()) {
      setPresenceState(PresenceState.Left)
    }
  }

  // ==== Animation events =====
  const handleKFStart = () => {
    isKFAnimating.current = true
    enteringLoopIdRef.current += 1
    leavingLoopIdRef.current += 1
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] KF start, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationStart()
  }

  const handleTransitionStart = () => {
    isTransitionAnimating.current = true
    enteringLoopIdRef.current += 1
    leavingLoopIdRef.current += 1
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] Transition start, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationStart()
  }

  const handleKFEnd = (_e: AnimationEvent) => {
    isKFAnimating.current = false
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] KF end, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationEnd()
  }

  const handleKFCancel = () => {
    isKFAnimating.current = false
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] KF cancel, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationEnd()
  }

  const handleTransitionCancel = () => {
    isTransitionAnimating.current = false
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] Transition cancel, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationEnd()
  }

  const handleTransitionEnd = (_e: TransitionEvent) => {
    isTransitionAnimating.current = false
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] Transition end, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationEnd()
  }

  // ==== state controller ====
  const handleStateEntered = () => {
    onOpen?.()
  }

  const handleStateLeft = () => {
    if (!isInitialRender.current) {
      onClose?.()
    }
    log(debugLog, '[lynx-ui-presence][usePresence] set mount=false (Left)')
    setMount(false)
  }

  const handleStateLeaving = () => {
    leavingWaitFramesRef.current = 0
    leavingLoopIdRef.current += 1
    const loopId = leavingLoopIdRef.current
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] leaving loop scheduled, loopId: ${loopId}`,
    )
    const tryLeft = () => {
      // The loopId is inconsistent with the current animation state, means the animation started during the delay period, so we should stop this trying.
      if (loopId !== leavingLoopIdRef.current) return
      if (!notAnimating()) return
      // timeout reached => treat as no animation
      if (leavingWaitFramesRef.current >= MAX_WAIT_FRAMES) {
        log(
          debugLog,
          `[lynx-ui-presence][usePresence] leaving timeout reached, loopId: ${loopId}, frames: ${leavingWaitFramesRef.current}`,
        )
        setPresenceState(PresenceState.Left)
        return
      }
      leavingWaitFramesRef.current += 1
      delayFrames(1, tryLeft)
    }

    delayFrames(1, tryLeft)
  }

  const handleStateEnteringWithDelay = () => {
    enteringWaitFramesRef.current = 0
    enteringLoopIdRef.current += 1
    const loopId = enteringLoopIdRef.current
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] entering loop scheduled, loopId: ${loopId}`,
    )
    const tryEntered = () => {
      // The loopId is inconsistent with the current animation state, means the animation started during the delay period, so we should stop this trying.
      if (loopId !== enteringLoopIdRef.current) return
      if (!notAnimating()) return
      if (enteringWaitFramesRef.current >= MAX_WAIT_FRAMES) {
        log(
          debugLog,
          `[lynx-ui-presence][usePresence] entering timeout reached, loopId: ${loopId}, frames: ${enteringWaitFramesRef.current}`,
        )
        setPresenceState(PresenceState.Entered)
        return
      }
      enteringWaitFramesRef.current += 1
      delayFrames(1, tryEntered)
    }

    delayFrames(1, tryEntered)
  }

  useEffect(() => {
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] state effect, state: ${state}, show: ${show}, enableDelay: ${enableDelay}, isTransitionAnimating: ${isTransitionAnimating.current}, isKFAnimating: ${isKFAnimating.current}`,
    )
    if (state === PresenceState.Entered) {
      handleStateEntered()
    }
    if (state === PresenceState.Left) {
      handleStateLeft()
    }
    if (state === PresenceState.Leaving) {
      handleStateLeaving()
    }
    if (state === enteringStateWithDelay) {
      handleStateEnteringWithDelay()
    }
  }, [state])

  // ==== Show change part ====
  const handleShow = (scheduleId: number) => {
    log(
      debugLog,
      '[lynx-ui-presence][usePresence] set mount=true',
    )
    setMount(true)
    log(
      debugLog,
      '[lynx-ui-presence][usePresence] schedule set Entering in 8 frames',
    )
    delayFrames(8, () => {
      if (scheduleId !== showScheduleIdRef.current) return
      setPresenceState(PresenceState.Entering)
    })
    if (enableDelay) {
      log(
        debugLog,
        '[lynx-ui-presence][usePresence] schedule set DelayedEntering in 16 frames',
      )
      delayFrames(16, () => {
        if (scheduleId !== showScheduleIdRef.current) return
        setPresenceState(PresenceState.DelayedEntering)
      })
    }
  }

  const handleDismiss = () => {
    if (
      state === PresenceState.Entered || state === PresenceState.Entering
      || state === PresenceState.DelayedEntering
    ) {
      log(
        debugLog,
        '[lynx-ui-presence][usePresence] show=false -> set PresenceState.Leaving',
      )
      setPresenceState(PresenceState.Leaving)
    } else if (state === PresenceState.Initial && mount) {
      log(
        debugLog,
        '[lynx-ui-presence][usePresence] show=false in Initial -> set mount=false',
      )
      setMount(false)
    }
  }

  useEffect(() => {
    log(
      debugLog,
      `[lynx-ui-presence][usePresence] show effect show:${show}, enableDelay:${enableDelay}, state:${state}, mount:${mount}`,
    )
    showScheduleIdRef.current += 1
    const scheduleId = showScheduleIdRef.current
    if (show) {
      handleShow(scheduleId)
    } else {
      handleDismiss()
    }
  }, [show, enableDelay])

  useEffect(() => {
    isInitialRender.current = false
  }, [])

  return {
    controllers: { state, mount, setPresenceState },
    animationHandlers: {
      handleKFStart,
      handleKFCancel,
      handleKFEnd,
      handleTransitionStart,
      handleTransitionCancel,
      handleTransitionEnd,
    },
  }
}

export const renderPresenceChildren = (
  props: {
    children: PresenceProps['children']
    status: PresenceAnimationStatus
  },
) => {
  const { children, status } = props
  return typeof children === 'function'
    ? children(status)
    : children
}
