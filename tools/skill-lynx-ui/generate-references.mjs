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
const packagesRoot = path.join(workspaceRoot, 'packages')
const exampleRoots = [
  {
    label: 'oss',
    root: path.join(workspaceRoot, 'apps', 'examples'),
  },
]
const defaultOutputRoot = packageRoot
const bundledReferenceSourceRoot = path.join(__dirname, 'references')
const componentRoutingManifestPath = path.join(
  __dirname,
  'component-routing.json',
)

const guideRewriteRules = []

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

export function getExampleAppPaths(componentSlug) {
  const exampleDirName = getExampleAppDirname(componentSlug)
  return exampleRoots.map(exampleRoot => ({
    label: exampleRoot.label,
    path: path.join(exampleRoot.root, exampleDirName),
  }))
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

function getMarkdownHeadingAnchor(value) {
  return value.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-')
}

async function findApiSourcePath(packageDir) {
  const candidates = [
    path.join(packageDir, 'src', 'types', 'index.docs.ts'),
    path.join(packageDir, 'types', 'index.docs.ts'),
  ]

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate
    }
  }

  return undefined
}

export async function loadComponentRoutingManifest() {
  return JSON.parse(await readFileUtf8(componentRoutingManifestPath))
}

function formatSlugList(slugs) {
  return slugs.map(slug => `- ${slug}`).join('\n')
}

export function validateComponentRoutingManifest(manifest, discoveredSlugs) {
  const routedSlugs = Object.keys(manifest.components ?? {})
  const excludedSlugs = Object.keys(manifest.excludedComponents ?? {})
  const discoveredSlugSet = new Set(discoveredSlugs)
  const routedSlugSet = new Set(routedSlugs)
  const excludedSlugSet = new Set(excludedSlugs)
  const overlappingSlugs = routedSlugs.filter(slug => excludedSlugSet.has(slug))
  const missingSlugs = discoveredSlugs.filter(
    slug => !routedSlugSet.has(slug) && !excludedSlugSet.has(slug),
  )
  const staleSlugs = [...routedSlugs, ...excludedSlugs].filter(
    slug => !discoveredSlugSet.has(slug),
  )
  const incompleteSlugs = routedSlugs.filter(slug => {
    const entry = manifest.components[slug]
    return !entry.label || !entry.useWhen || !entry.avoidWhen
  })
  const unexplainedExclusions = excludedSlugs.filter(
    slug => !manifest.excludedComponents[slug],
  )

  if (overlappingSlugs.length > 0) {
    throw new Error(
      `Component routing entries cannot also be excluded:\n${
        formatSlugList(overlappingSlugs)
      }`,
    )
  }

  if (missingSlugs.length > 0) {
    throw new Error(
      [
        'Missing component routing entries:',
        formatSlugList(missingSlugs),
        '',
        'Add each component to tools/skill-lynx-ui/component-routing.json',
        'or add an excludedComponents entry with a reason.',
      ].join('\n'),
    )
  }

  if (staleSlugs.length > 0) {
    throw new Error(
      `Routing manifest entries do not match documented component packages:\n${
        formatSlugList(staleSlugs)
      }`,
    )
  }

  if (incompleteSlugs.length > 0) {
    throw new Error(
      `Routing manifest entries require label, useWhen, and avoidWhen:\n${
        formatSlugList(incompleteSlugs)
      }`,
    )
  }

  if (unexplainedExclusions.length > 0) {
    throw new Error(
      `Excluded components require a reason:\n${
        formatSlugList(unexplainedExclusions)
      }`,
    )
  }
}

export async function collectIncludedComponents() {
  const entries = await fs.readdir(packagesRoot, { withFileTypes: true })
  const discoveredComponents = []

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('lynx-ui-')) {
      continue
    }
    if (entry.name === 'lynx-ui' || entry.name === 'skill-lynx-ui') {
      continue
    }

    const packageDir = path.join(packagesRoot, entry.name)
    const skillPath = path.join(packageDir, 'SKILL.md')
    const apiSourcePath = await findApiSourcePath(packageDir)
    if (!apiSourcePath) {
      continue
    }

    const slug = componentSlugFromPackageName(entry.name)

    discoveredComponents.push({
      apiSourcePath,
      exampleAppPaths: getExampleAppPaths(slug),
      packageDirName: entry.name,
      skillPath: await exists(skillPath) ? skillPath : undefined,
      slug,
    })
  }

  const manifest = await loadComponentRoutingManifest()
  validateComponentRoutingManifest(
    manifest,
    discoveredComponents.map(component => component.slug),
  )

  return sortComponents(
    discoveredComponents
      .filter(component => manifest.components[component.slug])
      .map(component => ({
        ...component,
        ...manifest.components[component.slug],
      })),
  )
}

