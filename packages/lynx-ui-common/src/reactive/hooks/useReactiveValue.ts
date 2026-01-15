// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useMainThreadRef, useMemo } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { createMainThreadReactiveValue } from '../reactiveValue'
import type { ReactiveValue } from '../reactiveValue'
import type { ReactiveValueOptions } from '../types'

export function useReactiveValue<T>(
  initialValue: T,
  options: ReactiveValueOptions = {},
): MainThreadRef<ReactiveValue<T>> {
  const mtRef = useMainThreadRef<ReactiveValue<T>>({} as ReactiveValue<T>)

  function initReactiveValue() {
    'main thread'
    mtRef.current = createMainThreadReactiveValue(initialValue, options)
  }

  useMemo(() => {
    if (__BACKGROUND__) {
      runOnMainThread(initReactiveValue)()
    } else {
      // Kept for preventing tree shaking
      initReactiveValue
    }
  }, [])

  return mtRef
}
