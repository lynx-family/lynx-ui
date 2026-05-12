// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  collectIncludedComponents,
  componentSlugFromPackageName,
  generateReferences,
  getComponentOutputDir,
  getExampleAppPaths,
  getExampleAppDirname,
} from '../generate-references.mjs'

import { describe, expect, it } from 'vitest'

describe('skill-lynx-ui generator helpers', () => {
  it('derives component slugs from package names', () => {
    expect(componentSlugFromPackageName('lynx-ui-scroll-view')).toBe(
      'scroll-view',
    )
    expect(componentSlugFromPackageName('lynx-ui-lazy-component')).toBe(
      'lazy-component',
    )
  })

  it('maps component slugs to example app names', () => {
    expect(getExampleAppDirname('scroll-view')).toBe('ScrollView')
    expect(getExampleAppDirname('feed-list')).toBe('FeedList')
  })

  it('maps component slugs to OSS example app paths', () => {
    expect(getExampleAppPaths('swiper')).toEqual([
      {
        label: 'oss',
        path: expect.stringContaining('apps/examples/Swiper'),
      },
    ])
  })

  it('builds component output paths', () => {
    expect(getComponentOutputDir('/tmp/out', 'scroll-view')).toBe(
      '/tmp/out/references/components/scroll-view',
    )
  })

  it('includes only packages that provide SKILL.md and API docs', async () => {
    const components = await collectIncludedComponents()
    const slugs = components.map(component => component.slug)

    expect(slugs).toContain('dialog')
    expect(slugs).toContain('button')
    expect(slugs).toContain('popover')
    expect(slugs).toContain('sheet')
    expect(slugs).toContain('slider')
    expect(slugs).toContain('swiper')
    expect(slugs).not.toContain('checkbox')
  })
})

describe('skill-lynx-ui generated output', () => {
  it('generates the expected reference tree in a temp directory', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'skill-lynx-ui-test-'),
    )

    try {
      const components = await generateReferences(tempRoot)

      await expect(
        fs.stat(path.join(tempRoot, 'examples.md')),
      ).resolves.toBeTruthy()
      await expect(
        fs.stat(path.join(tempRoot, 'references', 'index.md')),
      ).resolves.toBeTruthy()

      for (const component of components) {
        const componentDir = getComponentOutputDir(tempRoot, component.slug)
        await expect(
          fs.stat(path.join(componentDir, 'guide.md')),
        ).resolves.toBeTruthy()
        await expect(
          fs.stat(path.join(componentDir, 'api.md')),
        ).resolves.toBeTruthy()
        await expect(
          fs.stat(path.join(componentDir, 'examples.md')),
        ).resolves.toBeTruthy()
      }

      await expect(
        fs.stat(path.join(tempRoot, 'references', 'components', 'checkbox')),
      ).rejects.toBeTruthy()
      await expect(fs.stat(path.join(tempRoot, 'examples'))).rejects
        .toBeTruthy()
    } finally {
      await fs.rm(tempRoot, { force: true, recursive: true })
    }
  })
})
