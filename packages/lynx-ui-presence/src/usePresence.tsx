// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useEffect, useRef, useState } from '@lynx-js/react'

import { delayFrames } from '@lynx-js/lynx-ui-common'
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
  } = props

  const enteringStateWithDelay = enableDelay
    ? PresenceState.DelayedEntering
    : PresenceState.Entering

  const isTransitionAnimating = useRef<boolean>(false)
  const isKFAnimating = useRef<boolean>(false)
  const [mount, setMount] = useState<boolean>(false)
  const enteringLoopIdRef = useRef<number>(0)
  const leavingLoopIdRef = useRef<number>(0)
  const enteringWaitFramesRef = useRef<number>(0)
  const leavingWaitFramesRef = useRef<number>(0)
  const MAX_WAIT_FRAMES = 24

  const changeToLeaving = () => {
    if (
      state === PresenceState.Entered && !show
    ) {
      setPresenceState(PresenceState.Leaving)
    }
  }

  const notAnimating = () => (isKFAnimating.current === false
    && isTransitionAnimating.current === false)

  const changeToEnteredOrLeft = () => {
    if (
      state === PresenceState.Entering
      || state === PresenceState.DelayedEntering
        && notAnimating() && show
    ) {
      setPresenceState(PresenceState.Entered)
    }
    if (state === PresenceState.Leaving && notAnimating() && !show) {
      setPresenceState(PresenceState.Left)
    }
  }

  const handleKFStart = () => {
    isKFAnimating.current = true
    enteringLoopIdRef.current += 1
    leavingLoopIdRef.current += 1
    changeToLeaving()
  }

  const handleTransitionStart = () => {
    isTransitionAnimating.current = true
    enteringLoopIdRef.current += 1
    leavingLoopIdRef.current += 1
    changeToLeaving()
  }

  const handleKFEnd = (_e: AnimationEvent) => {
    isKFAnimating.current = false
    changeToEnteredOrLeft()
  }

  const handleTransitionEnd = (_e: TransitionEvent) => {
    isTransitionAnimating.current = false
    changeToEnteredOrLeft()
  }

  const isInitialRender = useRef(true)

  useEffect(() => {
    if (state === PresenceState.Entered) {
      onOpen?.()
    }
    if (state === PresenceState.Left) {
      if (!isInitialRender.current) {
        onClose?.()
      }
      setMount(false)
    }
    if (state === PresenceState.Leaving) {
      leavingWaitFramesRef.current = 0
      leavingLoopIdRef.current += 1
      const loopId = leavingLoopIdRef.current

      const tryLeft = () => {
        if (loopId !== leavingLoopIdRef.current) return
        if (!notAnimating()) return
        if (leavingWaitFramesRef.current >= MAX_WAIT_FRAMES) {
          setPresenceState(PresenceState.Left)
          return
        }
        leavingWaitFramesRef.current += 1
        delayFrames(1, tryLeft)
      }

      delayFrames(1, tryLeft)
    }
    if (state === enteringStateWithDelay) {
      enteringWaitFramesRef.current = 0
      enteringLoopIdRef.current += 1
      const loopId = enteringLoopIdRef.current

      const tryEntered = () => {
        if (loopId !== enteringLoopIdRef.current) return
        if (!notAnimating()) return
        if (enteringWaitFramesRef.current >= MAX_WAIT_FRAMES) {
          setPresenceState(PresenceState.Entered)
          return
        }
        enteringWaitFramesRef.current += 1
        delayFrames(1, tryEntered)
      }

      delayFrames(1, tryEntered)
    }
  }, [state])

  useEffect(() => {
    if (show) {
      setMount(true)
      delayFrames(8, () => setPresenceState(PresenceState.Entering))
      if (enableDelay) {
        delayFrames(16, () => setPresenceState(PresenceState.DelayedEntering))
      }
    } else {
      if (notAnimating() && state === PresenceState.Entered) {
        setPresenceState(PresenceState.Leaving)
      }
    }
  }, [show, enableDelay])

  useEffect(() => {
    isInitialRender.current = false
  }, [])

  return {
    controllers: { state, mount, setPresenceState },
    animationHandlers: {
      handleKFStart,
      handleKFEnd,
      handleTransitionEnd,
      handleTransitionStart,
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
