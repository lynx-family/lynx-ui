// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import parseChangeset from '@changesets/parse'

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)
const changesetDir = path.join(repoRoot, '.changeset')

function readJson(text, source) {
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse JSON from ${source}: ${message}`)
  }
}

function getChangesetFiles() {
  // README.md documents Changesets itself and is not a release declaration.
  return fs
    .readdirSync(changesetDir)
    .filter(
      fileName =>
        fileName.endsWith('.md') && fileName.toLowerCase() !== 'readme.md',
    )
    .map(fileName => path.join(changesetDir, fileName))
    .sort()
}

export function getChangesetPackageNames(changesetText) {
  return parseChangeset(changesetText).releases.map(release => release.name)
}

export function getPrivateWorkspacePackageNames(workspace) {
  if (!Array.isArray(workspace)) {
    throw new TypeError('Expected pnpm recursive list to return an array')
  }

  const packageNames = new Set()

  for (const pkg of workspace) {
    if (pkg?.private !== true) {
      continue
    }

    if (typeof pkg.name !== 'string' || pkg.name.length === 0) {
      throw new TypeError(`Missing package name for workspace at ${pkg?.path}`)
    }

    packageNames.add(pkg.name)
  }

  return packageNames
}

function getWorkspacePrivatePackageNames() {
  // Let pnpm resolve workspace membership so this check follows the same
  // package discovery rules as the rest of the repository tooling.
  const output = execFileSync(
    'pnpm',
    ['--recursive', 'list', '--json', '--depth=-1'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  )

  return getPrivateWorkspacePackageNames(
    readJson(output, 'pnpm recursive list'),
  )
}

function formatFilePath(filePath) {
  return path.relative(repoRoot, filePath)
}

export function checkChangesets(privatePackageNames, changesets) {
  // Compare complete package names so scoped and unscoped packages remain
  // distinct and only current private workspace packages are rejected.
  return changesets
    .map(({ filePath, text }) => ({
      filePath,
      privateTargets: getChangesetPackageNames(text).filter(name =>
        privatePackageNames.has(name)
      ),
    }))
    .filter(entry => entry.privateTargets.length > 0)
}

function main() {
  const privatePackageNames = getWorkspacePrivatePackageNames()
  const changesets = getChangesetFiles().map(filePath => ({
    filePath,
    text: fs.readFileSync(filePath, 'utf8'),
  }))
  const failures = checkChangesets(privatePackageNames, changesets)

  if (failures.length === 0) {
    console.log('Changeset private target check passed.')
    return
  }

  console.error('Changesets must not target private workspace packages.')
  console.error(
    'Remove the private package entries or make the package publishable before adding a changeset.',
  )
  console.error()

  for (const failure of failures) {
    console.error(`- ${formatFilePath(failure.filePath)}`)
    console.error(`  Private targets: ${failure.privateTargets.join(', ')}`)
  }

  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
