// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'
import { animate } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'

import type { SheetTransition, SheetTransitionEvent } from '../types'

export type SheetTransitionTarget = Pick<
  SheetTransitionEvent,
  'kind' | 'target'
>

interface SheetAnimation {
  value: number
  complete: () => void
  config: SheetTransition
  transition?: SheetTransitionTarget
  progress: number
  interrupted: boolean
  positionComplete: boolean
  progressComplete: boolean
  stopProgress?: () => void
  startedAt: number
}

/** Own cancellation and resumption of the panel's main-thread animation. */
export function useSheetAnimation(
  position: MainThreadRef<MotionValue<number>>,
  defaultConfig: SheetTransition,
  onTransitionMT?: (event: SheetTransitionEvent) => void,
) {
  const animationMTRef = useMainThreadRef<SheetAnimation | null>(null)

  function notifyMT(
    transition: SheetTransitionTarget | undefined,
    phase: SheetTransitionEvent['phase'],
    progress: number,
    animated: boolean,
  ) {
    'main thread'
    if (transition && onTransitionMT) {
      onTransitionMT({ ...transition, phase, progress, animated })
    }
  }

  function stopAnimationMT() {
    'main thread'
    const previous = animationMTRef.current
    animationMTRef.current = null
    position.current.stop()
    previous?.stopProgress?.()
    if (previous && !previous.interrupted) {
      notifyMT(previous.transition, 'cancel', previous.progress, true)
    }
  }

  function jumpToMT(value: number, transition: SheetTransitionTarget) {
    'main thread'
    stopAnimationMT()
    notifyMT(transition, 'start', 0, false)
    position.current.jump(value)
    notifyMT(transition, 'frame', 1, false)
    notifyMT(transition, 'end', 1, false)
  }

  function animateToMT(
    value: number,
    onArrival?: () => void,
    options?: SheetTransition,
    transition?: SheetTransitionTarget,
  ) {
    'main thread'
    const complete = onArrival ?? noop
    const config = options ?? defaultConfig
    stopAnimationMT()
    const from = position.current.get()
    const distance = value - from
    // A Sheet already at its target still needs time to animate companion styles.
    const useProgressAnimation = Boolean(
      onTransitionMT && transition?.kind === 'snap' && Math.abs(distance) < 1,
    )
    const animation: SheetAnimation = {
      value,
      complete,
      config,
      transition,
      progress: 0,
      interrupted: false,
      positionComplete: false,
      progressComplete: !useProgressAnimation,
      startedAt: Date.now(),
    }
    animationMTRef.current = animation
    notifyMT(transition, 'start', 0, true)

    function finishMT() {
      'main thread'
      if (
        animationMTRef.current !== animation || !animation.positionComplete
        || !animation.progressComplete
      ) return
      animationMTRef.current = null
      notifyMT(transition, 'frame', 1, true)
      notifyMT(transition, 'end', 1, true)
    }

    function updateProgressMT(progress: number) {
      'main thread'
      if (animationMTRef.current !== animation || animation.interrupted) return
      animation.progress = progress
      notifyMT(transition, 'frame', progress, true)
    }

    const onComplete = () => {
      'main thread'
      if (animationMTRef.current !== animation || animation.interrupted) return
      animation.positionComplete = true
      complete()
      finishMT()
    }
    const animationOptions = config.type === 'spring'
      ? {
        type: 'spring' as const,
        stiffness: config.stiffness ?? 200,
        damping: config.damping ?? 60,
        mass: config.mass ?? 1,
      }
      : {
        duration: (config.duration ?? 400) / 1000,
        ease: config.ease ?? ((t: number) => t),
      }

    // mini animate's then() also runs on stop. Only arrival completes a snap.
    animate(position.current, value, {
      ...animationOptions,
      onUpdate: current => {
        'main thread'
        if (!useProgressAnimation && transition && onTransitionMT) {
          updateProgressMT(distance === 0 ? 1 : (current - from) / distance)
        }
      },
      onComplete,
    })
    if (useProgressAnimation) {
      const progressAnimation = animate(0, 1, {
        ...animationOptions,
        velocity: 0,
        onUpdate: updateProgressMT,
        onComplete: () => {
          'main thread'
          if (animationMTRef.current !== animation || animation.interrupted) {
            return
          }
          animation.progressComplete = true
          finishMT()
        },
      })
      animation.stopProgress = progressAnimation.stop
    }
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
    animation.stopProgress?.()
    notifyMT(animation.transition, 'cancel', animation.progress, true)
  }

  function resumeAnimationMT() {
    'main thread'
    const animation = animationMTRef.current
    if (!animation?.interrupted) return
    // mini MotionValue retains velocity while stopped. Resume from rest.
    position.current.updateVelocity(0)
    animateToMT(
      animation.value,
      animation.positionComplete ? noop : animation.complete,
      animation.config,
      animation.transition,
    )
  }

  return {
    animateToMT,
    jumpToMT,
    stopAnimationMT,
    interruptAnimationMT,
    resumeAnimationMT,
  }
}
