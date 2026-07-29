// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  LunaConsumptionOptions,
  LunaRuntimeThemeConsumptionFormat,
} from './types.js'

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

export function toVarName(args: {
  id: string
  cssVarPrefix: string | undefined
}): string {
  const { id, cssVarPrefix } = args
  if (isNonEmptyString(cssVarPrefix)) return `--${cssVarPrefix}-${id}`
  return `--${id}`
}

export type LunaConsumptionKind =
  | { kind: 'value' }
  | { kind: 'var-name' }
  | { kind: 'var-ref' }

export function resolveConsumptionFormat(args: {
  as: LunaConsumptionOptions['as']
  format: LunaConsumptionOptions['format']
  themeFormat: LunaRuntimeThemeConsumptionFormat
}): LunaConsumptionKind {
  const { as, format, themeFormat } = args

  if (as === 'var-name') return { kind: 'var-name' }

  const fmt = format ?? themeFormat
  return fmt === 'var-ref' ? { kind: 'var-ref' } : { kind: 'value' }
}

export function formatMetaOnlyValueError(args: {
  hook: 'useLunaColor' | 'useLunaColors'
}): string {
  const { hook } = args
  return [
    `[${hook}] Cannot return raw values from a meta-only theme.`,
    '- requested: \'value\'',
    '- hint: use `format: \'var-ref\'` or set theme `consumptionFormat: \'var-ref\'`.',
  ].join('\n')
}
