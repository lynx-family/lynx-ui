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

  it('joins non-empty generated sections with one blank line', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')
    const tableItem = {
      name: 'value',
      type: 'string',
    }

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [
            {
              title: 'ExampleProps',
              children: [
                {
                  title: 'Properties',
                  children: [tableItem],
                },
              ],
            },
            {
              title: 'ExampleRef',
              children: [
                {
                  children: [tableItem],
                },
              ],
            },
          ],
        }),
      )

      await doGenTplWithData(dataPath, outputPath)

      const content = readFileSync(outputPath, 'utf8')
      expect(content).toContain(
        'from "@lynx-ui";\n\n## API\n\n### ExampleProps\n\n<UIApiTable',
      )
      expect(content).toContain(
        '/>\n\n### ExampleRef\n\n<UIApiTable',
      )
      expect(content).not.toMatch(/\n{3,}/)
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('preserves intentional whitespace inside generated sections', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')
    const example = [
      'Example:',
      '',
      '```ts',
      'const first = 1',
      '',
      '',
      'const second = 2',
      '```',
    ].join('\n')

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [
            {
              title: 'ExampleProps',
              comment: {
                summary: [{ text: example }],
              },
              children: [
                {
                  title: 'Properties',
                  children: [],
                },
              ],
            },
          ],
        }),
      )

      await doGenTplWithData(dataPath, outputPath)

      const content = readFileSync(outputPath, 'utf8')
      expect(content).toContain(example)
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('uses a fixed heading hierarchy for primitive APIs', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')
    const tableItem = {
      name: 'value',
      type: 'string',
    }

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [
            {
              title: 'ExampleProps',
              children: [
                {
                  title: 'Properties',
                  children: [tableItem],
                },
                {
                  title: 'Events',
                  children: [tableItem],
                },
              ],
            },
            {
              title: 'ExampleRef',
              children: [
                {
                  children: [tableItem],
                },
              ],
            },
            {
              title: 'ExampleOptions',
              typeAlias: tableItem,
            },
          ],
        }),
      )

      await doGenTplWithData(
        dataPath,
        outputPath,
        true,
        ['Example', 'ExampleOptions'],
        new Set(['Example']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(
        content.match(/^#{2,4} .+$/gm),
      ).toEqual([
        '## API',
        '### Example',
        '#### Properties',
        '#### Events',
        '### ExampleOptions',
        '### ExampleRef',
      ])
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('uses runtime exports for every component Props display title', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')
    const properties = [
      {
        title: 'Properties',
        flag: '####',
        children: [{ name: 'value', type: 'string' }],
      },
    ]

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [
            {
              title: 'SwiperProps',
              flag: '###',
              children: properties,
            },
            {
              title: 'SwiperItemProps',
              flag: '###',
              children: properties,
            },
            {
              title: 'RenderFunctionProps',
              flag: '###',
              children: properties,
            },
            {
              title: 'BounceableBasicProps',
              flag: '###',
              children: properties,
            },
            {
              title: 'RefreshProps',
              flag: '###',
              children: properties,
            },
          ],
        }),
      )

      await doGenTplWithData(
        dataPath,
        outputPath,
        false,
        undefined,
        new Set(['Swiper', 'SwiperItem']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(content.match(/^### .+$/gm)).toEqual([
        '### Swiper',
        '### SwiperItem',
        '### RenderFunctionProps',
        '### BounceableBasicProps',
        '### RefreshProps',
      ])
      expect(content).not.toContain('### SwiperProps')
      expect(content).not.toContain('### SwiperItemProps')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('omits the API heading when no API sections are generated', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')

    try {
      writeFileSync(dataPath, JSON.stringify({ children: [] }))

      await doGenTplWithData(dataPath, outputPath)

      const content = readFileSync(outputPath, 'utf8')
      expect(content).not.toContain('## API')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('produces byte-identical output when regenerated', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [
            {
              title: 'ExampleProps',
              children: [
                {
                  title: 'Properties',
                  children: [
                    {
                      name: 'value',
                      type: 'string',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      )

      await doGenTplWithData(dataPath, outputPath)
      const firstOutput = readFileSync(outputPath)

      await doGenTplWithData(dataPath, outputPath)
      const secondOutput = readFileSync(outputPath)

      expect(secondOutput).toEqual(firstOutput)
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })
})
