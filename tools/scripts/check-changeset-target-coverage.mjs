// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import parseChangeset from '@changesets/parse'

import { isReleaseFile } from './check-changeset-coverage.mjs'

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function getChangedFiles(cwd, base, head) {
  if (!base || !head) {
    throw new Error('Both a pull request base and head commit are required')
  }

  const output = git(cwd, [
    'diff',
    '--no-renames',
    '--name-status',
    '-z',
    `${base}...${head}`,
  ])
  const entries = output.split('\0').filter(Boolean)
  const changedFiles = []
  for (let index = 0; index < entries.length; index += 2) {
    changedFiles.push({ status: entries[index], file: entries[index + 1] })
  }
  return changedFiles
}

function isChangesetFile(file) {
  return file.startsWith('.changeset/')
    && file.endsWith('.md')
    && path.posix.basename(file).toLowerCase() !== 'readme.md'
}

export function getWorkspacePackageMap(workspace, cwd = repoRoot) {
  if (!Array.isArray(workspace)) {
    throw new TypeError('Expected pnpm recursive list to return an array')
  }

  const packages = new Map()
  for (const pkg of workspace) {
    if (typeof pkg?.name !== 'string' || typeof pkg?.path !== 'string') {
      throw new TypeError(
        `Missing package identity or path for workspace entry`,
      )
    }
    const directory = path.relative(cwd, pkg.path).split(path.sep).join('/')
    packages.set(pkg.name, directory)
  }
  return packages
}

function getWorkspacePackageMapFromPnpm(cwd) {
  const output = execSync('pnpm --recursive list --json --depth=-1', {
    cwd,
    encoding: 'utf8',
  })
  return getWorkspacePackageMap(JSON.parse(output), cwd)
}

function hasOriginalReference(text) {
  return /https?:\/\/github\.com\/[^\s/]+\/[^\s/]+\/pull\/\d+|(?:^|[\s([{])#\d+\b|(?:^|[\s([{])[\da-f]{7,40}\b/iu
    .test(
      text,
    )
}

function parseChangesetAtRef(cwd, ref, file) {
  return parseChangeset(git(cwd, ['show', `${ref}:${file}`]))
}

export function checkChangesetTargetCoverage({
  cwd = repoRoot,
  base,
  head,
  workspacePackages,
  backfillLabel = false,
  pullRequestBody = '',
} = {}) {
  const changes = getChangedFiles(cwd, base, head)
  const changedFiles = changes.map(change => change.file)
  const changesetFiles = changes
    .filter(change => change.status !== 'D' && isChangesetFile(change.file))
    .map(change => change.file)
    .sort()
  const packages = workspacePackages ?? getWorkspacePackageMapFromPnpm(cwd)

  const changedPackages = [...packages.entries()]
    .map(([name, directory]) => ({
      name,
      directory,
      files: changedFiles.filter(file =>
        file.startsWith(`${directory}/`)
        && isReleaseFile(file.slice(directory.length + 1))
      ),
    }))
    .filter(pkg => pkg.files.length > 0)
    .sort((left, right) => left.name.localeCompare(right.name))

  const changedPackageNames = new Set(changedPackages.map(pkg => pkg.name))
  const changesetSummaries = changesetFiles.map(file => ({
    file,
    ...parseChangesetAtRef(cwd, head, file),
  }))
  const changesetOnly = changes.length > 0
    && changes.every(change => isChangesetFile(change.file))
  const hasReference = hasOriginalReference(pullRequestBody)
    || changesetSummaries.some(changeset =>
      hasOriginalReference(changeset.summary ?? '')
    )
  const bodyBackfillRequest = /^[ \t]*Changeset-Backfill:[ \t]*true[ \t]*$/imu
    .test(pullRequestBody)
  const backfillRequested = backfillLabel || bodyBackfillRequest
  const backfillAllowed = changesetOnly && backfillRequested && hasReference

  const failures = []
  let backfillUsed = false
  for (const changeset of changesetSummaries) {
    for (const release of changeset.releases) {
      const directory = packages.get(release.name)
      if (!directory) {
        failures.push({
          file: changeset.file,
          packageName: release.name,
          expectedDirectory: null,
          reason: 'target is not a current workspace package',
        })
      } else if (!changedPackageNames.has(release.name)) {
        if (backfillAllowed) {
          backfillUsed = true
          continue
        }
        failures.push({
          file: changeset.file,
          packageName: release.name,
          expectedDirectory: directory,
          reason: 'target has no relevant package-local change in this PR',
        })
      }
    }
  }

  return {
    backfillAllowed,
    backfillUsed,
    changedPackages,
    changesetFiles,
    failures,
  }
}

function readPullRequestEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is required for the pull request check')
  }
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
  if (!event.pull_request) {
    throw new Error(
      'Changeset target coverage runs on pull_request events only',
    )
  }
  return event.pull_request
}

function main() {
  const pullRequest = readPullRequestEvent()
  const head = process.env.GITHUB_SHA
  const result = checkChangesetTargetCoverage({
    base: pullRequest.base.sha,
    head,
    backfillLabel: pullRequest.labels?.some(
      label => label.name === 'changeset-backfill',
    ) ?? false,
    pullRequestBody: pullRequest.body ?? '',
  })

  console.log(
    `Checking ${result.changesetFiles.length} changed changeset files against ${result.changedPackages.length} changed packages.`,
  )
  if (result.failures.length === 0) {
    console.log(
      result.backfillUsed
        ? 'Changeset target coverage passed via the explicit backfill path.'
        : 'Changeset target coverage check passed.',
    )
    return
  }

  console.error('Changeset target coverage check failed:')
  for (const failure of result.failures) {
    console.error(`- ${failure.file}`)
    console.error(`  Unmatched target: ${failure.packageName}`)
    console.error(
      `  Expected package directory: ${
        failure.expectedDirectory ?? 'not found in the current workspace'
      }`,
    )
    console.error(`  Reason: ${failure.reason}`)
    console.error(
      `  Changed packages: ${
        result.changedPackages.length === 0
          ? 'none'
          : result.changedPackages.map(pkg => `${pkg.name} (${pkg.directory})`)
            .join(', ')
      }`,
    )
  }
  console.error(
    'A historical backfill must be a changeset-only PR with the changeset-backfill label or Changeset-Backfill: true in the PR description, and an original PR or commit reference in the changeset summary or PR description.',
  )
  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
