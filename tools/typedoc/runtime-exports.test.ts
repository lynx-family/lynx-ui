// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { collectPublicRuntimeExportNames } from './runtime-exports'

describe('collectPublicRuntimeExportNames', () => {
  it('collects direct value exports and excludes type-only exports', () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-runtime-exports-'),
    )
    const entryPoint = join(temporaryDirectory, 'index.ts')

    try {
      writeFileSync(
        join(temporaryDirectory, 'package.json'),
        '{"type":"module"}',
      )
      writeFileSync(
        entryPoint,
        [
          'export function Example() {}',
          'export interface ExampleProps {}',
          'class TypeOnlyClass {}',
          'export type { ExampleProps as PublicExampleProps }',
          'export type { TypeOnlyClass }',
        ].join('\n'),
      )

      expect(collectPublicRuntimeExportNames(entryPoint)).toEqual(
        new Set(['Example']),
      )
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('resolves aliased re-exports before checking for runtime values', () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'lynx-ui-runtime-exports-'),
    )
    const sourceDirectory = join(temporaryDirectory, 'source')
    const entryPoint = join(temporaryDirectory, 'index.ts')

    try {
      mkdirSync(sourceDirectory)
      writeFileSync(
        join(temporaryDirectory, 'package.json'),
        '{"type":"module"}',
      )
      writeFileSync(
        join(sourceDirectory, 'component.ts'),
        [
          'export const InternalComponent = () => null',
          'export class TypeOnlyComponent {}',
          'export interface InternalComponentProps {}',
        ].join('\n'),
      )
      writeFileSync(
        join(sourceDirectory, 'reexports.ts'),
        'export type { TypeOnlyComponent } from \'./component\'',
      )
      writeFileSync(
        entryPoint,
        [
          'export { InternalComponent as PublicComponent } from \'./source/component\'',
          'export { TypeOnlyComponent as PublicTypeOnlyComponent } from \'./source/reexports\'',
          'export type { InternalComponentProps as PublicComponentProps } from \'./source/component\'',
        ].join('\n'),
      )

      expect(collectPublicRuntimeExportNames(entryPoint)).toEqual(
        new Set(['PublicComponent']),
      )
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })
})
