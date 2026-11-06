// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  useEffect,
  useMainThreadRef,
  useState,
} from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'

import { useSheetFooterContext } from '../context'
import type { SheetFooterProps } from '../types'

let nextFooterId = 0

/** Optional footer measured locally and positioned by the bottom sheet owner. */
export function SheetFooter(
  { children, className, style, onHeightChange }: SheetFooterProps,
) {
  const { registerFooter, unregisterFooter } = useSheetFooterContext()
  const [id] = useState(() => `lynx-ui-sheet__footer-${++nextFooterId}`)
  const heightMTRef = useMainThreadRef(-1)
  const reportHeight = useMemoizedFn((height: number) => {
    registerFooter(id, height)
    onHeightChange?.(height)
  })
  const reportUnmount = useMemoizedFn(() => onHeightChange?.(0))
  useEffect(() => () => {
    unregisterFooter(id)
    reportUnmount()
  }, [id, unregisterFooter, reportUnmount])

  function handleLayoutMT(
    event: { detail?: { height?: number }, params?: { height?: number } },
  ) {
    'main thread'
    const height = event.detail?.height ?? event.params?.height
    if (height === undefined || height === heightMTRef.current) return
    heightMTRef.current = Math.max(0, height)
    runOnBackground(reportHeight)(heightMTRef.current)
  }

  return (
    <view
      id={id}
      className={className}
      style={{
        width: '100%',
        ...style,
        position: 'absolute',
        top: 0,
        left: 0,
        // Hide outside the viewport until the first native measurement is registered.
        transform: 'translateY(100vh)',
        transition: 'none',
      }}
      implicit-animation='false'
      event-through={false}
      main-thread:bindlayoutchange={handleLayoutMT}
    >
      {children}
    </view>
  )
}
