// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  collectIncludedComponents,
  componentSlugFromPackageName,
  getExampleAppDirname,
} from './generate-references.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..', '..')
const skillPackageName = '@lynx-js/skill-lynx-ui'
const skillPackageDir = 'packages/skill-lynx-ui'
const changesetDir = path.join(workspaceRoot, '.changeset')
const generatedChangesetPath = path.join(
  changesetDir,
  'skill-lynx-ui-auto.md',
)

const directSkillSourcePrefixes = [
  `${skillPackageDir}/`,
  'tools/skill-lynx-ui/',
]

const componentSkillSourceFiles = [
  'SKILL.md',
  'src/types/index.docs.ts',
  'types/index.docs.ts',
]

function runGit(args) {
  return execFileSync('git', args, {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function getBaseRefCandidates() {
  const candidates = []
  const envBaseRef = process.env.SKILL_LYNX_UI_BASE_REF
    || process.env.GITHUB_BASE_REF
    || process.env.CHANGESET_BASE_BRANCH

  if (envBaseRef) {
    const normalized = envBaseRef.replace(/^refs\/heads\//, '')
    candidates.push(`origin/${normalized}`, normalized)
  }

  candidates.push('origin/main', 'main')

  return [...new Set(candidates)]
}

function resolveMergeBase() {
  for (const candidate of getBaseRefCandidates()) {
    try {
      return runGit(['merge-base', candidate, 'HEAD'])
    } catch {
      try {
        runGit(['rev-parse', '--verify', `${candidate}^{commit}`])
        return candidate
      } catch {
        // Try the next candidate.
      }
    }
  }

  throw new Error(
    'Unable to resolve a base ref for skill changeset generation.',
  )
}

function getChangedFiles() {
  const mergeBase = resolveMergeBase()
  const output = runGit(['diff', '--name-only', `${mergeBase}...HEAD`])

  return output
    ? output.split('\n').map(filePath => filePath.trim()).filter(Boolean)
    : []
}

function isDirectSkillSourceChange(filePath) {
  return directSkillSourcePrefixes.some(prefix => filePath.startsWith(prefix))
}

function isComponentSkillSourceChange(filePath, packageDir) {
  return componentSkillSourceFiles.some(sourceFile =>
    filePath === `${packageDir}/${sourceFile}`
  )
}

function isExampleSourceChange(filePath, packageDir) {
  const packageDirName = path.basename(packageDir)
  const componentSlug = componentSlugFromPackageName(packageDirName)
  const exampleDirName = getExampleAppDirname(componentSlug)
  const examplePrefix = `apps/examples/${exampleDirName}/`

  return filePath.startsWith(examplePrefix) && filePath.endsWith('/index.tsx')
}

async function getSkillRelevantChanges(changedFiles) {
  const includedComponents = await collectIncludedComponents()
  const sourcePackageDirs = includedComponents.map(
    component => `packages/${component.packageDirName}`,
  )

  return changedFiles.filter(filePath => {
    if (isDirectSkillSourceChange(filePath)) {
      return true
    }

    return sourcePackageDirs.some(
      packageDir =>
        isComponentSkillSourceChange(filePath, packageDir)
        || isExampleSourceChange(filePath, packageDir),
    )
  })
}

function parseChangesetPackages(content) {
  const lines = content.split('\n')
  if (lines[0] !== '---') {
    return []
  }

  const closingIndex = lines.indexOf('---', 1)
  if (closingIndex === -1) {
    return []
  }

  const packageNames = []
  for (const line of lines.slice(1, closingIndex)) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      continue
    }

    const packageName = line
      .slice(0, colonIndex)
      .trim()
      .replace(/^['"]/, '')
      .replace(/['"]$/, '')

    if (packageName) {
      packageNames.push(packageName)
    }
  }

  return packageNames
}

async function hasSkillChangeset() {
  const entries = await fs.readdir(changesetDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue
    }
    if (entry.name.toLowerCase() === 'readme.md') {
      continue
    }

    const content = await fs.readFile(
      path.join(changesetDir, entry.name),
      'utf8',
    )
    if (parseChangesetPackages(content).includes(skillPackageName)) {
      return true
    }
  }

  return false
}

async function writeSkillChangeset(relevantChanges) {
  const content = [
    '---',
    `"${skillPackageName}": patch`,
    '---',
    '',
    'Update generated lynx-ui skill references.',
    '',
  ].join('\n')

  await fs.writeFile(generatedChangesetPath, content, 'utf8')
  console.info(
    [
      `Generated ${
        path.relative(workspaceRoot, generatedChangesetPath)
      } for skill source changes:`,
      ...relevantChanges.map(filePath => `- ${filePath}`),
    ].join('\n'),
  )
}

async function main() {
  const changedFiles = getChangedFiles()
  const relevantChanges = await getSkillRelevantChanges(changedFiles)

  if (relevantChanges.length === 0) {
    console.info('No skill source changes detected.')
    return
  }

  if (await hasSkillChangeset()) {
    console.info(
      `${skillPackageName} changeset found for skill source changes.`,
    )
    return
  }

  await writeSkillChangeset(relevantChanges)
}

await main()
