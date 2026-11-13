// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { parse } from 'yaml'

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

const REQUIRED_SOURCE_TEST_EXCLUSIONS = [
  '!src/**/*.test.*',
  '!src/**/__tests__/**',
]

const DISALLOWED_FILE_PATTERNS = [
  /^tsconfig(?:\.[^/]+)?\.json$/u,
  /^docs(?:\/\*\*)?$/u,
  /^README_zh\.md$/u,
]

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false
    }

    throw error
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

function globToRegExp(glob) {
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

function normalizePosixPath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//u, '').replace(/\/+$/u, '')
}

function isWorkspacePackage(manifestRelPath, workspacePatterns) {
  const normalized = normalizePosixPath(manifestRelPath)
  if (normalized === 'package.json') {
    return false
  }

  const packageDirectory = path.posix.dirname(normalized)
  const includes = workspacePatterns.filter(pattern => !pattern.startsWith('!'))
  const excludes = workspacePatterns
    .filter(pattern => pattern.startsWith('!'))
    .map(pattern => pattern.slice(1))

  return includes.some(pattern => globToRegExp(pattern).test(packageDirectory))
    && !excludes.some(pattern => globToRegExp(pattern).test(packageDirectory))
}

function findWorkspaceManifestPaths(root) {
  const workspacePath = path.join(root, 'pnpm-workspace.yaml')
  const workspace = parse(fs.readFileSync(workspacePath, 'utf8'))
  const workspacePatterns = workspace?.packages

  if (!Array.isArray(workspacePatterns)) {
    throw new TypeError(
      `Expected "packages" to be an array in ${workspacePath}`,
    )
  }

  const manifestRelPaths = []

  function walk(currentDir) {
    const entries = fs
      .readdirSync(currentDir, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))

    for (const entry of entries) {
      if (
        entry.name === 'node_modules'
        || entry.name === '.git'
        || entry.name === 'dist'
        || entry.name === '.turbo'
        || entry.name === 'output'
      ) {
        continue
      }

      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name === 'package.json') {
        const relPath = normalizePosixPath(path.relative(root, fullPath))
        if (isWorkspacePackage(relPath, workspacePatterns)) {
          manifestRelPaths.push(relPath)
        }
      }
    }
  }

  walk(root)
  return manifestRelPaths.sort()
}

function collectExportTargets(exportsField, targets = []) {
  if (typeof exportsField === 'string') {
    targets.push(exportsField)
    return targets
  }

  if (Array.isArray(exportsField)) {
    for (const item of exportsField) {
      collectExportTargets(item, targets)
    }
    return targets
  }

  if (exportsField && typeof exportsField === 'object') {
    for (const value of Object.values(exportsField)) {
      collectExportTargets(value, targets)
    }
  }

  return targets
}

function getEntryTargets(manifest) {
  const candidates = []

  for (const field of ['main', 'module', 'types', 'jsnext:source']) {
    if (typeof manifest[field] === 'string' && manifest[field].length > 0) {
      candidates.push({ field, target: manifest[field] })
    }
  }

  for (const target of collectExportTargets(manifest.exports)) {
    if (typeof target === 'string' && target.length > 0) {
      candidates.push({ field: 'exports', target })
    }
  }

  return candidates
}

function fileEntryMatchesTarget(entry, relativeTarget) {
  const normalizedEntry = normalizePosixPath(entry)
  const normalizedTarget = normalizePosixPath(relativeTarget)

  if (normalizedEntry === normalizedTarget) {
    return true
  }

  if (normalizedEntry.endsWith('/**')) {
    const prefix = normalizedEntry.slice(0, -3)
    return normalizedTarget.startsWith(`${prefix}/`)
  }

  if (!normalizedEntry.includes('*') && !normalizedEntry.includes('?')) {
    return normalizedTarget.startsWith(`${normalizedEntry}/`)
  }

  return globToRegExp(normalizedEntry).test(normalizedTarget)
}

function isTargetCoveredByFiles(files, relativeTarget) {
  const normalizedTarget = normalizePosixPath(relativeTarget)
  let included = false

  for (const entry of files) {
    if (entry.startsWith('!')) {
      if (fileEntryMatchesTarget(entry.slice(1), normalizedTarget)) {
        included = false
      }
    } else if (fileEntryMatchesTarget(entry, normalizedTarget)) {
      included = true
    }
  }

  return included
}

function findTestFilesInDir(dirPath, rootDir = dirPath) {
  if (!fs.existsSync(dirPath)) {
    return []
  }

  const results = []
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') {
      continue
    }

    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      results.push(...findTestFilesInDir(fullPath, rootDir))
    } else {
      const relPath = normalizePosixPath(path.relative(rootDir, fullPath))
      const segments = relPath.split('/')
      if (
        segments.includes('__tests__')
        || /\.(?:test|spec)\.[^.]+$/u.test(entry.name)
      ) {
        results.push(relPath)
      }
    }
  }

  return results.sort()
}

