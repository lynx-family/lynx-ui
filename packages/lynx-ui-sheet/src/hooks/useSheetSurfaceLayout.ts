// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect, useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { useMotionValueRef, useMotionValueRefEvent } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import type { SheetLayoutRect } from '../context'
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
  allowOverDrag: boolean
  sheetSizeMTRef: MainThreadRef<number>
  movingSurfaceMTRef?: MainThreadRef<MainThread.Element | null>
  maxSnapSize: number
  hasFitSnapPoint: boolean
  onFitBodyLayoutMT?: (height: number) => void
  footerHeightMTRef?: MainThreadRef<number>
  initialSize: (index: number) => number
  initialSnap: number
  snapAnimation: SheetTransition
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

function resolveBodyLayout(
  rect: SheetLayoutRect,
  viewportWidth: number,
  viewportHeight: number,
  insets: NonNullable<SheetBodyProps['viewportInsets']>,
) {
  'main thread'
  const left = viewportOverlap(insets.left, rect.left, rect.width)
  const top = viewportOverlap(insets.top, rect.top, rect.height)
  return {
    left,
    top,
    right: viewportOverlap(
      insets.right,
      viewportWidth - rect.left - rect.width,
      rect.width - left,
    ),
    bottom: viewportOverlap(
      insets.bottom,
      viewportHeight - rect.top - rect.height,
      rect.height - top,
    ),
  }
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
  allowOverDrag,
  sheetSizeMTRef,
  movingSurfaceMTRef,
  maxSnapSize,
  hasFitSnapPoint,
  onFitBodyLayoutMT,
  footerHeightMTRef,
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
  const cornerRadius = panelLayout?.bottomCornerRadius
  const paintClipped = isBottom && cornerRadius !== undefined
  const radius = cornerRadius !== undefined && Number.isFinite(cornerRadius)
    ? Math.max(0, cornerRadius)
    : 0
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const intrinsic = isBottom && hasFitSnapPoint
  const surfaceOriginMTRef = useMainThreadRef({ left: 0, top: 0 })
  const bodyRangeMTRef = useMainThreadRef<
    { start: number, size: number } | null
  >(null)
  const bodyMTRef = useMainThreadRef<{
    element: MainThread.Element | null
    insets: SheetBodyProps['viewportInsets']
    outer: SheetLayoutRect
    parent: Partial<SheetLayoutRect>
    applied: string
    translatedTop: number | null
    slot: MainThread.Element | null
    natural: { width: number, height: number } | null
    expectedWidth: number
    fitWidth: number
    fitScreenWidth: number
    reservedHeight: number
    parentHeightBeforeReservation: number
    waitingForParent: boolean
    reportedHeight: number
  }>({
    element: null,
    insets: undefined,
    outer: { left: 0, top: 0, width: -1, height: -1 },
    parent: {},
    applied: '',
    translatedTop: null,
    slot: null,
    natural: null,
    expectedWidth: -1,
    fitWidth: -1,
    fitScreenWidth: screenWidth,
    reservedHeight: 0,
    parentHeightBeforeReservation: -1,
    waitingForParent: false,
    reportedHeight: -1,
  })
  const clipMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const surfaceMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const viewportMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const surfaceStylesMTRef = useMainThreadRef({
    clipBottom: '',
    surfaceTop: '',
    surfaceHeight: '',
    surfaceMask: '',
    translation: '',
    viewportHeight: '',
  })
  const panelHeightMTRef = useMainThreadRef(0)
  const appearanceMTRef = useMainThreadRef({
    inset,
    coverage,
    radius,
    fromInset: inset,
    fromCoverage: coverage,
    toInset: inset,
    toCoverage: coverage,
    fromRadius: radius,
    toRadius: radius,
  })
  const progress = useMotionValueRef(1)
  const animation = useSheetAnimation(progress, snapAnimation)
  const animateAppearanceMT = animation.animateToMT
  const stopAppearanceMT = animation.stopAnimationMT

  function reportFitBodyLayoutMT(allowStableParent = false) {
    'main thread'
    const body = bodyMTRef.current
    const { slot, outer, natural, expectedWidth, reservedHeight, parent } = body
    if (
      !slot || !body.element || outer.width < 0 || !natural
      || parent.height === undefined
      || Math.abs(natural.width - expectedWidth) > 1
      || Math.abs(expectedWidth - body.fitWidth) > 1
      || Math.abs(outer.height - reservedHeight) > 1
    ) return
    if (
      !allowStableParent && parent.height === body.parentHeightBeforeReservation
    ) {
      // A fixed or clamped parent may never report a height change. Give any
      // pending parent layout callback a chance to arrive after the slot's.
      if (!body.waitingForParent) {
        body.waitingForParent = true
        requestAnimationFrame(() => {
          'main thread'
          bodyMTRef.current.waitingForParent = false
          reportFitBodyLayoutMT(true)
        })
      }
      return
    }
    if (body.reportedHeight === parent.height) return
    body.reportedHeight = parent.height
    onFitBodyLayoutMT?.(parent.height)
  }

  function applyBodyLayoutMT(nextRange?: { start: number, size: number }) {
    'main thread'
    const range = nextRange ?? bodyRangeMTRef.current
    const body = bodyMTRef.current
    const { element, outer, insets, applied, parent } = body
    if ((!range && !intrinsic) || !element || outer.width < 0 || !insets) return
    // Remove the shared pre-transform layout origin before applying motion.
    const surface = surfaceOriginMTRef.current
    if (!parent.width || parent.height === undefined) return
    const start = range?.start ?? 0
    const size = range?.size ?? outer.height
    const left = horizontal
      ? start + outer.left - (parent.left ?? 0)
      : surface.left + outer.left - (parent.left ?? 0)
    const top = horizontal
      ? surface.top + outer.top - (parent.top ?? 0)
      : start + outer.top - (parent.top ?? 0)
    const width = horizontal
      ? Math.max(0, size - parent.width + outer.width)
      : outer.width
    const height = horizontal
      ? outer.height
      : Math.max(0, size - parent.height + outer.height)
    const offsets = resolveBodyLayout(
      { left, top, width, height },
      screenWidth,
      screenHeight,
      insets,
    )
    if (intrinsic) {
      const natural = body.natural
      body.expectedWidth = width - offsets.left - offsets.right
      const compactWidth = Math.abs(body.expectedWidth - body.fitWidth) <= 1
      if (
        body.slot && natural
        && Math.abs(natural.width - body.expectedWidth) <= 1
        && (body.fitWidth < 0 || compactWidth
          || body.fitScreenWidth !== screenWidth)
      ) {
        if (!compactWidth) {
          // Reuse the compact width across consumer-owned surface animations.
          // A new local viewport can establish a new compact measurement.
          body.fitWidth = body.expectedWidth
          body.fitScreenWidth = screenWidth
        }
        if (Math.abs(natural.height - body.reservedHeight) > 0.01) {
          body.reservedHeight = natural.height
          body.parentHeightBeforeReservation = parent.height
          body.slot.setStyleProperties({ height: `${natural.height}px` })
        }
      }

      // Vary the clipping viewport independently of the in-flow slot height.
      const topOffset = range ? offsets.top : 0
      const heightStyle = range
        ? `${Math.max(0, height - topOffset - offsets.bottom)}px`
        : 'auto'
      const key = `${offsets.left}/${offsets.right}/${heightStyle}`
      const layoutChanged = key !== applied
      const positionChanged = topOffset !== body.translatedTop
      if (layoutChanged || positionChanged) {
        const style: Record<string, string> = {}
        if (layoutChanged) {
          style.left = `${offsets.left}px`
          style.right = `${offsets.right}px`
          style.height = heightStyle
        }
        if (positionChanged) style.transform = `translateY(${topOffset}px)`
        body.applied = key
        body.translatedTop = topOffset
        element.setStyleProperties(style)
      }
      reportFitBodyLayoutMT()
      return
    }
    const key =
      `${offsets.left}/${offsets.top}/${offsets.right}/${offsets.bottom}`
    if (key === applied) return
    bodyMTRef.current.applied = key
    element.setStyleProperties({
      left: `${offsets.left}px`,
      top: `${offsets.top}px`,
      right: `${offsets.right}px`,
      bottom: `${offsets.bottom}px`,
    })
  }

  function updateBodyRangeMT(start: number, size: number) {
    'main thread'
    if (hasFitSnapPoint && !intrinsic) return
    const range = { start, size }
    bodyRangeMTRef.current = range
    applyBodyLayoutMT(range)
  }

  function updateSurfaceMT() {
    'main thread'
    const motion = position.current
    if (!motion) return
    const value = Math.max(0, motion.get())
    if (horizontal) {
      const opened = Math.max(sheetSizeMTRef.current, maxSnapSize)
      const extent = allowOverDrag ? value : Math.min(value, opened)
      updateBodyRangeMT(
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
    const clipInset = effectiveInset * (paintClipped ? 1 : appearance.coverage)
    const surfaceTop = screenHeight - value - effectiveInset
    // Keep a bounded panel's top inside the viewport without losing its gap.
    const correction = isBottom
      ? Math.min(height, Math.max(0, -surfaceTop)) * (1 - appearance.coverage)
      : 0
    const visibleHeight = height - correction
    const applied = surfaceStylesMTRef.current
    const clipBottom = `${clipInset}px`
    const clip = clipMTRef.current
    if (clip && applied.clipBottom !== clipBottom) {
      applied.clipBottom = clipBottom
      clip.setStyleProperties({ bottom: clipBottom })
    }
    const surface = surfaceMTRef.current
    const topOffset = clipInset - effectiveInset + correction
    const translation = `translate(0px, ${
      resolvedSide === 'top'
        ? motion.get()
        : -motion.get() + (paintClipped ? topOffset : 0)
    }px)`
    const movingSurface = movingSurfaceMTRef?.current
    if (movingSurface && applied.translation !== translation) {
      applied.translation = translation
      movingSurface.setStyleProperties({ transform: translation })
    }
    const top = `${paintClipped ? 0 : topOffset}px`
    const paintHeight = paintClipped
      ? screenHeight * 1.5
      : Math.max(visibleHeight, screenHeight * 1.5 * appearance.coverage)
    const surfaceHeight = `${paintHeight}px`
    const clippedBottom = Math.max(0, paintHeight - visibleHeight)
    const bottomRadius = Math.min(appearance.radius, visibleHeight / 2)
    const mask = paintClipped
      ? `inset(0px 0px ${clippedBottom}px 0px round 0px 0px ${bottomRadius}px ${bottomRadius}px)`
      : ''
    const topChanged = applied.surfaceTop !== top
    const heightChanged = applied.surfaceHeight !== surfaceHeight
    const maskChanged = applied.surfaceMask !== mask
    if (surface && (topChanged || heightChanged || maskChanged)) {
      applied.surfaceTop = top
      applied.surfaceHeight = surfaceHeight
      applied.surfaceMask = mask
      surface.setStyleProperties({
        ...(topChanged ? { top } : {}),
        ...(heightChanged ? { height: surfaceHeight } : {}),
        ...(maskChanged ? { 'clip-path': mask || 'none' } : {}),
      })
    }
    if (!hasFitSnapPoint) {
      const contentHeight = paintClipped
        ? Math.min(maxSnapSize, Math.max(0, screenHeight - inset))
        : visibleHeight
          + (Math.max(maxSnapSize, visibleHeight) - visibleHeight)
            * appearance.coverage
      const viewport = viewportMTRef.current
      const viewportHeight = `${contentHeight}px`
      if (viewport && applied.viewportHeight !== viewportHeight) {
        applied.viewportHeight = viewportHeight
        viewport.setStyleProperties({ height: viewportHeight })
      }
      updateBodyRangeMT(
        isBottom ? surfaceTop + correction : value - contentHeight,
        contentHeight,
      )
    } else if (intrinsic && bodyMTRef.current.slot) {
      updateBodyRangeMT(
        surfaceTop + correction,
        Math.max(
          0,
          visibleHeight - Math.max(0, footerHeightMTRef?.current ?? 0),
        ),
      )
    }
  }

  function measureSurfaceMT(event: MainThread.LayoutChangeEvent) {
    'main thread'
    const { left, top } = event.detail ?? event.params
    const previous = surfaceOriginMTRef.current
    if (previous.left === left && previous.top === top) return
    surfaceOriginMTRef.current = { left, top }
    applyBodyLayoutMT()
  }

  function measureBodyParentMT(rect?: Partial<SheetLayoutRect>) {
    'main thread'
    if (!rect) return
    const parent = bodyMTRef.current.parent
    parent.left = rect.left ?? parent.left
    parent.top = rect.top ?? parent.top
    parent.width = rect.width ?? parent.width
    parent.height = rect.height ?? parent.height
    applyBodyLayoutMT()
  }

  function measureBodyMT(
    { left = 0, top = 0, width = 0, height = 0 }: Partial<SheetLayoutRect>,
  ) {
    'main thread'
    const outer = bodyMTRef.current.outer
    outer.left = left
    outer.top = top
    outer.width = width
    outer.height = height
    applyBodyLayoutMT()
  }

  function setBodyMTRef(
    element: MainThread.Element | null,
    insets: SheetBodyProps['viewportInsets'],
  ) {
    'main thread'
    const body = bodyMTRef.current
    if (body.element !== element) body.reportedHeight = -1
    if (
      body.insets?.left !== insets?.left || body.insets?.right !== insets?.right
    ) {
      body.fitWidth = -1
    }
    body.element = element
    body.insets = insets
    body.applied = ''
    body.translatedTop = null
    if (element) applyBodyLayoutMT()
  }

  function setBodySlotMTRef(element: MainThread.Element | null) {
    'main thread'
    const body = bodyMTRef.current
    if (body.slot === element) return
    body.slot = element
    if (element) {
      // First-screen hydration can reattach the same slot without new layout events.
      if (body.reservedHeight > 0) {
        element.setStyleProperties({ height: `${body.reservedHeight}px` })
      }
      updateSurfaceMT()
    }
  }

  function measureIntrinsicBodyMT(
    { width = 0, height = 0 }: Partial<SheetLayoutRect>,
  ) {
    'main thread'
    bodyMTRef.current.natural = { width, height }
    applyBodyLayoutMT()
  }

  function hasFitBodyMT() {
    'main thread'
    return intrinsic && bodyMTRef.current.slot !== null
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
    appearance.radius = appearance.fromRadius
      + (appearance.toRadius - appearance.fromRadius) * p
    updateSurfaceMT()
  })

  function configureSurfaceMT(
    nextInset: number,
    nextCoverage: number,
    nextRadius: number,
  ) {
    'main thread'
    const appearance = appearanceMTRef.current
    if (
      appearance.toInset === nextInset && appearance.toCoverage === nextCoverage
      && appearance.toRadius === nextRadius
    ) {
      updateSurfaceMT()
      return
    }
    stopAppearanceMT()
    appearance.fromInset = appearance.inset
    appearance.fromCoverage = appearance.coverage
    appearance.fromRadius = appearance.radius
    appearance.toInset = nextInset
    appearance.toCoverage = nextCoverage
    appearance.toRadius = nextRadius
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
    runOnMainThread(configureSurfaceMT)(inset, coverage, radius)
  }, [
    inset,
    coverage,
    paintClipped,
    radius,
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
    surfaceStylesMTRef.current.surfaceTop = ''
    surfaceStylesMTRef.current.surfaceHeight = ''
    if (paintClipped) surfaceStylesMTRef.current.surfaceMask = ''
    if (element) updateSurfaceMT()
  }

  function setSheetMTRef(element: MainThread.Element | null) {
    'main thread'
    if (!movingSurfaceMTRef) return
    movingSurfaceMTRef.current = element
    surfaceStylesMTRef.current.translation = ''
    if (element) updateSurfaceMT()
  }

  function setViewportMTRef(element: MainThread.Element) {
    'main thread'
    viewportMTRef.current = element
    surfaceStylesMTRef.current.viewportHeight = ''
    updateSurfaceMT()
  }

  function setClipMTRef(element: MainThread.Element) {
    'main thread'
    clipMTRef.current = element
    surfaceStylesMTRef.current.clipBottom = ''
    updateSurfaceMT()
  }

  return {
    setSheetMTRef,
    setClipMTRef,
    setSurfaceMTRef,
    setViewportMTRef,
    measureBodyParentMT,
    measureSurfaceMT,
    hasFitBodyMT,
    updateSurfaceMT,
    bodyContext: {
      enabled: !hasFitSnapPoint || intrinsic,
      intrinsic,
      setBodySlotMTRef,
      measureIntrinsicBodyMT,
      setBodyMTRef,
      measureBodyMT,
    },
  }
}
