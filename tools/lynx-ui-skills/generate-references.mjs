#!/usr/bin/env node
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..', '..')
const packageRoot = path.join(workspaceRoot, 'packages', 'lynx-ui-skills')
const packagesRoot = path.join(workspaceRoot, 'packages')
const examplesRoot = path.join(workspaceRoot, 'apps', 'examples')
const defaultOutputRoot = packageRoot

const guideRewriteRules = [
  [/apps\/examples\/src\//g, 'apps/examples/'],
]

export function componentSlugFromPackageName(packageDirName) {
  return packageDirName.replace(/^lynx-ui-/, '')
}

export function toPascalCase(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function getExampleAppDirname(componentSlug) {
  return toPascalCase(componentSlug)
}

export function getComponentOutputDir(outputRoot, componentSlug) {
  return path.join(outputRoot, 'references', 'components', componentSlug)
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function readFileUtf8(filePath) {
  return fs.readFile(filePath, 'utf8')
}

function rewriteGuideContent(content) {
  let updated = content
  for (const [pattern, replacement] of guideRewriteRules) {
    updated = updated.replace(pattern, replacement)
  }
  return updated
}

function sortComponents(components) {
  return [...components].sort((left, right) =>
    left.slug.localeCompare(right.slug)
  )
}

function getCodeFence(content) {
  return content.includes('```') ? '````' : '```'
}

export async function collectIncludedComponents() {
  const entries = await fs.readdir(packagesRoot, { withFileTypes: true })
  const components = []

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('lynx-ui-')) {
      continue
    }
    if (entry.name === 'lynx-ui' || entry.name === 'lynx-ui-skills') {
      continue
    }

    const packageDir = path.join(packagesRoot, entry.name)
    const skillPath = path.join(packageDir, 'SKILL.md')
    if (!(await exists(skillPath))) {
      continue
    }

    const slug = componentSlugFromPackageName(entry.name)
    const exampleDirName = getExampleAppDirname(slug)
    const apiSourcePath = path.join(packageDir, 'src', 'types', 'index.docs.ts')
    const exampleAppPath = path.join(examplesRoot, exampleDirName)

    components.push({
      packageDirName: entry.name,
      slug,
      displayName: exampleDirName,
      skillPath,
      apiSourcePath,
      exampleAppPath,
    })
  }

  return sortComponents(components)
}

async function collectExampleCases(exampleAppPath) {
  const entries = await fs.readdir(exampleAppPath, { withFileTypes: true })
  const examples = []

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const indexPath = path.join(exampleAppPath, entry.name, 'index.tsx')
    if (!(await exists(indexPath))) {
      continue
    }

    examples.push({
      name: entry.name,
      indexPath,
      content: await readFileUtf8(indexPath),
    })
  }

  return examples.sort((left, right) => left.name.localeCompare(right.name))
}

function buildApiMarkdown(component, sourceContent) {
  const relativeSourcePath = path.relative(
    workspaceRoot,
    component.apiSourcePath,
  )
  const fence = getCodeFence(sourceContent)

  return [
    '## API Definition',
    '',
    `### ${relativeSourcePath}`,
    '',
    `${fence}typescript`,
    sourceContent.trimEnd(),
    fence,
    '',
  ].join('\n')
}

function buildExamplesMarkdown(examples) {
  const lines = ['## Examples', '']

  for (const example of examples) {
    const relativeSourcePath = path.relative(workspaceRoot, example.indexPath)
    const fence = getCodeFence(example.content)
    lines.push(
      `### ${example.name}`,
      '',
      `Source: \`${relativeSourcePath}\``,
      '',
      `${fence}tsx`,
      example.content.trimEnd(),
      fence,
      '',
    )
  }

  return lines.join('\n')
}

function buildIndexMarkdown(components) {
  const lines = [
    '# lynx-ui-skills References',
    '',
    '`lynx-ui-skills` is the umbrella skill package for curated lynx-ui component references.',
    '',
    'Use the package-level `SKILL.md` as the entrypoint, then open the relevant component references below.',
    '',
    '## Included Components',
    '',
  ]

  for (const component of components) {
    lines.push(
      `### ${component.displayName}`,
      '',
      `- Guide: [guide.md](./components/${component.slug}/guide.md)`,
      `- API: [api.md](./components/${component.slug}/api.md)`,
      `- Examples: [examples.md](./components/${component.slug}/examples.md)`,
      '',
    )
  }

  return lines.join('\n')
}

function buildRootExamplesMarkdown(componentExamples) {
  const lines = [
    '# lynx-ui-skills Examples',
    '',
    'This file indexes the raw example entry files copied into the skill payload.',
    '',
  ]

  for (const { component, examples } of componentExamples) {
    lines.push(`## ${component.displayName}`, '')

    for (const example of examples) {
      const relativePath = path.join(
        'examples',
        component.displayName,
        example.name,
        'index.tsx',
      )
      lines.push(`- [${example.name}](./${relativePath})`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

async function ensureCleanDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true })
  await fs.mkdir(dirPath, { recursive: true })
}

async function writeFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf8')
}

export async function generateReferences(outputRoot = defaultOutputRoot) {
  const components = await collectIncludedComponents()

  await ensureCleanDir(path.join(outputRoot, 'references'))
  await ensureCleanDir(path.join(outputRoot, 'examples'))
  const componentExamples = []

  for (const component of components) {
    const guideSource = await readFileUtf8(component.skillPath)
    const apiSource = await readFileUtf8(component.apiSourcePath)
    const examples = await collectExampleCases(component.exampleAppPath)
    const componentOutputDir = getComponentOutputDir(outputRoot, component.slug)

    await writeFile(
      path.join(componentOutputDir, 'guide.md'),
      `${rewriteGuideContent(guideSource).trimEnd()}\n`,
    )
    await writeFile(
      path.join(componentOutputDir, 'api.md'),
      buildApiMarkdown(component, apiSource),
    )
    await writeFile(
      path.join(componentOutputDir, 'examples.md'),
      buildExamplesMarkdown(examples),
    )

    for (const example of examples) {
      await writeFile(
        path.join(
          outputRoot,
          'examples',
          component.displayName,
          example.name,
          'index.tsx',
        ),
        `${example.content.trimEnd()}\n`,
      )
    }

    componentExamples.push({ component, examples })
  }

  await writeFile(
    path.join(outputRoot, 'references', 'index.md'),
    buildIndexMarkdown(components),
  )
  await writeFile(
    path.join(outputRoot, 'examples.md'),
    buildRootExamplesMarkdown(componentExamples),
  )

  return components
}

if (process.argv[1] === __filename) {
  await generateReferences()
}
