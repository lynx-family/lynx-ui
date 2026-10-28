// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as fs from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Application } from 'typedoc'

import { apiReferenceConfig } from './api-reference-config.js'
import { collectPublicRuntimeExportNames } from './runtime-exports.js'
import { doGenDocData } from './tpl-data.js'
import { doGenTplWithData } from './tpl.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootPath = join(__dirname, '../../')
export async function runTypeDocForPackage(
  entryPoints: string | string[],
  tsconfig: string,
  jsonDir: string,
): Promise<void> {
  const normalizedEntryPoints = Array.isArray(entryPoints)
    ? entryPoints
    : [entryPoints]
  const app = await Application.bootstrapWithPlugins({
    entryPoints: normalizedEntryPoints,
    entryPointStrategy: 'expand',
    tsconfig: tsconfig,
    json: jsonDir,
    emit: 'none',
    // Keep docs generation running even if unrelated TS errors exist.
    skipErrorChecking: true,
    blockTags: [
      '@zh',
      '@Android',
      '@iOS',
      '@Harmony',
      '@param',
      '@defaultValue',
      '@deprecated',
      '@docTypeFallback',
    ],
    plugin: [join(__dirname, 'plugins/expand-union-plugin.ts')],
  })

  const project = await app.convert()

  if (project) {
    await app.generateJson(project, jsonDir)
  }
}

function getTsConfigPath(
  packageFolder: string,
): { path: string, isDocsConfig: boolean } {
  const docsConfigPath = join(packageFolder, 'tsconfig.docs.json')
  const defaultConfigPath = join(packageFolder, 'tsconfig.json')

  if (fs.existsSync(docsConfigPath)) {
    return { path: docsConfigPath, isDocsConfig: true }
  }
  return { path: defaultConfigPath, isDocsConfig: false }
}

export async function genLynxUIDocForPackage(
  packageName: string,
): Promise<void> {
  const subPackageFolder = join(rootPath, 'packages', packageName)

  // Some packages reference types from other workspace packages (e.g. Dialog -> Presence).
  // Generate those referenced packages' TypeDoc JSON first so templates can inline/expand them.
  const packageJsonPath = join(subPackageFolder, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkgJsonText = fs.readFileSync(packageJsonPath, 'utf8')
      const pkgJson = JSON.parse(pkgJsonText) as {
        dependencies?: Record<string, string>
        peerDependencies?: Record<string, string>
      }
      const deps: Record<string, string> = {
        ...(pkgJson.dependencies ?? {}),
        ...(pkgJson.peerDependencies ?? {}),
      }
      for (const [depName, version] of Object.entries(deps)) {
        if (
          depName.startsWith('@lynx-js/lynx-ui-')
          && depName !== '@lynx-js/lynx-ui-common' && version === 'workspace:*'
        ) {
          const depFolderName = depName.replace('@lynx-js/', '')
          const depFolder = join(rootPath, 'packages', depFolderName)
          if (!fs.existsSync(depFolder)) continue

          const { path: depTsconfigPath, isDocsConfig: depIsDocsConfig } =
            getTsConfigPath(depFolder)
          const depConfigName = depIsDocsConfig
            ? 'tsconfig.docs.json'
            : 'tsconfig.json'
          const depEntryPointPath = join(
            depFolder,
            depIsDocsConfig ? 'src/types/index.docs.ts' : 'types/index.docs.ts',
          )

          await runTypeDocForPackage(
            depEntryPointPath,
            depTsconfigPath,
            join(
              rootPath,
              'tools/typedoc/gen/en/',
              depFolderName,
              depConfigName,
            ),
          )
        }
      }
    } catch (e) {
      console.warn(`Failed to parse package.json for ${packageName}`, e)
    }
  }

  const packageApiReferenceConfig = apiReferenceConfig[packageName]
  if (!packageApiReferenceConfig) {
    throw new Error(`Missing API reference config for ${packageName}`)
  }
  const { path: tsconfigPath, isDocsConfig } = getTsConfigPath(subPackageFolder)
  const configName = isDocsConfig ? 'tsconfig.docs.json' : 'tsconfig.json'
  const entryPointPath = join(
    subPackageFolder,
    isDocsConfig ? 'src/types/index.docs.ts' : 'types/index.docs.ts',
  )
  const packageEntryPointPath = ['index.tsx', 'index.ts']
    .map(fileName => join(subPackageFolder, 'src', fileName))
    .find(filePath => fs.existsSync(filePath))

  if (!packageEntryPointPath) {
    throw new Error(`Could not find package entry point for ${packageName}`)
  }

  // TypeDoc reads the documentation-only type entry, so inspect the package
  // entry separately before mapping a `FooProps` section to component `Foo`.
  const publicRuntimeExportNames = collectPublicRuntimeExportNames(
    packageEntryPointPath,
  )

  const metaJsonPath = join(
    rootPath,
    'tools/typedoc/gen/en/',
    packageName,
    configName,
  )
  const APITplJsonPath = join(
    rootPath,
    'tools/typedoc/gen/en/',
    `${packageName}-api-tpl.json`,
  )
  const APIMdxPath = join(subPackageFolder, 'docs', 'APIReference.mdx')

  // generate EN doc
  await runTypeDocForPackage(entryPointPath, tsconfigPath, metaJsonPath)
  await doGenDocData(
    metaJsonPath,
    APITplJsonPath,
    true,
    `@lynx-js/${packageName}`,
  )
  await doGenTplWithData(
    APITplJsonPath,
    APIMdxPath,
    packageApiReferenceConfig,
    publicRuntimeExportNames,
  )

  // OSS only keeps the default APIReference.mdx output.
  const APIMdxZHPath = join(subPackageFolder, 'docs', 'APIReference.zh.mdx')
  if (fs.existsSync(APIMdxZHPath)) {
    fs.unlinkSync(APIMdxZHPath)
  }
}

async function generateDocsForAllPackages(packageName: string[]) {
  for (const name of packageName) {
    await genLynxUIDocForPackage(name)
  }
}

// Process command line arguments
const args = process.argv.slice(2)

const packagesToGenerate = args.length > 0
  ? args
  : Object.keys(apiReferenceConfig)

console.log(
  `Generating documentation for ${
    args.length > 0 ? 'specified' : 'configured'
  } packages: ${packagesToGenerate.join(', ')}`,
)

// Generate documentation for the selected packages
await generateDocsForAllPackages(packagesToGenerate)

console.log('Documentation generation completed!')

// Usage:
// pnpm tsx tools/typedoc/index.ts                         # Generate for default packages
// pnpm tsx tools/typedoc/index.ts lynx-ui-dialog          # Generate for a single package
// pnpm tsx tools/typedoc/index.ts lynx-ui-dialog lynx-ui-tabs  # Generate for multiple packages
