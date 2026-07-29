// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { resolveThemeObjectFromList } from '@lynx-js/luna-core'
import type { LunaThemeResolverOptions } from '@lynx-js/luna-core'

import { LunaThemeContext } from './theme-context.js'
import { stableRulesKey } from './theme-provider.helpers.js'
import type { LunaThemeContextValue, LunaThemeProviderProps } from './types.js'

export function LunaThemeProvider(
  props: LunaThemeProviderProps,
): ReactNode {
  /**
   * IMPORTANT DESIGN CHOICE:
   * We intentionally DO NOT destructure most fields from `props`.
   *
   * Reasons:
   * 1. `LunaThemeProviderProps` is a discriminated union (single-theme vs list-mode)
   *    Using `'theme' in props` is the most reliable narrowing strategy.
   *
   * 2. This provider performs fine-grained memoization.
   *    Keeping dependencies tied to explicit `props.xxx` reads
   *    makes dependency intent obvious and auditable.
   *
   * 3. Avoids accidental widening of union fields to `T | undefined`
   *    which would weaken type safety and future refactors.
   */

  /**
   * Compute a stable semantic key for resolver rules.
   *
   * This ensures that:
   * - Inline rule arrays do NOT cause memo invalidation
   * - Only *meaningful* changes trigger re-resolution
   */
  const rulesKey = stableRulesKey(props.resolve?.rules)

  /**
   * Normalize resolver options into a stable object.
   *
   * Key idea:
   * - Depend on individual option fields, NOT the resolve object reference
   *
   * This allows callers to pass inline objects safely.
   */
  const resolveStable = useMemo<Partial<LunaThemeResolverOptions>>(() => {
    return omitUndefined({
      defaultKey: props.resolve?.defaultKey,
      fallback: props.resolve?.fallback,
      onEmpty: props.resolve?.onEmpty,
    })
  }, [
    props.resolve?.defaultKey,
    props.resolve?.fallback,
    props.resolve?.onEmpty,
  ])

  const singleTheme = 'theme' in props ? props.theme : undefined
  const themeList = 'themes' in props ? props.themes : undefined
  const resolvedThemeKey = 'themes' in props ? props.themeKey : undefined

  const value = useMemo<LunaThemeContextValue>(() => {
    // Mode A: single theme (MUI-style)
    if ('theme' in props) {
      const theme = props.theme
      return {
        themeKey: theme.key,
        theme,
      }
    }

    // Mode B: theme list + optional key routing
    const themes = props.themes
    if (!themes || themes.length === 0) {
      throw new Error(
        '[LunaThemeProvider] "themes" must be a non-empty array.',
      )
    }

    const resolvedKey = props.themeKey

    const theme = resolveThemeObjectFromList(
      themes,
      resolvedKey,
      {
        ...resolveStable,
        ...(props.resolve?.rules === undefined
          ? {}
          : { rules: props.resolve.rules }),
      },
    )

    if (!theme) {
      throw new Error('[LunaThemeProvider] Failed to resolve theme.')
    }
    return {
      themeKey: theme.key,
      theme,
    }
  }, [
    // NOTE:
    // deps are intentionally enumerated to preserve discriminated-union semantics
    // and avoid depending on the `props` object identity.
    singleTheme,
    themeList,
    resolvedThemeKey,
    // Resolver semantics
    resolveStable,
    rulesKey,
  ])

  return (
    <LunaThemeContext.Provider value={value}>
      {props.children}
    </LunaThemeContext.Provider>
  )
}

type OmitUndefinedValues<T extends Record<string, unknown>> = {
  [K in keyof T]?: Exclude<T[K], undefined>
}

function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): OmitUndefinedValues<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as OmitUndefinedValues<T>
}
