// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const LUNA_COLOR_IDS = [
  'canvas',
  'canvas-ambient',
  'paper',
  'paper-clear',
  'paper-veil',
  'paper-film',
  'backdrop',
  'backdrop-subtle',
  'backdrop-heavy',
  'content',
  'content-2',
  'content-muted',
  'content-subtle',
  'content-faint',
  'content-faded',
  'primary',
  'primary-2',
  'primary-muted',
  'primary-content',
  'primary-content-faded',
  'secondary',
  'secondary-2',
  'secondary-content',
  'secondary-content-faded',
  'neutral',
  'neutral-2',
  'neutral-subtle',
  'neutral-faint',
  'neutral-ambient',
  'neutral-veil',
  'neutral-film',
  'neutral-content',
  'neutral-content-faded',
  'line',
  'rule',
  'gradient-a',
  'gradient-b',
  'gradient-c',
  'gradient-d',
  'gradient-content',
  'gradient-content-faded',
  'gradient-content-trace',
] as const

export type LunaColorId = typeof LUNA_COLOR_IDS[number]

type CamelCase<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S

/**
 * Runtime color keys exposed to components/hooks: camelCase.
 * Example:
 *   LunaColorId:  "primary-content"
 *   LunaColorKey: "primaryContent"
 */
export type LunaColorKey = CamelCase<LunaColorId>

/**
 * "primary-content" -> "primaryContent"
 */
export function colorIdToColorKey(id: LunaColorId): LunaColorKey {
  return id
    .split('-')
    .map((seg, i) => i === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('') as LunaColorKey
}

/**
 * "primaryContent" -> "primary-content"
 */
export function colorKeyToColorId(key: LunaColorKey): LunaColorId {
  return key.replace(/([A-Z])/g, '-$1').toLowerCase() as LunaColorId
}

/** Precomputed list of all color keys in camelCase. */
export const LUNA_COLOR_KEYS: readonly LunaColorKey[] = LUNA_COLOR_IDS.map(id =>
  colorIdToColorKey(id)
)

export const EMPTY_LUNA_COLORS = Object.freeze(
  Object.fromEntries(
    LUNA_COLOR_IDS.map(id => [colorIdToColorKey(id), '']),
  ) as Record<LunaColorKey, string>,
)

/** Factory: get a fresh mutable empty color map. */
export function createEmptyLunaColors(): Record<LunaColorKey, string> {
  return { ...EMPTY_LUNA_COLORS }
}
