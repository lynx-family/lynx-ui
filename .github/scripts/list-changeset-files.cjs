#!/usr/bin/env node

// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const { execFileSync } = require('node:child_process')

function listChangesetFilesSince(mergeBase, cwd = process.cwd()) {
  if (!mergeBase) {
    throw new TypeError('A merge-base Git ref is required')
  }

  const changedFiles = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=d', '-z', mergeBase, 'HEAD'],
    {
      cwd,
      encoding: 'utf8',
    },
  )

  return changedFiles
    .split('\0')
    .filter(
      (file) =>
        /^\.changeset\/[^/]+\.md$/.test(file)
        && file !== '.changeset/README.md',
    )
}

if (require.main === module) {
  for (const file of listChangesetFilesSince(process.argv[2])) {
    process.stdout.write(`${file}\n`)
  }
}

module.exports = { listChangesetFilesSince }
