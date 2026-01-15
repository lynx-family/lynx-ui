// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { execSync } from 'node:child_process'

// Get list of staged files
const stagedFiles = execSync('git diff --name-only --cached').toString().split(
  '\n',
)

// Check if there is any markdown file in .changeset folder (excluding README.md)
const hasChangeset = stagedFiles.some(file =>
  file.trim().startsWith('.changeset/')
  && file.trim().endsWith('.md')
  && !file.includes('README.md')
)

// Check if any file in packages/ has been modified
const hasPackageChanges = stagedFiles.some(file =>
  file.trim().startsWith('packages/')
)

if (!hasChangeset) {
  if (hasPackageChanges) {
    throw new Error(
      'Changes detected in packages/ directory but no changeset found. Please run "pnpm changeset" to add a changeset.',
    )
  }

  console.log('No changeset found. Generating an empty changeset...')
  try {
    // Generate empty changeset
    execSync('pnpm changeset --empty && pnpm run fix:all', { stdio: 'inherit' })
    // Add the new changeset file to the commit
    execSync('git add .changeset/*.md', { stdio: 'inherit' })
  } catch (error) {
    throw new Error(`Failed to generate changeset: ${error.message}`)
  }
}
