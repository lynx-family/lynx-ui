// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useCallback, useMemo } from '@lynx-js/react'

import {
  formatMetaOnlyValueError,
  resolveConsumptionFormat,
  toVarName,
} from './consumption.js'
import { colorKeyToColorId } from './identity.js'
import type { LunaColorKey, UseLunaColorOptions } from './types.js'
import { useLunaThemeContext } from './use-theme-context.js'

export function useLunaColor(
  options: UseLunaColorOptions = {},
): (key: LunaColorKey) => string {
  const ctx = useLunaThemeContext()
  if (!ctx) {
    throw new Error('[useLunaColor] must be used within <LunaThemeProvider>.')
  }

  const { theme } = ctx

  const { as = 'result', format, cssVarPrefix } = options

  const resolved = useMemo(() =>
    resolveConsumptionFormat({
      as,
      format,
      themeFormat: theme.consumptionFormat,
    }), [as, format, theme.consumptionFormat])

  const prefix = useMemo(
    () => cssVarPrefix ?? theme.cssVarPrefix,
    [cssVarPrefix, theme.cssVarPrefix],
  )

  const getColor = useCallback(
    (key: LunaColorKey): string => {
      const id = colorKeyToColorId(key)

      const varName = toVarName({ id, cssVarPrefix: prefix })

      switch (resolved.kind) {
        case 'var-name':
          return varName

        case 'var-ref':
          return `var(${varName})`

        case 'value': {
          if (theme.sourceType !== 'values') {
            throw new Error(
              formatMetaOnlyValueError({ hook: 'useLunaColor' }),
            )
          }
          return theme.colors[key]
        }
        default:
          return assertNever(resolved)
      }
    },
    [resolved, prefix, theme.sourceType, theme.colors],
  )

  return getColor
}

function assertNever(x: never): never {
  throw new Error(`[useLunaColor] Unexpected resolved.kind: ${String(x)}`)
}
