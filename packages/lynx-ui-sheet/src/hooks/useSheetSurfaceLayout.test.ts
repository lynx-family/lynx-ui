// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
import type * as MotionMini from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSheetSurfaceLayout } from './useSheetSurfaceLayout'

const hooks = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effects: [] as Array<() => unknown>,
  subscriptions: [] as Array<() => void>,
  subscriptionCursor: 0,
}))

vi.mock('@lynx-js/react', () => ({
  useMainThreadRef: <T>(current: T) => {
    const index = hooks.cursor++
    hooks.slots[index] ??= { current }
    return hooks.slots[index]
  },
  useEffect: (effect: () => unknown) => hooks.effects.push(effect),
  runOnMainThread: <T>(fn: T) => fn,
}))
vi.mock(
  '@lynx-js/react/worklet-runtime/bindings',
  () => ({ runWorkletCtx: vi.fn() }),
)
vi.mock('@lynx-js/lynx-ui-common', () => ({ noop: () => undefined }))
vi.mock('@lynx-js/lynx-ui-presence', () => ({
  PresenceState: {
    Left: 'left',
    Entering: 'entering',
    Entered: 'entered',
    Leaving: 'leaving',
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

function setup(detached = true, bottomInset = 8, hasFitSnapPoint = false) {
  const position = { current: createMotionValue(400) }
  const presence = { current: PresenceState.Entered }
  const animateChanges = { current: true }
  const clipStyle: Record<string, string> = {}
  const surfaceStyle: Record<string, string> = {}
  const viewportStyle: Record<string, string> = {}
  const clip = {
    setStyleProperties: (style: object) => Object.assign(clipStyle, style),
  } as unknown as MainThread.Element
  const surface = {
    setStyleProperties: (style: object) => Object.assign(surfaceStyle, style),
  } as unknown as MainThread.Element
  const viewport = {
    setStyleProperties: (style: object) => Object.assign(viewportStyle, style),
  } as unknown as MainThread.Element
  function render(nextDetached = detached, nextInset = bottomInset) {
    hooks.cursor = 0
    hooks.subscriptionCursor = 0
    hooks.effects = []
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const layout = useSheetSurfaceLayout({
      position,
      presence,
      animateChanges,
      resolvedSide: 'bottom',
      detached: nextDetached,
      bottomInset: nextInset,
      screenHeight: 1000,
      maxSnapSize: 800,
      hasFitSnapPoint,
      initialSize: () => 400,
      initialSnap: 0,
      snapAnimation: { type: 'tween', duration: 200 },
    })
    layout.setClipMTRef(clip)
    layout.setSurfaceMTRef(surface)
    layout.setViewportMTRef(viewport)
    hooks.effects[0]()
    return layout
  }
  const layout = render()
  return {
    ...layout,
    render,
    position,
    presence,
    animateChanges,
    clipStyle,
    surfaceStyle,
    viewportStyle,
  }
}

describe('Sheet surface geometry', () => {
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

  it('preserves extended attached coverage and the maximum content size', () => {
    const { position, surfaceStyle, viewportStyle } = setup(false, 0)
    expect(surfaceStyle).toEqual({ top: '0px', height: '1500px' })
    expect(viewportStyle.height).toBe('800px')
    position.current.set(850)
    expect(surfaceStyle.height).toBe('1500px')
  })

  it('clips attached background coverage before the external bottom gap', () => {
    const { clipStyle, surfaceStyle } = setup(false, 8)
    expect(clipStyle.bottom).toBe('8px')
    expect(surfaceStyle).toEqual({ top: '0px', height: '1500px' })
  })

  it('keeps the external gap at a smaller snap and through rubber banding', () => {
    const { position, surfaceStyle, viewportStyle } = setup()
    expect(surfaceStyle).toEqual({ top: '-8px', height: '400px' })
    expect(viewportStyle.height).toBe('400px')
    position.current.set(850)
    const top = 1000 - 850 + Number.parseFloat(surfaceStyle.top)
    expect(top + Number.parseFloat(surfaceStyle.height)).toBe(992)
    expect(viewportStyle.height).toBe('850px')
    position.current.set(300)
    expect(surfaceStyle.height).toBe('300px')
  })

  it('allows native refs to attach before the motion value is initialized', () => {
    const { position, setSurfaceMTRef } = setup()
    Object.assign(position, { current: null })
    expect(() => setSurfaceMTRef({} as MainThread.Element)).not.toThrow()
  })

  it('supports a bounded surface with no external gap', () => {
    expect(setup(true, 0).surfaceStyle).toEqual({ top: '0px', height: '400px' })
  })

  it('does not constrain intrinsic fit measurement with the animated viewport', () => {
    const { position, viewportStyle } = setup(true, 8, true)
    position.current.set(450)
    expect(viewportStyle).toEqual({})
  })

  it('translates a complete card through entry and dismissal', () => {
    const { position, presence, surfaceStyle } = setup()
    presence.current = PresenceState.Leaving
    position.current.set(100)
    expect(surfaceStyle).toEqual({ top: '-2px', height: '400px' })
    position.current.set(0)
    expect(surfaceStyle).toEqual({ top: '0px', height: '400px' })
    presence.current = PresenceState.Entering
    position.current.set(100)
    expect(surfaceStyle.height).toBe('400px')
  })

  it('redirects a mode transition from its current rendered inset', () => {
    const { render, surfaceStyle, viewportStyle } = setup()
    render(false, 0)
    expect(surfaceStyle.top).toBe('-8px')
    vi.advanceTimersByTime(96)
    const interruptedInset = surfaceStyle.top
    expect(Number.parseFloat(interruptedInset)).toBeGreaterThan(-8)
    expect(Number.parseFloat(interruptedInset)).toBeLessThan(0)
    render(true, 8)
    expect(surfaceStyle.top).toBe(interruptedInset)
    vi.advanceTimersByTime(500)
    expect(surfaceStyle).toEqual({ top: '-8px', height: '400px' })
    expect(viewportStyle.height).toBe('400px')
  })

  it('makes an immediate snap appearance change immediate too', () => {
    const { render, animateChanges, surfaceStyle } = setup()
    animateChanges.current = false
    render(false, 0)
    expect(surfaceStyle).toEqual({ top: '0px', height: '1500px' })
  })

  it.each([-8, Number.NaN, Number.POSITIVE_INFINITY])(
    'normalizes invalid insets: %s',
    inset => {
      expect(setup(true, inset).surfaceStyle.top).toBe('0px')
    },
  )
})
