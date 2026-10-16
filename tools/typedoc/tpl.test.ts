// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { doGenTplWithData, getDefaultUiVariantDescription } from './tpl'

describe('getDefaultUiVariantDescription', () => {
  it('describes boolean render props as active when true', () => {
    expect(getDefaultUiVariantDescription('disabled', 'boolean')).toBe(
      'Applied when `status.disabled` is true.',
    )
  })

  it('describes nullable render props as active when non-null', () => {
    expect(getDefaultUiVariantDescription('value', 'string | null')).toBe(
      'Applied when `status.value` is not `null`.',
    )
  })
})

describe('doGenTplWithData', () => {
  it('imports documentation components from the bare public entry', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')

    try {
      writeFileSync(dataPath, JSON.stringify({ children: [] }))

      await doGenTplWithData(dataPath, outputPath)

      const content = readFileSync(outputPath, 'utf8')
      expect(content).toContain(
        'from "@lynx-ui";',
      )
      expect(content).not.toContain('@lynx-ui/index')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })
})
