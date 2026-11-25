// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
import type * as MotionMini from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSnap } from './useSnap'

vi.mock('@lynx-js/react', () => ({
  useMainThreadRef: <T>(current: T) => ({ current }),
  useRef: <T>(current: T) => ({ current }),
  useEffect: vi.fn(),
  useMemo: <T>(fn: () => T) => fn(),
  runOnMainThread: <T>(fn: T) => fn,
  runOnBackground: <T>(fn: T) => fn,
}))
vi.mock(
  '@lynx-js/react/worklet-runtime/bindings',
  () => ({ runWorkletCtx: vi.fn() }),
)
vi.mock(
  '@lynx-js/lynx-ui-common',
  () => ({ noop: () => undefined, useMemoizedFn: <T>(fn: T) => fn }),
)
vi.mock('@lynx-js/lynx-ui-presence', () => ({
  PresenceState: {
    Initial: 'initial',
    Left: 'left',
    Entering: 'entering',
    Entered: 'entered',
    Leaving: 'leaving',
    DelayedEntering: 'delayed-entering',
  },
}))
vi.mock('@lynx-js/motion/mini', async importOriginal => ({
  ...await importOriginal<typeof MotionMini>(),
  useMotionValueRef: (value: number) => ({ current: createMotionValue(value) }),
  useMotionValueRefEvent: (
    ref: { current: ReturnType<typeof createMotionValue<number>> },
    event: 'change',
    fn: (value: number) => void,
  ) => ref.current.on(event, fn),
}))

function setup(snapPoints: Array<number | string> = ['fit']) {
  const state = { current: PresenceState.Left }
  const entered = vi.fn()
  // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
  const snap = useSnap({
    snapPoints,
    screenHeight: 800,
    screenWidth: 400,
    presenceStateMTRef: state,
    onEntered: entered,
  })
  const styles = vi.fn()
  const element = {
    setStyleProperties: styles,
  } as unknown as MainThread.Element
  snap.setSheetMTRef(
    {
      querySelector: () => element,
      setStyleProperties: () => undefined,
    } as unknown as MainThread.Element,
  )
  return { snap, state, entered, styles }
}

