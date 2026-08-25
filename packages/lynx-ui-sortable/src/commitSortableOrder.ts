// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MainThreadRef } from '@lynx-js/react'

/** Synchronize order and drag visuals before the element tree is flushed. */
export function commitSortableOrder(
  orderRef: MainThreadRef<string[]>,
  nextOrder: string[],
  dirtyKeysRef: MainThreadRef<Record<string, boolean>>,
  resetItemVisualsRef: MainThreadRef<Record<string, (() => void) | undefined>>,
  dragFinished: boolean,
) {
  'main thread'
  const previousOrder = orderRef.current
  let orderChanged = previousOrder.length !== nextOrder.length
  for (let index = 0; !orderChanged && index < nextOrder.length; index++) {
    orderChanged = previousOrder[index] !== nextOrder[index]
  }
  orderRef.current = nextOrder
  if (!orderChanged && !dragFinished) {
    return
  }
  for (const key of Object.keys(dirtyKeysRef.current)) {
    if (dirtyKeysRef.current[key]) {
      resetItemVisualsRef.current[key]?.()
      delete dirtyKeysRef.current[key]
    }
  }
}
