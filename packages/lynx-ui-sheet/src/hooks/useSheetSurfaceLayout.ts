// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect, useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { useMotionValueRefEvent } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import type {
  SheetContentProps,
  SheetCornerRadius,
  SheetInsets,
} from '../types'
import type { SheetResolvedSide } from '../utils'
import { useSheetBodyInsets } from './useSheetBodyInsets'
import {
  applySurfaceCornersMT,
  extractInlineCornerStyles,
  normalizeCornerRadii,
  normalizeCornerRadiiMT,
} from './useSheetCornerStyle'
import type { CornerRadii } from './useSheetCornerStyle'

interface SheetSurfaceLayoutOptions {
  position: MainThreadRef<MotionValue<number>>
  presence: MainThreadRef<PresenceState>
  resolvedSide: SheetResolvedSide
  enableRTL: boolean
  cornerRadius?: SheetCornerRadius
  insets?: SheetInsets
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
  hasController?: boolean
  settleCallbackMTRef?: MainThreadRef<(() => void) | null>
}

export function normalizeInset(value: number | undefined) {
  return value !== undefined && Number.isFinite(value)
    ? Math.max(0, value)
    : 0
}

function normalizeInsetMT(value: number | undefined) {
  'main thread'
  return value !== undefined && Number.isFinite(value)
    ? Math.max(0, value)
    : 0
}

/**
 * Own painted surface geometry, clip-path, corner styles, SheetBody safe-area
 * clamping, and the stateless main-thread SheetSurfaceController.
 */
