// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LunaColorId } from '@lynx-js/luna-core'

/**
 * Build a CSS variable reference for the given Luna color id.
 * Example:
 *  id: "primary-content"
 *  cssVarPrefix: "luna" => "var(--luna-primary-content)"
 *  cssVarPrefix: undefined => "var(--primary-content)"
 */
function cssVar(id: LunaColorId, prefix?: string): string {
  const base = prefix ? `${prefix}-${id}` : id
  return `var(--${base})`
}

interface Group {
  // variant key -> CSS value
  variants: Record<string, string>
}

/**
 * Build Tailwind `theme.colors` structure from LUNA_COLOR_IDS.
 *
 * Rules:
 * - "primary"            => colors.primary = "var(--primary)"
 * - "primary-content"    => colors.primary.content = "var(--primary-content)"
 * - "primary-2"          => colors.primary["2"] = "var(--primary-2)"
 * - "gradient-a"         => colors.gradient.a = "var(--gradient-a)"
 * - "canvas-ambient"     => colors.canvas.ambient = "var(--canvas-ambient)"
 */
function buildLunaTailwindColors(
  ids: readonly LunaColorId[],
  cssVarPrefix?: string,
): Record<string, string | Record<string, string>> {
  const groups: Record<string, Group> = {}

  for (const id of ids) {
    const parts = id.split('-')
    const [head, ...rest] = parts as [string, ...string[]]
    const groupName = head

    // No suffix -> DEFAULT
    let variantKey = 'DEFAULT'

    if (rest.length > 0) {
      const suffix = rest.join('-')
      variantKey = suffix // we keep "2", "muted", "muted-2", "ambient", "veil", ...
    }

    const value = cssVar(id, cssVarPrefix)

    groups[groupName] ??= { variants: {} }
    groups[groupName].variants[variantKey] = value
  }

  const result: Record<string, string | Record<string, string>> = {}

  for (const [groupName, { variants }] of Object.entries(groups)) {
    const keys = Object.keys(variants)

    // Single variant and it's DEFAULT -> flatten to "group: 'var(...)'"
    if (keys.length === 1 && keys[0] === 'DEFAULT') {
      result[groupName] = variants.DEFAULT!
      continue
    }

    // Otherwise build nested object
    const groupObj: Record<string, string> = {}

    for (const [variantKey, value] of Object.entries(variants)) {
      if (variantKey === 'DEFAULT') {
        groupObj.DEFAULT = value
      } else {
        groupObj[variantKey] = value
      }
    }

    result[groupName] = groupObj
  }

  return result
}

export { buildLunaTailwindColors }
