// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread } from '@lynx-js/react'

import { renderHook } from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  fixPrecisionMT,
  normalizeLoopOffset,
  normalizeLoopTransition,
} from '../src/utils/index'

beforeEach(() => {
  renderHook(() => null)
})

describe('swiper loop offset utils', () => {
  it('normalizes offsets after dragging through multiple loops', async () => {
    await expect(runOnMainThread(normalizeLoopOffset)(-1300, 500)).resolves
      .toBe(-300)
    await expect(runOnMainThread(normalizeLoopOffset)(1200, 500)).resolves.toBe(
      -300,
    )
    await expect(runOnMainThread(normalizeLoopOffset)(-1500, 500)).resolves
      .toBe(0)
    await expect(runOnMainThread(normalizeLoopOffset)(1500, 500)).resolves.toBe(
      0,
    )
  })

  it('preserves the logical index when normalizing the loop offset', async () => {
    const size = 100
    const dataCount = 5
    const mod = (value: number) => ((value % dataCount) + dataCount) % dataCount
    const getIndex = async (offset: number, direction: 'normal' | 'revert') => {
      const rawIndex = await runOnMainThread(fixPrecisionMT)(-offset / size)
      return mod(
        direction === 'normal'
          ? Math.floor(rawIndex)
          : Math.ceil(rawIndex),
      )
    }

    for (const offset of [-1350, -650, 250, 1250]) {
      const normalizedOffset = await runOnMainThread(normalizeLoopOffset)(
        offset,
        size * dataCount,
      )
      expect(await getIndex(normalizedOffset, 'normal')).toBe(
        await getIndex(offset, 'normal'),
      )
      expect(await getIndex(normalizedOffset, 'revert')).toBe(
        await getIndex(offset, 'revert'),
      )
    }
  })

  it('preserves the paging distance after normalizing a loop transition', async () => {
    await expect(runOnMainThread(normalizeLoopTransition)(-570, -600, 500))
      .resolves.toEqual({
        offset: -70,
        finalOffset: -100,
      })
    await expect(runOnMainThread(normalizeLoopTransition)(70, 100, 500))
      .resolves.toEqual({
        offset: -430,
        finalOffset: -400,
      })
    await expect(runOnMainThread(normalizeLoopTransition)(-1270, -1300, 500))
      .resolves.toEqual({
        offset: -270,
        finalOffset: -300,
      })
    await expect(runOnMainThread(normalizeLoopTransition)(1230, 1200, 500))
      .resolves.toEqual({
        offset: -270,
        finalOffset: -300,
      })
  })

  it('returns a stable offset when the loop has no size', async () => {
    await expect(runOnMainThread(normalizeLoopOffset)(100, 0)).resolves.toBe(0)
    await expect(runOnMainThread(normalizeLoopTransition)(100, 200, 0)).resolves
      .toEqual({
        offset: 0,
        finalOffset: 0,
      })
  })
})
