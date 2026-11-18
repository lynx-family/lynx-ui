// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect, useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { useMotionValueRef, useMotionValueRefEvent } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import type { SheetLayoutRect, SheetPositionerDimensions } from '../context'
import type {
  SheetBodyProps,
  SheetContentProps,
  SheetTransition,
} from '../types'
import { useSheetAnimation } from './useSheetAnimation'

interface SheetSurfaceLayoutOptions {
  animateChanges: MainThreadRef<boolean>
  position: MainThreadRef<MotionValue<number>>
  presence: MainThreadRef<PresenceState>
  resolvedSide: 'top' | 'bottom' | 'left' | 'right'
  panelLayout?: SheetContentProps['panelLayout']
  screenHeight: number
  screenWidth: number
  positioner?: SheetPositionerDimensions | null
  allowOverDrag: boolean
  sheetSizeMTRef: MainThreadRef<number>
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
  panelLayout,
  screenHeight,
  screenWidth,
  positioner,
  allowOverDrag,
  sheetSizeMTRef,
  maxSnapSize,
  hasFitSnapPoint,
  initialSize,
  initialSnap,
  snapAnimation,
}: SheetSurfaceLayoutOptions) {
  const isBottom = resolvedSide === 'bottom'
  const requestedGap = panelLayout?.bottomGap ?? 0
  const inset = isBottom && Number.isFinite(requestedGap)
    ? Math.max(0, requestedGap)
    : 0
  const coverage = isBottom && panelLayout ? 0 : 1
  const originMTRef = positioner?.originMTRef
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const parentLayoutMTRef = useMainThreadRef<Partial<SheetLayoutRect> | null>(
    null,
  )
  const bodyMTRef = useMainThreadRef<{
    element: MainThread.Element | null
    insets: SheetBodyProps['viewportInsets']
    outer: SheetLayoutRect | null
    before: number
    after: number
    applied: string
  }>({
    element: null,
    insets: undefined,
    outer: null,
    before: 0,
    after: 0,
    applied: '',
  })
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

  function updateBodyMT(start: number, size: number) {
    'main thread'
    const { element, outer, insets, before, after, applied } = bodyMTRef.current
    if (!element || !outer || !insets || hasFitSnapPoint) return
    const origin = originMTRef?.current
    const left = horizontal ? start + before : outer.left - (origin?.left ?? 0)
    const top = horizontal ? outer.top - (origin?.top ?? 0) : start + before
    const width = horizontal ? Math.max(0, size - before - after) : outer.width
    const height = horizontal
      ? outer.height
      : Math.max(0, size - before - after)
    const offsets = resolveBodyLayout(
      { left, top, width, height },
      screenWidth,
      screenHeight,
      insets,
    )
    const key =
      `${offsets.left}/${offsets.top}/${offsets.width}/${offsets.height}`
    if (key === applied) return
    bodyMTRef.current.applied = key
    element.setStyleProperties({
      left: `${offsets.left}px`,
      top: `${offsets.top}px`,
      width: `${offsets.width}px`,
      height: `${offsets.height}px`,
    })
  }

  function updateSurfaceMT() {
    'main thread'
    const motion = position.current
    if (!motion) return
    const value = Math.max(0, motion.get())
    if (horizontal) {
      const opened = Math.max(sheetSizeMTRef.current, maxSnapSize)
      const extent = allowOverDrag ? value : Math.min(value, opened)
      updateBodyMT(
        resolvedSide === 'right' ? screenWidth - extent : extent - maxSnapSize,
        maxSnapSize,
      )
      return
    }
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
    const surfaceTop = screenHeight - value - effectiveInset
    // Keep a bounded panel's top inside the viewport without losing its gap.
    const correction = isBottom
      ? Math.min(height, Math.max(0, -surfaceTop)) * (1 - appearance.coverage)
      : 0
    const visibleHeight = height - correction
    clipMTRef.current?.setStyleProperties({ bottom: `${clipInset}px` })
    surfaceMTRef.current?.setStyleProperties({
      top: `${clipInset - effectiveInset + correction}px`,
      height: `${
        Math.max(visibleHeight, screenHeight * 1.5 * appearance.coverage)
      }px`,
    })
    if (!hasFitSnapPoint) {
      const contentHeight = visibleHeight
        + (Math.max(maxSnapSize, visibleHeight) - visibleHeight)
          * appearance.coverage
      viewportMTRef.current?.setStyleProperties({
        height: `${contentHeight}px`,
      })
      updateBodyMT(
        isBottom ? surfaceTop + correction : value - contentHeight,
        contentHeight,
      )
    }
  }

  function measureBodyParentMT(rect?: Partial<SheetLayoutRect>) {
    'main thread'
    parentLayoutMTRef.current = rect ?? null
  }

  function measureBodyMT(
    { left = 0, top = 0, width = 0, height = 0 }: Partial<SheetLayoutRect>,
  ) {
    'main thread'
    const parent = parentLayoutMTRef.current
    const before = horizontal
      ? left - (parent?.left ?? left)
      : top - (parent?.top ?? top)
    const size = horizontal ? width : height
    const parentSize = horizontal ? parent?.width : parent?.height
    bodyMTRef.current.outer = { left, top, width, height }
    bodyMTRef.current.before = before
    bodyMTRef.current.after = parentSize === undefined
      ? 0
      : parentSize - before - size
    updateSurfaceMT()
  }

  function setBodyMTRef(
    element: MainThread.Element | null,
    insets: SheetBodyProps['viewportInsets'],
  ) {
    'main thread'
    const body = bodyMTRef.current
    body.element = element
    body.insets = insets
    body.applied = ''
    if (element) updateSurfaceMT()
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
  }, [
    inset,
    coverage,
    screenHeight,
    maxSnapSize,
    hasFitSnapPoint,
    screenWidth,
    resolvedSide,
  ])
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

  return {
    setClipMTRef,
    setSurfaceMTRef,
    setViewportMTRef,
    measureBodyParentMT,
    bodyContext: { enabled: !hasFitSnapPoint, setBodyMTRef, measureBodyMT },
  }
}

function resolveBodyLayout(
  rect: SheetLayoutRect,
  viewportWidth: number,
  viewportHeight: number,
  insets: NonNullable<SheetBodyProps['viewportInsets']>,
): SheetLayoutRect {
  'main thread'
  const left = viewportOverlap(insets.left, rect.left, rect.width)
  const top = viewportOverlap(insets.top, rect.top, rect.height)
  return {
    left,
    top,
    width: rect.width - left
      - viewportOverlap(
        insets.right,
        viewportWidth - rect.left - rect.width,
        rect.width - left,
      ),
    height: rect.height - top
      - viewportOverlap(
        insets.bottom,
        viewportHeight - rect.top - rect.height,
        rect.height - top,
      ),
  }
}

function viewportOverlap(
  inset: number | undefined,
  distance: number,
  size: number,
) {
  'main thread'
  if (inset === undefined || !Number.isFinite(inset)) return 0
  return Math.min(size, Math.max(0, Math.max(0, inset) - distance))
}
