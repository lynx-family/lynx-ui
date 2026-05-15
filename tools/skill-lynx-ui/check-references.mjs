// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateReferences } from './generate-references.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..', '..')
const packageRoot = path.join(workspaceRoot, 'packages', 'skill-lynx-ui')
const routingGuidePath = path.join(packageRoot, 'reference.md')

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
    const components = await generateReferences(tempRoot)

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

    const routingGuide = await fs.readFile(routingGuidePath, 'utf8')
    const missingRoutes = components
      .map(component => component.slug)
      .filter(slug =>
        !routingGuide.includes(`references/components/${slug}/guide.md`)
      )

    if (missingRoutes.length > 0) {
      throw new Error(
        [
          `${
            path.relative(workspaceRoot, routingGuidePath)
          } is missing routing entries for generated component references:`,
          ...missingRoutes.map(slug => `- ${slug}`),
        ].join('\n'),
      )
    }

    console.info('Reference generation check passed.')
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
}

await main()
