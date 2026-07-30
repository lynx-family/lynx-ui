// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from 'react'
import type { Ref } from 'react'

type PossibleRef<T> = Ref<T> | undefined
interface WritableRefObject<T> {
  current: T | null
}

function setRef<T>(
  ref: PossibleRef<T>,
  value: T | null,
): void {
  if (typeof ref === 'function') {
    ref(value)
  } else if (
    ref !== undefined && ref !== null && typeof ref === 'object'
    && 'current' in ref
  ) {
    ;(ref as WritableRefObject<T>).current = value
  }
}

function mergeRefs<T>(...refs: PossibleRef<T>[]) {
  return (node: T | null) => {
    refs.forEach(ref => {
      setRef(ref, node)
    })
  }
}

export function useMergedRefs<T>(
  ...refs: PossibleRef<T>[]
): (node: T | null) => void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs is the dependency list for the merged ref callback.
  return useMemo(() => mergeRefs(...refs), refs)
}
