// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { AnimationOptions, Easing } from '@lynx-js/motion/mini'

import type { TabsIndicatorAnimation, TabsRootProps } from '../types'

export interface TabsIndicatorAnimationSpringResolved {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
  velocity?: number
}

export interface TabsIndicatorAnimationTweenResolved {
  type: 'tween'
  duration: number
  ease?: Easing
}

export type ResolvedTabsIndicatorAnimation =
  | TabsIndicatorAnimationSpringResolved
  | TabsIndicatorAnimationTweenResolved

export const DEFAULT_TABS_INDICATOR_TWEEN_DURATION = 250
export const DEFAULT_TABS_INDICATOR_ANIMATION:
  TabsIndicatorAnimationSpringResolved = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1,
  }

export function resolveTabsIndicatorAnimation(
  animation?: TabsIndicatorAnimation,
): ResolvedTabsIndicatorAnimation {
  'main thread'
  if (!animation) {
    return DEFAULT_TABS_INDICATOR_ANIMATION
  }

  if (animation.type === 'tween') {
    return {
      type: 'tween',
      duration: animation.duration ?? DEFAULT_TABS_INDICATOR_TWEEN_DURATION,
      ease: animation.ease,
    }
  }

  return {
    type: 'spring',
    stiffness: animation.stiffness ?? 300,
    damping: animation.damping ?? 30,
    mass: animation.mass ?? 1,
    velocity: animation.velocity,
  }
}

export function toMiniAnimationOptions(
  animation?: TabsIndicatorAnimation,
): AnimationOptions {
  'main thread'
  const resolvedAnimation = resolveTabsIndicatorAnimation(animation)

  if (resolvedAnimation.type === 'tween') {
    return {
      duration: resolvedAnimation.duration / 1000,
      ease: resolvedAnimation.ease,
    }
  }

  return {
    type: 'spring',
    stiffness: resolvedAnimation.stiffness,
    damping: resolvedAnimation.damping,
    mass: resolvedAnimation.mass,
    velocity: resolvedAnimation.velocity,
  }
}

export function shouldAnimateIndicator(
  selectBehavior: TabsRootProps['selectBehavior'],
) {
  'main thread'
  return selectBehavior === 'smooth'
}

export function getIndicatorStyleProperties(
  width: number,
  left: number,
  enableRTL: boolean,
) {
  'main thread'
  if (enableRTL) {
    return {
      width: `${width}px`,
      right: `${left}px`,
      left: '',
    }
  }

  return {
    width: `${width}px`,
    left: `${left}px`,
    right: '',
  }
}
