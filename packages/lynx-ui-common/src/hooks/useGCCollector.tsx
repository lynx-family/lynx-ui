// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect, useRef } from '@lynx-js/react'

import { useMemoizedFn } from './useMemoizedFn'

export interface UseGCCollectorOptions {
  /** GC trigger interval time in milliseconds, default 1000ms */
  interval?: number
  /** Whether to enable periodic GC, default true */
  enabled?: boolean
}

/**
 * Hook for periodic garbage collection
 * @param options Configuration options
 * @returns Control function object
 */
export function useGCCollector(options: UseGCCollectorOptions = {}) {
  const { interval = 3000, enabled = true } = options
  const timeRef = useRef<number | null>(null)

  const triggerGCMT = () => {
    'main thread'
    if (typeof globalThis.lepusng_gc === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      globalThis.lepusng_gc()
    }
  }

  const requestTimeout = useMemoizedFn(() => {
    if (enabled) {
      timeRef.current = setTimeout(() => {
        requestTimeout()
        runOnMainThread(triggerGCMT)()
      }, interval) as unknown as number
    }
  })

  const start = useMemoizedFn(() => {
    if (timeRef.current === null) {
      requestTimeout()
    }
  })

  const stop = useMemoizedFn(() => {
    if (timeRef.current !== null) {
      clearTimeout(timeRef.current)
      timeRef.current = null
    }
  })

  const restart = useMemoizedFn(() => {
    stop()
    start()
  })

  useEffect(() => {
    if (enabled) {
      start()
    }

    return () => {
      stop()
    }
  }, [enabled, interval])

  return {
    start,
    stop,
    restart,
    triggerGCMT,
  }
}
