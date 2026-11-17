// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createMotionValue } from '@lynx-js/motion/mini'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSheetAnimation } from './useSheetAnimation'

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
  // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
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
