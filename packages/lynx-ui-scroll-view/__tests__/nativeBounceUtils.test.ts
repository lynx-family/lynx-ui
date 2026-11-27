// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread } from '@lynx-js/react'

import { renderHook } from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it } from 'vitest'

import { getNativeBounceMetricsMT } from '../src/hooks/nativeBounceUtils'

beforeEach(() => {
  renderHook(() => null)
})

describe('native bounce metrics', () => {
  it('keeps the upper bounce distance while the native offset is negative', async () => {
    await expect(
      runOnMainThread(getNativeBounceMetricsMT)(-16.7, 1216, 640, true, true),
    ).resolves.toEqual({
      maxScrollOffset: 576,
      upperDistance: 16.7,
      lowerDistance: 0,
    })
  })

  it('keeps the lower bounce distance past the maximum scroll offset', async () => {
    await expect(
      runOnMainThread(getNativeBounceMetricsMT)(610, 1216, 640, true, true),
    ).resolves.toEqual({
      maxScrollOffset: 576,
      upperDistance: 0,
      lowerDistance: 34,
    })
  })

  it('returns no bounce distance inside the scrollable range', async () => {
    await expect(
      runOnMainThread(getNativeBounceMetricsMT)(240, 1216, 640, true, true),
    ).resolves.toEqual({
      maxScrollOffset: 576,
      upperDistance: 0,
      lowerDistance: 0,
    })
  })

  it('respects disabled bounce directions', async () => {
    await expect(
      runOnMainThread(getNativeBounceMetricsMT)(-20, 1216, 640, false, true),
    ).resolves.toEqual({
      maxScrollOffset: 576,
      upperDistance: 0,
      lowerDistance: 0,
    })
    await expect(
      runOnMainThread(getNativeBounceMetricsMT)(600, 1216, 640, true, false),
    ).resolves.toEqual({
      maxScrollOffset: 576,
      upperDistance: 0,
      lowerDistance: 0,
    })
  })
})
