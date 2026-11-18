// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { expect, it, vi } from 'vitest'

import { useSheetContentController } from './useSheetContentController'

const mocks = vi.hoisted(() => {
  const methods = {
    snapTo: vi.fn(),
    expand: vi.fn(),
    collapse: vi.fn(),
    close: vi.fn(),
    show: vi.fn(),
  }
  return { methods, register: vi.fn() }
})

vi.mock('@lynx-js/react', () => ({
  useRef: <T>(value: T) => ({ current: value }),
  useEffect: (fn: () => void) => fn(),
}))
vi.mock('@lynx-js/lynx-ui-common', () => ({ useMemoizedFn: <T>(fn: T) => fn }))
vi.mock('../utils', () => ({ getDefaultRubberBand: () => false }))
vi.mock('../context', () => ({
  useSheetContext: () => ({
    resolvedSide: 'bottom',
    show: false,
    registerMethods: mocks.register,
  }),
}))
vi.mock('./useSnap', () => ({ useSnap: () => mocks.methods }))

it('passes the public animation override to every imperative command', () => {
  // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for direct hook unit tests.
  useSheetContentController({})
  const registered = mocks.register.mock.calls[0][0]
  const transition = { type: 'tween', duration: 500 }
  const options = { animate: false, snapAnimation: transition }
  const expected = {
    animate: false,
    animationConfig: transition,
    isEntry: undefined,
  }
  registered.snapTo(1, options)
  registered.expand(options)
  registered.collapse(options)
  registered.close(options)
  registered.show(options)
  expect(mocks.methods.snapTo).toHaveBeenCalledWith(1, expected)
  for (const method of ['expand', 'collapse', 'close', 'show'] as const) {
    expect(mocks.methods[method]).toHaveBeenCalledWith(expected)
  }
})
