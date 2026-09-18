#!/usr/bin/env node

// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const { execFileSync } = require('node:child_process')

function listChangesetFilesSince(mergeBase, cwd = process.cwd()) {
  if (!mergeBase) {
    throw new TypeError('A merge-base Git ref is required')
  }

  // Deleted files are no longer active changesets. NUL delimiters preserve
  // file names containing whitespace.
  const changedFiles = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=d', '-z', mergeBase, 'HEAD'],
    {
      cwd,
      encoding: 'utf8',
    },
  )

  // This preflight checks file presence only. Changesets validates content and
  // decides whether an empty changeset produces any releases.
  return changedFiles
    .split('\0')
    .filter((file) => {
      const match = /^\.changeset\/([^/]+\.md)$/.exec(file)
      if (!match) {
        return false
      }

      const filename = match[1]
      return !filename.startsWith('.') && !/^README\.md$/i.test(filename)
    })
}

// Print paths for the workflow while keeping the function importable by tests.
if (require.main === module) {
  for (const file of listChangesetFilesSince(process.argv[2])) {
    process.stdout.write(`${file}\n`)
  }
}

module.exports = { listChangesetFilesSince }
