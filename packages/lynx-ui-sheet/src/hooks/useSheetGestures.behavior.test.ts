// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import { setupSheetScrollGestureRelations } from './gestureRelations'
import {
  useSheetNativeScrollGesture,
  useSheetPanGesture,
} from './useSheetGestures'

const runtime = vi.hoisted(() => {
  interface Event {
    params: {
      pageX: number
      pageY: number
      isAtStart?: boolean | number
      isAtEnd?: boolean | number
      scrollY?: number
    }
    currentTarget?: { invoke: () => Promise<{ scrollY: number }> }
  }
  interface Manager {
    consumeGesture: (value: boolean) => void
    fail: () => void
  }
  type Callback = (event: Event, manager: Manager) => void
  class Gesture {
    execId = 0
    callbacks: Record<string, Callback> = {}
    waitFor: unknown[] = []
    continueWith: unknown[] = []
    simultaneousWith: unknown[] = []
    enabled() {
      return this
    }
    minDistance() {
      return this
    }
    updateConfig() {
      return this
    }
    onBegin(fn: Callback) {
      this.callbacks.begin = fn
      return this
    }
    onUpdate(fn: Callback) {
      this.callbacks.update = fn
      return this
    }
    onEnd(fn: Callback) {
      this.callbacks.end = fn
      return this
    }
    onTouchesDown(fn: Callback) {
      this.callbacks.down = fn
      return this
    }
    onTouchesMove(fn: Callback) {
      this.callbacks.move = fn
      return this
    }
    onTouchesUp(fn: Callback) {
      this.callbacks.up = fn
      return this
    }
    onTouchesCancel(fn: Callback) {
      this.callbacks.cancel = fn
      return this
    }
    externalWaitFor = (g: unknown) => {
      this.waitFor.push(g)
      return this
    }
    externalContinueWith = (g: unknown) => {
      this.continueWith.push(g)
      return this
    }
    externalSimultaneous = (g: unknown) => {
      this.simultaneousWith.push(g)
      return this
    }
  }
  return { Gesture }
})

vi.mock(
  '@lynx-js/react',
  () => ({
    useMainThreadRef: <T>(current: T) => ({ current }),
    useRef: <T>(current: T) => ({ current }),
  }),
)
vi.mock('@lynx-js/gesture-runtime', () => ({
  NativeGesture: runtime.Gesture,
  PanGesture: runtime.Gesture,
  useGesture: () => new runtime.Gesture(),
}))
vi.mock('../context', () => ({ useSheetGestureContext: () => ({}) }))
vi.mock('@lynx-js/lynx-ui-presence', () => ({ PresenceState: {} }))

function makeManager() {
  return { consumeGesture: vi.fn(), fail: vi.fn() }
}
function event(pageY: number, pageX = 0) {
  return { params: { pageX, pageY } }
}
function makePan(offsets = [450, 900], overrides = {}) {
  let value = 450
  const motion = {
    get: () => value,
    set: (next: number) => {
      value = next
    },
    getVelocity: () => 0,
    updateVelocity: vi.fn(),
  }
  const scrollManager = makeManager()
  const options = {
    activeScrollMTRef: { current: { manager: scrollManager, atStart: true } },
    yRef: { current: motion },
    viewportSize: 1000,
    rubberBand: false,
    sheetSizeMTRef: { current: 900 },
    getResolvedSnapOffsets: () => offsets,
    onSnapChangeMT: vi.fn(),
    onGestureStartMT: vi.fn(),
    onGestureEndMT: vi.fn(),
    onDragStartMT: vi.fn(),
    onDragEndSnapMT: vi.fn(),
    onDragEndCloseMT: vi.fn(),
    onReleaseAtMaxMT: vi.fn(),
    ...overrides,
  }
  // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
  const pan = useSheetPanGesture(
    options as unknown as Parameters<typeof useSheetPanGesture>[0],
  )
  const gesture = pan.gesture as unknown as InstanceType<typeof runtime.Gesture>
  return {
    gesture,
    motion,
    options,
    scrollManager,
    finishTouchMT: pan.finishTouchMT,
  }
}