export function inspectPackageManifest(
  packageDir,
  manifest,
  { checkDist = false, packageRelPath = path.basename(packageDir) } = {},
) {
  const issues = []
  const normalizedRelPath = normalizePosixPath(packageRelPath)

  if (manifest.repository && typeof manifest.repository === 'object') {
    const repoDir = manifest.repository.directory
    if (
      typeof repoDir === 'string'
      && normalizePosixPath(repoDir) !== normalizedRelPath
    ) {
      issues.push(
        `repository.directory "${repoDir}" does not match package path "${normalizedRelPath}"`,
      )
    }
  }

  if (
    typeof manifest.name === 'string'
    && manifest.name.startsWith('@')
    && manifest.publishConfig?.access !== 'public'
  ) {
    issues.push(
      'scoped publishable package must set publishConfig.access to "public"',
    )
  }

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    issues.push('package.json must declare a non-empty "files" array')
    return issues
  }

  const seenEntries = new Set()
  for (const entry of manifest.files) {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      issues.push('every entry in "files" must be a non-empty string')
      continue
    }

    if (seenEntries.has(entry)) {
      issues.push(`duplicate entry "${entry}" in "files"`)
    }
    seenEntries.add(entry)

    if (entry.startsWith('!')) {
      continue
    }

    const normalizedEntry = normalizePosixPath(entry)
    if (
      DISALLOWED_FILE_PATTERNS.some(pattern => pattern.test(normalizedEntry))
    ) {
      issues.push(
        `unneeded internal file "${entry}" must not be included in "files"`,
      )
    }

    const cleanTarget = normalizePosixPath(
      entry.replace(/\/\*\*$/u, ''),
    )
    if (cleanTarget.includes('*') || cleanTarget.includes('?')) {
      continue
    }

    const isBuildOutput = cleanTarget === 'dist'
      || cleanTarget.startsWith('dist/')
    const isPrepackGenerated = cleanTarget === 'references'
      && manifest.scripts?.prepack
    // Unreleased packages list CHANGELOG.md before Changesets creates it on first release.
    const isChangesetChangelog = cleanTarget === 'CHANGELOG.md'

    if (
      (isBuildOutput && !checkDist)
      || isPrepackGenerated
      || isChangesetChangelog
    ) {
      continue
    }

    if (!fs.existsSync(path.join(packageDir, cleanTarget))) {
      issues.push(`"files" entry "${entry}" does not exist on disk`)
    }
  }

  if (!isFile(path.join(packageDir, 'LICENSE'))) {
    issues.push('missing LICENSE file in package directory')
  }
  if (!manifest.files.includes('LICENSE')) {
    issues.push('"files" must include "LICENSE"')
  }

  if (
    isFile(path.join(packageDir, 'README.md'))
    && !manifest.files.includes('README.md')
  ) {
    issues.push('"files" must include "README.md" when README.md exists')
  }

  if (
    isFile(path.join(packageDir, 'CHANGELOG.md'))
    && !manifest.files.includes('CHANGELOG.md')
  ) {
    issues.push('"files" must include "CHANGELOG.md" when CHANGELOG.md exists')
  }

  if (
    isFile(path.join(packageDir, 'SKILL.md'))
    && !manifest.files.includes('SKILL.md')
  ) {
    issues.push('"files" must include "SKILL.md" when SKILL.md exists')
  }

  const includesSrc = manifest.files.some(entry => {
    const normalized = normalizePosixPath(entry)
    return normalized === 'src' || normalized === 'src/**'
  })

  if (includesSrc) {
    if (
      manifest.files.some(entry => normalizePosixPath(entry) === 'src/**')
    ) {
      issues.push(
        'use "src" instead of "src/**" in "files" so pnpm pack honors negation exclusions',
      )
    }

    for (const exclusion of REQUIRED_SOURCE_TEST_EXCLUSIONS) {
      if (!manifest.files.includes(exclusion)) {
        issues.push(
          `"files" includes src/ without required test exclusion "${exclusion}"`,
        )
      }
    }

    const leakedTestFiles = findTestFilesInDir(
      path.join(packageDir, 'src'),
      packageDir,
    ).filter(relPath => isTargetCoveredByFiles(manifest.files, relPath))

    for (const leakedFile of leakedTestFiles) {
      issues.push(`test file "${leakedFile}" would be included by "files"`)
    }
  }

  for (const { field, target } of getEntryTargets(manifest)) {
    const normalizedTarget = normalizePosixPath(target)
    if (!isTargetCoveredByFiles(manifest.files, normalizedTarget)) {
      issues.push(
        `${field} target "${target}" is not covered by "files"`,
      )
    }

    const isDistTarget = normalizedTarget === 'dist'
      || normalizedTarget.startsWith('dist/')
    if (
      (!isDistTarget || checkDist)
      && !fs.existsSync(path.join(packageDir, normalizedTarget))
    ) {
      issues.push(`${field} target "${target}" does not exist on disk`)
    }
  }

  return issues
}

export function inspectWorkspacePackageFiles(
  root = repoRoot,
  { checkDist = false } = {},
) {
  const manifestRelPaths = findWorkspaceManifestPaths(root)
  const checkedPackages = []
  const failures = []

  for (const manifestRelPath of manifestRelPaths) {
    const packageDir = path.join(root, path.dirname(manifestRelPath))
    const packageRelPath = normalizePosixPath(path.dirname(manifestRelPath))
    const manifest = readJson(path.join(root, manifestRelPath))

    if (manifest.private === true) {
      continue
    }

    checkedPackages.push(packageRelPath)
    const issues = inspectPackageManifest(packageDir, manifest, {
      checkDist,
      packageRelPath,
    })

    if (issues.length > 0) {
      failures.push({
        name: manifest.name ?? packageRelPath,
        packageRelPath,
        issues,
      })
    }
  }

  return { checkedPackages, failures }
}

function main() {
  const checkDist = process.argv.includes('--check-dist')
  const { checkedPackages, failures } = inspectWorkspacePackageFiles(
    repoRoot,
    { checkDist },
  )

  if (failures.length === 0) {
    console.log(
      `Package files check passed for ${checkedPackages.length} publishable packages${
        checkDist ? ' (including dist targets)' : ''
      }.`,
    )
    return
  }

  console.error('Package files validation failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name} (${failure.packageRelPath})`)
    for (const issue of failure.issues) {
      console.error(`  * ${issue}`)
    }
  }

  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
