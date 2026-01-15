// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import type { ReactiveValue } from '../reactiveValue'
import type { ReactiveEventName } from '../types'

export function useReactiveValueEvent<T>(
  valueRef: MainThreadRef<ReactiveValue<T>>,
  event: ReactiveEventName,
  callback: (value: T) => void,
) {
  function handleEvent() {
    'main thread'
    valueRef.current?.subscribe?.(callback)
  }

  useEffect(() => {
    if (event === 'change') {
      runOnMainThread(handleEvent)()
    }
  }, [valueRef])
}
