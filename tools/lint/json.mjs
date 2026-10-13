// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path'

import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended'
import { ESLint } from 'eslint'
import jsoncPlugin from 'eslint-plugin-jsonc'

export function createJSONConfig({
  rootDir = path.resolve(import.meta.dirname, '../..'),
  ignores = [],
} = {}) {
  return [
    {
      ignores: [
        ...ignores,
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
    cspellESLintPluginRecommended,
    {
      rules: {
        '@cspell/spellchecker': [
          'warn',
          {
            configFile: path.resolve(rootDir, 'cspell.jsonc'),
          },
        ],
      },
    },
    ...jsoncPlugin.configs['flat/recommended-with-jsonc'],
  ]
}

export async function runJSONLint(requestedFiles = [], options = {}) {
  const files = requestedFiles.length > 0
    ? requestedFiles.filter(file => /\.(?:json|json5|jsonc)$/.test(file))
    : ['**/*.{json,json5,jsonc}']
  if (files.length === 0) return
  const eslint = new ESLint({
    cwd: options.rootDir,
    overrideConfigFile: true,
    overrideConfig: createJSONConfig(options),
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
