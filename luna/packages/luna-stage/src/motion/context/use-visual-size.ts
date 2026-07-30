// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext } from 'react'

import { VisualSizeContext } from './visual-size-context'
import type { VisualSizeValue } from './visual-size-context'

/**
 * Returns the visual size provided by a parent VisualSizeProvider,
 * or `null` if none is present (graceful fallback — no throw).
 * Callers should fall back to a default size when this returns null.
 */
export function useVisualSize(): VisualSizeValue | null {
  return useContext(VisualSizeContext)
}
