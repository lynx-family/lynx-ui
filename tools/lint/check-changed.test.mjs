// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const command = fileURLToPath(new URL('./check-changed.mjs', import.meta.url))

for (
  const [prefix, directory] of [
    ['packages/foo', '.'],
    ['packages/foo/', '.'],
    ['packages/foo', 'tools/lint'],
  ]
) {
  test(`from ${directory}, ignore ${prefix} without skipping sibling files`, t => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'lint-changed-'))
    t.after(() => rmSync(cwd, { recursive: true, force: true }))
    mkdirSync(path.join(cwd, directory), { recursive: true })
    const write = (file, content) => {
      const target = path.join(cwd, file)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, content)
    }
    const code = [
      'packages/foo/index.ts',
      'packages/foo.ts',
      'packages/foobar/index.ts',
      'packages/foobar/space name.ts',
      'exact.ts',
    ]
    const json = ['packages/foo/config.json', 'packages/foobar/config.json']
    for (const file of [...code, ...json]) write(file, '\n')
    write('cspell.jsonc', '{"version":"0.2"}\n')
    const git = args => execFileSync('git', args, { cwd, stdio: 'pipe' })
    git(['init', '-q', '-b', 'main'])
    git(['add', '.'])
    git([
      '-c',
      'user.name=Lint Test',
      '-c',
      'user.email=lint-test@example.com',
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '-qm',
      'fixture',
    ])
    for (const file of code) write(file, 'export const value = 1\n')
    for (const file of json) write(file, '{"value":1,"value":2}\n')
    write('packages/foobar/untracked.ts', 'export const value = 2\n')

    // Record selected files without running formatters that would modify them.
    const calls = path.join(cwd, 'calls.jsonl')
    const pnpm = path.join(cwd, 'bin/pnpm')
    write(
      'bin/pnpm',
      '#!/usr/bin/env node\n'
        + 'require("node:fs").appendFileSync(process.env.LINT_TEST_CALLS, '
        + 'JSON.stringify(process.argv.slice(2)) + "\\n")\n',
    )
    chmodSync(pnpm, 0o755)
    const result = spawnSync(process.execPath, [
      command,
      '--check',
      '--base',
      'main',
      '--include-untracked',
      '--ignore-prefix',
      prefix,
      '--ignore-prefix',
      'exact.ts',
      '--ignore-prefix',
      'bin/',
    ], {
      cwd: path.join(cwd, directory),
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${path.dirname(pnpm)}${path.delimiter}${process.env.PATH}`,
        LINT_TEST_CALLS: calls,
      },
    })
    // The sibling JSON still reaches the real JSON linter and fails.
    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(result.stdout, /jsonc\/no-dupe-keys/)
    assert.match(result.stdout, /packages\/foobar\/config.json/)
    assert.doesNotMatch(result.stdout, /packages\/foo\/config.json/)
    const invocations = readFileSync(calls, 'utf8').trim().split('\n').map(
      line => JSON.parse(line),
    )
    const selectedCode = [
      'packages/foo.ts',
      'packages/foobar/index.ts',
      'packages/foobar/space name.ts',
      'packages/foobar/untracked.ts',
    ]
    assert.deepEqual(invocations[0], [
      'exec',
      'rslint',
      '-c',
      'rslint.config.mjs',
      ...selectedCode,
    ])
    assert.deepEqual(invocations[1], [
      'exec',
      'dprint',
      'check',
      '--allow-no-files',
      '--',
      ...selectedCode.slice(0, 1),
      'packages/foobar/config.json',
      ...selectedCode.slice(1),
    ])
    assert.equal(
      readFileSync(path.join(cwd, 'packages/foobar/config.json'), 'utf8'),
      '{"value":1,"value":2}\n',
    )
  })
}

test('package commands check without writing and retain explicit fix mode', t => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'lint-commands-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const scripts = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  ).scripts
  const original = 'export const value=1\n'
  const target = path.join(cwd, 'value.ts')
  writeFileSync(target, original)
  const git = args => execFileSync('git', args, { cwd, stdio: 'pipe' })
  git(['init', '-q', '-b', 'main'])
  git(['add', '.'])
  git([
    '-c',
    'user.name=Lint Test',
    '-c',
    'user.email=lint-test@example.com',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '-qm',
    'fixture',
  ])
  writeFileSync(target, original + '\n')
  mkdirSync(path.join(cwd, 'tools/checkChanged'), { recursive: true })
  symlinkSync(
    fileURLToPath(new URL('.', import.meta.url)),
    path.join(cwd, 'tools/lint'),
    'dir',
  )
  writeFileSync(
    path.join(cwd, 'tools/checkChanged/checkChanged.sh'),
    readFileSync(new URL('../checkChanged/checkChanged.sh', import.meta.url)),
  )
  mkdirSync(path.join(cwd, 'bin'))
  const pnpm = path.join(cwd, 'bin/pnpm')
  // Simulate tools with pending fixes: check fails; fix mode writes the target.
  writeFileSync(
    pnpm,
    '#!/usr/bin/env node\n'
      + 'const args = process.argv.slice(2);\n'
      + 'if (args.includes("--fix") || args.includes("fmt")) {\n'
      + 'require("node:fs").writeFileSync(process.env.LINT_TEST_TARGET, "fixed\\n");\n'
      + '} else { process.exitCode = 1; }\n',
  )
  chmodSync(pnpm, 0o755)
  const run = name =>
    spawnSync('bash', ['-c', scripts[name]], {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${path.dirname(pnpm)}${path.delimiter}${process.env.PATH}`,
        LINT_TEST_TARGET: target,
      },
    })
  const check = run('check:changed')
  assert.equal(check.status, 1, check.stderr || check.stdout)
  assert.equal(readFileSync(target, 'utf8'), original + '\n')
  const fix = run('fix:changed')
  assert.equal(fix.status, 0, fix.stderr || fix.stdout)
  assert.equal(readFileSync(target, 'utf8'), 'fixed\n')
})
