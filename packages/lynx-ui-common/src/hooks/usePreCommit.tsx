// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useRef } from '@lynx-js/react'
import type { DependencyList } from '@lynx-js/react'

import {
  runWorkletCtx,
  setEomShouldFlushElementTree,
} from '@lynx-js/react/worklet-runtime/bindings'
import type { Worklet } from '@lynx-js/react/worklet-runtime/bindings'

import { areDepsEqual } from '../utils/areDepsEqual'

declare global {
  var __setEomShouldFlushElementTree: ((value: boolean) => void) | undefined
  var __eomFlushHoldCount: number | undefined
}

const setEomShouldFlush = setEomShouldFlushElementTree as unknown as (
  value: boolean,
) => void

let eomFlushHoldCount = 0

function holdEomFlush() {
  eomFlushHoldCount += 1
  if (eomFlushHoldCount === 1) {
    setEomShouldFlush(false)
  }
}

function releaseEomFlush() {
  if (eomFlushHoldCount === 0) {
    return
  }

  eomFlushHoldCount -= 1
  if (eomFlushHoldCount === 0) {
    setEomShouldFlush(true)
  }
}

/**
 * Use this hack to prevent setEomShouldFlushElementTree being in the MTS closure
 */
if (__MAIN_THREAD__) {
  globalThis.__setEomShouldFlushElementTree = setEomShouldFlush
}

export function supportUsePreCommit() {
  return typeof setEomShouldFlushElementTree === 'function'
}

/**
 * An experimental hook dedicated to make MTS run on firstScreenPaint
 * Can be used starting from ReactLynx 0.113.0
 * @experimental
 * @param cb A main-thread callback to run on firstScreen
 * @param deps Dependency array - callback only executes when dependencies change
 */
export function usePreCommit(cb: () => void, deps?: DependencyList) {
  const prevDepsRef = useRef<DependencyList | undefined>(undefined)

  // Check if dependencies have changed
  const depsChanged = !areDepsEqual(prevDepsRef.current, deps)

  // Update the previous deps for next render
  prevDepsRef.current = deps

  // Only run if dependencies changed
  if (!depsChanged) {
    return
  }

  // For the Initial Frame Render
  if (__MAIN_THREAD__) {
    holdEomFlush()
    Promise.resolve().then(() => {
      try {
        runWorkletCtx(cb as unknown as Worklet, [])
      } catch (e) {
        console.error('Error occurred in preCommit hook', e)
      } finally {
        releaseEomFlush()
      }
    })
  } else {
    runOnMainThread(() => {
      'main thread'

      globalThis.__eomFlushHoldCount = (globalThis.__eomFlushHoldCount ?? 0) + 1
      if (globalThis.__eomFlushHoldCount === 1) {
        globalThis.__setEomShouldFlushElementTree?.(false)
      }

      try {
        cb()
      } finally {
        globalThis.__eomFlushHoldCount = Math.max(
          (globalThis.__eomFlushHoldCount ?? 1) - 1,
          0,
        )
        if (globalThis.__eomFlushHoldCount === 0) {
          globalThis.__setEomShouldFlushElementTree?.(true)
        }
      }
    })()
  }
}
