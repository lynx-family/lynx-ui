// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createMotionValue } from '@lynx-js/motion/mini'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSheetAnimation } from './useSheetAnimation'
import type { SheetTransitionEvent } from '../types'

vi.mock('@lynx-js/react', () => ({
  useMainThreadRef: <T>(current: T) => ({ current }),
  useMemo: <T>(fn: () => T) => fn(),
  useEffect: vi.fn(),
  runOnMainThread: <T>(fn: T) => fn,
}))
vi.mock('@lynx-js/react/worklet-runtime/bindings', () => ({
  runWorkletCtx: vi.fn(),
}))
vi.mock('@lynx-js/lynx-ui-common', () => ({ noop: () => undefined }))

function setup() {
  const position = createMotionValue(450)
  const animation = useSheetAnimation({ current: position }, {
    type: 'tween',
    duration: 400,
    ease: t => t,
  })
  return { position, ...animation }
}

describe('Sheet animation ownership with the installed motion runtime', () => {
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

  it('holds an interrupted snap and completes it only after resuming', () => {
    const { position, animateToMT, interruptAnimationMT, resumeAnimationMT } =
      setup()
    const complete = vi.fn()
    animateToMT(900, complete)
    vi.advanceTimersByTime(160)
    const held = position.get()
    interruptAnimationMT()
    vi.advanceTimersByTime(500)
    expect(position.get()).toBe(held)
    expect(position.isAnimating()).toBe(false)
    expect(complete).not.toHaveBeenCalled()
    resumeAnimationMT()
    expect(position.get()).toBe(held)
    expect(position.getVelocity()).toBe(0)
    vi.advanceTimersByTime(208)
    expect(complete).not.toHaveBeenCalled()
    vi.advanceTimersByTime(48)
    expect(position.get()).toBe(900)
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('does not report arrival when a drag cancels the animation', () => {
    const { position, animateToMT, stopAnimationMT, resumeAnimationMT } =
      setup()
    const complete = vi.fn()
    animateToMT(900, complete)
    vi.advanceTimersByTime(80)
    stopAnimationMT()
    const held = position.get()
    resumeAnimationMT()
    vi.advanceTimersByTime(500)
    expect(position.get()).toBe(held)
    expect(complete).not.toHaveBeenCalled()
  })

  it('discards the interrupted target when Sheet dragging takes over', () => {
    const {
      position,
      animateToMT,
      interruptAnimationMT,
      stopAnimationMT,
      resumeAnimationMT,
    } = setup()
    const complete = vi.fn()
    animateToMT(900, complete)
    vi.advanceTimersByTime(80)
    interruptAnimationMT()
    stopAnimationMT()
    position.set(600)
    resumeAnimationMT()
    vi.advanceTimersByTime(500)
    expect(position.get()).toBe(600)
    expect(complete).not.toHaveBeenCalled()
  })

  it('lets a new command replace an interrupted target', () => {
    const { position, animateToMT, interruptAnimationMT, resumeAnimationMT } =
      setup()
    const abandoned = vi.fn(), latest = vi.fn()
    animateToMT(900, abandoned)
    vi.advanceTimersByTime(80)
    interruptAnimationMT()
    animateToMT(300, latest)
    resumeAnimationMT()
    vi.advanceTimersByTime(416)
    expect(position.get()).toBe(300)
    expect(abandoned).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledTimes(1)
  })

  it('does not restart a running animation on unrelated touch-up', () => {
    const { position, animateToMT, resumeAnimationMT } = setup()
    const complete = vi.fn()
    animateToMT(900, complete)
    vi.advanceTimersByTime(160)
    resumeAnimationMT()
    vi.advanceTimersByTime(256)
    expect(position.get()).toBe(900)
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('tolerates repeated interruption and end callbacks', () => {
    const { position, animateToMT, interruptAnimationMT, resumeAnimationMT } =
      setup()
    const complete = vi.fn()
    animateToMT(900, complete)
    vi.advanceTimersByTime(80)
    interruptAnimationMT()
    interruptAnimationMT()
    resumeAnimationMT()
    vi.advanceTimersByTime(160)
    resumeAnimationMT()
    vi.advanceTimersByTime(256)
    expect(position.get()).toBe(900)
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('holds and resumes a real spring without retaining its old velocity', () => {
    const position = createMotionValue(450)
    const { animateToMT, interruptAnimationMT, resumeAnimationMT } =
      useSheetAnimation({ current: position }, {
        type: 'spring',
        stiffness: 200,
        damping: 60,
        mass: 1,
      })
    const complete = vi.fn()
    animateToMT(900, complete)
    vi.advanceTimersByTime(160)
    const held = position.get()
    interruptAnimationMT()
    vi.advanceTimersByTime(500)
    expect(position.get()).toBe(held)
    expect(complete).not.toHaveBeenCalled()
    resumeAnimationMT()
    expect(position.getVelocity()).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(position.get()).toBeCloseTo(900, 0)
    expect(complete).toHaveBeenCalledTimes(1)
  })
})

describe('Sheet transition observer', () => {
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

  function observed(initial = 450) {
    const position = createMotionValue(initial)
    const events: SheetTransitionEvent[] = []
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const animation = useSheetAnimation(
      { current: position },
      { type: 'tween', duration: 400, ease: t => t },
      event => events.push(event),
    )
    return { position, events, ...animation }
  }

  const target = { kind: 'snap' as const, target: { index: 1, value: 900 } }

  it('reports progress from the same frames as the Sheet position', () => {
    const { position, events, animateToMT } = observed()
    animateToMT(900, undefined, undefined, target)
    expect(events[0]).toMatchObject({ ...target, phase: 'start', progress: 0 })
    vi.advanceTimersByTime(160)
    expect(events[events.length - 1]?.phase).toBe('frame')
    expect(events[events.length - 1]?.progress).toBeCloseTo(
      (position.get() - 450) / 450,
    )
    vi.advanceTimersByTime(256)
    expect(events[events.length - 1]).toMatchObject({
      ...target,
      phase: 'end',
      progress: 1,
    })
  })

  it('animates companion progress when the Sheet is already at its snap', () => {
    const { position, events, animateToMT } = observed(900)
    animateToMT(900, undefined, undefined, target)
    vi.advanceTimersByTime(160)
    expect(position.get()).toBe(900)
    expect(events[events.length - 1]?.progress).toBeGreaterThan(0)
    expect(events[events.length - 1]?.progress).toBeLessThan(1)
    vi.advanceTimersByTime(256)
    expect(events[events.length - 1]?.phase).toBe('end')
  })

  it('cancels an interruption and starts again from the held position', () => {
    const {
      position,
      events,
      animateToMT,
      interruptAnimationMT,
      resumeAnimationMT,
    } = observed()
    animateToMT(900, undefined, undefined, target)
    vi.advanceTimersByTime(160)
    interruptAnimationMT()
    const held = position.get()
    expect(events[events.length - 1]?.phase).toBe('cancel')
    vi.advanceTimersByTime(500)
    expect(position.get()).toBe(held)
    resumeAnimationMT()
    expect(events[events.length - 1]).toMatchObject({
      phase: 'start',
      progress: 0,
    })
    vi.advanceTimersByTime(256)
    expect(events.filter(event => event.phase === 'end')).toHaveLength(1)
    expect(position.get()).toBe(900)
  })

  it('does not repeat arrival when a zero-distance transition resumes', () => {
    const events: SheetTransitionEvent[] = []
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const { animateToMT, interruptAnimationMT, resumeAnimationMT } =
      useSheetAnimation(
        { current: createMotionValue(900) },
        { type: 'spring', stiffness: 200, damping: 60 },
        event => events.push(event),
      )
    const arrival = vi.fn()
    animateToMT(900, arrival, undefined, target)
    vi.advanceTimersByTime(160)
    expect(arrival).toHaveBeenCalledTimes(1)
    interruptAnimationMT()
    resumeAnimationMT()
    vi.advanceTimersByTime(5000)
    expect(arrival).toHaveBeenCalledTimes(1)
    expect(events.filter(event => event.phase === 'end')).toHaveLength(1)
  })

  it('reports immediate transitions without scheduling animation frames', () => {
    const { position, events, jumpToMT } = observed()
    jumpToMT(900, target)
    expect(position.get()).toBe(900)
    expect(events.map(event => [event.phase, event.progress, event.animated]))
      .toEqual([['start', 0, false], ['frame', 1, false], ['end', 1, false]])
  })
})
