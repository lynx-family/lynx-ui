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
import type { SheetBodyProps } from '../types'

/** Lay out the body in the portion of the panel inside the supplied edges. */
export function SheetBody(
  { children, className, style, viewportInsets }: SheetBodyProps,
) {
  const context = useContext(SheetBodyContext)
  const elementMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const setBodyMTRef = context?.setBodyMTRef
  const setBodyClipMTRef = context?.setBodyClipMTRef
  const setBodySlotMTRef = context?.setBodySlotMTRef
  const setBodyIntrinsicMTRef = context?.setBodyIntrinsicMTRef
  const measureBodyMT = context?.measureBodyMT
  const measureIntrinsicBodyMT = context?.measureIntrinsicBodyMT
  const resolvedSide = context?.resolvedSide
  const enableRTL = context?.enableRTL ?? false
  const viewportWidth = context?.viewportWidth
  const viewportHeight = context?.viewportHeight
  const maxSnapSize = context?.maxSnapSize
  const initialBottomInset = context?.initialBottomInset ?? 0
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const top = viewportInsets?.top
  const right = viewportInsets?.right
  const bottom = viewportInsets?.bottom
  const left = viewportInsets?.left
  const start = viewportInsets?.start
  const end = viewportInsets?.end
  const enabled = Boolean(
    context?.enabled && (Number.isFinite(top) || Number.isFinite(right)
      || Number.isFinite(bottom) || Number.isFinite(left)
      || Number.isFinite(start) || Number.isFinite(end)),
  )
  const intrinsic = enabled && context?.intrinsic === true

  const mountSeededClipSize = useRef<number | null | undefined>(undefined)
  if (mountSeededClipSize.current === undefined) {
    if (!enabled || intrinsic || !maxSnapSize || maxSnapSize <= 0) {
      mountSeededClipSize.current = null
    } else if (horizontal) {
      if (viewportWidth && viewportWidth > 0) {
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
    } else if (viewportHeight && viewportHeight > 0) {
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
  const seededClipSize = mountSeededClipSize.current
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
  const clipStyleKey = `${String(horizontal)}|${clipMainDimension}`
  const bodyStyleKey = `${String(enabled)}|${String(intrinsic)}|${
    String(horizontal)
  }`

  function setBodyClipElementMT(element: MainThread.Element | null) {
    'main thread'
    setBodyClipMTRef?.(
      element,
      intrinsic ? null : seededClipSize,
      element ? clipStyleKey : undefined,
    )
  }

  function setBodyElementMT(element: MainThread.Element | null) {
    'main thread'
    elementMTRef.current = element
    setBodyMTRef?.(
      element,
      { top, right, bottom, left, start, end },
      element ? bodyStyleKey : undefined,
    )
  }

  function onLayoutMT(event: MainThread.LayoutChangeEvent) {
    'main thread'
    const rect = event.detail ?? event.params
    if (rect?.width >= 0 && rect.height >= 0) measureBodyMT?.(rect)
  }

  function onIntrinsicLayoutMT(event: MainThread.LayoutChangeEvent) {
    'main thread'
    const rect = event.detail ?? event.params
    if (rect?.width >= 0 && rect.height >= 0) measureIntrinsicBodyMT?.(rect)
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
    if (!enabled || !setBodyMTRef) return
    runOnMainThread(() => {
      'main thread'
      if (elementMTRef.current) {
        setBodyMTRef(elementMTRef.current, {
          top,
          right,
          bottom,
          left,
          start,
          end,
        })
      }
    })()
  }, [
    enabled,
    setBodyMTRef,
    top,
    right,
    bottom,
    left,
    start,
    end,
    elementMTRef,
  ])

  const intrinsicBodyStyle = horizontal
    ? {
      pointerEvents: 'auto' as const,
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      left: 0,
    }
    : {
      pointerEvents: 'auto' as const,
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    }

  const body = (
    <view
      className={enabled ? undefined : className}
      style={enabled
        ? (intrinsic
          ? intrinsicBodyStyle
          : {
            pointerEvents: 'auto',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          })
        : style}
      main-thread:ref={enabled ? setBodyElementMT : undefined}
      implicit-animation={enabled ? 'false' : undefined}
      event-through={false}
    >
      {intrinsic
        ? (
          <view
            style={horizontal
              ? {
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
                flexShrink: 0,
              }
              : {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                flexShrink: 0,
              }}
            main-thread:ref={setBodyIntrinsicMTRef}
            implicit-animation='false'
            main-thread:bindlayoutchange={onIntrinsicLayoutMT}
          >
            <view
              className={className}
              style={{
                ...(horizontal
                  ? { flexGrow: 1, flexShrink: 1, minWidth: 0, height: '100%' }
                  : {
                    flexGrow: 1,
                    flexShrink: 1,
                    minHeight: 0,
                    width: '100%',
                  }),
                ...style,
              }}
            >
              {children}
            </view>
          </view>
        )
        : (enabled
          ? (
            <view
              className={className}
              style={{
                ...style,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              {children}
            </view>
          )
          : children)}
    </view>
  )

  return (
    <view
      style={intrinsic
        ? (horizontal
          ? { position: 'relative', width: 0, height: '100%', flexShrink: 0 }
          : { position: 'relative', height: 0, flexShrink: 0 })
        : (enabled
          ? {
            position: 'relative',
            width: '100%',
            height: '100%',
            flexGrow: 1,
            flexShrink: 1,
            minWidth: 0,
            minHeight: 0,
          }
          : undefined)}
      main-thread:ref={intrinsic ? setBodySlotMTRef : undefined}
      implicit-animation={intrinsic ? 'false' : undefined}
      main-thread:bindlayoutchange={enabled ? onLayoutMT : undefined}
      event-through={false}
    >
      {enabled
        ? (
          <view
            style={horizontal
              ? {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                // The intrinsic slot starts at zero width during first-screen layout.
                width: clipMainDimension,
                overflow: 'hidden',
                pointerEvents: 'none',
              }
              : {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                // The intrinsic slot starts at zero during first-screen layout.
                height: clipMainDimension,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            main-thread:ref={setBodyClipElementMT}
            flatten={false}
            implicit-animation='false'
            event-through={true}
          >
            {body}
          </view>
        )
        : body}
    </view>
  )
}
