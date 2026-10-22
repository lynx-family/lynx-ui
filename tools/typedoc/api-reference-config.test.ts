// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { apiReferenceConfig } from './api-reference-config'
import {
  collectPublicRuntimeExportNames,
  collectPublicTypeExportNames,
} from './runtime-exports'

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const packagesRoot = join(repositoryRoot, 'packages')
const documentedPackageNames = readdirSync(packagesRoot)
  .filter(packageName =>
    existsSync(join(packagesRoot, packageName, 'docs/APIReference.mdx'))
  )
  .sort()

function getPackageEntryPoint(packageRoot: string): string {
  const entryPoint = ['index.tsx', 'index.ts']
    .map(fileName => join(packageRoot, 'src', fileName))
    .find(filePath => existsSync(filePath))

  if (!entryPoint) {
    throw new Error(`Could not find package entry point in ${packageRoot}`)
  }

  return entryPoint
}

function collectDocumentedEntityNames(filePath: string): Set<string> {
  const sourceFile = ts.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const names = new Set<string>()

  for (const statement of sourceFile.statements) {
    if (
      (ts.isInterfaceDeclaration(statement)
        || ts.isTypeAliasDeclaration(statement))
      && statement.modifiers?.some(
        modifier => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      names.add(statement.name.text)
      continue
    }

    if (
      ts.isExportDeclaration(statement)
      && statement.exportClause
      && ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        names.add(element.name.text)
      }
    }
  }

  return names
}

describe('apiReferenceConfig', () => {
  it('configures every package with a generated API reference', () => {
    expect(Object.keys(apiReferenceConfig).sort()).toEqual(
      documentedPackageNames,
    )
  })

  it.each(documentedPackageNames)(
    'lists every documented runtime part for %s',
    packageName => {
      const packageRoot = join(repositoryRoot, 'packages', packageName)
      const runtimeExports = collectPublicRuntimeExportNames(
        getPackageEntryPoint(packageRoot),
      )
      const documentedEntities = collectDocumentedEntityNames(
        join(packageRoot, 'src/types/index.docs.ts'),
      )
      const documentedRuntimeParts = [...runtimeExports].filter(name =>
        documentedEntities.has(`${name}Props`)
      )

      expect(new Set(apiReferenceConfig[packageName].parts)).toEqual(
        new Set(documentedRuntimeParts),
      )
    },
  )

  it.each(Object.entries(apiReferenceConfig))(
    'only configures documented entities for %s',
    (packageName, config) => {
      const documentedEntities = collectDocumentedEntityNames(
        join(packagesRoot, packageName, 'src/types/index.docs.ts'),
      )
      const configuredEntities = [
        ...config.parts.map(part => `${part}Props`),
        ...(config.refs ?? []),
        ...(config.supportingTypes ?? []),
        ...(config.embeddedTypes ?? []),
        ...Object.keys(config.excludedTypes ?? {}),
      ]

      expect(
        configuredEntities.filter(name => !documentedEntities.has(name)),
      ).toEqual([])
    },
  )

  it.each(documentedPackageNames)(
    'accounts for every public type exported by %s',
    packageName => {
      const packageRoot = join(packagesRoot, packageName)
      const publicTypeExports = collectPublicTypeExportNames(
        getPackageEntryPoint(packageRoot),
      )
      const documentedEntities = collectDocumentedEntityNames(
        join(packageRoot, 'src/types/index.docs.ts'),
      )
      const config = apiReferenceConfig[packageName]
      const classifications = [
        ...config.parts.map(name => [`${name}Props`, 'parts'] as const),
        ...(config.refs ?? []).map(name => [name, 'refs'] as const),
        ...(config.supportingTypes ?? []).map(
          name => [name, 'supportingTypes'] as const,
        ),
        ...(config.embeddedTypes ?? []).map(
          name => [name, 'embeddedTypes'] as const,
        ),
        ...(config.aliases ?? []).map(name => [name, 'aliases'] as const),
        ...Object.keys(config.excludedTypes ?? {}).map(
          name => [name, 'excludedTypes'] as const,
        ),
      ]
      const aliases = new Set(config.aliases ?? [])
      const classificationCount = new Map<string, number>()
      for (const [name] of classifications) {
        classificationCount.set(
          name,
          (classificationCount.get(name) ?? 0) + 1,
        )
      }
      const invalidExports = [...publicTypeExports].flatMap(name => {
        const count = classificationCount.get(name) ?? 0
        if (
          count === 1
          && (documentedEntities.has(name) || aliases.has(name))
        ) {
          return []
        }
        return [{
          name,
          classificationCount: count,
          documented: documentedEntities.has(name),
        }]
      })

      expect(invalidExports).toEqual([])
    },
  )

  it.each(Object.entries(apiReferenceConfig))(
    'gives every excluded type a reason for %s',
    (_packageName, config) => {
      expect(
        Object.entries(config.excludedTypes ?? {}).filter(
          ([, reason]) => reason.trim().length === 0,
        ),
      ).toEqual([])
    },
  )
})