describe('native scroll coordination', () => {
  function native(
    options?: {
      sheetGesture?: object
      active?: { current: unknown }
      resolvedSide?: 'top' | 'bottom' | 'left' | 'right'
      minDistance?: number
    },
  ) {
    const active = options?.active ?? { current: null }
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const gesture = useSheetNativeScrollGesture(
      {
        sheetGesture: options?.sheetGesture ?? {},
        activeScrollMTRef: active,
        resolvedSide: options?.resolvedSide ?? 'bottom',
        minDistance: options?.minDistance,
        position: { current: { get: () => 900 } },
        getResolvedSnapOffsets: () => [450, 900],
      } as unknown as Parameters<typeof useSheetNativeScrollGesture>[0],
    ) as unknown as InstanceType<typeof runtime.Gesture>
    return {
      gesture,
      active: active as {
        current: { atStart?: boolean, atEnd?: boolean } | null
      },
    }
  }
  function down(
    pageY: number,
    query: Promise<{ scrollY: number }>,
    atStart?: boolean,
  ) {
    return {
      params: {
        pageX: 0,
        pageY,
        ...(atStart === undefined ? {} : { isAtStart: atStart }),
      },
      currentTarget: { invoke: () => query },
    }
  }
  function deferred() {
    let resolve!: (value: { scrollY: number }) => void
    const promise = new Promise<{ scrollY: number }>(r => {
      resolve = r
    })
    return { promise, resolve }
  }
  it('notifies the maximum snap after expanding and handing off to content', () => {
    const { gesture, motion, options } = makePan()
    const manager = makeManager()
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(0), manager)
    expect(motion.get()).toBe(900)
    gesture.callbacks.update(event(-20), manager)
    gesture.callbacks.up(event(-20), manager)
    expect(options.onSnapChangeMT).toHaveBeenCalledWith(1, 900)
    expect(options.onDragEndSnapMT).not.toHaveBeenCalled()
    expect(options.onReleaseAtMaxMT).toHaveBeenCalledWith(1)
  })
  it('does not emit a max-snap release when the content alone moved', () => {
    const { gesture, motion, options } = makePan()
    const manager = makeManager()
    motion.set(900)
    options.activeScrollMTRef.current.atStart = false
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(450), manager)
    gesture.callbacks.up(event(450), manager)
    expect(options.onReleaseAtMaxMT).not.toHaveBeenCalled()
  })

  it('does not emit a max-snap release after touch cancellation', () => {
    const { gesture, options } = makePan()
    const manager = makeManager()
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(0), manager)
    gesture.callbacks.update(event(-20), manager)
    gesture.callbacks.cancel(event(-20), manager)
    gesture.callbacks.up(event(-20), manager)
    expect(options.onReleaseAtMaxMT).not.toHaveBeenCalled()
  })

  it('does not repeat a native consumption command while the owner stays Sheet', () => {
    const { gesture, scrollManager } = makePan()
    const manager = makeManager()
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(490), manager)
    gesture.callbacks.update(event(480), manager)
    gesture.callbacks.update(event(470), manager)
    expect(scrollManager.consumeGesture.mock.calls).toEqual([[false]])
  })

  it('interrupts settling before native content owns a new main-axis drag', () => {
    const { gesture, motion, options } = makePan()
    const manager = makeManager()
    motion.set(900)
    options.activeScrollMTRef.current.atStart = false
    gesture.callbacks.begin(event(100), manager)
    gesture.callbacks.update(event(120), manager)
    gesture.callbacks.update(event(140), manager)
    expect(options.onGestureStartMT).toHaveBeenCalledTimes(1)
    expect(options.onDragStartMT).not.toHaveBeenCalled()
    expect(motion.get()).toBe(900)
    gesture.callbacks.up(event(140), manager)
    expect(options.onGestureEndMT).not.toHaveBeenCalled()
  })

  it('does not interrupt a zero-delta or cross-axis gesture', () => {
    const { gesture, options } = makePan()
    const manager = makeManager()
    gesture.callbacks.begin(event(100), manager)
    gesture.callbacks.update(event(100), manager)
    gesture.callbacks.update(event(101, 40), manager)
    expect(options.onGestureStartMT).not.toHaveBeenCalled()
  })

  it('ends a header interaction only once across pan end and touch-up', () => {
    const { gesture, options } = makePan([450, 900], {
      activeScrollMTRef: { current: null },
    })
    const manager = makeManager()
    gesture.callbacks.begin(event(100), manager)
    gesture.callbacks.update(event(120), manager)
    gesture.callbacks.up(event(120), manager)
    gesture.callbacks.up(event(120), manager)
    expect(options.onGestureEndMT).toHaveBeenCalledTimes(1)
  })

  it.each(['up', 'cancel'])(
    'resumes settling when native touch %s clears ownership',
    phase => {
      const onScrollEndMT = vi.fn()
      const active = { current: null }
      const gesture = useSheetNativeScrollGesture(
        {
          sheetGesture: {},
          activeScrollMTRef: active,
          resolvedSide: 'bottom',
          position: { current: { get: () => 900 } },
          getResolvedSnapOffsets: () => [450, 900],
          onScrollEndMT,
        } as unknown as Parameters<typeof useSheetNativeScrollGesture>[0],
      ) as unknown as InstanceType<typeof runtime.Gesture>
      const manager = makeManager()
      gesture.callbacks.down(
        down(100, Promise.resolve({ scrollY: 80 }), false),
        manager,
      )
      gesture.callbacks[phase](event(100), manager)
      expect(active.current).toBeNull()
      expect(onScrollEndMT).toHaveBeenCalledTimes(1)
    },
  )

  it('queries the boundary only when native fields are absent', async () => {
    const { gesture, active } = native()
    const manager = makeManager(), query = deferred()
    const target = { invoke: vi.fn(() => query.promise) }
    gesture.callbacks.down({
      params: { pageX: 0, pageY: 100 },
      currentTarget: target,
    }, manager)
    expect(target.invoke).toHaveBeenCalledWith('getScrollInfo')
    query.resolve({ scrollY: 0 })
    await query.promise
    expect(active.current?.atStart).toBe(true)
    gesture.callbacks.up(event(100), manager)
    target.invoke.mockClear()
    gesture.callbacks.down({
      params: { pageX: 0, pageY: 100, isAtStart: true },
      currentTarget: target,
    }, manager)
    expect(target.invoke).not.toHaveBeenCalled()
  })

  it.each([true, 1])('accepts native start-boundary value %s', atStart => {
    const { gesture, active } = native()
    const manager = makeManager()
    gesture.callbacks.down(down(100, Promise.resolve({ scrollY: 80 })), manager)
    gesture.callbacks.update({
      params: { pageX: 0, pageY: 110, isAtStart: atStart },
    }, manager)
    expect(active.current?.atStart).toBe(true)
  })

  it.each([true, 1])(
    'retains native end-boundary value %s across updates',
    atEnd => {
      const { gesture, active } = native()
      const manager = makeManager()
      gesture.callbacks.down({
        params: { pageX: 0, pageY: 100, isAtStart: true, isAtEnd: atEnd },
      }, manager)
      expect(active.current?.atEnd).toBe(true)
      gesture.callbacks.update(event(90), manager)
      expect(active.current?.atEnd).toBe(true)
      gesture.callbacks.update({
        params: { pageX: 0, pageY: 80, isAtStart: false, isAtEnd: false },
      }, manager)
      expect(active.current?.atEnd).toBe(false)
    },
  )

  it.each(['start', 'end'] as const)(
    'does not combine a new %s boundary with the other stale boundary',
    boundary => {
      const { gesture, active } = native()
      const manager = makeManager()
      gesture.callbacks.down({
        params: {
          pageX: 0,
          pageY: 100,
          isAtStart: boundary === 'end',
          isAtEnd: boundary === 'start',
        },
      }, manager)
      gesture.callbacks.update({
        params: {
          pageX: 0,
          pageY: 90,
          ...(boundary === 'start' ? { isAtStart: true } : { isAtEnd: true }),
        },
      }, manager)
      expect(
        boundary === 'start' ? active.current?.atEnd : active.current?.atStart,
      ).toBeUndefined()
    },
  )

  it('does not switch native consumption during a stationary boundary update', () => {
    const { gesture } = native()
    const manager = makeManager()
    gesture.callbacks.down({
      params: { pageX: 0, pageY: 100, isAtStart: true, isAtEnd: true },
    }, manager)
    gesture.callbacks.begin(event(100), manager)
    gesture.callbacks.update(event(90), manager)
    manager.consumeGesture.mockClear()
    gesture.callbacks.update({
      params: { pageX: 0, pageY: 90, isAtStart: false, isAtEnd: false },
    }, manager)
    expect(manager.consumeGesture).not.toHaveBeenCalled()
  })

  it('leaves a cross-axis child gesture free to scroll', () => {
    const { gesture, motion, options } = makePan()
    const manager = makeManager()
    gesture.callbacks.begin(event(100, 0), manager)
    gesture.callbacks.update(event(101, 40), manager)
    expect(motion.get()).toBe(450)
    expect(options.onDragStartMT).not.toHaveBeenCalled()
    expect(manager.fail).toHaveBeenCalled()
  })

  it('releases the native coordinator for a cross-axis child', () => {
    const { gesture } = native()
    const manager = makeManager()
    gesture.callbacks.down(
      down(100, Promise.resolve({ scrollY: 0 }), true),
      manager,
    )
    gesture.callbacks.update({
      params: { pageX: 40, pageY: 101, isAtStart: true },
    }, manager)
    expect(manager.consumeGesture).toHaveBeenCalledWith(true)
    expect(manager.fail).toHaveBeenCalled()
  })

  it('keeps a content-owned vertical pan active while reversing past its origin', () => {
    const { gesture, motion, options } = makePan()
    const manager = makeManager()
    motion.set(900)
    options.activeScrollMTRef.current.atStart = false
    gesture.callbacks.begin(event(500, 100), manager)
    gesture.callbacks.update(event(200, 106), manager)
    gesture.callbacks.update(event(500, 112), manager)
    expect(manager.fail).not.toHaveBeenCalled()
    options.activeScrollMTRef.current.atStart = true
    gesture.callbacks.update(event(650, 110), manager)
    expect(motion.get()).toBe(750)
  })

  it('keeps native boundary updates active while reversing past the touch origin', () => {
    const { gesture, active } = native()
    const manager = makeManager()
    gesture.callbacks.down({
      params: { pageX: 100, pageY: 500, isAtStart: true },
    }, manager)
    gesture.callbacks.update({
      params: { pageX: 106, pageY: 200, isAtStart: false },
    }, manager)
    gesture.callbacks.update({
      params: { pageX: 112, pageY: 500, isAtStart: false },
    }, manager)
    expect(manager.fail).not.toHaveBeenCalled()
    gesture.callbacks.update({
      params: { pageX: 110, pageY: 650, isAtStart: true },
    }, manager)
    expect(active.current?.atStart).toBe(true)
  })

  it('waits for meaningful displacement before classifying native touch jitter', () => {
    const { gesture, active } = native()
    const manager = makeManager()
    gesture.callbacks.down({
      params: { pageX: 100, pageY: 500, isAtStart: true },
    }, manager)
    gesture.callbacks.update({
      params: { pageX: 102, pageY: 501, isAtStart: true },
    }, manager)
    expect(manager.fail).not.toHaveBeenCalled()
    gesture.callbacks.update({
      params: { pageX: 102, pageY: 450, isAtStart: false },
    }, manager)
    expect(active.current?.atStart).toBe(false)
    gesture.callbacks.update({
      params: { pageX: 103, pageY: 520, isAtStart: true },
    }, manager)
    expect(active.current?.atStart).toBe(true)
    expect(manager.fail).not.toHaveBeenCalled()
  })

  it.each([0, 3, 12])(
    'uses the configured %s pixel recognition distance for the native coordinator',
    minDistance => {
      const { gesture } = native({ minDistance })
      const manager = makeManager()
      gesture.callbacks.down({
        params: { pageX: 100, pageY: 500, isAtStart: true },
      }, manager)
      gesture.callbacks.update({
        params: {
          pageX: 100 + minDistance,
          pageY: 500 + minDistance / 2,
          isAtStart: true,
        },
      }, manager)
      expect(manager.fail).not.toHaveBeenCalled()
      gesture.callbacks.update({
        params: {
          pageX: 100 + minDistance,
          pageY: 450 - minDistance,
          isAtStart: false,
        },
      }, manager)
      expect(manager.fail).not.toHaveBeenCalled()
      gesture.callbacks.up(event(450 - minDistance), manager)
      gesture.callbacks.down({
        params: { pageX: 100, pageY: 500, isAtStart: true },
      }, manager)
      gesture.callbacks.update({
        params: { pageX: 101 + minDistance, pageY: 500, isAtStart: true },
      }, manager)
      expect(manager.fail).toHaveBeenCalledTimes(1)
    },
  )

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'keeps the %s main axis through repeated origin crossings',
    side => {
      const active = { current: null }
      const { gesture: pan, motion } = makePan([450, 900], {
        side,
        activeScrollMTRef: active,
      })
      motion.set(900)
      const { gesture: scroll } = native({ active, resolvedSide: side })
      const panManager = makeManager(), scrollManager = makeManager()
      const horizontal = side === 'left' || side === 'right'
      const start = event(500, 100)
      scroll.callbacks.down({
        ...start,
        params: { ...start.params, isAtStart: false },
      }, scrollManager)
      pan.callbacks.begin(start, panManager)
      const coordinates = horizontal
        ? [event(506, 400), event(512, 100), event(510, -100), event(511, 400)]
        : [event(200, 106), event(500, 112), event(700, 110), event(200, 111)]
      for (const point of coordinates) {
        scroll.callbacks.update({
          ...point,
          params: { ...point.params, isAtStart: false },
        }, scrollManager)
        pan.callbacks.update(point, panManager)
      }
      expect(panManager.fail).not.toHaveBeenCalled()
      expect(scrollManager.fail).not.toHaveBeenCalled()
      expect(motion.get()).toBe(900)
    },
  )

  it('classifies a new touch independently after a vertical interaction ends', () => {
    const { gesture } = native()
    const manager = makeManager()
    gesture.callbacks.down(
      down(500, Promise.resolve({ scrollY: 0 }), true),
      manager,
    )
    gesture.callbacks.update(event(200, 5), manager)
    gesture.callbacks.up(event(200, 5), manager)
    gesture.callbacks.down(
      down(500, Promise.resolve({ scrollY: 0 }), true),
      manager,
    )
    gesture.callbacks.update(event(501, 40), manager)
    expect(manager.fail).toHaveBeenCalledTimes(1)
  })
  it('retains a live native boundary when an older query resolves during the touch', async () => {
    const { gesture, active } = native()
    const manager = makeManager(), query = deferred()
    gesture.callbacks.down(down(100, query.promise), manager)
    gesture.callbacks.update({
      params: { pageX: 0, pageY: 110, isAtStart: true },
    }, manager)
    expect(active.current?.atStart).toBe(true)
    query.resolve({ scrollY: 80 })
    await query.promise
    expect(active.current?.atStart).toBe(true)
  })
  it('does not seed a later touch from an expired query', async () => {
    const { gesture, active } = native()
    const manager = makeManager(), oldQuery = deferred()
    gesture.callbacks.down(down(100, oldQuery.promise), manager)
    gesture.callbacks.up(event(100), manager)
    gesture.callbacks.down(
      down(200, Promise.resolve({ scrollY: 0 }), true),
      manager,
    )
    await Promise.resolve()
    oldQuery.resolve({ scrollY: 80 })
    await oldQuery.promise
    expect(active.current?.atStart).toBe(true)
    gesture.callbacks.up(event(200), manager)
    const pending = deferred()
    gesture.callbacks.down(down(300, pending.promise), manager)
    expect(active.current?.atStart).toBeUndefined()
  })

  it.each([{ dragDisabled: true }, { gestureConfig: { enabled: false } }])(
    'rejects updates when dragging is disabled: %j',
    overrides => {
      const { gesture, motion, options } = makePan([450, 900], overrides)
      const manager = makeManager()
      gesture.callbacks.begin(event(500), manager)
      gesture.callbacks.update(event(100), manager)
      gesture.callbacks.up(event(100), manager)
      expect(motion.get()).toBe(450)
      expect(options.onDragStartMT).not.toHaveBeenCalled()
      expect(options.onDragEndSnapMT).not.toHaveBeenCalled()
      expect(manager.fail).toHaveBeenCalled()
    },
  )
  it('reverses from content to Sheet without ending or restarting the pan', () => {
    const { gesture, motion, options } = makePan()
    const manager = makeManager()
    motion.set(900)
    options.activeScrollMTRef.current.atStart = false
    gesture.callbacks.begin(event(100), manager)
    gesture.callbacks.update(event(120), manager)
    options.activeScrollMTRef.current.atStart = true
    gesture.callbacks.update(event(140), manager)
    expect(motion.get()).toBe(880)
    expect(manager.fail).not.toHaveBeenCalled()
  })
})

