// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'
import { describe, expect, it, vi } from 'vitest'

import { useSnapTouches } from './useSnapTouches'
import type { SnapTouchOptions } from './useSnapTouches'

vi.mock('@lynx-js/react', () => ({
  useMainThreadRef: <T>(current: T) => ({ current }),
}))

vi.mock('@lynx-js/lynx-ui-presence', () => ({ PresenceState: {} }))

function releaseSheet(
  velocity: number,
  options: Partial<SnapTouchOptions> = {},
) {
  let offset = 100
  const offsets = options.snapOffsets ?? [400, 640]
  const validOffsets = offsets.filter(value => value !== -1)
  const onDragEndSnapMT = vi.fn()
  const onDragEndCloseMT = vi.fn()
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Hooks use synchronous mocked refs in this unit harness.
  const handlers = useSnapTouches({
    yRef: {
      current: {
        get: () => offset,
        getVelocity: () => velocity,
        set: (value: number) => {
          offset = value
        },
      } as unknown as MotionValue<number>,
    },
    viewportSize: 800,
    sheetSizeMTRef: { current: 640 },
    snapOffsets: offsets,
    snapPointValues: offsets,
    minOffset: Math.min(...validOffsets),
    maxOffset: Math.max(...validOffsets),
    getResolvedSnapOffsets: () => offsets,
    getResolvedSnapPointValues: () => offsets,
    onDragStartMT: vi.fn(),
    onDragEndSnapMT,
    onDragEndCloseMT,
    ...options,
  })
  const touch = (x: number, y: number) =>
    ({ detail: { x, y } }) as MainThread.TouchEvent
  handlers.handleTouchStartMT(touch(0, 0))
  const horizontal = options.side === 'left' || options.side === 'right'
  const end = horizontal ? touch(10, 0) : touch(0, 10)
  handlers.handleTouchMoveMT(end)
  handlers.handleTouchEndMT(end)
  return { onDragEndSnapMT, onDragEndCloseMT }
}

describe('sheet release velocity', () => {
  it.each(['bottom', 'top', 'left', 'right'] as const)(
    'recovers a %s sheet from the dismiss zone on an opening fling',
    side => {
      const result = releaseSheet(200, { side })
      expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
      expect(result.onDragEndSnapMT).toHaveBeenCalledWith(0)
    },
  )

  it('uses opening momentum to reach a higher snap point', () => {
    const result = releaseSheet(1600)
    expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
    expect(result.onDragEndSnapMT).toHaveBeenCalledWith(1)
  })

  it.each([
    { offsets: [0, 400, 640], expectedIndex: 1 },
    { offsets: [640, 0, 400], expectedIndex: 2 },
    { offsets: [400, 640, 0], expectedIndex: 0 },
    { offsets: [0, -1, 400, 640], expectedIndex: 2 },
  ])(
    'recovers to the original open snap index with offsets $offsets',
    ({ offsets, expectedIndex }) => {
      const result = releaseSheet(200, { snapOffsets: offsets })
      expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
      expect(result.onDragEndSnapMT).toHaveBeenCalledWith(expectedIndex)
    },
  )

  it('preserves a higher snap index after excluding a configured zero', () => {
    const result = releaseSheet(1600, { snapOffsets: [0, 400, 640] })
    expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
    expect(result.onDragEndSnapMT).toHaveBeenCalledWith(2)
  })

  it('still dismisses a closing fling with a configured zero snap point', () => {
    const result = releaseSheet(-200, { snapOffsets: [0, 400, 640] })
    expect(result.onDragEndCloseMT).toHaveBeenCalledOnce()
    expect(result.onDragEndSnapMT).not.toHaveBeenCalled()
  })

  it.each([0, 199, -200, -1600])(
    'still dismisses a low sheet at release velocity %s',
    velocity => {
      const result = releaseSheet(velocity)
      expect(result.onDragEndCloseMT).toHaveBeenCalledOnce()
      expect(result.onDragEndSnapMT).not.toHaveBeenCalled()
    },
  )

  it('preserves distance-based dismissal when fling is disabled', () => {
    const result = releaseSheet(1600, { flingEnabled: false })
    expect(result.onDragEndCloseMT).toHaveBeenCalledOnce()
    expect(result.onDragEndSnapMT).not.toHaveBeenCalled()
  })

  it('never dismisses when drag-to-close is disabled', () => {
    const result = releaseSheet(-1600, { enableDragToClose: false })
    expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
    expect(result.onDragEndSnapMT).toHaveBeenCalledWith(0)
  })
})
