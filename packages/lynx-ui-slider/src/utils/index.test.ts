// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import type { SliderRangeValue } from '../types'

import {
  areSliderValuesEqual,
  clamp01,
  cloneSliderValue,
  getClosestSliderThumbIndex,
  getDraggedSliderThumbIndex,
  getInitialSliderThumbIndex,
  getSliderIndicatorGeometry,
  getSliderThumbValue,
  getTouchX,
  getVisualRatio,
  isSliderRangeValue,
  isSliderValueCollapsed,
  normalizeSliderRangeValue,
  normalizeSliderValue,
  resolveSliderDrag,
  snapToStep,
  updateSliderValue,
} from '.'

describe('single-value slider utilities', () => {
  it('clamps finite and non-finite values to the normalized range', () => {
    expect(clamp01(-0.25)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(1.25)).toBe(1)
    expect(clamp01(Number.NaN)).toBe(0)
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(0)
    expect(clamp01(Number.NEGATIVE_INFINITY)).toBe(0)
  })

  it('resolves visual ratios in LTR and RTL', () => {
    expect(getVisualRatio(0.2, false)).toBe(0.2)
    expect(getVisualRatio(0.2, true)).toBe(0.8)
  })

  it('snaps values while avoiding common floating point artifacts', () => {
    expect(snapToStep(0.26, 0.1)).toBe(0.3)
    expect(snapToStep(0.24, 0.1)).toBe(0.2)
    expect(snapToStep(0.98, 0.25)).toBe(1)
    expect(snapToStep(0.42, undefined)).toBe(0.42)
    expect(snapToStep(0.42, 0)).toBe(0.42)
    expect(snapToStep(0.42, Number.NaN)).toBe(0.42)
  })

  it('normalizes a scalar by clamping before snapping', () => {
    expect(normalizeSliderValue(-0.2)).toBe(0)
    expect(normalizeSliderValue(1.2)).toBe(1)
    expect(normalizeSliderValue(0.26, 0.1)).toBe(0.3)
  })

  it('extracts the touch x coordinate and returns NaN when absent', () => {
    expect(getTouchX({ detail: { x: 0 } })).toBe(0)
    expect(getTouchX({ detail: { x: '24' } })).toBe(24)
    expect(getTouchX({ detail: {} })).toBeNaN()
    expect(getTouchX(null)).toBeNaN()
  })
})

describe('range detection and normalization', () => {
  it('recognizes only two-number tuples', () => {
    expect(isSliderRangeValue([0.2, 0.8])).toBe(true)
    expect(isSliderRangeValue([Number.NaN, 0.8])).toBe(true)
    expect(isSliderRangeValue(0.2)).toBe(false)
    expect(isSliderRangeValue([0.2])).toBe(false)
    expect(isSliderRangeValue([0.2, 0.8, 1])).toBe(false)
    expect(isSliderRangeValue(['0.2', 0.8])).toBe(false)
  })

  it('clamps, snaps, and orders range endpoints', () => {
    expect(normalizeSliderRangeValue([-0.2, 1.3])).toEqual([0, 1])
    expect(normalizeSliderRangeValue([0.83, 0.24])).toEqual([0.24, 0.83])
    expect(normalizeSliderRangeValue([0.83, 0.24], 0.1)).toEqual([0.2, 0.8])
    expect(normalizeSliderRangeValue([Number.NaN, 0.8])).toEqual([0, 0.8])
  })

  it('returns a fresh tuple without modifying the input', () => {
    const input: SliderRangeValue = [0.8, 0.2]
    const normalized = normalizeSliderValue(input)

    expect(normalized).toEqual([0.2, 0.8])
    expect(normalized).not.toBe(input)
    expect(input).toEqual([0.8, 0.2])
  })

  it('clones tuples while preserving scalar values', () => {
    const range: SliderRangeValue = [0.2, 0.8]
    const clonedRange = cloneSliderValue(range)

    expect(clonedRange).toEqual(range)
    expect(clonedRange).not.toBe(range)
    expect(cloneSliderValue(0.4)).toBe(0.4)
  })

  it('detects collapsed values only for range tuples', () => {
    expect(isSliderValueCollapsed(0.5)).toBe(false)
    expect(isSliderValueCollapsed([0.5, 0.5])).toBe(true)
    expect(isSliderValueCollapsed([0.5, 0.5000000000005])).toBe(true)
    expect(isSliderValueCollapsed([0.5, 0.500001])).toBe(false)
  })
})

