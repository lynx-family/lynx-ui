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
vi.mock(
  './useSnapTouches',
  () => ({ getRubberBandConfig: () => ({ enabled: false }) }),
)
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
  }
  const scrollManager = makeManager()
  const options = {
    activeScrollMTRef: { current: { manager: scrollManager, atStart: true } },
    yRef: { current: motion },
    viewportSize: 1000,
    sheetSizeMTRef: { current: 900 },
    getResolvedSnapOffsets: () => offsets,
    onSnapChangeMT: vi.fn(),
    onGestureStartMT: vi.fn(),
    onGestureEndMT: vi.fn(),
    onDragStartMT: vi.fn(),
    onDragEndSnapMT: vi.fn(),
    onDragEndCloseMT: vi.fn(),
    ...overrides,
  }
  // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
  const gesture = useSheetPanGesture(
    options as unknown as Parameters<typeof useSheetPanGesture>[0],
  ) as unknown as InstanceType<typeof runtime.Gesture>
  return { gesture, motion, options, scrollManager }
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
      active: active as { current: { atStart?: boolean } | null },
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
    gesture.callbacks.end(event(-20), manager)
    expect(options.onSnapChangeMT).toHaveBeenCalledWith(1, 900)
    expect(options.onDragEndSnapMT).not.toHaveBeenCalled()
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
    gesture.callbacks.end(event(140), manager)
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
    gesture.callbacks.end(event(120), manager)
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
      gesture.callbacks.end(event(100), manager)
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
