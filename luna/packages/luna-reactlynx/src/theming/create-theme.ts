// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { isNonEmptyString } from './consumption.js'
import {
  LUNA_COLOR_IDS,
  colorIdToColorKey,
  createEmptyLunaColors,
} from './identity.js'
import type {
  CreateLunaThemeOptions,
  LunaColorId,
  LunaRuntimeTheme,
  LunaThemeInput,
  LunaThemeValueInput,
} from './types.js'

/**
 * Turn a theme input into a runtime theme object consumable by LunaThemeProvider and hooks.
 *
 * Contract:
 * - Values-backed inputs (tokens):
 *   - Require complete token values; missing values throw.
 *   - `colors` always stores raw values (canonical truth).
 *   - `consumptionFormat` only affects how consumers interpret the theme.
 *
 * - Meta-only inputs:
 *   - Values are not available.
 *   - Only `consumptionFormat: 'var-ref'` is valid.
 */
export function createLunaTheme(
  input: LunaThemeInput,
  options: CreateLunaThemeOptions = {},
): LunaRuntimeTheme {
  const { consumptionFormat = 'value', cssVarPrefix } = options

  const colors = createEmptyLunaColors()

  // Meta-only input
  if (!hasColors(input)) {
    if (consumptionFormat !== 'var-ref') {
      throw new Error(
        formatInvalidInputError({
          sourceType: 'meta-only',
          consumptionFormat: `'${consumptionFormat}'`,
        }),
      )
    }

    Object.freeze(colors)

    return {
      key: input.key,
      variant: input.variant,
      mode: input.mode,
      colors,
      sourceType: 'meta-only',
      consumptionFormat: 'var-ref',
      ...(cssVarPrefix === undefined ? {} : { cssVarPrefix }),
    }
  }

  // Values-backed input (tokens)
  const missingIds = collectMissingColorIds(input.colors)

  if (missingIds.length > 0) {
    throw new Error(
      formatMissingColorValuesError({
        consumptionFormat,
        sourceType: 'values',
        missingIds,
        ...(cssVarPrefix === undefined ? {} : { cssVarPrefix }),
      }),
    )
  }

  // Fill canonical raw values.
  for (const id of LUNA_COLOR_IDS) {
    const key = colorIdToColorKey(id)
    colors[key] = input.colors[id]
  }

  Object.freeze(colors)

  return {
    key: input.key,
    variant: input.variant,
    mode: input.mode,
    colors,
    sourceType: 'values',
    consumptionFormat,
    ...(cssVarPrefix === undefined ? {} : { cssVarPrefix }),
  }
}

/**
 * Narrow input to values-backed theme input.
 *
 * Note:
 * - This only checks for the presence of `colors`.
 * - Completeness of values is validated separately.
 */
function hasColors(input: LunaThemeInput): input is LunaThemeValueInput {
  return (
    'colors' in input
    && typeof input.colors === 'object'
    && input.colors !== null
  )
}

function formatInvalidInputError(args: {
  sourceType: 'meta-only'
  consumptionFormat: string
}): string {
  const { sourceType, consumptionFormat } = args

  return [
    '[createLunaTheme] Invalid theme input for the requested consumption format.',
    `- sourceType:           '${sourceType}'`,
    `- consumptionFormat:    ${consumptionFormat}`,
    '',
    'A meta-only theme input cannot produce raw values.',
    'If you want to use CSS variables, pass `consumptionFormat: \'var-ref\'`.',
  ].join('\n')
}

function formatMissingColorValuesError(args: {
  consumptionFormat: string
  sourceType: string
  missingIds: string[]
  cssVarPrefix?: string
}): string {
  const { consumptionFormat, sourceType, missingIds, cssVarPrefix } = args

  const preview = missingIds.slice(0, 12).join(', ')
  const more = missingIds.length > 12
    ? ` (+${missingIds.length - 12} more)`
    : ''
  const prefixHint = cssVarPrefix === undefined
    ? ''
    : `- cssVarPrefix:          ${cssVarPrefix}\n`

  return [
    '[createLunaTheme] Missing required color values.',
    `- sourceType:            \`${sourceType}\``,
    `- consumptionFormat:     \`${consumptionFormat}\``,
    prefixHint.trimEnd(),
    `- missing color ids:     ${missingIds.length}`,
    `- missing (preview):     ${preview}${more}`,
    '',
    'Note: token values must be complete, even if `consumptionFormat` is `\'var-ref\'`.',
  ]
    .filter(Boolean)
    .join('\n')
}

function collectMissingColorIds(
  colors: Record<LunaColorId, string>,
): LunaColorId[] {
  const missing: LunaColorId[] = []

  for (const id of LUNA_COLOR_IDS) {
    const value = colors[id]
    if (!isNonEmptyString(value)) missing.push(id)
  }

  return missing
}
