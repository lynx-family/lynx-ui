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

function setup(
  bounded = true,
  bottomGap = 8,
  hasFitSnapPoint = false,
  resolvedSide: 'bottom' | 'right' | 'left' | 'top' = 'bottom',
  maxSnapSize = 800,
) {
  const position = { current: createMotionValue(400) }
  const presence = { current: PresenceState.Entered }
  const animateChanges = { current: true }
  const clipStyle: Record<string, string> = {}
  const surfaceStyle: Record<string, string> = {}
  const viewportStyle: Record<string, string> = {}
  const movingStyle: Record<string, string> = {}
  const movingSurfaceMTRef = {
    current: {
      setStyleProperties: (style: object) => Object.assign(movingStyle, style),
    } as unknown as MainThread.Element,
  }
  const clip = {
    setStyleProperties: (style: object) => Object.assign(clipStyle, style),
  } as unknown as MainThread.Element
  const surface = {
    setStyleProperties: (style: object) => Object.assign(surfaceStyle, style),
  } as unknown as MainThread.Element
  const viewport = {
    setStyleProperties: (style: object) => Object.assign(viewportStyle, style),
  } as unknown as MainThread.Element
  function render(
    nextBounded = bounded,
    nextGap = bottomGap,
    cornerRadius?: Parameters<typeof useSheetSurfaceLayout>[0]['cornerRadius'],
    baseStyle?: Parameters<typeof useSheetSurfaceLayout>[0]['surfaceStyle'],
  ) {
    hooks.cursor = 0
    hooks.subscriptionCursor = 0
    hooks.effects = []
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const layout = useSheetSurfaceLayout({
      position,
      presence,
      animateChanges,
      resolvedSide,
      cornerRadius,
      panelLayout: nextBounded ? { bottomGap: nextGap } : undefined,
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
    movingStyle,
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
    expect(surfaceStyle).toEqual({ height: '1500px' })
    expect(viewportStyle.height).toBe('800px')
    position.current.set(850)
    expect(surfaceStyle.height).toBe('1500px')
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
        animateChanges,
      } = setup()
      animateChanges.current = false
      render(true, 8, radius)

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

  it('applies independent corners and restores CSS when a corner is omitted', () => {
    const { render, surfaceStyle, animateChanges } = setup()
    const baseStyle = { borderTopLeftRadius: '12rpx' }
    animateChanges.current = false
    render(true, 8, { topLeft: 20, bottomRight: 12, bottomLeft: 24 }, baseStyle)
    expect(surfaceStyle).toMatchObject({
      'border-top-left-radius': '20px',
      'clip-path': 'inset(0px 0px 1100px 0px round 0px 0px 12px 24px)',
    })
    expect(surfaceStyle).not.toHaveProperty('border-top-right-radius')
    render(true, 8, { bottomLeft: 24 }, baseStyle)
    expect(surfaceStyle).toMatchObject({
      'border-top-left-radius': '12rpx',
      'clip-path': 'inset(0px 0px 1100px 0px round 0px 0px 0px 24px)',
    })
  })

  it('clears a managed corner without inline CSS so class styles can apply', () => {
    const { render, surfaceStyle, animateChanges } = setup()
    animateChanges.current = false
    render(true, 8, { topLeft: 20, topRight: 18 })
    expect(surfaceStyle['border-top-left-radius']).toBe('20px')

    render(true, 8, { topRight: 18 })
    expect(surfaceStyle['border-top-left-radius']).toBeNull()
    expect(surfaceStyle['border-top-right-radius']).toBe('18px')
  })

  it.each([false, true])(
    'uses a stable body height through drag and at the largest snap (bounded %s)',
    bounded => {
      const { position, bodyContext, measureBodyParentMT } = setup(
        bounded,
        8,
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
      const parentHeight = bounded ? 992 : 1000
      measureBodyParentMT({ width: 1000, height: parentHeight })
      bodyContext.measureBodyMT({
        top: 24,
        width: 1000,
        height: parentHeight - 24,
      })
      expect(writeClip).toHaveBeenLastCalledWith({
        height: '878px',
        transform: bounded ? 'translateY(-534px)' : 'translateY(-542px)',
      })
      writeBody.mockClear()
      writeClip.mockClear()
      position.current.set(900)
      position.current.set(950)
      position.current.set(1000)
      expect(writeClip.mock.calls.flat()).toEqual([
        { transform: bounded ? 'translateY(-34px)' : 'translateY(-42px)' },
        { transform: bounded ? 'translateY(16px)' : 'translateY(8px)' },
        { transform: 'translateY(58px)' },
      ])
      expect(writeBody.mock.calls.flat()).toEqual([
        { transform: bounded ? 'translateY(34px)' : 'translateY(42px)' },
        { transform: 'translateY(0px)' },
      ])
    },
  )

  it.each(['right', 'left'] as const)(
    'protects both horizontal edges of a %s sheet',
    side => {
      const { position, bodyContext, measureBodyParentMT } = setup(
        false,
        0,
        false,
        side,
      )
      const write = vi.fn()
      bodyContext.setBodyMTRef(
        { setStyleProperties: write } as unknown as MainThread.Element,
        { top: 20, left: 250, right: 250 },
      )
      measureBodyParentMT({ left: 0, top: 0, width: 800, height: 1000 })
      bodyContext.measureBodyMT({ left: 0, top: 0, width: 800, height: 1000 })
      expect(write).toHaveBeenLastCalledWith({
        left: side === 'right' ? '0px' : '650px',
        top: '20px',
        right: side === 'right' ? '650px' : '0px',
        bottom: '0px',
      })
      position.current.set(800)
      expect(write).toHaveBeenLastCalledWith({
        left: side === 'right' ? '50px' : '250px',
        right: side === 'right' ? '250px' : '50px',
      })
    },
  )

  it('uses a shared layout frame when the panel is offset inside its pane', () => {
    const { bodyContext, measureBodyParentMT, measureSurfaceMT, position } =
      setup(false, 0, false, 'right')
    const write = vi.fn()
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
      left: '0px',
      top: '62px',
      right: '0px',
      bottom: '24px',
    })
    position.current.set(800)
    expect(write).toHaveBeenLastCalledWith({
      left: '0px',
      top: '62px',
      right: '0px',
      bottom: '24px',
    })
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

  it.each([0, 1000])(
    'normalizes shared native layout origins (%s)',
    layoutTop => {
      const { position, bodyContext, measureBodyParentMT, measureSurfaceMT } =
        setup(true, 8, false, 'bottom', 1000)
      const write = vi.fn()
      const writeClip = vi.fn()
      bodyContext.setBodyClipMTRef?.(
        { setStyleProperties: writeClip } as unknown as MainThread.Element,
      )
      bodyContext.setBodyMTRef(
        { setStyleProperties: write } as unknown as MainThread.Element,
        { top: 82, right: 0, left: 0 },
      )
      measureSurfaceMT(
        { detail: { left: 8, top: 1000 } } as MainThread.LayoutChangeEvent,
      )
      bodyContext.measureBodyMT({
        left: 8,
        top: layoutTop + 24,
        width: 984,
        height: 376,
      })
      const parent = { left: 8, top: layoutTop, width: 984, height: 400 }
      measureBodyParentMT(parent)
      parent.top = 9000
      position.current.set(950)
      expect(writeClip).toHaveBeenLastCalledWith({
        transform: 'translateY(16px)',
      })
      position.current.set(1000)
      expect(writeClip).toHaveBeenLastCalledWith({
        transform: 'translateY(58px)',
      })
    },
  )

  it('allows native refs to attach before the motion value is initialized', () => {
    const { position, setSurfaceMTRef } = setup()
    Object.assign(position, { current: null })
    expect(() => setSurfaceMTRef({} as MainThread.Element)).not.toThrow()
  })

  it.each([undefined, 24])(
    'applies horizontal insets after an immediate fullscreen resize (radius %s)',
    radius => {
      const { render, position, animateChanges } = setup()
      const { bodyContext, measureBodyParentMT, measureSurfaceMT } = render(
        true,
        8,
        radius,
      )
      const write = vi.fn()
      const writeClip = vi.fn()
      bodyContext.setBodyClipMTRef?.(
        { setStyleProperties: writeClip } as unknown as MainThread.Element,
      )
      bodyContext.setBodyMTRef(
        { setStyleProperties: write } as unknown as MainThread.Element,
        { top: 64, right: 84 },
      )
      measureSurfaceMT(
        { detail: { left: 404, top: 0 } } as MainThread.LayoutChangeEvent,
      )
      measureBodyParentMT({ left: 404, width: 192, height: 400 })
      bodyContext.measureBodyMT({ left: 404, top: 24, width: 192, height: 376 })
      write.mockClear()

      animateChanges.current = false
      position.current.set(1000)
      measureSurfaceMT(
        { detail: { left: 0, top: 0 } } as MainThread.LayoutChangeEvent,
      )
      measureBodyParentMT({ left: 0, width: 1000, height: 800 })
      bodyContext.measureBodyMT({ left: 0, top: 24, width: 1000, height: 776 })

      expect(writeClip).toHaveBeenCalledWith({
        transform: 'translateY(40px)',
      })
      expect(write).not.toHaveBeenCalledWith({ left: '0px', right: '84px' })
      vi.advanceTimersByTime(16)
      expect(write).toHaveBeenLastCalledWith({ left: '0px', right: '84px' })
    },
  )

  it('interpolates the clipped radius and gap together during interruption', () => {
    const { render, clipStyle, surfaceStyle, animateChanges } = setup()
    animateChanges.current = false
    render(true, 8, 24)
    animateChanges.current = true
    render(true, 0, 0)
    vi.advanceTimersByTime(96)
    const gap = Number.parseFloat(clipStyle.bottom)
    const mask = surfaceStyle['clip-path']!
    const radius = Number.parseFloat(mask.split(' ').pop()!)
    expect(gap).toBeGreaterThan(0)
    expect(gap).toBeLessThan(8)
    expect(radius).toBeCloseTo(gap * 3)
    expect(Number.parseFloat(surfaceStyle['border-top-left-radius']!))
      .toBeCloseTo(radius)
    render(true, 8, 24)
    expect(surfaceStyle['clip-path']).toBe(mask)
    vi.advanceTimersByTime(300)
    expect(clipStyle.bottom).toBe('8px')
    expect(surfaceStyle['clip-path']).toBe(
      'inset(0px 0px 1100px 0px round 0px 0px 24px 24px)',
    )
  })

  it.each([false, true])(
    'only writes changed surface geometry with bounded layout %s',
    bounded => {
      const layout = setup(bounded, 0)
      const writeClip = vi.fn()
      const writeSurface = vi.fn()
      const writeViewport = vi.fn()
      layout.setClipMTRef(
        { setStyleProperties: writeClip } as unknown as MainThread.Element,
      )
      layout.setSurfaceMTRef(
        { setStyleProperties: writeSurface } as unknown as MainThread.Element,
      )
      layout.setViewportMTRef(
        { setStyleProperties: writeViewport } as unknown as MainThread.Element,
      )
      writeClip.mockClear()
      writeSurface.mockClear()
      writeViewport.mockClear()

      layout.position.current.set(450)

      expect(writeClip).not.toHaveBeenCalled()
      expect(writeSurface.mock.calls).toEqual(
        bounded
          ? [[{
            'clip-path': 'inset(0px 0px 1050px 0px round 0px 0px 0px 0px)',
          }]]
          : [],
      )
      expect(writeViewport).not.toHaveBeenCalled()
    },
  )

  it('does not constrain intrinsic fit measurement with the animated viewport', () => {
    const { position, viewportStyle } = setup(true, 8, true)
    position.current.set(450)
    expect(viewportStyle).toEqual({})
  })

  it('translates a complete card through entry and dismissal', () => {
    const { position, presence, surfaceStyle, movingStyle, clipStyle } = setup()
    const mask = surfaceStyle['clip-path']
    presence.current = PresenceState.Leaving
    position.current.set(100)
    expect(clipStyle.bottom).toBe('2px')
    expect(movingStyle.transform).toBe('translate(0px, -100px)')
    expect(surfaceStyle['clip-path']).toBe(mask)
    position.current.set(0)
    expect(clipStyle.bottom).toBe('0px')
    expect(movingStyle.transform).toBe('translate(0px, 0px)')
    expect(surfaceStyle['clip-path']).toBe(mask)
    presence.current = PresenceState.Entering
    position.current.set(100)
    expect(clipStyle.bottom).toBe('2px')
    expect(movingStyle.transform).toBe('translate(0px, -100px)')
    expect(surfaceStyle['clip-path']).toBe(mask)
  })

  it('redirects a coverage transition from its current gap', () => {
    const { render, surfaceStyle, viewportStyle, clipStyle } = setup()
    render(false, 0)
    expect(clipStyle.bottom).toBe('8px')
    vi.advanceTimersByTime(96)
    const interruptedGap = clipStyle.bottom
    expect(Number.parseFloat(interruptedGap)).toBeGreaterThan(0)
    expect(Number.parseFloat(interruptedGap)).toBeLessThan(8)
    render(true, 8)
    expect(clipStyle.bottom).toBe(interruptedGap)
    vi.advanceTimersByTime(500)
    expect(clipStyle.bottom).toBe('8px')
    expect(surfaceStyle.height).toBe('1500px')
    expect(viewportStyle.height).toBe('800px')
  })

  it('makes an immediate snap appearance change immediate too', () => {
    const { render, animateChanges, surfaceStyle, clipStyle } = setup()
    animateChanges.current = false
    render(false, 0)
    expect(clipStyle.bottom).toBe('0px')
    expect(surfaceStyle['clip-path']).toBe('none')
  })

  it.each([-8, Number.NaN, Number.POSITIVE_INFINITY])(
    'normalizes invalid gaps: %s',
    gap => {
      expect(setup(true, gap).clipStyle.bottom).toBe('0px')
    },
  )
})
