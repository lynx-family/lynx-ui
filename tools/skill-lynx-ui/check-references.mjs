// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { generateReferences } from './generate-references.mjs'

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

function getMarkdownHeadingAnchor(value) {
  return value.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-')
}

async function validateLocalMarkdownLinks(rootDir, relativePath) {
  const sourcePath = path.join(rootDir, relativePath)
  const source = await fs.readFile(sourcePath, 'utf8')
  const linkPattern = /\]\((?:(\.\/[^)#]+)(?:#([^)]+))?|#([^)]+))\)/g

  for (const match of source.matchAll(linkPattern)) {
    const [, linkedPath, linkedAnchor, currentFileAnchor] = match
    const anchor = linkedAnchor ?? currentFileAnchor
    const linkedRelativePath = linkedPath
      ? path.normalize(path.join(path.dirname(relativePath), linkedPath))
      : relativePath
    const targetPath = path.join(rootDir, linkedRelativePath)

    try {
      await fs.access(targetPath)
    } catch {
      throw new Error(`Broken link in ${relativePath}: ${linkedPath}`)
    }

    if (!anchor) {
      continue
    }

    const target = await fs.readFile(targetPath, 'utf8')
    const anchors = [...target.matchAll(/^#{1,6} ([^\r\n]+)$/gm)]
      .map(heading => getMarkdownHeadingAnchor(heading[1]))
    if (!anchors.includes(anchor)) {
      const link = linkedPath ? `${linkedPath}#${anchor}` : `#${anchor}`
      throw new Error(`Broken link in ${relativePath}: ${link}`)
    }
  }
}

async function main() {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), 'skill-lynx-ui-references-'),
  )

  try {
    const components = await generateReferences(tempRoot)

    const generatedFiles = await listFiles(tempRoot)
    const requiredFiles = [
      'references/component-overview.md',
      'references/foundation.md',
      'references/motion.md',
      'references/component-composition.md',
      'references/theming-and-tokens.md',
    ]

    for (const relativePath of requiredFiles) {
      if (!generatedFiles.includes(relativePath)) {
        throw new Error(`Missing generated file: ${relativePath}`)
      }
    }

    if (generatedFiles.includes('examples.md')) {
      throw new Error('Top-level examples.md should not be generated.')
    }
    if (generatedFiles.includes('references/index.md')) {
      throw new Error('references/index.md should not be generated.')
    }

    const componentDirs = await fs.readdir(
      path.join(tempRoot, 'references', 'components'),
    )
    if (componentDirs.length === 0) {
      throw new Error('No component references were generated.')
    }

    const routingGuide = await fs.readFile(
      path.join(tempRoot, 'references', 'component-overview.md'),
      'utf8',
    )
    const missingRoutes = components.filter(component =>
      !routingGuide.includes(`./components/${component.slug}/api.md`)
    )

    if (!routingGuide.includes('./component-composition.md')) {
      throw new Error(
        'Generated component overview is missing the component composition route.',
      )
    }

    if (missingRoutes.length > 0) {
      throw new Error(
        [
          'Generated component overview is missing routed API references:',
          ...missingRoutes.map(component => `- ${component.slug}`),
        ].join('\n'),
      )
    }

    for (const component of components) {
      const componentRoot = `references/components/${component.slug}`
      for (const filename of ['api.md', 'examples.md']) {
        const relativePath = `${componentRoot}/${filename}`
        if (!generatedFiles.includes(relativePath)) {
          throw new Error(`Missing generated file: ${relativePath}`)
        }
      }

      if (
        component.skillPath
        && !generatedFiles.includes(`${componentRoot}/guide.md`)
      ) {
        throw new Error(`Missing generated file: ${componentRoot}/guide.md`)
      }
    }

    for (
      const relativePath of [
        'references/component-overview.md',
        'references/component-composition.md',
      ]
    ) {
      await validateLocalMarkdownLinks(tempRoot, relativePath)
    }

    console.info('Reference generation check passed.')
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
}

await main()
