// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useCallback, useEffect, useMemo } from '@lynx-js/react'

type noop = (...p: unknown[]) => void

/**
 * Use this hook to register events
 * Events will be registered at first render, preventing possible message missing.
 * When deps updates, handlerFunc will be updated, old event listener will be removed.
 */
export function useGlobalEventListener(
  eventName: string,
  handler: noop,
  deps?: readonly unknown[],
) {
  const handlerFunc = useCallback(handler, deps ?? [])

  /**
   * We use useMemo to make it only run one time
   * useMemo will run at render.
   * If dependency changes, useMemo will rerun to have correct handlerFunc
   * then a new listener will be added with correct handlerFunc
   */
  useMemo(() => {
    if (!__LEPUS__) {
      lynx
        .getJSModule('GlobalEventEmitter')
        .addListener(eventName, handlerFunc)
    }
  }, [eventName, handlerFunc])

  /**
   * We use return value of useEffect to removeListener
   * Dependency is just the same as `useMemo` above
   * If dependency changes, useEffect's cleaning up func will be run, which is essentially
   * the cleaning up func of `addListener` run at useMemo
   */
  useEffect(
    () => () => {
      lynx
        .getJSModule('GlobalEventEmitter')
        .removeListener(eventName, handlerFunc)
    },
    [eventName, handlerFunc],
  )
}
