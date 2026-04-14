// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { afterEach, describe, expect, it } from 'vitest'

import { buildCanaryPackageName, buildVersion } from './snapshot.js'

describe('buildCanaryPackageName', () => {
  it('appends the canary suffix', () => {
    expect(buildCanaryPackageName('@lynx-js/lynx-ui-button')).toBe(
      '@lynx-js/lynx-ui-button-canary',
    )
  })
})

describe('buildVersion', () => {
  afterEach(() => {
    delete process.env.FORCE_SNAPSHOT
  })

  it('stabilizes snapshot timestamps with the commit identifier', () => {
    expect(buildVersion('3.130.0-canary-20260414010101', 'abc1234')).toBe(
      '3.130.0-canary-abc1234',
    )
  })

  it('preserves regular versions unless forced', () => {
    expect(buildVersion('3.130.0', 'abc1234')).toBe('3.130.0')
  })

  it('forces a commit-scoped prerelease when no snapshot version exists', () => {
    process.env.FORCE_SNAPSHOT = '1'

    expect(buildVersion('3.130.0', 'abc1234')).toBe('3.130.0-abc1234')
  })
})
