// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * @file Generate a minimal placeholder package for initial npm publish.
 *
 * The generated package uses version 0.0.0-oidc-bootstrap.0 and exists only to
 * enable npm Trusted Publisher setup before automated OIDC releases are ready.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.join(__dirname, '../..')
const defaultOut = path.join(repoRoot, 'tools/bootstrap-package/output')
const licensePath = path.join(repoRoot, 'LICENSE')
const bootstrapVersion = '0.0.0-oidc-bootstrap.0'

function formatPathForHelp(filePath) {
  const relPath = path.relative(process.cwd(), filePath)
  return relPath && !relPath.startsWith('..') ? relPath : filePath
}

const helpText = `
bootstrap-package - create a minimal placeholder package for initial npm publish.

This script creates a minimal placeholder package (${bootstrapVersion}) to enable
npm Trusted Publisher setup for subsequent automated releases.

Usage:
  pnpm bootstrap:package <package-dir> [options]

Options:
  --out <dir>    Output root directory (default: ${
  formatPathForHelp(defaultOut)
})
  --dry-run      Preview actions without writing anything
  --force        Overwrite existing output directory
  --private      Allow bootstrapping a package with "private": true
  --no-private   Disallow bootstrapping a package with "private": true (default)
  -h, --help     Show this help

Examples:
  pnpm bootstrap:package luna/packages/luna-stage
  pnpm bootstrap:package luna/packages/luna-stage --dry-run
  pnpm bootstrap:package luna/packages/luna-stage --force
`.trimStart()

function parseArguments() {
  try {
    const { positionals, values } = parseArgs({
      options: {
        'dry-run': { type: 'boolean' },
        force: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        out: { type: 'string', default: defaultOut },
        private: { type: 'boolean', default: false },
      },
      allowNegative: true,
      allowPositionals: true,
    })

    return {
      allowPrivate: values.private,
      dryRun: values['dry-run'],
      force: values.force,
      help: values.help,
      input: positionals[0] ?? null,
      out: path.resolve(values.out),
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error))
  }
}

function readJson(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse JSON at ${filePath}: ${message}`)
  }
}

function toJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function ensureTrailingNewline(value) {
  return value.endsWith('\n') ? value : `${value}\n`
}

function ensureWritable(dirPath) {
  try {
    fs.accessSync(dirPath, fs.constants.W_OK)
  } catch {
    throw new Error(`Directory not writable: ${dirPath}`)
  }
}

function validateOutputTarget(outDir, { force }) {
  if (fs.existsSync(outDir) && !force) {
    throw new Error(
      `Output already exists: ${outDir}\nUse --force to overwrite, or delete it manually.`,
    )
  }
}

function safeFolderName(packageName) {
  return String(packageName).replace(/^@/u, '').replaceAll('/', '__')
}

function validatePackageName(packageName) {
  const npmPackageNamePattern =
    /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/u

  if (!npmPackageNamePattern.test(packageName)) {
    throw new Error(`Invalid package name: ${packageName}`)
  }

  if (!packageName.startsWith('@')) {
    throw new Error(`Package name must be scoped, found: ${packageName}`)
  }
}

function validateInput(inputDir, packageJsonPath) {
  if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
    throw new Error(`Input directory not found: ${inputDir}`)
  }

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found: ${packageJsonPath}`)
  }

  if (!fs.existsSync(licensePath)) {
    throw new Error(`LICENSE not found at: ${licensePath}`)
  }
}

function buildManifest({ description, name }) {
  const baseDescription = description.trim()
  const finalDescription = baseDescription
    ? `${baseDescription} (OIDC bootstrap placeholder)`
    : 'Placeholder package published only to enable npm Trusted Publishing (OIDC) setup.'

  const packageJson = {
    name,
    version: bootstrapVersion,
    description: finalDescription,
    license: 'Apache-2.0',
    author: 'The Lynx Authors',
    files: [
      'README.md',
      'LICENSE',
    ],
    publishConfig: {
      access: 'public',
    },
  }

  const readmeText = ensureTrailingNewline(
    `# ${name}

> ${finalDescription}

This is a placeholder package published only to enable npm Trusted Publishing (OIDC) setup.

It contains no functional code and should not be installed.

A proper release will replace this package once OIDC is configured.
`,
  )

  const licenseText = ensureTrailingNewline(
    fs.readFileSync(licensePath, 'utf8'),
  )

  return [
    { content: toJson(packageJson), relativePath: 'package.json' },
    { content: readmeText, relativePath: 'README.md' },
    { content: licenseText, relativePath: 'LICENSE' },
  ]
}