describe('Sheet footer fit sizing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'requestAnimationFrame',
      (fn: () => void) => setTimeout(fn, 16),
    )
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it.each([true, false])(
    'resolves measurements with footer first: %s',
    footerFirst => {
      const { snap } = setup()
      if (footerFirst) {
        snap.footerContext.registerFooter('footer', 96)
      }
      snap.handleSheetLayoutChangeMT({ detail: { height: 300 } })
      if (!footerFirst) {
        snap.footerContext.registerFooter('footer', 96)
      }
      expect(snap.getResolvedSnapOffsets()).toEqual([396])
      expect(snap.sheetSizeMTRef.current).toBe(396)
    },
  )

  it('pins the footer across snaps and follows closing and reversal', () => {
    const { snap, styles } = setup([400, 750])
    snap.footerContext.registerFooter('footer', 96)
    snap.yRef.current.set(400)
    expect(styles).toHaveBeenLastCalledWith({ transform: 'translateY(304px)' })
    snap.yRef.current.set(750)
    expect(styles).toHaveBeenLastCalledWith({ transform: 'translateY(654px)' })
    snap.yRef.current.set(40)
    expect(styles).toHaveBeenLastCalledWith({ transform: 'translateY(0px)' })
    snap.yRef.current.set(300)
    expect(styles).toHaveBeenLastCalledWith({ transform: 'translateY(204px)' })
  })

  it('ignores registration and removal after the native motion value is released', () => {
    const { snap } = setup([400])
    Object.assign(snap.yRef, { current: null })
    expect(() => snap.footerContext.registerFooter('footer', 96)).not.toThrow()
    expect(() => snap.footerContext.unregisterFooter('footer')).not.toThrow()
  })

  it('ignores stale removal after another footer has registered', () => {
    const { snap } = setup()
    snap.handleSheetLayoutChangeMT({ detail: { height: 300 } })
    snap.footerContext.registerFooter('previous', 96)
    snap.footerContext.registerFooter('current', 140)
    snap.footerContext.unregisterFooter('previous')
    expect(snap.getResolvedSnapOffsets()).toEqual([440])
  })

  it('does not alter numeric and percentage snap sizes', () => {
    const { snap } = setup([300, '90%'])
    snap.handleSheetLayoutChangeMT({ detail: { height: 720 } })
    snap.footerContext.registerFooter('footer', 96)
    expect(snap.getResolvedSnapOffsets()).toEqual([300, 720])
    expect(snap.sheetSizeMTRef.current).toBe(720)
  })

  it('updates the entry target when footer measurement arrives after body layout', () => {
    const { snap, state, entered } = setup()
    snap.handleSheetLayoutChangeMT({ detail: { height: 300 } })
    snap.showMT()
    vi.advanceTimersByTime(32)
    snap.footerContext.registerFooter('footer', 96)
    vi.advanceTimersByTime(3000)
    expect(snap.yRef.current.get()).toBe(396)
    expect(state.current).toBe(PresenceState.Entered)
    expect(entered).toHaveBeenCalledTimes(1)
  })

  it('updates an open fit snap and removes the height on footer unmount', () => {
    const { snap, state } = setup()
    snap.handleSheetLayoutChangeMT({ detail: { height: 300 } })
    state.current = PresenceState.Entered
    snap.snapToMT(0, { animate: false })
    snap.footerContext.registerFooter('footer', 96)
    expect(snap.yRef.current.get()).toBe(396)
    snap.footerContext.registerFooter('footer', 140)
    expect(snap.yRef.current.get()).toBe(440)
    snap.footerContext.unregisterFooter('footer')
    expect(snap.yRef.current.get()).toBe(300)
  })

  it('preserves an active drag while updating fit geometry', () => {
    const { snap, state } = setup()
    snap.handleSheetLayoutChangeMT({ detail: { height: 300 } })
    state.current = PresenceState.Entered
    snap.snapToMT(0, { animate: false })
    snap.footerContext.registerFooter('footer', 96)
    snap.yRef.current.set(250)
    snap.footerContext.registerFooter('footer', 140)
    expect(snap.getResolvedSnapOffsets()).toEqual([440])
    expect(snap.yRef.current.get()).toBe(250)
  })

  it('allows a footer-only fit sheet', () => {
    const { snap } = setup()
    snap.handleSheetLayoutChangeMT({ detail: { height: 0 } })
    snap.footerContext.registerFooter('footer', 96)
    expect(snap.getResolvedSnapOffsets()).toEqual([96])
  })

  it('removes the final footer from an otherwise empty fit sheet', () => {
    const { snap, state } = setup()
    snap.handleSheetLayoutChangeMT({ detail: { height: 0 } })
    snap.footerContext.registerFooter('footer', 96)
    state.current = PresenceState.Entered
    snap.snapToMT(0, { animate: false })
    snap.footerContext.unregisterFooter('footer')
    expect(snap.getResolvedSnapOffsets()).toEqual([0])
    expect(snap.yRef.current.get()).toBe(0)
  })

  it('does not resurrect a closing sheet when the footer layout changes', () => {
    const { snap, state } = setup()
    snap.handleSheetLayoutChangeMT({ detail: { height: 300 } })
    state.current = PresenceState.Entered
    snap.snapToMT(0, { animate: false })
    snap.footerContext.registerFooter('footer', 96)
    snap.closeMT()
    snap.footerContext.registerFooter('footer', 140)
    expect(state.current).toBe(PresenceState.Leaving)
    vi.advanceTimersByTime(3000)
    expect(snap.yRef.current.get()).toBe(0)
    expect(state.current).toBe(PresenceState.Left)
  })
})
