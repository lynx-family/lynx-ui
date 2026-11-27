// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useEffect,
  useMainThreadRef,
} from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'
import type { MainThread } from '@lynx-js/types'

import { useSheetFooterContext } from '../context'
import type { SheetFooterProps } from '../types'

/** Optional footer measured locally and positioned directly on the main thread. */
export function SheetFooter(
  { children, className, style, onHeightChange }: SheetFooterProps,
) {
  const { setFooterMTRef, updateFooterHeightMT } = useSheetFooterContext()
  const heightMTRef = useMainThreadRef(-1)
  const hasOnHeightChange = Boolean(onHeightChange)
  const reportHeight = useMemoizedFn((height: number) => {
    onHeightChange?.(height)
  })
  const reportUnmount = useMemoizedFn(() => onHeightChange?.(0))

  function unmountFooterMT() {
    'main thread'
    heightMTRef.current = -1
    setFooterMTRef(null)
    updateFooterHeightMT(0)
  }

  useEffect(() => () => {
    runOnMainThread(unmountFooterMT)()
    reportUnmount()
  }, [reportUnmount])

  function setFooterElementMT(element: MainThread.Element | null) {
    'main thread'
    if (!element) return
    setFooterMTRef(element)
    if (heightMTRef.current >= 0) {
      updateFooterHeightMT(heightMTRef.current)
    }
  }

  function handleLayoutMT(
    event: { detail?: { height?: number }, params?: { height?: number } },
  ) {
    'main thread'
    const height = event.detail?.height ?? event.params?.height
    if (height === undefined) return
    const nextHeight = Math.max(0, height)
    if (nextHeight === heightMTRef.current) return
    heightMTRef.current = nextHeight
    updateFooterHeightMT(nextHeight)
    if (hasOnHeightChange) {
      runOnBackground(reportHeight)(nextHeight)
    }
  }

  return (
    <view
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
      main-thread:ref={setFooterElementMT}
      main-thread:bindlayoutchange={handleLayoutMT}
    >
      {children}
    </view>
  )
}
