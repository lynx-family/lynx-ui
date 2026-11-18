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
  const enabled = Boolean(context?.enabled && viewportInsets)
  const setBodyMTRef = context?.setBodyMTRef
  const measureBodyMT = context?.measureBodyMT
  const top = viewportInsets?.top
  const right = viewportInsets?.right
  const bottom = viewportInsets?.bottom
  const left = viewportInsets?.left

  function setBodyElementMT(element: MainThread.Element | null) {
    'main thread'
    elementMTRef.current = element
    setBodyMTRef?.(element, { top, right, bottom, left })
  }

  function onLayoutMT(event: MainThread.LayoutChangeEvent) {
    'main thread'
    const rect = event.detail ?? event.params
    if (rect?.width >= 0 && rect.height >= 0) measureBodyMT?.(rect)
  }

  useEffect(() => {
    if (!enabled || !setBodyMTRef) return
    runOnMainThread(() => {
      'main thread'
      if (elementMTRef.current) {
        setBodyMTRef(elementMTRef.current, { top, right, bottom, left })
      }
    })()
  }, [enabled, setBodyMTRef, top, right, bottom, left, elementMTRef])

  return (
    <view
      style={enabled
        ? {
          position: 'relative',
          width: '100%',
          height: '100%',
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          minHeight: 0,
        }
        : undefined}
      main-thread:bindlayoutchange={enabled ? onLayoutMT : undefined}
      event-through={false}
    >
      <view
        className={className}
        style={enabled
          ? {
            ...style,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }
          : style}
        main-thread:ref={enabled ? setBodyElementMT : undefined}
      >
        {children}
      </view>
    </view>
  )
}
