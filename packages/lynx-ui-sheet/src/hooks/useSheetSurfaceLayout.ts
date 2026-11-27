// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnMainThread,
  useEffect,
  useMainThreadRef,
  useRef,
} from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
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
  mergeCornerRadiiMT,
  normalizeCornerRadii,
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
  frame?: SheetSurfaceFrame
  cornerRadius?: SheetCornerRadius
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
  onSurfaceReadyMT?: () => void
  onMotionValueChangeMT?: (value: number) => void
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
  frame,
  cornerRadius,
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
  onSurfaceReadyMT,
  onMotionValueChangeMT,
}: SheetSurfaceLayoutOptions) {
  const isBottom = resolvedSide === 'bottom'
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const isControlledFrame = frame !== undefined
  const isControlledCornerRadius = cornerRadius !== undefined
  const activeFrame = frame ?? initialFrame
  const activeCornerRadius = cornerRadius ?? initialCornerRadius
  const propRight = normalizeInset(activeFrame?.insets?.right)
  const propBottom = normalizeInset(activeFrame?.insets?.bottom)
  const propLeft = normalizeInset(activeFrame?.insets?.left)
  const propWidth = parseSurfaceSize(activeFrame?.width)
  const propMaxWidth = parseSurfaceSize(activeFrame?.maxWidth)
  const propAlign: SheetSurfaceAlign = activeFrame?.align ?? 'center'
  const propHasHorizontal = !horizontal
    && (activeFrame?.insets?.left !== undefined
      || activeFrame?.insets?.right !== undefined
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
  const propRadii = normalizeCornerRadii(activeCornerRadius)
  const [propTL, propTR, propBR, propBL] = propRadii
  const inlineCornerStyles = extractInlineCornerStyles(surfaceStyle)
  const inlineBorderRadius = inlineCornerStyles.borderRadius
  const [inlineTL, inlineTR, inlineBR, inlineBL] = inlineCornerStyles.corners
  const inlineCornerKey = `${inlineBorderRadius ?? ''}|${inlineTL ?? ''}|${
    inlineTR ?? ''
  }|${inlineBR ?? ''}|${inlineBL ?? ''}`
  const baseWidth = typeof surfaceStyle?.width === 'number'
    ? `${surfaceStyle.width}px`
    : surfaceStyle?.width ?? '100%'
  const baseTransform = surfaceStyle?.transform ?? null
  const baseLeftPx = typeof surfaceStyle?.left === 'number'
      && Number.isFinite(surfaceStyle.left)
    ? surfaceStyle.left
    : 0
  const initialViewportHeight = isBottom
    ? Math.min(maxSnapSize, Math.max(0, screenHeight - propBottom))
    : maxSnapSize

  const clipMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const surfaceMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const viewportMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const lastClipNodeKeyMTRef = useMainThreadRef<unknown>(null)
  const lastMovingNodeKeyMTRef = useMainThreadRef<unknown>(null)
  const lastSurfaceNodeKeyMTRef = useMainThreadRef<unknown>(null)
  const lastSurfaceStyleKeyMTRef = useMainThreadRef<string | undefined>(
    undefined,
  )
  const jsxSeededSurfaceMTRef = useMainThreadRef({
    width: propHorizontalBounds ? `${propHorizontalBounds.width}px` : '',
    transform: propHorizontalBounds
      ? `translateX(${propHorizontalBounds.left}px)`
      : '',
    radii: propRadii,
  })
  const unsubscribePositionMTRef = useMainThreadRef<(() => void) | null>(null)
  // Seeded to match SheetSurface's Frame-0 JSX corner styles so mount writes zero redundant styles.
  const appliedRadiiMTRef = useMainThreadRef<CornerRadii | null>(propRadii)
  const appliedInlineCornerKeyMTRef = useMainThreadRef(inlineCornerKey)
  const panelHeightMTRef = useMainThreadRef(0)
  const viewportSizeMTRef = useMainThreadRef<SheetViewportSize>({
    width: screenWidth,
    height: screenHeight,
  })
  const horizontalOverrideMTRef = useMainThreadRef<
    { left: number, width: number } | null
  >(propHorizontalBounds)
  const geometryMTRef = useMainThreadRef({
    right: propRight,
    bottom: propBottom,
    left: propLeft,
    width: propWidth,
    maxWidth: propMaxWidth,
    align: propAlign,
    hasHorizontal: propHasHorizontal,
    radii: propRadii,
    // Keep settledBottom separate from animated bottom so viewport height and
    // SheetBody availableSpan never resize per-frame during motion.
    settledBottom: propBottom,
    bottomUpdatePending: false,
    animatingToken: 0,
    settleCheckScheduled: false,
  })
  // Seeded to match SheetSurface's initial JSX styles so mount causes zero redundant layout writes.
  const surfaceStylesMTRef = useMainThreadRef({
    clipTransform: 'translateY(0px)',
    surfaceHeight: `${screenHeight * 1.5}px`,
    surfaceWidth: propHorizontalBounds ? `${propHorizontalBounds.width}px` : '',
    surfaceTransform: propHorizontalBounds
      ? `translateX(${propHorizontalBounds.left}px)`
      : '',
    surfaceMask: '',
    translation: '',
    viewportHeight: `${initialViewportHeight}px`,
  })

  function getBottomInsetMT() {
    'main thread'
    return geometryMTRef.current.settledBottom
  }

  function getSurfaceHorizontalOverrideMT() {
    'main thread'
    return horizontalOverrideMTRef.current
  }

  const {
    enabled: bodyEnabled,
    intrinsic: bodyIntrinsic,
    hasFitBodyMT,
    updateBodyRangeMT,
    syncSurfaceOriginLeftMT,
    measureSurfaceMT,
    measureBodyParentMT,
    measureBodyMT,
    measureIntrinsicBodyMT,
    setBodyMTRef,
    setBodySlotMTRef: setBodyInsetsSlotMTRef,
    setBodyIntrinsicMTRef,
    setBodyClipMTRef,
  } = useSheetBodyInsets({
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

  const scheduleAutoSettleMTRef = useMainThreadRef<(() => void) | null>(null)
  // Store internal surface operations in a MainThreadRef so public controller
  // and auxiliary element ref callbacks (`setFrameMT`, `setCornerRadiusMT`,
  // `setClipMTRef`, `setViewportMTRef`, `openSurfaceMT`) capture an O(1) worklet
  // ref instead of duplicating the nested worklet closure DAG.
  const surfaceOpsMTRef = useMainThreadRef<
    {
      updateSurface: () => void
      applyHorizontal: () => void
      updateCorners: (reapply?: boolean) => void
      settle: () => boolean
      bindPosition: (allowLazyInit?: boolean) => void
    } | null
  >(null)

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
        || applied.surfaceTransform !== ''
      horizontalOverrideMTRef.current = null
      if (hadHorizontalOverride) {
        const pendingWidth = baseWidth === '100%' && baseLeftPx === 0
          ? currentScreenWidth
          : undefined
        syncSurfaceOriginLeftMT(baseLeftPx, pendingWidth)
      }
      if (
        surface
        && (applied.surfaceWidth !== '' || applied.surfaceTransform !== '')
      ) {
        applied.surfaceWidth = ''
        applied.surfaceTransform = ''
        // The runtime accepts null to remove an inline value and restore the
        // stylesheet cascade. The public worklet declaration only lists strings.
        surface.setStyleProperties({
          width: baseWidth,
          transform: baseTransform,
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
    syncSurfaceOriginLeftMT(left)
    const transformStyle = `translateX(${left}px)`
    const widthStyle = `${width}px`
    if (
      surface
      && (applied.surfaceTransform !== transformStyle
        || applied.surfaceWidth !== widthStyle)
    ) {
      const styles: Record<string, string> = {}
      if (applied.surfaceTransform !== transformStyle) {
        applied.surfaceTransform = transformStyle
        styles.transform = transformStyle
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
      isBottom,
    )
  }

  function updateSurfaceMT() {
    'main thread'
    const motion = position.current
    if (!motion) return
    const value = Math.max(0, motion.get())
    if (horizontal) {
      const opened = Math.max(sheetSizeMTRef.current, maxSnapSize)
      const extent = allowOverDrag ? value : Math.min(value, opened)
      const panelSize = hasFitSnapPoint && hasFitBodyMT()
        ? Math.max(sheetSizeMTRef.current, maxSnapSize)
        : maxSnapSize
      updateBodyRangeMT(
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
    const hasRoundedBottom = isBottom
      && ((geo.radii[2] ?? 0) > 0 || (geo.radii[3] ?? 0) > 0)
    const height = entering
      ? (hasRoundedBottom
        ? Math.max(initialSize(initialSnap), 0)
        : Math.max(value, initialSize(initialSnap), 0))
      : (leaving ? Math.max(panelHeightMTRef.current, value) : value)
    panelHeightMTRef.current = height

    // Entry and exit slide a complete card from beyond the screen edge without
    // resizing clipMTRef on any frame.
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

    // Clip the bottom gap via compositor transform on clipMTRef so hit-testing
    // and paint stay aligned with zero layout passes on open, drag, settle, or close.
    const visualTop = surfaceTop + correction
    const clipOffset = isBottom && effectiveBottom > 0
      ? Math.max(0, screenHeight - (visualTop + visibleHeight))
      : 0
    const applied = surfaceStylesMTRef.current
    const clipTransform = `translateY(${-clipOffset}px)`
    const clip = clipMTRef.current
    if (clip && applied.clipTransform !== clipTransform) {
      applied.clipTransform = clipTransform
      clip.setStyleProperties({ transform: clipTransform })
    }

    const translateY = resolvedSide === 'top'
      ? motion.get()
      : -motion.get() - (effectiveBottom - clipOffset) + correction
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
    const bottomRight = Math.min(geo.radii[2] ?? 0, visibleHeight / 2)
    const bottomLeft = Math.min(geo.radii[3] ?? 0, visibleHeight / 2)
    // Rectangular bottom clipping is already handled by clipMTRef's overflow+transform;
    // reserve clip-path strictly for rounded bottom corners.
    const needsRoundedBottomClip = isBottom
      && (bottomRight > 0 || bottomLeft > 0)
    const clippedBottom = needsRoundedBottomClip
      ? Math.max(0, paintHeight - visibleHeight)
      : 0
    const mask = needsRoundedBottomClip
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
      updateBodyRangeMT(
        isBottom ? visualTop : value - contentHeight,
        isBottom ? visibleHeight : contentHeight,
      )
    } else if (hasFitBodyMT()) {
      if (isBottom) {
        updateBodyRangeMT(
          visualTop,
          Math.max(
            0,
            visibleHeight - Math.max(0, footerHeightMTRef?.current ?? 0),
          ),
        )
      } else {
        const contentHeight = Math.max(sheetSizeMTRef.current, 0)
        updateBodyRangeMT(value - contentHeight, contentHeight)
      }
    }
  }

  /**
   * Commit settled viewport height bounds once motion finishes without causing
   * per-frame viewport layout during animated bottom-gap transitions.
   */
  function settleSurfaceMT() {
    'main thread'
    if (!isBottom || geometryMTRef.current.bottomUpdatePending) return false
    const geo = geometryMTRef.current
    const nextSettled = presence.current === PresenceState.Entered
      ? geo.bottom
      : 0
    const changed = geo.settledBottom !== nextSettled
    geo.settledBottom = nextSettled
    if (changed) surfaceOpsMTRef.current?.updateSurface()
    return changed
  }

  function scheduleAutoSettleMT() {
    'main thread'
    scheduleAutoSettleMTRef.current = scheduleAutoSettleMT
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
          scheduleAutoSettleMTRef.current?.()
          return
        }
        current.bottomUpdatePending = false
        if (!position.current?.isAnimating()) {
          surfaceOpsMTRef.current?.settle()
        }
      })
    })
  }

  function setFrameMT(
    nextFrame: SheetSurfaceFrame,
    options?: { animating?: boolean },
  ) {
    'main thread'
    const ops = surfaceOpsMTRef.current
    const geo = geometryMTRef.current
    const nextInsets = nextFrame.insets
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
    const changed = geo.right !== nextRight
      || geo.bottom !== nextBottom
      || geo.left !== nextLeft
      || !equalSurfaceSizeMT(geo.width, nextWidth)
      || !equalSurfaceSizeMT(geo.maxWidth, nextMaxWidth)
      || geo.align !== nextAlign
      || geo.hasHorizontal !== nextHasHorizontal
    const animating = options?.animating === true
    const bottomChanged = geo.bottom !== nextBottom
    if (changed) {
      geo.right = nextRight
      geo.bottom = nextBottom
      geo.left = nextLeft
      geo.width = nextWidth
      geo.maxWidth = nextMaxWidth
      geo.align = nextAlign
      geo.hasHorizontal = nextHasHorizontal
      ops?.applyHorizontal()
    }
    let settled = false
    if (isBottom) {
      if (animating) {
        if (bottomChanged) {
          geo.bottomUpdatePending = true
        }
        if (changed && geo.bottomUpdatePending) {
          geo.animatingToken += 1
          scheduleAutoSettleMT()
        }
      } else {
        const hadPending = geo.bottomUpdatePending
        geo.bottomUpdatePending = false
        geo.animatingToken += 1
        if (
          !position.current?.isAnimating()
          && (hadPending || bottomChanged
            || (presence.current === PresenceState.Entered
              && geo.settledBottom !== nextBottom))
        ) {
          settled = ops?.settle() ?? false
        }
      }
    }
    if (changed && !settled) {
      ops?.updateSurface()
    }
  }

  function setCornerRadiusMT(nextRadius: SheetCornerRadius | undefined) {
    'main thread'
    const ops = surfaceOpsMTRef.current
    const previousRadii = geometryMTRef.current.radii
    const radii = mergeCornerRadiiMT(previousRadii, nextRadius)
    geometryMTRef.current.radii = radii
    ops?.updateCorners()
    if (
      isBottom
      && (previousRadii[2] !== radii[2] || previousRadii[3] !== radii[3])
    ) {
      ops?.updateSurface()
    }
  }

  function handleMotionChangeMT(value: number) {
    'main thread'
    onMotionValueChangeMT?.(value)
    updateSurfaceMT()
  }

  function bindPositionListenerMT(allowLazyInit = false) {
    'main thread'
    unsubscribePositionMTRef.current?.()
    unsubscribePositionMTRef.current = null
    if (!position.current && allowLazyInit) {
      position.current = createMotionValue(0)
    }
    if (position.current) {
      unsubscribePositionMTRef.current = position.current.on(
        'change',
        handleMotionChangeMT,
      )
    }
  }

  function maybeUnbindPositionListenerMT() {
    'main thread'
    if (
      surfaceMTRef.current === null
      && !movingSurfaceMTRef?.current
      && clipMTRef.current === null
    ) {
      unsubscribePositionMTRef.current?.()
      unsubscribePositionMTRef.current = null
    }
  }

  function syncPropsMT() {
    'main thread'
    surfaceOpsMTRef.current = {
      updateSurface: updateSurfaceMT,
      applyHorizontal: applyHorizontalFrameMT,
      updateCorners: updateCornersMT,
      settle: settleSurfaceMT,
      bindPosition: bindPositionListenerMT,
    }
    bindPositionListenerMT()
    viewportSizeMTRef.current = { width: screenWidth, height: screenHeight }
    const geo = geometryMTRef.current
    if (isControlledFrame) {
      geo.right = propRight
      geo.bottom = propBottom
      geo.left = propLeft
      geo.width = propWidth
      geo.maxWidth = propMaxWidth
      geo.align = propAlign
      geo.hasHorizontal = propHasHorizontal
      if (isBottom) {
        geo.bottomUpdatePending = false
        geo.animatingToken += 1
        if (!position.current?.isAnimating()) {
          geo.settledBottom = propBottom
        }
      }
    }
    if (isControlledCornerRadius) {
      geo.radii = [propTL, propTR, propBR, propBL]
    }
    const inlineChanged =
      appliedInlineCornerKeyMTRef.current !== inlineCornerKey
    appliedInlineCornerKeyMTRef.current = inlineCornerKey
    applyHorizontalFrameMT()
    updateCornersMT(inlineChanged)
    updateSurfaceMT()
  }

  function openSurfaceMT() {
    'main thread'
    const ops = surfaceOpsMTRef.current
    ops?.bindPosition(true)
    const geo = geometryMTRef.current
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
    }
    ops?.applyHorizontal()
    ops?.updateCorners()
    ops?.updateSurface()
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
  const syncPropsKey = `${String(isControlledFrame)}|${
    String(isControlledCornerRadius)
  }|${propRight}|${propBottom}|${propLeft}|${propWidthKind ?? ''}:${
    propWidthValue ?? ''
  }|${propMaxWidthKind ?? ''}:${propMaxWidthValue ?? ''}|${propAlign}|${
    String(propHasHorizontal)
  }|${propTL ?? ''},${propTR ?? ''},${propBR ?? ''},${
    propBL ?? ''
  }|${inlineCornerKey}|${baseWidth}|${
    baseTransform ?? ''
  }|${screenHeight}|${screenWidth}|${maxSnapSize}|${String(hasFitSnapPoint)}|${
    fitMinSize ?? ''
  }|${fitMaxSize ?? ''}|${resolvedSide}|${String(enableRTL)}`
  const lastSyncedPropsKeyRef = useRef(syncPropsKey)

  useEffect(() => {
    if (lastSyncedPropsKeyRef.current === syncPropsKey) {
      return
    }
    lastSyncedPropsKeyRef.current = syncPropsKey
    runOnMainThread(registerSurfaceLifecycleMT)()
    runOnMainThread(syncPropsMT)()
  }, [syncPropsKey])

  function getNativeNodeKeyMT(element: MainThread.Element): unknown {
    'main thread'
    return (element as unknown as { element?: unknown }).element ?? element
  }

  function setSurfaceMTRef(
    element: MainThread.Element | null,
    renderedStyleKey?: string,
  ) {
    'main thread'
    surfaceMTRef.current = element
    if (!element) {
      maybeUnbindPositionListenerMT()
      return
    }
    surfaceOpsMTRef.current = {
      updateSurface: updateSurfaceMT,
      applyHorizontal: applyHorizontalFrameMT,
      updateCorners: updateCornersMT,
      settle: settleSurfaceMT,
      bindPosition: bindPositionListenerMT,
    }
    const nodeKey = getNativeNodeKeyMT(element)
    const isNewNode = nodeKey !== lastSurfaceNodeKeyMTRef.current
    const isFirstAttach = lastSurfaceNodeKeyMTRef.current === null
    const styleResetByReact = !isNewNode
      && renderedStyleKey !== undefined
      && lastSurfaceStyleKeyMTRef.current !== undefined
      && renderedStyleKey !== lastSurfaceStyleKeyMTRef.current
    lastSurfaceNodeKeyMTRef.current = nodeKey
    if (renderedStyleKey !== undefined) {
      lastSurfaceStyleKeyMTRef.current = renderedStyleKey
    }
    if (isNewNode) {
      if (!isFirstAttach) {
        appliedRadiiMTRef.current = null
        surfaceStylesMTRef.current.surfaceWidth = ''
        surfaceStylesMTRef.current.surfaceTransform = ''
      }
      surfaceStylesMTRef.current.surfaceHeight = `${
        viewportSizeMTRef.current.height * 1.5
      }px`
      surfaceStylesMTRef.current.surfaceMask = ''
    } else if (styleResetByReact) {
      const seeded = jsxSeededSurfaceMTRef.current
      appliedRadiiMTRef.current = seeded.radii
      surfaceStylesMTRef.current.surfaceWidth = seeded.width
      surfaceStylesMTRef.current.surfaceTransform = seeded.transform
      surfaceStylesMTRef.current.surfaceHeight = `${
        viewportSizeMTRef.current.height * 1.5
      }px`
      surfaceStylesMTRef.current.surfaceMask = ''
    }
    bindPositionListenerMT()
    registerSurfaceLifecycleMT()
    applyHorizontalFrameMT()
    updateCornersMT()
    updateSurfaceMT()
    if (!horizontal && movingSurfaceMTRef?.current) {
      onSurfaceReadyMT?.()
    }
  }

  function setSheetMTRef(element: MainThread.Element | null) {
    'main thread'
    if (!movingSurfaceMTRef) return
    movingSurfaceMTRef.current = element
    if (horizontal) {
      surfaceMTRef.current = element
    }
    if (!element) {
      maybeUnbindPositionListenerMT()
      return
    }
    surfaceOpsMTRef.current = {
      updateSurface: updateSurfaceMT,
      applyHorizontal: applyHorizontalFrameMT,
      updateCorners: updateCornersMT,
      settle: settleSurfaceMT,
      bindPosition: bindPositionListenerMT,
    }
    bindPositionListenerMT(true)
    registerSurfaceLifecycleMT()
    const nodeKey = getNativeNodeKeyMT(element)
    const isNewNode = nodeKey !== lastMovingNodeKeyMTRef.current
    const isFirstAttach = lastMovingNodeKeyMTRef.current === null
    lastMovingNodeKeyMTRef.current = nodeKey
    if (horizontal) {
      if (isNewNode && !isFirstAttach) {
        appliedRadiiMTRef.current = null
      }
      updateCornersMT()
    }
    if (isNewNode) {
      surfaceStylesMTRef.current.translation = ''
    }
    updateSurfaceMT()
    if (horizontal || surfaceMTRef.current) {
      onSurfaceReadyMT?.()
    }
  }

  function setViewportMTRef(element: MainThread.Element) {
    'main thread'
    if (viewportMTRef.current !== element) {
      viewportMTRef.current = element
      const initHeight = isBottom
        ? Math.min(
          maxSnapSize,
          Math.max(0, viewportSizeMTRef.current.height - propBottom),
        )
        : maxSnapSize
      surfaceStylesMTRef.current.viewportHeight = `${initHeight}px`
    }
    surfaceOpsMTRef.current?.updateSurface()
  }

  function setClipMTRef(element: MainThread.Element | null) {
    'main thread'
    clipMTRef.current = element
    if (!element) {
      maybeUnbindPositionListenerMT()
      return
    }
    const nodeKey = getNativeNodeKeyMT(element)
    if (nodeKey !== lastClipNodeKeyMTRef.current) {
      lastClipNodeKeyMTRef.current = nodeKey
      surfaceStylesMTRef.current.clipTransform = 'translateY(0px)'
    }
    surfaceOpsMTRef.current?.bindPosition()
    surfaceOpsMTRef.current?.updateSurface()
  }

  function onBodySlotAttachMT() {
    'main thread'
    surfaceOpsMTRef.current?.updateSurface()
  }

  function setBodySlotMTRef(element: MainThread.Element | null) {
    'main thread'
    setBodyInsetsSlotMTRef(element, onBodySlotAttachMT)
  }

  function isSurfaceReadyMT() {
    'main thread'
    if (horizontal) {
      return Boolean(movingSurfaceMTRef?.current)
    }
    return Boolean(surfaceMTRef.current && movingSurfaceMTRef?.current)
  }

  return {
    setSheetMTRef,
    setClipMTRef,
    setSurfaceMTRef,
    setViewportMTRef,
    isSurfaceReadyMT,
    settleSurfaceMT,
    openSurfaceMT,
    setFrameMT,
    setCornerRadiusMT,
    getViewportSizeMT,
    measureBodyParentMT,
    measureSurfaceMT,
    hasFitBodyMT,
    updateSurfaceMT,
    bodyContext: {
      enabled: bodyEnabled,
      intrinsic: bodyIntrinsic,
      resolvedSide,
      enableRTL,
      viewportWidth: screenWidth,
      viewportHeight: screenHeight,
      maxSnapSize,
      initialBottomInset: propBottom,
      setBodyClipMTRef,
      setBodySlotMTRef,
      setBodyIntrinsicMTRef,
      measureIntrinsicBodyMT,
      setBodyMTRef,
      measureBodyMT,
    },
  }
}
