// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

// cspell:ignore bytedance

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const targetExtensions = new Set([
  '.js',
  '.json',
  '.jsonc',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
])

const staleLinkPatterns = [
  {
    description: 'legacy lynxjs.org lynx-ui route',
    pattern:
      /https?:\/\/lynxjs\.org\/(?:[\w.-]+\/)*lynx-ui(?=[/?#)\]}>,'"`\s]|$)/gu,
  },
  {
    description: 'retired lynx-ui.bytedance.net host',
    pattern: /https?:\/\/lynx-ui\.bytedance\.net(?=[/?#)\]}>,'"`\s]|$)/gu,
  },
  {
    description: 'legacy site-root Markdown link',
    pattern: /\]\(\s*<?\/(?:next\/)?lynx-ui(?=[/?#)>\s]|$)/gu,
  },
  {
    description: 'legacy site-root Markdown reference',
    pattern: /^\s*\[[^\]]+\]:\s*<?\/(?:next\/)?lynx-ui(?=[/?#)>\s]|$)/gmu,
  },
  {
    description: 'legacy site-root component link',
    pattern: /\b(?:href|to)\s*=\s*['"]\/(?:next\/)?lynx-ui(?=[/?#'"\s]|$)/gu,
  },
]

function getLineAndColumn(text, offset) {
  const prefix = text.slice(0, offset)
  const lines = prefix.split(/\r?\n/u)
  return { line: lines.length, column: lines.at(-1).length + 1 }
}

export function findStaleDocLinks(text) {
  return staleLinkPatterns.flatMap(({ description, pattern }) =>
    [...text.matchAll(pattern)].map(match => ({
      ...getLineAndColumn(text, match.index),
      description,
      match: match[0],
    }))
  )
}

function getTrackedFiles() {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: rootDir,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'git ls-files failed')
  }

  return result.stdout
    .split('\0')
    .filter(Boolean)
    .filter(filePath => targetExtensions.has(path.extname(filePath)))
    .filter(filePath => !filePath.includes('.test.'))
}

export function checkTrackedFiles() {
  return getTrackedFiles().flatMap(filePath => {
    const text = fs.readFileSync(path.join(rootDir, filePath), 'utf8')
    return findStaleDocLinks(text).map(violation => ({
      filePath,
      ...violation,
    }))
  })
}

function main() {
  const violations = checkTrackedFiles()
  if (violations.length === 0) {
    console.log('No stale lynx-ui documentation links found.')
    return
  }

  console.error('Stale lynx-ui documentation links found:')
  for (const violation of violations) {
    console.error(
      `${violation.filePath}:${violation.line}:${violation.column} ${violation.description}: ${violation.match}`,
    )
  }
  process.exitCode = 1
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
