// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as fs from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Application } from 'typedoc'

import { doGenDocData } from './tpl-data.js'
import { doGenTplWithData } from './tpl.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootPath = join(__dirname, '../../')
// Put the folders start with 'lynx-ui-' yet you don't want to generate typeDoc for them.
const excludedPath = [
  'lynx-ui-common',
  'lynx-ui',
  'lynx-ui-primitives',
  'lynx-ui-live',
  'lynx-ui-radio',
  'lynx-ui-switch',
  'lynx-ui-primitives-overlay',
  'lynx-ui-primitives-presence',
]

const primitivesConfig: Record<string, string[]> = {
  'lynx-ui-button': ['Button'],
  'lynx-ui-primitives-sheet': [
    'SheetRoot',
    'SheetBackdrop',
    'SheetView',
    'SheetContent',
  ],
  'lynx-ui-dialog': [
    'DialogRoot',
    'DialogBackdrop',
    'DialogView',
    'DialogContent',
  ],
  'lynx-ui-popover': [
    'PopoverRoot',
    'PopoverTrigger',
    'PopoverPositioner',
    'PopoverContent',
    'PopoverArrow',
  ],
  'lynx-ui-toast': [
    'ToastRoot',
    'ToastPositioner',
    'ToastContent',
  ],
  'lynx-ui-primitives-tooltip': [
    'TooltipRoot',
    'TooltipTrigger',
    'TooltipPositioner',
    'TooltipContent',
    'TooltipArrow',
  ],
  'lynx-ui-radio-group': [
    'RadioGroupRoot',
    'Radio',
    'RadioIndicator',
  ],
  'lynx-ui-draggable': [
    'Draggable',
    'DraggableArea',
  ],
  'lynx-ui-form': [
    'FormRoot',
    'FormField',
    'FormSubmitButton',
  ],
  'lynx-ui-checkbox': [
    'Checkbox',
    'CheckboxIndicator',
  ],
}
export async function runTypeDocForPackage(
  entryPoint: string,
  tsconfig: string,
  jsonDir: string,
): Promise<void> {
  const app = await Application.bootstrapWithPlugins({
    entryPoints: [entryPoint],
    entryPointStrategy: 'expand',
    tsconfig: tsconfig,
    json: jsonDir,
    emit: 'none',
    plugin: [join(__dirname, 'plugins/expand-union-plugin.js')],
  })

  const project = await app.convert()

  if (project) {
    await app.generateJson(project, jsonDir)
  }
}

