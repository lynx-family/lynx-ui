// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
import type * as MotionMini from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SheetPositionerDimensions } from '../context'
import type { SheetSide } from '../types'
import { useSnap } from './useSnap'

const hooks = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effects: [] as Array<() => unknown>,
  subscriptions: [] as Array<() => void>,
  subscriptionCursor: 0,
}))

function persistentRef<T>(current: T) {
  const index = hooks.cursor++
  hooks.slots[index] ??= { current }
  return hooks.slots[index]
}

vi.mock('@lynx-js/react', () => ({
  useMainThreadRef: <T>(current: T) => persistentRef(current),
  useRef: <T>(current: T) => persistentRef(current),
  useMemo: <T>(fn: () => T) => fn(),
  useEffect: (effect: () => unknown) => hooks.effects.push(effect),
  runOnMainThread: <T>(fn: T) => fn,
  runOnBackground: <T>(fn: T) => fn,
}))
vi.mock(
  '@lynx-js/react/worklet-runtime/bindings',
  () => ({ runWorkletCtx: vi.fn() }),
)
vi.mock('@lynx-js/lynx-ui-common', () => ({
  noop: () => undefined,
  useMemoizedFn: <T>(fn: T) => fn,
}))
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
  useMotionValueRef: (value: number) => {
    const index = hooks.cursor++
    hooks.slots[index] ??= { current: createMotionValue(value) }
    return hooks.slots[index]
  },
  useMotionValueRefEvent: (
    ref: { current: ReturnType<typeof createMotionValue<number>> },
    event: 'change',
    fn: (value: number) => void,
  ) => {
    const index = hooks.subscriptionCursor++
    hooks.subscriptions[index]?.()
    hooks.subscriptions[index] = ref.current.on(event, fn)
  },
}))

function setup(
  side: SheetSide = 'bottom',
  snapPoints: Array<number | string> = ['50%', '85%'],
) {
  const presence = { current: PresenceState.Left }
  const entered = vi.fn()
  const snapStarted = vi.fn()
  const changed = vi.fn()
  const surfaceStyle: Record<string, string> = {}
  const viewportStyle: Record<string, string> = {}
  function render(
    positioner: SheetPositionerDimensions | null,
    effects = true,
  ) {
    hooks.cursor = 0
    hooks.subscriptionCursor = 0
    hooks.effects = []
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const snap = useSnap({
      snapPoints,
      side,
      enableRTL: true,
      screenHeight: 800,
      screenWidth: 400,
      positioner,
      presenceStateMTRef: presence,
      onEntered: entered,
      onSnapStartMT: snapStarted,
      onSnapChange: changed,
    })
    snap.setSheetMTRef({
      setStyleProperties: () => undefined,
    } as unknown as MainThread.Element)
    snap.setSurfaceMTRef({
      setStyleProperties: (style: object) => Object.assign(surfaceStyle, style),
    } as unknown as MainThread.Element)
    snap.setViewportMTRef({
      setStyleProperties: (style: object) =>
        Object.assign(viewportStyle, style),
    } as unknown as MainThread.Element)
    if (effects) {
      for (const effect of hooks.effects) effect()
    }
    return snap
  }
  return {
    render,
    presence,
    entered,
    snapStarted,
    changed,
    surfaceStyle,
    viewportStyle,
  }
}

