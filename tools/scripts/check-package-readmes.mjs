// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)
const packagesRoot = path.join(repoRoot, 'packages')

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

export function inspectPackageReadmes(root) {
  const packageDirectories = []
  const missingReadmes = []
  const entries = fs
    .readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))

  for (const entry of entries) {
    const packageDirectory = path.join(root, entry.name)

    if (!isFile(path.join(packageDirectory, 'package.json'))) {
      continue
    }

    packageDirectories.push(entry.name)

    if (!isFile(path.join(packageDirectory, 'README_zh.md'))) {
      missingReadmes.push(entry.name)
    }
  }

  return { packageDirectories, missingReadmes }
}

function main() {
  const roots = [packagesRoot, path.join(repoRoot, 'receipes')]
    .filter(root => fs.existsSync(root))
  const results = roots.map(root => inspectPackageReadmes(root))
  const packageDirectories = results.flatMap(result =>
    result.packageDirectories
  )
  const missingReadmes = results.flatMap((result, index) =>
    result.missingReadmes.map(name =>
      path.relative(repoRoot, path.join(roots[index], name))
    )
  )

  if (missingReadmes.length === 0) {
    console.log(
      `Package Chinese README check passed for ${packageDirectories.length} packages.`,
    )
    return
  }

  console.error(
    'Every component and recipe package must contain README_zh.md.',
  )
  console.error('Missing Chinese README files:')

  for (const packageDirectory of missingReadmes) {
    console.error(`- ${packageDirectory}/README_zh.md`)
  }

  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
