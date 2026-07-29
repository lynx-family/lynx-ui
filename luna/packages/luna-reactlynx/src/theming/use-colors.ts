// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from '@lynx-js/react'

import {
  formatMetaOnlyValueError,
  resolveConsumptionFormat,
  toVarName,
} from './consumption.js'
import { LUNA_COLOR_KEYS, colorKeyToColorId } from './identity.js'
import type { LunaColorKey, UseLunaColorsOptions } from './types.js'
import { useLunaThemeContext } from './use-theme-context.js'

/**
 * Batch version of `useLunaColor`.
 *
 * Contract:
 * - Returns an immutable snapshot.
 * - In "value" mode, returns the theme's canonical colors surface.
 * - In var modes, returns a derived surface (also immutable).
 */
export function useLunaColors(
  options: UseLunaColorsOptions = {},
): Readonly<Record<LunaColorKey, string>> {
  const ctx = useLunaThemeContext()
  if (!ctx) {
    throw new Error('[useLunaColors] must be used within <LunaThemeProvider>.')
  }

  const { theme } = ctx
  const { as = 'result', format, cssVarPrefix } = options

  return useMemo(() => {
    const resolved = resolveConsumptionFormat({
      as,
      format,
      themeFormat: theme.consumptionFormat,
    })

    if (resolved.kind === 'value') {
      if (theme.sourceType !== 'values') {
        throw new Error(formatMetaOnlyValueError({ hook: 'useLunaColors' }))
      }
      return theme.colors
    }

    const prefix = cssVarPrefix ?? theme.cssVarPrefix

    const out: Record<LunaColorKey, string> = {} as Record<
      LunaColorKey,
      string
    >

    for (const key of LUNA_COLOR_KEYS) {
      const id = colorKeyToColorId(key)
      const varName = toVarName({ id, cssVarPrefix: prefix })

      out[key] = resolved.kind === 'var-name'
        ? varName
        : `var(${varName})`
    }

    return Object.freeze(out)
  }, [
    as,
    cssVarPrefix,
    format,
    theme.consumptionFormat,
    theme.sourceType,
    theme.colors,
    theme.cssVarPrefix,
  ])
}
