// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRef, runOnBackground } from '@lynx-js/react'

import { act, render } from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FeedList } from '../src'
import type { FeedListRef } from '../src/types'

const {
  hookStartRefresh,
  hookFinishRefresh,
  useRefreshAndBounce,
} = vi.hoisted(() => ({
  hookStartRefresh: vi.fn(),
  hookFinishRefresh: vi.fn(),
  useRefreshAndBounce: vi.fn(),
}))

vi.mock('../src/hooks/useRefresh', () => ({
  useRefreshAndBounce: (...args: unknown[]) => {
    useRefreshAndBounce(...args)
    return {
      startRefreshMethod: () => {
        'main thread'
        runOnBackground(hookStartRefresh)()
      },
      finishRefresh: () => {
        'main thread'
        runOnBackground(hookFinishRefresh)()
      },
    }
  },
}))

interface InvokeOptions {
  method: string
}

const invokeMock = vi.fn((_options: InvokeOptions) => ({ exec: vi.fn() }))

beforeEach(() => {
  hookStartRefresh.mockClear()
  hookFinishRefresh.mockClear()
  useRefreshAndBounce.mockClear()
  invokeMock.mockClear()
  const prototype = Object.getPrototypeOf(
    lynx.createSelectorQuery().selectUniqueID(0),
  ) as { invoke: (options: InvokeOptions) => { exec: () => void } }
  vi.spyOn(prototype, 'invoke').mockImplementation(invokeMock)
})

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
    async ({ mode, bounce }) => {
      const ref = createRef<FeedListRef>()
      const { container } = render(
        <FeedList
          ref={ref}
          listId='capture-test'
          bounceableOptions={bounce}
          refreshOptions={mode === 'disabled'
            ? false
            : { enableRefresh: true, mode, headerContent: null }}
        />,
      )

      expect(useRefreshAndBounce).toHaveBeenCalledTimes(
        bounce || mode === 'hook' ? 1 : 0,
      )
      expect(container.querySelector('#capture-test-refreshView') !== null)
        .toBe(mode === 'native')

      await act(async () => {
        ref.current!.startRefresh()
        ref.current!.finishRefresh()
        await Promise.resolve()
      })

      expect(hookStartRefresh).toHaveBeenCalledTimes(mode === 'hook' ? 1 : 0)
      expect(hookFinishRefresh).toHaveBeenCalledTimes(mode === 'hook' ? 1 : 0)
      expect(invokeMock.mock.calls.map(([options]) => options)).toEqual(
        mode === 'native'
          ? [
            { method: 'autoStartRefresh' },
            { method: 'finishRefresh' },
          ]
          : [],
      )
    },
  )
})
