// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import {
  getDefaultClaimedGestureAngles,
  getMainAxisLayoutSize,
  getMainAxisSize,
  getNextMainAxisOffset,
  getSheetTransform,
  toPxJS,
} from './direction'

describe('sheet direction utils', () => {
  it('resolves percent snap points against height for bottom sheets', () => {
    expect(toPxJS('50%', 800)).toBe(400)
  })

  it('resolves percent snap points against width for drawers', () => {
    expect(toPxJS('75%', 360)).toBe(270)
  })

  it('reads the correct viewport basis for each direction', () => {
    expect(
      getMainAxisSize('bottom', { screenHeight: 800, screenWidth: 360 }),
    ).toBe(800)
    expect(
      getMainAxisSize('left', { screenHeight: 800, screenWidth: 360 }),
    ).toBe(360)
    expect(
      getMainAxisSize('right', { screenHeight: 800, screenWidth: 360 }),
    ).toBe(360)
  })

  it('reads fit layout from height for bottom sheets', () => {
    expect(
      getMainAxisLayoutSize('bottom', {
        detail: { height: 420, width: 260 },
      }),
    ).toBe(420)
  })

  it('reads fit layout from width for drawers', () => {
    expect(
      getMainAxisLayoutSize('left', {
        detail: { height: 420, width: 260 },
      }),
    ).toBe(260)
  })

  it('uses vertical gesture angles for bottom sheets', () => {
    expect(getDefaultClaimedGestureAngles('bottom')).toEqual([
      [-134, -46],
      [46, 134],
    ])
  })

  it('uses horizontal gesture angles for drawers', () => {
    expect(getDefaultClaimedGestureAngles('right')).toEqual([
      [-45, 45],
      [135, -135],
    ])
  })

  it('applies drawer drag deltas with the correct sign', () => {
    expect(getNextMainAxisOffset('left', 120, 30)).toBe(150)
    expect(getNextMainAxisOffset('right', 120, 30)).toBe(90)
    expect(getNextMainAxisOffset('bottom', 120, 30)).toBe(90)
  })

  it('computes the expected transforms for each direction', () => {
    expect(getSheetTransform('bottom', 120, 360)).toBe(
      'translate(0px, -120px)',
    )
    expect(getSheetTransform('left', 120, 360)).toBe(
      'translate(-240px, 0px)',
    )
    expect(getSheetTransform('right', 120, 360)).toBe(
      'translate(240px, 0px)',
    )
  })
})
