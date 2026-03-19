// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as ts from 'typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '../..')
const packagesDir = path.join(rootDir, 'packages')
const aggregatePackageName = 'lynx-ui'
const aggregateEntryPath = path.join(
  packagesDir,
  aggregatePackageName,
  'src/index.tsx',
)
const skippedPackages = new Set(['lynx-ui-overlay', 'lynx-ui-presence'])

function getPackageDirs() {
  return fs.readdirSync(packagesDir)
    .filter(name =>
      name.startsWith('lynx-ui-') && name !== aggregatePackageName
    )
    .filter(name => fs.statSync(path.join(packagesDir, name)).isDirectory())
    .sort()
}

function getEntryCandidates(packageName) {
  return [
    path.join(packagesDir, packageName, 'src/index.tsx'),
    path.join(packagesDir, packageName, 'src/index.ts'),
    path.join(packagesDir, packageName, 'index.tsx'),
    path.join(packagesDir, packageName, 'index.ts'),
  ]
}

function getEntryPath(packageName) {
  return getEntryCandidates(packageName).find(candidate =>
    fs.existsSync(candidate)
  ) ?? null
}

function getCompilerPaths() {
  const paths = {
    '@lynx-js/lynx-ui': ['packages/lynx-ui/src/index.tsx'],
  }

  for (const packageName of getPackageDirs()) {
    const entryPath = getEntryPath(packageName)
    if (!entryPath) {
      continue
    }
    paths[`@lynx-js/${packageName}`] = [path.relative(rootDir, entryPath)]
  }

  return paths
}

function createProgram(entryPath) {
  return ts.createProgram([entryPath], {
    jsx: ts.JsxEmit.React,
    module: ts.ModuleKind.NodeNext,
    target: ts.ScriptTarget.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    allowJs: true,
    skipLibCheck: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    baseUrl: rootDir,
    paths: getCompilerPaths(),
  })
}

function getModuleExports(entryPath) {
  const program = createProgram(entryPath)
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(entryPath)

  if (!sourceFile) {
    throw new Error(`Could not load source file: ${entryPath}`)
  }

  const symbol = checker.getSymbolAtLocation(sourceFile) ?? sourceFile.symbol
  if (!symbol) {
    throw new Error(`Could not resolve module symbol for: ${entryPath}`)
  }

  return new Set(
    checker.getExportsOfModule(symbol).map(exportSymbol => exportSymbol.name),
  )
}

function compareExports() {
  const aggregateExports = getModuleExports(aggregateEntryPath)
  const failures = []
  const successes = []
  const skipped = []

  for (const packageName of getPackageDirs()) {
    if (skippedPackages.has(packageName)) {
      skipped.push(packageName)
      continue
    }

    const entryPath = getEntryPath(packageName)
    if (!entryPath) {
      failures.push({
        packageName,
        missing: [],
        reason: 'Entry point not found',
      })
      continue
    }

    const packageExports = getModuleExports(entryPath)
    const missing = Array.from(packageExports)
      .filter(exportName => !aggregateExports.has(exportName))
      .sort()

    if (missing.length > 0) {
      failures.push({ packageName, missing })
      continue
    }

    successes.push({
      packageName,
      count: packageExports.size,
    })
  }

  return { failures, skipped, successes }
}

function printSummary({ failures, skipped, successes }) {
  console.log(
    `Checked aggregate exports for ${
      successes.length + failures.length
    } packages.`,
  )
  console.log(`Passed: ${successes.length}`)
  console.log(`Skipped: ${skipped.length}`)
  console.log(`Failed: ${failures.length}`)

  if (skipped.length > 0) {
    console.log(`Skipped packages: ${skipped.join(', ')}`)
  }

  if (failures.length === 0) {
    return
  }

  console.log('\nMissing aggregate exports:')
  for (const failure of failures) {
    console.log(`- ${failure.packageName}`)
    if (failure.reason) {
      console.log(`  Reason: ${failure.reason}`)
      continue
    }
    console.log(`  ${failure.missing.join(', ')}`)
  }
}

try {
  const result = compareExports()
  printSummary(result)

  if (result.failures.length > 0) {
    process.exitCode = 1
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
