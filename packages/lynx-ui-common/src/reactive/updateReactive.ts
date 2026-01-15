// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MainThreadRef } from '@lynx-js/react'

import type { ReactiveValue } from './reactiveValue'

export function updateReactiveValue<T>(
  valueRef: MainThreadRef<ReactiveValue<T>>,
  value: T,
): void {
  'main thread'
  if (!valueRef.current) return
  valueRef.current.value = value
}
