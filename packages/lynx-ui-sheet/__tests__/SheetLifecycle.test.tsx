// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRef, runOnMainThread, useEffect, useState } from '@lynx-js/react'
import v8 from 'node:v8'
import vm from 'node:vm'

import { act, fireEvent, render } from '@lynx-js/react/testing-library'
import type { CSSProperties } from '@lynx-js/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SheetBackdrop,
  SheetBody,
  SheetFooter,
  SheetHandle,
  SheetNestedScrollContent,
  SheetPositioner,
  SheetRoot,
  SheetView,
  useSheetSurface,
} from '../src'
import type {
  SheetRootRef,
  SheetSnapPoint,
  SheetSurfaceFrame,
  SheetViewportInsets,
} from '../src'

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

const FLOATING_FRAME: SheetSurfaceFrame = {
  insets: { bottom: 8 },
  width: '50%',
  maxWidth: 664,
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
  const env = (
    globalThis as unknown as {
      lynxTestingEnv?: {
        switchToMainThread: () => void
        switchToBackgroundThread: () => void
        mainThread?: { globalThis?: typeof globalThis }
        backgroundThread?: { globalThis?: typeof globalThis }
      }
    }
  ).lynxTestingEnv
  const mainRaf = (cb: FrameRequestCallback) =>
    setTimeout(() => {
      const wasBackground = Boolean(
        (globalThis as unknown as { __JS__?: boolean }).__JS__,
      )
      if (wasBackground) env?.switchToMainThread()
      try {
        cb(Date.now())
      } finally {
        if (wasBackground) env?.switchToBackgroundThread()
      }
    }, 16) as unknown as number
  const cancelFrame = (id: number) => clearTimeout(id)
  globalThis.requestAnimationFrame = mainRaf
  globalThis.cancelAnimationFrame = cancelFrame
  if (env?.mainThread?.globalThis) {
    env.mainThread.globalThis.requestAnimationFrame = mainRaf
    env.mainThread.globalThis.cancelAnimationFrame = cancelFrame
    Reflect.deleteProperty(env.mainThread.globalThis, 'queueMicrotask')
  }
  const bgGlobal = (env as unknown as {
    backgroundThread?: { globalThis?: Record<string, unknown> }
  })?.backgroundThread?.globalThis
  if (bgGlobal) {
    Reflect.deleteProperty(bgGlobal, 'queueMicrotask')
  }
  Reflect.deleteProperty(globalThis, 'queueMicrotask')
}

