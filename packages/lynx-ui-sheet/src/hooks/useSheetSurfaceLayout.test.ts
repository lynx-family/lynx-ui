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
  useRef: <T>(current: T) => {
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

function parseTranslateY(transform?: string) {
  if (!transform) return 0
  const pair = /translate\([^,]+,\s*([-\d.]+)px\)/.exec(transform)
  if (pair) return Number.parseFloat(pair[1])
  const single = /translateY\(([-\d.]+)px\)/.exec(transform)
  return single ? Number.parseFloat(single[1]) : 0
}

function setup(
  bounded = true,
  bottomGap = 8,
  hasFitSnapPoint = false,
) {
  const position = { current: createMotionValue(400) }
  const presence = { current: PresenceState.Entered }
  const animateChanges = { current: true }
  const movingSurfaceMTRef = { current: null as MainThread.Element | null }
  const clipStyle: Record<string, string> = {}
  const movingStyle: Record<string, string> = {}
  const surfaceStyle: Record<string, string> = {}
  const viewportStyle: Record<string, string> = {}
  const writeClip = vi.fn((style: object) => Object.assign(clipStyle, style))
  const writeMoving = vi.fn((style: object) =>
    Object.assign(movingStyle, style)
  )
  const writeSurface = vi.fn((style: object) =>
    Object.assign(surfaceStyle, style)
  )
  const writeViewport = vi.fn((style: object) =>
    Object.assign(viewportStyle, style)
  )
  const clip = {
    setStyleProperties: writeClip,
  } as unknown as MainThread.Element
  const moving = {
    setStyleProperties: writeMoving,
  } as unknown as MainThread.Element
  const surface = {
    setStyleProperties: writeSurface,
  } as unknown as MainThread.Element
  const viewport = {
    setStyleProperties: writeViewport,
  } as unknown as MainThread.Element
  function render(nextBounded = bounded, nextGap = bottomGap) {
    hooks.cursor = 0
    hooks.subscriptionCursor = 0
    hooks.effects = []
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const layout = useSheetSurfaceLayout({
      position,
      presence,
      animateChanges,
      resolvedSide: 'bottom',
      panelLayout: nextBounded ? { bottomGap: nextGap } : undefined,
      screenHeight: 1000,
      maxSnapSize: 800,
      hasFitSnapPoint,
      movingSurfaceMTRef,
      initialSize: () => 400,
      initialSnap: 0,
      snapAnimation: { type: 'tween', duration: 200 },
    })
    layout.setClipMTRef(clip)
    layout.setSheetMTRef(moving)
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
    movingStyle,
    surfaceStyle,
    viewportStyle,
    writeClip,
    writeMoving,
    writeSurface,
    writeViewport,
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

  it('performs zero layout writes on attached sheets during mount and dragging', () => {
    const { position, writeClip, writeSurface, writeViewport, movingStyle } =
      setup(false, 0)
    expect(writeClip).not.toHaveBeenCalled()
    expect(writeSurface).not.toHaveBeenCalled()
    expect(writeViewport).not.toHaveBeenCalled()
    expect(movingStyle.transform).toBe('translate(0px, -400px)')

    position.current.set(850)
    expect(writeClip).not.toHaveBeenCalled()
    expect(writeSurface).not.toHaveBeenCalled()
    expect(writeViewport).not.toHaveBeenCalled()
    expect(movingStyle.transform).toBe('translate(0px, -850px)')
  })

  it('keeps the external gap via compositor transforms without per-frame clip or viewport layout', () => {
    const {
      position,
      clipStyle,
      movingStyle,
      surfaceStyle,
      writeClip,
      writeViewport,
    } = setup()
    expect(clipStyle).toEqual({ transform: 'translateY(-8px)' })
    expect(movingStyle).toEqual({ transform: 'translate(0px, -400px)' })
    expect(surfaceStyle).toEqual({ height: '400px' })
    expect(writeViewport).not.toHaveBeenCalled()

    writeClip.mockClear()
    position.current.set(850)
    const visualTop = 1000
      + parseTranslateY(clipStyle.transform)
      + parseTranslateY(movingStyle.transform)
    expect(visualTop + Number.parseFloat(surfaceStyle.height)).toBe(992)
    expect(writeClip).not.toHaveBeenCalled()
    expect(writeViewport).not.toHaveBeenCalled()
    position.current.set(300)
    expect(surfaceStyle.height).toBe('300px')
  })

  it('keeps the bounded panel top inside the viewport at the maximum drag even without a body', () => {
    const {
      position,
      render,
      animateChanges,
      clipStyle,
      movingStyle,
      surfaceStyle,
    } = setup()
    position.current.set(1000)
    expect(
      1000 + parseTranslateY(clipStyle.transform)
        + parseTranslateY(movingStyle.transform),
    ).toBe(0)
    expect(surfaceStyle.height).toBe('992px')
    animateChanges.current = false
    render(true, 0)
    expect(surfaceStyle.height).toBe('1000px')
  })

  it('allows native refs to attach before the motion value is initialized', () => {
    const { position, setSurfaceMTRef } = setup()
    Object.assign(position, { current: null })
    expect(() => setSurfaceMTRef({} as MainThread.Element)).not.toThrow()
  })

  it('supports a bounded surface with no external gap', () => {
    const { clipStyle, movingStyle, surfaceStyle } = setup(true, 0)
    expect(clipStyle).toEqual({})
    expect(movingStyle).toEqual({ transform: 'translate(0px, -400px)' })
    expect(surfaceStyle).toEqual({ height: '400px' })
  })

  it('does not constrain intrinsic fit measurement with the viewport', () => {
    const { position, viewportStyle } = setup(true, 8, true)
    position.current.set(450)
    expect(viewportStyle).toEqual({})
  })

  it('translates a complete card through entry and dismissal without clip layout', () => {
    const { position, presence, clipStyle, movingStyle, surfaceStyle } = setup()
    presence.current = PresenceState.Leaving
    position.current.set(100)
    expect(clipStyle).toEqual({ transform: 'translateY(0px)' })
    expect(movingStyle).toEqual({ transform: 'translate(0px, -102px)' })
    expect(surfaceStyle).toEqual({ height: '400px' })
    position.current.set(0)
    expect(movingStyle).toEqual({ transform: 'translate(0px, 0px)' })
    presence.current = PresenceState.Entering
    position.current.set(100)
    expect(surfaceStyle.height).toBe('400px')
  })

  it('redirects a mode transition from its current rendered inset', () => {
    const { render, clipStyle, surfaceStyle } = setup()
    render(false, 0)
    expect(clipStyle.transform).toBe('translateY(-8px)')
    vi.advanceTimersByTime(96)
    const interruptedClip = parseTranslateY(clipStyle.transform)
    expect(interruptedClip).toBeGreaterThan(-8)
    expect(interruptedClip).toBeLessThan(0)
    render(true, 8)
    expect(parseTranslateY(clipStyle.transform)).toBe(interruptedClip)
    vi.advanceTimersByTime(500)
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(surfaceStyle).toEqual({ height: '400px' })
  })

  it('makes an immediate snap appearance change immediate too', () => {
    const { render, animateChanges, clipStyle, surfaceStyle } = setup()
    animateChanges.current = false
    render(false, 0)
    expect(clipStyle.transform).toBe('translateY(0px)')
    expect(surfaceStyle).toEqual({ height: '1500px' })
  })

  it.each([-8, Number.NaN, Number.POSITIVE_INFINITY])(
    'normalizes invalid insets: %s',
    inset => {
      const { clipStyle, movingStyle } = setup(true, inset)
      expect(clipStyle).toEqual({})
      expect(movingStyle).toEqual({ transform: 'translate(0px, -400px)' })
    },
  )
})
