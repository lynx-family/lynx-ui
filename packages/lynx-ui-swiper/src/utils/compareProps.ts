// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

type DeepObject = Record<string, unknown>

export function comparePropsWithObject(
  prev: unknown,
  next: unknown,
  objectKeys?: string[],
): boolean {
  if (prev === next) {
    return true
  }

  if (
    typeof prev !== 'object' || typeof next !== 'object' || prev === null
    || next === null
  ) {
    return false
  }

  const prevKeys = Object.keys(prev as DeepObject)
  const nextKeys = Object.keys(next as DeepObject)

  if (prevKeys.length !== nextKeys.length) {
    return false
  }

  for (const key of prevKeys) {
    if (objectKeys?.includes(key)) {
      if (
        !comparePropsWithObject(
          (prev as DeepObject)[key],
          (next as DeepObject)[key],
          [],
        )
      ) {
        return false
      }
    } else {
      if (
        !Object.is(
          (prev as DeepObject)[key],
          (next as DeepObject)[key],
        )
      ) {
        return false
      }
    }
  }

  return true
}
