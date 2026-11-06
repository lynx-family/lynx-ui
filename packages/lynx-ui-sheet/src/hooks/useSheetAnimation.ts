// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'
import { animate } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'

import type { SheetTransition } from '../types'

interface SheetAnimation {
  value: number
  complete: () => void
  config: SheetTransition
  interrupted: boolean
  startedAt: number
}

/** Own cancellation and resumption of the panel's main-thread animation. */
export function useSheetAnimation(
  position: MainThreadRef<MotionValue<number>>,
  defaultConfig: SheetTransition,
) {
  const animationMTRef = useMainThreadRef<SheetAnimation | null>(null)

  function stopAnimationMT() {
    'main thread'
    animationMTRef.current = null
    position.current.stop()
  }

  function animateToMT(
    value: number,
    onArrival?: () => void,
    options?: SheetTransition,
  ) {
    'main thread'
    const complete = onArrival ?? noop
    const config = options ?? defaultConfig
    stopAnimationMT()
    const animation: SheetAnimation = {
      value,
      complete,
      config,
      interrupted: false,
      startedAt: Date.now(),
    }
    animationMTRef.current = animation
    const onComplete = () => {
      'main thread'
      if (animationMTRef.current !== animation) return
      animationMTRef.current = null
      complete()
    }
    // mini animate's then() also runs on stop. Only arrival completes a snap.
    animate(
      position.current,
      value,
      config.type === 'spring'
        ? {
          type: 'spring',
          stiffness: config.stiffness ?? 200,
          damping: config.damping ?? 60,
          mass: config.mass ?? 1,
          onComplete,
        }
        : {
          duration: (config.duration ?? 400) / 1000,
          ease: config.ease ?? (t => t),
          onComplete,
        },
    )
  }

  function interruptAnimationMT() {
    'main thread'
    const animation = animationMTRef.current
    if (!animation || animation.interrupted) return
    if (animation.config.type === 'tween') {
      animation.config = {
        ...animation.config,
        duration: Math.max(
          (animation.config.duration ?? 400)
            - (Date.now() - animation.startedAt),
          0,
        ),
      }
    }
    animation.interrupted = true
    animationMTRef.current = animation
    position.current.stop()
  }

  function resumeAnimationMT() {
    'main thread'
    const animation = animationMTRef.current
    if (!animation?.interrupted) return
    // mini MotionValue retains velocity while stopped. Resume from rest.
    position.current.updateVelocity(0)
    animateToMT(animation.value, animation.complete, animation.config)
  }

  return {
    animateToMT,
    stopAnimationMT,
    interruptAnimationMT,
    resumeAnimationMT,
  }
}