describe('Sheet local viewport calculations and resizing', () => {
  beforeEach(() => {
    hooks.slots = []
    hooks.subscriptions = []
    vi.useFakeTimers()
    vi.stubGlobal(
      'requestAnimationFrame',
      (fn: () => void) => setTimeout(fn, 16),
    )
  })
  afterEach(() => {
    for (const unsubscribe of hooks.subscriptions) unsubscribe()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it.each(['top', 'bottom', 'left', 'right', 'start', 'end'] as const)(
    'opens %s from local dimensions without a layout event or effect',
    side => {
      const { render, entered } = setup(side)
      const snap = render({ width: 300, height: 480 }, false)
      snap.showMT()
      vi.advanceTimersByTime(16)
      expect(snap.yRef.current.get()).toBeGreaterThan(0)
      vi.advanceTimersByTime(3000)
      expect(snap.yRef.current.get()).toBe(
        side === 'top' || side === 'bottom' ? 240 : 150,
      )
      expect(entered).toHaveBeenCalledTimes(1)
    },
  )

  it('keeps legacy percentage opening independent of layout and local effects', () => {
    const { render } = setup()
    const snap = render(null, false)
    snap.showMT({ animate: false })
    expect(snap.yRef.current.get()).toBe(400)
    expect(snap.viewportSize).toBe(800)
  })

  it('retains the selected index and immediately resizes an idle percentage snap', () => {
    const { render, changed, viewportStyle, surfaceStyle } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.snapToMT(1, { animate: false })
    const resized = render({ width: 220, height: 320 })
    expect(resized.yRef).toBe(snap.yRef)
    expect(resized.yRef.current.get()).toBe(272)
    expect(resized.getResolvedSnapOffsets()).toEqual([160, 272])
    expect(viewportStyle.height).toBe('272px')
    expect(surfaceStyle.height).toBe('480px')
    expect(changed).toHaveBeenCalledTimes(1)
  })

  it('retargets an opening animation from its current position', () => {
    const { render, entered, snapStarted } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT()
    vi.advanceTimersByTime(32)
    const position = snap.yRef.current.get()
    const resized = render({ width: 220, height: 320 })
    expect(resized.yRef.current.get()).toBe(position)
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(160)
    expect(entered).toHaveBeenCalledTimes(1)
    expect(snapStarted).not.toHaveBeenCalled()
  })

  it('retargets the requested snap rather than the last completed snap', () => {
    const { render, snapStarted, changed } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.snapToMT(1)
    vi.advanceTimersByTime(32)
    const resized = render({ width: 220, height: 320 })
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(272)
    expect(snapStarted).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenLastCalledWith(1, 272)
  })

  it('keeps a scroll-interrupted snap frozen and resumes toward the new target', () => {
    const { render } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.snapToMT(1)
    vi.advanceTimersByTime(32)
    snap.interruptAnimationMT()
    const position = snap.yRef.current.get()
    const resized = render({ width: 220, height: 320 })
    vi.advanceTimersByTime(500)
    expect(resized.yRef.current.get()).toBe(position)
    resized.resumeAnimationMT()
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(272)
  })

  it('preserves a drag while replacing its snap boundaries', () => {
    const { render } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.onDragStartMT()
    snap.yRef.current.set(200)
    const resized = render({ width: 220, height: 320 })
    expect(resized.yRef.current.get()).toBe(200)
    expect(resized.getResolvedSnapOffsets()).toEqual([160, 272])
    resized.onDragEndSnapMT(0)
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(160)
  })

  it('does not reopen a closing sheet on resize', () => {
    const { render, presence, entered } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.closeMT()
    const resized = render({ width: 220, height: 320 })
    expect(presence.current).toBe(PresenceState.Leaving)
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(0)
    expect(presence.current).toBe(PresenceState.Left)
    expect(entered).toHaveBeenCalledTimes(1)
  })

  it('remeasures fit content while percentages use the resized local basis', () => {
    const { render } = setup('bottom', ['fit', '85%'])
    const snap = render({ width: 300, height: 480 })
    snap.handleSheetLayoutChangeMT({ detail: { height: 180 } })
    snap.showMT({ animate: false })
    const resized = render({ width: 220, height: 320 })
    resized.handleSheetLayoutChangeMT({ detail: { height: 230 } })
    expect(resized.getResolvedSnapOffsets()).toEqual([230, 272])
    expect(resized.yRef.current.get()).toBe(230)
  })
})