describe('nested pan release recovery', () => {
  it.each([
    { offsets: [450, 900], position: 200, velocity: 1000, index: 0 },
    { offsets: [450, 900], position: 200, velocity: 1800, index: 1 },
    { offsets: [0, 450, 900], position: 0, velocity: 200, index: 1 },
    { offsets: [-1, 450, 900], position: 0, velocity: 200, index: 1 },
  ])(
    'recovers an opening fling without selecting closed or unresolved snaps: %j',
    ({ offsets, position, velocity, index }) => {
      const { gesture, motion, options } = makePan(offsets)
      const manager = makeManager()
      gesture.callbacks.begin(event(0), manager)
      gesture.callbacks.update(event(50), manager)
      motion.set(position)
      vi.spyOn(motion, 'getVelocity').mockReturnValue(velocity)
      gesture.callbacks.up(event(50), manager)
      expect(options.onDragEndCloseMT).not.toHaveBeenCalled()
      expect(options.onDragEndSnapMT).toHaveBeenCalledWith(index)
    },
  )

  it.each([
    { velocity: 0, overrides: {} },
    { velocity: 100, overrides: {} },
    { velocity: -1000, overrides: {} },
    { velocity: 1000, overrides: { flingEnabled: false } },
    { velocity: 1000, overrides: { flingMinVelocity: 1200 } },
  ])(
    'retains dismiss-zone closure without an opening fling: %j',
    ({ velocity, overrides }) => {
      const { gesture, motion, options } = makePan([450, 900], overrides)
      const manager = makeManager()
      gesture.callbacks.begin(event(0), manager)
      gesture.callbacks.update(event(50), manager)
      motion.set(200)
      vi.spyOn(motion, 'getVelocity').mockReturnValue(velocity)
      gesture.callbacks.up(event(50), manager)
      expect(options.onDragEndCloseMT).toHaveBeenCalledOnce()
      expect(options.onDragEndSnapMT).not.toHaveBeenCalled()
    },
  )

  it.each([-1000, 0, 1000])(
    'never dismisses with drag-to-close disabled at velocity %s',
    velocity => {
      const { gesture, motion, options } = makePan([450, 900], {
        enableDragToClose: false,
      })
      const manager = makeManager()
      gesture.callbacks.begin(event(0), manager)
      gesture.callbacks.update(event(50), manager)
      motion.set(200)
      vi.spyOn(motion, 'getVelocity').mockReturnValue(velocity)
      gesture.callbacks.up(event(50), manager)
      expect(options.onDragEndCloseMT).not.toHaveBeenCalled()
      expect(options.onDragEndSnapMT).toHaveBeenCalledWith(0)
    },
  )
})