export function useSheetSurfaceLayout({
  position,
  presence,
  resolvedSide,
  enableRTL,
  cornerRadius,
  insets,
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
  hasController = false,
  settleCallbackMTRef,
}: SheetSurfaceLayoutOptions) {
  const isBottom = resolvedSide === 'bottom'
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const propTop = normalizeInset(insets?.top)
  const propRight = normalizeInset(insets?.right)
  const propBottom = normalizeInset(insets?.bottom)
  const propLeft = normalizeInset(insets?.left)
  const propHasHorizontal = !horizontal
    && (insets?.left !== undefined || insets?.right !== undefined)
  const propRadii = normalizeCornerRadii(cornerRadius)
  const [propTL, propTR, propBR, propBL] = propRadii
  const inlineCornerStyles = extractInlineCornerStyles(surfaceStyle)
  const inlineBorderRadius = inlineCornerStyles.borderRadius
  const [inlineTL, inlineTR, inlineBR, inlineBL] = inlineCornerStyles.corners

  const clipMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const surfaceMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const viewportMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const appliedRadiiMTRef = useMainThreadRef<CornerRadii | null>(null)
  const panelHeightMTRef = useMainThreadRef(0)
  const horizontalOverrideMTRef = useMainThreadRef<
    { left: number, width: number } | null
  >(
    propHasHorizontal
      ? {
        left: propLeft,
        width: Math.max(0, screenWidth - propLeft - propRight),
      }
      : null,
  )
  const geometryMTRef = useMainThreadRef({
    top: propTop,
    right: propRight,
    bottom: propBottom,
    left: propLeft,
    hasHorizontal: propHasHorizontal,
    radii: propRadii,
    // Keep settledBottom separate from animated bottom so viewport height and
    // clipMTRef.bottom never resize per-frame during motion.
    settledBottom: hasController ? 0 : propBottom,
    clipBottomApplied: 0,
  })
  const surfaceStylesMTRef = useMainThreadRef({
    clipBottom: '',
    surfaceHeight: '',
    surfaceWidth: '',
    surfaceLeft: '',
    surfaceMask: '',
    translation: '',
    viewportHeight: '',
  })

  function getBottomInsetMT() {
    'main thread'
    return geometryMTRef.current.settledBottom
  }

  function getTopInsetMT() {
    'main thread'
    return geometryMTRef.current.top
  }

  function getLeftInsetMT() {
    'main thread'
    return geometryMTRef.current.left
  }

  function getRightInsetMT() {
    'main thread'
    return geometryMTRef.current.right
  }

  function getSurfaceHorizontalOverrideMT() {
    'main thread'
    return horizontalOverrideMTRef.current
  }

  const bodyInsets = useSheetBodyInsets({
    resolvedSide,
    enableRTL,
    screenWidth,
    screenHeight,
    maxSnapSize,
    hasFitSnapPoint,
    getBottomInsetMT,
    getTopInsetMT,
    getLeftInsetMT,
    getRightInsetMT,
    getSurfaceHorizontalOverrideMT,
    footerHeightMTRef,
    onFitBodyLayoutMT,
  })

  function applyHorizontalFrameMT() {
    'main thread'
    if (horizontal) return
    const geo = geometryMTRef.current
    const surface = surfaceMTRef.current
    const applied = surfaceStylesMTRef.current
    if (!geo.hasHorizontal) {
      horizontalOverrideMTRef.current = null
      return
    }
    const left = geo.left
    const width = Math.max(0, screenWidth - left - geo.right)
    horizontalOverrideMTRef.current = { left, width }
    bodyInsets.syncSurfaceOriginLeftMT(left)
    const leftStyle = `${left}px`
    const widthStyle = `${width}px`
    if (
      surface
      && (applied.surfaceLeft !== leftStyle
        || applied.surfaceWidth !== widthStyle)
    ) {
      const styles: Record<string, string> = {}
      if (applied.surfaceLeft !== leftStyle) {
        applied.surfaceLeft = leftStyle
        styles.left = leftStyle
      }
      if (applied.surfaceWidth !== widthStyle) {
        applied.surfaceWidth = widthStyle
        styles.width = widthStyle
      }
      surface.setStyleProperties(styles)
    }
  }

  function updateCornersMT(reapply = false) {
    'main thread'
    appliedRadiiMTRef.current = applySurfaceCornersMT(
      surfaceMTRef.current,
      geometryMTRef.current.radii,
      appliedRadiiMTRef.current,
      inlineCornerStyles,
      reapply,
    )
  }

  function applyClipBottomMT(nextClipBottom: number) {
    'main thread'
    const geo = geometryMTRef.current
    geo.clipBottomApplied = nextClipBottom
    const clip = clipMTRef.current
    const applied = surfaceStylesMTRef.current
    const clipBottomStyle = `${nextClipBottom}px`
    if (clip && applied.clipBottom !== clipBottomStyle) {
      applied.clipBottom = clipBottomStyle
      clip.setStyleProperties({ bottom: clipBottomStyle })
    }
  }

  function updateSurfaceMT() {
    'main thread'
    if (settleCallbackMTRef) settleCallbackMTRef.current = settleSurfaceMT
    const motion = position.current
    if (!motion) return
    const value = Math.max(0, motion.get())
    if (horizontal) {
      const opened = Math.max(sheetSizeMTRef.current, maxSnapSize)
      const extent = allowOverDrag ? value : Math.min(value, opened)
      bodyInsets.updateBodyRangeMT(
        resolvedSide === 'right' ? screenWidth - extent : extent - maxSnapSize,
        maxSnapSize,
      )
      return
    }

    const geo = geometryMTRef.current
    const state = presence.current
    const entering = state === PresenceState.Entering
    const leaving = state === PresenceState.Leaving
      || state === PresenceState.Left
    const height = entering
      ? Math.max(value, initialSize(initialSnap), 0)
      : (leaving ? Math.max(panelHeightMTRef.current, value) : value)
    panelHeightMTRef.current = height

    // Entry and exit slide a complete card from beyond the screen edge without
    // resizing clipMTRef on every frame.
    const visibleFraction = entering || leaving
      ? (height > 0 ? Math.min(1, value / height) : 0)
      : 1
    const effectiveBottom = isBottom ? geo.bottom * visibleFraction : 0
    const hasBottomBound = isBottom
      && (geo.bottom > 0 || (geo.radii[2] ?? 0) > 0
        || (geo.radii[3] ?? 0) > 0)
    const surfaceTop = screenHeight - value - effectiveBottom
    // Keep a bounded panel's top inside the viewport without losing its gap.
    const correction = hasBottomBound
      ? Math.min(height, Math.max(0, -surfaceTop))
      : 0
    const visibleHeight = height - correction
    if (isBottom) updateFooterPositionMT?.(value - correction)

    // Keep clipMTRef.bottom fixed at 0 during enter/exit so layout never runs
    // per frame; compensate cleanly in movingSurface's translateY.
    if (isBottom && (entering || leaving) && geo.clipBottomApplied !== 0) {
      applyClipBottomMT(0)
    }

    const applied = surfaceStylesMTRef.current
    const translateY = resolvedSide === 'top'
      ? motion.get()
      : -motion.get() - (effectiveBottom - geo.clipBottomApplied) + correction
    const translation = `translate(0px, ${translateY}px)`
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
    const clippedBottom = hasBottomBound
      ? Math.max(0, paintHeight - visibleHeight)
      : 0
    const bottomRight = Math.min(geo.radii[2] ?? 0, visibleHeight / 2)
    const bottomLeft = Math.min(geo.radii[3] ?? 0, visibleHeight / 2)
    const mask = hasBottomBound
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
      const contentHeight = isBottom
        ? Math.min(maxSnapSize, Math.max(0, screenHeight - geo.settledBottom))
        : maxSnapSize
      const viewport = viewportMTRef.current
      const viewportHeight = `${contentHeight}px`
      if (viewport && applied.viewportHeight !== viewportHeight) {
        applied.viewportHeight = viewportHeight
        viewport.setStyleProperties({ height: viewportHeight })
      }
      bodyInsets.updateBodyRangeMT(
        isBottom ? surfaceTop + correction : value - contentHeight,
        isBottom ? visibleHeight : contentHeight,
      )
    } else if (bodyInsets.hasFitBodyMT()) {
      bodyInsets.updateBodyRangeMT(
        surfaceTop + correction,
        Math.max(
          0,
          visibleHeight - Math.max(0, footerHeightMTRef?.current ?? 0),
        ),
      )
    }
  }

  /**
   * Commit settled hit-test bottom bounds once motion finishes so backdrop
   * taps in the bottom gap pass through without causing per-frame layout.
   */
  function settleSurfaceMT() {
    'main thread'
    if (!isBottom) return
    const geo = geometryMTRef.current
    const nextSettled = presence.current === PresenceState.Entered
      ? geo.bottom
      : 0
    const changed = geo.settledBottom !== nextSettled
      || geo.clipBottomApplied !== nextSettled
    geo.settledBottom = nextSettled
    if (geo.clipBottomApplied !== nextSettled) {
      applyClipBottomMT(nextSettled)
    }
    if (changed) updateSurfaceMT()
  }

  function setInsetsMT(nextInsets: SheetInsets) {
    'main thread'
    const geo = geometryMTRef.current
    const nextTop = nextInsets.top === undefined
      ? geo.top
      : normalizeInsetMT(nextInsets.top)
    const nextRight = nextInsets.right === undefined
      ? geo.right
      : normalizeInsetMT(nextInsets.right)
    const nextBottom = nextInsets.bottom === undefined
      ? geo.bottom
      : normalizeInsetMT(nextInsets.bottom)
    const nextLeft = nextInsets.left === undefined
      ? geo.left
      : normalizeInsetMT(nextInsets.left)
    const nextHasHorizontal = !horizontal
      && (geo.hasHorizontal || nextInsets.left !== undefined
        || nextInsets.right !== undefined)
    if (
      geo.top === nextTop && geo.right === nextRight
      && geo.bottom === nextBottom && geo.left === nextLeft
      && geo.hasHorizontal === nextHasHorizontal
    ) return
    const bottomChanged = geo.bottom !== nextBottom
    geo.top = nextTop
    geo.right = nextRight
    geo.bottom = nextBottom
    geo.left = nextLeft
    geo.hasHorizontal = nextHasHorizontal
    // Drop clipMTRef.bottom to 0 once when bottom inset starts animating so
    // subsequent frames incur zero layout writes on clipMTRef.
    if (isBottom && bottomChanged && geo.clipBottomApplied !== 0) {
      applyClipBottomMT(0)
    }
    applyHorizontalFrameMT()
    updateSurfaceMT()
  }

  function setCornerRadiusMT(nextRadius: SheetCornerRadius | undefined) {
    'main thread'
    const radii = normalizeCornerRadiiMT(nextRadius)
    geometryMTRef.current.radii = radii
    updateCornersMT()
    updateSurfaceMT()
  }

  useMotionValueRefEvent(position, 'change', updateSurfaceMT)

  function syncPropsMT(
    nextTop: number,
    nextRight: number,
    nextBottom: number,
    nextLeft: number,
    nextHasHorizontal: boolean,
    nextRadii: CornerRadii,
  ) {
    'main thread'
    const geo = geometryMTRef.current
    geo.top = nextTop
    geo.right = nextRight
    geo.bottom = nextBottom
    geo.left = nextLeft
    geo.hasHorizontal = nextHasHorizontal
    geo.radii = nextRadii
    if (isBottom && presence.current === PresenceState.Entered) {
      geo.settledBottom = nextBottom
      applyClipBottomMT(nextBottom)
    } else if (isBottom && !hasController) {
      geo.settledBottom = nextBottom
    }
    applyHorizontalFrameMT()
    updateCornersMT(true)
    updateSurfaceMT()
  }

  useEffect(() => {
    runOnMainThread(syncPropsMT)(
      propTop,
      propRight,
      propBottom,
      propLeft,
      propHasHorizontal,
      [propTL, propTR, propBR, propBL],
    )
  }, [
    propTop,
    propRight,
    propBottom,
    propLeft,
    propHasHorizontal,
    propTL,
    propTR,
    propBR,
    propBL,
    inlineBorderRadius,
    inlineTL,
    inlineTR,
    inlineBR,
    inlineBL,
    screenHeight,
    screenWidth,
    maxSnapSize,
    hasFitSnapPoint,
    resolvedSide,
    hasController,
  ])

  function setSurfaceMTRef(element: MainThread.Element | null) {
    'main thread'
    surfaceMTRef.current = element
    appliedRadiiMTRef.current = null
    surfaceStylesMTRef.current.surfaceHeight = ''
    surfaceStylesMTRef.current.surfaceWidth = ''
    surfaceStylesMTRef.current.surfaceLeft = ''
    surfaceStylesMTRef.current.surfaceMask = ''
    if (element) {
      applyHorizontalFrameMT()
      updateCornersMT()
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
      if (element) updateCornersMT()
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
    if (isBottom && presence.current === PresenceState.Entered) {
      applyClipBottomMT(geometryMTRef.current.settledBottom)
    }
    updateSurfaceMT()
  }

  function setBodySlotMTRef(element: MainThread.Element | null) {
    'main thread'
    bodyInsets.setBodySlotMTRef(element, updateSurfaceMT)
  }

  return {
    setSheetMTRef,
    setClipMTRef,
    setSurfaceMTRef,
    setViewportMTRef,
    settleSurfaceMT,
    setInsetsMT,
    setCornerRadiusMT,
    measureBodyParentMT: bodyInsets.measureBodyParentMT,
    measureSurfaceMT: bodyInsets.measureSurfaceMT,
    hasFitBodyMT: bodyInsets.hasFitBodyMT,
    updateSurfaceMT,
    bodyContext: {
      enabled: bodyInsets.enabled,
      intrinsic: bodyInsets.intrinsic,
      resolvedSide,
      enableRTL,
      viewportHeight: screenHeight,
      setBodyClipMTRef: bodyInsets.setBodyClipMTRef,
      setBodySlotMTRef,
      measureIntrinsicBodyMT: bodyInsets.measureIntrinsicBodyMT,
      setBodyMTRef: bodyInsets.setBodyMTRef,
      measureBodyMT: bodyInsets.measureBodyMT,
    },
  }
}
