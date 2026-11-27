// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  createRef,
  runOnMainThread,
  useMainThreadRef,
  useState,
} from '@lynx-js/react'
import v8 from 'node:v8'
import vm from 'node:vm'

import { act, fireEvent, render } from '@lynx-js/react/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SheetBackdrop,
  SheetContent,
  SheetNestedScrollContent,
  SheetRoot,
  SheetView,
} from '../src'
import type { SheetRootRef } from '../src'

v8.setFlagsFromString('--expose-gc')
const forceGC = vm.runInNewContext('gc') as () => void
const realSetImmediate = globalThis.setImmediate

async function flushFinalizers() {
  forceGC()
  await new Promise<void>(resolve => {
    realSetImmediate(resolve)
  })
  await Promise.resolve()
}

interface TestingBridgeEvent {
  type: string
  data?: unknown
}

interface LynxTestingEnvGlobal {
  switchToMainThread: () => void
  switchToBackgroundThread: () => void
  mainThread: {
    globalThis: typeof globalThis
    lynx: {
      requestAnimationFrame?: typeof requestAnimationFrame
      cancelAnimationFrame?: typeof cancelAnimationFrame
      getJSContext: () => {
        dispatchEvent: (event: TestingBridgeEvent) => unknown
      }
    }
  }
  backgroundThread: {
    globalThis: typeof globalThis
    lynx: {
      requestAnimationFrame?: typeof requestAnimationFrame
      cancelAnimationFrame?: typeof cancelAnimationFrame
      getCoreContext: () => {
        dispatchEvent: (event: TestingBridgeEvent) => unknown
      }
    }
  }
}

function getTestingEnv(): LynxTestingEnvGlobal {
  return (globalThis as unknown as { lynxTestingEnv: LynxTestingEnvGlobal })
    .lynxTestingEnv
}

function installFakeAnimationFrames() {
  const env = getTestingEnv()
  const mainRaf = (cb: FrameRequestCallback) =>
    setTimeout(() => {
      const wasBackground = Boolean(
        (globalThis as unknown as { __JS__?: boolean }).__JS__,
      )
      if (wasBackground) env.switchToMainThread()
      try {
        cb(Date.now())
      } finally {
        if (wasBackground) env.switchToBackgroundThread()
      }
    }, 16) as unknown as number
  const bgRaf = (cb: FrameRequestCallback) =>
    setTimeout(() => {
      const wasMain = Boolean(
        (globalThis as unknown as { __LEPUS__?: boolean }).__LEPUS__,
      )
      if (wasMain) env.switchToBackgroundThread()
      try {
        cb(Date.now())
      } finally {
        if (wasMain) env.switchToMainThread()
      }
    }, 16) as unknown as number
  const cancelFrame = (id: number) => clearTimeout(id)
  globalThis.requestAnimationFrame = mainRaf
  globalThis.cancelAnimationFrame = cancelFrame
  Reflect.deleteProperty(globalThis, 'queueMicrotask')
  env.mainThread.globalThis.requestAnimationFrame = mainRaf
  env.mainThread.globalThis.cancelAnimationFrame = cancelFrame
  env.mainThread.lynx.requestAnimationFrame = mainRaf
  env.mainThread.lynx.cancelAnimationFrame = cancelFrame
  env.backgroundThread.lynx.requestAnimationFrame = bgRaf
  env.backgroundThread.lynx.cancelAnimationFrame = cancelFrame
}

function createBackgroundIpcController() {
  const env = getTestingEnv()
  const jsContext = env.mainThread.lynx.getJSContext()
  const originalDispatch = jsContext.dispatchEvent.bind(jsContext)
  let holdMessages = false
  const heldQueue: TestingBridgeEvent[] = []

  function deliverOnBackground(event: TestingBridgeEvent) {
    const wasMain = Boolean(
      (globalThis as unknown as { __LEPUS__?: boolean }).__LEPUS__,
    )
    if (wasMain) env.switchToBackgroundThread()
    try {
      return originalDispatch(event)
    } finally {
      if (wasMain) env.switchToMainThread()
    }
  }

  jsContext.dispatchEvent = (event: TestingBridgeEvent) => {
    if (event.type === 'Lynx.Worklet.runOnBackground' && holdMessages) {
      heldQueue.push(event)
      return true
    }
    return originalDispatch(event)
  }

  return {
    hold() {
      holdMessages = true
    },
    flushHeldSynchronously() {
      holdMessages = false
      const pending = heldQueue.splice(0, heldQueue.length)
      for (const event of pending) {
        deliverOnBackground(event)
      }
    },
    pendingCount() {
      return heldQueue.length
    },
    restore() {
      holdMessages = false
      heldQueue.length = 0
      jsContext.dispatchEvent = originalDispatch
    },
  }
}

