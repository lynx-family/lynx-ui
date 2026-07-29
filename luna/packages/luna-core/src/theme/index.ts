// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * @file theme
 *
 * Theme tokens, color, and resolver.
 */

export type {
  LunaNeutralThemeKey,
  LunaThemeKey,
  LunaThemeMode,
  LunaThemeVariant,
  LunaCustomThemeKey,
  LunaCustomThemeMode,
  LunaCustomThemeVariant,
} from './keys.js'

export { parseLunaThemeKey } from './keys.js'

/* ============================================================================
 * Theme tokens
 * ========================================================================== */

export type {
  LunaThemeTokens,
  LunaCustomThemeTokens,
  LunaCustomThemeMeta,
} from './tokens.js'

/* ============================================================================
 * Color
 * ========================================================================== */

export type { LunaColorId, LunaColorKey } from './color.js'

export {
  LUNA_COLOR_IDS,
  LUNA_COLOR_KEYS,
  colorIdToColorKey,
  colorKeyToColorId,
  createEmptyLunaColors,
} from './color.js'

/* ============================================================================
 * Theme resolver (public surface)
 * ========================================================================== */

/** Core resolver APIs */
export {
  resolveThemeKey,
  resolveThemeKeyFromList,
  resolveThemeObjectFromList,
  inferThemeMode,
  inferThemeVariant,
} from './resolver.js'

/** Resolver configuration & contracts */
export type {
  LunaResolvableTheme,
  LunaThemeResolveRuleId,
  LunaThemeResolveRuleSpec,
  LunaThemeResolverFallback,
  LunaThemeResolverOnEmpty,
  LunaThemeResolverOptions,
} from './resolver.js'
