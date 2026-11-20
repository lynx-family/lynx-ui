// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MainThread } from '@lynx-js/types'
import { describe, expect, it, vi } from 'vitest'

import { SheetFooter } from './index'

const cleanups: Array<() => void> = []
const refs: Array<{ current: unknown }> = []
let refIndex = 0
const setFooterMTRef = vi.fn()
const updateFooterHeightMT = vi.fn()

vi.mock('@lynx-js/react', () => ({
  useMainThreadRef: <T,>(initial: T) => {
    const slot = refs[refIndex] ?? { current: initial }
    refs[refIndex] = slot
    refIndex++
    return slot
  },
  useEffect: (fn: () => (() => void) | undefined) => {
    const cleanup = fn()
    if (typeof cleanup === 'function') cleanups.push(cleanup)
  },
  runOnMainThread: <T,>(fn: T) => fn,
  runOnBackground: <T,>(fn: T) => fn,
}))

vi.mock('@lynx-js/lynx-ui-common', () => ({
  useMemoizedFn: <T,>(fn: T) => fn,
}))

vi.mock('../context', () => ({
  useSheetFooterContext: () => ({
    resolvedSide: 'bottom',
    setFooterMTRef,
    updateFooterHeightMT,
  }),
}))

describe('SheetFooter', () => {
  it('preserves measured height across React main-thread:ref re-renders and resets on unmount', () => {
    vi.stubGlobal('React', {
      createElement: (
        type: unknown,
        props: Record<string, unknown> | null,
        ...children: unknown[]
      ) => ({ type, props: props ?? {}, children }),
    })
    refs.length = 0
    cleanups.length = 0
    setFooterMTRef.mockClear()
    updateFooterHeightMT.mockClear()

    const onHeightChange = vi.fn()
    const el = {} as MainThread.Element

    // Initial render
    refIndex = 0
    const firstTree = SheetFooter({
      children: null,
      onHeightChange,
    }) as unknown as {
      props: {
        'main-thread:ref': (el: MainThread.Element | null) => void
        'main-thread:bindlayoutchange': (
          e: { detail: { height: number } },
        ) => void
      }
    }
    firstTree.props['main-thread:ref'](el)
    firstTree.props['main-thread:bindlayoutchange']({ detail: { height: 96 } })
    expect(updateFooterHeightMT).toHaveBeenLastCalledWith(96)
    expect(onHeightChange).toHaveBeenCalledWith(96)

    // Simulate parent re-render triggered by onHeightChange: React invokes old ref(null), then new ref(el).
    refIndex = 0
    const secondTree = SheetFooter({
      children: null,
      onHeightChange,
    }) as unknown as {
      props: {
        'main-thread:ref': (el: MainThread.Element | null) => void
      }
    }
    updateFooterHeightMT.mockClear()
    firstTree.props['main-thread:ref'](null)
    secondTree.props['main-thread:ref'](el)
    expect(updateFooterHeightMT).not.toHaveBeenCalledWith(0)
    expect(updateFooterHeightMT).toHaveBeenLastCalledWith(96)

    // Actual unmount cleanup resets footer ref and height to 0.
    updateFooterHeightMT.mockClear()
    setFooterMTRef.mockClear()
    cleanups[cleanups.length - 1]?.()
    expect(setFooterMTRef).toHaveBeenCalledWith(null)
    expect(updateFooterHeightMT).toHaveBeenCalledWith(0)
    expect(onHeightChange).toHaveBeenLastCalledWith(0)
  })
})
