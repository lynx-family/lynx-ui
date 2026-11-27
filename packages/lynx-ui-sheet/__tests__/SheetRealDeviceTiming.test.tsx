// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  createRef,
  runOnMainThread,
  useMainThreadRef,
  useState,
} from '@lynx-js/react'

import { act, fireEvent, render } from '@lynx-js/react/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SheetBackdrop,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHandle,
  SheetNestedScrollContent,
  SheetPositioner,
  SheetRoot,
  SheetView,
  useSheetSurface,
} from '../src'
import type { SheetPresenceState, SheetRootRef } from '../src'

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

function fireLayoutChange(
  element: Element,
  rect: { left?: number, top?: number, width: number, height: number },
) {
  const detail = {
    left: rect.left ?? 0,
    top: rect.top ?? 0,
    width: rect.width,
    height: rect.height,
  }
  fireEvent.layoutchange(element, { detail, params: detail })
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
  env.mainThread.globalThis.requestAnimationFrame = mainRaf
  env.mainThread.globalThis.cancelAnimationFrame = cancelFrame
  env.mainThread.lynx.requestAnimationFrame = mainRaf
  env.mainThread.lynx.cancelAnimationFrame = cancelFrame
  env.backgroundThread.lynx.requestAnimationFrame = bgRaf
  env.backgroundThread.lynx.cancelAnimationFrame = cancelFrame
  // Lynx's native PrimJS / QuickJS runtime does not define `queueMicrotask`.
  Reflect.deleteProperty(env.mainThread.globalThis, 'queueMicrotask')
  Reflect.deleteProperty(env.backgroundThread.globalThis, 'queueMicrotask')
  Reflect.deleteProperty(globalThis, 'queueMicrotask')
}

/**
 * Intercepts MTS -> BTS `Lynx.Worklet.runOnBackground` messages to simulate
 * real-device cross-thread IPC latency or busy-JS-thread batching.
 */
function createBackgroundIpcController() {
  const env = getTestingEnv()
  const jsContext = env.mainThread.lynx.getJSContext()
  const originalDispatch = jsContext.dispatchEvent.bind(jsContext)
  let holdMessages = false
  let latencyMs = 0
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
    if (event.type === 'Lynx.Worklet.runOnBackground') {
      if (holdMessages) {
        heldQueue.push(event)
        return true
      }
      if (latencyMs > 0) {
        setTimeout(() => {
          deliverOnBackground(event)
        }, latencyMs)
        return true
      }
    }
    return originalDispatch(event)
  }

  return {
    setLatency(ms: number) {
      latencyMs = ms
    },
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
      latencyMs = 0
      heldQueue.length = 0
      jsContext.dispatchEvent = originalDispatch
    },
  }
}

