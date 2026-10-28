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

      await doGenTplWithData(dataPath, outputPath, { parts: [] })

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

      await doGenTplWithData(
        dataPath,
        outputPath,
        {
          parts: ['Example'],
          refs: ['ExampleRef'],
        },
        new Set(['Example']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(content).toContain(
        'from "@lynx-ui";\n\n## Component API {#api}\n\n### Example {#api-example}\n\n<UIApiTable',
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

      await doGenTplWithData(
        dataPath,
        outputPath,
        { parts: ['Example'] },
        new Set(['Example']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(content).toContain(example)
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('uses an explicit API entity selection and fixed heading hierarchy', async () => {
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
              title: 'LibraryRef',
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
            {
              title: 'SupportProps',
              children: [
                {
                  title: 'Properties',
                  children: [tableItem],
                },
              ],
            },
            {
              title: 'OrphanEvent',
              children: [
                {
                  title: 'Properties',
                  children: [tableItem],
                },
              ],
            },
            {
              title: 'EmbeddedStatus',
              children: [
                {
                  title: 'Properties',
                  children: [tableItem],
                },
              ],
            },
          ],
        }),
      )

      await doGenTplWithData(
        dataPath,
        outputPath,
        {
          parts: ['Example'],
          refs: ['ExampleRef', 'LibraryRef'],
          supportingTypes: ['SupportProps', 'ExampleOptions'],
          embeddedTypes: ['EmbeddedStatus'],
        },
        new Set(['Example']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(
        content.match(/^#{2,4} .+$/gm),
      ).toEqual([
        '## Component API {#api}',
        '### Example {#api-example}',
        '### ExampleRef {#api-example-ref}',
        '### LibraryRef {#api-library-ref}',
        '## Supporting Types {#api-supporting-types}',
        '### SupportProps {#api-supporting-types-support-props}',
        '### ExampleOptions {#api-supporting-types-example-options}',
      ])
      expect(
        content.match(/<UIApiTable title="Properties"/g),
      ).toHaveLength(1)
      expect(
        content.match(/<UIApiTable title="Events"/g),
      ).toHaveLength(1)
      expect(content).toContain(
        '### SupportProps {#api-supporting-types-support-props}\n\n<UIApiTable source=',
      )
      expect(content).not.toContain('OrphanEvent')
      expect(content).not.toContain('EmbeddedStatus')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('renders state tables only for runtime component parts', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')
    const renderChildren = {
      name: 'children',
      type: '(status: { open?: boolean }) => ReactNode',
    }

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [
            {
              title: 'ExampleProps',
              children: [{
                title: 'Properties',
                children: [renderChildren],
              }],
            },
            {
              title: 'SupportProps',
              children: [{
                title: 'Properties',
                children: [renderChildren],
              }],
            },
          ],
        }),
      )

      await doGenTplWithData(
        dataPath,
        outputPath,
        {
          parts: ['Example'],
          supportingTypes: ['SupportProps'],
        },
        new Set(['Example']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(content.match(/<ClassRenderPropTable/g)).toHaveLength(1)
      expect(content).toContain('"renderProp": "open"')
      expect(content).not.toContain('"className": "ui-open"')

      const supportingSection = content.slice(
        content.indexOf('## Supporting Types'),
      )
      expect(supportingSection).toContain('"name": "children"')
      expect(supportingSection).not.toContain('<ClassRenderPropPreamble')
      expect(supportingSection).not.toContain('<ClassRenderPropTable')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('derives part descriptions from render-state inheritance', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')
    const activeVariant = {
      name: 'ui-active',
      type: 'boolean',
      summary: [{ text: 'Applied while active.' }],
    }
    const classOnlyVariant = {
      name: 'ui-open',
      type: 'boolean',
      summary: [{ text: 'Applied while open.' }],
    }

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [
            {
              title: 'RootProps',
              children: [{
                title: 'Properties',
                children: [{
                  name: 'children',
                  type: '(status: { active: boolean }) => ReactNode',
                }],
              }],
            },
            {
              title: 'IndicatorProps',
              children: [{
                title: 'Properties',
                children: [{ name: 'children', type: 'ReactNode' }],
              }],
            },
            {
              title: 'RootUIVariants',
              comment: {
                summary: [{ text: 'Stale authored root description.' }],
              },
              children: [{
                title: 'Properties',
                children: [activeVariant, classOnlyVariant],
              }],
            },
            {
              title: 'IndicatorUIVariants',
              comment: {
                summary: [{ text: 'Stale authored indicator description.' }],
              },
              extendedTypes: [{ name: 'RootUIVariants' }],
              children: [{
                title: 'Properties',
                children: [activeVariant, classOnlyVariant],
              }],
            },
          ],
        }),
      )

      await doGenTplWithData(
        dataPath,
        outputPath,
        {
          parts: ['Root', 'Indicator'],
        },
        new Set(['Root', 'Indicator']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(content.match(/<ClassRenderPropPreamble/g)).toHaveLength(1)
      expect(content.match(/<ClassRenderPropTable/g)).toHaveLength(2)
      expect(content).toContain(
        'UI variants applied by Root based on its render state.',
      )
      expect(content).toContain('"renderProp": "active"')
      expect(content).not.toContain('"Render Prop"')
      expect(content).toContain(
        'UI variants applied by Indicator.',
      )
      expect(content).toContain(
        '"className": "ui-open",\n    "item":',
      )
      const indicatorSection = content.slice(content.indexOf('### Indicator '))
      expect(indicatorSection).not.toContain('"renderProp": "active"')
      expect(content).not.toContain('Stale authored')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('uses declared part variants as the complete package contract', async () => {
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
              title: 'ProviderProps',
              children: [{
                title: 'Properties',
                children: [{
                  name: 'children',
                  type: '(state: { value: string | null }) => ReactNode',
                }],
              }],
            },
            {
              title: 'ItemProps',
              children: [{
                title: 'Properties',
                children: [{ name: 'value', type: 'string' }],
              }],
            },
            {
              title: 'ItemUIVariants',
              children: [{
                title: 'Properties',
                children: [{
                  name: 'ui-checked',
                  type: 'boolean',
                  summary: [{ text: 'Applied while checked.' }],
                }],
              }],
            },
          ],
        }),
      )

      await doGenTplWithData(
        dataPath,
        outputPath,
        {
          parts: ['Provider', 'Item'],
        },
        new Set(['Provider', 'Item']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(content.match(/<ClassRenderPropPreamble/g)).toHaveLength(1)
      expect(content.match(/<ClassRenderPropTable/g)).toHaveLength(2)
      expect(content).toContain(
        'Provider exposes the following render prop states.',
      )
      expect(content).toContain('"renderProp": "value"')
      expect(content).not.toContain('"className": "ui-value"')
      expect(content).toContain('UI variants applied by Item.')
      expect(content).toContain('"className": "ui-checked"')
      expect(content).not.toContain('"className": "ui-value"')

      const providerSection = content.slice(content.indexOf('### Provider '))
      expect(providerSection).toContain('<ClassRenderPropPreamble')
      expect(providerSection).toContain('"renderProp": "value"')
      const itemSection = content.slice(content.indexOf('### Item '))
      expect(itemSection).not.toContain('<ClassRenderPropPreamble')
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('rejects configured entities missing from serialized TypeDoc data', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-typedoc-'),
    )
    const dataPath = join(temporaryDirectory, 'api-tpl.json')
    const outputPath = join(temporaryDirectory, 'docs', 'APIReference.mdx')

    try {
      writeFileSync(
        dataPath,
        JSON.stringify({
          children: [{
            title: 'ExampleProps',
            children: [],
          }],
        }),
      )

      await expect(
        doGenTplWithData(
          dataPath,
          outputPath,
          {
            parts: ['Example'],
            supportingTypes: ['MissingOptions'],
          },
          new Set(['Example']),
        ),
      ).rejects.toThrow(
        'Configured API entities were not serialized: MissingOptions',
      )
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('rejects unmatched UI variant declarations', async () => {
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
              children: [],
            },
            {
              title: 'ExampleIndicatorUIVariants',
              children: [{
                title: 'Properties',
                children: [{
                  name: 'ui-active',
                  type: 'boolean',
                }],
              }],
            },
          ],
        }),
      )

      await expect(
        doGenTplWithData(
          dataPath,
          outputPath,
          { parts: ['Example'] },
          new Set(['Example']),
        ),
      ).rejects.toThrow(
        'UI variant declarations are not configured as runtime parts or '
          + 'embedded types: ExampleIndicatorUIVariants',
      )
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('groups runtime component parts before refs and supporting entities', async () => {
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
              title: 'BounceableBasicProps',
              flag: '###',
              children: properties,
            },
            {
              title: 'SwiperItemProps',
              flag: '###',
              children: properties,
            },
            {
              title: 'RefreshEvent',
              flag: '###',
              children: properties,
            },
            {
              title: 'SwiperRef',
              flag: '###',
              children: properties,
            },
            {
              title: 'RenderFunctionProps',
              flag: '###',
              children: properties,
            },
            {
              title: 'RefreshOptions',
              flag: '###',
              children: properties,
            },
          ],
        }),
      )

      await doGenTplWithData(
        dataPath,
        outputPath,
        {
          parts: ['Swiper', 'SwiperItem'],
          refs: ['SwiperRef'],
          supportingTypes: [
            'BounceableBasicProps',
            'RenderFunctionProps',
            'RefreshOptions',
          ],
        },
        new Set(['Swiper', 'SwiperItem']),
      )

      const content = readFileSync(outputPath, 'utf8')
      expect(content.match(/^#{2,3} .+$/gm)).toEqual([
        '## Component API {#api}',
        '### Swiper {#api-swiper}',
        '### SwiperItem {#api-swiper-item}',
        '### SwiperRef {#api-swiper-ref}',
        '## Supporting Types {#api-supporting-types}',
        '### BounceableBasicProps {#api-supporting-types-bounceable-basic-props}',
        '### RenderFunctionProps {#api-supporting-types-render-function-props}',
        '### RefreshOptions {#api-supporting-types-refresh-options}',
      ])
      expect(content).not.toContain('### SwiperProps')
      expect(content).not.toContain('### SwiperItemProps')
      expect(content).not.toContain('RefreshEvent')
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

      await doGenTplWithData(dataPath, outputPath, { parts: [] })

      const content = readFileSync(outputPath, 'utf8')
      expect(content).not.toContain('## Component API')
      expect(content).not.toContain('## Supporting Types')
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

      await doGenTplWithData(
        dataPath,
        outputPath,
        { parts: ['Example'] },
        new Set(['Example']),
      )
      const firstOutput = readFileSync(outputPath)

      await doGenTplWithData(
        dataPath,
        outputPath,
        { parts: ['Example'] },
        new Set(['Example']),
      )
      const secondOutput = readFileSync(outputPath)

      expect(secondOutput).toEqual(firstOutput)
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })
})
