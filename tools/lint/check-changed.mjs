// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync, spawnSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { parseArgs } from 'node:util'

import { runJSONLint } from './json.mjs'

const { values } = parseArgs({
  options: {
    base: { type: 'string', default: 'main' },
    check: { type: 'boolean' },
    unsafe: { type: 'boolean' },
    'include-untracked': { type: 'boolean' },
    'ignore-prefix': { type: 'string', multiple: true, default: [] },
  },
})
const rootDir = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()
process.chdir(rootDir)
const ignoredPaths = values['ignore-prefix'].map(prefix =>
  prefix.replace(/\/+$/, '')
)
const changed = execFileSync(
  'git',
  ['diff', '--name-only', '-z', values.base],
  {
    encoding: 'utf8',
  },
)
const untracked = values['include-untracked']
  ? execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], {
    encoding: 'utf8',
  })
  : ''
const files = [...new Set((changed + untracked).split('\0'))].filter(file => {
  if (
    !file
    || ignoredPaths.some(prefix =>
      file === prefix || file.startsWith(`${prefix}/`)
    )
  ) return false
  try {
    return statSync(file).isFile()
  } catch {
    return false
  }
})
if (files.length === 0) {
  console.info('No changed files to check.')
} else {
  let hasErrors = false
  function run(args) {
    const result = spawnSync('pnpm', ['exec', ...args], { stdio: 'inherit' })
    if (result.error) console.error(result.error)
    hasErrors ||= result.status !== 0
  }
  const codeFiles = files.filter(file =>
    /\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(file)
  )
  const jsonFiles = files.filter(file => /\.(?:json|json5|jsonc)$/.test(file))
  // --unsafe remains an alias for the linter's single fix mode.
  if (codeFiles.length > 0) {
    run([
      'rslint',
      '-c',
      'rslint.config.mjs',
      ...(values.check ? [] : ['--fix']),
      ...codeFiles,
    ])
  }
  if (jsonFiles.length > 0) {
    await runJSONLint(jsonFiles, { rootDir })
    hasErrors ||= Boolean(process.exitCode)
  }
  run([
    'dprint',
    values.check ? 'check' : 'fmt',
    '--allow-no-files',
    '--',
    ...files,
  ])
  if (hasErrors) process.exitCode = 1
}
