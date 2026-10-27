// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import { getArrowDimensions, resolveArrowSize } from '../src/arrowGeometry'
import { arrow } from '../src/floating/arrow'
import { computePosition } from '../src/floating/computePosition'
import type {
  Dimensions,
  Placement,
  Platform,
} from '../src/floating/floatingTypes'
import { offset } from '../src/floating/offset'

vi.mock('@lynx-js/lynx-ui-common', () => ({ log: vi.fn() }))

const placements: Placement[] = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
]

async function positionArrow(
  dimensions: Dimensions,
  placement: Placement,
  padding: number,
) {
  const reference = { x: 100, y: 100, width: 16, height: 16 }
  const floating = { x: 0, y: 0, width: 216, height: 80 }
  const positioned = getArrowDimensions(dimensions, placement)
  const platform: Platform = {
    getElementRects: () => ({ reference, floating }),
    getDimensions: (element) => element === 'arrow' ? positioned : floating,
    getClippingRect: () => ({ x: 0, y: 0, width: 400, height: 800 }),
    isRTL: () => false,
  }
  const result = await computePosition(reference, floating, {
    placement,
    platform,
    middleware: [offset(dimensions.height + 8), arrow({ padding })],
  })
  const coords = result.middlewareData.arrow as { x?: number, y?: number }
  return { result, coords, reference, floating, positioned }
}

describe('rectangular custom arrow positioning', () => {
  it.each(placements)(
    'keeps a 32 × 11 arrow clear of 16px corners at %s',
    async (placement) => {
      const dimensions = resolveArrowSize({ width: 32, height: 11 }, true)
      const { result, coords, reference, floating, positioned } =
        await positionArrow(dimensions, placement, 16)
      const side = placement.split('-')[0]
      const horizontal = side === 'left' || side === 'right'
      const cross = horizontal ? 'y' : 'x'
      const length = horizontal ? 'height' : 'width'
      const start = coords[cross]!

      // The full artwork, not just an 11px surrogate, must fit between the corners.
      expect(positioned[length]).toBe(32)
      expect(start).toBeGreaterThanOrEqual(16)
      expect(start + 32).toBeLessThanOrEqual(floating[length] - 16)
      expect(result[cross] + start + 16).toBeCloseTo(reference[length] / 2)

      // The bubble reserves only 11px for the arrow, plus the caller's 8px gap.
      const gaps = {
        top: -result.y - floating.height,
        bottom: result.y - reference.height,
        left: -result.x - floating.width,
        right: result.x - reference.width,
      }
      const gap = gaps[side as keyof typeof gaps]
      expect(gap).toBe(19)
    },
  )

  it('uses the requested radius instead of a fixed 27px compensation', async () => {
    const dimensions = resolveArrowSize({ width: 32, height: 11 }, true)
    for (const radius of [8, 16, 24]) {
      const { coords } = await positionArrow(dimensions, 'bottom-start', radius)
      expect(coords.x).toBe(radius)
    }
  })
})

describe('legacy arrow compatibility', () => {
  it.each(placements)(
    'preserves numeric size geometry at %s',
    async (placement) => {
      for (const custom of [false, true]) {
        for (const size of [0, 11, 32]) {
          const dimensions = resolveArrowSize(size, custom)
          expect(dimensions).toEqual({ width: size, height: size })
          const { result, coords, positioned } = await positionArrow(
            dimensions,
            placement,
            0,
          )
          const horizontal = placement.startsWith('left')
            || placement.startsWith('right')
          const cross = horizontal ? 'y' : 'x'
          expect(positioned).toEqual({ width: size, height: size })
          expect(result[cross] + coords[cross]! + size / 2).toBeCloseTo(8)
          const main = horizontal ? result.x : result.y
          const edge = horizontal ? 216 : 80
          expect(main).toBe(
            placement.startsWith('top') || placement.startsWith('left')
              ? -edge - size - 8
              : 16 + size + 8,
          )
        }
      }
    },
  )

  it('keeps the larger dimension for a default triangle with an object size', () => {
    expect(resolveArrowSize({ width: 20, height: 30 }, false))
      .toEqual({ width: 30, height: 30 })
  })
})
