// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// cspell:ignore jsonline

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const rslint = require.resolve('@rslint/core/bin')
const factory = fileURLToPath(new URL('./config.mjs', import.meta.url))
const header = '// Copyright 2026 The Lynx Authors. All rights reserved.\n'
  + '// Licensed under the Apache License Version 2.0 that can be found in the\n'
  + '// LICENSE file in the root directory of this source tree.\n\n'

test('custom source, tooling and test scopes retain type-aware checks', t => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'lint-scopes-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const write = (file, content) => {
    const target = path.join(cwd, file)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  write('cspell.jsonc', '{"version":"0.2"}\n')
  write(
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'Bundler',
      },
      include: ['services/**/*.ts'],
      exclude: ['**/*.spec.ts'],
    }),
  )
  write(
    'tsconfig.lint.json',
    JSON.stringify({
      extends: './tsconfig.json',
      include: ['services/**/*.ts', 'automation/**/*.ts', 'checks/**/*.ts'],
      exclude: [],
    }),
  )
  const options = {
    project: './tsconfig.lint.json',
    sourceFiles: ['services/**/*.ts'],
    sourceIgnores: ['services/**/*.spec.ts'],
    toolingFiles: ['automation/**/*.ts'],
    toolingIgnores: ['automation/**/*.spec.ts'],
    testFiles: ['**/*.spec.ts', 'checks/**/*.ts'],
    ruleIgnores: [],
  }
  write(
    'rslint.config.mjs',
    `import { createLintConfig } from ${JSON.stringify(factory)};\n`
      + `export default createLintConfig({ ...${JSON.stringify(options)}, `
      + 'rootDir: import.meta.dirname });\n',
  )
  const probes = [
    [
      'services/unsafe.ts',
      'export const value: string = JSON.parse(\'null\')',
      1,
    ],
    ['services/valid.ts', 'export const value: string = \'value\'', 0],
    [
      'automation/unsafe.ts',
      'export const value: string = JSON.parse(\'null\')',
      1,
    ],
    ['automation/valid.ts', 'export const value: string = \'value\'', 0],
    [
      'services/ignored.spec.ts',
      'export const value: string = JSON.parse(\'null\')',
      0,
    ],
    [
      'automation/ignored.spec.ts',
      'export const value: string = JSON.parse(\'null\')',
      0,
    ],
  ]
  for (const [file, code] of probes) write(file, header + code + '\n')
  write(
    'checks/custom-case.ts',
    header
      + 'export function value(input: { name: string } | null) '
      + '{ return input && input.name }\n',
  )
  const result = spawnSync(process.execPath, [
    rslint,
    '-c',
    path.join(cwd, 'rslint.config.mjs'),
    '--format',
    'jsonline',
    ...probes.map(([file]) => path.join(cwd, file)),
    path.join(cwd, 'checks/custom-case.ts'),
  ], { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  assert.equal(result.status, 1, result.stderr || result.stdout)
  const diagnostics = result.stdout.split('\n').filter(line =>
    line.startsWith('{')
  ).map(line => JSON.parse(line))
  assert.equal(
    diagnostics.some(item => /Parsing error|Failed to/.test(item.message)),
    false,
    result.stdout,
  )
  for (const [file, , count] of probes) {
    assert.equal(
      diagnostics.filter(item =>
        path.resolve(cwd, item.filePath) === path.join(cwd, file)
        && item.ruleName === '@typescript-eslint/no-unsafe-assignment'
      ).length,
      count,
      `${file}: ${result.stdout}`,
    )
  }
  assert.ok(
    diagnostics.some(item =>
      path.resolve(cwd, item.filePath)
        === path.join(cwd, 'checks/custom-case.ts')
      && item.ruleName === '@typescript-eslint/prefer-optional-chain'
    ),
    result.stdout,
  )
})
