// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useRef, useState } from '@lynx-js/react'
import type { Dispatch, SetStateAction } from '@lynx-js/react'

import { noop, useEffectEvent } from './use-effect-event'

function isUpdater<T>(v: SetStateAction<T>): v is (prev: T) => T {
  return typeof v === 'function'
}

interface UseControllableProps<T> {
  value?: T | undefined
  defaultValue: T
  onValueChange?: ((value: T) => void) | undefined
}

function useControllable<T>({
  value: controlled,
  defaultValue,
  onValueChange,
}: UseControllableProps<T>) {
  const [uncontrolled, setUncontrolled] = useUncontrolled({
    defaultValue,
    onValueChange,
  })

  const isControlled = controlled !== undefined

  const stableOnChange = useEffectEvent(onValueChange ?? noop)

  const current = isControlled ? controlled : uncontrolled

  const setCurrent: Dispatch<SetStateAction<T>> = (next) => {
    if (isControlled) {
      const resolved = isUpdater(next) ? next(current) : next
      if (
        !Object.is(resolved, current)
        && resolved !== undefined
      ) {
        stableOnChange(resolved)
      }
    } else {
      setUncontrolled(next)
    }
  }

  return [current, setCurrent] as const
}

function useUncontrolled<T>({
  defaultValue,
  onValueChange,
}: Omit<UseControllableProps<T>, 'value'>) {
  const [current, setCurrent] = useState<T>(defaultValue)
  const prevRef = useRef(current)
  const stableOnChange = useEffectEvent(onValueChange ?? noop)

  useEffect(() => {
    if (prevRef.current !== current) {
      if (current !== undefined) {
        stableOnChange(current)
      }
      prevRef.current = current
    }
  }, [current])

  return [current, setCurrent] as const
}

export { useControllable, useUncontrolled }
