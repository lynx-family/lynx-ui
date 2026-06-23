// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ref } from 'vue-lynx'
import type { Ref } from 'vue-lynx'

/**
 * Tracks the pressed/"active" state of a tappable element across the Lynx
 * touch lifecycle.
 *
 * This is the Vue Lynx counterpart of the ReactLynx Button's
 * `useState(active)` + `useTouchEmulation({ onTouchStart, onTouchEnd,
 * onTouchCancel })` combination. The `@touchstart` / `@touchend` /
 * `@touchcancel` bindings exposed via `handlers` map onto Lynx's native
 * `bindtouchstart` / `bindtouchend` / `bindtouchcancel` events and also work
 * under Lynx-for-Web, so no web-only emulation shim is required.
 *
 * @param disabled - reactive disabled flag; while disabled the active state is
 *   never set, matching the React implementation.
 */
export function useTouchActive(disabled: Ref<boolean>): {
  active: Ref<boolean>
  handlers: {
    touchstart: () => void
    touchend: () => void
    touchcancel: () => void
  }
} {
  const active = ref(false)

  const onTouchStart = () => {
    if (disabled.value) return
    active.value = true
  }

  const onTouchEnd = () => {
    active.value = false
  }

  return {
    active,
    handlers: {
      touchstart: onTouchStart,
      touchend: onTouchEnd,
      touchcancel: onTouchEnd,
    },
  }
}
