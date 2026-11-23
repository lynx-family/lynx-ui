// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'

const packageRequire = createRequire(
  new URL('../../packages/lynx-ui-list/package.json', import.meta.url),
)
const ts = packageRequire('typescript')

test('scrolling gesture props accept typed gestures and compositions', () => {
  const fixturePath = path.join(
    import.meta.dirname,
    'gesture-props-consumer.mts',
  )
  const source = `
import type {
  BaseGesture, ComposedGesture, DefaultScrollGesture, FlingGesture,
  LongPressGesture, NativeGesture, PanGesture, TapGesture,
} from '../../packages/lynx-ui-list/node_modules/@lynx-js/gesture-runtime/dist/index.js'
import type { ListProps } from '../../packages/lynx-ui-list/src/types/index.docs.js'
import type { FeedListProps } from '../../packages/lynx-ui-feed-list/src/types/index.docs.js'
import type { ScrollViewProps } from '../../packages/lynx-ui-scroll-view/src/types/index.docs.js'
import type { ScrollCoordinatorProps } from '../../packages/lynx-ui-scroll-coordinator/src/types/index.docs.js'

declare const gesture:
  | BaseGesture | ComposedGesture | DefaultScrollGesture | FlingGesture
  | LongPressGesture | NativeGesture | PanGesture | TapGesture

export const listGesture: ListProps['main-thread:gesture'] = gesture
export const feedListGesture: FeedListProps['main-thread:gesture'] = gesture
export const scrollViewGesture: ScrollViewProps['main-thread:gesture'] = gesture
export const coordinatorGesture: ScrollCoordinatorProps['main-thread:gesture'] = gesture

// @ts-expect-error A callback function does not implement the gesture protocol.
export const invalidCallback: ListProps['main-thread:gesture'] = () => {}
// @ts-expect-error An object without gesture methods is not a gesture.
export const invalidObject: FeedListProps['main-thread:gesture'] = {}
`
  const options = {
    baseUrl: path.resolve(import.meta.dirname, '../..'),
    paths: {
      '@lynx-js/lynx-ui-list': [
        'packages/lynx-ui-list/src/types/index.docs',
      ],
      '@lynx-js/lynx-ui-common': ['packages/lynx-ui-common/src/index'],
    },
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: '@lynx-js/react',
    types: [],
  }
  const host = ts.createCompilerHost(options)
  const readFile = host.readFile.bind(host)
  host.readFile = file => file === fixturePath ? source : readFile(file)
  const program = ts.createProgram([fixturePath], options, host)
  const diagnostics = ts.getPreEmitDiagnostics(program)
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: file => file,
      getCurrentDirectory: () => import.meta.dirname,
      getNewLine: () => '\n',
    }),
  )
})
