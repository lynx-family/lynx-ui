// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mergeExampleBundleStats } from './merge-example-bundle-stats.mjs'

function source(project) {
  return {
    project,
    stats: {
      hash: `${project}-hash`,
      assets: [{ name: 'main.js', size: 100, chunks: [0] }],
      modules: [{ name: './src/index.tsx', size: 50, chunks: [0] }],
      chunks: [{
        id: 0,
        entry: true,
        initial: true,
        names: ['main'],
        files: ['main.js'],
      }],
    },
  }
}

describe('mergeExampleBundleStats', () => {
  it('namespaces identifiers that can collide between examples', () => {
    const result = mergeExampleBundleStats([
      source('Button'),
      source('Dialog'),
    ])

    assert.deepEqual(
      result.assets.map(asset => asset.name),
      ['Button/main.js', 'Dialog/main.js'],
    )
    assert.deepEqual(
      result.modules.map(module => [module.name, module.chunks]),
      [
        ['Button/./src/index.tsx', ['Button:0']],
        ['Dialog/./src/index.tsx', ['Dialog:0']],
      ],
    )
    assert.deepEqual(
      result.chunks.map(chunk => [chunk.id, chunk.names, chunk.files]),
      [
        ['Button:0', ['Button:main'], ['Button/main.js']],
        ['Dialog:0', ['Dialog:main'], ['Dialog/main.js']],
      ],
    )
  })

  it('is deterministic regardless of input order', () => {
    const first = mergeExampleBundleStats([
      source('Dialog'),
      source('Button'),
    ])
    const second = mergeExampleBundleStats([
      source('Button'),
      source('Dialog'),
    ])

    assert.deepEqual(first, second)
  })

  it('fails when no statistics are available', () => {
    assert.throws(
      () => mergeExampleBundleStats([]),
      /No example bundle statistics were found/u,
    )
  })

  it('fails when an example has no assets', () => {
    assert.throws(
      () =>
        mergeExampleBundleStats([{
          project: 'Button',
          stats: { assets: [] },
        }]),
      /Bundle statistics for Button contain no assets/u,
    )
  })
})
