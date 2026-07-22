// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import {
  fixPrecisionMT,
  normalizeLoopOffset,
  normalizeLoopTransition,
} from '../src/utils/index'

describe('swiper loop offset utils', () => {
  it('normalizes offsets after dragging through multiple loops', () => {
    expect(normalizeLoopOffset(-1300, 500)).toBe(-300)
    expect(normalizeLoopOffset(1200, 500)).toBe(-300)
    expect(normalizeLoopOffset(-1500, 500)).toBe(0)
    expect(normalizeLoopOffset(1500, 500)).toBe(0)
  })

  it('preserves the logical index when normalizing the loop offset', () => {
    const size = 100
    const dataCount = 5
    const mod = (value: number) => ((value % dataCount) + dataCount) % dataCount
    const getIndex = (offset: number, direction: 'normal' | 'revert') => {
      const rawIndex = fixPrecisionMT(-offset / size)
      return mod(
        direction === 'normal'
          ? Math.floor(rawIndex)
          : Math.ceil(rawIndex),
      )
    }

    for (const offset of [-1350, -650, 250, 1250]) {
      const normalizedOffset = normalizeLoopOffset(
        offset,
        size * dataCount,
      )
      expect(getIndex(normalizedOffset, 'normal')).toBe(
        getIndex(offset, 'normal'),
      )
      expect(getIndex(normalizedOffset, 'revert')).toBe(
        getIndex(offset, 'revert'),
      )
    }
  })

  it('preserves the paging distance after normalizing a loop transition', () => {
    expect(normalizeLoopTransition(-570, -600, 500)).toEqual({
      offset: -70,
      finalOffset: -100,
    })
    expect(normalizeLoopTransition(70, 100, 500)).toEqual({
      offset: -430,
      finalOffset: -400,
    })
    expect(normalizeLoopTransition(-1270, -1300, 500)).toEqual({
      offset: -270,
      finalOffset: -300,
    })
    expect(normalizeLoopTransition(1230, 1200, 500)).toEqual({
      offset: -270,
      finalOffset: -300,
    })
  })

  it('returns a stable offset when the loop has no size', () => {
    expect(normalizeLoopOffset(100, 0)).toBe(0)
    expect(normalizeLoopTransition(100, 200, 0)).toEqual({
      offset: 0,
      finalOffset: 0,
    })
  })
})
