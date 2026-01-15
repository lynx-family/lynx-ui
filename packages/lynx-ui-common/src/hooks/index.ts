// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useCallback, useEffect, useMemo, useRef } from '@lynx-js/react'

export { useUnmount } from './useUnmount'
export { useGlobalEventListener } from './useGlobalEventListener'
export { useLatest } from './useLatest'
export { useRegisteredEvents } from './useRegisteredEvents'

export { useRefreshAndBounce } from './useRefresh'
export type { useRefreshAndBounceReturn } from './useRefresh'
export { useBounce, type bounceHandlers } from './useBounce'
export { useMemoizedFn } from './useMemoizedFn'
export { usePrevious } from './usePrevious'

export function useFirstRender(cb: () => void): boolean {
  const isFirst = useRef(true)
  if (isFirst.current) {
    cb?.()
    isFirst.current = false
    return true
  }
  return isFirst.current
}

export function useJSFirstRender(cb: () => void): boolean {
  const isJSFirst = useRef(true)
  if (isJSFirst.current) {
    if (!__LEPUS__) {
      cb?.()
    }
    isJSFirst.current = false
    return true
  }
  return isJSFirst.current
}

export function useLepusFirstRender(cb: () => void): boolean {
  const isLepusFirst = useRef(true)
  if (isLepusFirst.current) {
    if (__LEPUS__) {
      cb?.()
    }
    isLepusFirst.current = false
    return true
  }
  return isLepusFirst.current
}

/**
 * @deprecated use useMemoizedFn instead
 */
export function usePersistCallback(fn: (...args: unknown[]) => void) {
  const ref = useRef<(...args: unknown[]) => void>(fn)
  ref.current = useMemo(
    function() {
      return fn
    },
    [fn],
  )
  return useCallback(
    function(...arg: unknown[]) {
      const fnn: (...arg2: unknown[]) => void = ref.current
      typeof ref.current === 'function' && fnn(...arg)
    },
    [ref],
  )
}

export { useGCCollector, type UseGCCollectorOptions } from './useGCCollector'

export function useThrottle(
  fn: (...args: unknown[]) => void,
  delay: number,
  dep = [],
) {
  const { current } = useRef({ fn, timer: 0 })
  useEffect(
    function() {
      current.fn = fn
    },
    [fn],
  )

  return useCallback(function f(...args: unknown[]) {
    if (!current.timer) {
      current.timer = setTimeout(() => {
        // @ts-expect-error Error
        delete current.timer
      }, delay) as unknown as number
      current.fn(...args)
    }
  }, dep)
}
