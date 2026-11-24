// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMainThreadRef } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import type { MainThread } from '@lynx-js/types'

import type { SheetLayoutRect } from '../context'
import type { SheetBodyProps } from '../types'
import type { SheetResolvedSide } from '../utils'

export interface SheetBodyInsetsOptions {
  resolvedSide: SheetResolvedSide
  enableRTL: boolean
  screenWidth: number
  screenHeight: number
  maxSnapSize: number
  hasFitSnapPoint: boolean
  fitMinSize?: number
  fitMaxSize?: number
  getBottomInsetMT: () => number
  getSurfaceHorizontalOverrideMT: () => { left: number, width: number } | null
  footerHeightMTRef?: MainThreadRef<number>
  onFitBodyLayoutMT?: (height: number) => void
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

function resolvePhysicalBodyInsets(
  insets: NonNullable<SheetBodyProps['viewportInsets']>,
  enableRTL: boolean,
) {
  'main thread'
  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left ?? (enableRTL ? insets.end : insets.start),
    right: insets.right ?? (enableRTL ? insets.start : insets.end),
  }
}

function resolveBodyLayout(
  rect: SheetLayoutRect,
  viewportWidth: number,
  viewportHeight: number,
  insets: NonNullable<SheetBodyProps['viewportInsets']>,
  enableRTL: boolean,
) {
  'main thread'
  const resolved = resolvePhysicalBodyInsets(insets, enableRTL)
  const left = viewportOverlap(resolved.left, rect.left, rect.width)
  const top = viewportOverlap(resolved.top, rect.top, rect.height)
  return {
    left,
    top,
    right: viewportOverlap(
      resolved.right,
      viewportWidth - rect.left - rect.width,
      rect.width - left,
    ),
    bottom: viewportOverlap(
      resolved.bottom,
      viewportHeight - rect.top - rect.height,
      rect.height - top,
    ),
  }
}

/**
 * Keep SheetBody inside viewport safe-area boundaries across all 4 sides using
 * transform + clip (zero layout writes during steady drags) and synchronous
 * cross-axis clamping when panel horizontal insets change.
 */