describe('range value comparison and thumb access', () => {
  it('compares scalar values and range values structurally', () => {
    expect(areSliderValuesEqual(0.4, 0.4)).toBe(true)
    expect(areSliderValuesEqual(0.4, 0.5)).toBe(false)
    expect(areSliderValuesEqual([0.2, 0.8], [0.2, 0.8])).toBe(true)
    expect(areSliderValuesEqual([0.2, 0.8], [0.2, 0.9])).toBe(false)
    expect(areSliderValuesEqual(0.2, [0.2, 0.8])).toBe(false)
  })

  it('reads the requested endpoint while scalar mode ignores the index', () => {
    expect(getSliderThumbValue([0.2, 0.8], 0)).toBe(0.2)
    expect(getSliderThumbValue([0.2, 0.8], 1)).toBe(0.8)
    expect(getSliderThumbValue(0.4, 0)).toBe(0.4)
    expect(getSliderThumbValue(0.4, 1)).toBe(0.4)
  })

  it('selects the initial thumb from either value shape', () => {
    expect(getInitialSliderThumbIndex(0.4, null)).toBe(0)
    expect(getInitialSliderThumbIndex(0.4, 1)).toBe(0)
    expect(getInitialSliderThumbIndex([0.2, 0.8], null)).toBeNull()
    expect(getInitialSliderThumbIndex([0.2, 0.8], 1)).toBe(1)
  })
})

describe('closest range thumb selection', () => {
  it('always selects the only scalar thumb', () => {
    expect(getClosestSliderThumbIndex(0.2, 0.8, 1)).toBe(0)
  })

  it('selects the endpoint nearest to the target', () => {
    expect(getClosestSliderThumbIndex([0.2, 0.8], 0.25)).toBe(0)
    expect(getClosestSliderThumbIndex([0.2, 0.8], 0.75)).toBe(1)
  })

  it('uses the preferred index for an exact tie', () => {
    expect(getClosestSliderThumbIndex([0.2, 0.8], 0.5)).toBe(0)
    expect(getClosestSliderThumbIndex([0.2, 0.8], 0.5, 1)).toBe(1)
  })

  it('uses direction around a collapsed range before the preferred index', () => {
    expect(getClosestSliderThumbIndex([0.5, 0.5], 0.4, 1)).toBe(0)
    expect(getClosestSliderThumbIndex([0.5, 0.5], 0.6, 0)).toBe(1)
    expect(getClosestSliderThumbIndex([0.5, 0.5], 0.5)).toBe(0)
    expect(getClosestSliderThumbIndex([0.5, 0.5], 0.5, 1)).toBe(1)
  })

  it('normalizes reversed ranges before selecting a thumb', () => {
    expect(getClosestSliderThumbIndex([0.8, 0.2], 0.7)).toBe(1)
  })
})

describe('dragged range thumb selection', () => {
  it('always keeps the only scalar thumb active', () => {
    expect(getDraggedSliderThumbIndex(0.2, 0.8, 1, 1, true)).toBe(0)
  })

  it('keeps an active thumb while the range is expanded', () => {
    expect(getDraggedSliderThumbIndex([0.2, 0.8], 0.3, 1)).toBe(1)
    expect(getDraggedSliderThumbIndex([0.2, 0.8], 0.7, 0)).toBe(0)
  })

  it('uses drag direction to reopen a collapsed range', () => {
    expect(getDraggedSliderThumbIndex([0.5, 0.5], 0.4, 1, 1, true)).toBe(0)
    expect(getDraggedSliderThumbIndex([0.5, 0.5], 0.6, 0, 0, true)).toBe(1)
    expect(
      getDraggedSliderThumbIndex(
        [0.5, 0.5000000000005],
        0.4,
        1,
        1,
        true,
      ),
    ).toBe(0)
  })

  it('does not switch thumbs when an expanded drag collapses the range', () => {
    expect(getDraggedSliderThumbIndex([0.5, 0.5], 0.7, 0, 0)).toBe(0)
    expect(getDraggedSliderThumbIndex([0.5, 0.5], 0.3, 1, 1)).toBe(1)
  })

  it('keeps the active thumb at the exact collapsed value', () => {
    expect(getDraggedSliderThumbIndex([0.5, 0.5], 0.5, 1)).toBe(1)
    expect(
      getDraggedSliderThumbIndex(
        [0.5, 0.5000000000005],
        0.5000000000004,
        1,
      ),
    ).toBe(1)
  })
})

