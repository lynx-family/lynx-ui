// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext } from '@lynx-js/react'

import { LunaThemeContext } from './theme-context.js'
import type { LunaThemeContextValue } from './types.js'

/**
 * Internal hook.
 * Returns theme context or null if no provider is found.
 */
export function useLunaThemeContext(): LunaThemeContextValue | null {
  return useContext(LunaThemeContext)
}
