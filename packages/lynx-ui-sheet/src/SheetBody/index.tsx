// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnMainThread,
  useContext,
  useEffect,
  useMainThreadRef,
  useRef,
} from '@lynx-js/react'

import type { MainThread } from '@lynx-js/types'

import { SheetBodyContext } from '../context'
import { useSheetBodyInsets } from '../hooks/useSheetBodyInsets'
import type { SheetBodyProps } from '../types'

/**
 * Keep body content inside local Sheet viewport safe-area boundaries while
 * preserving a constant view hierarchy so children never remount when insets
 * or snap configurations change.
 */
export function SheetBody(
  { children, className, style, viewportInsets, bodyViewProps }: SheetBodyProps,
) {
  const context = useContext(SheetBodyContext)
  const elementMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const resolvedSide = context?.resolvedSide ?? 'bottom'
  const enableRTL = context?.enableRTL ?? false
  const viewportWidth = context?.viewportWidth ?? 0
  const viewportHeight = context?.viewportHeight ?? 0
  const maxSnapSize = context?.maxSnapSize ?? 0
  const hasFitSnapPoint = context?.hasFitSnapPoint ?? false
  const initialBottomInset = context?.initialBottomInset ?? 0
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'

  const {
    measureBodyMT,
    measureIntrinsicBodyMT,
    setBodyMTRef,
    setBodySlotMTRef,
    setBodyClipMTRef,
  } = useSheetBodyInsets({
    resolvedSide,
    enableRTL,
    screenWidth: viewportWidth,
    screenHeight: viewportHeight,
    maxSnapSize,
    hasFitSnapPoint,
    fitMinSize: context?.fitMinSize,
    fitMaxSize: context?.fitMaxSize,
    hubMTRef: context?.hubMTRef,
  })

  const top = viewportInsets?.top
  const right = viewportInsets?.right
  const bottom = viewportInsets?.bottom
  const left = viewportInsets?.left
  const start = viewportInsets?.start
  const end = viewportInsets?.end
  const hasActiveInsets = Number.isFinite(top)
    || Number.isFinite(right)
    || Number.isFinite(bottom)
    || Number.isFinite(left)
    || Number.isFinite(start)
    || Number.isFinite(end)
  const enabled = Boolean(context && hasActiveInsets)
  const intrinsic = enabled && hasFitSnapPoint

  const mountSeededClipSize = useRef<number | null | undefined>(undefined)
  if (mountSeededClipSize.current === undefined) {
    if (!enabled || intrinsic || !maxSnapSize || maxSnapSize <= 0) {
      mountSeededClipSize.current = null
    } else if (horizontal) {
      if (viewportWidth > 0) {
        const rawLeft = left ?? (enableRTL ? end : start) ?? 0
        const rawRight = right ?? (enableRTL ? start : end) ?? 0
        const clampedLeft = Number.isFinite(rawLeft) ? Math.max(0, rawLeft) : 0
        const clampedRight = Number.isFinite(rawRight)
          ? Math.max(0, rawRight)
          : 0
        const panelWidth = Math.max(0, Math.min(viewportWidth, maxSnapSize))
        const settledLeft = resolvedSide === 'right'
          ? viewportWidth - panelWidth
          : 0
        const leftOverlap = Math.min(
          panelWidth,
          Math.max(0, clampedLeft - settledLeft),
        )
        const rightOverlap = Math.min(
          panelWidth - leftOverlap,
          Math.max(
            0,
            clampedRight - (viewportWidth - settledLeft - panelWidth),
          ),
        )
        mountSeededClipSize.current = leftOverlap > 0 || rightOverlap > 0
          ? panelWidth - leftOverlap - rightOverlap
          : null
      } else {
        mountSeededClipSize.current = null
      }
    } else if (viewportHeight > 0) {
      const clampedTop = top !== undefined && Number.isFinite(top)
        ? Math.max(0, top)
        : 0
      const clampedBottom = bottom !== undefined && Number.isFinite(bottom)
        ? Math.max(0, bottom)
        : 0
      const edgeInset = resolvedSide === 'bottom' ? initialBottomInset : 0
      const availableSpan = Math.max(0, viewportHeight - edgeInset)
      const panelHeight = Math.max(0, Math.min(availableSpan, maxSnapSize))
      const settledTop = resolvedSide === 'bottom'
        ? availableSpan - panelHeight
        : edgeInset
      const topOverlap = Math.min(
        panelHeight,
        Math.max(0, clampedTop - settledTop),
      )
      const bottomOverlap = Math.min(
        panelHeight - topOverlap,
        Math.max(
          0,
          clampedBottom - (viewportHeight - settledTop - panelHeight),
        ),
      )
      mountSeededClipSize.current = topOverlap > 0 || bottomOverlap > 0
        ? panelHeight - topOverlap - bottomOverlap
        : null
    } else {
      mountSeededClipSize.current = null
    }
  }
  const seededClipSize = enabled && !intrinsic
    ? mountSeededClipSize.current
    : null
  let clipMainDimension: string
  if (intrinsic) {
    if (horizontal) {
      clipMainDimension = viewportWidth ? `${viewportWidth}px` : '100vw'
    } else {
      clipMainDimension = viewportHeight ? `${viewportHeight}px` : '100vh'
    }
  } else {
    clipMainDimension = seededClipSize === null ? '100%' : `${seededClipSize}px`
  }
  const clipStyleKey = `${String(enabled)}|${String(intrinsic)}|${
    String(horizontal)
  }|${clipMainDimension}`
  const bodyStyleKey = `${String(enabled)}|${String(hasFitSnapPoint)}|${
    String(horizontal)
  }`

  function setBodyClipElementMT(element: MainThread.Element | null) {
    'main thread'
    setBodyClipMTRef(
      element,
      intrinsic ? null : seededClipSize,
      element ? clipStyleKey : undefined,
    )
  }

  function setBodyElementMT(element: MainThread.Element | null) {
    'main thread'
    elementMTRef.current = element
    setBodyMTRef(
      element,
      enabled ? { top, right, bottom, left, start, end } : undefined,
      element ? bodyStyleKey : undefined,
    )
  }

  function onLayoutMT(event: MainThread.LayoutChangeEvent) {
    'main thread'
    const rect = event.detail ?? event.params
    if (rect?.width >= 0 && rect.height >= 0) measureBodyMT(rect)
  }

  function onIntrinsicLayoutMT(event: MainThread.LayoutChangeEvent) {
    'main thread'
    const rect = event.detail ?? event.params
    if (rect?.width >= 0 && rect.height >= 0) measureIntrinsicBodyMT(rect)
  }

  const insetsSyncKey = `${String(enabled)}|${top ?? ''}|${right ?? ''}|${
    bottom ?? ''
  }|${left ?? ''}|${start ?? ''}|${end ?? ''}`
  const lastInsetsSyncKeyRef = useRef(insetsSyncKey)

  useEffect(() => {
    if (lastInsetsSyncKeyRef.current === insetsSyncKey) {
      return
    }
    lastInsetsSyncKeyRef.current = insetsSyncKey
    if (!context) return
    runOnMainThread(() => {
      'main thread'
      if (elementMTRef.current) {
        setBodyMTRef(
          elementMTRef.current,
          enabled ? { top, right, bottom, left, start, end } : undefined,
        )
      }
    })()
  }, [
    context,
    enabled,
    insetsSyncKey,
    setBodyMTRef,
    top,
    right,
    bottom,
    left,
    start,
    end,
    elementMTRef,
  ])

  const flexDirection = horizontal
    ? ('row' as const)
    : ('column' as const)
  const crossFill = horizontal ? { height: '100%' } : { width: '100%' }

  let slotStyle: SheetBodyProps['style']
  if (!context) {
    slotStyle = undefined
  } else if (intrinsic) {
    slotStyle = horizontal
      ? { position: 'relative', width: 0, height: '100%', flexShrink: 0 }
      : { position: 'relative', height: 0, flexShrink: 0 }
  } else if (hasFitSnapPoint) {
    slotStyle = {
      position: 'relative',
      display: 'flex',
      flexDirection,
      ...crossFill,
      flexShrink: 0,
    }
  } else {
    slotStyle = {
      position: 'relative',
      width: '100%',
      height: '100%',
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      minHeight: 0,
    }
  }

  let clipStyle: SheetBodyProps['style']
  if (!context) {
    clipStyle = undefined
  } else if (enabled) {
    clipStyle = horizontal
      ? {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: clipMainDimension,
        overflow: 'hidden',
        pointerEvents: 'none',
      }
      : {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: clipMainDimension,
        overflow: 'hidden',
        pointerEvents: 'none',
      }
  } else if (hasFitSnapPoint) {
    clipStyle = {
      display: 'flex',
      flexDirection,
      ...crossFill,
      flexShrink: 0,
    }
  } else {
    clipStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      pointerEvents: 'none',
    }
  }

  let moverStyle: SheetBodyProps['style']
  if (!context) {
    moverStyle = undefined
  } else if (intrinsic) {
    moverStyle = horizontal
      ? {
        pointerEvents: 'auto',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'row',
        flexShrink: 0,
      }
      : {
        pointerEvents: 'auto',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }
  } else if (hasFitSnapPoint) {
    moverStyle = {
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection,
      ...crossFill,
      flexShrink: 0,
    }
  } else {
    moverStyle = {
      pointerEvents: 'auto',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      display: 'flex',
      flexDirection,
    }
  }

  return (
    <view
      style={slotStyle}
      main-thread:ref={context ? setBodySlotMTRef : undefined}
      implicit-animation='false'
      main-thread:bindlayoutchange={context ? onLayoutMT : undefined}
      event-through={false}
    >
      <view
        style={clipStyle}
        main-thread:ref={context ? setBodyClipElementMT : undefined}
        flatten={false}
        implicit-animation='false'
        event-through={true}
      >
        <view
          style={moverStyle}
          main-thread:ref={context ? setBodyElementMT : undefined}
          implicit-animation='false'
          main-thread:bindlayoutchange={context && hasFitSnapPoint
            ? onIntrinsicLayoutMT
            : undefined}
          event-through={false}
        >
          <view
            {...bodyViewProps}
            className={className}
            style={{
              ...(context
                ? (horizontal
                  ? { flexGrow: 1, flexShrink: 1, minWidth: 0, height: '100%' }
                  : { flexGrow: 1, flexShrink: 1, minHeight: 0, width: '100%' })
                : {}),
              ...style,
            }}
          >
            {children}
          </view>
        </view>
      </view>
    </view>
  )
}
