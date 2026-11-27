// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
import type * as MotionMini from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  SheetCornerRadius,
  SheetSurfaceFrame,
  SheetViewportSize,
} from '../types'
import { useSheetBodyInsets } from './useSheetBodyInsets'
import { useSheetSurface } from './useSheetSurface'
import { useSheetSurfaceLayout } from './useSheetSurfaceLayout'
import {
  normalizeInset,
  resolveSurfaceHorizontalFrame,
} from '../utils/surfaceFrame'

const hooks = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effects: [] as Array<() => unknown>,
  subscriptions: [] as Array<() => void>,
  subscriptionCursor: 0,
}))

vi.mock('@lynx-js/react', () => ({
  createContext: () => ({ Provider: 'context-provider' }),
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
  useMemo: <T>(fn: () => T) => fn(),
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
  frame: SheetSurfaceFrame | null = { insets: { bottom: 8 } },
  hasFitSnapPoint = false,
  resolvedSide: 'bottom' | 'right' | 'left' | 'top' = 'bottom',
  maxSnapSize = 800,
  enableRTL = false,
  initialCornerRadius?: SheetCornerRadius,
  fitMinSize?: number,
  fitMaxSize?: number,
) {
  for (const unsubscribe of hooks.subscriptions) unsubscribe()
  hooks.slots = []
  hooks.subscriptions = []
  const initialFrame = frame ?? undefined
  const position = { current: createMotionValue(400) }
  const presence = { current: PresenceState.Entered }
  const sheetSizeMTRef = { current: maxSnapSize }
  const initialHorizontal = resolvedSide === 'left' || resolvedSide === 'right'
    ? null
    : resolveSurfaceHorizontalFrame(initialFrame, 1000, enableRTL)
  const initialBottom = resolvedSide === 'bottom'
    ? normalizeInset(initialFrame?.insets?.bottom)
    : 0
  const initialViewportHeight = resolvedSide === 'bottom'
    ? Math.min(maxSnapSize, Math.max(0, 1000 - initialBottom))
    : maxSnapSize
  const clipStyle: Record<string, string> = { transform: 'translateY(0px)' }
  const surfaceStyle: Record<string, string> = {
    ...(resolvedSide === 'bottom' || resolvedSide === 'top'
      ? { height: '1500px' }
      : {}),
    ...(initialHorizontal
      ? {
        transform: `translateX(${initialHorizontal.left}px)`,
        width: `${initialHorizontal.width}px`,
      }
      : {}),
  }
  const viewportStyle: Record<string, string> = hasFitSnapPoint
    ? {}
    : { height: `${initialViewportHeight}px` }
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
    nextFrame: SheetSurfaceFrame | undefined = initialFrame,
    cornerRadius: SheetCornerRadius | undefined = initialCornerRadius,
    baseStyle?: Parameters<typeof useSheetSurfaceLayout>[0]['surfaceStyle'],
    screenWidth = 1000,
    screenHeight = 1000,
    controlled?: {
      frame?: SheetSurfaceFrame
      cornerRadius?: SheetCornerRadius
    },
  ) {
    hooks.cursor = 0
    hooks.subscriptionCursor = 0
    hooks.effects = []
    const activeFrame = controlled?.frame ?? nextFrame
    const activeRadius = controlled?.cornerRadius ?? cornerRadius
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const surfaceHandle = useSheetSurface({
      frame: activeFrame,
      cornerRadius: activeRadius,
    })
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const layout = useSheetSurfaceLayout({
      position,
      presence,
      resolvedSide,
      enableRTL,
      surface: surfaceHandle,
      surfaceStyle: baseStyle,
      screenHeight,
      screenWidth,
      allowOverDrag: false,
      sheetSizeMTRef,
      movingSurfaceMTRef,
      maxSnapSize,
      hasFitSnapPoint,
      fitMinSize,
      fitMaxSize,
      initialSize: () => 400,
      initialSnap: 0,
    })
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const bodyInsets = useSheetBodyInsets({
      resolvedSide: layout.bodyContext.resolvedSide,
      enableRTL: layout.bodyContext.enableRTL,
      screenWidth: layout.bodyContext.viewportWidth,
      screenHeight: layout.bodyContext.viewportHeight,
      maxSnapSize: layout.bodyContext.maxSnapSize,
      hasFitSnapPoint: layout.bodyContext.hasFitSnapPoint,
      fitMinSize: layout.bodyContext.fitMinSize,
      fitMaxSize: layout.bodyContext.fitMaxSize,
      hubMTRef: layout.bodyContext.hubMTRef,
    })
    layout.setClipMTRef(clip)
    layout.setSurfaceMTRef(surface)
    layout.setViewportMTRef(viewport)
    for (const effect of hooks.effects) effect()
    return {
      ...layout,
      setFrameMT: (
        f: SheetSurfaceFrame,
        opts?: { animating?: boolean },
      ) => surfaceHandle.controllerRef.current?.setFrame(f, opts),
      setCornerRadiusMT: (r: SheetCornerRadius | undefined) =>
        surfaceHandle.controllerRef.current?.setCornerRadius(r),
      getViewportSizeMT: (): SheetViewportSize =>
        surfaceHandle.controllerRef.current?.getViewportSize()
          ?? layout.getViewportSizeMT(),
      bodyContext: {
        ...layout.bodyContext,
        ...bodyInsets,
      },
    }
  }
  const layout = render()
  return {
    ...layout,
    render,
    position,
    presence,
    sheetSizeMTRef,
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

  it('preserves extended attached coverage with zero mount/drag layout writes and no empty-object mode trap', () => {
    const {
      position,
      surfaceStyle,
      viewportStyle,
      clipSpy,
      surfaceSpy,
      viewportSpy,
      setFrameMT,
      setCornerRadiusMT,
    } = setup(null)
    assertNoLayoutWrites(clipSpy)
    assertNoLayoutWrites(surfaceSpy)
    assertNoLayoutWrites(viewportSpy)
    expect(clipSpy).not.toHaveBeenCalled()
    expect(surfaceSpy).not.toHaveBeenCalled()
    expect(viewportSpy).not.toHaveBeenCalled()
    expect(surfaceStyle).toEqual({ height: '1500px' })
    expect(viewportStyle.height).toBe('800px')
    position.current.set(850)
    assertNoLayoutWrites(clipSpy)
    assertNoLayoutWrites(surfaceSpy)
    assertNoLayoutWrites(viewportSpy)
    expect(surfaceStyle.height).toBe('1500px')

    // Explicit zero insets and zero radius stay attached (no clip-path, no dead bottom corner writes).
    setFrameMT({ insets: { bottom: 0 } })
    setCornerRadiusMT(0)
    expect(surfaceStyle['clip-path']).toBeUndefined()
    expect(surfaceStyle['border-bottom-left-radius']).toBeUndefined()
    expect(surfaceStyle['border-bottom-right-radius']).toBeUndefined()
  })

  it.each([undefined, 0, 24])(
    'keeps panel and viewport geometry independent of the radius and gates clip-path to rounded bottom corners (%s)',
    radius => {
      const {
        position,
        surfaceStyle,
        viewportStyle,
        movingStyle,
        clipStyle,
        clipSpy,
        viewportSpy,
      } = setup(
        { insets: { bottom: 8 } },
        false,
        'bottom',
        800,
        false,
        radius,
      )

      assertNoLayoutWrites(clipSpy)
      assertNoLayoutWrites(viewportSpy)
      expect(clipStyle.transform).toBe('translateY(-8px)')
      expect(movingStyle.transform).toBe('translate(0px, -400px)')
      expect(surfaceStyle.height).toBe('1500px')
      expect(surfaceStyle['clip-path']).toBe(
        radius && radius > 0
          ? `inset(0px 0px 1100px 0px round 0px 0px ${radius}px ${radius}px)`
          : undefined,
      )
      expect(viewportStyle.height).toBe('800px')

      position.current.set(850)
      assertNoLayoutWrites(clipSpy)
      assertNoLayoutWrites(viewportSpy)
      expect(movingStyle.transform).toBe('translate(0px, -850px)')
      expect(surfaceStyle.height).toBe('1500px')
      expect(viewportStyle.height).toBe('800px')

      position.current.set(1000)
      expect(movingStyle.transform).toBe('translate(0px, -992px)')
      expect(surfaceStyle['clip-path']).toBe(
        radius && radius > 0
          ? `inset(0px 0px 508px 0px round 0px 0px ${radius}px ${radius}px)`
          : undefined,
      )
      expect(viewportStyle.height).toBe('800px')
    },
  )

  it('replaces corner updates so omitted or null corners restore CSS', () => {
    const { render, surfaceStyle } = setup()
    const baseStyle = { borderTopLeftRadius: '12rpx' }
    const { setCornerRadiusMT } = render(
      { insets: { bottom: 8 } },
      undefined,
      baseStyle,
    )
    setCornerRadiusMT({ topLeft: 20, bottomRight: 12, bottomLeft: 24 })
    expect(surfaceStyle).toMatchObject({
      'border-top-left-radius': '20px',
      'clip-path': 'inset(0px 0px 1100px 0px round 0px 0px 12px 24px)',
    })
    expect(surfaceStyle).not.toHaveProperty('border-top-right-radius')

    // Replace semantics: omitted topLeft restores baseStyle while specified bottom corners update.
    setCornerRadiusMT({ bottomRight: 12, bottomLeft: 18 })
    expect(surfaceStyle).toMatchObject({
      'border-top-left-radius': '12rpx',
      'clip-path': 'inset(0px 0px 1100px 0px round 0px 0px 12px 18px)',
    })

    // Explicit null also restores topLeft to baseStyle.
    setCornerRadiusMT({ topLeft: 20, bottomRight: 12, bottomLeft: 18 })
    setCornerRadiusMT({ topLeft: null, bottomRight: 12, bottomLeft: 18 })
    expect(surfaceStyle).toMatchObject({
      'border-top-left-radius': '12rpx',
      'clip-path': 'inset(0px 0px 1100px 0px round 0px 0px 12px 18px)',
    })

    // Undefined resets all corners to CSS and clears clip-path when bottom corners are square.
    setCornerRadiusMT(undefined)
    expect(surfaceStyle['clip-path']).toBe('none')
  })

  it('clears a corner explicitly set to null or omitted without inline CSS so class styles can apply', () => {
    const { setCornerRadiusMT, surfaceStyle } = setup()
    setCornerRadiusMT({ topLeft: 20, topRight: 18 })
    expect(surfaceStyle['border-top-left-radius']).toBe('20px')

    setCornerRadiusMT({ topLeft: null, topRight: 18 })
    expect(surfaceStyle['border-top-left-radius']).toBeNull()
    expect(surfaceStyle['border-top-right-radius']).toBe('18px')
  })

  it.each([false, true])(
    'uses a stable body height with zero layout writes during vertical drag (floating %s)',
    floating => {
      const { position, bodyContext, measureBodyParentMT } = setup(
        floating ? { insets: { bottom: 8 } } : null,
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

  it('clamps SheetBody horizontally in the same tick as setFrameMT with zero second-pass layout writes', () => {
    const {
      setFrameMT,
      bodyContext,
      measureSurfaceMT,
      measureBodyParentMT,
      surfaceSpy,
    } = setup(
      { insets: { left: 168, right: 168, bottom: 8 } },
      false,
      'bottom',
      1000,
      false,
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
    setFrameMT({ insets: { left: 20, right: 20, bottom: 2 } })
    expect(surfaceSpy).toHaveBeenCalledWith({
      transform: 'translateX(20px)',
      width: '960px',
    })
    // SheetBody receives exact right='64px' in the SAME tick before layout!
    expect(writeBody).toHaveBeenCalledWith(
      expect.objectContaining({ left: '0px', right: '64px' }),
    )

    // When native layoutchange events arrive after the single layout pass,
    // SheetBody must NOT trigger a second layout write!
    writeBody.mockClear()
    measureSurfaceMT(
      { detail: { left: 0, top: 0 } } as MainThread.LayoutChangeEvent,
    )
    measureBodyParentMT({ left: 0, top: 0, width: 960, height: 1000 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 960, height: 976 })
    assertNoLayoutWrites(writeBody)
  })

  it('performs zero clip layout writes across enter, exit, settle, and animated bottom transitions', () => {
    const {
      position,
      presence,
      surfaceStyle,
      surfaceSpy,
      movingStyle,
      clipStyle,
      clipSpy,
      viewportSpy,
      setFrameMT,
      setCornerRadiusMT,
      settleSurfaceMT,
    } = setup({ insets: { bottom: 8 } }, false, 'bottom', 1000, false, 24)
    const initialMask = surfaceStyle['clip-path']
    assertNoLayoutWrites(clipSpy)

    // Leave animation: clip smoothly translates via transform with ZERO layout writes.
    presence.current = PresenceState.Leaving
    position.current.set(200)
    position.current.set(100)
    position.current.set(50)
    position.current.set(0)
    assertNoLayoutWrites(clipSpy)
    assertNoLayoutWrites(viewportSpy)
    expect(clipStyle.transform).toBe('translateY(0px)')
    expect(movingStyle.transform).toBe('translate(0px, 0px)')
    expect(surfaceStyle['clip-path']).toBe(initialMask)

    // Enter animation: ZERO clip layout writes while sliding in.
    presence.current = PresenceState.Entering
    position.current.set(100)
    expect(clipStyle.transform).toBe('translateY(0px)')
    expect(movingStyle.transform).toBe('translate(0px, -102px)')
    position.current.set(200)
    expect(movingStyle.transform).toBe('translate(0px, -204px)')
    position.current.set(400)
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(movingStyle.transform).toBe('translate(0px, -400px)')
    assertNoLayoutWrites(clipSpy)

    // On settle: ZERO clip layout writes; clip transform is already aligned.
    presence.current = PresenceState.Entered
    clipSpy.mockClear()
    settleSurfaceMT()
    assertNoLayoutWrites(clipSpy)
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(movingStyle.transform).toBe('translate(0px, -400px)')

    // Animated bottom gap + cornerRadius via controller (8 -> 0): ZERO clip/viewport layout.
    surfaceSpy.mockClear()
    clipSpy.mockClear()
    viewportSpy.mockClear()
    setFrameMT({ insets: { bottom: 6 } }, { animating: true })
    setCornerRadiusMT(18)
    setFrameMT({ insets: { bottom: 4 } }, { animating: true })
    setCornerRadiusMT(12)
    setFrameMT({ insets: { bottom: 2 } }, { animating: true })
    setCornerRadiusMT(6)
    setFrameMT({ insets: { bottom: 0 } }, { animating: true })
    setCornerRadiusMT(0)
    assertNoLayoutWrites(clipSpy)
    assertNoLayoutWrites(viewportSpy)
    expect(surfaceStyle['clip-path']).toBe('none')
    expect(clipStyle.transform).toBe('translateY(0px)')
    setFrameMT({ insets: { bottom: 0 } })
    assertNoLayoutWrites(clipSpy)
  })

  it('allows native refs to attach before the motion value is initialized', () => {
    const { position, setSurfaceMTRef } = setup()
    Object.assign(position, { current: null })
    expect(() => setSurfaceMTRef({} as MainThread.Element)).not.toThrow()
  })

  it('preserves the controller frame on resize and uses updated opening values on reopen', () => {
    const { setFrameMT, setCornerRadiusMT, render, surfaceStyle, presence } =
      setup(
        { insets: { left: 120, right: 120, bottom: 8 } },
        false,
        'bottom',
        800,
        false,
      )
    setFrameMT({ insets: { left: 20, right: 20, bottom: 2 } })
    setCornerRadiusMT(6)
    const { openSurfaceMT } = render(
      { insets: { left: 60, right: 80, bottom: 12 } },
      16,
      undefined,
      900,
    )
    expect(surfaceStyle).toMatchObject({
      transform: 'translateX(20px)',
      width: '860px',
      'border-top-left-radius': '6px',
    })

    presence.current = PresenceState.Left
    openSurfaceMT()
    expect(surfaceStyle).toMatchObject({
      transform: 'translateX(60px)',
      width: '760px',
      'border-top-left-radius': '16px',
    })
  })

  it('settles viewport height immediately on one-shot setFrame and defers while animating', () => {
    const {
      position,
      setFrameMT,
      settleSurfaceMT,
      clipStyle,
      clipSpy,
      viewportStyle,
    } = setup({ insets: { bottom: 0 } }, false, 'bottom', 1000, false)

    // Animated frames update clip transform immediately while deferring viewport layout bounds.
    setFrameMT({ insets: { bottom: 3 } }, { animating: true })
    settleSurfaceMT()
    expect(clipStyle.transform).toBe('translateY(-3px)')
    expect(viewportStyle.height).toBe('1000px')
    setFrameMT({ insets: { bottom: 8 } }, { animating: true })
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(viewportStyle.height).toBe('1000px')
    setFrameMT({ insets: { bottom: 8 } })
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(viewportStyle.height).toBe('992px')

    // One-shot update settles immediately when position is idle.
    setFrameMT({ insets: { bottom: 0 } })
    expect(clipStyle.transform).toBe('translateY(0px)')
    expect(viewportStyle.height).toBe('1000px')

    // Mid-snap updates defer viewport layout writes until the vertical snap settles.
    const animatingSpy = vi
      .spyOn(position.current, 'isAnimating')
      .mockReturnValue(true)
    setFrameMT({ insets: { bottom: 8 } })
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(viewportStyle.height).toBe('1000px')
    animatingSpy.mockRestore()
    settleSurfaceMT()
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(viewportStyle.height).toBe('992px')
    assertNoLayoutWrites(clipSpy)
  })

  it('clears horizontal transform with null and restores baseWidth when reopening without horizontal frame', () => {
    const { render, surfaceStyle, presence } = setup(
      { insets: { left: 20, right: 20 } },
      false,
      'bottom',
      800,
      false,
    )
    expect(surfaceStyle.transform).toBe('translateX(20px)')
    expect(surfaceStyle.width).toBe('960px')

    const { openSurfaceMT } = render({}, undefined, undefined, 1000)
    presence.current = PresenceState.Left
    openSurfaceMT()
    expect(surfaceStyle.width).toBe('100%')
    expect(surfaceStyle.transform).toBeNull()
  })

  it('does not constrain intrinsic fit measurement with the animated viewport', () => {
    const { position, viewportStyle } = setup({ insets: { bottom: 8 } }, true)
    position.current.set(450)
    expect(viewportStyle).toEqual({})
  })

  it.each([-8, Number.NaN, Number.POSITIVE_INFINITY])(
    'normalizes invalid gaps: %s',
    gap => {
      const { clipStyle, clipSpy } = setup({ insets: { bottom: gap } })
      expect(clipStyle.transform).toBe('translateY(0px)')
      assertNoLayoutWrites(clipSpy)
    },
  )

  it('resets SheetBody surfaceOriginLeft immediately when reopening without horizontal insets', () => {
    const {
      render,
      measureSurfaceMT,
      measureBodyParentMT,
      bodyContext,
      presence,
    } = setup(
      { insets: { left: 68, right: 68, bottom: 8 } },
      false,
      'bottom',
      800,
      false,
    )
    const writeBody = vi.fn()
    bodyContext.setBodyClipMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(
      { setStyleProperties: writeBody } as unknown as MainThread.Element,
      { top: 40, left: 40, right: 40 },
    )
    measureSurfaceMT(
      { detail: { left: 68, top: 0 } } as MainThread.LayoutChangeEvent,
    )
    measureBodyParentMT({ left: 0, top: 0, width: 864, height: 992 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 864, height: 968 })
    // With 68px outer insets, left/right safe-area overlap is 0 so no redundant left/right layout write occurs.
    assertNoLayoutWrites(writeBody)

    writeBody.mockClear()
    const { openSurfaceMT } = render(
      { insets: { bottom: 0 } },
      undefined,
      undefined,
      1000,
    )
    presence.current = PresenceState.Left
    openSurfaceMT()
    measureBodyParentMT({ left: 0, top: 0, width: 1000, height: 1000 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 1000, height: 976 })
    expect(writeBody).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: '40px', right: '40px' }),
    )
  })

  it('preserves horizontalPadding when child measureBodyMT arrives before parent during setFrame shrink', () => {
    const {
      setFrameMT,
      bodyContext,
      measureSurfaceMT,
      measureBodyParentMT,
    } = setup(
      { insets: { left: 20, right: 20, bottom: 0 } },
      false,
      'bottom',
      1000,
      false,
    )
    const writeBody = vi.fn()
    bodyContext.setBodyClipMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(
      { setStyleProperties: writeBody } as unknown as MainThread.Element,
      { top: 40, right: 84 },
    )
    // Surface width 960, child body has 20px inner padding -> outer width 940 (horizontalPadding = 20).
    measureSurfaceMT(
      { detail: { left: 20, top: 0 } } as MainThread.LayoutChangeEvent,
    )
    measureBodyParentMT({ left: 0, top: 0, width: 960, height: 1000 })
    bodyContext.measureBodyMT({ left: 10, top: 24, width: 940, height: 976 })

    // Shrink surface width 960 -> 664; child layout arrives before parent layout.
    setFrameMT({ insets: { left: 168, right: 168, bottom: 8 } })
    bodyContext.measureBodyMT({ left: 10, top: 24, width: 644, height: 968 })
    measureBodyParentMT({ left: 0, top: 0, width: 664, height: 992 })
    writeBody.mockClear()

    // Now widen back 664 -> 960: horizontalPadding (20) is preserved so outer
    // width is 940 at left=20+10=30 (right edge at 970, 30px from screen right
    // -> 84 - 30 = 54px right inset instead of 64px or 74px).
    setFrameMT({ insets: { left: 20, right: 20, bottom: 0 } })
    expect(writeBody).toHaveBeenCalledWith(
      expect.objectContaining({ left: '0px', right: '54px' }),
    )
  })

  it('does not skew right SheetBody safe-area clamping when unapplied initialFrame.insets.right is passed', () => {
    const rightSetup = setup(
      { insets: { right: 20 } },
      false,
      'right',
      800,
      false,
    )
    const rightClipStyle: Record<string, string> = {}
    rightSetup.bodyContext.setBodyClipMTRef(
      {
        setStyleProperties: (style: object) =>
          Object.assign(rightClipStyle, style),
      } as unknown as MainThread.Element,
    )
    rightSetup.bodyContext.setBodyMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
      { right: 250 },
    )
    rightSetup.measureBodyParentMT({
      left: 0,
      top: 0,
      width: 800,
      height: 1000,
    })
    rightSetup.bodyContext.measureBodyMT({
      left: 0,
      top: 0,
      width: 800,
      height: 1000,
    })
    expect(rightClipStyle.width).toBe('550px')
  })

  it('resolves maxWidth within insets on wide, narrow, and asymmetric viewports', () => {
    const wide = setup({
      insets: { left: 16, right: 16, bottom: 8 },
      maxWidth: 664,
    })
    expect(wide.surfaceStyle.transform).toBe('translateX(168px)')
    expect(wide.surfaceStyle.width).toBe('664px')

    // Narrow viewport clamps to available width inside insets.
    wide.render(
      { insets: { left: 16, right: 16, bottom: 8 }, maxWidth: 664 },
      undefined,
      undefined,
      500,
    )
    expect(wide.surfaceStyle.transform).toBe('translateX(16px)')
    expect(wide.surfaceStyle.width).toBe('468px')

    // Asymmetric corridor [60, 992] centers 664px inside the corridor, not [0, 1000].
    wide.setFrameMT({
      insets: { left: 60, right: 8, bottom: 8 },
      maxWidth: 664,
    })
    wide.render(
      { insets: { left: 60, right: 8, bottom: 8 }, maxWidth: 664 },
      undefined,
      undefined,
      1000,
    )
    expect(wide.surfaceStyle.transform).toBe('translateX(194px)')
    expect(wide.surfaceStyle.width).toBe('664px')
  })

  it('resolves percentage width and maxWidth against viewport width and clamps to available', () => {
    const pct = setup({ width: '80%', insets: { bottom: 8 } })
    expect(pct.surfaceStyle.transform).toBe('translateX(100px)')
    expect(pct.surfaceStyle.width).toBe('800px')

    // Clamps percentage width to the safe corridor inside insets.
    pct.setFrameMT({ width: '90%', insets: { left: 100, right: 100 } })
    expect(pct.surfaceStyle.transform).toBe('translateX(100px)')
    expect(pct.surfaceStyle.width).toBe('800px')

    // Percentage maxWidth limits panel width when larger than insets allow.
    pct.setFrameMT({ maxWidth: '50%', insets: { left: 20, right: 20 } })
    expect(pct.surfaceStyle.transform).toBe('translateX(250px)')
    expect(pct.surfaceStyle.width).toBe('500px')

    // Explicitly passing 100% fills the available corridor.
    pct.setFrameMT({ width: '100%' })
    expect(pct.surfaceStyle.transform).toBe('translateX(0px)')
    expect(pct.surfaceStyle.width).toBe('1000px')
  })

  it('distributes leftover slack according to align for LTR and enableRTL', () => {
    const ltr = setup(
      { insets: { left: 20, right: 40 }, width: 500, align: 'start' },
      false,
      'bottom',
      800,
      false,
    )
    expect(ltr.surfaceStyle.transform).toBe('translateX(20px)')
    expect(ltr.surfaceStyle.width).toBe('500px')

    ltr.surfaceSpy.mockClear()
    ltr.setFrameMT({
      insets: { left: 20, right: 40 },
      width: 500,
      align: 'end',
    })
    assertNoLayoutWrites(ltr.surfaceSpy)
    expect(ltr.surfaceStyle.transform).toBe('translateX(460px)')
    expect(ltr.surfaceStyle.width).toBe('500px')

    const rtl = setup(
      { insets: { left: 20, right: 40 }, width: 500, align: 'start' },
      false,
      'bottom',
      800,
      true,
    )
    expect(rtl.surfaceStyle.transform).toBe('translateX(460px)')
    expect(rtl.surfaceStyle.width).toBe('500px')

    rtl.surfaceSpy.mockClear()
    rtl.setFrameMT({
      insets: { left: 20, right: 40 },
      width: 500,
      align: 'end',
    })
    assertNoLayoutWrites(rtl.surfaceSpy)
    expect(rtl.surfaceStyle.transform).toBe('translateX(20px)')
    expect(rtl.surfaceStyle.width).toBe('500px')
  })

  it('keeps maxWidth and percentage width responsive on resize and updates getViewportSizeMT', () => {
    const { render, setFrameMT, surfaceStyle, surfaceSpy, getViewportSizeMT } =
      setup({
        insets: { left: 16, right: 16, bottom: 8 },
        maxWidth: 664,
      })
    expect(getViewportSizeMT()).toEqual({ width: 1000, height: 1000 })
    expect(surfaceStyle.transform).toBe('translateX(168px)')
    expect(surfaceStyle.width).toBe('664px')

    // Window widens to 1200x900: centered 664px card re-centers via transform with zero width/left layout writes.
    surfaceSpy.mockClear()
    const resized = render(undefined, undefined, undefined, 1200, 900)
    for (const [style] of surfaceSpy.mock.calls) {
      expect(style).not.toHaveProperty('left')
      expect(style).not.toHaveProperty('width')
    }
    expect(resized.getViewportSizeMT()).toEqual({ width: 1200, height: 900 })
    expect(surfaceStyle.transform).toBe('translateX(268px)')
    expect(surfaceStyle.width).toBe('664px')

    // Calling setFrame on the live controller with percentage preserves responsiveness across resizes.
    setFrameMT({ width: '60%' })
    expect(surfaceStyle.transform).toBe('translateX(240px)')
    expect(surfaceStyle.width).toBe('720px')

    render(undefined, undefined, undefined, 800, 700)
    expect(resized.getViewportSizeMT()).toEqual({ width: 800, height: 700 })
    expect(surfaceStyle.transform).toBe('translateX(160px)')
    expect(surfaceStyle.width).toBe('480px')
  })

  it.each(['parent-first', 'outer-first'] as const)(
    'clamps SheetBody to full 100% width in the same tick when full-frame setFrame clears maxWidth (%s)',
    order => {
      const {
        setFrameMT,
        bodyContext,
        measureSurfaceMT,
        measureBodyParentMT,
        surfaceStyle,
      } = setup(
        { insets: { left: 16, right: 16, bottom: 8 }, maxWidth: 664 },
        false,
        'bottom',
        1000,
        false,
      )
      const writeBody = vi.fn()
      bodyContext.setBodyClipMTRef(
        { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
      )
      bodyContext.setBodyMTRef(
        { setStyleProperties: writeBody } as unknown as MainThread.Element,
        { top: 40, left: 60, right: 84 },
      )
      measureSurfaceMT(
        { detail: { left: 168, top: 0 } } as MainThread.LayoutChangeEvent,
      )
      measureBodyParentMT({ left: 0, top: 0, width: 664, height: 992 })
      bodyContext.measureBodyMT({ left: 10, top: 24, width: 644, height: 968 })
      writeBody.mockClear()

      // Full-frame replacement resets left, right, maxWidth, width, align back to 100% full width.
      setFrameMT({ insets: { bottom: 0 } })
      expect(surfaceStyle.width).toBe('100%')
      expect(surfaceStyle.transform).toBeNull()
      // Same-tick clamping accounts for horizontalPadding (20px) + 10px body offset -> left=50px, right=74px!
      expect(writeBody).toHaveBeenCalledWith(
        expect.objectContaining({ left: '50px', right: '74px' }),
      )

      // Subsequent native layoutchange events in either order must not cause a second write.
      writeBody.mockClear()
      measureSurfaceMT(
        { detail: { left: 0, top: 0 } } as MainThread.LayoutChangeEvent,
      )
      if (order === 'parent-first') {
        measureBodyParentMT({ left: 0, top: 0, width: 1000, height: 1000 })
        bodyContext.measureBodyMT({
          left: 10,
          top: 24,
          width: 980,
          height: 976,
        })
      } else {
        bodyContext.measureBodyMT({
          left: 10,
          top: 24,
          width: 980,
          height: 976,
        })
        measureBodyParentMT({ left: 0, top: 0, width: 1000, height: 1000 })
      }
      assertNoLayoutWrites(writeBody)
    },
  )

  it('clamps negative sizes to 0px and ignores invalid width and maxWidth values', () => {
    const { setFrameMT, surfaceStyle } = setup({
      insets: { bottom: 8 },
      width: -10 as number,
    })
    expect(surfaceStyle.width).toBe('0px')

    setFrameMT({
      width: '50px%' as unknown as `${number}%`,
      maxWidth: '%' as unknown as `${number}%`,
    })
    expect(surfaceStyle.width).toBe('100%')

    setFrameMT({
      width: Number.NaN,
      maxWidth: '   %' as unknown as `${number}%`,
    })
    expect(surfaceStyle.width).toBe('100%')

    const unapplied = setup({
      insets: { bottom: 8 },
      width: Number.NaN,
    })
    expect(unapplied.surfaceStyle.width).toBeUndefined()
  })

  it('auto-settles deferred viewport bounds after idle animation frames when { animating: false } is omitted', () => {
    const { setFrameMT, clipStyle, clipSpy, viewportStyle } = setup(
      { insets: { bottom: 0 } },
      false,
      'bottom',
      1000,
      false,
    )

    // Continuous animated frames move clip via transform immediately and keep viewport layout deferred.
    setFrameMT({ insets: { bottom: 2 } }, { animating: true })
    vi.advanceTimersByTime(16)
    expect(clipStyle.transform).toBe('translateY(-2px)')
    expect(viewportStyle.height).toBe('1000px')

    setFrameMT({ insets: { bottom: 5 } }, { animating: true })
    vi.advanceTimersByTime(16)
    expect(clipStyle.transform).toBe('translateY(-5px)')
    expect(viewportStyle.height).toBe('1000px')

    setFrameMT({ insets: { bottom: 8 } }, { animating: true })
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(viewportStyle.height).toBe('1000px')

    // After idle rAF ticks with no further animating calls, viewport layout settles automatically.
    vi.advanceTimersByTime(64)
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(viewportStyle.height).toBe('992px')
    assertNoLayoutWrites(clipSpy)
  })

  it.each(['right', 'left'] as const)(
    'supports SheetBody horizontal fit safe-area reserve and zero-write drag clipping for side="%s"',
    side => {
      const { position, sheetSizeMTRef, bodyContext, measureBodyParentMT } =
        setup(
          null,
          true,
          side,
          0,
        )
      const slotStyle: Record<string, string> = {}
      const clipStyle: Record<string, string> = {}
      const writeBody = vi.fn()
      const writeClip = vi.fn((style: object) =>
        Object.assign(clipStyle, style)
      )
      bodyContext.setBodySlotMTRef?.({
        setStyleProperties: (style: object) => Object.assign(slotStyle, style),
      } as unknown as MainThread.Element)
      bodyContext.setBodyClipMTRef(
        { setStyleProperties: writeClip } as unknown as MainThread.Element,
      )
      bodyContext.setBodyMTRef(
        { setStyleProperties: writeBody } as unknown as MainThread.Element,
        side === 'right' ? { top: 20, right: 64 } : { top: 20, left: 64 },
      )

      // 24px sibling on the open side overlaps part of the edge; reserves remaining 40px.
      measureBodyParentMT({ left: 0, top: 0, width: 24, height: 1000 })
      bodyContext.measureBodyMT({
        left: side === 'left' ? 24 : 0,
        top: 0,
        width: 0,
        height: 1000,
      })
      bodyContext.measureIntrinsicBodyMT?.({ width: 220, height: 980 })
      expect(slotStyle.width).toBe('260px')
      // Simulate useSnap updating the resolved fit drawer size before subsequent layout writes.
      sheetSizeMTRef.current = 284

      bodyContext.measureBodyMT({
        left: side === 'left' ? 24 : 0,
        top: 0,
        width: 260,
        height: 1000,
      })
      measureBodyParentMT({ left: 0, top: 0, width: 284, height: 1000 })
      expect(clipStyle.width).toBe('220px')

      writeBody.mockClear()
      writeClip.mockClear()
      position.current.set(160)
      position.current.set(284)
      assertNoLayoutWrites(writeClip)
      assertNoLayoutWrites(writeBody)
      expect(writeBody).toHaveBeenLastCalledWith({
        transform: 'translateX(0px)',
      })
    },
  )

  it('applies fit snap bounds min and max to SheetBody intrinsic wrapper minus bottom safe-area reserve', () => {
    const minSetup = setup(
      { insets: { bottom: 8 } },
      true,
      'bottom',
      0,
      false,
      24,
      200,
      500,
    )
    const minSlot: Record<string, string> = {}
    const minClip: Record<string, string> = {}
    const minWrapper: Record<string, string | null> = {}
    minSetup.bodyContext.setBodySlotMTRef?.({
      setStyleProperties: (s: object) => Object.assign(minSlot, s),
    } as unknown as MainThread.Element)
    minSetup.bodyContext.setBodyIntrinsicMTRef?.({
      setStyleProperties: (s: object) => Object.assign(minWrapper, s),
    } as unknown as MainThread.Element)
    minSetup.bodyContext.setBodyClipMTRef(
      {
        setStyleProperties: (s: object) => Object.assign(minClip, s),
      } as unknown as MainThread.Element,
    )
    minSetup.bodyContext.setBodyMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
      { bottom: 34 },
    )
    // Top handle 24px + bottom gap 8px -> bottomReserve = 26px, overhead = 50px.
    // Content natural height 0px < min (200 - 50 = 150px) -> wrapper gets minHeight=150px, slot=176px (total 200px!).
    minSetup.measureBodyParentMT({ left: 0, top: 0, width: 320, height: 24 })
    minSetup.bodyContext.measureBodyMT({
      left: 0,
      top: 24,
      width: 320,
      height: 0,
    })
    minSetup.bodyContext.measureIntrinsicBodyMT?.({ width: 320, height: 0 })
    expect(minWrapper).toEqual({ minHeight: '150px', maxHeight: '450px' })
    expect(minSlot.height).toBe('176px')
    // Pass #1 already sets the final clip height (150px), never clipping to 0px.
    expect(minClip.height).toBe('150px')

    // Tall content (900px > max 450px) clamps slot cleanly to 450 + 26 = 476px (+24px handle = 500px).
    minSetup.bodyContext.measureIntrinsicBodyMT?.({ width: 320, height: 900 })
    expect(minSlot.height).toBe('476px')
    expect(minClip.height).toBe('450px')
  })

  it('parses px strings in width and maxWidth while rejecting invalid strings', () => {
    const { setFrameMT, surfaceStyle } = setup({
      insets: { left: 16, right: 16, bottom: 8 },
      maxWidth: '664px',
    })
    expect(surfaceStyle.transform).toBe('translateX(168px)')
    expect(surfaceStyle.width).toBe('664px')

    setFrameMT({ width: '500px' })
    expect(surfaceStyle.transform).toBe('translateX(250px)')
    expect(surfaceStyle.width).toBe('500px')

    setFrameMT({
      width: 'px' as unknown as `${number}px`,
      maxWidth: '50%px' as unknown as `${number}px`,
    })
    expect(surfaceStyle.width).toBe('100%')
  })

  it('updates surface geometry, bottom clip, corners, and SheetBody clamping reactively for controlled frame and cornerRadius', () => {
    const {
      render,
      bodyContext,
      measureSurfaceMT,
      measureBodyParentMT,
      surfaceStyle,
      clipStyle,
      viewportStyle,
    } = setup(undefined, false, 'bottom', 800, false)

    const writeBody = vi.fn()
    bodyContext.setBodyClipMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(
      { setStyleProperties: writeBody } as unknown as MainThread.Element,
      { right: 84 },
    )
    render(
      undefined,
      undefined,
      undefined,
      1000,
      1000,
      {
        frame: { insets: { left: 16, right: 16, bottom: 8 }, maxWidth: 664 },
        cornerRadius: 26,
      },
    )
    expect(surfaceStyle.transform).toBe('translateX(168px)')
    expect(surfaceStyle.width).toBe('664px')
    expect(clipStyle.transform).toBe('translateY(-8px)')
    expect(surfaceStyle['border-top-left-radius']).toBe('26px')
    expect(surfaceStyle['clip-path']).toContain('round 0px 0px 26px 26px')

    measureSurfaceMT(
      { detail: { left: 0, top: 0 } } as MainThread.LayoutChangeEvent,
    )
    measureBodyParentMT({ left: 0, top: 0, width: 664, height: 992 })
    bodyContext.measureBodyMT({ left: 0, top: 0, width: 664, height: 992 })
    writeBody.mockClear()

    // Controlled prop update widens to full screen immediately and clamps SheetBody in the same tick.
    render(
      undefined,
      undefined,
      undefined,
      1000,
      1000,
      {
        frame: { insets: { bottom: 0 } },
        cornerRadius: {
          topLeft: 18,
          topRight: 18,
          bottomLeft: 0,
          bottomRight: 0,
        },
      },
    )
    expect(surfaceStyle.width).toBe('100%')
    expect(surfaceStyle.transform).toBeNull()
    expect(clipStyle.transform).toBe('translateY(0px)')
    expect(viewportStyle.height).toBe('800px')
    expect(surfaceStyle['border-top-left-radius']).toBe('18px')
    expect(surfaceStyle['clip-path']).toBe('none')
    expect(writeBody).toHaveBeenCalledWith(
      expect.objectContaining({ right: '84px' }),
    )
  })

  it('skips redundant SheetBody clip height writes when vertical insets do not overlap', () => {
    const { bodyContext, measureBodyParentMT } = setup(
      null,
      false,
      'bottom',
      600,
      false,
    )
    const writeClip = vi.fn()
    const writeBody = vi.fn()
    bodyContext.setBodyClipMTRef(
      { setStyleProperties: writeClip } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(
      { setStyleProperties: writeBody } as unknown as MainThread.Element,
      { top: 64 },
    )
    // Max snap 600 inside 1000 viewport settles at top=400 (> 64), so top/bottom overlap is 0.
    measureBodyParentMT({ left: 0, top: 0, width: 1000, height: 600 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 1000, height: 576 })
    assertNoLayoutWrites(writeClip)
    assertNoLayoutWrites(writeBody)
    expect(writeClip).toHaveBeenLastCalledWith({
      transform: 'translateY(-200px)',
    })
    expect(writeBody).toHaveBeenLastCalledWith({
      transform: 'translateY(200px)',
    })
  })

  it('skips dead border-bottom radius writes and redundant clip-path updates on vertical bottom surfaces', () => {
    const { surfaceStyle, surfaceSpy, setCornerRadiusMT } = setup(
      { insets: { bottom: 8 } },
      false,
      'bottom',
      800,
      false,
      24,
    )
    // Initial corners are seeded in SheetSurface JSX, so mount writes zero redundant corner styles.
    expect(surfaceStyle['border-top-left-radius']).toBeUndefined()
    expect(surfaceStyle['border-top-right-radius']).toBeUndefined()
    expect(surfaceStyle['border-bottom-left-radius']).toBeUndefined()
    expect(surfaceStyle['border-bottom-right-radius']).toBeUndefined()

    // Replacing corners with only topLeft/topRight clears bottom radii to square ('clip-path: none') and updates top radii.
    surfaceSpy.mockClear()
    setCornerRadiusMT({
      topLeft: 12,
      topRight: 12,
      bottomLeft: 24,
      bottomRight: 24,
    })
    expect(surfaceSpy).toHaveBeenCalledTimes(1)
    expect(surfaceSpy).toHaveBeenCalledWith({
      'border-top-left-radius': '12px',
      'border-top-right-radius': '12px',
    })
  })

  it('preserves live fullscreen surface styles on same-node worklet re-bind and restores them when React resets inline style', () => {
    const rawSurfacePtr = {}
    const surfaceStyleState: Record<string, unknown> = {
      width: '664px',
      transform: 'translateX(168px)',
      'border-top-left-radius': '26px',
      'border-top-right-radius': '26px',
    }
    const writeSurface = vi.fn((s: object) =>
      Object.assign(surfaceStyleState, s)
    )
    const makeWrapper = () =>
      ({
        element: rawSurfacePtr,
        setStyleProperties: writeSurface,
      }) as unknown as MainThread.Element

    const { setSurfaceMTRef, setFrameMT, setCornerRadiusMT } = setup(
      { insets: { left: 16, right: 16, bottom: 8 }, maxWidth: 664 },
      false,
      'bottom',
      800,
      false,
      26,
    )
    setSurfaceMTRef(makeWrapper(), 'bg:#111;width:664px;')
    // Enter fullscreen on MTS: clears width to 100%, transform to null, corners to 0px.
    setFrameMT({ insets: { bottom: 0 } })
    setCornerRadiusMT(0)
    expect(surfaceStyleState.width).toBe('100%')
    expect(surfaceStyleState.transform).toBeNull()
    expect(surfaceStyleState['border-top-left-radius']).toBe('0px')

    // Case 1: Re-render without React style change (oldFn(null) -> newFn(newWrapper)).
    // Zero redundant setStyleProperties calls should fire.
    writeSurface.mockClear()
    setSurfaceMTRef(null)
    setSurfaceMTRef(makeWrapper(), 'bg:#111;width:664px;')
    expect(writeSurface).not.toHaveBeenCalled()

    // Case 2: Re-render where React style changed (e.g. backgroundColor changed),
    // causing __SetInlineStyles to reset native inline styles back to JSX mount values.
    Object.assign(surfaceStyleState, {
      width: '664px',
      transform: 'translateX(168px)',
      'border-top-left-radius': '26px',
      'border-top-right-radius': '26px',
    })
    setSurfaceMTRef(null)
    setSurfaceMTRef(makeWrapper(), 'bg:#222;width:664px;')
    expect(surfaceStyleState.width).toBe('100%')
    expect(surfaceStyleState.transform).toBeNull()
    expect(surfaceStyleState['border-top-left-radius']).toBe('0px')
  })

  it('clears SheetBody horizontal safe-area insets back to 0px across worklet ref re-binds and restores seeded clip height', () => {
    const { bodyContext, measureBodyParentMT } = setup(
      null,
      false,
      'bottom',
      800,
      false,
    )
    const rawBodyPtr = {}
    const rawClipPtr = {}
    const bodyStyle: Record<string, string> = { left: '0px', right: '0px' }
    const clipStyleState: Record<string, string> = { height: '707px' }
    const makeBody = () =>
      ({
        element: rawBodyPtr,
        setStyleProperties: (s: object) => Object.assign(bodyStyle, s),
      }) as unknown as MainThread.Element
    const makeClip = () =>
      ({
        element: rawClipPtr,
        setStyleProperties: (s: object) => Object.assign(clipStyleState, s),
      }) as unknown as MainThread.Element

    bodyContext.setBodyClipMTRef(makeClip(), 707, 'false|707px')
    bodyContext.setBodyMTRef(makeBody(), {
      top: 59,
      bottom: 34,
      left: 44,
      right: 44,
    })
    measureBodyParentMT({ left: 0, top: 0, width: 1000, height: 800 })
    bodyContext.measureBodyMT({ left: 0, top: 0, width: 1000, height: 800 })
    expect(bodyStyle.left).toBe('44px')
    expect(bodyStyle.right).toBe('44px')
    // Seeded clip height (800 - 34 = 766; top=59 does not overlap settledTop=200)
    // updates cleanly when actual settled overlap differs, and survives re-bind!
    expect(clipStyleState.height).toBe('766px')

    // Simulate ReactLynx re-render toggling left/right insets from 44 -> 0:
    // oldFn(null) followed by newFn(makeBody(), { left: 0, right: 0 }).
    bodyContext.setBodyClipMTRef(null)
    bodyContext.setBodyMTRef(null, undefined)
    bodyContext.setBodyClipMTRef(makeClip(), 707, 'false|707px')
    bodyContext.setBodyMTRef(makeBody(), {
      top: 59,
      bottom: 34,
      left: 0,
      right: 0,
    })
    expect(bodyStyle.left).toBe('0px')
    expect(bodyStyle.right).toBe('0px')
  })

  it('keeps rounded-bottom clip-path constant while rising to initialSnap and keeps bottom anchored on overshoot or drag', () => {
    const {
      position,
      presence,
      surfaceStyle,
      movingStyle,
      surfaceSpy,
      dragSurfaceMT,
    } = setup(
      { insets: { bottom: 8 }, width: '50%' },
      false,
      'bottom',
      800,
      false,
      24,
    )
    presence.current = PresenceState.Entering
    position.current.set(120)
    const initialMask = surfaceStyle['clip-path']
    expect(initialMask).toContain('round 0px 0px 24px 24px')

    // Zero clip-path writes across the entire 0 -> 400 entry travel.
    surfaceSpy.mockClear()
    for (const sample of [200, 280, 360, 400]) {
      position.current.set(sample)
    }
    const clipPathWrites = surfaceSpy.mock.calls.filter(
      ([patch]) => 'clip-path' in patch,
    )
    expect(clipPathWrites).toHaveLength(0)
    expect(surfaceStyle['clip-path']).toBe(initialMask)

    // Overshoot past initialSnap (412 > 400) keeps panel bottom anchored at 1000 - 8 = 992px.
    position.current.set(412)
    expect(movingStyle.transform).toBe('translate(0px, -412px)')
    expect(surfaceStyle['clip-path']).toBe(
      'inset(0px 0px 1088px 0px round 0px 0px 24px 24px)',
    )

    // Dragging while presence is still Entering (both up to 620 and down to 240)
    // ends the entry slide and keeps the panel bottom locked at 992px (bottom: 8px).
    dragSurfaceMT()
    position.current.set(620)
    expect(movingStyle.transform).toBe('translate(0px, -620px)')
    expect(surfaceStyle['clip-path']).toBe(
      'inset(0px 0px 880px 0px round 0px 0px 24px 24px)',
    )
    position.current.set(240)
    expect(movingStyle.transform).toBe('translate(0px, -240px)')
    expect(surfaceStyle['clip-path']).toBe(
      'inset(0px 0px 1260px 0px round 0px 0px 24px 24px)',
    )
  })
})
