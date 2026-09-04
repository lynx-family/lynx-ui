// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import { createViewPagerId, resolveLazyOptions } from '../src/utils'

describe('ViewPager utilities', () => {
  it('creates a distinct fallback id for each instance', () => {
    expect(createViewPagerId()).not.toBe(createViewPagerId())
  })

  it('resolves partial lazy options per field', () => {
    expect(resolveLazyOptions({
      enableLazy: true,
      scene: 'feed',
      estimatedItemStyle: {},
    }, {})).toEqual({
      enableLazy: true,
      scene: 'feed',
      exposureLeft: '50px',
      exposureRight: '50px',
    })
  })

  it('uses deprecated props only when lazy options omit a field', () => {
    expect(resolveLazyOptions(undefined, {
      scene: 'legacy',
      exposureLeft: '20px',
      exposureRight: '30px',
    })).toEqual({
      enableLazy: true,
      scene: 'legacy',
      exposureLeft: '20px',
      exposureRight: '30px',
    })
  })

  it('keeps lazy rendering disabled', () => {
    expect(resolveLazyOptions({ enableLazy: false }, {})).toMatchObject({
      enableLazy: false,
    })
  })
})
