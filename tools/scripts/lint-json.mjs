// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ESLint } from 'eslint'
import jsoncPlugin from 'eslint-plugin-jsonc'

const requestedFiles = process.argv.slice(2)
const files = requestedFiles.length > 0
  ? requestedFiles.filter(file => /\.(?:json|json5|jsonc)$/.test(file))
  : ['**/*.{json,json5,jsonc}']

if (files.length > 0) {
  // Rslint cannot run the custom parser required by eslint-plugin-jsonc.
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        ignores: [
          '**/node_modules/**',
          '.pnpm-store/**',
          '.codebase/**',
          '.vscode/**',
          '**/.turbo/**',
          'coverage/**',
          'output/**',
          'target/**',
          '**/test/js',
          '**/dist/**',
          '**/lib/**',
          '.changeset/*',
          'website/**',
          '**/tools/make-new-component/examplesTemplate/**',
          '**/tools/make-new-component/template/**',
        ],
      },
      ...jsoncPlugin.configs['flat/recommended-with-jsonc'],
    ],
    errorOnUnmatchedPattern: false,
    warnIgnored: false,
  })
  const results = await eslint.lintFiles(files)
  const formatter = await eslint.loadFormatter('stylish')
  const output = formatter.format(results)
  if (output) process.stdout.write(output)
  else console.log(`JSONC lint passed for ${results.length} file(s).`)

  if (results.some(result => result.errorCount > 0)) process.exitCode = 1
}
