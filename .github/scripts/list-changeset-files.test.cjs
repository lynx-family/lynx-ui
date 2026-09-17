// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } = require(
  'node:fs',
)
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { describe, it } = require('node:test')

const { listChangesetFilesSince } = require('./list-changeset-files.cjs')

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function createRepository(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'lynx-ui-changeset-files-'))
  t.after(() => rmSync(cwd, { force: true, recursive: true }))

  git(cwd, 'init')
  git(cwd, 'config', 'user.email', 'test@example.com')
  git(cwd, 'config', 'user.name', 'Test User')
  writeFileSync(join(cwd, 'package.json'), '{}\n')
  git(cwd, 'add', 'package.json')
  git(cwd, 'commit', '-m', 'initial commit')

  return { baseRef: git(cwd, 'rev-parse', 'HEAD'), cwd }
}

function commitFile(cwd, file, content) {
  mkdirSync(join(cwd, file, '..'), { recursive: true })
  writeFileSync(join(cwd, file), content)
  git(cwd, 'add', file)
  git(cwd, 'commit', '-m', `update ${file}`)
}

describe('listChangesetFilesSince', () => {
  it('returns no files when a change has no changeset', (t) => {
    const { baseRef, cwd } = createRepository(t)
    commitFile(cwd, 'package.json', '{"changed":true}\n')

    assert.deepEqual(listChangesetFilesSince(baseRef, cwd), [])
  })

  it('lists an added empty changeset', (t) => {
    const { baseRef, cwd } = createRepository(t)
    commitFile(cwd, '.changeset/empty.md', '---\n---\n')

    assert.deepEqual(listChangesetFilesSince(baseRef, cwd), [
      '.changeset/empty.md',
    ])
  })

  it('lists a malformed changeset for later validation', (t) => {
    const { baseRef, cwd } = createRepository(t)
    commitFile(cwd, '.changeset/malformed.md', 'not valid frontmatter\n')

    assert.deepEqual(listChangesetFilesSince(baseRef, cwd), [
      '.changeset/malformed.md',
    ])
  })

  it('ignores deleted changesets and the changeset README', (t) => {
    const { cwd } = createRepository(t)
    commitFile(cwd, '.changeset/deleted.md', '---\n---\n')
    commitFile(cwd, '.changeset/README.md', 'before\n')
    const baseRef = git(cwd, 'rev-parse', 'HEAD')

    unlinkSync(join(cwd, '.changeset/deleted.md'))
    writeFileSync(join(cwd, '.changeset/README.md'), 'after\n')
    git(cwd, 'add', '.changeset')
    git(cwd, 'commit', '-m', 'remove changeset')

    assert.deepEqual(listChangesetFilesSince(baseRef, cwd), [])
  })

  it('propagates an invalid merge-base ref', (t) => {
    const { cwd } = createRepository(t)

    assert.throws(() => listChangesetFilesSince('invalid-base-ref', cwd))
  })
})
