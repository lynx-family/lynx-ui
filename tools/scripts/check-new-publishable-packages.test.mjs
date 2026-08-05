// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  getNewPublishablePackages,
  parsePublishedVersions,
} from './check-new-publishable-packages.mjs'

describe('getNewPublishablePackages', () => {
  it('ignores a package moved without changing its name', () => {
    const currentPackages = [
      { name: '@lynx-js/example', path: 'new/example' },
    ]
    const basePackageNames = new Set(['@lynx-js/example'])

    assert.deepEqual(
      getNewPublishablePackages(currentPackages, basePackageNames),
      [],
    )
  })

  it('detects a package that changes from private to public', () => {
    const currentPackages = [
      { name: '@lynx-js/example', path: 'packages/example' },
    ]

    assert.deepEqual(
      getNewPublishablePackages(currentPackages, new Set()),
      currentPackages,
    )
  })

  it('detects a package name or scope change', () => {
    const currentPackages = [{ name: 'example', path: 'packages/example' }]
    const basePackageNames = new Set(['@lynx-js/example'])

    assert.deepEqual(
      getNewPublishablePackages(currentPackages, basePackageNames),
      currentPackages,
    )
  })
})

describe('parsePublishedVersions', () => {
  it('accepts multiple published versions', () => {
    assert.deepEqual(
      parsePublishedVersions('["0.0.0","1.0.0"]', '@lynx-js/example'),
      ['0.0.0', '1.0.0'],
    )
  })

  it('accepts a single version response', () => {
    assert.deepEqual(
      parsePublishedVersions('"0.0.0"', '@lynx-js/example'),
      ['0.0.0'],
    )
  })

  it('rejects an empty versions response', () => {
    assert.deepEqual(
      parsePublishedVersions('[]', '@lynx-js/example'),
      [],
    )
  })
})
