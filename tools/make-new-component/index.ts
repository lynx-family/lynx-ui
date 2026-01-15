// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from 'jsonc-parser'

import { updateTSConfigRefs } from './updateTSConfigRefs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TEMPLATE_DIR = path.join(__dirname, './template')
const LYNX_UI_SRC = path.join(__dirname, '../../packages/lynx-ui/src')
const EXAMPLES_TSCONFIG_PATH = path.join(
  __dirname,
  '../../apps/examples/tsconfig.json',
)
const EXAMPLES_PACKAGE_PATH = path.join(
  __dirname,
  '../../apps/examples/package.json',
)

// Add constants for fields that shouldn't be merged
const PACKAGE_JSON_PRESERVE_FIELDS = [
  'name',
  'version',
  'jsnext:source',
  'main',
  'module',
]

const TSCONFIG_PRESERVE_FIELDS: string[] = []

// Add constant for files to skip during merge
const SKIP_MERGE_FILES = [
  '.md',
  'README.md',
  'README.zh.md',
  'CHANGELOG.md',
  'LICENSE',
  'index.tsx',
  'index.ts',
  'index.docs.ts',
  'index.docs.zh.ts',
  'index.d.ts',
  'index.docs.d.ts',
  'index.docs.zh.d.ts',
]

interface PackageJson {
  name?: string
  dependencies?: Record<string, string>
  [key: string]: any
}

interface TsConfig {
  compilerOptions?: {
    paths?: Record<string, string[]>
    [key: string]: any
  }
  references?: Array<{ path: string }>
  [key: string]: any
}

function makePreserveFields(
  target: Record<string, any>,
  source: Record<string, any>,
  fieldsToPreserve: string[],
) {
  const preserved: Record<string, any> = { ...source }

  fieldsToPreserve.forEach(field => {
    const parts = field.split('.')
    let targetValue = target
    let preservedValue = preserved

    // Navigate to the nested field
    for (let i = 0; i < parts.length - 1; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      targetValue = targetValue?.[parts[i]]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      preservedValue = preservedValue[parts[i]]
    }

    // If the field exists in target, preserve it
    const lastPart = parts[parts.length - 1]
    if (targetValue?.[lastPart] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      preservedValue[lastPart] = targetValue[lastPart]
    }
  })

  return preserved
}

function makeNewComponent(componentName: string, _sourceFiles?: any[]) {
  // Define paths
  const newPackagePath = path.join(
    __dirname,
    '../../packages',
    `lynx-ui-${componentName.toLowerCase()}`,
  )
  const realComponentName = componentName.toLowerCase()
  const newPackageSrcPath = path.join(newPackagePath, 'src')

  // Create new component folder and src folder
  fs.mkdirSync(newPackagePath, { recursive: true })
  fs.mkdirSync(newPackageSrcPath, { recursive: true })

  // Copy template files
  copyAndMergeRecursive(TEMPLATE_DIR, newPackagePath)

  updateTSConfigRefs().catch(console.error)

  console.log(`Successfully created component: lynx-ui-${realComponentName}`)
}

function deepMerge(target: any, source: any): any {
  if (!target || typeof target !== 'object') {
    return source
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const output = { ...target }

  for (const key in source) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      output[key] = key in target
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ? deepMerge(target[key], source[key])
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        : { ...source[key] }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      output[key] = source[key]
    }
  }

  return output
}

