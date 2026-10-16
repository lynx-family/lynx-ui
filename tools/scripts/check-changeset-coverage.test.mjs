// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { checkCoverage, getLastRelease } from './check-changeset-coverage.mjs'

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'release-coverage-'))
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }))
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true })
    fs.writeFileSync(path.join(cwd, file), text)
  }
  const commit = () => {
    git('add', '.')
    git('-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture')
    return git('rev-parse', 'HEAD')
  }
  const pkg = (directory, name, extra = {}) => {
    write(
      `${directory}/package.json`,
      JSON.stringify({ name, version: '1.0.0', ...extra }),
    )
    write(`${directory}/src/index.ts`, 'export const value = 1\n')
  }
  const bump = directory => {
    const file = `${directory}/package.json`
    const manifest = JSON.parse(fs.readFileSync(path.join(cwd, file), 'utf8'))
    write(file, JSON.stringify({ ...manifest, version: '1.0.1' }))
  }
  const check = (ref, releaseRef) =>
    checkCoverage({ cwd, ref, releaseRef }).missing.map(entry => entry.name)
  git('init', '-q')
  git('config', 'user.name', 'Test')
  git('config', 'user.email', 'test@example.com')
  git('config', 'tag.gpgSign', 'false')
  pkg('packages/button', '@test/button')
  pkg('apps/examples/Button', '@test/example')
  pkg('luna/packages/tokens', '@test/tokens')
  pkg('packages/private', '@test/private', { private: true })
  commit()
  git('tag', '@lynx-js/lynx-ui@1.0.0')
  return { cwd, git, write, commit, pkg, bump, check }
}

test('checks each package since the release including examples and LUNA', t => {
  const f = fixture(t)
  for (
    const directory of [
      'packages/button',
      'apps/examples/Button',
      'luna/packages/tokens',
    ]
  ) {
    f.write(`${directory}/src/index.ts`, 'export const value = 2\n')
  }
  const source = f.commit()
  f.bump('packages/button')
  const release = f.commit()
  assert.deepEqual(f.check(source, release), ['@test/example', '@test/tokens'])
  f.bump('apps/examples/Button')
  f.bump('luna/packages/tokens')
  assert.deepEqual(f.check(source, f.commit()), [])
})

test('ignores changes before the latest release even without individual package tags', t => {
  const f = fixture(t)
  f.write('packages/button/src/index.ts', 'export const value = 2\n')
  const source = f.commit()
  f.git('tag', '@lynx-example/lynx-ui-input@0.0.2')
  assert.deepEqual(f.check(source, source), [])
  assert.equal(
    getLastRelease(f.cwd, source),
    '@lynx-example/lynx-ui-input@0.0.2',
  )
})

test('one bump covers multiple commits in a stack and consumed changesets', t => {
  const f = fixture(t)
  f.write('packages/button/src/index.ts', 'export const value = 2\n')
  f.write(
    '.changeset/feature.md',
    '---\n"@test/button": patch\n---\n\nFeature\n',
  )
  f.commit()
  f.write('packages/button/src/index.ts', 'export const value = 3\n')
  const source = f.commit()
  fs.unlinkSync(path.join(f.cwd, '.changeset/feature.md'))
  f.bump('packages/button')
  assert.deepEqual(f.check(source, f.commit()), [])
})

test('ignores comments, formatting, docs, tests, private packages and infrastructure', t => {
  const f = fixture(t)
  for (
    const file of [
      'packages/button/README.md',
      'packages/button/docs/APIReference.mdx',
      'packages/button/src/index.test.ts',
      'packages/button/src/__tests__/case.ts',
      'packages/private/src/index.ts',
      '.github/workflows/test.yml',
    ]
  ) {
    f.write(file, 'changed\n')
  }
  f.write(
    'packages/button/src/index.ts',
    '// Lint comment\nexport const value=1;\n',
  )
  f.write(
    'packages/button/package.json',
    JSON.stringify({ version: '1.0.0', name: '@test/button' }, null, 2),
  )
  const source = f.commit()
  assert.deepEqual(f.check(source, source), [])
})

test('public type changes including docs source require a release', t => {
  const f = fixture(t)
  f.write(
    'packages/button/src/types/index.docs.ts',
    '/** Old */\nexport interface Props { value?: string }\n',
  )
  f.commit()
  f.git('tag', '@lynx-js/lynx-ui@1.0.1')
  f.write(
    'packages/button/src/types/index.docs.ts',
    '/** New */\nexport interface Props { value?: string }\n',
  )
  let source = f.commit()
  assert.deepEqual(f.check(source, source), [])
  f.write(
    'packages/button/src/types/index.docs.ts',
    '/** New */\nexport interface Props { value: string }\n',
  )
  source = f.commit()
  assert.deepEqual(f.check(source, source), ['@test/button'])
})

test('detects source deletions, manifest changes, and new packages', t => {
  const f = fixture(t)
  fs.unlinkSync(path.join(f.cwd, 'packages/button/src/index.ts'))
  f.pkg('apps/examples/Button', '@test/example', {
    dependencies: { other: '^2.0.0' },
  })
  f.pkg('packages/new', '@test/new')
  const source = f.commit()
  assert.deepEqual(f.check(source, source), [
    '@test/example',
    '@test/button',
    '@test/new',
  ])
})

test('deleted packages do not need publishing', t => {
  const f = fixture(t)
  fs.rmSync(path.join(f.cwd, 'packages/button'), { recursive: true })
  const source = f.commit()
  assert.deepEqual(f.check(source, source), [])
})

test('fails if release history is unavailable or the baseline is unrelated', t => {
  const f = fixture(t)
  const source = f.git('rev-parse', 'HEAD')
  f.git('tag', '-d', '@lynx-js/lynx-ui@1.0.0')
  assert.throws(() => f.check(source, source))
  f.write('packages/button/src/index.ts', 'export const value = 2\n')
  const future = f.commit()
  assert.throws(() =>
    checkCoverage({
      cwd: f.cwd,
      ref: source,
      releaseRef: source,
      since: future,
    })
  )
})