describe('relations across recognizer clones', () => {
  it('retains one relation per recognizer ID across rerenders', () => {
    const native = new runtime.Gesture()
    for (let i = 0; i < 3; i++) {
      setupSheetScrollGestureRelations(native, { id: 10, type: 0 })
    }
    expect(native.simultaneousWith).toHaveLength(1)
    expect(native.waitFor).toEqual([])
    expect(native.continueWith).toEqual([])
  })
})

describe('finger-anchored Sheet resistance', () => {
  function rubberPan(overrides = {}, offsets = [450, 900]) {
    const result = makePan(offsets, {
      activeScrollMTRef: { current: null },
      rubberBand: true,
      ...overrides,
    })
    result.motion.set(900)
    result.gesture.callbacks.begin(event(500), makeManager())
    return result
  }

  it.each([1, 2, 20, 200])(
    'maps the same 200px over-drag identically across %s updates',
    updates => {
      const { gesture, motion } = rubberPan()
      const manager = makeManager()
      for (let i = 1; i <= updates; i++) {
        gesture.callbacks.update(event(500 - 200 * i / updates), manager)
      }
      expect(motion.get()).toBeCloseTo(944.4444444444)
    },
  )

  it('never retreats while the finger continues toward the open edge', () => {
    const { gesture, motion } = rubberPan()
    const manager = makeManager()
    gesture.callbacks.update(event(300), manager)
    let previous = motion.get()
    for (let i = 1; i <= 50; i++) {
      gesture.callbacks.update(event(300 - i), manager)
      expect(motion.get()).toBeGreaterThan(previous)
      previous = motion.get()
    }
  })

  it('holds a stationary finger and unwinds over-drag before collapsing', () => {
    const { gesture, motion, options } = rubberPan()
    const manager = makeManager()
    gesture.callbacks.update(event(300), manager)
    const stretched = motion.get()
    for (let i = 0; i < 10; i++) {
      gesture.callbacks.update(event(300), manager)
      expect(motion.get()).toBe(stretched)
    }
    gesture.callbacks.update(event(400), manager)
    expect(motion.get()).toBeGreaterThan(900)
    gesture.callbacks.update(event(500), manager)
    expect(motion.get()).toBeCloseTo(900)
    gesture.callbacks.update(event(510), manager)
    expect(motion.get()).toBeCloseTo(890)
    expect(options.onDragEndSnapMT).not.toHaveBeenCalled()
    expect(options.onDragEndCloseMT).not.toHaveBeenCalled()
  })

  it('anchors a drag that interrupts an already stretched sheet', () => {
    const { gesture, motion } = rubberPan()
    const manager = makeManager()
    motion.set(940)
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(499), manager)
    expect(motion.get()).toBeGreaterThan(940)
    expect(motion.get()).toBeLessThan(941)
    gesture.callbacks.update(event(500), manager)
    expect(motion.get()).toBeCloseTo(940)
  })

  it('maps resistance from total displacement across the maximum snap', () => {
    const { gesture, motion } = rubberPan()
    const manager = makeManager()
    motion.set(800)
    gesture.callbacks.begin(event(500), manager)
    for (let i = 1; i <= 300; i++) {
      gesture.callbacks.update(event(500 - i), manager)
    }
    expect(motion.get()).toBeCloseTo(944.4444444444)
  })

  it('keeps lower resistance finger-anchored when dismissal is disabled', () => {
    const { gesture, motion, options } = rubberPan({ enableDragToClose: false })
    const manager = makeManager()
    motion.set(450)
    gesture.callbacks.begin(event(500), manager)
    for (let i = 1; i <= 200; i++) {
      gesture.callbacks.update(event(500 + i), manager)
    }
    expect(motion.get()).toBeCloseTo(405.5555555556)
    gesture.callbacks.update(event(500), manager)
    expect(motion.get()).toBeCloseTo(450)
    expect(options.onDragEndCloseMT).not.toHaveBeenCalled()
  })

  it('keeps a physical touch active after the pan recognizer ends', () => {
    const { gesture, motion, options } = rubberPan()
    const manager = makeManager()
    gesture.callbacks.down(event(500), manager)
    gesture.callbacks.update(event(300), manager)
    const stretched = motion.get()
    gesture.callbacks.end?.(event(300), manager)
    expect(options.onDragEndSnapMT).not.toHaveBeenCalled()
    expect(options.onGestureEndMT).not.toHaveBeenCalled()
    expect(motion.get()).toBe(stretched)
    gesture.callbacks.up(event(300), manager)
    expect(options.onDragEndSnapMT.mock.calls).toEqual([[1]])
    expect(options.onGestureEndMT).toHaveBeenCalledOnce()
  })

  it('keeps a known non-scrollable target with Sheet resistance', () => {
    const { gesture, motion } = rubberPan({
      activeScrollMTRef: {
        current: { manager: makeManager(), atStart: true, atEnd: true },
      },
    })
    const manager = makeManager()
    gesture.callbacks.update(event(300), manager)
    expect(motion.get()).toBeCloseTo(944.4444444444)
    gesture.callbacks.update(event(500), manager)
    expect(motion.get()).toBeCloseTo(900)
  })
})

