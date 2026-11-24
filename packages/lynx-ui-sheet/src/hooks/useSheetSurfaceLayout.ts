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
  SheetSurfaceAlign,
  SheetSurfaceFrame,
  SheetViewportSize,
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
import {
  equalSurfaceSizeMT,
  normalizeInset,
  normalizeInsetMT,
  parseSurfaceSize,
  parseSurfaceSizeMT,
  resolveHorizontalBounds,
  resolveHorizontalBoundsMT,
} from '../utils/surfaceFrame'

export { normalizeInset }

interface SheetSurfaceLayoutOptions {
  position: MainThreadRef<MotionValue<number>>
  presence: MainThreadRef<PresenceState>
  resolvedSide: SheetResolvedSide
  enableRTL: boolean
  initialCornerRadius?: SheetCornerRadius
  initialFrame?: SheetSurfaceFrame
  surfaceStyle?: SheetContentProps['style']
  screenHeight: number
  screenWidth: number
  allowOverDrag: boolean
  sheetSizeMTRef: MainThreadRef<number>
  movingSurfaceMTRef?: MainThreadRef<MainThread.Element | null>
  maxSnapSize: number
  hasFitSnapPoint: boolean
  fitMinSize?: number
  fitMaxSize?: number
  onFitBodyLayoutMT?: (height: number) => void
  footerHeightMTRef?: MainThreadRef<number>
  updateFooterPositionMT?: (visibleHeight: number) => void
  initialSize: (index: number) => number
  initialSnap: number
  surfaceLifecycleMTRef?: MainThreadRef<
    { open: () => void, settle: () => void } | null
  >
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
  initialCornerRadius,
  initialFrame,
  surfaceStyle,
  screenHeight,
  screenWidth,
  allowOverDrag,
  sheetSizeMTRef,
  movingSurfaceMTRef,
  maxSnapSize,
  hasFitSnapPoint,
  fitMinSize,
  fitMaxSize,
  onFitBodyLayoutMT,
  footerHeightMTRef,
  updateFooterPositionMT,
  initialSize,
  initialSnap,
  surfaceLifecycleMTRef,
}: SheetSurfaceLayoutOptions) {
  const isBottom = resolvedSide === 'bottom'
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const propTop = normalizeInset(initialFrame?.insets?.top)
  const propRight = normalizeInset(initialFrame?.insets?.right)
  const propBottom = normalizeInset(initialFrame?.insets?.bottom)
  const propLeft = normalizeInset(initialFrame?.insets?.left)
  const propWidth = parseSurfaceSize(initialFrame?.width)
  const propMaxWidth = parseSurfaceSize(initialFrame?.maxWidth)
  const propAlign: SheetSurfaceAlign = initialFrame?.align ?? 'center'
  const propHasHorizontal = !horizontal
    && (initialFrame?.insets?.left !== undefined
      || initialFrame?.insets?.right !== undefined
      || propWidth !== null
      || propMaxWidth !== null)
  const propHorizontalBounds = propHasHorizontal
    ? resolveHorizontalBounds(
      propLeft,
      propRight,
      propWidth,
      propMaxWidth,
      propAlign,
      screenWidth,
      enableRTL,
    )
    : null
  const propRadii = normalizeCornerRadii(initialCornerRadius)
  const [propTL, propTR, propBR, propBL] = propRadii
  const inlineCornerStyles = extractInlineCornerStyles(surfaceStyle)
  const inlineBorderRadius = inlineCornerStyles.borderRadius
  const [inlineTL, inlineTR, inlineBR, inlineBL] = inlineCornerStyles.corners
  const baseWidth = typeof surfaceStyle?.width === 'number'
    ? `${surfaceStyle.width}px`
    : surfaceStyle?.width ?? '100%'
  const baseLeft = typeof surfaceStyle?.left === 'number'
    ? `${surfaceStyle.left}px`
    : surfaceStyle?.left ?? null
  const baseLeftPx = typeof surfaceStyle?.left === 'number'
      && Number.isFinite(surfaceStyle.left)
    ? surfaceStyle.left
    : 0

  const clipMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const surfaceMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const viewportMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const appliedRadiiMTRef = useMainThreadRef<CornerRadii | null>(null)
  const panelHeightMTRef = useMainThreadRef(0)
  const viewportSizeMTRef = useMainThreadRef<SheetViewportSize>({
    width: screenWidth,
    height: screenHeight,
  })
  const horizontalOverrideMTRef = useMainThreadRef<
    { left: number, width: number } | null
  >(propHorizontalBounds)
  const geometryMTRef = useMainThreadRef({
    top: propTop,
    right: propRight,
    bottom: propBottom,
    left: propLeft,
    width: propWidth,
    maxWidth: propMaxWidth,
    align: propAlign,
    hasHorizontal: propHasHorizontal,
    radii: propRadii,
    // Keep settledBottom separate from animated bottom so viewport height and
    // clipMTRef.bottom never resize per-frame during motion.
    settledBottom: propBottom,
    clipBottomApplied: 0,
    bottomUpdatePending: false,
    animatingToken: 0,
    settleCheckScheduled: false,
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
    fitMinSize,
    fitMaxSize,
    getBottomInsetMT,
    getSurfaceHorizontalOverrideMT,
    footerHeightMTRef,
    onFitBodyLayoutMT,
  })

  function getViewportSizeMT(): SheetViewportSize {
    'main thread'
    const size = viewportSizeMTRef.current
    return { width: size.width, height: size.height }
  }

  function applyHorizontalFrameMT() {
    'main thread'
    if (horizontal) return
    const geo = geometryMTRef.current
    const surface = surfaceMTRef.current
    const applied = surfaceStylesMTRef.current
    const currentScreenWidth = viewportSizeMTRef.current.width
    if (!geo.hasHorizontal) {
      const hadHorizontalOverride = horizontalOverrideMTRef.current !== null
        || applied.surfaceWidth !== ''
      horizontalOverrideMTRef.current = null
      if (hadHorizontalOverride) {
        const pendingWidth = baseWidth === '100%' && baseLeft === null
          ? currentScreenWidth
          : undefined
        bodyInsets.syncSurfaceOriginLeftMT(baseLeftPx, pendingWidth)
      }
      if (surface && applied.surfaceWidth !== '') {
        applied.surfaceWidth = ''
        applied.surfaceLeft = ''
        // The runtime accepts null to remove an inline value and restore the
        // stylesheet cascade. The public worklet declaration only lists strings.
        surface.setStyleProperties({
          width: baseWidth,
          left: baseLeft,
        } as Record<string, string>)
      }
      return
    }
    const { left, width } = resolveHorizontalBoundsMT(
      geo.left,
      geo.right,
      geo.width,
      geo.maxWidth,
      geo.align,
      currentScreenWidth,
      enableRTL,
    )
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
    const motion = position.current
    if (!motion) return
    const value = Math.max(0, motion.get())
    if (horizontal) {
      const opened = Math.max(sheetSizeMTRef.current, maxSnapSize)
      const extent = allowOverDrag ? value : Math.min(value, opened)
      const panelSize = hasFitSnapPoint && bodyInsets.hasFitBodyMT()
        ? Math.max(sheetSizeMTRef.current, maxSnapSize)
        : maxSnapSize
      bodyInsets.updateBodyRangeMT(
        resolvedSide === 'right' ? screenWidth - extent : extent - panelSize,
        panelSize,
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
      if (isBottom) {
        bodyInsets.updateBodyRangeMT(
          surfaceTop + correction,
          Math.max(
            0,
            visibleHeight - Math.max(0, footerHeightMTRef?.current ?? 0),
          ),
        )
      } else {
        const contentHeight = Math.max(sheetSizeMTRef.current, 0)
        bodyInsets.updateBodyRangeMT(value - contentHeight, contentHeight)
      }
    }
  }

  /**
   * Commit settled hit-test bottom bounds once motion finishes so backdrop
   * taps in the bottom gap pass through without causing per-frame layout.
   */
  function settleSurfaceMT() {
    'main thread'
    if (!isBottom || geometryMTRef.current.bottomUpdatePending) return false
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
    return changed
  }

  function scheduleAutoSettleMT() {
    'main thread'
    const geo = geometryMTRef.current
    if (
      geo.settleCheckScheduled || typeof requestAnimationFrame !== 'function'
    ) {
      return
    }
    const token = geo.animatingToken
    geo.settleCheckScheduled = true
    requestAnimationFrame(() => {
      'main thread'
      requestAnimationFrame(() => {
        'main thread'
        const current = geometryMTRef.current
        current.settleCheckScheduled = false
        if (!current.bottomUpdatePending) return
        if (current.animatingToken !== token) {
          scheduleAutoSettleMT()
          return
        }
        current.bottomUpdatePending = false
        if (!position.current?.isAnimating()) {
          settleSurfaceMT()
        }
      })
    })
  }

  function setFrameMT(
    nextFrame: SheetSurfaceFrame,
    options?: { animating?: boolean },
  ) {
    'main thread'
    const geo = geometryMTRef.current
    const nextInsets = nextFrame.insets
    const nextTop = normalizeInsetMT(nextInsets?.top)
    const nextRight = normalizeInsetMT(nextInsets?.right)
    const nextBottom = normalizeInsetMT(nextInsets?.bottom)
    const nextLeft = normalizeInsetMT(nextInsets?.left)
    const nextWidth = parseSurfaceSizeMT(nextFrame.width)
    const nextMaxWidth = parseSurfaceSizeMT(nextFrame.maxWidth)
    const nextAlign: SheetSurfaceAlign = nextFrame.align ?? 'center'
    const nextHasHorizontal = !horizontal
      && (nextInsets?.left !== undefined
        || nextInsets?.right !== undefined
        || nextWidth !== null
        || nextMaxWidth !== null)
    const changed = geo.top !== nextTop
      || geo.right !== nextRight
      || geo.bottom !== nextBottom
      || geo.left !== nextLeft
      || !equalSurfaceSizeMT(geo.width, nextWidth)
      || !equalSurfaceSizeMT(geo.maxWidth, nextMaxWidth)
      || geo.align !== nextAlign
      || geo.hasHorizontal !== nextHasHorizontal
    const animating = options?.animating === true
    const bottomChanged = geo.bottom !== nextBottom
    if (changed) {
      geo.top = nextTop
      geo.right = nextRight
      geo.bottom = nextBottom
      geo.left = nextLeft
      geo.width = nextWidth
      geo.maxWidth = nextMaxWidth
      geo.align = nextAlign
      geo.hasHorizontal = nextHasHorizontal
      applyHorizontalFrameMT()
    }
    let settled = false
    if (isBottom) {
      if (animating) {
        if (bottomChanged || geo.clipBottomApplied !== 0) {
          geo.bottomUpdatePending = true
          if (geo.clipBottomApplied !== 0) applyClipBottomMT(0)
        }
        if (geo.bottomUpdatePending) {
          geo.animatingToken += 1
          scheduleAutoSettleMT()
        }
      } else {
        const hadPending = geo.bottomUpdatePending
        geo.bottomUpdatePending = false
        geo.animatingToken += 1
        if (position.current?.isAnimating()) {
          if (bottomChanged && geo.clipBottomApplied !== 0) {
            applyClipBottomMT(0)
          }
        } else if (
          hadPending || bottomChanged
          || (presence.current === PresenceState.Entered
            && (geo.settledBottom !== nextBottom
              || geo.clipBottomApplied !== nextBottom))
        ) {
          settled = settleSurfaceMT()
        }
      }
    }
    if (changed && !settled) {
      updateSurfaceMT()
    }
  }

  function setCornerRadiusMT(nextRadius: SheetCornerRadius | undefined) {
    'main thread'
    const radii = normalizeCornerRadiiMT(nextRadius)
    geometryMTRef.current.radii = radii
    updateCornersMT()
    updateSurfaceMT()
  }

  useMotionValueRefEvent(position, 'change', updateSurfaceMT)

  function syncPropsMT() {
    'main thread'
    viewportSizeMTRef.current = { width: screenWidth, height: screenHeight }
    applyHorizontalFrameMT()
    updateCornersMT(true)
    updateSurfaceMT()
  }

  function openSurfaceMT() {
    'main thread'
    const geo = geometryMTRef.current
    geo.top = propTop
    geo.right = propRight
    geo.bottom = propBottom
    geo.left = propLeft
    geo.width = propWidth
    geo.maxWidth = propMaxWidth
    geo.align = propAlign
    geo.hasHorizontal = propHasHorizontal
    geo.radii = [propTL, propTR, propBR, propBL]
    geo.bottomUpdatePending = false
    geo.animatingToken += 1
    if (isBottom) {
      geo.settledBottom = propBottom
      applyClipBottomMT(0)
    }
    applyHorizontalFrameMT()
    updateCornersMT(true)
    updateSurfaceMT()
  }

  function registerSurfaceLifecycleMT() {
    'main thread'
    if (surfaceLifecycleMTRef) {
      surfaceLifecycleMTRef.current = {
        open: openSurfaceMT,
        settle: settleSurfaceMT,
      }
    }
  }

  const propWidthKind = propWidth?.kind
  const propWidthValue = propWidth?.value
  const propMaxWidthKind = propMaxWidth?.kind
  const propMaxWidthValue = propMaxWidth?.value

  useEffect(() => {
    runOnMainThread(registerSurfaceLifecycleMT)()
    runOnMainThread(syncPropsMT)()
  }, [
    propTop,
    propRight,
    propBottom,
    propLeft,
    propWidthKind,
    propWidthValue,
    propMaxWidthKind,
    propMaxWidthValue,
    propAlign,
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
    baseWidth,
    baseLeft,
    screenHeight,
    screenWidth,
    maxSnapSize,
    hasFitSnapPoint,
    fitMinSize,
    fitMaxSize,
    resolvedSide,
    enableRTL,
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
    if (element) registerSurfaceLifecycleMT()
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
    openSurfaceMT,
    setFrameMT,
    setCornerRadiusMT,
    getViewportSizeMT,
    measureBodyParentMT: bodyInsets.measureBodyParentMT,
    measureSurfaceMT: bodyInsets.measureSurfaceMT,
    hasFitBodyMT: bodyInsets.hasFitBodyMT,
    updateSurfaceMT,
    bodyContext: {
      enabled: bodyInsets.enabled,
      intrinsic: bodyInsets.intrinsic,
      resolvedSide,
      enableRTL,
      viewportWidth: screenWidth,
      viewportHeight: screenHeight,
      setBodyClipMTRef: bodyInsets.setBodyClipMTRef,
      setBodySlotMTRef,
      setBodyIntrinsicMTRef: bodyInsets.setBodyIntrinsicMTRef,
      measureIntrinsicBodyMT: bodyInsets.measureIntrinsicBodyMT,
      setBodyMTRef: bodyInsets.setBodyMTRef,
      measureBodyMT: bodyInsets.measureBodyMT,
    },
  }
}
