// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { DependencyList } from '@lynx-js/react'

/**
 * Compares two dependency arrays
 */
export function areDepsEqual(
  prevDeps: DependencyList | undefined,
  nextDeps: DependencyList | undefined,
): boolean {
  if (prevDeps === undefined || nextDeps === undefined) {
    return false
  }
  if (prevDeps.length !== nextDeps.length) {
    return false
  }
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      return false
    }
  }
  return true
}
