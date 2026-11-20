// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
import type * as MotionMini from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SheetCornerRadius, SheetInsets } from '../types'
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

const LAYOUT_KEYS = ['width', 'height', 'top', 'bottom', 'left', 'right']

function assertNoLayoutWrites(spy: ReturnType<typeof vi.fn>) {
  for (const call of spy.mock.calls) {
    const style = call[0] as Record<string, unknown>
    for (const key of LAYOUT_KEYS) {
      expect(style).not.toHaveProperty(key)
    }
  }
}

function setup(
  insets: SheetInsets | null = { bottom: 8 },
  hasFitSnapPoint = false,
  resolvedSide: 'bottom' | 'right' | 'left' | 'top' = 'bottom',
  maxSnapSize = 800,
  enableRTL = false,
  hasController = false,
) {
  const initialInsets = insets ?? undefined
  const position = { current: createMotionValue(400) }
  const presence = { current: PresenceState.Entered }
  const clipStyle: Record<string, string> = {}
  const surfaceStyle: Record<string, string> = {}
  const viewportStyle: Record<string, string> = {}
  const movingStyle: Record<string, string> = {}
  const clipSpy = vi.fn((style: object) => Object.assign(clipStyle, style))
  const surfaceSpy = vi.fn((style: object) =>
    Object.assign(surfaceStyle, style)
  )
  const viewportSpy = vi.fn((style: object) =>
    Object.assign(viewportStyle, style)
  )
  const movingSpy = vi.fn((style: object) => Object.assign(movingStyle, style))
  const movingSurfaceMTRef = {
    current: {
      setStyleProperties: movingSpy,
    } as unknown as MainThread.Element,
  }
  const clip = {
    setStyleProperties: clipSpy,
  } as unknown as MainThread.Element
  const surface = {
    setStyleProperties: surfaceSpy,
  } as unknown as MainThread.Element
  const viewport = {
    setStyleProperties: viewportSpy,
  } as unknown as MainThread.Element

  function render(
    nextInsets: SheetInsets | undefined = initialInsets,
    cornerRadius?: SheetCornerRadius,
    baseStyle?: Parameters<typeof useSheetSurfaceLayout>[0]['surfaceStyle'],
  ) {
    hooks.cursor = 0
    hooks.subscriptionCursor = 0
    hooks.effects = []
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const layout = useSheetSurfaceLayout({
      position,
      presence,
      resolvedSide,
      enableRTL,
      cornerRadius,
      insets: nextInsets,
      hasController,
      surfaceStyle: baseStyle,
      screenHeight: 1000,
      screenWidth: 1000,
      allowOverDrag: false,
      sheetSizeMTRef: { current: maxSnapSize },
      movingSurfaceMTRef,
      maxSnapSize,
      hasFitSnapPoint,
      initialSize: () => 400,
      initialSnap: 0,
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
    clipStyle,
    surfaceStyle,
    viewportStyle,
    movingStyle,
    clipSpy,
    surfaceSpy,
    viewportSpy,
    movingSpy,
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

  it('preserves extended attached coverage with no empty-object mode trap', () => {
    const { position, surfaceStyle, viewportStyle, render } = setup(null)
    expect(surfaceStyle).toEqual({ height: '1500px' })
    expect(viewportStyle.height).toBe('800px')
    position.current.set(850)
    expect(surfaceStyle.height).toBe('1500px')

    // Explicit zero insets and zero radius stay attached (no clip-path).
    render({ bottom: 0 }, 0)
    expect(surfaceStyle['clip-path']).toBeUndefined()
  })

  it.each([undefined, 0, 24])(
    'keeps panel and viewport geometry independent of the radius (%s)',
    radius => {
      const {
        position,
        render,
        surfaceStyle,
        viewportStyle,
        movingStyle,
        clipStyle,
      } = setup()
      render({ bottom: 8 }, radius)

      expect(clipStyle.bottom).toBe('8px')
      expect(movingStyle.transform).toBe('translate(0px, -400px)')
      expect(surfaceStyle.height).toBe('1500px')
      expect(surfaceStyle['clip-path']).toBe(
        `inset(0px 0px 1100px 0px round 0px 0px ${radius ?? 0}px ${
          radius ?? 0
        }px)`,
      )
      expect(viewportStyle.height).toBe('800px')

      position.current.set(850)
      expect(movingStyle.transform).toBe('translate(0px, -850px)')
      expect(surfaceStyle.height).toBe('1500px')
      expect(viewportStyle.height).toBe('800px')

      position.current.set(1000)
      expect(movingStyle.transform).toBe('translate(0px, -992px)')
      expect(surfaceStyle['clip-path']).toBe(
        `inset(0px 0px 508px 0px round 0px 0px ${radius ?? 0}px ${
          radius ?? 0
        }px)`,
      )
      expect(viewportStyle.height).toBe('800px')
    },
  )

  it('applies independent corners immediately and restores CSS when a corner is omitted', () => {
    const { render, surfaceStyle } = setup()
    const baseStyle = { borderTopLeftRadius: '12rpx' }
    render(
      { bottom: 8 },
      { topLeft: 20, bottomRight: 12, bottomLeft: 24 },
      baseStyle,
    )
    expect(surfaceStyle).toMatchObject({
      'border-top-left-radius': '20px',
      'clip-path': 'inset(0px 0px 1100px 0px round 0px 0px 12px 24px)',
    })
    expect(surfaceStyle).not.toHaveProperty('border-top-right-radius')
    render({ bottom: 8 }, { bottomLeft: 24 }, baseStyle)
    expect(surfaceStyle).toMatchObject({
      'border-top-left-radius': '12rpx',
      'clip-path': 'inset(0px 0px 1100px 0px round 0px 0px 0px 24px)',
    })
  })

  it('clears a managed corner without inline CSS so class styles can apply', () => {
    const { render, surfaceStyle } = setup()
    render({ bottom: 8 }, { topLeft: 20, topRight: 18 })
    expect(surfaceStyle['border-top-left-radius']).toBe('20px')

    render({ bottom: 8 }, { topRight: 18 })
    expect(surfaceStyle['border-top-left-radius']).toBeNull()
    expect(surfaceStyle['border-top-right-radius']).toBe('18px')
  })

  it.each([false, true])(
    'uses a stable body height with zero layout writes during vertical drag (floating %s)',
    floating => {
      const { position, bodyContext, measureBodyParentMT } = setup(
        floating ? { bottom: 8 } : null,
        false,
        'bottom',
        1000,
      )
      const writeBody = vi.fn()
      const writeClip = vi.fn()
      bodyContext.setBodyClipMTRef?.(
        { setStyleProperties: writeClip } as unknown as MainThread.Element,
      )
      bodyContext.setBodyMTRef(
        { setStyleProperties: writeBody } as unknown as MainThread.Element,
        { top: 82, bottom: 40 },
      )
      const parentHeight = floating ? 992 : 1000
      measureBodyParentMT({ width: 1000, height: parentHeight })
      bodyContext.measureBodyMT({
        top: 24,
        width: 1000,
        height: parentHeight - 24,
      })
      expect(writeClip).toHaveBeenLastCalledWith({
        height: '878px',
        transform: floating ? 'translateY(-534px)' : 'translateY(-542px)',
      })
      writeBody.mockClear()
      writeClip.mockClear()
      position.current.set(900)
      position.current.set(950)
      position.current.set(1000)
      assertNoLayoutWrites(writeClip)
      assertNoLayoutWrites(writeBody)
      expect(writeClip.mock.calls.flat()).toEqual([
        { transform: floating ? 'translateY(-34px)' : 'translateY(-42px)' },
        { transform: floating ? 'translateY(16px)' : 'translateY(8px)' },
        { transform: 'translateY(58px)' },
      ])
      expect(writeBody.mock.calls.flat()).toEqual([
        { transform: floating ? 'translateY(34px)' : 'translateY(42px)' },
        { transform: 'translateY(0px)' },
      ])
    },
  )

  it('protects vertical edges of a top sheet using transform + clip with zero layout writes during drag', () => {
    const { position, bodyContext, measureBodyParentMT } = setup(
      null,
      false,
      'top',
      1000,
    )
    const writeBody = vi.fn()
    const writeClip = vi.fn()
    bodyContext.setBodyClipMTRef?.(
      { setStyleProperties: writeClip } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(
      { setStyleProperties: writeBody } as unknown as MainThread.Element,
      { top: 60, bottom: 40 },
    )
    measureBodyParentMT({ left: 0, top: 0, width: 1000, height: 1000 })
    bodyContext.measureBodyMT({ left: 0, top: 0, width: 1000, height: 1000 })
    writeBody.mockClear()
    writeClip.mockClear()
    position.current.set(500)
    position.current.set(800)
    position.current.set(1000)
    assertNoLayoutWrites(writeClip)
    assertNoLayoutWrites(writeBody)
    expect(writeClip).toHaveBeenLastCalledWith({
      transform: 'translateY(60px)',
    })
    expect(writeBody).toHaveBeenLastCalledWith({
      transform: 'translateY(0px)',
    })
  })

  it.each(['right', 'left'] as const)(
    'protects horizontal edges of a %s drawer using transform + clip with zero layout writes during drag',
    side => {
      const { position, bodyContext, measureBodyParentMT } = setup(
        null,
        false,
        side,
      )
      const writeBody = vi.fn()
      const writeClip = vi.fn()
      bodyContext.setBodyClipMTRef?.(
        { setStyleProperties: writeClip } as unknown as MainThread.Element,
      )
      bodyContext.setBodyMTRef(
        { setStyleProperties: writeBody } as unknown as MainThread.Element,
        { top: 20, left: 250, right: 250 },
      )
      measureBodyParentMT({ left: 0, top: 0, width: 800, height: 1000 })
      bodyContext.measureBodyMT({ left: 0, top: 0, width: 800, height: 1000 })
      expect(writeClip).toHaveBeenLastCalledWith({
        width: '500px',
        transform: side === 'right'
          ? 'translateX(-350px)'
          : 'translateX(300px)',
      })
      expect(writeBody).toHaveBeenLastCalledWith({
        top: '20px',
        bottom: '0px',
        transform: 'translateX(350px)',
      })

      writeBody.mockClear()
      writeClip.mockClear()
      position.current.set(600)
      position.current.set(800)
      assertNoLayoutWrites(writeClip)
      assertNoLayoutWrites(writeBody)
      expect(writeClip).toHaveBeenLastCalledWith({
        transform: side === 'right' ? 'translateX(50px)' : 'translateX(250px)',
      })
      expect(writeBody).toHaveBeenLastCalledWith({
        transform: 'translateX(0px)',
      })
    },
  )

  it('resolves logical start/end body insets with enableRTL', () => {
    const { bodyContext, measureBodyParentMT } = setup(
      null,
      false,
      'bottom',
      1000,
      true,
    )
    const writeBody = vi.fn()
    bodyContext.setBodyClipMTRef?.(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(
      { setStyleProperties: writeBody } as unknown as MainThread.Element,
      { start: 60, end: 20 },
    )
    measureBodyParentMT({ left: 0, top: 0, width: 1000, height: 1000 })
    bodyContext.measureBodyMT({ left: 0, top: 0, width: 1000, height: 1000 })
    expect(writeBody).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: '20px', right: '60px' }),
    )
  })

  it('uses a shared layout frame when a side sheet is offset inside its pane', () => {
    const { bodyContext, measureBodyParentMT, measureSurfaceMT, position } =
      setup(null, false, 'right')
    const write = vi.fn()
    bodyContext.setBodyClipMTRef?.(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(
      { setStyleProperties: write } as unknown as MainThread.Element,
      { top: 86, bottom: 24 },
    )
    measureSurfaceMT(
      { detail: { left: 0, top: 0 } } as MainThread.LayoutChangeEvent,
    )
    measureBodyParentMT({ left: 0, top: 0, width: 800, height: 1000 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 800, height: 976 })
    expect(write).toHaveBeenLastCalledWith({
      top: '62px',
      bottom: '24px',
      transform: 'translateX(0px)',
    })
    write.mockClear()
    position.current.set(800)
    expect(write).not.toHaveBeenCalled()
    measureSurfaceMT(
      { detail: { left: 0, top: 100 } } as MainThread.LayoutChangeEvent,
    )
    measureBodyParentMT({ left: 0, top: 100, width: 800, height: 1000 })
    bodyContext.measureBodyMT({ left: 0, top: 124, width: 800, height: 976 })
    expect(write).toHaveBeenLastCalledWith({
      top: '0px',
      bottom: '124px',
    })
  })

  it('clamps SheetBody horizontally in the same tick as setInsetsMT with zero second-pass layout writes', () => {
    const {
      setInsetsMT,
      bodyContext,
      measureSurfaceMT,
      measureBodyParentMT,
      surfaceSpy,
    } = setup(
      { left: 168, right: 168, bottom: 8 },
      false,
      'bottom',
      1000,
      false,
      true,
    )
    const writeBody = vi.fn()
    const writeClip = vi.fn()
    bodyContext.setBodyClipMTRef?.(
      { setStyleProperties: writeClip } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(
      { setStyleProperties: writeBody } as unknown as MainThread.Element,
      { top: 64, right: 84 },
    )
    measureBodyParentMT({ left: 0, top: 0, width: 664, height: 1000 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 664, height: 976 })
    writeBody.mockClear()
    surfaceSpy.mockClear()

    // Widen to right=20 (overlaps 84px right safe area by 64px) on MT.
    setInsetsMT({ left: 20, right: 20, bottom: 2 })
    expect(surfaceSpy).toHaveBeenCalledWith({ left: '20px', width: '960px' })
    // SheetBody receives exact right='64px' in the SAME tick before layout!
    expect(writeBody).toHaveBeenCalledWith(
      expect.objectContaining({ left: '0px', right: '64px' }),
    )

    // When native layoutchange events arrive after the single layout pass,
    // SheetBody must NOT trigger a second layout write!
    writeBody.mockClear()
    measureSurfaceMT(
      { detail: { left: 20, top: 0 } } as MainThread.LayoutChangeEvent,
    )
    measureBodyParentMT({ left: 0, top: 0, width: 960, height: 1000 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 960, height: 976 })
    assertNoLayoutWrites(writeBody)
  })

  it('avoids per-frame clip.bottom layout during enter, exit, and setInsets bottom transitions', () => {
    const {
      position,
      presence,
      surfaceStyle,
      movingStyle,
      clipStyle,
      clipSpy,
      viewportSpy,
      setInsetsMT,
      setCornerRadiusMT,
      settleSurfaceMT,
    } = setup({ bottom: 8 }, false, 'bottom', 1000, false, true)
    const initialMask = surfaceStyle['clip-path']

    // Leave animation: clip.bottom drops to 0 once, then ZERO clip layout writes per frame.
    presence.current = PresenceState.Leaving
    position.current.set(200)
    clipSpy.mockClear()
    viewportSpy.mockClear()
    position.current.set(100)
    position.current.set(50)
    position.current.set(0)
    assertNoLayoutWrites(clipSpy)
    assertNoLayoutWrites(viewportSpy)
    expect(clipStyle.bottom).toBe('0px')
    expect(movingStyle.transform).toBe('translate(0px, 0px)')
    expect(surfaceStyle['clip-path']).toBe(initialMask)

    // Enter animation: ZERO clip layout writes per frame while sliding in.
    presence.current = PresenceState.Entering
    clipSpy.mockClear()
    position.current.set(100)
    expect(movingStyle.transform).toBe('translate(0px, -102px)')
    position.current.set(200)
    expect(movingStyle.transform).toBe('translate(0px, -204px)')
    position.current.set(400)
    expect(movingStyle.transform).toBe('translate(0px, -408px)')
    assertNoLayoutWrites(clipSpy)

    // On settle: clip.bottom commits once to 8px and movingSurface compensates cleanly.
    presence.current = PresenceState.Entered
    settleSurfaceMT()
    expect(clipStyle.bottom).toBe('8px')
    expect(movingStyle.transform).toBe('translate(0px, -400px)')

    // Animated bottom gap via controller (8 -> 0): drops clip.bottom once, then 0 layout writes.
    setInsetsMT({ bottom: 6 })
    setCornerRadiusMT(18)
    clipSpy.mockClear()
    viewportSpy.mockClear()
    setInsetsMT({ bottom: 4 })
    setCornerRadiusMT(12)
    setInsetsMT({ bottom: 2 })
    setCornerRadiusMT(6)
    setInsetsMT({ bottom: 0 })
    setCornerRadiusMT(0)
    assertNoLayoutWrites(clipSpy)
    assertNoLayoutWrites(viewportSpy)
    expect(surfaceStyle['clip-path']).toBe('none')
  })

  it('allows native refs to attach before the motion value is initialized', () => {
    const { position, setSurfaceMTRef } = setup()
    Object.assign(position, { current: null })
    expect(() => setSurfaceMTRef({} as MainThread.Element)).not.toThrow()
  })

  it('does not constrain intrinsic fit measurement with the animated viewport', () => {
    const { position, viewportStyle } = setup({ bottom: 8 }, true)
    position.current.set(450)
    expect(viewportStyle).toEqual({})
  })

  it.each([-8, Number.NaN, Number.POSITIVE_INFINITY])(
    'normalizes invalid gaps: %s',
    gap => {
      expect(setup({ bottom: gap }).clipStyle.bottom).toBe('0px')
    },
  )
})
