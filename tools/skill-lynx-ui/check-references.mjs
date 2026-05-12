// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { generateReferences } from './generate-references.mjs'

async function listFiles(rootDir) {
  const files = []

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else {
        files.push(path.relative(rootDir, fullPath))
      }
    }
  }

  await walk(rootDir)
  return files.sort()
}

async function main() {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), 'skill-lynx-ui-references-'),
  )

  try {
    await generateReferences(tempRoot)

    const generatedFiles = await listFiles(tempRoot)
    const requiredFiles = ['examples.md', 'references/index.md']

    for (const relativePath of requiredFiles) {
      if (!generatedFiles.includes(relativePath)) {
        throw new Error(`Missing generated file: ${relativePath}`)
      }
    }

    const componentDirs = await fs.readdir(
      path.join(tempRoot, 'references', 'components'),
    )
    if (componentDirs.length === 0) {
      throw new Error('No component references were generated.')
    }

    console.info('Reference generation check passed.')
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
}

await main()
