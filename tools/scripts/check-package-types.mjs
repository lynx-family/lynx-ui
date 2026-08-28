// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)
const packagesRoot = path.join(repoRoot, 'packages')
const ts = await import(
  pathToFileURL(
    path.join(
      packagesRoot,
      'lynx-ui-button/node_modules/typescript/lib/typescript.js',
    ),
  )
)

const assetImportRE =
  /\.(?:css|less|sass|scss|svg|png|jpe?g|gif|webp|avif)(?:\?.*)?$/i
const resolutionDiagnosticCodes = new Set([2307, 2834, 2835, 7016])

function getPackageEntries() {
  return fs.readdirSync(packagesRoot, { withFileTypes: true }).flatMap(
    (entry) => {
      if (!entry.isDirectory() || !entry.name.startsWith('lynx-ui')) return []

      const packageRoot = path.join(packagesRoot, entry.name)
      const packageJsonPath = path.join(packageRoot, 'package.json')
      if (!fs.existsSync(packageJsonPath)) return []

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.private || !packageJson.types) return []

      const typesEntry = path.resolve(packageRoot, packageJson.types)
      if (!fs.existsSync(typesEntry)) {
        throw new Error(
          `${packageJson.name}: missing declaration entry ${
            path.relative(repoRoot, typesEntry)
          }; build packages before running this check.`,
        )
      }

      return [{ name: packageJson.name, packageRoot, typesEntry }]
    },
  )
}

function getRelativeSpecifier(diagnostic) {
  const match = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    .match(
      /(?:module|path) ['"](\.{1,2}\/[^'"]+)['"]/i,
    )
  if (match) return match[1]

  if (diagnostic.file && diagnostic.start !== undefined) {
    const token = ts.getTokenAtPosition(diagnostic.file, diagnostic.start)
    if (ts.isStringLiteralLike(token) && token.text.startsWith('.')) {
      return token.text
    }
  }
}

function isRelevantDiagnostic(diagnostic, packages) {
  if (!diagnostic.file || !resolutionDiagnosticCodes.has(diagnostic.code)) {
    return false
  }

  const packageEntry = packages.find(({ packageRoot }) =>
    diagnostic.file.fileName.startsWith(
      `${packageRoot}${path.sep}dist${path.sep}`,
    )
  )
  if (!packageEntry) return false

  const specifier = getRelativeSpecifier(diagnostic)
  return Boolean(specifier && !assetImportRE.test(specifier))
}

function formatDiagnostic(diagnostic) {
  const position = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start ?? 0,
  )
  const location = `${path.relative(repoRoot, diagnostic.file.fileName)}:${
    position.line + 1
  }:${position.character + 1}`
  return `${location} TS${diagnostic.code}: ${
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  }`
}

function checkResolution(packages, label, moduleResolution, module) {
  const program = ts.createProgram(
    packages.map(({ typesEntry }) => typesEntry),
    {
      allowJs: false,
      module,
      moduleResolution,
      noEmit: true,
      skipLibCheck: false,
      target: ts.ScriptTarget.ESNext,
    },
  )
  const diagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) =>
    isRelevantDiagnostic(diagnostic, packages)
  )

  if (diagnostics.length > 0) {
    throw new Error(
      `${label} declaration resolution failed:\n${
        diagnostics.map((diagnostic) => formatDiagnostic(diagnostic)).join('\n')
      }`,
    )
  }
}

try {
  const packages = getPackageEntries()
  checkResolution(
    packages,
    'Bundler',
    ts.ModuleResolutionKind.Bundler,
    ts.ModuleKind.ESNext,
  )
  checkResolution(
    packages,
    'NodeNext',
    ts.ModuleResolutionKind.NodeNext,
    ts.ModuleKind.NodeNext,
  )
  console.log(
    `Package type resolution check passed for ${packages.length} packages (Bundler and NodeNext).`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
