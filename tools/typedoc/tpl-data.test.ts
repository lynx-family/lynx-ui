// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { doGenDocData, doTypeCalc, renderArrayType } from './tpl-data'

describe('doGenDocData', () => {
  it.each([false, true])(
    'stably groups Props, supporting entities, and Ref types with explicit config %s',
    async (hasExplicitConfig) => {
      const temporaryDirectory = mkdtempSync(
        join(tmpdir(), 'lynx-ui-typedoc-data-'),
      )
      const dataPath = join(temporaryDirectory, 'typedoc.json')
      const outputPath = join(temporaryDirectory, 'api-tpl.json')
      const names = [
        'FirstRef',
        'RefreshEvent',
        'SecondProps',
        'SupportInfo',
        'FirstProps',
        'SecondRef',
      ]

      try {
        writeFileSync(
          dataPath,
          JSON.stringify({
            groups: [{
              title: 'Interfaces',
              children: names.map((_, index) => index + 1),
            }],
            children: names.map((name, index) => ({
              id: index + 1,
              name,
              groups: [],
              children: [],
            })),
          }),
        )

        await doGenDocData(
          dataPath,
          outputPath,
          hasExplicitConfig,
          '@lynx-js/lynx-ui-example',
        )

        const output = JSON.parse(readFileSync(outputPath, 'utf8'))
        expect(output.children.map((item: { title: string }) => item.title))
          .toEqual([
            'SecondProps',
            'FirstProps',
            'RefreshEvent',
            'SupportInfo',
            'FirstRef',
            'SecondRef',
          ])
      } finally {
        rmSync(temporaryDirectory, { recursive: true, force: true })
      }
    },
  )
})

describe('renderArrayType', () => {
  it('parenthesizes union elements', () => {
    expect(renderArrayType({
      type: 'union',
      types: [
        { type: 'intrinsic', name: 'string' },
        { type: 'intrinsic', name: 'number' },
      ],
    }, false)).toBe('(string | number)[]')
  })

  it('parenthesizes intersection elements', () => {
    expect(renderArrayType({
      type: 'intersection',
      types: [
        { type: 'reference', name: 'A' },
        { type: 'reference', name: 'B' },
      ],
    }, false)).toBe('(A & B)[]')
  })

  it('does not add unnecessary parentheses to nested arrays', () => {
    expect(renderArrayType({
      type: 'array',
      elementType: { type: 'intrinsic', name: 'string' },
    }, false)).toBe('string[][]')
  })
})

describe('doTypeCalc', () => {
  it('preserves fields in object return types nested inside Promise', () => {
    expect(doTypeCalc({
      type: 'reflection',
      declaration: {
        signatures: [{
          type: {
            type: 'reference',
            name: 'Promise',
            typeArguments: [{
              type: 'reflection',
              declaration: {
                children: [
                  {
                    name: 'value',
                    type: { type: 'intrinsic', name: 'string' },
                  },
                  {
                    name: 'selectionStart',
                    type: { type: 'intrinsic', name: 'number' },
                  },
                  {
                    name: 'selectionEnd',
                    type: { type: 'intrinsic', name: 'number' },
                  },
                ],
              },
            }],
          },
        }],
      },
    }, false)).toBe(
      '() => Promise<{value: string, selectionStart: number, selectionEnd: number}>',
    )
  })
})
