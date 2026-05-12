// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..', '..')
const packageRoot = path.join(workspaceRoot, 'packages', 'skill-lynx-ui')

for (const target of ['references', 'examples', 'examples.md']) {
  await fs.rm(path.join(packageRoot, target), { recursive: true, force: true })
}