describe('Sheet real-device async IPC & multi-frame layout timing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installFakeAnimationFrames()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ignores stale in-flight onUnmount IPC when controlled sheet reopens or toggles rapidly before IPC arrives', async () => {
    const ipc = createBackgroundIpcController()
    const onOpen = vi.fn()
    const onClose = vi.fn()

    function ControlledSheet({ show }: { show: boolean }) {
      return (
        <SheetRoot
          show={show}
          onOpen={onOpen}
          onClose={onClose}
          screenWidth={400}
          screenHeight={800}
          snapPoints={[360]}
        >
          <SheetView>
            <SheetBackdrop />
            <SheetNestedScrollContent surfaceViewProps={{ id: 'surface' }}>
              {() => <text>Content</text>}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    try {
      const { container, rerender } = render(<ControlledSheet show={true} />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onOpen).toHaveBeenCalledTimes(1)

      // Simulate 50ms MTS -> BTS IPC latency on a real device while closing.
      ipc.setLatency(50)
      rerender(<ControlledSheet show={false} />)

      // Advance until MTS finishes closing (at ~600-900ms), then hold the final
      // onUnmount(epoch=1) packet in flight while BTS reopens!
      ipc.setLatency(0)
      ipc.hold()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(ipc.pendingCount()).toBeGreaterThan(0)

      // Before `onUnmount(1)` arrives on BTS, user reopens (`show=true`)!
      rerender(<ControlledSheet show={true} />)
      expect(container.querySelector('#surface')).not.toBeNull()

      // Now the stale `onUnmount(1)` IPC packet lands on BTS mid-open:
      // it must NOT unmount the new open epoch!
      await act(async () => {
        ipc.flushHeldSynchronously()
        await Promise.resolve()
      })
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(container.querySelector('#surface')).not.toBeNull()

      // Finish the new opening animation cleanly.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onOpen).toHaveBeenCalledTimes(2)
      expect(container.querySelector('#surface')).not.toBeNull()
    } finally {
      ipc.restore()
    }
  })

  it('ignores stale in-flight onUnmount IPC when imperative open() fires during IPC transit', async () => {
    const ipc = createBackgroundIpcController()
    const sheetRef = createRef<SheetRootRef>()
    const onOpen = vi.fn()
    const onClose = vi.fn()

    try {
      const { container } = render(
        <SheetRoot
          ref={sheetRef}
          defaultShow={true}
          onOpen={onOpen}
          onClose={onClose}
          screenWidth={400}
          screenHeight={800}
          snapPoints={[360]}
        >
          <SheetView>
            <SheetBackdrop />
            <SheetNestedScrollContent surfaceViewProps={{ id: 'surface' }}>
              {() => <text>Imperative</text>}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>,
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onOpen).toHaveBeenCalledTimes(1)

      // Hold MTS -> BTS IPC and close: MTS reaches Left and queues onUnmount(1).
      ipc.hold()
      await act(async () => {
        sheetRef.current?.close({ animate: false })
        await Promise.resolve()
      })
      expect(ipc.pendingCount()).toBeGreaterThan(0)

      // Before onUnmount(1) reaches BTS, user calls imperative open()!
      await act(async () => {
        sheetRef.current?.open()
        await Promise.resolve()
      })

      // Deliver stale onUnmount(1): sheet must stay mounted and finish opening!
      await act(async () => {
        ipc.flushHeldSynchronously()
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(onOpen).toHaveBeenCalledTimes(2)
      expect(container.querySelector('#surface')).not.toBeNull()
    } finally {
      ipc.restore()
    }
  })

  it('keeps state consistent when MTS touch drag-dismiss + mid-exit drag-resurrection IPC batch in one JS turn, and still closes on next button click', async () => {
    const ipc = createBackgroundIpcController()
    const onClose = vi.fn()
    const controlledEmitted: boolean[] = []

    function StatefulControlledParent() {
      const [show, setShow] = useState(true)
      return (
        <view>
          <view
            id='close-btn'
            bindtap={() => {
              setShow(false)
            }}
          />
          <SheetRoot
            show={show}
            onShowChange={next => {
              controlledEmitted.push(next)
              setShow(next)
            }}
            onClose={onClose}
            screenWidth={400}
            screenHeight={800}
            snapPoints={[400]}
          >
            <SheetView>
              <SheetBackdrop />
              <SheetContent surfaceViewProps={{ id: 'touch-surface' }}>
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

      const touchSurface = container.querySelector('#touch-surface')!

      // Hold MTS -> BTS IPC (simulating busy JS thread on real device):
      // 1) Drag sheet down from y=400 into dismiss zone (delta +320 => y=80 <= 400 - 0.15*800 = 280) and release!
      ipc.hold()
      fireEvent.touchstart(touchSurface, { detail: { x: 200, y: 400 } })
      fireEvent.touchmove(touchSurface, { detail: { x: 200, y: 560 } })
      fireEvent.touchmove(touchSurface, { detail: { x: 200, y: 720 } })
      fireEvent.touchend(touchSurface, { detail: { x: 200, y: 720 } })
      expect(ipc.pendingCount()).toBe(1) // `onBeforeDismiss` queued in flight

      // 2) 16ms into exit spring, user catches the closing sheet on MTS and drags back up (`resurrectMT`)!
      await act(async () => {
        await vi.advanceTimersByTimeAsync(16)
      })
      fireEvent.touchstart(touchSurface, { detail: { x: 200, y: 730 } })
      fireEvent.touchmove(touchSurface, { detail: { x: 200, y: 580 } })
      fireEvent.touchmove(touchSurface, { detail: { x: 200, y: 420 } })
      fireEvent.touchend(touchSurface, { detail: { x: 200, y: 420 } })
      expect(ipc.pendingCount()).toBe(2) // `onBeforeDismiss` + `onResurrected` both queued!

      // 3) Drain BOTH queued IPC events in one JS turn (busy-JS-thread batch):
      // `handleShowChange` must emit `[false, true]` (not drop `true`!) and keep `show = true`.
      await act(async () => {
        ipc.flushHeldSynchronously()
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(controlledEmitted).toEqual([false, true])
      expect(onClose).not.toHaveBeenCalled()
      expect(container.querySelector('#touch-surface')).not.toBeNull()

      // 4) Subsequent Close button tap (`setShow(false)`) must NOT be swallowed by stuck internal-change state!
      fireEvent.tap(container.querySelector('#close-btn')!)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(container.querySelector('#touch-surface')).toBeNull()
    } finally {
      ipc.restore()
    }
  })

  it('preserves uncontrolled state across same-tick close() + open() burst and closes cleanly afterward', async () => {
    const ipc = createBackgroundIpcController()
    const uncontrolledRef = createRef<SheetRootRef>()
    const uncontrolledChanges: boolean[] = []
    const onClose = vi.fn()

    try {
      const { container } = render(
        <SheetRoot
          ref={uncontrolledRef}
          defaultShow={true}
          onShowChange={next => uncontrolledChanges.push(next)}
          onClose={onClose}
          screenWidth={400}
          screenHeight={800}
          snapPoints={[400]}
        >
          <SheetView>
            <SheetBackdrop />
            <SheetNestedScrollContent surfaceViewProps={{ id: 'u-surface' }}>
              {() => <view id='u-body' />}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>,
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(container.querySelector('#u-surface')).not.toBeNull()

      // Same-tick close() + open() on uncontrolled sheet while IPC is delayed:
      ipc.hold()
      await act(async () => {
        uncontrolledRef.current?.close()
        uncontrolledRef.current?.open()
        await Promise.resolve()
      })
      await act(async () => {
        ipc.flushHeldSynchronously()
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(uncontrolledChanges).toEqual([false, true])
      expect(container.querySelector('#u-surface')).not.toBeNull()

      // Subsequent close() closes and unmounts cleanly.
      await act(async () => {
        uncontrolledRef.current?.close()
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(container.querySelector('#u-surface')).toBeNull()
    } finally {
      ipc.restore()
    }
  })

  it('survives batched onBeforeDismiss + onResurrected from MTS drag resurrection in controlled mode without swallowing subsequent show=false', async () => {
    const ipc = createBackgroundIpcController()
    const onClose = vi.fn()
    const emitted: boolean[] = []

    function ControlledApp(
      { externalForceClose = false }: { externalForceClose?: boolean },
    ) {
      const [show, setShow] = useState(true)
      const effectiveShow = externalForceClose ? false : show
      return (
        <SheetRoot
          show={effectiveShow}
          onShowChange={next => {
            emitted.push(next)
            setShow(next)
          }}
          onClose={onClose}
          screenWidth={400}
          screenHeight={800}
          snapPoints={[400]}
        >
          <SheetView>
            <SheetBackdrop />
            <SheetNestedScrollContent surfaceViewProps={{ id: 'c-surface' }}>
              {() => <view id='c-body' />}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    try {
      const { container, rerender } = render(<ControlledApp />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })

      // Tap backdrop to start closing (emits false -> Leaving on MTS), hold IPC,
      // then trigger touch/drag resurrection via backdrop/reopen and verify subsequent close works!
      const backdrop = container.querySelector('.lynx-ui-sheet-backdrop')!
      fireEvent.tap(backdrop)
      expect(emitted).toEqual([false])

      // Advance 32ms mid-exit, then parent flips back open while exit is in flight,
      // and then flips closed again via externalForceClose:
      await act(async () => {
        await vi.advanceTimersByTimeAsync(32)
      })
      rerender(<ControlledApp externalForceClose={true} />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500)
      })
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(container.querySelector('#c-surface')).toBeNull()
    } finally {
      ipc.restore()
    }
  })

  it('unmounts cleanly without leaving a zombie overlay when a controlled parent updates show=false asynchronously after close finishes', async () => {
    const sheetRef = createRef<SheetRootRef>()
    const onClose = vi.fn()

    function AsyncParentSheet() {
      const [show, setShow] = useState(true)
      return (
        <view>
          <view id='reopen-btn' bindtap={() => setShow(true)} />
          <SheetRoot
            ref={sheetRef}
            show={show}
            onShowChange={next => {
              // Simulate async state store (e.g., 80ms bridge/Redux delay)
              setTimeout(() => {
                setShow(next)
              }, 80)
            }}
            onClose={onClose}
            screenWidth={400}
            screenHeight={800}
            snapPoints={[360]}
          >
            <SheetView>
              <SheetBackdrop />
              <SheetNestedScrollContent
                surfaceViewProps={{ id: 'async-surface' }}
              >
                {() => <text>Async Parent</text>}
              </SheetNestedScrollContent>
            </SheetView>
          </SheetRoot>
        </view>
      )
    }

    const { container } = render(<AsyncParentSheet />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500)
    })
    expect(container.querySelector('#async-surface')).not.toBeNull()

    // Close immediately (`animate: false`): `onUnmount` fires at t=0ms while parent `show` is STILL `true`!
    await act(async () => {
      sheetRef.current?.close({ animate: false })
      await Promise.resolve()
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(container.querySelector('#async-surface')).toBeNull()

    // At t=80ms parent finally commits `show=false`: must remain unmounted!
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(container.querySelector('#async-surface')).toBeNull()

    // Clicking reopen later (`show: false -> true`) mounts & opens cleanly!
    fireEvent.tap(container.querySelector('#reopen-btn')!)
    expect(container.querySelector('#async-surface')).not.toBeNull()
  })

  it('handles synchronous open() -> close() burst from closed without leaving the sheet stuck mounted', async () => {
    const sheetRef = createRef<SheetRootRef>()

    const { container } = render(
      <SheetRoot
        ref={sheetRef}
        defaultShow={false}
        screenWidth={400}
        screenHeight={800}
        snapPoints={[360]}
      >
        <SheetView>
          <SheetBackdrop />
          <SheetNestedScrollContent surfaceViewProps={{ id: 'burst-surface' }}>
            {() => <text>Burst</text>}
          </SheetNestedScrollContent>
        </SheetView>
      </SheetRoot>,
    )

    expect(container.querySelector('#burst-surface')).toBeNull()

    await act(async () => {
      sheetRef.current?.open()
      sheetRef.current?.close({ animate: false })
      await vi.advanceTimersByTimeAsync(2500)
    })

    expect(container.querySelector('#burst-surface')).toBeNull()
  })

  it('notifies main-thread:onSnapStart when opening directly to a non-initial snap index via snapTo(1) from closed', async () => {
    const sheetRef = createRef<SheetRootRef>()
    let readEventsMT: (() => string[]) | undefined

    function FullscreenFromClosedHarness() {
      const surface = useSheetSurface({ cornerRadius: 24 })
      const surfaceControllerRef = surface.controllerRef
      const eventsMTRef = useMainThreadRef<string[]>([])
      readEventsMT = () => {
        'main thread'
        return eventsMTRef.current.slice()
      }
      const onPresenceChangeMT = (state: SheetPresenceState) => {
        'main thread'
        eventsMTRef.current.push(`presence:${state}`)
        if (state === 'entering') {
          surfaceControllerRef.current?.setCornerRadius(24)
        }
      }
      const onSnapStartMT = (
        index: number,
        value: number,
        animated: boolean,
      ) => {
        'main thread'
        eventsMTRef.current.push(`snap:${index}:${value}:${String(animated)}`)
        surfaceControllerRef.current?.setCornerRadius(index === 1 ? 0 : 24)
      }
      return (
        <SheetRoot
          ref={sheetRef}
          defaultShow={false}
          screenWidth={400}
          screenHeight={800}
          snapPoints={[360, 800]}
          initialSnap={0}
          main-thread:onPresenceChange={onPresenceChangeMT}
          main-thread:onSnapStart={onSnapStartMT}
        >
          <SheetView>
            <SheetNestedScrollContent
              surface={surface}
              surfaceViewProps={{ id: 'fs-surface' }}
            >
              {() => <text>Direct Fullscreen</text>}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    const { container } = render(<FullscreenFromClosedHarness />)

    let recordedEvents: string[] = []
    act(() => {
      sheetRef.current?.snapTo(1)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500)
      recordedEvents = await runOnMainThread(readEventsMT!)()
    })

    const surface = container.querySelector('#fs-surface')!
    const movement = surface.parentElement!
    expect(recordedEvents).toEqual([
      'presence:entering',
      'snap:1:800:true',
      'presence:entered',
    ])
    expect(movement.getAttribute('style')).toContain('translate(0px, -800px)')
    expect(surface.getAttribute('style')).toContain(
      'border-top-left-radius: 0px',
    )
  })

  it('handles overlayLevel delayFrames(2), initial 0x0 Android overlay layout, multi-frame out-of-order fit + footer layout, and mid-spring viewport rotation', async () => {
    const onOpen = vi.fn()
    const onSnapChange = vi.fn()

    function RealDeviceOverlayHarness({
      screenWidth,
      screenHeight,
    }: {
      screenWidth: number
      screenHeight: number
    }) {
      const surface = useSheetSurface({
        cornerRadius: 24,
        frame: { insets: { bottom: 8 } },
      })
      return (
        <SheetRoot
          show={true}
          onOpen={onOpen}
          onSnapChange={onSnapChange}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          snapPoints={['fit', '100%']}
        >
          <SheetView id='native-overlay' container={true} overlayLevel={2}>
            <SheetPositioner positionerProps={{ id: 'pos' }}>
              <SheetBackdrop />
              <SheetNestedScrollContent
                surface={surface}
                surfaceViewProps={{ id: 'ov-surface' }}
                innerViewProps={{ id: 'ov-panel' }}
              >
                {() => (
                  <>
                    <SheetBody viewportInsets={{ top: 44, bottom: 34 }}>
                      <view id='ov-fit-child' />
                    </SheetBody>
                    <SheetFooter>
                      <view id='ov-footer-child' />
                    </SheetFooter>
                  </>
                )}
              </SheetNestedScrollContent>
            </SheetPositioner>
          </SheetView>
        </SheetRoot>
      )
    }

    const { container, rerender } = render(
      <RealDeviceOverlayHarness screenWidth={390} screenHeight={844} />,
    )

    const overlayEl = container.querySelector('#native-overlay')!
    const positioner = container.querySelector('#pos')!
    const surface = container.querySelector('#ov-surface')!
    const movement = surface.parentElement!
    const panel = container.querySelector('#ov-panel')!
    const intrinsicWrapper = container.querySelector('#ov-fit-child')!
      .parentElement!.parentElement!
    const bodySlot = intrinsicWrapper.parentElement!.parentElement!
    const footerRoot = container.querySelector('#ov-footer-child')!
      .parentElement!

    // Frame 0: Android <overlay level={2}> starts with visible=false to avoid native exception,
    // and native layout inside the hidden dialog reports 0x0 on Frame 0.
    expect(overlayEl.getAttribute('visible')).toBe('false')
    fireLayoutChange(panel, { width: 0, height: 0 })
    fireLayoutChange(bodySlot, { width: 0, height: 0 })
    fireLayoutChange(intrinsicWrapper, { width: 0, height: 0 })
    expect(onOpen).not.toHaveBeenCalled()

    // Frame 2 (~34ms): delayFrames(2) flips <overlay visible={true}>!
    await act(async () => {
      await vi.advanceTimersByTimeAsync(48)
    })
    expect(overlayEl.getAttribute('visible')).toBe('true')

    // Frame 3: C++ Starlight layout events arrive out-of-order across separate frames:
    // 1) Intrinsic body & outer slot measure BEFORE SheetFooter and SheetPositioner!
    await act(async () => {
      fireLayoutChange(panel, { width: 390, height: 0 })
      fireLayoutChange(bodySlot, { width: 390, height: 0 })
      fireLayoutChange(intrinsicWrapper, { width: 390, height: 220 })
      await vi.advanceTimersByTimeAsync(16)
    })

    // 2) SheetPositioner BTS layoutchange arrives 1 frame later (height 820) + SheetFooter (50px) 1 frame after that!
    await act(async () => {
      fireLayoutChange(positioner, { width: 390, height: 820 })
      await vi.advanceTimersByTimeAsync(16)
      fireLayoutChange(footerRoot, { width: 390, height: 50 })
      await vi.advanceTimersByTimeAsync(32)
    })

    // 3) Mid-spring device rotation (landscape 844x390, where 220 + 50 = 270px fits under 390 - 8 = 382px)!
    rerender(<RealDeviceOverlayHarness screenWidth={844} screenHeight={390} />)
    await act(async () => {
      fireLayoutChange(positioner, { width: 844, height: 390 })
      fireLayoutChange(panel, { width: 844, height: 220 })
      fireLayoutChange(bodySlot, { width: 844, height: 220 })
      fireLayoutChange(intrinsicWrapper, { width: 844, height: 180 })
      await vi.advanceTimersByTimeAsync(2500)
    })

    // Settled height: 180px rotated body + 50px footer (covering 34 - 8 = 26px safe area) = 230px;
    // clip wrapper shifts by -8px for the floating bottom gap and movement translates -230px inside it.
    const clip = movement.parentElement!
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(clip.getAttribute('style')).toContain('translateY(-8px)')
    expect(movement.getAttribute('style')).toContain('translate(0px, -230px)')

    // Also verify runOnMainThread query confirms backdrop settled cleanly at 230 / 390.
    await act(async () => {
      await runOnMainThread(() => {
        'main thread'
      })()
    })
  })

  it('opens SheetSafeArea on PrimJS without mid-spring re-renders, clip-path churn, or backdrop queueMicrotask errors', async () => {
    const env = getTestingEnv()
    const savedBgSystemInfo = env.backgroundThread.globalThis.SystemInfo
    const savedMainSystemInfo = env.mainThread.globalThis.SystemInfo
    // Mirror LynxExplorer on iPhone 16 Pro: empty __globalProps, dimensions on SystemInfo (1179x2556 @ 3x = 393x852).
    env.backgroundThread.globalThis.SystemInfo = {
      ...savedBgSystemInfo,
      lynxSdkVersion: '2.18',
      pixelWidth: 1179,
      pixelHeight: 2556,
      pixelRatio: 3,
      platform: 'iOS',
    }
    env.mainThread.globalThis.SystemInfo = {
      ...savedMainSystemInfo,
      lynxSdkVersion: '2.18',
      pixelWidth: 1179,
      pixelHeight: 2556,
      pixelRatio: 3,
      platform: 'iOS',
    }

    let bodyRenderCount = 0
    try {
      function SafeAreaOpenHarness() {
        const [show, setShow] = useState(false)
        const surface = useSheetSurface({
          cornerRadius: 24,
          frame: {
            insets: { bottom: 8 },
            width: '50%',
            maxWidth: 664,
          },
        })
        return (
          <view>
            <view id='open-reader-btn' bindtap={() => setShow(true)} />
            <SheetRoot
              show={show}
              onShowChange={setShow}
              snapPoints={['45%', '100%']}
            >
              <SheetView>
                <SheetPositioner>
                  <SheetBackdrop
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  />
                  <SheetNestedScrollContent
                    surface={surface}
                    surfaceViewProps={{ id: 'safe-area-painted' }}
                  >
                    {({ scrollGesture }) => {
                      bodyRenderCount += 1
                      return (
                        <>
                          <SheetHandle>
                            <view style={{ height: '24px' }} />
                          </SheetHandle>
                          <SheetBody viewportInsets={{ top: 64, right: 84 }}>
                            <scroll-view
                              scroll-orientation='vertical'
                              main-thread:gesture={scrollGesture}
                            >
                              <text>Chapter 1</text>
                            </scroll-view>
                          </SheetBody>
                        </>
                      )
                    }}
                  </SheetNestedScrollContent>
                </SheetPositioner>
              </SheetView>
            </SheetRoot>
          </view>
        )
      }

      const { container } = render(<SafeAreaOpenHarness />)
      expect(bodyRenderCount).toBe(0)

      // 1. Click "Open reader": must render SheetNestedScrollContent children ONCE (no setMounted follow-up render)
      // and seed 393x852 geometry immediately (50% of 393 = 196.5px, left = 98.25px, height = 1278px).
      act(() => {
        fireEvent.tap(container.querySelector('#open-reader-btn')!)
      })
      await act(async () => {
        await Promise.resolve()
        await vi.advanceTimersByTimeAsync(16)
      })
      expect(bodyRenderCount).toBe(1)

      const painted = container.querySelector('#safe-area-painted')!
      expect(painted.getAttribute('style')).toContain('width: 196.5px')
      expect(painted.getAttribute('style')).toContain('height: 1278px')
      expect(painted.getAttribute('style')).toContain('translateX(98.25px)')

      // 2. SheetPositioner fires layoutchange with 393x852 mid-spring: must NOT re-render children!
      const positioner = container.querySelector('.lynx-ui-sheet__positioner')!
      await act(async () => {
        await vi.advanceTimersByTimeAsync(32)
        fireLayoutChange(positioner, { width: 393, height: 852 })
        await Promise.resolve()
      })
      expect(bodyRenderCount).toBe(1)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500)
      })

      // 4. Tap SheetBackdrop on PrimJS (where `queueMicrotask` is undefined): must close and unmount cleanly!
      const backdrop = container.querySelector('.lynx-ui-sheet-backdrop')!
      act(() => {
        fireEvent.tap(backdrop)
      })
      await act(async () => {
        await Promise.resolve()
        await vi.advanceTimersByTimeAsync(1500)
      })
      expect(container.querySelector('#safe-area-painted')).toBeNull()

      // 5. Reopen a rounded floating sheet and immediately drag UP & DOWN at t=400ms
      // (while the 1500ms entry spring is still in PresenceState.Entering): panel bottom
      // must stay locked at 852 - 8 = 844px instead of moving with the drag!
      function TouchSafeAreaHarness() {
        const surface = useSheetSurface({
          cornerRadius: 24,
          frame: { insets: { bottom: 8 }, width: '50%' },
        })
        return (
          <SheetRoot defaultShow={true} snapPoints={['45%', '100%']}>
            <SheetView>
              <SheetContent
                surface={surface}
                surfaceViewProps={{ id: 'touch-floating-painted' }}
              >
                {() => <text>Reader</text>}
              </SheetContent>
            </SheetView>
          </SheetRoot>
        )
      }
      const touchRender = render(<TouchSafeAreaHarness />)
      await act(async () => {
        await Promise.resolve()
        await vi.advanceTimersByTimeAsync(400)
      })
      const reopenedPainted = touchRender.container.querySelector(
        '#touch-floating-painted',
      )!
      fireEvent.touchstart(reopenedPainted, { detail: { x: 196, y: 500 } })
      fireEvent.touchmove(reopenedPainted, { detail: { x: 196, y: 480 } })
      fireEvent.touchmove(reopenedPainted, { detail: { x: 196, y: 200 } })
      const maskAfterDragUp = reopenedPainted.getAttribute('style') ?? ''
      const insetMatchUp = /inset\(0px 0px ([\d.]+)px 0px/.exec(maskAfterDragUp)
      expect(insetMatchUp).not.toBeNull()
      // Visible height must grow well beyond 45% (383.4px), so clippedBottom < 1278 - 600 = 678px.
      expect(Number(insetMatchUp![1])).toBeLessThan(678)

      fireEvent.touchmove(reopenedPainted, { detail: { x: 196, y: 650 } })
      const maskAfterDragDown = reopenedPainted.getAttribute('style') ?? ''
      const insetMatchDown = /inset\(0px 0px ([\d.]+)px 0px/.exec(
        maskAfterDragDown,
      )
      expect(insetMatchDown).not.toBeNull()
      // Visible height must shrink below 45% (383.4px) so bottom stays anchored at 8px above screen bottom.
      expect(Number(insetMatchDown![1])).toBeGreaterThan(895)
    } finally {
      env.backgroundThread.globalThis.SystemInfo = savedBgSystemInfo
      env.mainThread.globalThis.SystemInfo = savedMainSystemInfo
    }
  })
})
