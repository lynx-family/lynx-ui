// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
  collectTypeScriptTestDiagnostics,
  isTypeScriptTestFile,
} from './check-test-types.mjs'

test('recognizes TypeScript tests in packages, apps, LUNA, and tooling', () => {
  for (
    const fileName of [
      'packages/lynx-ui-sortable/__tests__/stable-handlers.test.ts',
      'apps/examples/Button/test/component.tsx',
      'luna/packages/luna-stage/src/__tests__/stage.test.tsx',
      'tools/typedoc/runtime-exports.test.ts',
    ]
  ) {
    assert.equal(isTypeScriptTestFile(fileName), true, fileName)
  }

  assert.equal(
    isTypeScriptTestFile('packages/lynx-ui-button/src/index.ts'),
    false,
  )
  assert.equal(isTypeScriptTestFile('tools/lint/config.test.mjs'), false)
  assert.equal(
    isTypeScriptTestFile('packages/lynx-ui-button/src/index.d.ts'),
    false,
  )
})

test('reports a missing imported type in a test source and ignores source diagnostics', t => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lynx-test-types-'))
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }))

  fs.writeFileSync(
    path.join(rootDir, 'module.ts'),
    'export type Present = string\nconst unrelated: string = 1\n',
  )
  const testFile = path.join(rootDir, 'regression.test.ts')
  fs.writeFileSync(
    testFile,
    'import type { Missing } from "./module"\ntype Regression = Missing\n',
  )
  const configPath = path.join(rootDir, 'tsconfig.json')
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      compilerOptions: {
        module: 'ESNext',
        moduleResolution: 'Bundler',
        noEmit: true,
        strict: true,
      },
      include: ['./*.test.ts'],
    }),
  )

  const result = collectTypeScriptTestDiagnostics(configPath, rootDir)

  assert.equal(result.testFileCount, 1)
  assert.ok(
    result.diagnostics.some(
      diagnostic =>
        diagnostic.code === 2305
        && path.resolve(diagnostic.file.fileName) === path.resolve(testFile),
    ),
  )
  assert.ok(
    result.diagnostics.every(
      diagnostic =>
        !diagnostic.file
        || path.resolve(diagnostic.file.fileName) === path.resolve(testFile),
    ),
  )
})
