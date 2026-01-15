// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useState } from '@lynx-js/react'

import type { TouchEvent } from '@lynx-js/types'

import { useEffectEvent } from './use-effect-event'

interface UsePressTapReturnValue {
  pressed: boolean
  bindtap: (e: TouchEvent) => void
  bindtouchstart: (e: TouchEvent) => void
  bindtouchend: (e: TouchEvent) => void
  bindtouchcancel: (e: TouchEvent) => void
}

interface UsePressTapOptions {
  disabled?: boolean
  onTap?: () => void
}

/**
 * usePressTap
 *
 * Hook that provides press/tap interaction state similar to <button>.
 *
 * - When `disabled` is true:
 *   - The element cannot become active.
 *   - No tap will fire.
 * - If the element becomes disabled during a press:
 *   - The active state is cleared immediately.
 */
export function usePressTap(
  { disabled = false, onTap }: UsePressTapOptions = {},
): UsePressTapReturnValue {
  const [pressed, setPressed] = useState(false)

  const press = useEffectEvent(() => {
    if (disabled) return
    setPressed(true)
  })

  const reset = useEffectEvent(() => {
    setPressed(false)
  })

  const handleTap = useEffectEvent(() => {
    if (disabled) return
    onTap?.()
  })

  return {
    pressed,
    bindtap: handleTap,
    bindtouchstart: press,
    bindtouchend: reset,
    bindtouchcancel: reset,
  }
}
