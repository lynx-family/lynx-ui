// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

import parseChangeset from '@changesets/parse'
import ts from 'typescript'
import { parse as parseYaml } from 'yaml'

import { isWorkspacePackage } from './check-new-publishable-packages.mjs'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function readManifest(cwd, ref, directory) {
  return JSON.parse(git(cwd, ['show', `${ref}:${directory}/package.json`]))
}

export function getLastRelease(cwd, ref) {
  // Use the latest release on main's first-parent history, including releases
  // that only published examples or LUNA packages.
  return git(cwd, [
    'describe',
    '--first-parent',
    '--tags',
    '--abbrev=0',
    '--match',
    '@lynx-js/*@*',
    '--match',
    '@lynx-example/*@*',
    ref,
  ]).trim()
}

function isReleaseFile(file) {
  return !/(?:^|\/)(?:docs|__tests__|__snapshots__|tests)(?:\/|$)/u.test(file)
    && !/\.(?:test|spec)\.[^/]+$/u.test(file)
    && (!/\.mdx?$/iu.test(file) || path.posix.basename(file) === 'SKILL.md')
}

function hasSourceChanges(cwd, baseline, ref, file) {
  const previous = git(cwd, ['ls-tree', '--name-only', baseline, '--', file])
    .trim()
  const current = git(cwd, ['ls-tree', '--name-only', ref, '--', file]).trim()
  if (!previous || !current) {
    return true
  }
  if (file.endsWith('/package.json')) {
    const directory = path.posix.dirname(file)
    const before = readManifest(cwd, baseline, directory)
    const after = readManifest(cwd, ref, directory)
    return !isDeepStrictEqual({ ...before, version: after.version }, after)
  }
  if (/\.[cm]?[jt]sx?$/u.test(file)) {
    // Ignore comments and formatting while retaining public type changes.
    const printer = ts.createPrinter({ removeComments: true })
    const printAtRef = revision =>
      printer.printFile(ts.createSourceFile(
        file,
        git(cwd, ['show', `${revision}:${file}`]),
        ts.ScriptTarget.Latest,
        true,
      ))
    return printAtRef(baseline) !== printAtRef(ref)
  }
  return true
}

function isChangesetFile(file) {
  return /^\.changeset\/[^./][^/]*\.md$/u.test(file)
    && path.posix.basename(file).toLowerCase() !== 'readme.md'
}

function getWorkspacePackages(cwd, ref) {
  const config = parseYaml(git(cwd, ['show', `${ref}:pnpm-workspace.yaml`]))
  if (!Array.isArray(config.packages)) {
    throw new Error('pnpm-workspace.yaml must declare workspace packages')
  }
  const manifests = git(cwd, ['ls-tree', '-r', '--name-only', '-z', ref]).split(
    '\0',
  )
    .filter(file => file.endsWith('/package.json'))
  const packages = new Map()
  for (const file of manifests) {
    const directory = path.posix.dirname(file)
    if (!isWorkspacePackage(file, config.packages)) {
      continue
    }
    const manifest = readManifest(cwd, ref, directory)
    if (packages.has(manifest.name)) {
      throw new Error(`Duplicate workspace package: ${manifest.name}`)
    }
    packages.set(manifest.name, {
      directory,
      private: manifest.private === true,
    })
  }
  return packages
}

export function checkTargets(
  { cwd = repoRoot, base, ref, allowBackfill = false, referenceText = '' } = {},
) {
  if (!base || !ref) {
    throw new Error(
      'Target validation requires --base <base-sha> and --ref <pr-head-sha>',
    )
  }
  const baseline = git(cwd, ['merge-base', base, ref]).trim()
  const files = git(cwd, [
    'diff',
    '--no-renames',
    '--name-only',
    '-z',
    baseline,
    ref,
  ]).split('\0').filter(Boolean)
  const changesetFiles = files.filter(file => isChangesetFile(file)).filter(
    file => git(cwd, ['ls-tree', '--name-only', ref, '--', file]).trim(),
  )
  const packages = getWorkspacePackages(cwd, ref)
  const changed = new Set()
  const failures = []
  for (const [name, pkg] of packages) {
    if (
      files.some(file =>
        file.startsWith(`${pkg.directory}/`)
        && isReleaseFile(file.slice(pkg.directory.length + 1))
        && hasSourceChanges(cwd, baseline, ref, file)
      )
    ) {
      changed.add(name)
    }
  }
  for (const file of changesetFiles) {
    const changeset = parseChangeset(git(cwd, ['show', `${ref}:${file}`]))
    for (const release of changeset.releases) {
      const pkg = packages.get(release.name)
      if (!pkg || pkg.private || !changed.has(release.name)) {
        failures.push({
          file,
          name: release.name,
          directory: pkg?.directory,
          summary: changeset.summary,
          private: pkg?.private === true,
        })
      }
    }
  }
  // A focused, explicitly labelled backfill may refer to previously merged
  // source. It never exempts unknown/private targets or a PR containing code.
  const hasReference = text =>
    /https:\/\/github\.com\/lynx-family\/lynx-ui\/(?:pull\/\d+|commit\/[a-f0-9]{7,40})\b|(?:^|\s)#\d+\b|\b[a-f0-9]{7,40}\b/u
      .test(text)
  const backfill = failures.length > 0 && allowBackfill
    && files.every(file => isChangesetFile(file))
    && failures.every(failure =>
      failure.directory && !failure.private
      && hasReference(`${referenceText}\n${failure.summary}`)
    )
  return { failures: backfill ? [] : failures, changed: [...changed], backfill }
}

