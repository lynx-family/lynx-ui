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
        'from "@lynx-ui";\n\n## API Reference {#api}\n\n### ExampleProps {#api-example-props}\n\n<UIApiTable',
      )
      expect(content).toContain(
        '/>\n\n### ExampleRef {#api-example-ref}\n\n<UIApiTable',
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
        '## API Reference {#api}',
        '### Example {#api-example}',
        '#### Properties {#api-example-properties}',
        '#### Events {#api-example-events}',
        '### ExampleOptions {#api-example-options}',
        '### ExampleRef {#api-example-ref}',
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
        '### Swiper {#api-swiper}',
        '### SwiperItem {#api-swiper-item}',
        '### RenderFunctionProps {#api-render-function-props}',
        '### BounceableBasicProps {#api-bounceable-basic-props}',
        '### RefreshProps {#api-refresh-props}',
      ])
      expect(content).not.toContain('### SwiperProps')
      expect(content).not.toContain('### SwiperItemProps')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('generates one isolated UI variants table per component part', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')
    const propsEntity = (
      title: string,
      renderState: string,
    ) => ({
      title: `${title}Props`,
      children: [
        {
          title: 'Properties',
          children: [
            {
              name: 'children',
              type: `ReactNode | ((status: { ${renderState} }) => ReactNode)`,
            },
          ],
        },
      ],
    })
    const variantsEntity = (
      title: string,
      variants: string[],
      extendsTitle?: string,
    ) => ({
      title: `${title}UIVariants`,
      extendedTypes: extendsTitle ? [{ name: extendsTitle }] : undefined,
      children: [
        {
          title: 'Properties',
          children: variants.map(name => ({
            name,
            type: 'boolean',
            summary: [{ text: `${name} description.` }],
          })),
        },
      ],
    })

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [
            propsEntity(
              'Root',
              'active: boolean; checked: boolean; invalid: boolean',
            ),
            {
              title: 'IndicatorProps',
              children: [
                {
                  title: 'Properties',
                  children: [{ name: 'children', type: 'ReactNode' }],
                },
              ],
            },
            {
              title: 'VariantOnlyProps',
              children: [
                {
                  title: 'Properties',
                  children: [{ name: 'disabled', type: 'boolean' }],
                },
              ],
            },
            variantsEntity('Root', ['ui-active']),
            variantsEntity(
              'Indicator',
              ['ui-active', 'ui-invalid'],
              'RootUIVariants',
            ),
            variantsEntity('VariantOnly', ['ui-disabled']),
          ],
        }),
      )

      await doGenTplWithData(
        dataPath,
        outputPath,
        true,
        ['Root', 'Indicator', 'VariantOnly'],
        new Set(['Root', 'Indicator', 'VariantOnly']),
      )

      const content = readFileSync(outputPath, 'utf8')
      const tables = content.match(
        /<ClassRenderPropTable source=\{\[[\s\S]*?\]\}\/>/g,
      )
      expect(tables).toHaveLength(3)
      expect(tables?.[0]).toContain('"className": "ui-active"')
      expect(tables?.[0]).not.toContain('ui-checked')
      expect(tables?.[0]).not.toContain('ui-invalid')
      expect(tables?.[1]).toContain('"className": "ui-active"')
      expect(tables?.[1]).toContain('"className": "ui-invalid"')
      expect(tables?.[1]).not.toContain('ui-checked')
      expect(tables?.[2]).toContain('"className": "ui-disabled"')
      expect(tables?.[2]).toContain('"description": "ui-disabled description."')
      expect(tables?.[2]).not.toContain('"Render Prop"')
      expect(content.match(/^### .+$/gm)).toEqual([
        '### Root {#api-root}',
        '### Indicator {#api-indicator}',
        '### VariantOnly {#api-variant-only}',
      ])
      expect(content).not.toContain('#### Root')
      expect(content).not.toContain('#### Indicator')
      expect(content).not.toContain('#### VariantOnly')
      expect(content.indexOf(tables?.[0] ?? '')).toBeLessThan(
        content.indexOf('### Indicator'),
      )
      expect(content.indexOf(tables?.[1] ?? '')).toBeGreaterThan(
        content.indexOf('### Indicator'),
      )
      expect(content.indexOf(tables?.[2] ?? '')).toBeGreaterThan(
        content.indexOf('### VariantOnly'),
      )
      expect(content).not.toContain('### RootUIVariants')
      expect(content).not.toContain('### IndicatorUIVariants')
      expect(content).not.toContain('### VariantOnlyUIVariants')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('rejects ambiguous UI variant ownership', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')
    const variantsEntity = {
      title: 'ExampleUIVariants',
      children: [
        {
          title: 'Properties',
          children: [{ name: 'ui-active', type: 'boolean' }],
        },
      ],
    }

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [variantsEntity, variantsEntity],
        }),
      )

      await expect(
        doGenTplWithData(dataPath, outputPath),
      ).rejects.toThrow(
        'Multiple UI variant declarations found for ExampleUIVariants.',
      )
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
