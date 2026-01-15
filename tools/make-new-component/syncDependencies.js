// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PACKAGES_DIR = path.join(__dirname, '../../packages')
const LYNX_UI_PATH = path.join(PACKAGES_DIR, 'lynx-ui')
const LYNX_UI_PACKAGE_JSON = path.join(LYNX_UI_PATH, 'package.json')
const LYNX_UI_INDEX = path.join(LYNX_UI_PATH, 'src/index.tsx')

function syncDependencies() {
  // Read all packages
  const packages = fs.readdirSync(PACKAGES_DIR)
    .filter(pkg => pkg.startsWith('lynx-ui-')) // Only get lynx-ui-* packages

  // Read lynx-ui's package.json
  const lynxUiPackageJson = JSON.parse(
    fs.readFileSync(LYNX_UI_PACKAGE_JSON, 'utf8'),
  )

  // Initialize dependencies if they don't exist
  if (!lynxUiPackageJson.dependencies) {
    lynxUiPackageJson.dependencies = {}
  }

  // Add each package as a dependency
  packages.forEach(pkg => {
    const packageJsonPath = path.join(PACKAGES_DIR, pkg, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      lynxUiPackageJson.dependencies[packageJson.name] = 'workspace:*'
    }
  })

  // Sort dependencies alphabetically
  lynxUiPackageJson.dependencies = Object.fromEntries(
    Object.entries(lynxUiPackageJson.dependencies).sort(([a], [b]) =>
      a.localeCompare(b)
    ),
  )

  // Write back to package.json
  fs.writeFileSync(
    LYNX_UI_PACKAGE_JSON,
    JSON.stringify(lynxUiPackageJson, null, 2) + '\n',
  )

  // Generate re-exports
  let reexports = []

  packages.forEach(pkg => {
    const packageJsonPath = path.join(PACKAGES_DIR, pkg, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      reexports.push(`export * from '${packageJson.name}';`)
    }
  })

  // Sort re-exports alphabetically
  reexports.sort()

  // Add header comment and write to index.tsx
  const indexContent =
    `// This file is auto-generated. Do not edit manually\n\n${
      reexports.join('\n')
    }\n`
  fs.writeFileSync(LYNX_UI_INDEX, indexContent)

  console.log('Successfully synchronized dependencies and re-exports!')
}

// Execute the sync
syncDependencies()