describe('Sheet dual-thread ReactLynx lifecycle & async IPC timing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installFakeAnimationFrames()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('survives show=true mount, mid-flight re-render, and GC before firing onOpen', async () => {
    const onOpen = vi.fn()
    const onClose = vi.fn()

    function MountHarness({ gap }: { gap: number }) {
      return (
        <SheetRoot
          show={true}
          onOpen={onOpen}
          onClose={onClose}
          screenWidth={400}
          screenHeight={800}
          snapPoints={['45%', '100%']}
        >
          <SheetView>
            <SheetBackdrop />
            <SheetNestedScrollContent
              className='painted-surface'
              panelLayout={{ bottomGap: gap }}
            >
              {() => <text>Reader</text>}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    const { container, rerender } = render(<MountHarness gap={8} />)
    expect(container.querySelector('.painted-surface')).not.toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32)
    })

    rerender(<MountHarness gap={12} />)
    await flushFinalizers()
    await flushFinalizers()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    const backdrop = container.querySelector('.lynx-ui-sheet-backdrop')!
    expect(backdrop.getAttribute('style')).toContain('opacity: 0.45')
  })

  it('mounts on Render #1 when show flips false->true and stays latched across rapid false->true->false toggles', async () => {
    const onClose = vi.fn()

    function ControlledHarness({ show }: { show: boolean }) {
      return (
        <SheetRoot
          show={show}
          onClose={onClose}
          screenWidth={400}
          screenHeight={800}
          snapPoints={[400]}
        >
          <SheetView>
            <SheetBackdrop />
            <SheetNestedScrollContent className='surface'>
              {() => <text>Body</text>}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    const { container, rerender } = render(<ControlledHarness show={false} />)
    expect(container.querySelector('.surface')).toBeNull()

    rerender(<ControlledHarness show={true} />)
    expect(container.querySelector('.surface')).not.toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32)
    })

    rerender(<ControlledHarness show={false} />)
    expect(container.querySelector('.surface')).not.toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(container.querySelector('.surface')).toBeNull()
  })

  it('ignores stale in-flight onUnmount IPC across reopens and keeps state consistent across touch drag-resurrection IPC batches', async () => {
    const ipc = createBackgroundIpcController()
    const onOpen = vi.fn()
    const onClose = vi.fn()
    const controlledEmitted: boolean[] = []

    function StatefulControlledParent() {
      const [show, setShow] = useState(true)
      return (
        <view>
          <view id='reopen-btn' bindtap={() => setShow(true)} />
          <view id='close-btn' bindtap={() => setShow(false)} />
          <SheetRoot
            show={show}
            onShowChange={next => {
              controlledEmitted.push(next)
              setShow(next)
            }}
            onOpen={onOpen}
            onClose={onClose}
            screenWidth={400}
            screenHeight={800}
            snapPoints={[400]}
          >
            <SheetView>
              <SheetBackdrop />
              <SheetContent
                className='touch-surface'
                innerViewProps={{ id: 'touch-content' }}
              >
                {() => <text>Touch Sheet</text>}
              </SheetContent>
            </SheetView>
          </SheetRoot>
        </view>
      )
    }

    try {
      const { container } = render(<StatefulControlledParent />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onOpen).toHaveBeenCalledTimes(1)

      const touchTarget = container.querySelector('#touch-content')!

      // Drag sheet into dismiss zone and catch mid-exit while IPC is held on wire:
      ipc.hold()
      fireEvent.touchstart(touchTarget, { detail: { x: 200, y: 400 } })
      fireEvent.touchmove(touchTarget, { detail: { x: 200, y: 560 } })
      fireEvent.touchmove(touchTarget, { detail: { x: 200, y: 720 } })
      fireEvent.touchend(touchTarget, { detail: { x: 200, y: 720 } })
      expect(ipc.pendingCount()).toBe(1)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(16)
      })
      fireEvent.touchstart(touchTarget, { detail: { x: 200, y: 730 } })
      fireEvent.touchmove(touchTarget, { detail: { x: 200, y: 580 } })
      fireEvent.touchmove(touchTarget, { detail: { x: 200, y: 420 } })
      fireEvent.touchend(touchTarget, { detail: { x: 200, y: 420 } })
      expect(ipc.pendingCount()).toBe(2)

      await act(async () => {
        ipc.flushHeldSynchronously()
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(controlledEmitted).toEqual([false, true])
      expect(container.querySelector('.touch-surface')).not.toBeNull()

      // Close completely while holding `onUnmount(1)` IPC, then reopen before `onUnmount(1)` arrives:
      fireEvent.tap(container.querySelector('#close-btn')!)
      ipc.hold()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(ipc.pendingCount()).toBeGreaterThan(0)

      fireEvent.tap(container.querySelector('#reopen-btn')!)
      await act(async () => {
        ipc.flushHeldSynchronously()
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(onOpen).toHaveBeenCalledTimes(3)
      expect(container.querySelector('.touch-surface')).not.toBeNull()
    } finally {
      ipc.restore()
    }
  })

  it('notifies main-thread:onSnapStart when opening directly to a non-initial snap index via snapTo(1) from closed', async () => {
    const sheetRef = createRef<SheetRootRef>()
    let readSnapEventsMT: (() => string[]) | undefined

    function DirectSnapHarness() {
      const eventsMTRef = useMainThreadRef<string[]>([])
      readSnapEventsMT = () => {
        'main thread'
        return eventsMTRef.current.slice()
      }
      const onSnapStartMT = (
        index: number,
        value: number,
        animated: boolean,
      ) => {
        'main thread'
        eventsMTRef.current.push(`${index}:${value}:${String(animated)}`)
      }
      return (
        <SheetRoot
          ref={sheetRef}
          defaultShow={false}
          screenWidth={400}
          screenHeight={800}
          snapPoints={[300, 700]}
          initialSnap={0}
          main-thread:onSnapStart={onSnapStartMT}
        >
          <SheetView>
            <SheetNestedScrollContent className='snap-surface'>
              {() => <text>Imperative</text>}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    const { container } = render(<DirectSnapHarness />)
    act(() => {
      sheetRef.current?.snapTo(1)
    })

    let events: string[] = []
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500)
      events = await runOnMainThread(readSnapEventsMT!)()
    })

    expect(events).toEqual(['1:700:true'])
    const movement = container.querySelector('.snap-surface')!.parentElement!
    expect(movement.getAttribute('style')).toContain('translate(0px, -700px)')
  })
})
