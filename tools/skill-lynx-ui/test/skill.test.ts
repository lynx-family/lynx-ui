// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { collectIncludedComponents } from '../generate-references.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'packages',
  'skill-lynx-ui',
)
const skillPath = path.join(packageRoot, 'SKILL.md')
const referencePath = path.join(packageRoot, 'reference.md')

describe('skill-lynx-ui SKILL.md', () => {
  it('contains valid frontmatter and progressive-disclosure guidance', async () => {
    const skillText = await fs.readFile(skillPath, 'utf8')

    expect(skillText.startsWith('---')).toBe(true)
    expect(skillText).toContain('name: lynx-ui')
    expect(skillText).toContain('description:')
    expect(skillText).toContain('reference.md')
    expect(skillText).toContain('routing guide')
    expect(skillText).toContain('guide.md')
    expect(skillText).toContain('api.md')
    expect(skillText).toContain('examples.md')
    expect(skillText).not.toContain('## Examples')
    expect(skillText).not.toContain('## API Definition')
  })

  it('routes every included component reference', async () => {
    const referenceText = await fs.readFile(referencePath, 'utf8')
    const components = await collectIncludedComponents()

    for (const component of components) {
      expect(referenceText).toContain(
        `references/components/${component.slug}/guide.md`,
      )
    }
  })
})
