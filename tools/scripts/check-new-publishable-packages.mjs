// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFile, execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { parse } from 'yaml'

const execFileAsync = promisify(execFile)
const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

function runGit(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

function readJson(text, source) {
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse JSON from ${source}: ${message}`)
  }
}

function safeFolderName(packageName) {
  return String(packageName).replace(/^@/u, '').replaceAll('/', '__')
}

function getNpmAccessUrl(packageName) {
  return `https://www.npmjs.com/package/${String(packageName)}/access`
}

function globToRegExp(glob) {
  // Workspace patterns only need directory matching, so keep this conversion
  // intentionally limited to the glob tokens used by pnpm-workspace.yaml.
  let pattern = '^'

  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index]

    if (character === '*' && glob[index + 1] === '*') {
      if (glob[index + 2] === '/') {
        pattern += '(?:.*/)?'
        index += 2
      } else {
        pattern += '.*'
        index += 1
      }
    } else if (character === '*') {
      pattern += '[^/]*'
    } else if (character === '?') {
      pattern += '[^/]'
    } else {
      pattern += character.replace(/[\\^$.*+?()[\]{}|]/gu, '\\$&')
    }
  }

  return new RegExp(`${pattern}$`, 'u')
}

function isWorkspacePackage(manifestPath, workspacePatterns) {
  if (manifestPath === 'package.json') {
    return true
  }

  const packageDirectory = path.posix.dirname(manifestPath)
  const includes = workspacePatterns.filter(pattern => !pattern.startsWith('!'))
  const excludes = workspacePatterns
    .filter(pattern => pattern.startsWith('!'))
    .map(pattern => pattern.slice(1))

  return includes.some(pattern => globToRegExp(pattern).test(packageDirectory))
    && !excludes.some(pattern => globToRegExp(pattern).test(packageDirectory))
}

function getPublishablePackageNamesAtRef(ref) {
  // Rebuild the workspace package set from the base commit instead of the
  // checked-out files, which may already contain new or renamed packages.
  const workspaceText = runGit(['show', `${ref}:pnpm-workspace.yaml`])
  const workspace = parse(workspaceText)
  const workspacePatterns = workspace?.packages

  if (!Array.isArray(workspacePatterns)) {
    throw new TypeError(
      `Expected "packages" to be an array in pnpm-workspace.yaml at ${ref}`,
    )
  }

  const manifestPaths = runGit(['ls-tree', '-r', '--name-only', ref])
    .split('\n')
    .filter(filePath =>
      filePath.endsWith('/package.json') || filePath === 'package.json'
    )
    .filter(filePath => isWorkspacePackage(filePath, workspacePatterns))

  const packageNames = new Set()

  for (const manifestPath of manifestPaths) {
    const manifest = readJson(
      runGit(['show', `${ref}:${manifestPath}`]),
      `${ref}:${manifestPath}`,
    )

    if (manifest.private === true) {
      continue
    }

    if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
      throw new TypeError(`Missing package name in ${ref}:${manifestPath}`)
    }

    packageNames.add(manifest.name)
  }

  return packageNames
}

function getCurrentPublishablePackages() {
  // Let pnpm resolve the current workspace so this stays aligned with its
  // package discovery behavior.
  const output = execFileSync(
    'pnpm',
    ['--recursive', 'list', '--json', '--depth=-1'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  )
  const workspace = readJson(output, 'pnpm recursive list')

  if (!Array.isArray(workspace)) {
    throw new TypeError('Expected pnpm recursive list to return an array')
  }

  return workspace
    .filter(pkg => pkg.private !== true)
    .map(pkg => {
      if (typeof pkg.name !== 'string' || pkg.name.length === 0) {
        throw new TypeError(`Missing package name for workspace at ${pkg.path}`)
      }

      return {
        name: pkg.name,
        path: path.relative(repoRoot, pkg.path),
      }
    })
}

export function getNewPublishablePackages(currentPackages, basePackageNames) {
  return currentPackages.filter(pkg => !basePackageNames.has(pkg.name))
}

export function parsePublishedVersions(output, packageName) {
  const versions = readJson(output, `npm view ${packageName} versions`)

  if (Array.isArray(versions)) {
    return versions.filter(version =>
      typeof version === 'string' && version.length > 0
    )
  }

  return typeof versions === 'string' && versions.length > 0 ? [versions] : []
}

async function getPublishedVersions(packageName) {
  // Query all versions because a bootstrap release may only have a custom
  // dist-tag and therefore no "latest" version.
  const { stdout } = await execFileAsync(
    'npm',
    ['view', packageName, 'versions', '--json'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  )

  return parsePublishedVersions(stdout, packageName)
}

async function checkPublishedPackages(packages) {
  return Promise.all(
    packages.map(async pkg => {
      try {
        const versions = await getPublishedVersions(pkg.name)
        return { ...pkg, versions }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return { ...pkg, error: message, versions: [] }
      }
    }),
  )
}

function parseArguments(args) {
  const baseIndex = args.indexOf('--base')
  const base = baseIndex === -1 ? null : args[baseIndex + 1]

  if (!base) {
    throw new Error(
      'Usage: check-new-publishable-packages.mjs --base <git-ref>',
    )
  }

  return { base }
}

async function main() {
  const { base } = parseArguments(process.argv.slice(2))
  const basePackageNames = getPublishablePackageNamesAtRef(base)
  const currentPackages = getCurrentPublishablePackages()
  // Comparing complete names also detects private-to-public transitions and
  // scope changes while ignoring directory-only moves.
  const newPackages = getNewPublishablePackages(
    currentPackages,
    basePackageNames,
  )

  if (newPackages.length === 0) {
    console.log('No new publishable packages detected.')
    return
  }

  console.log('New publishable packages:')
  for (const pkg of newPackages) {
    console.log(`- ${pkg.name} (${pkg.path})`)
  }

  const results = await checkPublishedPackages(newPackages)
  const unpublishedPackages = results.filter(
    result => result.versions.length === 0,
  )

  if (unpublishedPackages.length === 0) {
    console.log('All new publishable packages already have npm versions.')
    return
  }

  console.error()
  console.error(
    'The following packages do not have a published npm version or could not be verified:',
  )

  for (const pkg of unpublishedPackages) {
    const outputDir = path.join(
      'tools/bootstrap-package/output',
      safeFolderName(pkg.name),
    )

    console.error(`- ${pkg.name} (${pkg.path})`)
    if (pkg.error) {
      console.error(`  npm view failed: ${pkg.error}`)
    }
    console.error(`  Bootstrap with: pnpm bootstrap:package ${pkg.path}`)
    console.error(`  Then publish placeholder:`)
    console.error(`    npm login --registry=https://registry.npmjs.org/`)
    console.error(`    cd ${outputDir}`)
    console.error(
      `    npm publish --access public --tag oidc-bootstrap --registry=https://registry.npmjs.org/`,
    )
    console.error(`  Then configure Trusted Publisher (OIDC):`)
    console.error(`    ${getNpmAccessUrl(pkg.name)}`)
  }

  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