function copyAndMergeRecursive(source: string, target: string) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  const files = fs.readdirSync(source)
  files.forEach(file => {
    const sourcePath = path.join(source, file)
    const targetPath = path.join(target, file)
    const isDirectory = fs.lstatSync(sourcePath).isDirectory()

    if (isDirectory) {
      fs.mkdirSync(targetPath, { recursive: true })
      copyAndMergeRecursive(sourcePath, targetPath)
    } else {
      // Only skip if the file exists AND is in the skip list
      if (
        fs.existsSync(targetPath)
        && SKIP_MERGE_FILES.some(skipFile => file.endsWith(skipFile))
      ) {
        console.log(`Skipping existing file: ${file}`)
        return
      }

      // Handle special files that need merging
      if (
        fs.existsSync(targetPath)
        && (file === 'package.json' || file === 'tsconfig.json')
      ) {
        // Read and parse both files
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const sourceJson = parse(fs.readFileSync(sourcePath, 'utf8'))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const targetJson = parse(fs.readFileSync(targetPath, 'utf8'))

        // Preserve specified fields before merging
        const preserveFields = file === 'package.json'
          ? PACKAGE_JSON_PRESERVE_FIELDS
          : TSCONFIG_PRESERVE_FIELDS

        const sourceWithPreserved = makePreserveFields(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          targetJson,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          sourceJson,
          preserveFields,
        )

        // Merge the JSON objects
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const mergedJson = deepMerge(targetJson, sourceWithPreserved)

        // Write the merged result
        fs.writeFileSync(targetPath, JSON.stringify(mergedJson, null, 2))
      } else {
        // For all other files, just copy
        fs.copyFileSync(sourcePath, targetPath)
      }
    }
  })
}

interface FileEntry {
  sourcePath: string
  relativePath: string
}

function getAllFiles(
  dirPath: string,
  baseDir: string = dirPath,
  arrayOfFiles: FileEntry[] = [],
) {
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const fullPath = path.join(dirPath, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      if (file === 'ReactLynx') {
        // Flatten only the ReactLynx folder
        const reactLynxFiles = getAllFilesFromReactLynx(fullPath)
        arrayOfFiles.push(...reactLynxFiles)
      } else {
        // Recursively process other folders while maintaining their structure
        getAllFiles(fullPath, baseDir, arrayOfFiles)
      }
    } else {
      const relativePath = path.relative(baseDir, fullPath)
      arrayOfFiles.push({
        sourcePath: fullPath,
        relativePath: relativePath,
      })
    }
  })

  return arrayOfFiles
}

function getAllFilesFromReactLynx(reactLynxPath: string) {
  const files = fs.readdirSync(reactLynxPath)
  const arrayOfFiles: FileEntry[] = []

  files.forEach(file => {
    const fullPath = path.join(reactLynxPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      // Get files from subdirectories while maintaining their structure
      const subFiles = getAllFiles(fullPath, reactLynxPath)
      arrayOfFiles.push(...subFiles)
    } else {
      // Only flatten files directly in ReactLynx folder
      arrayOfFiles.push({
        sourcePath: fullPath,
        relativePath: file,
      })
    }
  })

  return arrayOfFiles
}

type Mode = 'merge' | 'create'

function handleComponentMode(mode: Mode) {
  const packagesDir = path.join(__dirname, '../../packages')
  const packages = fs.readdirSync(packagesDir)
    .filter(pkg => pkg.startsWith('lynx-ui-'))

  packages.forEach(packageName => {
    const packagePath = path.join(packagesDir, packageName)
    console.log(`Processing ${packageName} in ${mode} mode...`)
    processPackage(packagePath, packageName, mode)
  })
}

function processPackage(packagePath: string, packageName: string, mode: Mode) {
  if (mode === 'merge') {
    copyAndMergeRecursive(TEMPLATE_DIR, packagePath)
  } else if (mode === 'create') {
    // Assuming create logic is similar but may have different handling
    // createComponent(packagePath, packageName)
  }

  // Update references for the processed package
  updateTSConfigRefs().catch(error => console.error(error))
}

// =================== make examples ===================

function toKebabCase(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function copyAndModifyForExample(
  source: string,
  target: string,
  componentName: string,
) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  const files = fs.readdirSync(source)
  files.forEach(file => {
    const sourcePath = path.join(source, file)
    const targetPath = path.join(
      target,
      file.replace(/PrimitivesButton/g, componentName),
    )
    const isDirectory = fs.lstatSync(sourcePath).isDirectory()

    if (isDirectory) {
      copyAndModifyForExample(sourcePath, targetPath, componentName)
    } else {
      const content = fs.readFileSync(sourcePath, 'utf8')

      const placeholder = 'PrimitivesButton'
      const placeholderKebab = toKebabCase(placeholder)
      const componentNameKebab = toKebabCase(componentName)

      let newContent = content
        .replace(new RegExp(placeholder, 'g'), componentName)
        .replace(new RegExp(placeholderKebab, 'g'), componentNameKebab)

      if (file === 'package.json') {
        newContent = newContent.replace(
          'lynx-ui-new-component-examples',
          `lynx-ui-${toKebabCase(componentName)}-examples`,
        )
        newContent = newContent.replace(
          'NewComponent',
          `${componentName}`,
        )
      }

      fs.writeFileSync(targetPath, newContent)
    }
  })
}

