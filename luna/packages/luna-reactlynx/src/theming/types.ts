// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type {
  LunaColorId,
  LunaColorKey,
  LunaCustomThemeKey,
  LunaCustomThemeMeta,
  LunaCustomThemeMode,
  LunaCustomThemeTokens,
  LunaCustomThemeVariant,
  LunaThemeResolverOptions,
  LunaThemeTokens,
} from '@lynx-js/luna-core'

export type { LunaColorId, LunaColorKey }

/* ============================================================================
 * Theme input (createLunaTheme input)
 * ========================================================================== */

/**
 * Values-backed theme input that provides concrete token values.
 *
 * Contract:
 * - Provide concrete raw values (canonical truth).
 * - Token values must be complete (all required ids must be present).
 *
 * Notes:
 * - This type describes the semantic contract ("values-backed"),
 *   not the source mechanism (tokens).
 */
export type LunaThemeValueInput =
  | LunaThemeTokens
  | LunaCustomThemeTokens

/**
 * Public-friendly alias: token-driven input.
 *
 * @remarks
 * Today values-backed inputs are provided via tokens,
 * hence the name. Internally we keep "ValueInput"
 * to avoid coupling the contract to a specific mechanism.
 */
export type LunaThemeTokenInput = LunaThemeValueInput

/**
 * Public-friendly alias for meta-only theme input.
 *
 * @remarks
 * Meta-only inputs do not provide concrete token values.
 * They are intended for CSS-variable–only or metadata-driven
 * theme definitions.
 *
 * Internally this maps to `LunaCustomThemeMeta`.
 */
export type LunaThemeMetaInput = LunaCustomThemeMeta

/**
 * Theme inputs accepted by createLunaTheme.
 *
 * - `LunaThemeTokenInput` (values-backed): provides concrete token values
 * - `LunaCustomThemeMeta` (meta-only): no token values
 */
export type LunaThemeInput =
  | LunaThemeValueInput
  | LunaThemeMetaInput

/* ============================================================================
 * Runtime theme
 * ========================================================================== */

export type LunaRuntimeThemeSourceType =
  /** Values-backed input that provides concrete token values */
  | 'values'
  /** Meta-only input without token values */
  | 'meta-only'

export type LunaRuntimeThemeConsumptionFormat =
  /** raw values */
  | 'value'
  /** `var(--prefix-id)` references */
  | 'var-ref'

/**
 * Runtime theme object consumed by LunaThemeProvider and hooks.
 *
 * Key points:
 * - `colors` and future surfaces like `typography` and `radii`
 *   store canonical raw values when `sourceType: 'values'`.
 * - CSS variable references are computed on demand (from token ids),
 *   and should not be stored into `colors` or other value surfaces.
 */
export interface LunaRuntimeTheme {
  key: LunaCustomThemeKey
  variant: LunaCustomThemeVariant
  mode: LunaCustomThemeMode

  /**
   * Canonical color values.
   *
   * - When `sourceType: 'values'`, this must be a complete raw value surface.
   * - When `sourceType: 'meta-only'`, values are not available; this stays as
   *   the empty template for shape stability.
   */
  colors: Readonly<Record<LunaColorKey, string>>

  /**
   * Where this runtime theme comes from.
   */
  sourceType: LunaRuntimeThemeSourceType

  /**
   * Describe how theme values should be consumed by default.
   *
   * This applies to all runtime theme surfaces (e.g. `colors`,
   * and future surfaces like typography, radius, or spacing).
   *
   * - `'value'`: consumers read raw values from runtime surfaces
   * - `'var-ref'`: consumers read css-var references generated from token ids
   */
  consumptionFormat: LunaRuntimeThemeConsumptionFormat

  /**
   * Optional metadata for css-var pipeline.
   *
   * If omitted, variables are generated without a prefix:
   * - `'var-name'`: `--neutral`
   * - `'var-ref'`:  `var(--neutral)`
   */
  cssVarPrefix?: string
}

export interface LunaThemeContextValue {
  themeKey: LunaCustomThemeKey
  theme: LunaRuntimeTheme
}

/* ============================================================================
 * Theme creation options
 * ========================================================================== */

export interface CreateLunaThemeOptions {
  /**
   * Decide how theme values should be consumed by default in the runtime theme.
   *
   * Notes:
   * - This does NOT change what is stored in `runtimeTheme.colors` or other value surfaces.
   * - For values-backed inputs, `colors` always stores raw values.
   * - For meta-only inputs, `'value'` is invalid.
   *
   * - `'value'`: default consumption uses raw values
   * - `'var-ref'`: default consumption uses css-var references
   *
   * @defaultValue `'value'`
   */
  consumptionFormat?: LunaRuntimeThemeConsumptionFormat

  /**
   * CSS var prefix used when consuming `'var-ref'` / generating `'var-name'`.
   */
  cssVarPrefix?: string
}

/* ============================================================================
 * Provider props (union)
 * ========================================================================== */

interface LunaThemeProviderCommonProps {
  /**
   * Theme resolver options controlling resolution behavior
   *
   * @remarks
   * Only takes effect in list mode (when `themes` is provided).
   * Ignored in single-theme mode.
   */
  resolve?: LunaThemeResolverOptions

  children?: ReactNode
}

export interface LunaThemeProviderSingleThemeProps
  extends LunaThemeProviderCommonProps
{
  /** Single theme entry (MUI-style) */
  theme: LunaRuntimeTheme

  /** Must not be provided in single-theme mode */
  themes?: never
  themeKey?: never
}

export interface LunaThemeProviderThemeListProps
  extends LunaThemeProviderCommonProps
{
  /** Theme list for routing */
  themes: LunaRuntimeTheme[]

  /** Optional requested theme key */
  themeKey?: LunaCustomThemeKey

  /** Must not be provided in list mode */
  theme?: never
}

export type LunaThemeProviderProps =
  | LunaThemeProviderSingleThemeProps
  | LunaThemeProviderThemeListProps

/* ============================================================================
 * Hook options
 * ========================================================================== */

export interface LunaConsumptionOptions {
  /**
   * - `'result'`: return the resolved consumption result based on `format` (`'value'` or `'var-ref'`)
   * - `'var-name'`: return a CSS custom property name (e.g. `--neutral`)
   *
   * Notes:
   * - `format` only applies when `as: 'result'`.
   *
   * @defaultValue `'result'`
   */
  as?: 'result' | 'var-name'

  /**
   * Override how the result is produced for consumption.
   *
   * - `'value'`: return raw values
   * - `'var-ref'`: return a CSS variable reference (e.g. `var(--neutral)`)
   */
  format?: LunaRuntimeThemeConsumptionFormat

  /**
   * Optional override for css var prefix.
   *
   * If omitted, uses `theme.cssVarPrefix`.
   */
  cssVarPrefix?: string
}
export type UseLunaColorOptions = LunaConsumptionOptions

export type UseLunaColorsOptions = LunaConsumptionOptions