function writeManifest(outDir, manifest, { force }) {
  validateOutputTarget(outDir, { force })
  if (force && fs.existsSync(outDir)) {
    fs.rmSync(outDir, { force: true, recursive: true })
  }

  const parentDir = path.dirname(outDir)
  fs.mkdirSync(parentDir, { recursive: true })
  ensureWritable(parentDir)

  fs.mkdirSync(outDir) // exclusive; fails if a target appeared concurrently

  for (const { content, relativePath } of manifest) {
    fs.writeFileSync(path.join(outDir, relativePath), content)
  }
}

function printSummary({
  description,
  dryRun,
  force,
  inputDir,
  manifest,
  name,
  outDir,
}) {
  const inputRelPath = path.relative(repoRoot, inputDir)
  const outRelPath = path.relative(repoRoot, outDir)

  console.log('bootstrap-package')
  console.log(`  input:  ${inputRelPath}`)
  console.log(`  name:   ${name}`)
  console.log(`  desc:   ${description || '(none)'}`)
  console.log(`  output: ${outRelPath}`)
  console.log(
    `  mode:   ${dryRun ? 'dry-run' : 'write'}${force ? ' +force' : ''}`,
  )
  console.log()

  console.log('Files:')
  for (const { relativePath } of manifest) {
    console.log(`  ${outRelPath}/${relativePath}`)
  }
  console.log()

  if (dryRun) {
    const packageJsonEntry = manifest.find(({ relativePath }) =>
      relativePath === 'package.json'
    )

    if (packageJsonEntry) {
      console.log('--- package.json (preview) ---')
      console.log(packageJsonEntry.content)
    }
  }
}

function printNextSteps(outDir) {
  const outRelPath = path.relative(repoRoot, outDir)

  console.log('Next steps:')
  console.log('  npm login --registry=https://registry.npmjs.org/')
  console.log(`  cd ${outRelPath}`)
  console.log(
    '  npm publish --access public --tag oidc-bootstrap --registry=https://registry.npmjs.org/',
  )
  console.log()
  console.log('After publish:')
  console.log(
    '  1. Configure Trusted Publisher on npmjs.com with this repo and workflow filename.',
  )
  console.log('  2. Delete the output folder after the bootstrap publish.')
  console.log('  3. Future releases should use OIDC Trusted Publishing.')
}

function main() {
  const { allowPrivate, dryRun, force, help, input, out } = parseArguments()

  if (help || !input) {
    process.stdout.write(helpText)
    process.exitCode = help ? 0 : 1
    return
  }

  const inputDir = path.resolve(process.cwd(), input)
  const packageJsonPath = path.join(inputDir, 'package.json')

  validateInput(inputDir, packageJsonPath)

  const sourcePackage = readJson(packageJsonPath)

  if (sourcePackage?.private === true && !allowPrivate) {
    throw new Error(
      `Refusing to bootstrap a private package: ${
        path.relative(repoRoot, packageJsonPath)
      }\nSet "private": false, remove it, or pass --private to override.`,
    )
  }

  const name = sourcePackage?.name
  if (!name || typeof name !== 'string') {
    throw new Error(`Missing or invalid "name" in ${packageJsonPath}`)
  }

  validatePackageName(name)

  const description = String(sourcePackage?.description ?? '').trim()
  const outDir = path.join(out, safeFolderName(name))
  const manifest = buildManifest({ description, name })

  validateOutputTarget(outDir, { force })

  printSummary({
    description,
    dryRun,
    force,
    inputDir,
    manifest,
    name,
    outDir,
  })

  if (dryRun) {
    return
  }

  fs.mkdirSync(out, { recursive: true })
  ensureWritable(out)
  writeManifest(outDir, manifest, { force })

  console.log('Success: Bootstrap package generated.')
  console.log()
  printNextSteps(outDir)
}

try {
  main()
} catch (error) {
  console.error(
    'Error:',
    error instanceof Error ? error.message : String(error),
  )
  process.exitCode = 1
}
