// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useMemo, useRef } from '@lynx-js/react'

/**
 * useEffectEvent
 *
 * - Internally stores the latest `fn` in a ref, updated via useEffect.
 * - Returns a memoized proxy function that delegates calls to `ref.current`.
 * - Useful when extracting a non-reactive function dependency out of the reactive Effect around it.
 *
 * @param fn The callback function to be stabilized.
 * @returns A stable function that always invokes the latest `fn`.
 */

function useEffectEvent<TArgs extends unknown[]>(
  fn: ((...args: TArgs) => void) | undefined,
): (...args: TArgs) => void {
  const ref = useRef(fn)

  useEffect(() => {
    ref.current = fn
  }, [fn])

  // Stable proxy that delegates to the latest ref.
  // typed as F so calls are type-safe (no "unsafe call" rule).
  // useMemo is clearer here: to memoize a proxy function as a value,
  // not define an inline handler as with useCallback.
  return useMemo(() => {
    const proxy = (...args: TArgs) => {
      ref.current?.(...args)
    }
    return proxy
  }, [])
}

export { useEffectEvent }
