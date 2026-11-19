// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path from 'node:path'

/**
 * Discover component and recipe packages without scanning build outputs.
 * @param {string} repoRoot - Repository root.
 */
export function getComponentPackageDirectories(repoRoot) {
  return ['packages', 'receipes'].flatMap(directory => {
    const root = path.join(repoRoot, directory)
    if (!fs.existsSync(root)) return []
    return fs.readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(root, entry.name))
      .filter(packageRoot =>
        fs.existsSync(path.join(packageRoot, 'package.json'))
      )
  })
}
