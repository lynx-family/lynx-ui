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
  getExampleAppDirname,
} from '../generate-references.mjs'

import { describe, expect, it } from 'vitest'

describe('lynx-ui-skills generator helpers', () => {
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

  it('builds component output paths', () => {
    expect(getComponentOutputDir('/tmp/out', 'scroll-view')).toBe(
      '/tmp/out/references/components/scroll-view',
    )
  })

  it('includes only packages that provide SKILL.md', async () => {
    const components = await collectIncludedComponents()
    const slugs = components.map(component => component.slug)

    expect(slugs).toContain('button')
    expect(slugs).toContain('dialog')
    expect(slugs).toContain('scroll-view')
    expect(slugs).not.toContain('checkbox')
    expect(slugs).not.toContain('sheet')
  })
})

describe('lynx-ui-skills generated output', () => {
  it('generates the expected reference tree in a temp directory', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'lynx-ui-skills-test-'),
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
        await expect(
          fs.stat(path.join(tempRoot, 'examples', component.displayName)),
        ).resolves.toBeTruthy()
      }

      await expect(
        fs.stat(path.join(tempRoot, 'references', 'components', 'checkbox')),
      ).rejects.toBeTruthy()
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true })
    }
  })
})
