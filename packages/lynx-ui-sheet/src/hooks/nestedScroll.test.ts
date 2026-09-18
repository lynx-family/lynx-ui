// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import { resolveNestedScrollOwner } from './nestedScroll'

const base = {
  behavior: 'sheet-first' as const,
  position: 400,
  handoffPosition: 800,
  contentAtStart: true,
  contentAtEnd: false,
}

describe('resolveNestedScrollOwner', () => {
  it('expands the sheet to the handoff snap before scrolling content', () => {
    expect(resolveNestedScrollOwner({ ...base, delta: 20 })).toBe('sheet')
    expect(
      resolveNestedScrollOwner({
        ...base,
        delta: 20,
        position: 800,
      }),
    ).toBe('content')
  })

  it('lets content-first scroll before expanding the sheet', () => {
    expect(
      resolveNestedScrollOwner({
        ...base,
        behavior: 'content-first',
        delta: 20,
      }),
    ).toBe('content')
    expect(
      resolveNestedScrollOwner({
        ...base,
        behavior: 'content-first',
        contentAtEnd: true,
        delta: 20,
      }),
    ).toBe('sheet')
  })

  it('collapses only when nested content is at its start', () => {
    expect(resolveNestedScrollOwner({ ...base, delta: -20 })).toBe('sheet')
    expect(
      resolveNestedScrollOwner({
        ...base,
        contentAtStart: false,
        delta: -20,
      }),
    ).toBe('content')
  })

  it('can disable sheet handoff for an individual scroll container', () => {
    expect(
      resolveNestedScrollOwner({
        ...base,
        behavior: 'disabled',
        delta: -20,
      }),
    ).toBe('content')
  })
})