function createExample(componentName: string) {
  console.log(`Creating new example for: ${componentName}`)
  const exampleTemplatePath = path.join(__dirname, 'examplesTemplate')
  const newExamplePath = path.join(
    __dirname,
    '../../apps/examples',
    componentName,
  )

  if (!fs.existsSync(exampleTemplatePath)) {
    console.error(
      `Error: Example template directory not found at ${exampleTemplatePath}. Please create it first.`,
    )
    throw new Error('Example template directory not found')
  }

  if (fs.existsSync(newExamplePath)) {
    console.error(
      `Error: Example directory already exists for ${componentName} at ${newExamplePath}`,
    )
    throw new Error('Example directory already exists')
  }

  copyAndModifyForExample(exampleTemplatePath, newExamplePath, componentName)

  console.log(`Successfully created example in ${newExamplePath}`)
}

function capitalize(str: string) {
  if (!str) {
    return str
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// =================== make examples end ===================

// Call handleComponentMode with the appropriate mode
function mergeTemplateWithPackages() {
  handleComponentMode('merge')
}

// Add new function to create a single component
function createSingleComponent(componentName: string) {
  console.log(`Creating new component: ${componentName}...`)
  makeNewComponent(componentName, [])
}

interface ProcessOptions {
  mergeOnly?: boolean
  createMode?: boolean
  componentName?: string
  exampleMode?: boolean
  exampleComponentName?: string
}

// Modify the processComponents function to handle create mode
function processComponents(options: ProcessOptions = {}) {
  const { mergeOnly, createMode, componentName } = options

  if (mergeOnly) {
    mergeTemplateWithPackages()
    return
  }

  if (createMode && componentName) {
    createSingleComponent(componentName)
    return
  }

  const components = fs.readdirSync(LYNX_UI_SRC)

  components.forEach(component => {
    const componentPath = path.join(LYNX_UI_SRC, component)

    // Skip if it's not a directory or if it's common/interfaces
    if (!fs.statSync(componentPath).isDirectory()) {
      return
    }

    // Get all files from the component directory (including ReactLynx subdirectory)
    const sourceFiles = getAllFiles(componentPath)

    // Create new component package
    makeNewComponent(component, sourceFiles)
  })
}

// Update the script execution to handle command line arguments
const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help')) {
  console.log(`
Usage: node tools/makeNewComponent/index.js [options]

Options:
  --help                    Show this help message.
  --create <ComponentName>  Create a new component package.
  --example <ComponentName> Create a new example for a component.
  --merge-only              Merge the template with all existing component packages.
  Example: tsx tools/make-new-component/index.ts --create Button
  `)
}

if (args.length === 0) {
  throw new Error('Help message displayed. Exiting program.')
}

const options: ProcessOptions = {
  mergeOnly: args.includes('--merge-only'),
  createMode: args.includes('--create'),
  componentName: args[args.indexOf('--create') + 1],
  exampleMode: args.includes('--example'),
  exampleComponentName: args[args.indexOf('--example') + 1],
}

if (options.createMode && !options.componentName) {
  console.error('Error: --create flag requires a component name')
  throw new Error('Error: --create flag requires a component name')
}

if (options.exampleMode && !options.exampleComponentName) {
  console.error('Error: --example flag requires a component name')
  throw new Error('Error: --example flag requires a component name')
}

if (options.exampleMode && options.exampleComponentName) {
  createExample(options.exampleComponentName)
} else {
  processComponents(options)
}