describe('Sheet ownership segments and physical release', () => {
  it('discards native-owned travel before Sheet takes over a reversal', () => {
    const { gesture, motion, options } = makePan()
    const manager = makeManager()
    motion.set(800)
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(200), manager)
    expect(motion.get()).toBe(900)
    gesture.callbacks.update(event(100), manager)
    options.activeScrollMTRef.current.atStart = false
    gesture.callbacks.update(event(300), manager)
    expect(motion.get()).toBe(900)
    options.activeScrollMTRef.current.atStart = true
    gesture.callbacks.update(event(310), manager)
    expect(motion.get()).toBe(890)
  })

  it.each(['native-first', 'pan-first'] as const)(
    'settles once when physical release callbacks arrive %s',
    order => {
      const { gesture, motion, options, finishTouchMT } = makePan()
      const manager = makeManager()
      const native = useSheetNativeScrollGesture(
        {
          sheetGesture: gesture as unknown as Parameters<
            typeof useSheetNativeScrollGesture
          >[0]['sheetGesture'],
          activeScrollMTRef: options.activeScrollMTRef,
          resolvedSide: 'bottom',
          position: options.yRef,
          getResolvedSnapOffsets: options.getResolvedSnapOffsets,
          onScrollEndMT: finishTouchMT,
        } as unknown as Parameters<typeof useSheetNativeScrollGesture>[0],
      ) as unknown as InstanceType<typeof runtime.Gesture>
      native.callbacks.down({
        params: { pageX: 0, pageY: 500, isAtStart: true, isAtEnd: false },
      }, manager)
      gesture.callbacks.begin(event(500), manager)
      gesture.callbacks.update(event(480), manager)
      expect(motion.get()).toBe(470)
      if (order === 'native-first') {
        native.callbacks.up(event(480), manager)
        gesture.callbacks.up(event(480), manager)
      } else {
        gesture.callbacks.up(event(480), manager)
        native.callbacks.up(event(480), manager)
      }
      expect(options.onDragEndSnapMT).toHaveBeenCalledOnce()
      expect(options.onDragEndCloseMT).not.toHaveBeenCalled()
    },
  )

  it('uses native touch completion even if the pan no longer receives events', () => {
    const { gesture, options, finishTouchMT } = makePan()
    const manager = makeManager()
    const native = useSheetNativeScrollGesture(
      {
        sheetGesture: gesture,
        activeScrollMTRef: options.activeScrollMTRef,
        resolvedSide: 'bottom',
        position: options.yRef,
        getResolvedSnapOffsets: options.getResolvedSnapOffsets,
        onScrollEndMT: finishTouchMT,
      } as unknown as Parameters<typeof useSheetNativeScrollGesture>[0],
    ) as unknown as InstanceType<typeof runtime.Gesture>
    native.callbacks.down(
      { params: { pageX: 0, pageY: 500, isAtStart: true } },
      manager,
    )
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(480), manager)
    gesture.callbacks.end?.(event(480), manager)
    expect(options.onDragEndSnapMT).not.toHaveBeenCalled()
    native.callbacks.up(event(480), manager)
    expect(options.onDragEndSnapMT).toHaveBeenCalledOnce()
  })

  it('replaces an imperative animation when the finger moves again', () => {
    const { gesture, motion, options } = makePan([450, 900], {
      activeScrollMTRef: { current: null },
    })
    const manager = makeManager()
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(490), manager)
    motion.set(600)
    gesture.callbacks.update(event(480), manager)
    expect(motion.get()).toBe(610)
    expect(options.onDragStartMT).toHaveBeenCalledTimes(2)
  })

  it('keeps existing resistance through a resize and selects the new release snap', () => {
    const offsets = [450, 900]
    const { gesture, motion, options } = makePan(offsets, {
      activeScrollMTRef: { current: null },
      rubberBand: true,
    })
    const manager = makeManager()
    motion.set(900)
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(300), manager)
    offsets[1] = 800
    const stretched = motion.get()
    gesture.callbacks.update(event(300), manager)
    expect(motion.get()).toBe(stretched)
    gesture.callbacks.update(event(299), manager)
    expect(motion.get()).toBeGreaterThan(stretched)
    gesture.callbacks.up(event(299), manager)
    expect(options.onDragEndSnapMT).toHaveBeenCalledWith(1)
  })

  it('settles cancellation without using stale fling velocity to dismiss', () => {
    const { gesture, motion, options } = makePan()
    const manager = makeManager()
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(750), manager)
    vi.spyOn(motion, 'getVelocity').mockReturnValue(-1800)
    gesture.callbacks.cancel(event(750), manager)
    expect(options.onDragEndCloseMT).not.toHaveBeenCalled()
    expect(motion.updateVelocity).toHaveBeenCalledWith(0)
    expect(options.onDragEndSnapMT.mock.calls).toEqual([[0]])
    gesture.callbacks.up(event(750), manager)
  })
})