async function collectExampleCasesFromApp(exampleAppPath) {
  if (!(await exists(exampleAppPath.path))) {
    return []
  }

  const entries = await fs.readdir(exampleAppPath.path, { withFileTypes: true })
  const examples = []

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const indexPath = path.join(exampleAppPath.path, entry.name, 'index.tsx')
    if (!(await exists(indexPath))) {
      continue
    }

    examples.push({
      content: await readFileUtf8(indexPath),
      indexPath,
      name: entry.name,
    })
  }

  return examples.sort((left, right) => left.name.localeCompare(right.name))
}

async function collectExampleCases(exampleAppPaths) {
  const exampleGroups = await Promise.all(
    exampleAppPaths.map(exampleAppPath =>
      collectExampleCasesFromApp(exampleAppPath)
    ),
  )

  return exampleGroups.flat().sort((left, right) =>
    left.name === right.name
      ? left.indexPath.localeCompare(right.indexPath)
      : left.name.localeCompare(right.name)
  )
}

function buildApiMarkdown(sourceContent) {
  const fence = getCodeFence(sourceContent)

  return [
    '## API Definition',
    '',
    `${fence}typescript`,
    sourceContent.trimEnd(),
    fence,
    '',
  ].join('\n')
}

function buildExamplesMarkdown(examples) {
  if (examples.length === 0) {
    return ['## Examples', '', 'No bundled examples yet.', ''].join('\n')
  }

  const lines = ['## Examples', '']

  for (const example of examples) {
    const fence = getCodeFence(example.content)
    lines.push(
      `### ${example.name}`,
      '',
      `${fence}tsx`,
      example.content.trimEnd(),
      fence,
      '',
    )
  }

  return lines.join('\n')
}

function buildComponentOverviewMarkdown(components) {
  const lines = [
    '# lynx-ui Component Overview',
    '',
    'Use this file to choose the closest lynx-ui component before loading implementation details.',
    '',
    '## Routing Rules',
    '',
    '- Select a route from the user-visible behavior.',
    '- Open the API reference before writing code.',
    '- Open the guide when one is available for usage patterns and pitfalls.',
    '- Use examples as implementation patterns after verifying the API.',
    '- State the coverage limit when no route matches.',
    '',
    '## Combining Components',
    '',
    'When a task combines components, check [component-composition.md](./component-composition.md) for common supported combinations.',
    '',
    '## Table of Contents',
    '',
    ...components.map(component =>
      `- [${component.label}](#${getMarkdownHeadingAnchor(component.label)})`
    ),
    '',
    '## Components',
    '',
  ]

  for (const component of components) {
    const officialDocsUrl = component.officialDocsUrl
      ?? `https://lynxjs.org/next/lynx-ui/components/${component.slug}.html`

    lines.push(
      `### \`${component.label}\``,
      '',
      `- Choose when: ${component.useWhen}`,
      `- Avoid when: ${component.avoidWhen}`,
      `- [Official docs](${officialDocsUrl})`,
    )
    if (component.skillPath) {
      lines.push(`- [Guide](./components/${component.slug}/guide.md)`)
    } else {
      lines.push('- Guide: Not available yet.')
    }
    lines.push(
      `- [API](./components/${component.slug}/api.md)`,
      `- [Examples](./components/${component.slug}/examples.md)`,
      '',
    )
  }

  return lines.join('\n')
}

async function ensureCleanDir(dirPath) {
  await fs.rm(dirPath, { force: true, recursive: true })
  await fs.mkdir(dirPath, { recursive: true })
}

async function copyBundledReferences(outputRoot) {
  const copiedReferenceFiles = [
    'foundation.md',
    'theming-and-tokens.md',
    'motion.md',
    'component-composition.md',
  ]

  for (const relativePath of copiedReferenceFiles) {
    const sourcePath = path.join(bundledReferenceSourceRoot, relativePath)
    const destinationPath = path.join(outputRoot, 'references', relativePath)
    await fs.mkdir(path.dirname(destinationPath), { recursive: true })
    await fs.copyFile(sourcePath, destinationPath)
  }
}

async function writeFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf8')
}

export async function generateReferences(outputRoot = defaultOutputRoot) {
  const components = await collectIncludedComponents()

  await ensureCleanDir(path.join(outputRoot, 'references'))
  await copyBundledReferences(outputRoot)

  for (const component of components) {
    const apiSource = await readFileUtf8(component.apiSourcePath)
    const examples = await collectExampleCases(component.exampleAppPaths)
    const componentOutputDir = getComponentOutputDir(outputRoot, component.slug)

    if (component.skillPath) {
      const guideSource = await readFileUtf8(component.skillPath)
      await writeFile(
        path.join(componentOutputDir, 'guide.md'),
        `${rewriteGuideContent(guideSource).trimEnd()}\n`,
      )
    }
    await writeFile(
      path.join(componentOutputDir, 'api.md'),
      buildApiMarkdown(apiSource),
    )
    await writeFile(
      path.join(componentOutputDir, 'examples.md'),
      buildExamplesMarkdown(examples),
    )
  }

  await writeFile(
    path.join(outputRoot, 'references', 'component-overview.md'),
    buildComponentOverviewMarkdown(components),
  )

  return components
}

if (process.argv[1] === __filename) {
  await generateReferences()
}
