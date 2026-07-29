// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'
import type { Context } from '@lynx-js/react'

import type { LunaThemeContextValue } from './types.js'

const LunaThemeContext: Context<LunaThemeContextValue | null> = createContext<
  LunaThemeContextValue | null
>(null)

export { LunaThemeContext }
