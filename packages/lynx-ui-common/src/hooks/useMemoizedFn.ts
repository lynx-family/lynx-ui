// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo, useRef } from '@lynx-js/react'

type noop = (this: unknown, ...args: unknown[]) => void

type PickFunction<T extends noop> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>

/**
 * Hooks for persistent functions. In general, useMemoizedFn can be used instead of useCallback.
 * In some scenarios, we need to use useCallback to cache a function, but when the second parameter deps changes, the function will be regenerated, causing the function reference to change.
 */
function useMemoizedFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn)

  // why not write `fnRef.current = fn`?
  // https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo<T>(() => fn, [fn])

  const memoizedFn = useRef<PickFunction<T>>()
  memoizedFn.current ??= function(this, ...args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fnRef.current.apply(this, args)
  }

  return memoizedFn.current as unknown as T
}

export { useMemoizedFn }
