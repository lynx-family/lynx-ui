// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LunaColorId } from './color.js'
import type {
  LunaCustomThemeKey,
  LunaCustomThemeMode,
  LunaCustomThemeVariant,
  LunaThemeKey,
  LunaThemeMode,
  LunaThemeVariant,
} from './keys.js'

/**
 * Official Luna theme tokens.
 */
export interface LunaThemeTokens {
  key: LunaThemeKey
  variant: LunaThemeVariant
  mode: LunaThemeMode
  colors: Record<LunaColorId, string>
}

/**
 * Custom theme meta: CSS-var-only or meta-based themes
 * that do not define concrete color values.
 */
export interface LunaCustomThemeMeta {
  key: LunaCustomThemeKey
  variant: LunaCustomThemeVariant
  mode: LunaCustomThemeMode
}

/**
 * Custom theme tokens: user provided tokens
 * with custom `key`/`variant`/`mode` and actual color values.
 * Structure is similar to LunaThemeTokens, but not restricted
 * to the official `key`/`variant`/`mode` space.
 */
export interface LunaCustomThemeTokens {
  key: LunaCustomThemeKey // allow custom keys
  variant: LunaCustomThemeVariant // e.g. "cosmic"
  mode: LunaCustomThemeMode // e.g. "night"
  colors: Record<LunaColorId, string>
}
