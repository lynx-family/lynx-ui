// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { describe, expect, it } from 'vitest'

import { doTypeCalc, renderArrayType } from './tpl-data'

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
