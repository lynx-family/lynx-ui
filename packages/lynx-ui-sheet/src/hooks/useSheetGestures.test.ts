// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { NativeGesture } from '@lynx-js/gesture-runtime'
import { describe, expect, it } from 'vitest'

import { getSheetScrollGesture } from './sheetScrollGesture'

describe('getSheetScrollGesture', () => {
  it('returns the exact gesture owned by SheetGestureContent', () => {
    const scrollGesture = { id: 1 } as NativeGesture
    expect(getSheetScrollGesture({ scrollGesture })).toBe(scrollGesture)
  })

  it('rejects use outside SheetGestureContent', () => {
    expect(() => getSheetScrollGesture({})).toThrow(
      'useSheetScrollGesture must be used inside SheetGestureContent',
    )
  })
})
