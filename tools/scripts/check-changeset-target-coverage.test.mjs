// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
  checkChangesetTargetCoverage,
  getWorkspacePackageMap,
} from './check-changeset-target-coverage.mjs'

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'changeset-target-'))
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }))
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  const write = (file, text) => {
    const filePath = path.join(cwd, file)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, text)
  }
  const addPackage = (directory, name) => {
    write(
      `${directory}/package.json`,
      JSON.stringify({ name, version: '1.0.0' }),
    )
    write(`${directory}/src/index.ts`, 'export const value = 1\n')
  }
  const commit = () => {
    git('add', '.')
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture')
    return git('rev-parse', 'HEAD')
  }

  git('init', '-q')
  git('config', 'user.name', 'Test')
  git('config', 'user.email', 'test@example.com')
  git('config', 'core.autocrlf', 'false')
  addPackage('packages/common', '@lynx-js/lynx-ui-common')
  addPackage('packages/slider', '@lynx-js/lynx-ui-slider')
  addPackage('apps/examples/Common', '@lynx-example/lynx-ui-common')
  const base = commit()
  const workspacePackages = getWorkspacePackageMap(
    [
      {
        name: '@lynx-js/lynx-ui-common',
        path: path.join(cwd, 'packages/common'),
      },
      {
        name: '@lynx-js/lynx-ui-slider',
        path: path.join(cwd, 'packages/slider'),
      },
      {
        name: '@lynx-example/lynx-ui-common',
        path: path.join(cwd, 'apps/examples/Common'),
      },
    ],
    cwd,
  )

  return { cwd, base, commit, git, write, workspacePackages }
}

function check(f, head, options = {}) {
  return checkChangesetTargetCoverage({
    cwd: f.cwd,
    base: f.base,
    head,
    workspacePackages: f.workspacePackages,
    ...options,
  })
}

test('rejects a changeset whose package target was not changed by the PR', t => {
  const f = fixture(t)
  f.write('packages/common/src/index.ts', 'export const value = 2\n')
  f.write('packages/slider/src/index.ts', 'export const value = 2\n')
  f.write(
    '.changeset/wrong-scope.md',
    `---\n"@lynx-example/lynx-ui-common": patch\n---\n\nFix the release note.\n`,
  )
  const result = check(f, f.commit())

  assert.deepEqual(result.failures, [
    {
      file: '.changeset/wrong-scope.md',
      packageName: '@lynx-example/lynx-ui-common',
      expectedDirectory: 'apps/examples/Common',
      reason: 'target has no relevant package-local change in this PR',
    },
  ])
  assert.deepEqual(
    result.changedPackages.map(pkg => pkg.name),
    ['@lynx-js/lynx-ui-common', '@lynx-js/lynx-ui-slider'],
  )
})

test('accepts explicit targets for any of several changed packages', t => {
  const f = fixture(t)
  f.write('packages/common/src/index.ts', 'export const value = 2\n')
  f.write('packages/slider/src/index.ts', 'export const value = 2\n')
  f.write(
    '.changeset/two-packages.md',
    `---\n"@lynx-js/lynx-ui-common": patch\n"@lynx-js/lynx-ui-slider": minor\n---\n\nUpdate two components.\n`,
  )

  const result = check(f, f.commit())

  assert.deepEqual(result.failures, [])
})

test('keeps empty changesets valid', t => {
  const f = fixture(t)
  f.write(
    '.changeset/empty.md',
    `---\n---\n\nThis change does not publish a package.\n`,
  )

  const result = check(f, f.commit())

  assert.deepEqual(result.failures, [])
  assert.deepEqual(result.changedPackages, [])
})

test('allows an explicitly requested, referenced changeset-only backfill', t => {
  const f = fixture(t)
  f.write(
    '.changeset/backfill.md',
    `---\n"@lynx-js/lynx-ui-common": patch\n---\n\nBackfill a missed release note.\n`,
  )
  const head = f.commit()

  const accepted = check(f, head, {
    backfillLabel: true,
    pullRequestBody: 'Backfill for #195.',
  })
  const missingLabel = check(f, head, {
    pullRequestBody: 'Backfill for #195.',
  })
  const bodyMarker = check(f, head, {
    pullRequestBody: 'Changeset-Backfill: true\nBackfill for #195.',
  })
  const missingReference = check(f, head, { backfillLabel: true })

  assert.equal(accepted.backfillAllowed, true)
  assert.deepEqual(accepted.failures, [])
  assert.equal(bodyMarker.backfillAllowed, true)
  assert.deepEqual(bodyMarker.failures, [])
  assert.equal(missingLabel.backfillAllowed, false)
  assert.equal(missingLabel.failures.length, 1)
  assert.equal(missingReference.backfillAllowed, false)
  assert.equal(missingReference.failures.length, 1)
})

test('accepts an original PR reference in the changeset summary', t => {
  const f = fixture(t)
  f.write(
    '.changeset/backfill.md',
    `---\n"@lynx-js/lynx-ui-common": patch\n---\n\nBackfill for #195.\n`,
  )

  const result = check(f, f.commit(), { backfillLabel: true })

  assert.equal(result.backfillUsed, true)
  assert.deepEqual(result.failures, [])
})

test('does not allow a backfill exception when the PR also changes code', t => {
  const f = fixture(t)
  f.write('packages/slider/src/index.ts', 'export const value = 2\n')
  f.write(
    '.changeset/backfill.md',
    `---\n"@lynx-js/lynx-ui-common": patch\n---\n\nBackfill for #195.\n`,
  )

  const result = check(f, f.commit(), {
    backfillLabel: true,
    pullRequestBody: 'Backfill for #195.',
  })

  assert.equal(result.backfillAllowed, false)
  assert.equal(result.failures.length, 1)
})

test('does not count documentation or test-only changes as package changes', t => {
  const f = fixture(t)
  f.write('packages/common/README.md', 'Documentation only.\n')
  f.write(
    'packages/common/src/__tests__/index.test.ts',
    'export const testOnly = true\n',
  )
  f.write(
    '.changeset/no-source-change.md',
    `---\n"@lynx-js/lynx-ui-common": patch\n---\n\nA release note.\n`,
  )

  const result = check(f, f.commit())

  assert.equal(result.changedPackages.length, 0)
  assert.equal(result.failures.length, 1)
})

test('reports targets that do not resolve to a current workspace package', t => {
  const f = fixture(t)
  f.write(
    '.changeset/unknown-target.md',
    `---\n"@lynx-js/lynx-ui-missing": patch\n---\n\nUnknown target.\n`,
  )

  const result = check(f, f.commit())

  assert.deepEqual(result.failures, [
    {
      file: '.changeset/unknown-target.md',
      packageName: '@lynx-js/lynx-ui-missing',
      expectedDirectory: null,
      reason: 'target is not a current workspace package',
    },
  ])
})
