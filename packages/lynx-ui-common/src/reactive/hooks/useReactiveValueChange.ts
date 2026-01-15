// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MainThreadRef } from '@lynx-js/react'

import { useReactiveValueEvent } from './useReactiveValueEvent'
import type { ReactiveValue } from '../reactiveValue'

export function useReactiveValueChange<T>(
  valueRef: MainThreadRef<ReactiveValue<T>>,
  callback: (value: T) => void,
) {
  return useReactiveValueEvent(valueRef, 'change', callback)
}
