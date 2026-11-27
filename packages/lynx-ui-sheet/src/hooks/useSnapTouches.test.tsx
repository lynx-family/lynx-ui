// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
} from '@lynx-js/react'

import type { MotionValue } from '@lynx-js/motion/mini'
import { fireEvent, render } from '@lynx-js/react/testing-library'
import { describe, expect, it, vi } from 'vitest'

import { useSnapTouches } from './useSnapTouches'
import type { SnapTouchOptions } from './useSnapTouches'

interface ReleaseTestProps {
  velocity: number
  options: Partial<SnapTouchOptions>
  onSnap: (index: number) => void
  onClose: () => void
  onReady: (initY: () => void) => void
}

function SheetTouchHarness({
  velocity,
  options,
  onSnap,
  onClose,
  onReady,
}: ReleaseTestProps) {
  const offsets = options.snapOffsets ?? [400, 640]
  const validOffsets = offsets.filter(value => value !== -1)
  const yRef = useMainThreadRef<MotionValue<number>>(
    null as unknown as MotionValue<number>,
  )
  const sheetSizeMTRef = useMainThreadRef<number>(640)

  const initY = () => {
    'main thread'
    let offset = 100
    yRef.current = {
      get: () => offset,
      getVelocity: () => velocity,
      set: (value: number) => {
        offset = value
      },
    } as unknown as MotionValue<number>
  }
  onReady(initY)

  const getResolvedSnapOffsets = () => {
    'main thread'
    return offsets
  }
  const onDragStartMT = () => {
    'main thread'
  }
  const onDragEndSnapMT = (index: number) => {
    'main thread'
    runOnBackground(onSnap)(index)
  }
  const onDragEndCloseMT = () => {
    'main thread'
    runOnBackground(onClose)()
  }

  const handlers = useSnapTouches({
    yRef,
    viewportSize: 800,
    sheetSizeMTRef,
    snapOffsets: offsets,
    snapPointValues: offsets,
    minOffset: Math.min(...validOffsets),
    maxOffset: Math.max(...validOffsets),
    getResolvedSnapOffsets,
    getResolvedSnapPointValues: getResolvedSnapOffsets,
    onDragStartMT,
    onDragEndSnapMT,
    onDragEndCloseMT,
    ...options,
  })

  return (
    <view
      id='sheet'
      main-thread:bindtouchstart={handlers.handleTouchStartMT}
      main-thread:bindtouchmove={handlers.handleTouchMoveMT}
      main-thread:bindtouchend={handlers.handleTouchEndMT}
    />
  )
}

async function releaseSheet(
  velocity: number,
  options: Partial<SnapTouchOptions> = {},
) {
  const onDragEndSnapMT = vi.fn()
  const onDragEndCloseMT = vi.fn()
  let initY: (() => void) | undefined

  const { container } = render(
    <SheetTouchHarness
      velocity={velocity}
      options={options}
      onSnap={onDragEndSnapMT}
      onClose={onDragEndCloseMT}
      onReady={fn => {
        initY = fn
      }}
    />,
  )
  await runOnMainThread(initY!)()

  const sheet = container.querySelector('#sheet')!
  const horizontal = options.side === 'left' || options.side === 'right'
  const end = horizontal ? { x: 10, y: 0 } : { x: 0, y: 10 }

  fireEvent.touchstart(sheet, { detail: { x: 0, y: 0 } })
  fireEvent.touchmove(sheet, { detail: end })
  fireEvent.touchend(sheet, { detail: end })

  return { onDragEndSnapMT, onDragEndCloseMT }
}

describe('sheet release velocity', () => {
  it.each(['bottom', 'top', 'left', 'right'] as const)(
    'recovers a %s sheet from the dismiss zone on an opening fling',
    async side => {
      const result = await releaseSheet(200, { side })
      expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
      expect(result.onDragEndSnapMT).toHaveBeenCalledWith(0)
    },
  )

  it('uses opening momentum to reach a higher snap point', async () => {
    const result = await releaseSheet(1600)
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
    async ({ offsets, expectedIndex }) => {
      const result = await releaseSheet(200, { snapOffsets: offsets })
      expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
      expect(result.onDragEndSnapMT).toHaveBeenCalledWith(expectedIndex)
    },
  )

  it('preserves a higher snap index after excluding a configured zero', async () => {
    const result = await releaseSheet(1600, { snapOffsets: [0, 400, 640] })
    expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
    expect(result.onDragEndSnapMT).toHaveBeenCalledWith(2)
  })

  it('still dismisses a closing fling with a configured zero snap point', async () => {
    const result = await releaseSheet(-200, { snapOffsets: [0, 400, 640] })
    expect(result.onDragEndCloseMT).toHaveBeenCalledOnce()
    expect(result.onDragEndSnapMT).not.toHaveBeenCalled()
  })

  it.each([0, 199, -200, -1600])(
    'still dismisses a low sheet at release velocity %s',
    async velocity => {
      const result = await releaseSheet(velocity)
      expect(result.onDragEndCloseMT).toHaveBeenCalledOnce()
      expect(result.onDragEndSnapMT).not.toHaveBeenCalled()
    },
  )

  it('preserves distance-based dismissal when fling is disabled', async () => {
    const result = await releaseSheet(1600, { flingEnabled: false })
    expect(result.onDragEndCloseMT).toHaveBeenCalledOnce()
    expect(result.onDragEndSnapMT).not.toHaveBeenCalled()
  })

  it('never dismisses when drag-to-close is disabled', async () => {
    const result = await releaseSheet(-1600, { enableDragToClose: false })
    expect(result.onDragEndCloseMT).not.toHaveBeenCalled()
    expect(result.onDragEndSnapMT).toHaveBeenCalledWith(0)
  })
})
