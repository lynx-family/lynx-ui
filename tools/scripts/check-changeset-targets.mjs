// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '../..')
const changesetDir = path.join(rootDir, '.changeset')
const mainPackageName = '@lynx-js/lynx-ui'

function getChangesetFiles() {
  return fs.readdirSync(changesetDir)
    .filter(fileName =>
      fileName.endsWith('.md') && fileName.toLowerCase() !== 'readme.md'
    )
    .map(fileName => path.join(changesetDir, fileName))
    .sort()
}

function getFrontmatter(text) {
  const lines = text.split(/\r?\n/u)

  if (lines[0]?.trim() !== '---') {
    return null
  }

  const endIndex = lines.findIndex((line, index) =>
    index > 0 && line.trim() === '---'
  )

  if (endIndex === -1) {
    return null
  }

  return lines.slice(1, endIndex)
}

function parsePackageName(rawLine) {
  const trimmedLine = rawLine.trim()
  const separatorIndex = trimmedLine.indexOf(':')

  if (separatorIndex === -1) {
    return null
  }

  const rawPackageName = trimmedLine.slice(0, separatorIndex).trim()
  return rawPackageName.replace(/^['"]|['"]$/gu, '')
}

function getChangesetPackageNames(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const frontmatter = getFrontmatter(text)

  if (!frontmatter) {
    return []
  }

  return frontmatter.map(line => parsePackageName(line)).filter(Boolean)
}

function formatFilePath(filePath) {
  return path.relative(rootDir, filePath)
}

function checkChangesets() {
  return getChangesetFiles()
    .map(filePath => ({
      filePath,
      packageNames: getChangesetPackageNames(filePath),
    }))
    .filter(({ packageNames }) =>
      packageNames.includes(mainPackageName) && packageNames.length > 1
    )
}

const failures = checkChangesets()

if (failures.length === 0) {
  console.log('Changeset target check passed.')
} else {
  console.error(
    `Changesets that target ${mainPackageName} must not target component packages in the same file.`,
  )
  console.error(
    `Create a separate changeset for ${mainPackageName} only when the main package itself needs a release.`,
  )

  for (const failure of failures) {
    console.error(`- ${formatFilePath(failure.filePath)}`)
    console.error(`  Targets: ${failure.packageNames.join(', ')}`)
  }

  process.exitCode = 1
}
