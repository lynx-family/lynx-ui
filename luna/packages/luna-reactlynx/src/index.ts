// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export {
  LunaThemeContext,
  LunaThemeProvider,
  createLunaTheme,
  useLunaThemeContext,
  useLunaColor,
  useLunaColors,
} from './theming/index.js'

// Types (ReactLynx surface)
export type {
  CreateLunaThemeOptions,
  LunaRuntimeTheme,
  LunaThemeContextValue,
  LunaThemeInput,
  LunaThemeProviderProps,
  LunaThemeProviderSingleThemeProps,
  LunaThemeProviderThemeListProps,
  LunaRuntimeThemeSourceType,
  LunaRuntimeThemeConsumptionFormat,
  LunaConsumptionOptions,
  UseLunaColorOptions,
  UseLunaColorsOptions,
} from './theming/types.js'

// Types (re-export from luna-core for convenience)
export type {
  LunaColorId,
  LunaColorKey,
  LunaCustomThemeKey,
  LunaCustomThemeMeta,
  LunaCustomThemeMode,
  LunaCustomThemeTokens,
  LunaCustomThemeVariant,
  LunaThemeKey,
  LunaThemeTokens,
  LunaThemeResolverOptions,
} from '@lynx-js/luna-core'
