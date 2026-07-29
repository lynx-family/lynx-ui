// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LunaThemeResolveRuleSpec } from '@lynx-js/luna-core'

/**
 * Generate a stable string key for resolver rules.
 *
 * WHY THIS EXISTS:
 * - `resolve.rules` may be passed inline by callers (new array/object every render)
 * - React `useMemo` compares dependencies by reference
 * - We need a *semantic* equality check, not reference equality
 *
 * This function produces a stable, ordered, domain-aware key so that:
 * - rules with the same meaning => same key
 * - rules with different order / options => different key
 *
 * NOTE:
 * - This is NOT a general-purpose serializer
 * - This is intentionally shallow (rules options are config, not data)
 *
 * @internal
 */
export function stableRulesKey(
  rules: readonly LunaThemeResolveRuleSpec[] | undefined,
): string {
  if (!rules || rules.length === 0) return ''

  return rules
    .map(rule => {
      if (typeof rule === 'string') return rule

      const { id, options } = rule
      if (!options || Object.keys(options).length === 0) return id

      const optionPairs = Object.entries(options)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${stableAtom(v)}`)
        .join(',')

      return `${id}(${optionPairs})`
    })
    .join('|')
}

/**
 * Convert an unknown option value into a stable string representation.
 *
 * WHY NOT JSON.stringify DIRECTLY:
 * - key order instability
 * - drops undefined / functions
 * - deep recursion risks
 *
 * This is a *best-effort*, shallow, non-throwing conversion.
 *
 * @internal
 */
function stableAtom(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  switch (typeof v) {
    case 'string':
      return JSON.stringify(v) // quoted + escaped, avoids delimiter ambiguity
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(v)
    case 'symbol':
      return v.toString()
    case 'function':
      return '[fn]'
    default:
      try {
        return JSON.stringify(v)
      } catch {
        return '[unserializable]'
      }
  }
}
