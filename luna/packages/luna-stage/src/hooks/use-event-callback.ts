// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo, useRef } from 'react'

import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect'

/**
 * useEventCallback
 *
 * Returns a stable callback whose identity never changes across renders, but
 * which always invokes the latest `fn` from props/state. Useful for passing
 * callbacks to child components, event handlers, or external systems without
 * re-binding on every render and without stale-closure bugs.
 *
 * Unlike React's experimental `useEffectEvent`, this hook returns a stable
 * proxy that can be passed around anywhere — including during render, in
 * effects, event handlers, and async callbacks. However, the proxy itself
 * must not be called during render. This is the pattern commonly known as
 * `useEvent` (React RFC #1825) or `useEventCallback` (Material UI, react-use).
 *
 * - Internally stores the latest `fn` in a ref, synced via
 *   `useIsomorphicLayoutEffect` so the ref is fresh by the time any
 *   post-commit layout-phase code (or anything that follows) reads it.
 * - Returns a memoized proxy that delegates to `ref.current`.
 * - When `fn` is `undefined`, the proxy returns `fallbackResult` (or
 *   `undefined` if no fallback is provided — the proxy's return type then
 *   widens to include `undefined`).
 *
 * Caveat: calling the proxy during render still returns the *previous*
 * render's `fn`, because the ref is synced after commit. This matches React's
 * own rule that `useEffectEvent` must not be called during render.
 *
 * @param fn The callback function to be stabilized. May be `undefined`.
 * @param fallbackResult Value returned when `fn` is `undefined`. Defaults to
 *   `undefined`, in which case the return type widens accordingly.
 * @returns A stable function that always calls the latest `fn`.
 */
function useEventCallback<TArgs extends unknown[]>(
  fn: ((...args: TArgs) => void) | undefined,
): (...args: TArgs) => void

function useEventCallback<TArgs extends unknown[], TResult>(
  fn: ((...args: TArgs) => TResult) | undefined,
  fallbackResult: TResult,
): (...args: TArgs) => TResult

function useEventCallback<TArgs extends unknown[], TResult>(
  fn: ((...args: TArgs) => TResult) | undefined,
): (...args: TArgs) => TResult | undefined

function useEventCallback<TArgs extends unknown[], TResult>(
  fn: ((...args: TArgs) => TResult) | undefined,
  fallbackResult?: TResult,
): (...args: TArgs) => TResult | undefined {
  const fnRef = useRef(fn)
  const fallbackRef = useRef(fallbackResult)

  // Layout effect, not passive effect: ensures the ref is up-to-date before
  // any subsequent useLayoutEffect / useEffect in the tree reads it. The
  // proxy is therefore safe to call from any effect phase.
  useIsomorphicLayoutEffect(() => {
    fnRef.current = fn
    fallbackRef.current = fallbackResult
  })

  // Stable proxy that delegates to the latest ref. Empty deps — identity is
  // truly stable across the component's lifetime.
  return useMemo(() => {
    return (...args: TArgs) => {
      const f = fnRef.current
      if (f) {
        return f(...args)
      }
      return fallbackRef.current
    }
  }, [])
}

export { useEventCallback }
