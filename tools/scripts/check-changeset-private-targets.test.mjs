// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  checkChangesets,
  getChangesetPackageNames,
  getPrivateWorkspacePackageNames,
} from './check-changeset-private-targets.mjs'

test('getChangesetPackageNames parses quoted targets', () => {
  const text = `---
"@lynx-js/lynx-ui": patch
'@lynx-js/luna-stage': minor
---

body
`

  assert.deepEqual(getChangesetPackageNames(text), [
    '@lynx-js/lynx-ui',
    '@lynx-js/luna-stage',
  ])
})

test('getChangesetPackageNames rejects non-frontmatter files', () => {
  assert.throws(
    () => getChangesetPackageNames('no frontmatter\n'),
    /could not parse changeset - missing or invalid frontmatter/u,
  )
})

test('getPrivateWorkspacePackageNames collects private packages only', () => {
  const workspace = [
    { name: '@lynx-js/public', private: false, path: '/repo/packages/public' },
    { name: '@lynx-js/private', private: true, path: '/repo/packages/private' },
  ]

  assert.deepEqual(Array.from(getPrivateWorkspacePackageNames(workspace)), [
    '@lynx-js/private',
  ])
})

test('checkChangesets reports only private targets regardless of order', () => {
  const privatePackageNames = new Set(['@lynx-js/private'])
  const changesets = [
    {
      filePath: '.changeset/private-first.md',
      text: `---
"@lynx-js/private": patch
"@lynx-js/public": minor
---
`,
    },
    {
      filePath: '.changeset/public-first.md',
      text: `---
"@lynx-js/public": minor
"@lynx-js/private": patch
---
`,
    },
  ]

  assert.deepEqual(checkChangesets(privatePackageNames, changesets), [
    {
      filePath: '.changeset/private-first.md',
      privateTargets: ['@lynx-js/private'],
    },
    {
      filePath: '.changeset/public-first.md',
      privateTargets: ['@lynx-js/private'],
    },
  ])
})

test('checkChangesets reports every private target', () => {
  const privatePackageNames = new Set([
    '@lynx-js/private-a',
    '@lynx-js/private-b',
  ])
  const changesets = [
    {
      filePath: '.changeset/two-private-packages.md',
      text: `---
"@lynx-js/private-a": patch
"@lynx-js/public": minor
"@lynx-js/private-b": major
---
`,
    },
  ]

  assert.deepEqual(checkChangesets(privatePackageNames, changesets), [
    {
      filePath: '.changeset/two-private-packages.md',
      privateTargets: ['@lynx-js/private-a', '@lynx-js/private-b'],
    },
  ])
})

test('checkChangesets reports private targets from YAML flow mappings', () => {
  const privatePackageNames = new Set(['@lynx-js/private'])
  const changesets = [
    {
      filePath: '.changeset/flow-mapping.md',
      text: `---
{ "@lynx-js/private": patch }
---
`,
    },
  ]

  assert.deepEqual(checkChangesets(privatePackageNames, changesets), [
    {
      filePath: '.changeset/flow-mapping.md',
      privateTargets: ['@lynx-js/private'],
    },
  ])
})

test('getPrivateWorkspacePackageNames rejects unnamed private packages', () => {
  assert.throws(
    () =>
      getPrivateWorkspacePackageNames([
        { private: true, path: '/repo/packages/private' },
      ]),
    {
      name: 'TypeError',
      message: 'Missing package name for workspace at /repo/packages/private',
    },
  )
})
