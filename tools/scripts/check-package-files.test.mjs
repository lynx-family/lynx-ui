// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
  inspectPackageManifest,
  inspectWorkspacePackageFiles,
} from './check-package-files.mjs'

function createTempDir(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'lynx-ui-package-files-'))
  t.after(() => rmSync(root, { force: true, recursive: true }))
  return root
}

function createValidPackage(root, relDir = 'packages/demo', overrides = {}) {
  const packageDir = path.join(root, relDir)
  mkdirSync(path.join(packageDir, 'src'), { recursive: true })
  writeFileSync(path.join(packageDir, 'src/index.tsx'), 'export const x = 1\n')
  writeFileSync(path.join(packageDir, 'README.md'), '# Demo\n')
  writeFileSync(path.join(packageDir, 'CHANGELOG.md'), '# Changelog\n')
  writeFileSync(path.join(packageDir, 'LICENSE'), 'Apache-2.0\n')
  writeFileSync(path.join(packageDir, 'SKILL.md'), '# Skill\n')

  const manifest = {
    name: '@lynx-js/demo',
    version: '1.0.0',
    repository: {
      type: 'git',
      url: 'git+https://github.com/lynx-family/lynx-ui.git',
      directory: relDir,
    },
    main: './dist/index.jsx',
    types: './dist/index.d.ts',
    'jsnext:source': './src/index.tsx',
    files: [
      'src',
      '!src/**/*.test.*',
      '!src/**/__tests__/**',
      'README.md',
      'SKILL.md',
      'CHANGELOG.md',
      'LICENSE',
      'dist/**',
    ],
    publishConfig: {
      access: 'public',
    },
    ...overrides,
  }

  writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify(manifest, null, 2),
  )

  return { packageDir, manifest }
}

test('accepts a valid publishable package manifest', (t) => {
  const root = createTempDir(t)
  const { packageDir, manifest } = createValidPackage(root)

  assert.deepEqual(
    inspectPackageManifest(packageDir, manifest, {
      packageRelPath: 'packages/demo',
    }),
    [],
  )
})

test('allows CHANGELOG.md in files before a package has its first changelog', (t) => {
  const root = createTempDir(t)
  const { packageDir, manifest } = createValidPackage(root)
  rmSync(path.join(packageDir, 'CHANGELOG.md'))

  assert.deepEqual(
    inspectPackageManifest(packageDir, manifest, {
      packageRelPath: 'packages/demo',
    }),
    [],
  )
})

test('reports missing CHANGELOG.md, README.md, SKILL.md, and LICENSE', (t) => {
  const root = createTempDir(t)
  const { packageDir, manifest } = createValidPackage(root, 'packages/demo', {
    files: ['src', '!src/**/*.test.*', '!src/**/__tests__/**', 'dist/**'],
  })
  rmSync(path.join(packageDir, 'LICENSE'))

  const issues = inspectPackageManifest(packageDir, manifest, {
    packageRelPath: 'packages/demo',
  })

  assert.ok(issues.includes('missing LICENSE file in package directory'))
  assert.ok(issues.includes('"files" must include "LICENSE"'))
  assert.ok(
    issues.includes('"files" must include "README.md" when README.md exists'),
  )
  assert.ok(
    issues.includes(
      '"files" must include "CHANGELOG.md" when CHANGELOG.md exists',
    ),
  )
  assert.ok(
    issues.includes('"files" must include "SKILL.md" when SKILL.md exists'),
  )
})

test('reports non-existent entries in files, unneeded entries, and repository mismatches', (t) => {
  const root = createTempDir(t)
  const { packageDir, manifest } = createValidPackage(root, 'packages/demo', {
    repository: {
      type: 'git',
      url: 'git+https://github.com/lynx-family/lynx-ui.git',
      directory: 'packages/wrong-name',
    },
    publishConfig: {},
    files: [
      'src',
      '!src/**/*.test.*',
      '!src/**/__tests__/**',
      'README.md',
      'SKILL.md',
      'CHANGELOG.md',
      'LICENSE',
      'tsconfig.json',
      'docs/**',
      'README_zh.md',
      'missing-file.txt',
      'dist/**',
    ],
  })

  const issues = inspectPackageManifest(packageDir, manifest, {
    packageRelPath: 'packages/demo',
  })

  assert.ok(
    issues.includes(
      'repository.directory "packages/wrong-name" does not match package path "packages/demo"',
    ),
  )
  assert.ok(
    issues.includes(
      'scoped publishable package must set publishConfig.access to "public"',
    ),
  )
  assert.ok(
    issues.includes(
      '"files" entry "missing-file.txt" does not exist on disk',
    ),
  )
  assert.ok(
    issues.includes(
      'unneeded internal file "tsconfig.json" must not be included in "files"',
    ),
  )
  assert.ok(
    issues.includes(
      'unneeded internal file "docs/**" must not be included in "files"',
    ),
  )
  assert.ok(
    issues.includes(
      'unneeded internal file "README_zh.md" must not be included in "files"',
    ),
  )
})

