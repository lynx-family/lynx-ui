// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import { getStageWorldState, isForegroundStage } from './world'

describe('getStageWorldState', () => {
  it('keeps the centered focus stage aligned without focused index skew', () => {
    const state = getStageWorldState({
      mode: 'focus',
      backgroundIndex: 1,
      backgroundMidpoint: 1,
      activeFocusIndex: 4,
      escape: false,
    })

    expect(state.world.x).toBeCloseTo(0)
    expect(state.world.z).toBeCloseTo(-600)
    expect(state.maskOpacity).toBe(0.5)
  })

  it('keeps escaped foreground stages centered, elevated, and unmasked', () => {
    const state = getStageWorldState({
      mode: 'focus',
      backgroundIndex: -1,
      backgroundMidpoint: 1,
      activeFocusIndex: 2,
      escape: true,
    })

    expect(state.world).toEqual({ x: 0, y: 0, z: 0 })
    expect(state.zIndex).toBe(100)
    expect(state.maskOpacity).toBe(0)
  })

  it('clamps focus mask opacity to the animation-safe range', () => {
    const state = getStageWorldState({
      mode: 'focus',
      backgroundIndex: 20,
      backgroundMidpoint: 0,
      activeFocusIndex: 20,
      escape: false,
    })

    expect(state.maskOpacity).toBeGreaterThanOrEqual(0)
    expect(state.maskOpacity).toBeLessThanOrEqual(1)
  })
})

describe('isForegroundStage', () => {
  it('keeps non-focusable and active stages in the foreground', () => {
    expect(isForegroundStage(undefined, 'button')).toBe(true)
    expect(isForegroundStage('button', 'button')).toBe(true)
    expect(isForegroundStage('checkbox', 'button')).toBe(false)
  })
})
