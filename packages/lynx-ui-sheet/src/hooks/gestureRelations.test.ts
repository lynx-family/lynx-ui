// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it } from 'vitest'

import {
  parseScrollInfoAtStart,
  reconcileSheetGestureRelations,
  setupSheetScrollGestureRelations,
} from './gestureRelations'

describe('setupSheetScrollGestureRelations', () => {
  function makeFakeGesture() {
    const waitFor: unknown[] = []
    const continueWith: unknown[] = []
    const simultaneousWith: unknown[] = []
    return {
      waitFor,
      simultaneousWith,
      externalSimultaneous(g: unknown) {
        simultaneousWith.push(g)
      },
      continueWith,
      externalWaitFor(g: unknown) {
        waitFor.push(g)
      },
      externalContinueWith(g: unknown) {
        continueWith.push(g)
      },
    }
  }

  it('observes both recognizers simultaneously', () => {
    const native = makeFakeGesture()
    const pan = { type: 'pan' }
    setupSheetScrollGestureRelations(native, pan)
    expect(native.waitFor).toEqual([])
    expect(native.continueWith).toEqual([])
    expect(native.simultaneousWith).toContain(pan)
  })

  it('each relation appears exactly once (idempotent)', () => {
    const native = makeFakeGesture()
    const pan = { type: 'pan' }
    setupSheetScrollGestureRelations(native, pan)
    setupSheetScrollGestureRelations(native, pan)
    setupSheetScrollGestureRelations(native, pan)
    expect(native.simultaneousWith.filter((g) => g === pan).length).toBe(1)
  })
  it('removes the content dependency when only the handle can drag', () => {
    const native = makeFakeGesture()
    setupSheetScrollGestureRelations(native, { id: 1 })
    setupSheetScrollGestureRelations(native)
    expect(native.waitFor).toEqual([])
    expect(native.continueWith).toEqual([])
    expect(native.simultaneousWith).toEqual([])
  })

  it('replaces external relations and deduplicates cloned recognizers', () => {
    const pan = {
      ...makeFakeGesture(),
      simultaneousWith: [] as unknown[],
      externalSimultaneous(g: unknown) {
        pan.simultaneousWith.push(g)
      },
    }
    reconcileSheetGestureRelations(pan, { waitFor: [{ id: 1 }, { id: 1 }] })
    expect(pan.waitFor).toHaveLength(1)
    reconcileSheetGestureRelations(pan, { simultaneousWith: [{ id: 2 }] })
    expect(pan.waitFor).toEqual([])
    expect(pan.simultaneousWith).toEqual([{ id: 2 }])
    reconcileSheetGestureRelations(pan)
    expect(pan.simultaneousWith).toEqual([])
  })
})

describe('parseScrollInfoAtStart', () => {
  it('vertical: atStart when scrollY <= 0', () => {
    expect(parseScrollInfoAtStart('bottom', { scrollY: 0 })).toBe(true)
    expect(parseScrollInfoAtStart('bottom', { scrollY: -5 })).toBe(true)
  })

  it('vertical: not atStart when scrollY > 0', () => {
    expect(parseScrollInfoAtStart('bottom', { scrollY: 50 })).toBe(false)
  })

  it('horizontal: atStart when scrollX <= 0', () => {
    expect(parseScrollInfoAtStart('left', { scrollX: 0 })).toBe(true)
  })

  it('horizontal: not atStart when scrollX > 0', () => {
    expect(parseScrollInfoAtStart('right', { scrollX: 30 })).toBe(false)
  })

  it('returns undefined when offset field absent', () => {
    expect(parseScrollInfoAtStart('bottom', {})).toBeUndefined()
    expect(parseScrollInfoAtStart('bottom', { scrollX: 0 })).toBeUndefined()
  })
})
