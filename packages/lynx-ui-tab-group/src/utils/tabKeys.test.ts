// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import { findUniqueTabIndex, getUniqueTabKey } from './tabKeys'

describe('tab keys', () => {
  it('resolves keys and indexes from the current order', () => {
    const initialKeys = ['home', 'discover', 'profile']
    const reorderedKeys = ['profile', 'home', 'discover']

    expect(findUniqueTabIndex(initialKeys, 'profile')).toBe(2)
    expect(getUniqueTabKey(initialKeys, 2)).toBe('profile')
    expect(findUniqueTabIndex(reorderedKeys, 'profile')).toBe(0)
    expect(getUniqueTabKey(reorderedKeys, 0)).toBe('profile')
  })

  it('does not resolve removed, missing, or duplicate keys', () => {
    expect(findUniqueTabIndex(['discover', 'profile'], 'home')).toBeUndefined()
    expect(getUniqueTabKey(['discover', 'profile'], 2)).toBeUndefined()
    expect(findUniqueTabIndex(['home', 'home'], 'home')).toBeUndefined()
    expect(getUniqueTabKey(['home', 'home'], 1)).toBeUndefined()
  })
})
