// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useState } from '@lynx-js/react'

import { useTouchEmulation } from '@lynx-js/react-use'
import type { TouchEvent } from '@lynx-js/types'

// This local helper is a stable callback, not React's restricted Effect Event.
import { useEffectEvent as useStableCallback } from './use-effect-event'

interface UsePressTapReturnValue extends ReturnType<typeof useTouchEmulation> {
  pressed: boolean
  bindtap: (e: TouchEvent) => void
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
  { disabled = false, onTap }: { disabled?: boolean, onTap?: () => void } = {},
): UsePressTapReturnValue {
  const [pressed, setPressed] = useState(false)

  const press = useStableCallback(() => {
    if (disabled) return
    setPressed(true)
  })

  const reset = useStableCallback(() => {
    setPressed(false)
  })

  const handleTap = useStableCallback(() => {
    if (disabled) return
    onTap?.()
  })

  const touchHandlers = useTouchEmulation({
    onTouchStart: press,
    onTouchEnd: reset,
    onTouchCancel: reset,
  })

  return {
    pressed,
    bindtap: handleTap,
    ...touchHandlers,
  }
}