export function checkCoverage({ cwd = repoRoot, ref, releaseRef, since } = {}) {
  if (!ref || !releaseRef) {
    throw new Error(
      'Both --ref <source-ref> and --release-ref <release-pr-ref> are required',
    )
  }
  const baseline = since || getLastRelease(cwd, ref)
  git(cwd, ['merge-base', '--is-ancestor', baseline, ref])
  const files = git(cwd, [
    'diff',
    '--no-renames',
    '--name-only',
    '-z',
    baseline,
    ref,
    '--',
    'packages',
    'apps/examples',
    'luna/packages',
  ]).split('\0').filter(Boolean)
  const groups = new Map()
  for (const file of files) {
    const match = /^((?:packages|apps\/examples|luna\/packages)\/[^/]+)\/(.+)$/u
      .exec(file)
    if (!match || !isReleaseFile(match[2])) {
      continue
    }
    const directory = match[1]
    const entries = groups.get(directory) || []
    entries.push(file)
    groups.set(directory, entries)
  }
  const missing = []
  for (const [directory, entries] of groups) {
    // Deleted packages no longer need publishing.
    if (
      !git(cwd, [
        'ls-tree',
        '--name-only',
        ref,
        '--',
        `${directory}/package.json`,
      ]).trim()
    ) {
      continue
    }
    const source = readManifest(cwd, ref, directory)
    if (source.private === true) {
      continue
    }
    const changedFiles = entries.filter(file =>
      hasSourceChanges(cwd, baseline, ref, file)
    )
    if (changedFiles.length === 0) {
      continue
    }
    // The release branch has consumed its changesets; inspect the resulting
    // version bump instead of requiring the removed Markdown files.
    const released = readManifest(cwd, releaseRef, directory)
    if (released.name !== source.name || released.version === source.version) {
      missing.push({ name: source.name, directory, files: changedFiles })
    }
  }
  return { baseline, missing }
}

function main() {
  const args = process.argv.slice(2)
  const options = {}
  let targets = false
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]
    if (flag === '--targets') {
      targets = true
      continue
    }
    if (
      !['--ref', '--release-ref', '--since', '--base'].includes(flag)
      || !args[index + 1]
      || args[index + 1].startsWith('--')
    ) {
      throw new Error(
        'Usage: check-changeset-coverage.mjs --ref <source-ref> --release-ref <release-pr-ref> [--since <release-ref>] or --targets --base <base-sha> --ref <pr-head-sha>',
      )
    }
    const key = flag === '--release-ref' ? 'releaseRef' : flag.slice(2)
    index += 1
    options[key] = args[index]
  }
  if (targets) {
    const event = process.env.GITHUB_EVENT_PATH
      ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
      : {}
    const result = checkTargets({
      ...options,
      allowBackfill: process.env.CHANGESET_BACKFILL === 'true',
      referenceText: event.pull_request?.body || '',
    })
    if (result.failures.length === 0) {
      console.log(
        result.backfill
          ? 'Explicit changeset backfill accepted.'
          : 'Changeset package target check passed.',
      )
      return
    }
    console.error('Changeset targets without matching package-local changes:')
    for (const failure of result.failures) {
      console.error(`- ${failure.file}: ${failure.name}`)
      console.error(
        `  Expected directory: ${
          failure.directory || '(not a workspace package)'
        }${failure.private ? ' (private)' : ''}`,
      )
    }
    console.error(
      `Packages changed by this PR: ${result.changed.join(', ') || '(none)'}`,
    )
    console.error(
      'Correct the targets. For historical backfills, use a changeset-only PR labelled changeset-backfill and reference the original PR or commit.',
    )
    process.exitCode = 1
    return
  }
  const { baseline, missing } = checkCoverage(options)
  console.log(`Checking package changes since release ${baseline}.`)
  if (missing.length === 0) {
    console.log('Release changeset coverage check passed.')
    return
  }
  console.error(
    'Changed publishable packages missing a version bump in the release PR:',
  )
  for (const pkg of missing) {
    console.error(`- ${pkg.name} (${pkg.directory})`)
    for (const file of pkg.files) {
      console.error(`  ${file}`)
    }
  }
  console.error(
    'Add missing changesets to main and let the release workflow regenerate the release PR.',
  )
  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
