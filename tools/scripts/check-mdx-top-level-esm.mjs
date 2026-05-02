// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '../..')
const packagesDir = path.join(rootDir, 'packages')
const mdxExtension = '.mdx'

function isTargetMdxFile(name) {
  return name.endsWith(mdxExtension)
}

function collectMdxFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  return entries.flatMap(entry => {
    const entryPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      return collectMdxFiles(entryPath)
    }
    return isTargetMdxFile(entry.name) ? [entryPath] : []
  })
}

function getTargetFilesFromPackages() {
  return fs.readdirSync(packagesDir)
    .filter(name => name.startsWith('lynx-ui-'))
    .map(name => path.join(packagesDir, name, 'docs'))
    .filter(docsDir =>
      fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()
    )
    .flatMap(docsDir => collectMdxFiles(docsDir))
    .sort()
}

function resolveTargetFiles(rawArgs) {
  if (rawArgs.length === 0) {
    return getTargetFilesFromPackages()
  }

  return rawArgs.map(filePath => path.resolve(rootDir, filePath))
}

function formatFilePath(filePath) {
  const relativePath = path.relative(rootDir, filePath)
  return relativePath.startsWith(`..${path.sep}`) || relativePath === '..'
    ? filePath
    : relativePath
}

function createDelimiterState() {
  return {
    brace: 0,
    bracket: 0,
    paren: 0,
    inDoubleQuote: false,
    inSingleQuote: false,
    inTemplateString: false,
  }
}

function updateDelimiterState(line, state) {
  let escaped = false

  for (const char of line) {
    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (state.inSingleQuote) {
      if (char === '\'') {
        state.inSingleQuote = false
      }
      continue
    }

    if (state.inDoubleQuote) {
      if (char === '"') {
        state.inDoubleQuote = false
      }
      continue
    }

    if (state.inTemplateString) {
      if (char === '`') {
        state.inTemplateString = false
      }
      continue
    }

    if (char === '\'') {
      state.inSingleQuote = true
      continue
    }

    if (char === '"') {
      state.inDoubleQuote = true
      continue
    }

    if (char === '`') {
      state.inTemplateString = true
      continue
    }

    if (char === '{') {
      state.brace += 1
      continue
    }

    if (char === '}') {
      state.brace = Math.max(0, state.brace - 1)
      continue
    }

    if (char === '[') {
      state.bracket += 1
      continue
    }

    if (char === ']') {
      state.bracket = Math.max(0, state.bracket - 1)
      continue
    }

    if (char === '(') {
      state.paren += 1
      continue
    }

    if (char === ')') {
      state.paren = Math.max(0, state.paren - 1)
    }
  }
}

function isEsmStatementStart(line) {
  return /^(?:import|export)\b/.test(line)
}

function isEsmStatementComplete(line, state) {
  return (
    state.brace === 0
    && state.bracket === 0
    && state.paren === 0
    && !state.inSingleQuote
    && !state.inDoubleQuote
    && !state.inTemplateString
    && !line.endsWith(',')
  )
}

function checkFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const lines = text.split(/\r?\n/u)
  const violations = []
  let inCodeFence = false
  let inEsmStatement = false
  let sawNonEsmContent = false
  let esmState = createDelimiterState()

  for (const [index, rawLine] of lines.entries()) {
    const lineNumber = index + 1
    const trimmedLine = rawLine.trim()

    if (trimmedLine.startsWith('```')) {
      inCodeFence = !inCodeFence
      continue
    }

    if (inCodeFence) {
      continue
    }

    if (inEsmStatement) {
      updateDelimiterState(rawLine, esmState)
      if (isEsmStatementComplete(trimmedLine, esmState)) {
        inEsmStatement = false
      }
      continue
    }

    if (!trimmedLine) {
      continue
    }

    if (isEsmStatementStart(trimmedLine)) {
      if (sawNonEsmContent) {
        violations.push({
          filePath,
          lineNumber,
          snippet: trimmedLine,
        })
      }

      esmState = createDelimiterState()
      updateDelimiterState(rawLine, esmState)
      inEsmStatement = !isEsmStatementComplete(trimmedLine, esmState)
      continue
    }

    sawNonEsmContent = true
  }

  return violations
}

function main() {
  const targetFiles = resolveTargetFiles(process.argv.slice(2))
  const missingFiles = targetFiles.filter(filePath => !fs.existsSync(filePath))

  if (missingFiles.length > 0) {
    console.error('The following files do not exist:')
    for (const filePath of missingFiles) {
      console.error(`- ${formatFilePath(filePath)}`)
    }
    process.exitCode = 1
    return
  }

  const violations = targetFiles.flatMap(filePath => checkFile(filePath))

  if (violations.length === 0) {
    console.log(
      `MDX top-level ESM check passed for ${targetFiles.length} file(s).`,
    )
    return
  }

  console.error(
    `Found ${violations.length} MDX top-level ESM violation(s) across ${
      new Set(
        violations.map(violation => violation.filePath),
      ).size
    } file(s).`,
  )
  console.error(
    'Move all top-level import/export statements above the first Markdown or JSX content.',
  )

  for (const violation of violations) {
    console.error(
      `- ${formatFilePath(violation.filePath)}:${violation.lineNumber}`,
    )
    console.error(`  ${violation.snippet}`)
  }

  process.exitCode = 1
}

main()
