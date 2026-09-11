// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import { calculateIndicatorPosition } from './tabsIndicatorGeometry'

describe('calculateIndicatorPosition', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'returns undefined for a non-finite offset: %s',
    offset => {
      expect(
        calculateIndicatorPosition(offset, ['first'], { first: 100 }),
      ).toBeUndefined()
    },
  )
})