export function useSheetBodyInsets({
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
}: SheetBodyInsetsOptions) {
  const isBottom = resolvedSide === 'bottom'
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const intrinsic = hasFitSnapPoint
  const fitSlotMaxSize = maxSnapSize === 0 ? fitMaxSize : undefined
  const surfaceOriginMTRef = useMainThreadRef({ left: 0, top: 0 })
  const bodyRangeMTRef = useMainThreadRef<
    { start: number, size: number } | null
  >(null)
  const bodyMTRef = useMainThreadRef<{
    element: MainThread.Element | null
    clip: MainThread.Element | null
    intrinsicWrapper: MainThread.Element | null
    insets: SheetBodyProps['viewportInsets']
    outer: SheetLayoutRect
    parent: Partial<SheetLayoutRect>
    horizontalPadding: number
    outerPendingParentSync: boolean
    appliedHorizontal: string
    appliedVertical: string
    appliedIntrinsicBounds: string
    translatedMain: number | null
    clipSize: number | null
    clipOffset: number | null
    slot: MainThread.Element | null
    natural: { width: number, height: number } | null
    expectedCross: number
    fitCrossSize: number
    fitViewportCross: number
    reservedSize: number
    parentEndOffset: number
    parentSizeBeforeReservation: number
    waitingForParent: boolean
    reportedMain: number
    pendingSurfaceWidth: number
  }>({
    element: null,
    clip: null,
    intrinsicWrapper: null,
    insets: undefined,
    outer: { left: 0, top: 0, width: -1, height: -1 },
    parent: {},
    horizontalPadding: 0,
    outerPendingParentSync: false,
    appliedHorizontal: '',
    appliedVertical: '',
    appliedIntrinsicBounds: '/',
    translatedMain: null,
    clipSize: null,
    clipOffset: null,
    slot: null,
    natural: null,
    expectedCross: -1,
    fitCrossSize: -1,
    fitViewportCross: horizontal ? screenHeight : screenWidth,
    reservedSize: 0,
    parentEndOffset: 0,
    parentSizeBeforeReservation: -1,
    waitingForParent: false,
    reportedMain: -1,
    pendingSurfaceWidth: -1,
  })

  function reportFitBodyLayoutMT(allowStableParent = false) {
    'main thread'
    const body = bodyMTRef.current
    const {
      slot,
      outer,
      expectedCross,
      fitCrossSize,
      reservedSize,
      parent,
    } = body
    const outerMain = horizontal ? outer.width : outer.height
    const parentMain = horizontal ? parent.width : parent.height
    if (
      !slot || !body.element || outer.width < 0 || outer.height < 0
      || fitCrossSize < 0
      || parentMain === undefined
      || Math.abs(expectedCross - fitCrossSize) > 1
      || Math.abs(outerMain - reservedSize) > 1
      || body.reportedMain === parentMain
    ) return
    if (
      !allowStableParent && parentMain === body.parentSizeBeforeReservation
    ) {
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
    body.reportedMain = parentMain
    onFitBodyLayoutMT?.(parentMain)
  }

  function applyIntrinsicFitMT(params: {
    crossAvailable: number
    viewportCross: number
    availableSpan: number
    edgeInset: number
    reserveEdge: number | undefined
    parentStartOffset: number
    outerMain: number
    parentMain: number
    footer: number
  }) {
    'main thread'
    const body = bodyMTRef.current
    const natural = body.natural
    const {
      crossAvailable,
      viewportCross,
      availableSpan,
      edgeInset,
      reserveEdge,
      parentStartOffset,
      outerMain,
      parentMain,
      footer,
    } = params
    body.expectedCross = crossAvailable
    const naturalCross = natural
      ? (horizontal ? natural.height : natural.width)
      : -1
    const naturalMain = natural
      ? (horizontal ? natural.width : natural.height)
      : 0
    const measuredAtCross = natural !== null
      && Math.abs(naturalCross - body.expectedCross) <= 1
    const compactCross = Math.abs(body.expectedCross - body.fitCrossSize) <= 1
    if (
      !body.slot || !measuredAtCross
      || (body.fitCrossSize >= 0 && !compactCross
        && body.fitViewportCross === viewportCross)
    ) return

    if (!compactCross) {
      body.fitCrossSize = body.expectedCross
      body.fitViewportCross = viewportCross
    }
    if (
      Math.abs(outerMain - body.reservedSize) <= 1
      && (body.reservedSize === 0
        || parentMain !== body.parentSizeBeforeReservation)
    ) {
      body.parentEndOffset = Math.max(
        0,
        parentMain - parentStartOffset - outerMain,
      )
    }
    const isPositiveReserve = naturalMain > 0
      || (fitMinSize !== undefined && fitMinSize > 0)
    const rawReserve = isPositiveReserve
        && reserveEdge !== undefined
        && Number.isFinite(reserveEdge)
      ? Math.max(0, reserveEdge) - edgeInset
        - (resolvedSide === 'bottom' || resolvedSide === 'right'
          ? footer + body.parentEndOffset
          : parentStartOffset)
      : 0
    const edgeReserve = Math.max(0, rawReserve)
    const overhead = edgeReserve + footer + parentStartOffset
      + body.parentEndOffset
    const effectiveMaxSpan = fitSlotMaxSize === undefined
      ? availableSpan
      : Math.min(availableSpan, fitSlotMaxSize)
    const contentMax = fitSlotMaxSize === undefined
      ? undefined
      : Math.max(0, effectiveMaxSpan - overhead)
    const contentMin = fitMinSize === undefined
      ? undefined
      : Math.max(0, Math.min(effectiveMaxSpan, fitMinSize) - overhead)
    const wrapper = body.intrinsicWrapper
    const boundsKey = `${contentMin ?? ''}/${contentMax ?? ''}`
    if (wrapper && boundsKey !== body.appliedIntrinsicBounds) {
      body.appliedIntrinsicBounds = boundsKey
      wrapper.setStyleProperties(
        (horizontal
          ? {
            minWidth: contentMin === undefined ? null : `${contentMin}px`,
            maxWidth: contentMax === undefined ? null : `${contentMax}px`,
          }
          : {
            minHeight: contentMin === undefined ? null : `${contentMin}px`,
            maxHeight: contentMax === undefined ? null : `${contentMax}px`,
          }) as Record<string, string>,
      )
    }
    const clampedNatural = Math.max(
      contentMin ?? 0,
      Math.min(contentMax ?? Number.POSITIVE_INFINITY, naturalMain),
    )
    const reservedSize = clampedNatural + edgeReserve
    if (Math.abs(reservedSize - body.reservedSize) > 0.01) {
      body.reservedSize = reservedSize
      body.parentSizeBeforeReservation = parentMain
      body.slot.setStyleProperties(
        horizontal
          ? { width: `${reservedSize}px` }
          : { height: `${reservedSize}px` },
      )
    }
  }

  function applyBodyLayoutMT(nextRange?: { start: number, size: number }) {
    'main thread'
    const range = nextRange ?? bodyRangeMTRef.current
    const body = bodyMTRef.current
    const { element, outer, insets, parent } = body
    if ((!range && !intrinsic) || !element || outer.width < 0 || !insets) return
    const surface = surfaceOriginMTRef.current
    if (!parent.width || parent.height === undefined) return

    // When panel horizontal bounds are driven synchronously on MT, use the
    // upcoming left/width immediately so SheetBody clamps in the same layout pass.
    const horizontalOverride = horizontal
      ? null
      : getSurfaceHorizontalOverrideMT()
    if (horizontalOverride) {
      body.pendingSurfaceWidth = -1
    }
    const effectiveSurfaceLeft = horizontalOverride
      ? horizontalOverride.left
      : surface.left
    const effectiveOuterWidth = horizontalOverride
      ? Math.max(0, horizontalOverride.width - body.horizontalPadding)
      : (!horizontal && body.pendingSurfaceWidth >= 0
        ? Math.max(0, body.pendingSurfaceWidth - body.horizontalPadding)
        : outer.width)

    const start = range?.start ?? 0
    const size = range?.size ?? (horizontal ? outer.width : outer.height)
    const left = horizontal
      ? start + outer.left - (parent.left ?? 0)
      : effectiveSurfaceLeft + outer.left - (parent.left ?? 0)
    const top = horizontal
      ? surface.top + outer.top - (parent.top ?? 0)
      : start + outer.top - (parent.top ?? 0)
    const width = horizontal
      ? Math.max(0, size - parent.width + outer.width)
      : effectiveOuterWidth
    const height = horizontal
      ? outer.height
      : Math.max(0, size - parent.height + outer.height)
    const offsets = resolveBodyLayout(
      { left, top, width, height },
      screenWidth,
      screenHeight,
      insets,
      enableRTL,
    )
    const resolved = resolvePhysicalBodyInsets(insets, enableRTL)

    if (!horizontal) {
      const horizontalKey = `${offsets.left}/${offsets.right}`
      const horizontalChanged = horizontalKey !== body.appliedHorizontal
      const horizontalStyle = horizontalChanged
        ? { left: `${offsets.left}px`, right: `${offsets.right}px` }
        : undefined
      body.appliedHorizontal = horizontalKey

      const footer = isBottom && intrinsic
        ? Math.max(0, footerHeightMTRef?.current ?? 0)
        : 0
      const edgeInset = isBottom ? getBottomInsetMT() : 0
      const availableSpan = Math.max(0, screenHeight - edgeInset)

      if (intrinsic) {
        applyIntrinsicFitMT({
          crossAvailable: width - offsets.left - offsets.right,
          viewportCross: screenWidth,
          availableSpan,
          edgeInset,
          reserveEdge: isBottom ? resolved.bottom : resolved.top,
          parentStartOffset: Math.max(0, outer.top - (parent.top ?? 0)),
          outerMain: outer.height,
          parentMain: parent.height,
          footer,
        })
      }

      const panelHeight = Math.max(
        0,
        Math.min(
          availableSpan,
          Math.max(maxSnapSize, intrinsic ? parent.height + footer : 0),
        ),
      )
      const settledTop = isBottom
        ? availableSpan - panelHeight + outer.top - (parent.top ?? 0)
        : edgeInset + outer.top - (parent.top ?? 0)
      const settledHeight = Math.max(
        0,
        panelHeight - footer - parent.height + outer.height,
      )
      const topInset = viewportOverlap(resolved.top, settledTop, settledHeight)
      const bottomInset = viewportOverlap(
        resolved.bottom,
        screenHeight - settledTop - settledHeight,
        settledHeight - topInset,
      )
      const viewportHeight = settledHeight - topInset - bottomInset
      const visibleHeight = Math.max(
        0,
        Math.min(viewportHeight, height - offsets.top - offsets.bottom),
      )
      const bodyTop = viewportHeight - visibleHeight
      const clipTop = offsets.top - bodyTop
      const clip = body.clip
      if (
        clip
        && (body.clipSize !== viewportHeight || body.clipOffset !== clipTop)
      ) {
        const sizeChanged = body.clipSize !== viewportHeight
        const offsetChanged = body.clipOffset !== clipTop
        body.clipSize = viewportHeight
        body.clipOffset = clipTop
        clip.setStyleProperties({
          ...(sizeChanged ? { height: `${viewportHeight}px` } : {}),
          ...(offsetChanged ? { transform: `translateY(${clipTop}px)` } : {}),
        })
      }
      const positionChanged = body.translatedMain !== bodyTop
      body.translatedMain = bodyTop
      const verticalStyle = positionChanged
        ? { transform: `translateY(${bodyTop}px)` }
        : undefined
      if (horizontalStyle || verticalStyle) {
        element.setStyleProperties({ ...horizontalStyle, ...verticalStyle })
      }
      if (intrinsic) reportFitBodyLayoutMT()
      return
    }

    // Horizontal drawer (left / right): transform + clip along X, layout top/bottom along Y.
    const verticalKey = `${offsets.top}/${offsets.bottom}`
    const verticalChanged = verticalKey !== body.appliedVertical
    const verticalStyle = verticalChanged
      ? { top: `${offsets.top}px`, bottom: `${offsets.bottom}px` }
      : undefined
    body.appliedVertical = verticalKey

    const edgeInset = 0
    const availableSpan = Math.max(0, screenWidth - edgeInset)

    if (intrinsic) {
      applyIntrinsicFitMT({
        crossAvailable: height - offsets.top - offsets.bottom,
        viewportCross: screenHeight,
        availableSpan,
        edgeInset,
        reserveEdge: resolvedSide === 'right' ? resolved.right : resolved.left,
        parentStartOffset: Math.max(0, outer.left - (parent.left ?? 0)),
        outerMain: outer.width,
        parentMain: parent.width,
        footer: 0,
      })
    }

    const panelWidth = Math.max(
      0,
      Math.min(
        availableSpan,
        Math.max(maxSnapSize, intrinsic ? parent.width : 0),
      ),
    )
    const settledLeft = resolvedSide === 'right'
      ? availableSpan - panelWidth + outer.left - (parent.left ?? 0)
      : edgeInset + outer.left - (parent.left ?? 0)
    const settledWidth = Math.max(0, panelWidth - parent.width + outer.width)
    const leftInset = viewportOverlap(resolved.left, settledLeft, settledWidth)
    const rightInset = viewportOverlap(
      resolved.right,
      screenWidth - settledLeft - settledWidth,
      settledWidth - leftInset,
    )
    const viewportWidth = settledWidth - leftInset - rightInset
    const visibleWidth = Math.max(
      0,
      Math.min(viewportWidth, width - offsets.left - offsets.right),
    )
    const bodyLeft = viewportWidth - visibleWidth
    const clipLeft = offsets.left - bodyLeft
    const clip = body.clip
    if (
      clip && (body.clipSize !== viewportWidth || body.clipOffset !== clipLeft)
    ) {
      const sizeChanged = body.clipSize !== viewportWidth
      const offsetChanged = body.clipOffset !== clipLeft
      body.clipSize = viewportWidth
      body.clipOffset = clipLeft
      clip.setStyleProperties({
        ...(sizeChanged ? { width: `${viewportWidth}px` } : {}),
        ...(offsetChanged ? { transform: `translateX(${clipLeft}px)` } : {}),
      })
    }
    const positionChanged = body.translatedMain !== bodyLeft
    body.translatedMain = bodyLeft
    const mainStyle = positionChanged
      ? { transform: `translateX(${bodyLeft}px)` }
      : undefined
    if (verticalStyle || mainStyle) {
      element.setStyleProperties({ ...verticalStyle, ...mainStyle })
    }
    if (intrinsic) reportFitBodyLayoutMT()
  }

  function updateBodyRangeMT(start: number, size: number) {
    'main thread'
    if (hasFitSnapPoint && !intrinsic) return
    const range = { start, size }
    bodyRangeMTRef.current = range
    applyBodyLayoutMT(range)
  }

  function measureSurfaceMT(event: MainThread.LayoutChangeEvent) {
    'main thread'
    const { left, top } = event.detail ?? event.params
    const previous = surfaceOriginMTRef.current
    if (previous.left === left && previous.top === top) return
    surfaceOriginMTRef.current = { left, top }
    applyBodyLayoutMT()
  }

  function syncHorizontalPaddingMT(fromOuter: boolean) {
    'main thread'
    const body = bodyMTRef.current
    const parentWidth = body.parent.width
    const outerWidth = body.outer.width
    const horizontalOverride = horizontal
      ? null
      : getSurfaceHorizontalOverrideMT()
    const expectedParentWidth = horizontalOverride
      ? horizontalOverride.width
      : (body.pendingSurfaceWidth >= 0 ? body.pendingSurfaceWidth : undefined)
    const parentMatches = parentWidth !== undefined
      && (expectedParentWidth === undefined
        || Math.abs(parentWidth - expectedParentWidth) <= 1)
    if (fromOuter) {
      if (parentMatches && parentWidth >= outerWidth) {
        body.horizontalPadding = parentWidth - outerWidth
        body.outerPendingParentSync = false
      } else {
        body.outerPendingParentSync = true
      }
    } else if (
      body.outerPendingParentSync && parentMatches && outerWidth >= 0
      && parentWidth >= outerWidth
    ) {
      body.horizontalPadding = parentWidth - outerWidth
      body.outerPendingParentSync = false
    }
    if (
      !body.outerPendingParentSync
      && body.pendingSurfaceWidth >= 0
      && parentWidth !== undefined
      && outerWidth >= 0
      && Math.abs(parentWidth - body.pendingSurfaceWidth) <= 1
      && Math.abs(
          outerWidth
            - Math.max(0, body.pendingSurfaceWidth - body.horizontalPadding),
        ) <= 1
    ) {
      body.pendingSurfaceWidth = -1
    }
  }

  function measureBodyParentMT(rect?: Partial<SheetLayoutRect>) {
    'main thread'
    if (!rect) return
    const parent = bodyMTRef.current.parent
    parent.left = rect.left ?? parent.left
    parent.top = rect.top ?? parent.top
    parent.width = rect.width ?? parent.width
    parent.height = rect.height ?? parent.height
    syncHorizontalPaddingMT(false)
    applyBodyLayoutMT()
  }

  function measureBodyMT(
    { left = 0, top = 0, width = 0, height = 0 }: Partial<SheetLayoutRect>,
  ) {
    'main thread'
    const body = bodyMTRef.current
    const outer = body.outer
    outer.left = left
    outer.top = top
    outer.width = width
    outer.height = height
    syncHorizontalPaddingMT(true)
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
      && body.insets?.start === insets?.start
      && body.insets?.end === insets?.end
    if (
      body.element === element && sameWidthInsets
      && body.insets?.top === insets?.top
      && body.insets?.bottom === insets?.bottom
    ) return
    if (body.element !== element) {
      body.reportedMain = -1
      body.appliedHorizontal = ''
      body.appliedVertical = ''
      body.translatedMain = null
    }
    if (!sameWidthInsets) body.fitCrossSize = -1
    body.element = element
    body.insets = insets
    if (element) applyBodyLayoutMT()
  }

  function setBodySlotMTRef(
    element: MainThread.Element | null,
    onAttach?: () => void,
  ) {
    'main thread'
    const body = bodyMTRef.current
    if (body.slot === element) return
    body.slot = element
    if (element) {
      if (body.reservedSize > 0) {
        element.setStyleProperties(
          horizontal
            ? { width: `${body.reservedSize}px` }
            : { height: `${body.reservedSize}px` },
        )
      }
      onAttach?.()
    }
  }

  function setBodyIntrinsicMTRef(element: MainThread.Element | null) {
    'main thread'
    const body = bodyMTRef.current
    if (body.intrinsicWrapper === element) return
    body.intrinsicWrapper = element
    body.appliedIntrinsicBounds = '/'
    if (element) applyBodyLayoutMT()
  }

  function setBodyClipMTRef(element: MainThread.Element | null) {
    'main thread'
    const body = bodyMTRef.current
    body.clip = element
    body.clipSize = null
    body.clipOffset = null
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

  function syncSurfaceOriginLeftMT(
    left: number,
    pendingSurfaceWidth?: number,
  ) {
    'main thread'
    surfaceOriginMTRef.current = { left, top: surfaceOriginMTRef.current.top }
    bodyMTRef.current.pendingSurfaceWidth = pendingSurfaceWidth ?? -1
  }

  return {
    applyBodyLayoutMT,
    updateBodyRangeMT,
    measureSurfaceMT,
    measureBodyParentMT,
    measureBodyMT,
    setBodyMTRef,
    setBodySlotMTRef,
    setBodyIntrinsicMTRef,
    setBodyClipMTRef,
    measureIntrinsicBodyMT,
    hasFitBodyMT,
    syncSurfaceOriginLeftMT,
    intrinsic,
    enabled: true,
  }
}
