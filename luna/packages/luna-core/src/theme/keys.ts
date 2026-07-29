// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export type LunaThemeVariant = 'luna' | 'lunaris'
export type LunaThemeMode = 'light' | 'dark'
export type LunaThemeKey = `${LunaThemeVariant}-${LunaThemeMode}`
export type LunaNeutralThemeKey = `luna-${LunaThemeMode}`

// Custom extended theme space
export type LunaCustomThemeKey = LunaThemeKey | (string & {})
export type LunaCustomThemeVariant = LunaThemeVariant | (string & {})
export type LunaCustomThemeMode = LunaThemeMode | (string & {})

export function parseLunaThemeKey<K extends LunaThemeKey>(key: K): {
  variant: LunaThemeVariant
  mode: LunaThemeMode
} {
  const [variant, mode] = key.split('-') as [LunaThemeVariant, LunaThemeMode]
  return { variant, mode }
}
