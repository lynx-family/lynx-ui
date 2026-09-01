// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

function namespaceValue(project, value, separator = '/') {
  return `${project}${separator}${String(value)}`
}

function namespaceChunkId(project, chunkId) {
  return namespaceValue(project, chunkId, ':')
}

function namespaceModule(module, project) {
  const result = {
    name: namespaceValue(project, module.name),
    size: module.size,
    chunks: (module.chunks ?? []).map(chunkId =>
      namespaceChunkId(project, chunkId)
    ),
  }

  if (Array.isArray(module.modules)) {
    result.modules = module.modules.map(child =>
      namespaceModule(child, project)
    )
  }

  return result
}

function namespaceAsset(asset, project) {
  return {
    name: namespaceValue(project, asset.name),
    size: asset.size,
  }
}

function namespaceChunk(chunk, project) {
  return {
    id: namespaceChunkId(project, chunk.id),
    entry: chunk.entry,
    initial: chunk.initial,
    names: (chunk.names ?? []).map(name => namespaceValue(project, name, ':')),
    files: (chunk.files ?? []).map(file => namespaceValue(project, file)),
  }
}

function mergeSortedExampleBundleStats(sources) {
  const assets = []
  const modules = []
  const chunks = []
  const hash = createHash('sha256')
  let sourceCount = 0

  for (const { project, stats } of sources) {
    sourceCount += 1
    if (!Array.isArray(stats.assets) || stats.assets.length === 0) {
      throw new Error(`Bundle statistics for ${project} contain no assets`)
    }

    const projectAssets = stats.assets.map(asset =>
      namespaceAsset(asset, project)
    )
    const projectModules = (stats.modules ?? []).map(module =>
      namespaceModule(module, project)
    )
    const projectChunks = (stats.chunks ?? []).map(chunk =>
      namespaceChunk(chunk, project)
    )

    assets.push(...projectAssets)
    modules.push(...projectModules)
    chunks.push(...projectChunks)
    hash.update(project)
    hash.update(JSON.stringify({
      assets: projectAssets,
      modules: projectModules,
      chunks: projectChunks,
    }))
  }

  if (sourceCount === 0) {
    throw new Error('No example bundle statistics were found')
  }

  return { hash: hash.digest('hex'), assets, modules, chunks }
}

export function mergeExampleBundleStats(sources) {
  return mergeSortedExampleBundleStats(
    [...sources].sort((a, b) => a.project.localeCompare(b.project, 'en')),
  )
}

export function findExampleBundleStats(examplesDirectory) {
  const sources = readdirSync(examplesDirectory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => ({
      project: entry.name,
      statsPath: path.join(examplesDirectory, entry.name, 'dist/stats.json'),
    }))
    .sort((a, b) => a.project.localeCompare(b.project, 'en'))

  const missingProjects = sources
    .filter(({ statsPath }) => !existsSync(statsPath))
    .map(({ project }) => project)

  if (missingProjects.length > 0) {
    throw new Error(
      `Missing bundle statistics for: ${missingProjects.join(', ')}`,
    )
  }

  return sources
}

function* readExampleBundleStats(sources) {
  for (const { project, statsPath } of sources) {
    yield {
      project,
      stats: JSON.parse(readFileSync(statsPath, 'utf8')),
    }
  }
}

export function writeMergedExampleBundleStats({
  examplesDirectory,
  outputPath,
}) {
  const stats = mergeSortedExampleBundleStats(
    readExampleBundleStats(findExampleBundleStats(examplesDirectory)),
  )

  mkdirSync(path.dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(stats, null, 2)}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeMergedExampleBundleStats({
    examplesDirectory: path.join(repoRoot, 'apps/examples'),
    outputPath: path.join(repoRoot, 'artifacts/example-bundle-stats.json'),
  })
}
