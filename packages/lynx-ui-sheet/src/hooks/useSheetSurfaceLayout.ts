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
  cornerRadius?: SheetContentProps['cornerRadius']
  panelLayout?: SheetContentProps['panelLayout']
  surfaceStyle?: SheetContentProps['style']
  screenHeight: number
  screenWidth: number
  allowOverDrag: boolean
  sheetSizeMTRef: MainThreadRef<number>
  movingSurfaceMTRef?: MainThreadRef<MainThread.Element | null>
  maxSnapSize: number
  hasFitSnapPoint: boolean
  onFitBodyLayoutMT?: (height: number) => void
  footerHeightMTRef?: MainThreadRef<number>
  updateFooterPositionMT?: (visibleHeight: number) => void
  initialSize: (index: number) => number
  initialSnap: number
  snapAnimation: SheetTransition
}

type CornerRadii = [
  topLeft: number | null,
  topRight: number | null,
  bottomRight: number | null,
  bottomLeft: number | null,
]

function normalizeCornerRadius(radius: number | undefined) {
  return radius !== undefined && Number.isFinite(radius)
    ? Math.max(0, radius)
    : null
}

function styleLength(value: string | number | undefined) {
  return typeof value === 'number' ? `${value}px` : value
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

export function resolveBottomGap(gap: number | undefined) {
  return gap !== undefined && Number.isFinite(gap) ? Math.max(0, gap) : 0
}

// Separate background coverage from movement and intrinsic content measurement.
export function useSheetSurfaceLayout({
  position,
  animateChanges,
  presence,
  resolvedSide,
  cornerRadius,
  panelLayout,
  surfaceStyle,
  screenHeight,
  screenWidth,
  allowOverDrag,
  sheetSizeMTRef,
  movingSurfaceMTRef,
  maxSnapSize,
  hasFitSnapPoint,
  onFitBodyLayoutMT,
  footerHeightMTRef,
  updateFooterPositionMT,
  initialSize,
  initialSnap,
  snapAnimation,
}: SheetSurfaceLayoutOptions) {
  const isBottom = resolvedSide === 'bottom'
  const inset = isBottom ? resolveBottomGap(panelLayout?.bottomGap) : 0
  const coverage = isBottom && panelLayout ? 0 : 1
  const scalar = typeof cornerRadius === 'number' ? cornerRadius : undefined
  const corners = typeof cornerRadius === 'object' ? cornerRadius : undefined
  const topLeft = normalizeCornerRadius(corners?.topLeft ?? scalar)
  const topRight = normalizeCornerRadius(corners?.topRight ?? scalar)
  const bottomRight = normalizeCornerRadius(corners?.bottomRight ?? scalar)
  const bottomLeft = normalizeCornerRadius(corners?.bottomLeft ?? scalar)
  const radii: CornerRadii = [topLeft, topRight, bottomRight, bottomLeft]
  const borderRadius = styleLength(surfaceStyle?.borderRadius)
  const inlineTopLeft = styleLength(surfaceStyle?.borderTopLeftRadius)
  const inlineTopRight = styleLength(surfaceStyle?.borderTopRightRadius)
  const inlineBottomRight = styleLength(surfaceStyle?.borderBottomRightRadius)
  const inlineBottomLeft = styleLength(surfaceStyle?.borderBottomLeftRadius)
  const inlineCorners = [
    inlineTopLeft,
    inlineTopRight,
    inlineBottomRight,
    inlineBottomLeft,
  ]
  // Size content to the largest visible snap. A gap change can update this
  // bound once, without resizing content on every animation frame.
  const contentHeight = coverage === 0
    ? Math.min(maxSnapSize, Math.max(0, screenHeight - inset))
    : maxSnapSize
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const intrinsic = isBottom && hasFitSnapPoint
  const surfaceOriginMTRef = useMainThreadRef({ left: 0, top: 0 })
  const bodyRangeMTRef = useMainThreadRef<
    { start: number, size: number } | null
  >(null)
  const bodyMTRef = useMainThreadRef<{
    element: MainThread.Element | null
    clip: MainThread.Element | null
    insets: SheetBodyProps['viewportInsets']
    outer: SheetLayoutRect
    parent: Partial<SheetLayoutRect>
    appliedHorizontal: string
    appliedVertical: string
    translatedTop: number | null
    clipHeight: number | null
    clipTop: number | null
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
    clip: null,
    insets: undefined,
    outer: { left: 0, top: 0, width: -1, height: -1 },
    parent: {},
    appliedHorizontal: '',
    appliedVertical: '',
    translatedTop: null,
    clipHeight: null,
    clipTop: null,
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
  const appliedRadiiMTRef = useMainThreadRef<CornerRadii | null>(null)
  const viewportMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const surfaceStylesMTRef = useMainThreadRef({
    clipBottom: '',
    surfaceHeight: '',
    surfaceMask: '',
    translation: '',
    viewportHeight: '',
  })
  const panelHeightMTRef = useMainThreadRef(0)
  const appearanceMTRef = useMainThreadRef({
    inset,
    coverage,
    radii,
    fromInset: inset,
    fromCoverage: coverage,
    toInset: inset,
    toCoverage: coverage,
    fromRadii: radii,
    toRadii: radii,
  })
  const progress = useMotionValueRef(1)
  const animation = useSheetAnimation(progress, snapAnimation)
  const animateAppearanceMT = animation.animateToMT
  const stopAppearanceMT = animation.stopAnimationMT

  function updateSurfaceCornersMT(reapply = false) {
    'main thread'
    const surface = surfaceMTRef.current
    const radii = appearanceMTRef.current.radii
    const previous = appliedRadiiMTRef.current
    if (!surface || (!reapply && previous === radii)) return
    // Use plain iteration for native engines with a smaller Array API.
    const keys = [
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-right-radius',
      'border-bottom-left-radius',
    ]
    let restoreShorthand = false
    if (borderRadius != null && previous) {
      for (let index = 0; index < radii.length; index++) {
        if (radii[index] === null && previous[index] !== null) {
          restoreShorthand = true
          break
        }
      }
    }
    const styles: Record<string, string | null> = {}
    if (restoreShorthand && borderRadius != null) {
      styles['border-radius'] = borderRadius
    }
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index]
      const radius = radii[index]
      if (radius !== null) {
        if (reapply || restoreShorthand || radius !== previous?.[index]) {
          styles[key] = `${radius}px`
        }
      } else if (restoreShorthand) {
        const inline = inlineCorners[index]
        if (inline != null) styles[key] = inline
      } else if (previous?.[index] != null) {
        styles[key] = inlineCorners[index] ?? null
      }
    }
    appliedRadiiMTRef.current = radii
    if (Object.keys(styles).length > 0) {
      // The runtime accepts null to remove an inline value and restore the
      // stylesheet cascade. The public worklet declaration only lists strings.
      surface.setStyleProperties(styles as Record<string, string>)
    }
  }

  function reportFitBodyLayoutMT(allowStableParent = false) {
    'main thread'
    const body = bodyMTRef.current
    const { slot, outer, expectedWidth, fitWidth, reservedHeight, parent } =
      body
    if (
      !slot || !body.element || outer.width < 0 || fitWidth < 0
      || parent.height === undefined
      || Math.abs(expectedWidth - fitWidth) > 1
      || Math.abs(outer.height - reservedHeight) > 1
      || body.reportedHeight === parent.height
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
    body.reportedHeight = parent.height
    onFitBodyLayoutMT?.(parent.height)
  }

  function writeBodyLayoutMT(
    element: MainThread.Element,
    horizontalKey: string,
    horizontalStyle: { left: string, right: string } | undefined,
    verticalStyle: Record<string, string> | undefined,
  ) {
    'main thread'
    const body = bodyMTRef.current
    if (!horizontalStyle && !verticalStyle) return
    if (
      horizontalStyle && !animateChanges.current
      && (!intrinsic || body.fitWidth >= 0)
    ) {
      // An immediate snap can change the consumer's width in this layout pass.
      // Apply the horizontal styles once the new width is committed. Keep the
      // first fit measurement synchronous with its initial layout. A ref
      // can reattach after a React commit without losing its measured width.
      requestAnimationFrame(() => {
        'main thread'
        const current = bodyMTRef.current
        if (
          current.element === element
          && current.appliedHorizontal === horizontalKey
        ) {
          element.setStyleProperties(horizontalStyle)
        }
      })
      if (verticalStyle) element.setStyleProperties(verticalStyle)
      return
    }
    element.setStyleProperties({ ...horizontalStyle, ...verticalStyle })
  }

  function applyBodyLayoutMT(nextRange?: { start: number, size: number }) {
    'main thread'
    const range = nextRange ?? bodyRangeMTRef.current
    const body = bodyMTRef.current
    const { element, outer, insets, parent } = body
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
    const horizontalKey = `${offsets.left}/${offsets.right}`
    const horizontalChanged = horizontalKey !== body.appliedHorizontal
    const horizontalStyle = horizontalChanged
      ? { left: `${offsets.left}px`, right: `${offsets.right}px` }
      : undefined
    body.appliedHorizontal = horizontalKey
    if (intrinsic) {
      const natural = body.natural
      body.expectedWidth = width - offsets.left - offsets.right
      const measuredAtWidth = natural !== null
        && Math.abs(natural.width - body.expectedWidth) <= 1
      const compactWidth = Math.abs(body.expectedWidth - body.fitWidth) <= 1
      if (
        body.slot && measuredAtWidth
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
    }
    if (isBottom) {
      const footer = intrinsic
        ? Math.max(0, footerHeightMTRef?.current ?? 0)
        : 0
      const panelBottom = screenHeight - inset
      const panelHeight = Math.max(
        0,
        Math.min(
          panelBottom,
          Math.max(maxSnapSize, intrinsic ? parent.height + footer : 0),
        ),
      )
      const settledTop = panelBottom - panelHeight + outer.top
        - (parent.top ?? 0)
      const settledHeight = Math.max(
        0,
        panelHeight - footer - parent.height + outer.height,
      )
      const topInset = viewportOverlap(insets.top, settledTop, settledHeight)
      const bottomInset = viewportOverlap(
        insets.bottom,
        screenHeight - settledTop - settledHeight,
        settledHeight - topInset,
      )
      const viewportHeight = settledHeight - topInset - bottomInset
      const visibleHeight = Math.min(
        viewportHeight,
        height - offsets.top - offsets.bottom,
      )
      // Align the clip's bottom edge with the visible body. Counter-translate
      // its child so the content still starts at the current safe top edge.
      const bodyTop = viewportHeight - visibleHeight
      const clipTop = offsets.top - bodyTop
      const clip = body.clip
      if (
        clip && (body.clipHeight !== viewportHeight || body.clipTop !== clipTop)
      ) {
        const heightChanged = body.clipHeight !== viewportHeight
        const positionChanged = body.clipTop !== clipTop
        body.clipHeight = viewportHeight
        body.clipTop = clipTop
        clip.setStyleProperties({
          ...(heightChanged ? { height: `${viewportHeight}px` } : {}),
          ...(positionChanged ? { transform: `translateY(${clipTop}px)` } : {}),
        })
      }
      const positionChanged = body.translatedTop !== bodyTop
      body.translatedTop = bodyTop
      writeBodyLayoutMT(
        element,
        horizontalKey,
        horizontalStyle,
        positionChanged
          ? { transform: `translateY(${bodyTop}px)` }
          : undefined,
      )
      if (intrinsic) reportFitBodyLayoutMT()
      return
    }
    const verticalKey = `${offsets.top}/${offsets.bottom}`
    const verticalChanged = verticalKey !== body.appliedVertical
    body.appliedVertical = verticalKey
    writeBodyLayoutMT(
      element,
      horizontalKey,
      horizontalStyle,
      verticalChanged
        ? { top: `${offsets.top}px`, bottom: `${offsets.bottom}px` }
        : undefined,
    )
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
    const surfaceTop = screenHeight - value - effectiveInset
    // Keep a bounded panel's top inside the viewport without losing its gap.
    const correction = isBottom
      ? Math.min(height, Math.max(0, -surfaceTop)) * (1 - appearance.coverage)
      : 0
    const visibleHeight = height - correction
    if (isBottom) updateFooterPositionMT?.(value - correction)
    const applied = surfaceStylesMTRef.current
    const clip = clipMTRef.current
    const clipBottom = `${effectiveInset}px`
    // A paint clip can leave its native hit area active. Also keep the outer
    // viewport above the gap so touches there can reach the backdrop.
    if (clip && applied.clipBottom !== clipBottom) {
      applied.clipBottom = clipBottom
      clip.setStyleProperties({ bottom: clipBottom })
    }
    const translation = `translate(0px, ${
      resolvedSide === 'top'
        ? motion.get()
        : -motion.get() + correction
    }px)`
    const movingSurface = movingSurfaceMTRef?.current
    if (movingSurface && applied.translation !== translation) {
      applied.translation = translation
      movingSurface.setStyleProperties({ transform: translation })
    }
    const surface = surfaceMTRef.current
    const paintHeight = Math.max(
      screenHeight * 1.5,
      maxSnapSize,
      sheetSizeMTRef.current,
    )
    const surfaceHeight = `${paintHeight}px`
    const clippedBottom = Math.max(0, paintHeight - visibleHeight)
      * (1 - appearance.coverage)
    const bottomRight = Math.min(appearance.radii[2] ?? 0, visibleHeight / 2)
    const bottomLeft = Math.min(appearance.radii[3] ?? 0, visibleHeight / 2)
    const mask = appearance.coverage < 1
      ? `inset(0px 0px ${clippedBottom}px 0px round 0px 0px ${bottomRight}px ${bottomLeft}px)`
      : ''
    const heightChanged = applied.surfaceHeight !== surfaceHeight
    const maskChanged = applied.surfaceMask !== mask
    if (surface && (heightChanged || maskChanged)) {
      applied.surfaceHeight = surfaceHeight
      applied.surfaceMask = mask
      surface.setStyleProperties({
        ...(heightChanged ? { height: surfaceHeight } : {}),
        ...(maskChanged ? { 'clip-path': mask || 'none' } : {}),
      })
    }
    if (!hasFitSnapPoint) {
      const viewport = viewportMTRef.current
      const viewportHeight = `${contentHeight}px`
      if (viewport && applied.viewportHeight !== viewportHeight) {
        applied.viewportHeight = viewportHeight
        viewport.setStyleProperties({ height: viewportHeight })
      }
      updateBodyRangeMT(
        isBottom ? surfaceTop + correction : value - contentHeight,
        isBottom ? visibleHeight : contentHeight,
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
    const sameWidthInsets = body.insets?.left === insets?.left
      && body.insets?.right === insets?.right
    if (
      body.element === element && sameWidthInsets
      && body.insets?.top === insets?.top
      && body.insets?.bottom === insets?.bottom
    ) return
    if (body.element !== element) {
      body.reportedHeight = -1
      body.appliedHorizontal = ''
      body.appliedVertical = ''
      body.translatedTop = null
    }
    if (!sameWidthInsets) body.fitWidth = -1
    body.element = element
    body.insets = insets
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

  function setBodyClipMTRef(element: MainThread.Element | null) {
    'main thread'
    const body = bodyMTRef.current
    body.clip = element
    body.clipHeight = null
    body.clipTop = null
    if (element) applyBodyLayoutMT()
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
    const nextRadii: CornerRadii = [null, null, null, null]
    for (let index = 0; index < nextRadii.length; index++) {
      const target = appearance.toRadii[index]
      const start = appearance.fromRadii[index]
      nextRadii[index] = target === null || start === null
        ? target
        : start + (target - start) * p
    }
    appearance.radii = nextRadii
    updateSurfaceCornersMT()
    updateSurfaceMT()
  })

  function configureSurfaceMT(
    nextInset: number,
    nextCoverage: number,
    nextRadii: CornerRadii,
  ) {
    'main thread'
    const appearance = appearanceMTRef.current
    const [topLeft, topRight, bottomRight, bottomLeft] = appearance.toRadii
    if (
      appearance.toInset === nextInset && appearance.toCoverage === nextCoverage
      && topLeft === nextRadii[0] && topRight === nextRadii[1]
      && bottomRight === nextRadii[2] && bottomLeft === nextRadii[3]
    ) {
      updateSurfaceCornersMT(true)
      updateSurfaceMT()
      return
    }
    stopAppearanceMT()
    appearance.fromInset = appearance.inset
    appearance.fromCoverage = appearance.coverage
    appearance.fromRadii = appearance.radii
    appearance.toInset = nextInset
    appearance.toCoverage = nextCoverage
    appearance.toRadii = nextRadii
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
    runOnMainThread(configureSurfaceMT)(inset, coverage, [
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
    ])
  }, [
    inset,
    coverage,
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
    borderRadius,
    inlineTopLeft,
    inlineTopRight,
    inlineBottomRight,
    inlineBottomLeft,
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
    appliedRadiiMTRef.current = null
    surfaceStylesMTRef.current.surfaceHeight = ''
    surfaceStylesMTRef.current.surfaceMask = ''
    if (element) {
      updateSurfaceCornersMT()
      updateSurfaceMT()
    }
  }

  function setSheetMTRef(element: MainThread.Element | null) {
    'main thread'
    if (!movingSurfaceMTRef) return
    movingSurfaceMTRef.current = element
    if (horizontal) {
      surfaceMTRef.current = element
      appliedRadiiMTRef.current = null
      if (element) updateSurfaceCornersMT()
    }
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
      setBodyClipMTRef: isBottom ? setBodyClipMTRef : undefined,
      setBodySlotMTRef,
      measureIntrinsicBodyMT,
      setBodyMTRef,
      measureBodyMT,
    },
  }
}
