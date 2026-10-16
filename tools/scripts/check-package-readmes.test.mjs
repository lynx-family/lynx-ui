// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { inspectPackageReadmes } from './check-package-readmes.mjs'

function createPackagesRoot(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'lynx-ui-package-readmes-'))
  t.after(() => rmSync(root, { force: true, recursive: true }))
  return root
}

function createPackage(root, name, { readme = true } = {}) {
  const packageDirectory = path.join(root, name)
  mkdirSync(packageDirectory)
  writeFileSync(
    path.join(packageDirectory, 'package.json'),
    JSON.stringify({ name }),
  )

  if (readme) {
    writeFileSync(path.join(packageDirectory, 'README_zh.md'), '# Package\n')
  }
}

test('accepts packages with Chinese READMEs', (t) => {
  const root = createPackagesRoot(t)
  createPackage(root, 'package-b')
  createPackage(root, 'package-a')

  assert.deepEqual(inspectPackageReadmes(root), {
    packageDirectories: ['package-a', 'package-b'],
    missingReadmes: [],
  })
})

test('reports every package missing a Chinese README', (t) => {
  const root = createPackagesRoot(t)
  createPackage(root, 'package-b', { readme: false })
  createPackage(root, 'package-a')
  createPackage(root, 'package-c', { readme: false })

  assert.deepEqual(inspectPackageReadmes(root), {
    packageDirectories: ['package-a', 'package-b', 'package-c'],
    missingReadmes: ['package-b', 'package-c'],
  })
})

test('ignores directories without a package manifest', (t) => {
  const root = createPackagesRoot(t)
  createPackage(root, 'package-a')
  mkdirSync(path.join(root, 'shared-assets'))
  writeFileSync(path.join(root, 'notes.txt'), 'not a package\n')

  assert.deepEqual(inspectPackageReadmes(root), {
    packageDirectories: ['package-a'],
    missingReadmes: [],
  })
})
