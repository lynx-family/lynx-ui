// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

/**
 * useRafClock
 *
 * Provides a monotonically increasing frame counter (`frameIdRef`)
 * and the last rAF timestamp (`tsRef`), updated once per animation frame.
 *
 * Useful for tagging logs or values to check if multiple updates
 * occurred within the same rendered frame.
 *
 * @internal — not exported from the package's public API.
 */
export function useRafClock(): {
  frameIdRef: MutableRefObject<number>
  tsRef: MutableRefObject<number>
} {
  const frameIdRef = useRef(0)
  const tsRef = useRef(0)

  useEffect(() => {
    let raf = 0
    const tick = (ts: number) => {
      frameIdRef.current += 1
      tsRef.current = ts
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return { frameIdRef, tsRef }
}
