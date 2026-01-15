// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get root directory (assuming script is in tools/)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../')
const packagesDir = path.join(rootDir, 'packages')
const tsconfigPath = path.join(rootDir, 'tsconfig.json')

// Structure of tsconfig.json
interface TSConfig {
  files?: string[]
  references: { path: string }[]
}

export async function updateTSConfigRefs() {
  if (!fs.existsSync(packagesDir)) {
    console.error('Packages directory not found')
    // eslint-disable-next-line n/no-process-exit
    process.exit(1)
  }

  // Find all packages with tsconfig.json
  const references: { path: string }[] = []

  // Always include tsconfig.node.json
  if (fs.existsSync(path.join(rootDir, 'tsconfig.node.json'))) {
    references.push({ path: './tsconfig.node.json' })
  }

  const entries = await fs.promises.readdir(packagesDir, {
    withFileTypes: true,
  })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const packagePath = path.join(packagesDir, entry.name)
      const tsconfigPkgPath = path.join(packagePath, 'tsconfig.json')

      if (fs.existsSync(tsconfigPkgPath)) {
        references.push({ path: `./packages/${entry.name}` })
      }
    }
  }

  // Read existing tsconfig to preserve other fields if any match solution style
  let existingConfig: any = {}
  if (fs.existsSync(tsconfigPath)) {
    try {
      const content = fs.readFileSync(tsconfigPath, 'utf-8')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      existingConfig = JSON.parse(content)
    } catch (e) {
      console.warn('Could not parse existing tsconfig.json, starting fresh.')
    }
  }

  // Ensure strict solution style
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const newConfig = {
    ...existingConfig,
    files: [], // Solution style must have empty files
    references: references.sort((a, b) => a.path.localeCompare(b.path)),
  }

  // Remove fields that shouldn't be in solution style root
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  delete newConfig.include
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  delete newConfig.exclude
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  delete newConfig.compilerOptions

  fs.writeFileSync(tsconfigPath, JSON.stringify(newConfig, null, 2) + '\n')
  console.log(`Updated tsconfig.json with ${references.length} references.`)
}
