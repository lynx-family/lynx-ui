// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import { transformReactLynxSync } from '@lynx-js/react/transform'
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript'
import { describe, expect, it, vi } from 'vitest'

import type { FeedListProps, FeedListRef } from '../src/types'

// cspell:ignore wklt

// Compile the real component before evaluating it. Ordinary TSX rendering does
// not reproduce eager member reads introduced by worklet capture generation.
const filename = 'FeedList.jsx'
const source = readFileSync(
  new URL('../src/index.tsx', import.meta.url),
  'utf8',
)
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText
const transformed = transformReactLynxSync(jsx, {
  filename,
  pluginName: 'refresh-capture-test',
  isModule: true,
  sourcemap: false,
  snapshot: false,
  cssScope: false,
  shake: false,
  compat: false,
  refresh: false,
  defineDCE: false,
  directiveDCE: false,
  worklet: { filename, target: 'LEPUS', runtimePkg: '@lynx-js/react' },
})
if (transformed.errors.length > 0) {
  throw new Error(JSON.stringify(transformed.errors))
}
const compiled = transpileModule(transformed.code, {
  compilerOptions: {
    jsx: JsxEmit.React,
    jsxFactory: 'createElement',
    module: ModuleKind.CommonJS,
    target: ScriptTarget.ESNext,
  },
  fileName: filename,
}).outputText

interface Worklet {
  _wkltId: string
}

function createComponent() {
  const hookStartRefresh = vi.fn()
  const hookFinishRefresh = vi.fn()
  const useRefreshAndBounce = vi.fn(() => ({
    startRefreshMethod: hookStartRefresh,
    finishRefresh: hookFinishRefresh,
  }))
  const invoke = vi.fn()
  const select = vi.fn(() => ({
    invoke: (args: unknown) => {
      invoke(args)
      return { exec: vi.fn() }
    },
  }))
  const definitions = new Map<string, (this: Worklet) => void>()
  const runOnMainThread = vi.fn((command: Worklet | (() => void)) => () => {
    if (typeof command === 'function') {
      command()
    } else {
      definitions.get(command._wkltId)!.call(command)
    }
  })
  const identity = (value: unknown) => value
  const runtime = {
    forwardRef: identity,
    memo: identity,
    loadWorkletRuntime: () => true,
    runOnMainThread,
    useRef: (current: unknown) => ({ current }),
    useState: (value: unknown) => [value, vi.fn()],
    useImperativeHandle: (
      ref: { current: FeedListRef | null },
      create: () => FeedListRef,
    ) => {
      ref.current = create()
    },
  }
  const exports: {
    FeedList?: (
      props: FeedListProps,
      ref: { current: FeedListRef | null },
    ) => unknown
  } = {}
  runInNewContext(compiled, {
    exports,
    require: (specifier: string) => {
      switch (specifier) {
        case '@lynx-js/react':
          return runtime
        case '@lynx-js/lynx-ui-list':
          return { List: 'list' }
        case './hooks/useRefresh':
          return { useRefreshAndBounce }
        case './styles.css':
          return {}
        default:
          throw new Error(`Unexpected import: ${specifier}`)
      }
    },
    createElement: (...args: unknown[]) => args,
    registerWorkletInternal: (
      _type: string,
      id: string,
      definition: (this: Worklet) => void,
    ) => definitions.set(id, definition),
    lynx: { createSelectorQuery: () => ({ select }) },
  })
  return {
    FeedList: exports.FeedList!,
    hookStartRefresh,
    hookFinishRefresh,
    useRefreshAndBounce,
    invoke,
    select,
    runOnMainThread,
  }
}

describe('FeedList refresh worklet capture', () => {
  it.each(
    [
      { mode: 'disabled', bounce: false },
      { mode: 'disabled', bounce: true },
      { mode: 'native', bounce: false },
      { mode: 'native', bounce: true },
      { mode: 'hook', bounce: false },
      { mode: 'hook', bounce: true },
    ] as const,
  )(
    'renders and dispatches refresh with $mode refresh and bounce=$bounce',
    ({ mode, bounce }) => {
      const component = createComponent()
      const ref: { current: FeedListRef | null } = { current: null }
      component.FeedList({
        listId: 'capture-test',
        bounceableOptions: bounce,
        refreshOptions: mode === 'disabled'
          ? false
          : { enableRefresh: true, mode, headerContent: null },
      }, ref)

      expect(component.useRefreshAndBounce).toHaveBeenCalledTimes(
        bounce || mode === 'hook' ? 1 : 0,
      )
      ref.current!.startRefresh()
      ref.current!.finishRefresh()

      expect(component.hookStartRefresh).toHaveBeenCalledTimes(
        mode === 'hook' ? 1 : 0,
      )
      expect(component.hookFinishRefresh).toHaveBeenCalledTimes(
        mode === 'hook' ? 1 : 0,
      )
      expect(component.select.mock.calls).toEqual(
        mode === 'native'
          ? [
            ['#capture-test-refreshView'],
            ['#capture-test-refreshView'],
          ]
          : [],
      )
      expect(component.invoke.mock.calls).toEqual(
        mode === 'native'
          ? [
            [{ method: 'autoStartRefresh' }],
            [{ method: 'finishRefresh' }],
          ]
          : [],
      )
      expect(component.runOnMainThread).toHaveBeenCalledTimes(
        mode === 'native' ? 0 : (mode === 'hook' ? 2 : 1),
      )
    },
  )
})
