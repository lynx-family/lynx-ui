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
