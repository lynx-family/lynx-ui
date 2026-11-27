// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread } from '@lynx-js/react'

import { renderHook } from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it } from 'vitest'

import { calculateIndicatorPosition } from './tabsIndicatorGeometry'

beforeEach(() => {
  renderHook(() => null)
})

describe('calculateIndicatorPosition', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'returns undefined for a non-finite offset: %s',
    async offset => {
      await expect(
        runOnMainThread(calculateIndicatorPosition)(offset, ['first'], {
          first: 100,
        }),
      ).resolves.toBeUndefined()
    },
  )
})
