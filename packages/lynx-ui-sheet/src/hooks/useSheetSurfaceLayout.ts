// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect, useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { useMotionValueRef, useMotionValueRefEvent } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import type { SheetTransition } from '../types'
import { useSheetAnimation } from './useSheetAnimation'

interface SheetSurfaceLayoutOptions {
  animateChanges: MainThreadRef<boolean>
  position: MainThreadRef<MotionValue<number>>
  presence: MainThreadRef<PresenceState>
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  detached: boolean
  bottomInset: number
  screenHeight: number
  maxSnapSize: number
  hasFitSnapPoint: boolean
  initialSize: (index: number) => number
  initialSnap: number
  snapAnimation: SheetTransition
}

// Separate background coverage from movement and intrinsic content measurement.
export function useSheetSurfaceLayout({
  position,
  animateChanges,
  presence,
  resolvedSide,
  detached,
  bottomInset,
  screenHeight,
  maxSnapSize,
  hasFitSnapPoint,
  initialSize,
  initialSnap,
  snapAnimation,
}: SheetSurfaceLayoutOptions) {
  const isBottom = resolvedSide === 'bottom'
  const inset = isBottom && Number.isFinite(bottomInset)
    ? Math.max(0, bottomInset)
    : 0
  const coverage = isBottom && detached ? 0 : 1
  const clipMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const surfaceMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const viewportMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const panelHeightMTRef = useMainThreadRef(0)
  const appearanceMTRef = useMainThreadRef({
    inset,
    coverage,
    fromInset: inset,
    fromCoverage: coverage,
    toInset: inset,
    toCoverage: coverage,
  })
  const progress = useMotionValueRef(1)
  const animation = useSheetAnimation(progress, snapAnimation)
  const animateAppearanceMT = animation.animateToMT
  const stopAppearanceMT = animation.stopAnimationMT

  function updateSurfaceMT() {
    'main thread'
    if (resolvedSide === 'left' || resolvedSide === 'right') return
    const motion = position.current
    if (!motion) return
    const value = Math.max(0, motion.get())
    const state = presence.current
    const entering = state === PresenceState.Entering
    const leaving = state === PresenceState.Leaving
      || state === PresenceState.Left
    const height = entering
      ? Math.max(value, initialSize(initialSnap), 0)
      : (leaving ? Math.max(panelHeightMTRef.current, value) : value)
    panelHeightMTRef.current = height
    const appearance = appearanceMTRef.current
    // Entry and exit translate a complete card beyond the screen edge.
    const visibleFraction = entering || leaving
      ? (height > 0 ? Math.min(1, value / height) : 0)
      : 1
    const effectiveInset = isBottom ? appearance.inset * visibleFraction : 0
    const clipInset = effectiveInset * appearance.coverage
    clipMTRef.current?.setStyleProperties({ bottom: `${clipInset}px` })
    surfaceMTRef.current?.setStyleProperties({
      top: `${-(effectiveInset - clipInset)}px`,
      height: `${Math.max(height, screenHeight * 1.5 * appearance.coverage)}px`,
    })
    if (!hasFitSnapPoint) {
      viewportMTRef.current?.setStyleProperties({
        height: `${
          height
          + (Math.max(maxSnapSize, height) - height) * appearance.coverage
        }px`,
      })
    }
  }

  useMotionValueRefEvent(position, 'change', updateSurfaceMT)
  useMotionValueRefEvent(progress, 'change', value => {
    'main thread'
    const appearance = appearanceMTRef.current
    const p = Math.max(0, Math.min(1, value))
    appearance.inset = appearance.fromInset
      + (appearance.toInset - appearance.fromInset) * p
    appearance.coverage = appearance.fromCoverage
      + (appearance.toCoverage - appearance.fromCoverage) * p
    updateSurfaceMT()
  })

  function configureSurfaceMT(nextInset: number, nextCoverage: number) {
    'main thread'
    const appearance = appearanceMTRef.current
    if (
      appearance.toInset === nextInset && appearance.toCoverage === nextCoverage
    ) {
      updateSurfaceMT()
      return
    }
    stopAppearanceMT()
    appearance.fromInset = appearance.inset
    appearance.fromCoverage = appearance.coverage
    appearance.toInset = nextInset
    appearance.toCoverage = nextCoverage
    progress.current.jump(0)
    if (
      animateChanges.current
      && (presence.current === PresenceState.Entered
        || presence.current === PresenceState.Entering)
    ) {
      animateAppearanceMT(1)
    } else {
      progress.current.jump(1)
    }
  }

  useEffect(() => {
    runOnMainThread(configureSurfaceMT)(inset, coverage)
  }, [inset, coverage, screenHeight, maxSnapSize, hasFitSnapPoint])
  useEffect(() => () => {
    runOnMainThread(() => {
      'main thread'
      if (progress.current) stopAppearanceMT()
    })()
  }, [])

  function setSurfaceMTRef(element: MainThread.Element | null) {
    'main thread'
    surfaceMTRef.current = element
    if (element) updateSurfaceMT()
  }

  function setViewportMTRef(element: MainThread.Element) {
    'main thread'
    viewportMTRef.current = element
    updateSurfaceMT()
  }

  function setClipMTRef(element: MainThread.Element) {
    'main thread'
    clipMTRef.current = element
    updateSurfaceMT()
  }

  return { setClipMTRef, setSurfaceMTRef, setViewportMTRef }
}