test('reports src/** glob bypass and missing test exclusions inside src/', (t) => {
  const root = createTempDir(t)
  const { packageDir, manifest } = createValidPackage(root, 'packages/demo', {
    files: [
      'src/**',
      'README.md',
      'SKILL.md',
      'CHANGELOG.md',
      'LICENSE',
      'dist/**',
    ],
  })
  writeFileSync(path.join(packageDir, 'src/index.test.ts'), 'test()\n')
  writeFileSync(path.join(packageDir, 'src/extra.spec.ts'), 'test()\n')

  const issues = inspectPackageManifest(packageDir, manifest, {
    packageRelPath: 'packages/demo',
  })

  assert.ok(
    issues.includes(
      'use "src" instead of "src/**" in "files" so pnpm pack honors negation exclusions',
    ),
  )

  assert.ok(
    issues.includes(
      '"files" includes src/ without required test exclusion "!src/**/*.test.*"',
    ),
  )
  assert.ok(
    issues.includes(
      '"files" includes src/ without required test exclusion "!src/**/__tests__/**"',
    ),
  )
  assert.ok(
    issues.includes(
      'test file "src/index.test.ts" would be included by "files"',
    ),
  )
  assert.ok(
    issues.includes(
      'test file "src/extra.spec.ts" would be included by "files"',
    ),
  )
})

test('matches ** as zero directories in test file exclusions', (t) => {
  const root = createTempDir(t)
  const { packageDir, manifest } = createValidPackage(root, 'packages/demo', {
    files: ['src', '!src/**/__tests__/**'],
  })
  mkdirSync(path.join(packageDir, 'src/__tests__'), { recursive: true })
  mkdirSync(path.join(packageDir, 'src/foo/__tests__'), { recursive: true })
  writeFileSync(path.join(packageDir, 'src/__tests__/example.ts'), 'test()\n')
  writeFileSync(path.join(packageDir, 'src/foo/__tests__/x.ts'), 'test()\n')

  const issues = inspectPackageManifest(packageDir, manifest, {
    packageRelPath: 'packages/demo',
  })

  assert.ok(
    !issues.includes(
      'test file "src/__tests__/example.ts" would be included by "files"',
    ),
  )
  assert.ok(
    !issues.includes(
      'test file "src/foo/__tests__/x.ts" would be included by "files"',
    ),
  )
})

test('checks entry point coverage and dist targets when checkDist is enabled', (t) => {
  const root = createTempDir(t)
  const { packageDir, manifest } = createValidPackage(root, 'packages/demo', {
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.jsx',
      },
      './extra': './extra/index.js',
    },
  })

  const preBuildIssues = inspectPackageManifest(packageDir, manifest, {
    checkDist: false,
    packageRelPath: 'packages/demo',
  })
  assert.ok(
    preBuildIssues.includes(
      'exports target "./extra/index.js" is not covered by "files"',
    ),
  )
  assert.ok(
    preBuildIssues.includes(
      'exports target "./extra/index.js" does not exist on disk',
    ),
  )

  const distIssues = inspectPackageManifest(packageDir, manifest, {
    checkDist: true,
    packageRelPath: 'packages/demo',
  })
  assert.ok(
    distIssues.includes('"files" entry "dist/**" does not exist on disk'),
  )
  assert.ok(
    distIssues.includes(
      'main target "./dist/index.jsx" does not exist on disk',
    ),
  )
})

test('inspectWorkspacePackageFiles ignores private packages and validates publishable ones', (t) => {
  const root = createTempDir(t)
  writeFileSync(
    path.join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - packages/*\n',
  )
  createValidPackage(root, 'packages/public-pkg')
  createValidPackage(root, 'packages/private-pkg', {
    name: '@lynx-js/private-pkg',
    private: true,
    files: undefined,
  })

  const result = inspectWorkspacePackageFiles(root)
  assert.deepEqual(result.checkedPackages, ['packages/public-pkg'])
  assert.deepEqual(result.failures, [])
})
