// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDir, '../..')

function normalizePath(fileName) {
  const absolutePath = path.resolve(fileName)
  return ts.sys.useCaseSensitiveFileNames
    ? absolutePath
    : absolutePath.toLowerCase()
}

function isWithin(rootDir, fileName) {
  const root = normalizePath(rootDir)
  const file = normalizePath(fileName)
  return file.startsWith(`${root}${path.sep}`)
}

export function isTypeScriptTestFile(fileName) {
  const normalized = fileName.replaceAll('\\', '/')
  const sourceFile = /\.(?:ts|tsx|mts|cts)$/.test(normalized)
  const declarationFile = /\.d\.(?:ts|tsx|mts|cts)$/.test(normalized)
  const testName = /\.(?:test|spec)\.(?:ts|tsx|mts|cts)$/.test(normalized)
  const testDirectory = /(?:^|\/)(?:__tests__|tests?)(?:\/|$)/.test(
    normalized,
  )

  return sourceFile && !declarationFile && (testName || testDirectory)
}

export function collectTypeScriptTestDiagnostics(
  configPath,
  rootDir,
  additionalTypes = [],
) {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    { noEmit: true, incremental: false },
    ts.sys,
  )
  if (!parsed) {
    throw new Error(`Could not read TypeScript config: ${configPath}`)
  }

  const root = path.resolve(rootDir)
  const testFiles = new Set(
    parsed.fileNames
      .filter(fileName =>
        isWithin(root, fileName) && isTypeScriptTestFile(fileName)
      )
      .map(fileName => normalizePath(fileName)),
  )
  if (testFiles.size === 0) {
    throw new Error(`No TypeScript test sources found in ${configPath}`)
  }

  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: {
      ...parsed.options,
      noEmit: true,
      incremental: false,
      types: [
        ...new Set([...(parsed.options.types ?? []), ...additionalTypes]),
      ],
    },
    projectReferences: parsed.projectReferences,
  })
  const seen = new Set()
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
    .filter(
      diagnostic => {
        if (
          diagnostic.file
          && !testFiles.has(normalizePath(diagnostic.file.fileName))
        ) {
          return false
        }
        const key = [
          diagnostic.code,
          diagnostic.file ? normalizePath(diagnostic.file.fileName) : '',
          diagnostic.start ?? '',
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        ].join(':')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      },
    )

  return { diagnostics, testFileCount: testFiles.size }
}

function main() {
  const configPath = path.join(repositoryRoot, 'tools/lint/tsconfig.json')
  const { diagnostics, testFileCount } = collectTypeScriptTestDiagnostics(
    configPath,
    repositoryRoot,
    ['vitest/globals'],
  )

  if (diagnostics.length > 0) {
    const formatHost = {
      getCanonicalFileName: fileName => fileName,
      getCurrentDirectory: () => repositoryRoot,
      getNewLine: () => ts.sys.newLine,
    }
    console.error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
    )
    process.exitCode = 1
    return
  }

  console.log(
    `Type-checked ${testFileCount} TypeScript test sources from tools/lint/tsconfig.json.`,
  )
}

if (
  process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
}