describe('Sheet dual-thread ReactLynx lifecycle integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installFakeAnimationFrames()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('survives show=true mount, mid-flight SheetPositioner re-render, and GC before firing onOpen', async () => {
    const onOpen = vi.fn()
    const onClose = vi.fn()

    function SafeAreaHarness() {
      const surface = useSheetSurface({
        cornerRadius: 24,
        frame: FLOATING_FRAME,
      })
      return (
        <SheetRoot
          show={true}
          onOpen={onOpen}
          onClose={onClose}
          screenWidth={800}
          screenHeight={1000}
          snapPoints={['45%', '100%']}
        >
          <SheetView>
            <SheetPositioner positionerProps={{ id: 'positioner' }}>
              <SheetBackdrop />
              <SheetNestedScrollContent
                surface={surface}
                surfaceViewProps={{ id: 'painted-surface' }}
              >
                {() => (
                  <>
                    <SheetHandle />
                    <SheetBody viewportInsets={{ top: 64, right: 84 }}>
                      <text>Reader</text>
                    </SheetBody>
                  </>
                )}
              </SheetNestedScrollContent>
            </SheetPositioner>
          </SheetView>
        </SheetRoot>
      )
    }

    function mountSafeArea() {
      const { container } = render(<SafeAreaHarness />)
      return container.querySelector('#positioner')!
    }

    const positioner = mountSafeArea()
    expect(positioner).not.toBeNull()

    // Advance partway into the opening spring.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(32)
    })

    // Trigger SheetPositioner layout measurement mid-flight (causing BTS Render #2
    // to replace Render #1's worklet refs in the snapshot), then run V8 GC + a real
    // event-loop turn so FinalizationRegistry dispatches releaseBackgroundWorkletCtx.
    await act(async () => {
      fireLayoutChange(positioner, { width: 800, height: 960 })
      await Promise.resolve()
    })
    await flushFinalizers()
    await flushFinalizers()

    // Advance spring to completion: runOnBackground(onEntered) must resolve without throwing
    // "runOnBackground: JS function not found".
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    const backdrop = positioner.querySelector('.lynx-ui-sheet-backdrop')!
    expect(backdrop.getAttribute('style')).toContain('opacity: 0.45')
  })

  it('mounts on Render #1 when show flips false->true and stays latched across rapid false->true->false toggles', async () => {
    const onOpen = vi.fn()
    const onClose = vi.fn()

    function ControlledHarness({ show }: { show: boolean }) {
      return (
        <SheetRoot
          show={show}
          onOpen={onOpen}
          onClose={onClose}
          screenWidth={400}
          screenHeight={800}
          snapPoints={[400]}
        >
          <SheetView>
            <SheetBackdrop />
            <SheetNestedScrollContent surfaceViewProps={{ id: 'surface' }}>
              {() => <text>Body</text>}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    const { container, rerender } = render(<ControlledHarness show={false} />)
    expect(container.querySelector('#surface')).toBeNull()

    // Flip show=true: mounts immediately on Render #1 and begins opening in the same commit.
    rerender(<ControlledHarness show={true} />)
    expect(container.querySelector('#surface')).not.toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32)
    })
    expect(
      Number.parseFloat(
        container
          .querySelector('.lynx-ui-sheet-backdrop')!
          .getAttribute('style')
          ?.match(/opacity:\s*([0-9.]+)/)?.[1] ?? '0',
      ),
    ).toBeGreaterThan(0)

    // Rapidly flip show=false mid-opening: stays mounted during exit until spring settles at 0.
    rerender(<ControlledHarness show={false} />)
    expect(container.querySelector('#surface')).not.toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(container.querySelector('#surface')).toBeNull()
  })

  it('preserves imperative snapTo(1, { animate: false }) from closed without autoOpen hijacking to snap 0', async () => {
    const sheetRef = createRef<SheetRootRef>()
    const onOpen = vi.fn()
    const onSnapChange = vi.fn()

    render(
      <SheetRoot
        ref={sheetRef}
        defaultShow={false}
        onOpen={onOpen}
        onSnapChange={onSnapChange}
        screenWidth={400}
        screenHeight={800}
        snapPoints={[300, 700]}
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
      sheetRef.current?.snapTo(1, { animate: false })
      await Promise.resolve()
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onSnapChange).toHaveBeenLastCalledWith(1, 700)
  })

  it('restores fullscreen surface styles across React __SetInlineStyles re-renders and clears SheetBody 44px->0px insets', async () => {
    let applyFullscreenMT: (() => void) | undefined

    function FullscreenHarness({
      surfaceStyle,
      insets,
    }: {
      surfaceStyle: CSSProperties
      insets: SheetViewportInsets
    }) {
      const surface = useSheetSurface({
        cornerRadius: 26,
        frame: {
          insets: { left: 24, right: 24, bottom: 8 },
          maxWidth: 664,
        },
      })
      applyFullscreenMT = () => {
        'main thread'
        surface.controllerRef.current?.setFrame({ insets: { bottom: 0 } })
        surface.controllerRef.current?.setCornerRadius(0)
      }
      return (
        <SheetRoot
          show={true}
          screenWidth={1000}
          screenHeight={800}
          snapPoints={['100%']}
        >
          <SheetView>
            <SheetNestedScrollContent
              surface={surface}
              surfaceViewProps={{ id: 'painted-surface' }}
              innerViewProps={{ id: 'sheet-panel' }}
              style={surfaceStyle}
            >
              {() => (
                <SheetBody viewportInsets={insets}>
                  <view id='body-inner' />
                </SheetBody>
              )}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    const { container, rerender } = render(
      <FullscreenHarness
        surfaceStyle={{ backgroundColor: 'rgb(17, 17, 17)' }}
        insets={{ top: 59, bottom: 34, left: 44, right: 44 }}
      />,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    const painted = container.querySelector('#painted-surface')!
    const panel = container.querySelector('#sheet-panel')!
    const bodyInner = container.querySelector('#body-inner')!
    const bodyPositioned = bodyInner.parentElement!.parentElement!
    const bodySlot = bodyPositioned.parentElement!.parentElement!
    fireLayoutChange(painted, { left: 0, top: 0, width: 664, height: 1200 })
    fireLayoutChange(panel, { left: 0, top: 0, width: 1000, height: 800 })
    fireLayoutChange(bodySlot, { left: 0, top: 0, width: 1000, height: 800 })

    await act(async () => {
      await runOnMainThread(applyFullscreenMT!)()
    })

    expect(painted.getAttribute('style')).toContain('width: 100%')
    expect(painted.getAttribute('style')).toContain(
      'border-top-left-radius: 0px',
    )
    expect(bodyPositioned.getAttribute('style')).toContain('left: 44px')
    expect(bodyPositioned.getAttribute('style')).toContain('right: 44px')

    // Re-render with a new surface style (triggering ReactLynx __SetInlineStyles) AND
    // toggle horizontal viewportInsets from 44px back to 0px.
    rerender(
      <FullscreenHarness
        surfaceStyle={{ backgroundColor: 'rgb(34, 34, 34)' }}
        insets={{ top: 59, bottom: 34, left: 0, right: 0 }}
      />,
    )

    expect(painted.getAttribute('style')).toContain('width: 100%')
    expect(painted.getAttribute('style')).toContain(
      'border-top-left-radius: 0px',
    )
    expect(bodyPositioned.getAttribute('style')).toContain('left: 0px')
    expect(bodyPositioned.getAttribute('style')).toContain('right: 0px')
  })

  it('resolves Pass-1 fit snap with SheetFooter without double-counting bottom safe-area inset', async () => {
    const onOpen = vi.fn()

    const { container } = render(
      <SheetRoot
        show={true}
        onOpen={onOpen}
        screenWidth={400}
        screenHeight={800}
        snapPoints={['fit']}
      >
        <SheetView>
          <SheetNestedScrollContent
            surfaceViewProps={{ id: 'painted-surface' }}
            innerViewProps={{ id: 'sheet-panel' }}
          >
            {() => (
              <>
                <SheetBody viewportInsets={{ bottom: 34 }}>
                  <view id='fit-child' />
                </SheetBody>
                <SheetFooter>
                  <view id='footer-child' />
                </SheetFooter>
              </>
            )}
          </SheetNestedScrollContent>
        </SheetView>
      </SheetRoot>,
    )

    const movement = container.querySelector('#painted-surface')!.parentElement!
    const panel = container.querySelector('#sheet-panel')!
    const intrinsicWrapper = container.querySelector('#fit-child')!
      .parentElement!.parentElement!
    const bodySlot = intrinsicWrapper.parentElement!.parentElement!
    const footerRoot = container.querySelector('#footer-child')!.parentElement!

    await act(async () => {
      fireLayoutChange(panel, { width: 400, height: 0 })
      fireLayoutChange(bodySlot, { width: 400, height: 0 })
      fireLayoutChange(intrinsicWrapper, { width: 400, height: 200 })
      fireLayoutChange(footerRoot, { width: 400, height: 60 })
      await vi.advanceTimersByTimeAsync(3000)
    })

    // 200px body + 60px footer (which already covers the 34px bottom safe area) = 260px, not 294px.
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(movement.getAttribute('style')).toContain('translate(0px, -260px)')
  })

  it('never remounts SheetBody children across viewportInsets or snapPoints toggles and supports multiple bodies', async () => {
    let childMounts = 0
    let childUnmounts = 0

    function StatefulChild() {
      const [count] = useState(42)
      useEffect(() => {
        childMounts += 1
        return () => {
          childUnmounts += 1
        }
      }, [])
      return <text id='stateful-child'>{String(count)}</text>
    }

    function BodyHarness({
      insets,
      snapPoints,
      showSecondBody,
    }: {
      insets?: SheetViewportInsets
      snapPoints: SheetSnapPoint[]
      showSecondBody: boolean
    }) {
      return (
        <SheetRoot
          show={true}
          screenWidth={500}
          screenHeight={800}
          snapPoints={snapPoints}
        >
          <SheetView>
            <SheetNestedScrollContent
              surfaceViewProps={{ id: 'multi-surface' }}
              innerViewProps={{ id: 'multi-panel' }}
            >
              {() => (
                <>
                  <SheetBody
                    className='primary-body'
                    style={{ maxHeight: '640px' }}
                    bodyViewProps={{ id: 'primary-content' }}
                    viewportInsets={insets}
                  >
                    <StatefulChild />
                  </SheetBody>
                  {showSecondBody && (
                    <SheetBody
                      bodyViewProps={{ id: 'secondary-content' }}
                      viewportInsets={{ left: 30, right: 30 }}
                    >
                      <view id='secondary-child' />
                    </SheetBody>
                  )}
                </>
              )}
            </SheetNestedScrollContent>
          </SheetView>
        </SheetRoot>
      )
    }

    const { container, rerender } = render(
      <BodyHarness
        insets={undefined}
        snapPoints={[400, 800]}
        showSecondBody={true}
      />,
    )
    expect(childMounts).toBe(1)
    expect(childUnmounts).toBe(0)
    const initialContentEl = container.querySelector('#primary-content')!
    expect(initialContentEl.getAttribute('class')).toBe('primary-body')
    expect(initialContentEl.getAttribute('style')).toContain(
      'max-height: 640px',
    )

    // 1. Async safe-area insets arrive (undefined -> { left: 50, right: 60 }): zero remount!
    rerender(
      <BodyHarness
        insets={{ left: 50, right: 60, top: 44 }}
        snapPoints={[400, 800]}
        showSecondBody={true}
      />,
    )
    expect(childMounts).toBe(1)
    expect(childUnmounts).toBe(0)
    expect(container.querySelector('#primary-content')).toBe(initialContentEl)

    const painted = container.querySelector('#multi-surface')!
    const panel = container.querySelector('#multi-panel')!
    const primaryMover = initialContentEl.parentElement!
    const primarySlot = primaryMover.parentElement!.parentElement!
    const secondaryContent = container.querySelector('#secondary-content')!
    const secondaryMover = secondaryContent.parentElement!
    const secondarySlot = secondaryMover.parentElement!.parentElement!

    await act(async () => {
      fireLayoutChange(painted, { left: 0, top: 0, width: 500, height: 1200 })
      fireLayoutChange(panel, { left: 0, top: 0, width: 500, height: 800 })
      fireLayoutChange(primarySlot, {
        left: 0,
        top: 0,
        width: 500,
        height: 400,
      })
      fireLayoutChange(secondarySlot, {
        left: 0,
        top: 400,
        width: 500,
        height: 400,
      })
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(primaryMover.getAttribute('style')).toContain('left: 50px')
    expect(primaryMover.getAttribute('style')).toContain('right: 60px')
    expect(secondaryMover.getAttribute('style')).toContain('left: 30px')
    expect(secondaryMover.getAttribute('style')).toContain('right: 30px')

    // 2. Unmounting the second SheetBody must NOT clear or disturb the first SheetBody!
    rerender(
      <BodyHarness
        insets={{ left: 20, right: 40, top: 44 }}
        snapPoints={[400, 800]}
        showSecondBody={false}
      />,
    )
    expect(primaryMover.getAttribute('style')).toContain('left: 20px')
    expect(primaryMover.getAttribute('style')).toContain('right: 40px')

    // 3. Switching snapPoints to ['fit'] and back to [400, 800], then clearing insets: zero remount!
    rerender(
      <BodyHarness
        insets={{ left: 20, right: 40, top: 44 }}
        snapPoints={['fit']}
        showSecondBody={false}
      />,
    )
    rerender(
      <BodyHarness
        insets={undefined}
        snapPoints={[400, 800]}
        showSecondBody={false}
      />,
    )
    expect(childMounts).toBe(1)
    expect(childUnmounts).toBe(0)
    expect(container.querySelector('#primary-content')).toBe(initialContentEl)
  })
})