describe('slider value updates', () => {
  it('updates and normalizes a scalar value', () => {
    expect(updateSliderValue(0.2, 0, 0.63, 0.1)).toBe(0.6)
    expect(updateSliderValue(0.2, 0, 2)).toBe(1)
  })

  it('updates either endpoint without mutating the input', () => {
    const input: SliderRangeValue = [0.2, 0.8]

    expect(updateSliderValue(input, 0, 0.3)).toEqual([0.3, 0.8])
    expect(updateSliderValue(input, 1, 0.7)).toEqual([0.2, 0.7])
    expect(input).toEqual([0.2, 0.8])
  })

  it('prevents thumbs from crossing while allowing them to meet', () => {
    expect(updateSliderValue([0.2, 0.8], 0, 0.9)).toEqual([0.8, 0.8])
    expect(updateSliderValue([0.2, 0.8], 1, 0.1)).toEqual([0.2, 0.2])
    expect(updateSliderValue([0.2, 0.8], 0, 0.8)).toEqual([0.8, 0.8])
    expect(updateSliderValue([0.2, 0.8], 1, 0.2)).toEqual([0.2, 0.2])
  })

  it('clamps and snaps the updated endpoint', () => {
    expect(updateSliderValue([0.2, 0.8], 0, -1, 0.1)).toEqual([0, 0.8])
    expect(updateSliderValue([0.2, 0.8], 1, 2, 0.1)).toEqual([0.2, 1])
    expect(updateSliderValue([0.2, 0.8], 0, 0.26, 0.1)).toEqual([
      0.3,
      0.8,
    ])
  })

  it('normalizes a reversed input before applying the update', () => {
    expect(updateSliderValue([0.8, 0.2], 0, 0.3)).toEqual([0.3, 0.8])
  })
})

describe('slider drag resolution', () => {
  it('does not swap or push thumbs when they collide', () => {
    expect(
      resolveSliderDrag([0.2, 0.8], 0.9, { activeThumbIndex: 0 }),
    ).toMatchObject({
      value: [0.8, 0.8],
      activeThumbIndex: 0,
    })
    expect(
      resolveSliderDrag([0.2, 0.8], 0.1, { activeThumbIndex: 1 }),
    ).toMatchObject({
      value: [0.2, 0.2],
      activeThumbIndex: 1,
    })
  })

  it('resolves scalar and range values through the same contract', () => {
    expect(resolveSliderDrag(0.2, 0.63, { step: 0.1 })).toEqual({
      value: 0.6,
      dragStartValue: 0.63,
      activeThumbIndex: 0,
      startedCollapsed: false,
    })
    expect(resolveSliderDrag([0.2, 0.8], 0.7)).toEqual({
      value: [0.2, 0.7],
      dragStartValue: [0.2, 0.7],
      activeThumbIndex: 1,
      startedCollapsed: false,
    })
  })

  it('tracks whether an initially collapsed range can still change direction', () => {
    expect(
      resolveSliderDrag([0.5, 0.5], 0.5, { startedCollapsed: true }),
    ).toEqual({
      value: [0.5, 0.5],
      dragStartValue: [0.5, 0.5],
      activeThumbIndex: 0,
      startedCollapsed: true,
    })
    expect(
      resolveSliderDrag([0.5, 0.5], 0.7, { startedCollapsed: true }),
    ).toEqual({
      value: [0.5, 0.7],
      dragStartValue: [0.5, 0.7],
      activeThumbIndex: 1,
      startedCollapsed: false,
    })
  })
})

describe('indicator geometry', () => {
  it('starts scalar indicators at zero', () => {
    expect(getSliderIndicatorGeometry(0.4)).toEqual({ offset: 0, size: 0.4 })
    expect(getSliderIndicatorGeometry(2)).toEqual({ offset: 0, size: 1 })
  })

  it('uses the lower endpoint and range span', () => {
    expect(getSliderIndicatorGeometry([0.2, 0.8])).toEqual({
      offset: 0.2,
      size: 0.6,
    })
    expect(getSliderIndicatorGeometry([0.8, 0.2])).toEqual({
      offset: 0.2,
      size: 0.6,
    })
    expect(getSliderIndicatorGeometry([0.5, 0.5])).toEqual({
      offset: 0.5,
      size: 0,
    })
    expect(getSliderIndicatorGeometry([-1, 2])).toEqual({
      offset: 0,
      size: 1,
    })
  })
})
