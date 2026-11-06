// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createMotionValue } from '@lynx-js/motion/mini'
import { describe, expect, it, vi } from 'vitest'

import { useSheetController } from './useSheetController'

vi.mock('@lynx-js/react', () => ({
  useMainThreadRef: <T>(current: T) => ({ current }),
  runOnBackground: <T>(fn: T) => fn,
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

function setup() {
  const position = createMotionValue(0)
  const animateToMT = vi.fn()
  const onSnapStartMT = vi.fn()
  const onEntered = vi.fn()
  const onSnapChangeMT = vi.fn()
  const getTargetForSnap = vi.fn((index: number) => [300, 900][index])
  // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
  const controller = useSheetController({ onEntered }, {
    yRef: { current: position },
    stopAnimationMT: vi.fn(),
    animateToMT,
    getTargetForSnap,
    getResolvedSnapPointValues: () => [300, 900],
    onSnapChangeMT,
    onSnapStartMT,
    enterAnimation: { type: 'tween', duration: 400 },
    exitAnimation: { type: 'tween', duration: 400 },
    initialSnap: 0,
  })
  return {
    controller,
    position,
    animateToMT,
    getTargetForSnap,
    onSnapStartMT,
    onEntered,
    onSnapChangeMT,
  }
}

describe('Sheet snap start notification', () => {
  it('reports a snap interrupting opening before its animation and completes presence', () => {
    const {
      controller,
      animateToMT,
      onSnapStartMT,
      onEntered,
      onSnapChangeMT,
    } = setup()
    controller.showMT()
    expect(onSnapStartMT).not.toHaveBeenCalled()

    controller.snapToMT(1)
    expect(onSnapStartMT.mock.calls).toEqual([[1, 900, true]])
    expect(onSnapStartMT.mock.invocationCallOrder[0]).toBeLessThan(
      animateToMT.mock.invocationCallOrder[1],
    )
    animateToMT.mock.calls[1][1]()
    expect(onSnapChangeMT).toHaveBeenCalledWith(1, 900)
    expect(onEntered).toHaveBeenCalledTimes(1)
  })

  it('reports repeated and immediate snaps but excludes entry adjustments and closing', () => {
    const { controller, position, animateToMT, onSnapStartMT } = setup()
    controller.showMT()
    animateToMT.mock.calls[0][1]()
    controller.snapToMT(0)
    controller.snapToMT(0, { animate: false })
    expect(onSnapStartMT.mock.calls).toEqual([[0, 300, true], [0, 300, false]])
    expect(position.get()).toBe(300)
    controller.snapToMT(0, { isEntry: true })
    controller.closeMT({ animate: false })
    expect(onSnapStartMT).toHaveBeenCalledTimes(2)
  })

  it('waits for fit measurement and preserves the immediate option', () => {
    const { controller, animateToMT, getTargetForSnap, onSnapStartMT } = setup()
    controller.showMT()
    animateToMT.mock.calls[0][1]()
    getTargetForSnap.mockReturnValueOnce(-1)
    controller.snapToMT(1, { animate: false })
    expect(onSnapStartMT).not.toHaveBeenCalled()
    controller.resolvePendingSnapMT()
    expect(onSnapStartMT.mock.calls).toEqual([[1, 900, false]])
  })
})
