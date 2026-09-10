// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import { normalizeIndex } from '../src/utils'

describe('page selection bounds', () => {
  it.each([
    [-1, 3, 0],
    [100, 3, 2],
    [1.9, 3, 1],
    [Number.NaN, 3, 0],
    [Number.POSITIVE_INFINITY, 3, 0],
    [2, 0, 0],
  ])('normalizes %s for %s pages to %s', (index, count, expected) => {
    expect(normalizeIndex(index, count)).toBe(expected)
  })
})