describe('Sheet pan resistance directions', () => {
  it.each(
    [
      { side: 'bottom', enableRTL: false, horizontal: false, sign: -1 },
      { side: 'top', enableRTL: false, horizontal: false, sign: 1 },
      { side: 'left', enableRTL: false, horizontal: true, sign: 1 },
      { side: 'right', enableRTL: false, horizontal: true, sign: -1 },
      { side: 'start', enableRTL: false, horizontal: true, sign: 1 },
      { side: 'start', enableRTL: true, horizontal: true, sign: -1 },
      { side: 'end', enableRTL: false, horizontal: true, sign: -1 },
      { side: 'end', enableRTL: true, horizontal: true, sign: 1 },
    ] as const,
  )(
    'preserves $side displacement with RTL=$enableRTL',
    ({ side, enableRTL, horizontal, sign }) => {
      const { gesture, motion } = makePan([450, 900], {
        activeScrollMTRef: { current: null },
        side,
        enableRTL,
        rubberBand: true,
      })
      const manager = makeManager()
      const point = (distance: number) =>
        horizontal
          ? event(0, distance * sign)
          : event(distance * sign)
      motion.set(900)
      gesture.callbacks.begin(point(0), manager)
      for (let i = 1; i <= 200; i++) gesture.callbacks.update(point(i), manager)
      expect(motion.get()).toBeCloseTo(944.4444444444)
      gesture.callbacks.update(point(0), manager)
      expect(motion.get()).toBeCloseTo(900)
    },
  )

  it('anchors on the stopped position when Sheet first acquires the drag', () => {
    const { gesture, motion, options } = makePan([450, 900], {
      activeScrollMTRef: { current: null },
      rubberBand: true,
    })
    const manager = makeManager()
    options.onDragStartMT.mockImplementation(() => motion.set(900))
    gesture.callbacks.begin(event(500), manager)
    gesture.callbacks.update(event(490), manager)
    expect(motion.get()).toBeGreaterThan(900)
    expect(motion.get()).toBeLessThan(910)
  })

  it.each([{ offsets: [0, 450, 900] }, { offsets: [-1, 0, 900, 450] }])(
    'preserves open snap identity on cancellation with offsets $offsets',
    ({ offsets }) => {
      const { gesture, motion, options } = makePan(offsets)
      const manager = makeManager()
      gesture.callbacks.begin(event(500), manager)
      gesture.callbacks.update(event(900), manager)
      motion.set(0)
      gesture.callbacks.cancel(event(900), manager)
      const expected = offsets.indexOf(
        Math.min(...offsets.filter(offset => offset > 0)),
      )
      expect(options.onDragEndSnapMT.mock.calls).toEqual([[expected]])
      expect(options.onDragEndCloseMT).not.toHaveBeenCalled()
    },
  )
})
