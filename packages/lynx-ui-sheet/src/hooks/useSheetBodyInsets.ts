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

import type { MainThread } from '@lynx-js/types'

import type { SheetLayoutRect, SheetSurfaceBodyHubMT } from '../context'
import type { SheetViewportInsets } from '../types'
import { setElementStylesMT } from '../utils'
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
  hubMTRef?: MainThreadRef<SheetSurfaceBodyHubMT> | null
}

function hasAnyFiniteInset(insets: SheetViewportInsets | undefined) {
  'main thread'
  if (!insets) return false
  return Number.isFinite(insets.top)
    || Number.isFinite(insets.right)
    || Number.isFinite(insets.bottom)
    || Number.isFinite(insets.left)
    || Number.isFinite(insets.start)
    || Number.isFinite(insets.end)
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
  insets: SheetViewportInsets,
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
  insets: SheetViewportInsets,
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
 * Keep a `SheetBody` instance inside viewport safe-area boundaries across all
 * 4 sides using hardware `overflow: hidden` + `transform` (zero layout writes
 * during steady drags) and synchronous cross-axis clamping when panel
 * horizontal insets change. Subscribes per-instance to `SheetSurfaceBodyHubMT`
 * so multiple `SheetBody` regions work independently and the entire engine is
 * tree-shaken when `SheetBody` is unused.
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
  hubMTRef,
}: SheetBodyInsetsOptions) {
  const isBottom = resolvedSide === 'bottom'
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const intrinsic = hasFitSnapPoint
  const fitSlotMaxSize = maxSnapSize === 0 ? fitMaxSize : undefined
  const subscriberIdMTRef = useMainThreadRef(0)
  const reportFitBodyMTRef = useMainThreadRef<
    ((allowStableParent?: boolean) => void) | null
  >(null)
  const bodyMTRef = useMainThreadRef<{
    element: MainThread.Element | null
    elementNodeKey: unknown
    elementStyleKey: string | undefined
    clip: MainThread.Element | null
    clipNodeKey: unknown
    clipStyleKey: string | undefined
    intrinsicWrapper: MainThread.Element | null
    insets: SheetViewportInsets | undefined
    outer: SheetLayoutRect
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
    elementNodeKey: null,
    elementStyleKey: undefined,
    clip: null,
    clipNodeKey: null,
    clipStyleKey: undefined,
    intrinsicWrapper: null,
    insets: undefined,
    outer: { left: 0, top: 0, width: -1, height: -1 },
    horizontalPadding: 0,
    outerPendingParentSync: false,
    appliedHorizontal: '0/0',
    appliedVertical: '0/0',
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
    reportFitBodyMTRef.current = reportFitBodyLayoutMT
    const hub = hubMTRef?.current
    if (!hub) return
    const body = bodyMTRef.current
    const {
      slot,
      outer,
      expectedCross,
      fitCrossSize,
      reservedSize,
    } = body
    const parent = hub.parentRect
    const outerMain = horizontal ? outer.width : outer.height
    const parentMain = horizontal ? parent.width : parent.height
    if (
      !slot || !body.element || !hasAnyFiniteInset(body.insets)
      || outer.width < 0 || outer.height < 0
      || fitCrossSize < 0
      || parentMain === undefined
      || Math.abs(expectedCross - fitCrossSize) > 1
      || Math.abs(outerMain - reservedSize) > 1
      || body.reportedMain === parentMain
    ) {
      return
    }
    if (
      !allowStableParent && parentMain === body.parentSizeBeforeReservation
    ) {
      if (!body.waitingForParent) {
        body.waitingForParent = true
        requestAnimationFrame(() => {
          'main thread'
          bodyMTRef.current.waitingForParent = false
          reportFitBodyMTRef.current?.(true)
        })
      }
      return
    }
    body.reportedMain = parentMain
    hub.onFitBodyLayout?.(parentMain)
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
    const hub = hubMTRef?.current
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
    ) {
      return
    }

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
    const wrapper = body.intrinsicWrapper ?? body.element
    const boundsKey = `${contentMin ?? ''}/${contentMax ?? ''}`
    if (wrapper && boundsKey !== body.appliedIntrinsicBounds) {
      body.appliedIntrinsicBounds = boundsKey
      setElementStylesMT(
        wrapper,
        horizontal
          ? {
            minWidth: contentMin === undefined ? null : `${contentMin}px`,
            maxWidth: contentMax === undefined ? null : `${contentMax}px`,
          }
          : {
            minHeight: contentMin === undefined ? null : `${contentMin}px`,
            maxHeight: contentMax === undefined ? null : `${contentMax}px`,
          },
      )
    }
    const clampedNatural = Math.max(
      contentMin ?? 0,
      Math.min(contentMax ?? Number.POSITIVE_INFINITY, naturalMain),
    )
    const reservedSize = clampedNatural + edgeReserve
    const reservedChanged = Math.abs(reservedSize - body.reservedSize) > 0.01
    if (reservedChanged) {
      body.reservedSize = reservedSize
      body.parentSizeBeforeReservation = parentMain
      body.slot.setStyleProperties(
        horizontal
          ? { width: `${reservedSize}px` }
          : { height: `${reservedSize}px` },
      )
    }
    const unmeasuredSlot = Math.abs(outerMain - reservedSize) > 1
    if (
      (body.reportedMain < 0 || (reservedChanged && unmeasuredSlot))
      && reservedSize > 0
    ) {
      const predictedParentMain = reservedSize + parentStartOffset
        + body.parentEndOffset
      if (body.reportedMain !== predictedParentMain) {
        body.reportedMain = predictedParentMain
        hub?.onFitBodyLayout?.(predictedParentMain)
      }
    }
  }

  function applyBodyLayoutMT() {
    'main thread'
    const hub = hubMTRef?.current
    if (!hub) return
    const body = bodyMTRef.current
    const { element, outer, insets } = body
    if (
      (!hub.hasRange && !intrinsic)
      || !element
      || outer.width < 0
      || !insets
      || !hasAnyFiniteInset(insets)
    ) {
      return
    }
    const parent = hub.parentRect
    if (!parent.width || parent.height === undefined) return

    const horizontalOverride = horizontal ? null : hub.horizontalOverride
    if (horizontalOverride) {
      body.pendingSurfaceWidth = -1
    }
    const effectiveSurfaceLeft = horizontalOverride
      ? horizontalOverride.left
      : hub.surfaceLeft
    const effectiveOuterWidth = horizontalOverride
      ? Math.max(0, horizontalOverride.width - body.horizontalPadding)
      : (!horizontal && body.pendingSurfaceWidth >= 0
        ? Math.max(0, body.pendingSurfaceWidth - body.horizontalPadding)
        : outer.width)

    const start = hub.hasRange ? hub.rangeStart : 0
    const size = hub.hasRange
      ? hub.rangeSize
      : (horizontal ? outer.width : outer.height)
    const left = horizontal
      ? start + outer.left - (parent.left ?? 0)
      : effectiveSurfaceLeft + outer.left - (parent.left ?? 0)
    const top = horizontal
      ? hub.surfaceTop + outer.top - (parent.top ?? 0)
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
        ? Math.max(0, hub.footerHeightMTRef?.current ?? 0)
        : 0
      const edgeInset = isBottom ? hub.settledBottom : 0
      const availableSpan = Math.max(0, screenHeight - edgeInset)

      const parentStartOffset = Math.max(0, outer.top - (parent.top ?? 0))
      if (intrinsic) {
        applyIntrinsicFitMT({
          crossAvailable: width - offsets.left - offsets.right,
          viewportCross: screenWidth,
          availableSpan,
          edgeInset,
          reserveEdge: isBottom ? resolved.bottom : resolved.top,
          parentStartOffset,
          outerMain: outer.height,
          parentMain: parent.height,
          footer,
        })
      }

      const pendingReservation = intrinsic && body.reservedSize > 0
        && Math.abs(outer.height - body.reservedSize) > 1
      const effectiveOuterHeight = pendingReservation
        ? body.reservedSize
        : outer.height
      const effectiveParentHeight = pendingReservation
        ? parentStartOffset + body.reservedSize + body.parentEndOffset
        : parent.height
      const panelHeight = Math.max(
        0,
        Math.min(
          availableSpan,
          Math.max(maxSnapSize, intrinsic ? effectiveParentHeight + footer : 0),
        ),
      )
      const settledTop = isBottom
        ? availableSpan - panelHeight + outer.top - (parent.top ?? 0)
        : edgeInset + outer.top - (parent.top ?? 0)
      const settledHeight = Math.max(
        0,
        panelHeight - footer - effectiveParentHeight + effectiveOuterHeight,
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
      const matchesDefaultClipHeight = !intrinsic && body.clipSize === null
        && topInset === 0 && bottomInset === 0
        && Math.abs(viewportHeight - outer.height) <= 0.5
      const nextClipSize = matchesDefaultClipHeight ? null : viewportHeight
      if (
        clip
        && (body.clipSize !== nextClipSize || body.clipOffset !== clipTop)
      ) {
        const sizeChanged = body.clipSize !== nextClipSize
        const offsetChanged = body.clipOffset !== clipTop
        body.clipSize = nextClipSize
        body.clipOffset = clipTop
        clip.setStyleProperties({
          ...(sizeChanged && nextClipSize !== null
            ? { height: `${nextClipSize}px` }
            : {}),
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

    const parentStartOffset = Math.max(0, outer.left - (parent.left ?? 0))
    if (intrinsic) {
      applyIntrinsicFitMT({
        crossAvailable: height - offsets.top - offsets.bottom,
        viewportCross: screenHeight,
        availableSpan,
        edgeInset,
        reserveEdge: resolvedSide === 'right' ? resolved.right : resolved.left,
        parentStartOffset,
        outerMain: outer.width,
        parentMain: parent.width,
        footer: 0,
      })
    }

    const pendingReservation = intrinsic && body.reservedSize > 0
      && Math.abs(outer.width - body.reservedSize) > 1
    const effectiveOuterWidthFit = pendingReservation
      ? body.reservedSize
      : outer.width
    const effectiveParentWidth = pendingReservation
      ? parentStartOffset + body.reservedSize + body.parentEndOffset
      : parent.width
    const panelWidth = Math.max(
      0,
      Math.min(
        availableSpan,
        Math.max(maxSnapSize, intrinsic ? effectiveParentWidth : 0),
      ),
    )
    const settledLeft = resolvedSide === 'right'
      ? availableSpan - panelWidth + outer.left - (parent.left ?? 0)
      : edgeInset + outer.left - (parent.left ?? 0)
    const settledWidth = Math.max(
      0,
      panelWidth - effectiveParentWidth + effectiveOuterWidthFit,
    )
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
    const matchesDefaultClipWidth = !intrinsic && body.clipSize === null
      && leftInset === 0 && rightInset === 0
      && Math.abs(viewportWidth - outer.width) <= 0.5
    const nextClipSize = matchesDefaultClipWidth ? null : viewportWidth
    if (
      clip && (body.clipSize !== nextClipSize || body.clipOffset !== clipLeft)
    ) {
      const sizeChanged = body.clipSize !== nextClipSize
      const offsetChanged = body.clipOffset !== clipLeft
      body.clipSize = nextClipSize
      body.clipOffset = clipLeft
      clip.setStyleProperties({
        ...(sizeChanged && nextClipSize !== null
          ? { width: `${nextClipSize}px` }
          : {}),
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

  function syncHorizontalPaddingMT(fromOuter: boolean) {
    'main thread'
    const hub = hubMTRef?.current
    if (!hub) return
    const body = bodyMTRef.current
    const parentWidth = hub.parentRect.width
    const outerWidth = body.outer.width
    const horizontalOverride = horizontal ? null : hub.horizontalOverride
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

  function handleParentLayoutMT() {
    'main thread'
    syncHorizontalPaddingMT(false)
    applyBodyLayoutMT()
  }

  function syncSurfaceOriginLeftMT(
    _left: number,
    pendingSurfaceWidth?: number,
  ) {
    'main thread'
    bodyMTRef.current.pendingSurfaceWidth = pendingSurfaceWidth ?? -1
  }

  function hasFitBodyMT() {
    'main thread'
    return intrinsic
      && hasAnyFiniteInset(bodyMTRef.current.insets)
      && bodyMTRef.current.slot !== null
  }

  function ensureSubscribedMT() {
    'main thread'
    const hub = hubMTRef?.current
    if (!hub) return
    if (subscriberIdMTRef.current === 0) {
      subscriberIdMTRef.current = ++hub.nextId
    }
    const id = subscriberIdMTRef.current
    const entry = {
      id,
      onUpdate: applyBodyLayoutMT,
      onSurfaceOriginLeft: syncSurfaceOriginLeftMT,
      onParentLayout: handleParentLayoutMT,
      isFitBody: hasFitBodyMT,
    }
    const existingIndex = hub.subscribers.findIndex(sub => sub.id === id)
    if (existingIndex === -1) {
      hub.subscribers.push(entry)
      if (!hub.hasRange) {
        hub.requestSurfaceUpdate?.()
      }
    } else {
      hub.subscribers[existingIndex] = entry
    }
  }

  function maybeUnsubscribeMT() {
    'main thread'
    const body = bodyMTRef.current
    if (body.element !== null || body.slot !== null || body.clip !== null) {
      return
    }
    const hub = hubMTRef?.current
    const id = subscriberIdMTRef.current
    if (!hub || id === 0) return
    const index = hub.subscribers.findIndex(sub => sub.id === id)
    if (index !== -1) {
      hub.subscribers.splice(index, 1)
    }
  }

  function clearDisabledOverridesMT() {
    'main thread'
    const body = bodyMTRef.current
    if (body.element) {
      if (body.appliedHorizontal !== '0/0') {
        body.appliedHorizontal = '0/0'
        setElementStylesMT(body.element, { left: null, right: null })
      }
      if (body.appliedVertical !== '0/0') {
        body.appliedVertical = '0/0'
        setElementStylesMT(body.element, { top: null, bottom: null })
      }
      if (body.translatedMain !== null) {
        body.translatedMain = null
        setElementStylesMT(body.element, { transform: null })
      }
    }
    const wrapper = body.intrinsicWrapper ?? body.element
    if (wrapper && body.appliedIntrinsicBounds !== '/') {
      body.appliedIntrinsicBounds = '/'
      setElementStylesMT(
        wrapper,
        horizontal
          ? { minWidth: null, maxWidth: null }
          : { minHeight: null, maxHeight: null },
      )
    }
    if (body.clip && (body.clipSize !== null || body.clipOffset !== null)) {
      body.clipSize = null
      body.clipOffset = null
      setElementStylesMT(
        body.clip,
        horizontal
          ? { width: null, transform: null }
          : { height: null, transform: null },
      )
    }
    if (body.slot && body.reservedSize > 0) {
      body.reservedSize = 0
      setElementStylesMT(
        body.slot,
        horizontal ? { width: null } : { height: null },
      )
    }
  }

  function measureBodyMT(
    { left = 0, top = 0, width = 0, height = 0 }: Partial<SheetLayoutRect>,
  ) {
    'main thread'
    const body = bodyMTRef.current
    const outer = body.outer
    if (
      outer.left === left
      && outer.top === top
      && outer.width === width
      && outer.height === height
    ) {
      return
    }
    outer.left = left
    outer.top = top
    outer.width = width
    outer.height = height
    syncHorizontalPaddingMT(true)
    applyBodyLayoutMT()
  }

  function getNativeNodeKeyMT(element: MainThread.Element): unknown {
    'main thread'
    return (element as unknown as { element?: unknown }).element ?? element
  }

  function setBodyMTRef(
    element: MainThread.Element | null,
    insets: SheetViewportInsets | undefined,
    bodyStyleKey?: string,
  ) {
    'main thread'
    const body = bodyMTRef.current
    if (!element) {
      body.element = null
      maybeUnsubscribeMT()
      return
    }
    ensureSubscribedMT()
    const rawNode = (element as unknown as { element?: unknown }).element
    const isNewNode = rawNode === undefined
      ? body.element === null
      : rawNode !== body.elementNodeKey
    const styleResetByReact = !isNewNode
      && bodyStyleKey !== undefined
      && body.elementStyleKey !== undefined
      && bodyStyleKey !== body.elementStyleKey
    const active = hasAnyFiniteInset(insets)
    const normalizedInsets = active ? insets : undefined
    const sameWidthInsets = body.insets?.left === normalizedInsets?.left
      && body.insets?.right === normalizedInsets?.right
      && body.insets?.start === normalizedInsets?.start
      && body.insets?.end === normalizedInsets?.end
    if (
      !isNewNode
      && !styleResetByReact
      && body.element === element
      && sameWidthInsets
      && body.insets?.top === normalizedInsets?.top
      && body.insets?.bottom === normalizedInsets?.bottom
      && Boolean(body.insets) === Boolean(normalizedInsets)
    ) {
      return
    }
    if (isNewNode) {
      body.elementNodeKey = rawNode ?? element
      body.reportedMain = -1
      body.appliedHorizontal = '0/0'
      body.appliedVertical = '0/0'
      body.appliedIntrinsicBounds = '/'
      body.translatedMain = null
    } else if (styleResetByReact) {
      body.appliedHorizontal = '0/0'
      body.appliedVertical = '0/0'
      body.appliedIntrinsicBounds = '/'
      body.translatedMain = null
    }
    if (bodyStyleKey !== undefined) {
      body.elementStyleKey = bodyStyleKey
    }
    if (!sameWidthInsets) body.fitCrossSize = -1
    body.element = element
    body.insets = normalizedInsets
    if (!normalizedInsets) {
      clearDisabledOverridesMT()
      return
    }
    applyBodyLayoutMT()
  }

  function setBodySlotMTRef(element: MainThread.Element | null) {
    'main thread'
    const body = bodyMTRef.current
    if (body.slot === element) return
    body.slot = element
    if (!element) {
      maybeUnsubscribeMT()
      return
    }
    ensureSubscribedMT()
    if (
      intrinsic && hasAnyFiniteInset(body.insets) && body.reservedSize > 0
    ) {
      element.setStyleProperties(
        horizontal
          ? { width: `${body.reservedSize}px` }
          : { height: `${body.reservedSize}px` },
      )
    }
    hubMTRef?.current?.requestSurfaceUpdate?.()
  }

  function setBodyIntrinsicMTRef(element: MainThread.Element | null) {
    'main thread'
    const body = bodyMTRef.current
    if (body.intrinsicWrapper === element) return
    body.intrinsicWrapper = element
    body.appliedIntrinsicBounds = '/'
    if (element) applyBodyLayoutMT()
  }

  function setBodyClipMTRef(
    element: MainThread.Element | null,
    seededClipSize: number | null = null,
    clipStyleKey?: string,
  ) {
    'main thread'
    const body = bodyMTRef.current
    body.clip = element
    if (!element) {
      maybeUnsubscribeMT()
      return
    }
    ensureSubscribedMT()
    const nodeKey = getNativeNodeKeyMT(element)
    const isNewNode = nodeKey !== body.clipNodeKey
    const styleResetByReact = !isNewNode
      && clipStyleKey !== undefined
      && body.clipStyleKey !== undefined
      && clipStyleKey !== body.clipStyleKey
    if (isNewNode || styleResetByReact) {
      body.clipNodeKey = nodeKey
      body.clipSize = seededClipSize
      body.clipOffset = null
    }
    if (clipStyleKey !== undefined) {
      body.clipStyleKey = clipStyleKey
    }
    applyBodyLayoutMT()
  }

  function measureIntrinsicBodyMT(
    { width = 0, height = 0 }: Partial<SheetLayoutRect>,
  ) {
    'main thread'
    bodyMTRef.current.natural = { width, height }
    applyBodyLayoutMT()
  }

  const hostSyncKey = `${resolvedSide}|${
    String(enableRTL)
  }|${screenWidth}|${screenHeight}|${maxSnapSize}|${String(hasFitSnapPoint)}|${
    fitMinSize ?? ''
  }|${fitMaxSize ?? ''}`
  const lastHostSyncKeyRef = useRef(hostSyncKey)

  useEffect(() => {
    if (lastHostSyncKeyRef.current === hostSyncKey) return
    lastHostSyncKeyRef.current = hostSyncKey
    if (!hubMTRef) return
    runOnMainThread(() => {
      'main thread'
      const body = bodyMTRef.current
      if (!intrinsic) {
        if (body.reservedSize > 0) {
          body.reservedSize = 0
        }
        const wrapper = body.intrinsicWrapper ?? body.element
        if (wrapper && body.appliedIntrinsicBounds !== '/') {
          body.appliedIntrinsicBounds = '/'
          setElementStylesMT(
            wrapper,
            horizontal
              ? { minWidth: null, maxWidth: null }
              : { minHeight: null, maxHeight: null },
          )
        }
      }
      if (body.element || body.slot || body.clip) {
        ensureSubscribedMT()
        applyBodyLayoutMT()
      }
    })()
  }, [hostSyncKey, hubMTRef, intrinsic])

  return {
    applyBodyLayoutMT,
    measureBodyMT,
    setBodyMTRef,
    setBodySlotMTRef,
    setBodyIntrinsicMTRef,
    setBodyClipMTRef,
    measureIntrinsicBodyMT,
    hasFitBodyMT,
    syncSurfaceOriginLeftMT,
  }
}
