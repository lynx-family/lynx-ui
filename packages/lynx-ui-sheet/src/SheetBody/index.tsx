// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnMainThread,
  useContext,
  useEffect,
  useMainThreadRef,
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
  const measureBodyMT = context?.measureBodyMT
  const measureIntrinsicBodyMT = context?.measureIntrinsicBodyMT
  const resolvedSide = context?.resolvedSide
  const viewportHeight = context?.viewportHeight
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
  const clipped = enabled && setBodyClipMTRef !== undefined

  function setBodyElementMT(element: MainThread.Element | null) {
    'main thread'
    elementMTRef.current = element
    setBodyMTRef?.(element, { top, right, bottom, left, start, end })
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

  useEffect(() => {
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

  const body = (
    <view
      className={clipped ? undefined : className}
      style={enabled
        ? {
          ...(clipped ? { pointerEvents: 'auto' } : style),
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          ...(intrinsic ? {} : { bottom: 0 }),
        }
        : style}
      main-thread:ref={enabled ? setBodyElementMT : undefined}
      implicit-animation={clipped ? 'false' : undefined}
      event-through={false}
    >
      {intrinsic
        ? (
          <view
            style={{ width: '100%', flexShrink: 0 }}
            main-thread:bindlayoutchange={onIntrinsicLayoutMT}
          >
            <view className={className} style={style}>{children}</view>
          </view>
        )
        : (clipped
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
        ? { position: 'relative', height: 0, flexShrink: 0 }
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
      main-thread:bindlayoutchange={enabled ? onLayoutMT : undefined}
      event-through={false}
    >
      {clipped
        ? (
          <view
            style={horizontal
              ? {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '100%',
                overflow: 'hidden',
                pointerEvents: 'none',
              }
              : {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                // The intrinsic slot starts at zero during first-screen layout.
                height: intrinsic
                  ? (viewportHeight ? `${viewportHeight}px` : '100vh')
                  : '100%',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            main-thread:ref={setBodyClipMTRef}
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