export async function genHooksDocForPackage(
  packageName: string,
  interfacePath: string,
): Promise<void> {
  const hooksPackageFolder = join(rootPath, 'packages/lynx-ui-common')
  const hookTypesPath = join(
    hooksPackageFolder,
    'src/types/interfaces/',
    interfacePath,
  )

  const hooksPaths = interfacePath.split('.')
  const hooksLang = hooksPaths.length > 2 && hooksPaths[1] === 'zh'
    ? 'zh'
    : 'en'
  const tsconfigPath = join(hooksPackageFolder, 'tsconfig.json')
  const metaJsonPath = join(
    rootPath,
    hooksLang === 'en' ? 'tools/typedoc/gen/en/' : 'tools/typedoc/gen/zh/',
    packageName,
    'tsconfig.json',
  )
  const APITplJsonPath = join(
    rootPath,
    hooksLang === 'en' ? 'tools/typedoc/gen/en/' : 'tools/typedoc/gen/zh/',
    `${packageName}-api-tpl.json`,
  )
  const APIMdxPath = join(
    hooksPackageFolder,
    'docs',
    packageName,
    hooksLang === 'en' ? 'APIReference.mdx' : 'APIReference.zh.mdx',
  )

  await runTypeDocForPackage(hookTypesPath, tsconfigPath, metaJsonPath)
  await doGenDocData(
    metaJsonPath,
    APITplJsonPath,
  )
  await doGenTplWithData(
    APITplJsonPath,
    APIMdxPath,
  )
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
  const hasMultipleProps = packageName in primitivesConfig
  const subPackageFolder = join(rootPath, 'packages', packageName)
  const { path: tsconfigPath, isDocsConfig } = getTsConfigPath(subPackageFolder)
  const configName = isDocsConfig ? 'tsconfig.docs.json' : 'tsconfig.json'
  const entryPointPath = join(
    subPackageFolder,
    isDocsConfig ? 'src/types/index.docs.ts' : 'types/index.docs.ts',
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

  const entryPointZHPath = join(
    subPackageFolder,
    isDocsConfig ? 'src/types/index.docs.ts' : 'types/index.docs.ts',
  )
  const metaJsonZHPath = join(
    rootPath,
    'tools/typedoc/gen/zh/',
    packageName,
    configName,
  )
  const APITplJsonZHPath = join(
    rootPath,
    'tools/typedoc/gen/zh/',
    `${packageName}-zh-api-tpl.json`,
  )
  const APIMdxZHPath = join(subPackageFolder, 'docs', 'APIReference.zh.mdx')

  // generate EN doc
  await runTypeDocForPackage(entryPointPath, tsconfigPath, metaJsonPath)
  await doGenDocData(
    metaJsonPath,
    APITplJsonPath,
    hasMultipleProps,
  )
  await doGenTplWithData(
    APITplJsonPath,
    APIMdxPath,
    hasMultipleProps,
    primitivesConfig[packageName],
  )

  // generate ZH doc
  await runTypeDocForPackage(entryPointZHPath, tsconfigPath, metaJsonZHPath)

  await doGenDocData(
    metaJsonZHPath,
    APITplJsonZHPath,
    hasMultipleProps,
  )

  await doGenTplWithData(
    APITplJsonZHPath,
    APIMdxZHPath,
    hasMultipleProps,
    primitivesConfig[packageName],
  )
}

async function generateDocsForAllPackages(packageName: string[]) {
  for (const name of packageName) {
    await genLynxUIDocForPackage(name)
  }
}

function findLynxUiFolders(dirPath: string): string[] {
  try {
    // read all files and directories in current path
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    // filter all folders started with 'lynx-ui'
    const folders = entries
      .filter(entry =>
        entry.isDirectory() && entry.name.startsWith('lynx-ui-')
        && !(excludedPath.includes(entry.name)
          || entry.name in primitivesConfig)
      )
      .map(folder => folder.name)

    return folders
  } catch (error) {
    console.error('Error reading directory:', error)
    return []
  }
}

// Process command line arguments
const args = process.argv.slice(2)

// Default package list
const defaultPackages = [
  'lynx-ui-dialog',
  'lynx-ui-action-sheet',
  'lynx-ui-tabs',
  'lynx-ui-scroll-view',
]

// If command line arguments are provided, use them as package names
// Otherwise use the default list or find all lynx-ui folders
let packagesToGenerate: string[] = []

if (args.length > 0) {
  // Use the provided package names
  packagesToGenerate = args

  console.log(
    `Generating documentation for specified packages: ${
      packagesToGenerate.join(', ')
    }`,
  )
} else {
  // Use default packages if no arguments provided
  const directoryPath = join(rootPath, 'packages')
  const lynxUiFolders = findLynxUiFolders(directoryPath)
  packagesToGenerate = [
    ...(lynxUiFolders.length > 0 ? lynxUiFolders : defaultPackages),
    ...Object.keys(primitivesConfig),
  ]
  console.log(
    `Generating documentation for default packages: ${
      packagesToGenerate.join(', ')
    }`,
  )
}

// Generate documentation for the selected packages
await generateDocsForAllPackages(packagesToGenerate)

// Always generate hooks documentation
// await genHooksDocForPackage('useRefresh', 'RefreshInterface.ts')
// await genHooksDocForPackage('useRefresh', 'RefreshInterface.zh.ts')
// await genHooksDocForPackage('useBounce', 'BounceableInterface.ts')
// await genHooksDocForPackage('useBounce', 'BounceableInterface.zh.ts')

console.log('Documentation generation completed!')

// Usage:
// pnpm tsx tools/typedoc/index.ts                         # Generate for default packages
// pnpm tsx tools/typedoc/index.ts lynx-ui-dialog          # Generate for a single package
// pnpm tsx tools/typedoc/index.ts lynx-ui-dialog lynx-ui-tabs  # Generate for multiple packages
