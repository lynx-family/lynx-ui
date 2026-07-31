// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import { getStageWorldState } from './world'

describe('getStageWorldState', () => {
  it('keeps the centered focus stage aligned without focused index skew', () => {
    const state = getStageWorldState({
      mode: 'focus',
      compOrder: 1,
      mid: 1,
      focusedIndex: 4,
      escape: false,
    })

    expect(state.world.x).toBeCloseTo(0)
    expect(state.world.z).toBeCloseTo(-600)
    expect(state.maskOpacity).toBe(0.5)
  })

  it('clamps focus mask opacity to the animation-safe range', () => {
    const state = getStageWorldState({
      mode: 'focus',
      compOrder: 20,
      mid: 0,
      focusedIndex: 20,
      escape: false,
    })

    expect(state.maskOpacity).toBeGreaterThanOrEqual(0)
    expect(state.maskOpacity).toBeLessThanOrEqual(1)
  })
})
