// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import { resolveNestedScrollOwner } from './nestedScroll'

const base = {
  position: 400,
  maximumPosition: 800,
  contentAtStart: true,
}

describe('resolveNestedScrollOwner', () => {
  it('expands the Sheet fully before scrolling content', () => {
    expect(resolveNestedScrollOwner({ ...base, delta: 20 })).toBe('sheet')
    expect(
      resolveNestedScrollOwner({
        ...base,
        delta: 20,
        position: 800,
      }),
    ).toBe('content')
  })

  it('collapses only when content is known to be at its start', () => {
    expect(resolveNestedScrollOwner({ ...base, delta: -20 })).toBe('sheet')
    expect(
      resolveNestedScrollOwner({
        ...base,
        contentAtStart: false,
        delta: -20,
      }),
    ).toBe('content')
    expect(
      resolveNestedScrollOwner({
        ...base,
        contentAtStart: undefined,
        delta: -20,
      }),
    ).toBe('content')
  })

  it('keeps a known non-scrollable target with the Sheet', () => {
    expect(resolveNestedScrollOwner({
      ...base,
      position: 800,
      contentAtEnd: true,
      delta: 20,
    })).toBe('sheet')
    expect(resolveNestedScrollOwner({
      ...base,
      position: 800,
      contentAtEnd: false,
      delta: 20,
    })).toBe('content')
  })

  it.each([-20, 20])(
    'keeps an over-drag with Sheet while reversing: %s',
    delta => {
      expect(resolveNestedScrollOwner({
        ...base,
        position: 820,
        contentAtStart: false,
        delta,
      })).toBe('sheet')
    },
  )

  it('keeps stationary updates with content', () => {
    expect(resolveNestedScrollOwner({ ...base, delta: 0 })).toBe('content')
  })
})
