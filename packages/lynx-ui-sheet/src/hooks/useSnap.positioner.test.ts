// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
import type * as MotionMini from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SheetPositionerDimensions } from '../context'
import type { SheetSide, SheetSnapPoint } from '../types'
import { useSnap } from './useSnap'

const hooks = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effects: [] as Array<() => unknown>,
  subscriptions: [] as Array<() => void>,
  subscriptionCursor: 0,
}))

function persistentRef<T>(current: T) {
  const index = hooks.cursor++
  hooks.slots[index] ??= { current }
  return hooks.slots[index]
}

vi.mock('@lynx-js/react', () => ({
  useMainThreadRef: <T>(current: T) => persistentRef(current),
  useRef: <T>(current: T) => persistentRef(current),
  useMemo: <T>(fn: () => T) => fn(),
  useEffect: (effect: () => unknown) => hooks.effects.push(effect),
  runOnMainThread: <T>(fn: T) => fn,
  runOnBackground: <T>(fn: T) => fn,
}))
vi.mock(
  '@lynx-js/react/worklet-runtime/bindings',
  () => ({ runWorkletCtx: vi.fn() }),
)
vi.mock('@lynx-js/lynx-ui-common', () => ({
  noop: () => undefined,
  useMemoizedFn: <T>(fn: T) => fn,
}))
vi.mock('@lynx-js/lynx-ui-presence', () => ({
  PresenceState: {
    Initial: 'initial',
    Left: 'left',
    Entering: 'entering',
    Entered: 'entered',
    Leaving: 'leaving',
    DelayedEntering: 'delayed-entering',
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
  side: SheetSide = 'bottom',
  snapPoints: SheetSnapPoint[] = ['50%', '85%'],
  initialFrame?: Parameters<typeof useSnap>[0]['initialFrame'],
  initialCornerRadius?: Parameters<typeof useSnap>[0]['initialCornerRadius'],
) {
  const presence = { current: PresenceState.Left }
  const entered = vi.fn()
  const snapStarted = vi.fn()
  const changed = vi.fn()
  const surfaceStyle: Record<string, string> = {}
  const viewportStyle: Record<string, string> = {}
  function render(
    positioner: SheetPositionerDimensions | null,
    effects = true,
    openingFrame = initialFrame,
    nextSnapPoints = snapPoints,
    nextScreenHeight = 800,
  ) {
    hooks.cursor = 0
    hooks.subscriptionCursor = 0
    hooks.effects = []
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
    const snap = useSnap({
      snapPoints: nextSnapPoints,
      initialFrame: openingFrame,
      initialCornerRadius,
      side,
      enableRTL: true,
      screenHeight: nextScreenHeight,
      screenWidth: 400,
      positioner,
      presenceStateMTRef: presence,
      onEntered: entered,
      onSnapStartMT: snapStarted,
      onSnapChange: changed,
    })
    snap.setSheetMTRef({
      setStyleProperties: () => undefined,
    } as unknown as MainThread.Element)
    snap.setSurfaceMTRef({
      setStyleProperties: (style: object) => Object.assign(surfaceStyle, style),
    } as unknown as MainThread.Element)
    snap.setViewportMTRef({
      setStyleProperties: (style: object) =>
        Object.assign(viewportStyle, style),
    } as unknown as MainThread.Element)
    if (effects) {
      for (const effect of hooks.effects) effect()
    }
    return snap
  }
  return {
    render,
    presence,
    entered,
    snapStarted,
    changed,
    surfaceStyle,
    viewportStyle,
  }
}

describe('Sheet local viewport calculations and resizing', () => {
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

  it('resets a mounted surface before an immediate reopen at the latest frame', () => {
    const { render, surfaceStyle } = setup(
      'bottom',
      ['50%'],
      { insets: { left: 30, right: 30 } },
      24,
    )
    const viewport = { width: 400, height: 800 }
    const snap = render(viewport)
    snap.showMT({ animate: false })
    expect(surfaceStyle.width).toBe('340px')
    snap.setFrameMT({ insets: { left: 0, right: 0 } })
    snap.setCornerRadiusMT(0)

    const rerendered = render(viewport, true, {
      insets: { left: 40, right: 40 },
    })
    expect(surfaceStyle.width).toBe('400px')
    expect(surfaceStyle['border-top-left-radius']).toBe('0px')
    rerendered.closeMT({ animate: false })
    rerendered.showMT({ animate: false })
    expect(surfaceStyle.width).toBe('320px')
    expect(surfaceStyle['border-top-left-radius']).toBe('24px')
  })

  it('resets to updated initialFrame on Leaving reopen while preserving live geometry on drag resurrection', () => {
    const viewport = { width: 400, height: 800 }
    const first = setup(
      'bottom',
      ['50%'],
      { insets: { left: 30, right: 30 } },
      24,
    )
    const snap = first.render(viewport)
    snap.showMT({ animate: false })
    snap.setFrameMT({ insets: { left: 0, right: 0 } })
    snap.setCornerRadiusMT(0)
    const rerendered = first.render(viewport, true, {
      insets: { left: 40, right: 40 },
    })
    rerendered.closeMT()
    expect(first.presence.current).toBe(PresenceState.Leaving)
    rerendered.showMT({ animate: false })
    expect(first.surfaceStyle.width).toBe('320px')
    expect(first.surfaceStyle['border-top-left-radius']).toBe('24px')

    // Drag resurrection during Leaving preserves the live geometry under the finger.
    const second = setup(
      'bottom',
      ['50%'],
      { insets: { left: 30, right: 30 } },
      24,
    )
    const dragSnap = second.render(viewport)
    dragSnap.showMT({ animate: false })
    dragSnap.setFrameMT({ insets: { left: 0, right: 0 } })
    dragSnap.setCornerRadiusMT(0)
    dragSnap.closeMT()
    expect(second.presence.current).toBe(PresenceState.Leaving)
    dragSnap.onDragStartMT()
    expect(second.surfaceStyle.width).toBe('400px')
    expect(second.surfaceStyle['border-top-left-radius']).toBe('0px')
  })

  it.each(['top', 'bottom', 'left', 'right', 'start', 'end'] as const)(
    'opens %s from local dimensions without a layout event or effect',
    side => {
      const { render, entered } = setup(side)
      const snap = render({ width: 300, height: 480 }, false)
      snap.showMT()
      vi.advanceTimersByTime(16)
      expect(snap.yRef.current.get()).toBeGreaterThan(0)
      vi.advanceTimersByTime(3000)
      expect(snap.yRef.current.get()).toBe(
        side === 'top' || side === 'bottom' ? 240 : 150,
      )
      expect(entered).toHaveBeenCalledTimes(1)
    },
  )

  it('keeps legacy percentage opening independent of layout and local effects', () => {
    const { render } = setup()
    const snap = render(null, false)
    snap.showMT({ animate: false })
    expect(snap.yRef.current.get()).toBe(400)
    expect(snap.viewportSize).toBe(800)
  })

  it('retains the selected index and immediately resizes an idle percentage snap', () => {
    const { render, changed, viewportStyle, surfaceStyle } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.snapToMT(1, { animate: false })
    const resized = render({ width: 220, height: 320 })
    expect(resized.yRef).toBe(snap.yRef)
    expect(resized.yRef.current.get()).toBe(272)
    expect(resized.getResolvedSnapOffsets()).toEqual([160, 272])
    expect(viewportStyle.height).toBe('272px')
    expect(surfaceStyle.height).toBe('480px')
    expect(changed).toHaveBeenCalledTimes(1)
  })

  it('retargets an opening animation from its current position', () => {
    const { render, entered, snapStarted } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT()
    vi.advanceTimersByTime(32)
    const position = snap.yRef.current.get()
    const resized = render({ width: 220, height: 320 })
    expect(resized.yRef.current.get()).toBe(position)
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(160)
    expect(entered).toHaveBeenCalledTimes(1)
    expect(snapStarted).not.toHaveBeenCalled()
  })

  it('retargets the requested snap rather than the last completed snap', () => {
    const { render, snapStarted, changed } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.snapToMT(1)
    vi.advanceTimersByTime(32)
    const resized = render({ width: 220, height: 320 })
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(272)
    expect(snapStarted).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenLastCalledWith(1, 272)
  })

  it('keeps a scroll-interrupted snap frozen and resumes toward the new target', () => {
    const { render } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.snapToMT(1)
    vi.advanceTimersByTime(32)
    snap.interruptAnimationMT()
    const position = snap.yRef.current.get()
    const resized = render({ width: 220, height: 320 })
    vi.advanceTimersByTime(500)
    expect(resized.yRef.current.get()).toBe(position)
    resized.resumeAnimationMT()
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(272)
  })

  it('preserves a drag while replacing its snap boundaries', () => {
    const { render } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.onDragStartMT()
    snap.yRef.current.set(200)
    const resized = render({ width: 220, height: 320 })
    expect(resized.yRef.current.get()).toBe(200)
    expect(resized.getResolvedSnapOffsets()).toEqual([160, 272])
    resized.onDragEndSnapMT(0)
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(160)
  })

  it('does not reopen a closing sheet on resize', () => {
    const { render, presence, entered } = setup()
    const snap = render({ width: 300, height: 480 })
    snap.showMT({ animate: false })
    snap.closeMT()
    const resized = render({ width: 220, height: 320 })
    expect(presence.current).toBe(PresenceState.Leaving)
    vi.advanceTimersByTime(3000)
    expect(resized.yRef.current.get()).toBe(0)
    expect(presence.current).toBe(PresenceState.Left)
    expect(entered).toHaveBeenCalledTimes(1)
  })

  it('remeasures fit content while percentages use the resized local basis', () => {
    const { render } = setup('bottom', ['fit', '85%'])
    const snap = render({ width: 300, height: 480 })
    snap.handleSheetLayoutChangeMT({ detail: { height: 180 } })
    snap.showMT({ animate: false })
    const resized = render({ width: 220, height: 320 })
    resized.handleSheetLayoutChangeMT({ detail: { height: 230 } })
    expect(resized.getResolvedSnapOffsets()).toEqual([230, 272])
    expect(resized.yRef.current.get()).toBe(230)
  })

  it('opens fit only after the parent reserves the inset-width content height', () => {
    const { render, entered } = setup('bottom', ['fit', '100%'])
    const snap = render({ width: 320, height: 400 })
    const { bodyContext } = snap
    const writeSlot = vi.fn()
    const writeBody = vi.fn()
    const writeClip = vi.fn()
    const bodyElement = {
      setStyleProperties: writeBody,
    } as unknown as MainThread.Element
    const insets = { top: 40, right: 60 }
    bodyContext.setBodySlotMTRef?.(
      { setStyleProperties: writeSlot } as unknown as MainThread.Element,
    )
    bodyContext.setBodyMTRef(bodyElement, insets)
    bodyContext.setBodyClipMTRef?.(
      { setStyleProperties: writeClip } as unknown as MainThread.Element,
    )
    snap.showMT({ animate: false })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 320, height: 0 })
    snap.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 24 },
    })
    bodyContext.measureIntrinsicBodyMT?.({ width: 320, height: 240 })
    expect(snap.yRef.current.get()).toBe(0)
    expect(writeSlot).not.toHaveBeenCalled()

    bodyContext.measureIntrinsicBodyMT?.({ width: 260, height: 280 })
    expect(snap.yRef.current.get()).toBe(0)
    snap.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 304 },
    })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 320, height: 280 })
    expect(snap.yRef.current.get()).toBe(304)
    expect(entered).toHaveBeenCalledTimes(1)

    writeBody.mockClear()
    writeClip.mockClear()
    snap.yRef.current.set(340)
    snap.yRef.current.set(380)
    expect(writeBody.mock.calls.flat()).toEqual([
      { transform: 'translateY(44px)' },
      { transform: 'translateY(4px)' },
    ])
    expect(writeClip.mock.calls.flat()).toEqual([
      { transform: 'translateY(-44px)' },
      { transform: 'translateY(-4px)' },
    ])

    snap.snapToMT(1, { animate: false })
    expect(writeClip).toHaveBeenLastCalledWith({
      transform: 'translateY(16px)',
    })
    snap.yRef.current.set(390)
    expect(writeClip).toHaveBeenLastCalledWith({ transform: 'translateY(6px)' })
    snap.yRef.current.set(400)
    expect(writeClip).toHaveBeenLastCalledWith({
      transform: 'translateY(16px)',
    })
    expect(writeSlot.mock.calls).toEqual([[{ height: '280px' }]])
    expect(snap.getResolvedSnapOffsets()).toEqual([304, 400])

    snap.yRef.current.set(260)
    expect(writeBody).toHaveBeenLastCalledWith({
      transform: 'translateY(124px)',
    })
    snap.yRef.current.set(400)
    expect(writeBody).toHaveBeenLastCalledWith({
      transform: 'translateY(0px)',
    })

    // A transient panel width can reflow the text synchronously without moving the fit snap.
    writeBody.mockClear()
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 240, height: 280 })
    expect(writeBody.mock.calls).toEqual([[{ left: '0px', right: '0px' }]])
    bodyContext.measureIntrinsicBodyMT?.({ width: 240, height: 360 })
    expect(writeBody).toHaveBeenCalledTimes(1)
    expect(writeSlot.mock.calls).toEqual([[{ height: '280px' }]])
    expect(snap.getResolvedSnapOffsets()).toEqual([304, 400])
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 320, height: 280 })
    bodyContext.measureIntrinsicBodyMT?.({ width: 260, height: 300 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 320, height: 300 })
    snap.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 324 },
    })
    expect(snap.getResolvedSnapOffsets()).toEqual([324, 400])
    expect(snap.yRef.current.get()).toBe(400)
    snap.collapseMT({ animate: false })
    expect(snap.yRef.current.get()).toBe(324)

    // The React commit that resizes the panel can reattach its body ref.
    writeBody.mockClear()
    bodyContext.setBodyMTRef(null, insets)
    bodyContext.setBodyMTRef(bodyElement, insets)
    expect(writeBody).toHaveBeenLastCalledWith({
      left: '0px',
      right: '60px',
      transform: 'translateY(60px)',
    })
  })

  it.each([undefined, 24])(
    'keeps fit and percent stops stable while the panel width animates (radius %s)',
    cornerRadius => {
      const { render } = setup(
        'bottom',
        ['fit', '80%', '100%'],
        { insets: { bottom: 8 } },
        cornerRadius,
      )
      const snap = render({ width: 320, height: 400 })
      const { bodyContext } = snap
      const writeSlot = vi.fn()
      bodyContext.setBodySlotMTRef(
        { setStyleProperties: writeSlot } as unknown as MainThread.Element,
      )
      bodyContext.setBodyMTRef(
        { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
        { top: 40, right: 60 },
      )
      snap.showMT({ animate: false })
      bodyContext.measureBodyMT({ width: 320, top: 24, height: 0 })
      snap.handleSheetLayoutChangeMT({ detail: { width: 320, height: 24 } })
      bodyContext.measureIntrinsicBodyMT({ width: 260, height: 200 })
      bodyContext.measureBodyMT({ width: 320, top: 24, height: 200 })
      snap.handleSheetLayoutChangeMT({ detail: { width: 320, height: 224 } })
      expect(snap.yRef.current.get()).toBe(224)
      expect(snap.getResolvedSnapOffsets()).toEqual([224, 320, 400])
      writeSlot.mockClear()

      snap.snapToMT(2, { animationConfig: { type: 'tween', duration: 200 } })
      bodyContext.measureBodyMT({ width: 300, top: 24, height: 200 })
      bodyContext.measureIntrinsicBodyMT({ width: 260, height: 200 })
      bodyContext.measureBodyMT({ width: 220, top: 24, height: 200 })
      bodyContext.measureIntrinsicBodyMT({ width: 220, height: 260 })
      vi.advanceTimersByTime(1000)
      expect(snap.yRef.current.get()).toBe(400)
      expect(writeSlot).not.toHaveBeenCalled()

      snap.snapToMT(1, { animate: false })
      expect(snap.yRef.current.get()).toBe(320)
      snap.snapToMT(0, { animate: false })
      expect(snap.yRef.current.get()).toBe(224)
    },
  )

  it('resolves fit after the slot settles inside a parent with a fixed height', () => {
    const snap = setup('bottom', ['fit']).render({ width: 320, height: 400 })
    const node = {
      setStyleProperties: vi.fn(),
    } as unknown as MainThread.Element
    const { bodyContext } = snap
    bodyContext.setBodySlotMTRef?.(node)
    bodyContext.setBodyMTRef(node, { right: 60 })
    snap.showMT({ animate: false })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 320, height: 0 })
    snap.handleSheetLayoutChangeMT({ detail: { width: 320, height: 300 } })
    bodyContext.measureIntrinsicBodyMT?.({ width: 260, height: 240 })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 320, height: 240 })
    // Native hydration can deliver an earlier, unrestricted measurement.
    bodyContext.measureIntrinsicBodyMT?.({ width: 320, height: 200 })
    vi.advanceTimersByTime(16)
    expect(snap.yRef.current.get()).toBe(300)
  })

  it('recaps the measured fit height after a height-only viewport resize', () => {
    const { render } = setup('bottom', ['fit'], { insets: { bottom: 8 } })
    const snap = render({ width: 320, height: 400 })
    const node = {
      setStyleProperties: vi.fn(),
    } as unknown as MainThread.Element
    const { bodyContext } = snap
    bodyContext.setBodySlotMTRef?.(node)
    bodyContext.setBodyMTRef(node, { right: 60 })
    snap.showMT({ animate: false })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 320, height: 0 })
    snap.handleSheetLayoutChangeMT({ detail: { width: 320, height: 24 } })
    bodyContext.measureIntrinsicBodyMT?.({ width: 260, height: 480 })
    snap.handleSheetLayoutChangeMT({ detail: { width: 320, height: 504 } })
    bodyContext.measureBodyMT({ left: 0, top: 24, width: 320, height: 480 })
    expect(snap.getResolvedSnapOffsets()).toEqual([392])

    const resized = render({ width: 320, height: 600 })
    expect(resized.getResolvedSnapOffsets()).toEqual([504])
    expect(resized.yRef.current.get()).toBe(504)
  })

  it('starts at an explicit snap even when an inset fit snap is pending', () => {
    const { render } = setup('bottom', ['100%', 'fit'])
    const snap = render({ width: 320, height: 400 }, false)
    snap.bodyContext.setBodySlotMTRef?.({} as MainThread.Element)
    snap.showMT({ animate: false })
    expect(snap.getResolvedSnapOffsets()).toEqual([400, -1])
    expect(snap.yRef.current.get()).toBe(400)
  })

  it('reserves remaining bottom safe area in fit mode without clipping content or double-counting gaps/footers', () => {
    // Pure fit floating sheet (gap 8, bottom safe area 34 -> reserves 26px)
    const fitOnlySnap = setup('bottom', ['fit'], { insets: { bottom: 8 } })
      .render(
        { width: 320, height: 800 },
      )
    const fitOnlyClipStyle: Record<string, string> = {}
    const writeFitOnlySlot = vi.fn()
    const writeFitOnlyClip = vi.fn((style: object) =>
      Object.assign(fitOnlyClipStyle, style)
    )
    fitOnlySnap.bodyContext.setBodySlotMTRef?.(
      { setStyleProperties: writeFitOnlySlot } as unknown as MainThread.Element,
    )
    fitOnlySnap.bodyContext.setBodyMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
      { top: 40, bottom: 34 },
    )
    fitOnlySnap.bodyContext.setBodyClipMTRef?.(
      { setStyleProperties: writeFitOnlyClip } as unknown as MainThread.Element,
    )
    fitOnlySnap.showMT({ animate: false })
    fitOnlySnap.bodyContext.measureBodyMT({
      left: 0,
      top: 24,
      width: 320,
      height: 0,
    })
    fitOnlySnap.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 24 },
    })
    fitOnlySnap.bodyContext.measureIntrinsicBodyMT?.({
      width: 320,
      height: 200,
    })
    expect(writeFitOnlySlot).toHaveBeenLastCalledWith({ height: '226px' })

    fitOnlySnap.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 250 },
    })
    fitOnlySnap.bodyContext.measureBodyMT({
      left: 0,
      top: 24,
      width: 320,
      height: 226,
    })
    expect(fitOnlySnap.getResolvedSnapOffsets()).toEqual([250])
    expect(fitOnlySnap.yRef.current.get()).toBe(250)
    expect(fitOnlyClipStyle.height).toBe('200px')

    // Adding a 20px footer leaves 6px remaining clearance (34 - 8 - 20 = 6px).
    fitOnlySnap.footerContext.setFooterMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
    )
    fitOnlySnap.footerContext.updateFooterHeightMT(20)
    expect(writeFitOnlySlot).toHaveBeenLastCalledWith({ height: '206px' })
    fitOnlySnap.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 230 },
    })
    fitOnlySnap.bodyContext.measureBodyMT({
      left: 0,
      top: 24,
      width: 320,
      height: 206,
    })
    expect(fitOnlySnap.getResolvedSnapOffsets()).toEqual([250])
    expect(fitOnlyClipStyle.height).toBe('200px')

    // A 40px footer already clears 34 - 8 = 26px, so bottomReserve drops to 0.
    fitOnlySnap.footerContext.updateFooterHeightMT(40)
    expect(writeFitOnlySlot).toHaveBeenLastCalledWith({ height: '200px' })
  })

  it('reserves remaining bottom safe area in multi-snap fit mode', () => {
    const multiSnap = setup('bottom', ['fit', '100%'], {
      insets: { bottom: 8 },
    }).render(
      { width: 320, height: 800 },
    )
    const writeMultiSlot = vi.fn()
    multiSnap.bodyContext.setBodySlotMTRef?.(
      { setStyleProperties: writeMultiSlot } as unknown as MainThread.Element,
    )
    multiSnap.bodyContext.setBodyMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
      { top: 40, bottom: 34 },
    )
    multiSnap.showMT({ animate: false })
    multiSnap.bodyContext.measureBodyMT({
      left: 0,
      top: 24,
      width: 320,
      height: 0,
    })
    multiSnap.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 24 },
    })
    multiSnap.bodyContext.measureIntrinsicBodyMT?.({
      width: 320,
      height: 200,
    })
    expect(writeMultiSlot).toHaveBeenLastCalledWith({ height: '226px' })
    multiSnap.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 250 },
    })
    multiSnap.bodyContext.measureBodyMT({
      left: 0,
      top: 24,
      width: 320,
      height: 226,
    })
    expect(multiSnap.getResolvedSnapOffsets()).toEqual([250, 800])
    expect(multiSnap.yRef.current.get()).toBe(250)
  })

  it('cancels a pending fit snap on close when SheetPositioner is omitted', () => {
    const { render, presence } = setup('bottom', ['50%', 'fit'])
    const snap = render(null, true)
    snap.showMT({ animate: false })
    expect(snap.yRef.current.get()).toBe(400)

    snap.snapToMT(1, { animate: false })
    snap.closeMT({ animate: false })
    snap.handleSheetLayoutChangeMT({ detail: { height: 260 } })
    expect(presence.current).toBe(PresenceState.Left)
    expect(snap.yRef.current.get()).toBe(0)
  })

  it('reconciles open snaps on viewport/snapPoint changes when SheetPositioner is omitted', () => {
    const { render } = setup('bottom', ['40%', '80%'])
    const snap = render(null, true)
    snap.showMT({ animate: false })
    expect(snap.yRef.current.get()).toBe(320)

    const updated = render(null, true, undefined, ['50%', '90%'], 600)
    expect(updated.getResolvedSnapOffsets()).toEqual([300, 540])
    expect(updated.yRef.current.get()).toBe(300)
  })

  it('reserves remaining top safe area in side="top" fit mode without clipping content', () => {
    const topFit = setup('top', ['fit']).render({ width: 320, height: 800 })
    const clipStyle: Record<string, string> = {}
    const writeSlot = vi.fn()
    const writeClip = vi.fn((style: object) => Object.assign(clipStyle, style))
    topFit.bodyContext.setBodySlotMTRef?.(
      { setStyleProperties: writeSlot } as unknown as MainThread.Element,
    )
    topFit.bodyContext.setBodyMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
      { top: 59 },
    )
    topFit.bodyContext.setBodyClipMTRef(
      { setStyleProperties: writeClip } as unknown as MainThread.Element,
    )
    topFit.showMT({ animate: false })
    // 12px spacer above SheetBody leaves 59 - 12 = 47px remaining top clearance
    topFit.bodyContext.measureBodyMT({
      left: 0,
      top: 12,
      width: 320,
      height: 0,
    })
    topFit.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 28 },
    })
    topFit.bodyContext.measureIntrinsicBodyMT?.({
      width: 320,
      height: 200,
    })
    expect(writeSlot).toHaveBeenLastCalledWith({ height: '247px' })

    topFit.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 320, height: 275 },
    })
    topFit.bodyContext.measureBodyMT({
      left: 0,
      top: 12,
      width: 320,
      height: 247,
    })
    expect(topFit.getResolvedSnapOffsets()).toEqual([275])
    expect(topFit.yRef.current.get()).toBe(275)
    expect(clipStyle.height).toBe('200px')
  })

  it.each(['right', 'left'] as const)(
    'resolves horizontal fit drawer width and drives zero-write drag transforms for side="%s"',
    side => {
      const sideFit = setup(side, ['fit']).render({ width: 800, height: 1000 })
      const clipStyle: Record<string, string> = {}
      const writeSlot = vi.fn()
      const writeBody = vi.fn()
      const writeClip = vi.fn((style: object) =>
        Object.assign(clipStyle, style)
      )
      sideFit.bodyContext.setBodySlotMTRef?.(
        { setStyleProperties: writeSlot } as unknown as MainThread.Element,
      )
      sideFit.bodyContext.setBodyMTRef(
        { setStyleProperties: writeBody } as unknown as MainThread.Element,
        side === 'right' ? { top: 20, right: 64 } : { top: 20, left: 64 },
      )
      sideFit.bodyContext.setBodyClipMTRef(
        { setStyleProperties: writeClip } as unknown as MainThread.Element,
      )
      sideFit.showMT({ animate: false })

      // 24px sibling on the open side leaves 64 - 24 = 40px remaining edge clearance.
      sideFit.bodyContext.measureBodyMT({
        left: side === 'left' ? 24 : 0,
        top: 0,
        width: 0,
        height: 1000,
      })
      sideFit.handleSheetLayoutChangeMT({
        detail: { left: 0, top: 0, width: 24, height: 1000 },
      })
      sideFit.bodyContext.measureIntrinsicBodyMT?.({
        width: 220,
        height: 980,
      })
      expect(writeSlot).toHaveBeenLastCalledWith({ width: '260px' })

      sideFit.handleSheetLayoutChangeMT({
        detail: { left: 0, top: 0, width: 284, height: 1000 },
      })
      sideFit.bodyContext.measureBodyMT({
        left: side === 'left' ? 24 : 0,
        top: 0,
        width: 260,
        height: 1000,
      })
      expect(sideFit.getResolvedSnapOffsets()).toEqual([284])
      expect(sideFit.yRef.current.get()).toBe(284)
      expect(clipStyle.width).toBe('220px')

      writeBody.mockClear()
      writeClip.mockClear()
      sideFit.yRef.current.set(160)
      sideFit.yRef.current.set(284)
      for (const spy of [writeClip, writeBody]) {
        for (const [style] of spy.mock.calls) {
          expect(style).not.toHaveProperty('width')
          expect(style).not.toHaveProperty('height')
        }
      }
      expect(writeClip.mock.calls).toEqual(
        side === 'right'
          ? [
            [{ transform: 'translateX(-124px)' }],
            [{ transform: 'translateX(0px)' }],
          ]
          : [],
      )
      expect(writeBody).toHaveBeenLastCalledWith({
        transform: 'translateX(0px)',
      })
    },
  )

  it('resolves bounded fit snap points from local viewport size and stays stable across inline re-renders', () => {
    const controller = setup('bottom', [{ fit: { min: 166, max: '73%' } }])
    const first = controller.render({ width: 400, height: 800 })
    const writeSlot = vi.fn()
    first.bodyContext.setBodySlotMTRef?.(
      { setStyleProperties: writeSlot } as unknown as MainThread.Element,
    )
    first.bodyContext.setBodyMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
      { bottom: 34 },
    )
    first.bodyContext.setBodyClipMTRef(
      { setStyleProperties: vi.fn() } as unknown as MainThread.Element,
    )
    first.showMT({ animate: false })
    first.bodyContext.measureBodyMT({ left: 0, top: 0, width: 400, height: 0 })
    first.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 400, height: 0 },
    })
    first.bodyContext.measureIntrinsicBodyMT?.({ width: 400, height: 60 })
    expect(writeSlot).toHaveBeenLastCalledWith({ height: '166px' })
    first.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 400, height: 166 },
    })
    first.bodyContext.measureBodyMT({
      left: 0,
      top: 0,
      width: 400,
      height: 166,
    })
    expect(first.fitMaxSize).toBe(584)
    expect(first.getResolvedSnapOffsets()).toEqual([166])

    first.bodyContext.measureIntrinsicBodyMT?.({ width: 400, height: 700 })
    expect(writeSlot).toHaveBeenLastCalledWith({ height: '584px' })
    first.handleSheetLayoutChangeMT({
      detail: { left: 0, top: 0, width: 400, height: 584 },
    })
    first.bodyContext.measureBodyMT({
      left: 0,
      top: 0,
      width: 400,
      height: 584,
    })
    expect(first.getResolvedSnapOffsets()).toEqual([584])

    // Fresh inline object reference with equal bounds keeps the resolved fit state stable.
    const rerendered = controller.render(
      { width: 400, height: 800 },
      true,
      undefined,
      [{ fit: { min: 166, max: '73%' } }],
    )
    expect(rerendered.fitMaxSize).toBe(584)
    expect(rerendered.getResolvedSnapOffsets()).toEqual([584])
    expect(rerendered.yRef.current.get()).toBe(584)
  })
})
