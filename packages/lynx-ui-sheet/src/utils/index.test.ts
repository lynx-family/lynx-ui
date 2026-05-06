// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import {
  getDefaultClaimedGestureAngles,
  getDefaultRubberBand,
  getMainAxisLayoutSize,
  getMainAxisSize,
  getNextMainAxisOffset,
  getSheetTransform,
  resolveSheetSide,
  toPxJS,
} from './direction'

describe('sheet side utils', () => {
  it('resolves logical sides from enableRTL', () => {
    expect(resolveSheetSide('start', false)).toBe('left')
    expect(resolveSheetSide('end', false)).toBe('right')
    expect(resolveSheetSide('start', true)).toBe('right')
    expect(resolveSheetSide('end', true)).toBe('left')
    expect(resolveSheetSide('top', true)).toBe('top')
    expect(resolveSheetSide('bottom', true)).toBe('bottom')
    expect(resolveSheetSide('left', true)).toBe('left')
    expect(resolveSheetSide('right', true)).toBe('right')
  })

  it('resolves percent snap points against height for bottom sheets', () => {
    expect(toPxJS('50%', 800)).toBe(400)
  })

  it('resolves percent snap points against width for drawers', () => {
    expect(toPxJS('75%', 360)).toBe(270)
  })

  it('reads the correct viewport basis for each resolved side', () => {
    expect(
      getMainAxisSize('top', { screenHeight: 800, screenWidth: 360 }),
    ).toBe(800)
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

  it('reads fit layout from height for vertical sheets', () => {
    expect(
      getMainAxisLayoutSize('top', {
        detail: { height: 420, width: 260 },
      }),
    ).toBe(420)
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

  it('uses vertical gesture angles for vertical sheets', () => {
    expect(getDefaultClaimedGestureAngles('top')).toEqual([
      [-134, -46],
      [46, 134],
    ])
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

  it('enables rubber band by default only for vertical sheets', () => {
    expect(getDefaultRubberBand('top')).toBe(true)
    expect(getDefaultRubberBand('bottom')).toBe(true)
    expect(getDefaultRubberBand('left')).toBe(false)
    expect(getDefaultRubberBand('right')).toBe(false)
  })

  it('applies drag deltas with the correct sign', () => {
    expect(getNextMainAxisOffset('top', 120, 30)).toBe(150)
    expect(getNextMainAxisOffset('left', 120, 30)).toBe(150)
    expect(getNextMainAxisOffset('right', 120, 30)).toBe(90)
    expect(getNextMainAxisOffset('bottom', 120, 30)).toBe(90)
  })

  it('computes the expected transforms for each resolved side', () => {
    expect(getSheetTransform('top', 120, 360)).toBe(
      'translate(0px, 120px)',
    )
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
