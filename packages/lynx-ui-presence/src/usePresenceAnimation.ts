// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useCallback, useEffect, useRef, useState } from '@lynx-js/react'

import { delayFrames } from '@lynx-js/lynx-ui-common'

import { PresenceState } from './utils'

/** An animation driver must report completion and return an optional cancellation function. */
export type PresenceAnimationDriver = (
  animation: { open: boolean, immediate?: boolean, complete: () => void },
) => (() => void) | undefined

interface UsePresenceAnimationOptions {
  show: boolean
  onOpen?: () => void
  onClose?: () => void
  enableDelay?: boolean
  waitForReady?: boolean
}

interface AnimationRegistration {
  driver: PresenceAnimationDriver
}

/**
 * Coordinates Presence with an optional external animation driver. Pass the
 * returned state and handlers to Presence using the same `enableDelay` value.
 * With `waitForReady`, signal `markReady` after the current content is ready;
 * readiness is retained across interrupted exits and reset after a full exit.
 */
export function usePresenceAnimation({
  show,
  onOpen,
  onClose,
  enableDelay = false,
  waitForReady = false,
}: UsePresenceAnimationOptions) {
  const [state, setPresenceState] = useState(PresenceState.Initial)
  const [animation, setAnimation] = useState<AnimationRegistration | null>(null)
  const [ready, setReady] = useState(!waitForReady)
  const entryState = enableDelay
    ? PresenceState.DelayedEntering
    : PresenceState.Entering
  const registrationRef = useRef<AnimationRegistration | null>(null)
  const lastOpenedRef = useRef<AnimationRegistration | null>(null)
  const mounted = useRef(true)
  const latest = useRef({ show, animation, onOpen, onClose })
  latest.current = { show, animation, onOpen, onClose }
  const currentState = useRef(state)
  currentState.current = state
  const didAnimate = useRef(false)
  const pendingOpenCompletion = useRef(false)
  const closeNotified = useRef(false)
  const openNotified = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      registrationRef.current = null
    }
  }, [])

  const registerAnimation = useCallback((driver: PresenceAnimationDriver) => {
    const registration = { driver }
    registrationRef.current = registration
    setAnimation(registration)
    return () => {
      if (registrationRef.current !== registration) return
      registrationRef.current = null
      // A replacement can register during the same commit. Wait one frame
      // before treating the absence of a driver as permanent removal.
      delayFrames(1, () => {
        if (!mounted.current || registrationRef.current) return
        setAnimation(current => current === registration ? null : current)
      })
    }
  }, [])

  const markReady = useCallback(() => {
    if (latest.current.show) setReady(true)
  }, [])
  const updatePresence: typeof setPresenceState = useCallback(next => {
    if (typeof next === 'function') {
      setPresenceState(previous => {
        const resolved = next(previous)
        if (
          latest.current.animation
          && (resolved === PresenceState.Entered
            || resolved === PresenceState.Left)
        ) return previous
        return resolved
      })
      return
    }
    const resolved = next
    // Motion, rather than the CSS fallback timer, completes this lifecycle.
    if (
      latest.current.animation
      && (resolved === PresenceState.Entered || resolved === PresenceState.Left)
    ) return
    setPresenceState(resolved)
  }, [])
  const handleClose = useCallback(() => {
    if (closeNotified.current) return
    closeNotified.current = true
    openNotified.current = false
    latest.current.onClose?.()
  }, [])
  const handleOpen = useCallback(() => {
    openNotified.current = true
    latest.current.onOpen?.()
  }, [])
  const finishOpen = useCallback(() => {
    // Presence treats a reversed exit as part of the previous open cycle.
    if (openNotified.current) latest.current.onOpen?.()
    setPresenceState(PresenceState.Entered)
  }, [])

  useEffect(() => {
    if (show) closeNotified.current = false
  }, [show])

  useEffect(() => {
    if (waitForReady && !show && state === PresenceState.Left) setReady(false)
  }, [show, state, waitForReady])

  const entering = show && ready
    && (state === entryState
      || (didAnimate.current
        && (state === PresenceState.Leaving
          || state === PresenceState.Entering)))
  const leaving = !show && state === PresenceState.Leaving
  let animationPhase: 'open' | 'close' | 'sync' | null = null
  if (entering) animationPhase = 'open'
  else if (leaving) animationPhase = 'close'
  else if (show && ready && state === PresenceState.Entered) {
    animationPhase = 'sync'
  }

  useEffect(() => {
    if (
      !animation || registrationRef.current !== animation || !animationPhase
    ) {
      return
    }
    const syncing = animationPhase === 'sync'
    if (syncing && lastOpenedRef.current === animation) return
    const opening = animationPhase !== 'close'
    if (opening) lastOpenedRef.current = animation
    if (!syncing) didAnimate.current = true
    pendingOpenCompletion.current = false
    let active = true
    const cleanup = animation.driver({
      open: opening,
      ...(syncing && { immediate: true }),
      complete: () => {
        if (
          !active || registrationRef.current !== animation
          || latest.current.show !== opening
        ) return
        active = false
        if (syncing) return
        if (opening && currentState.current !== entryState) {
          pendingOpenCompletion.current = true
        } else if (opening) {
          finishOpen()
        } else {
          setPresenceState(PresenceState.Left)
        }
      },
    })
    return () => {
      active = false
      pendingOpenCompletion.current = false
      cleanup?.()
    }
  }, [animationPhase, animation, entryState, finishOpen])

  useEffect(() => {
    if (
      state === entryState && show
      && pendingOpenCompletion.current
    ) {
      pendingOpenCompletion.current = false
      finishOpen()
    } else if (state === PresenceState.Left && didAnimate.current) {
      didAnimate.current = false
      handleClose()
    } else if (!animation && didAnimate.current) {
      if (state === PresenceState.Entered) {
        didAnimate.current = false
      } else if (state === entryState && show) {
        didAnimate.current = false
        finishOpen()
      } else if (state === PresenceState.Leaving && !show) {
        setPresenceState(PresenceState.Left)
      }
    }
  }, [state, animation, show, entryState, finishOpen, handleClose])

  return {
    state,
    updatePresence,
    registerAnimation,
    markReady,
    animated: !!animation,
    handleOpen,
    handleClose,
  }
}
