// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  LunaCustomThemeKey,
  LunaCustomThemeVariant,
  LunaThemeMode,
} from './keys.js'

const DARK_MODE_RE = /(?:^|-)dark(?:-|$)/i
const LIGHT_MODE_RE = /(?:^|-)light(?:-|$)/i

export type LunaThemeResolveRuleId =
  /** Exact key match */
  | 'exact'
  /** Match same variant (e.g. luna-*, lunaris-*, cosmic-*) */
  | 'same-variant'
  /** Match same mode (e.g. -light, -dark) */
  | 'same-mode'

interface LunaThemeResolveRuleObjectSpec {
  id: LunaThemeResolveRuleId
  /**
   * Reserved for future rule extensions.
   * Built-in rules currently ignore this field.
   */
  options?: Record<string, unknown>
}

/** Public rule spec: serializable */
export type LunaThemeResolveRuleSpec =
  | LunaThemeResolveRuleId
  | LunaThemeResolveRuleObjectSpec

export type LunaThemeResolverFallback =
  /** Prefer defaultKey if present in allowed; otherwise fall back to the first */
  | 'use-default'
  /** Always fall back to the first allowed key */
  | 'use-first'
  /** Throw an error */
  | 'error'

export type LunaThemeResolverOnEmpty =
  /** Throw an error when allowed list is empty */
  | 'error'
  /** Return defaultKey as a placeholder when allowed list is empty */
  | 'use-default-key'

/**
 * Minimal theme shape: any object with a stable `key` can be resolved.
 */
export interface LunaResolvableTheme {
  key: LunaCustomThemeKey
}

/** internal: non-empty list (do not export) */
type NonEmptyArray<T> = [T, ...T[]]

/** internal: normalize rule spec to id + options */
interface NormalizedRule {
  id: LunaThemeResolveRuleId
  options?: Record<string, unknown>
}

function normalizeRules(
  rules: readonly LunaThemeResolveRuleSpec[] | undefined,
): readonly NormalizedRule[] {
  const defaultRules: readonly NormalizedRule[] = [
    { id: 'exact' },
    { id: 'same-variant' },
    { id: 'same-mode' },
  ]
  if (!rules || rules.length === 0) return defaultRules

  return rules.map(r => (typeof r === 'string' ? { id: r } : r))
}

/** internal: context shared by all candidate generators */
interface CandidateCtx {
  /** Allowed theme keys, order preserved */
  allowed: readonly LunaCustomThemeKey[]

  /** Set version of allowed keys for fast lookup */
  allowedSet: ReadonlySet<LunaCustomThemeKey>

  /** Requested theme key (may be undefined) */
  requested: LunaCustomThemeKey | undefined

  /** Inferred mode from requested key (light / dark) */
  requestedMode: LunaThemeMode | undefined

  /** Inferred variant from requested key */
  requestedVariant: LunaCustomThemeVariant | undefined
}

/**
 * internal: generate candidate theme keys for a given rule.
 *
 * A generator inspects the shared context and returns
 * zero or more candidate keys, preserving allowed order.
 */
type CandidateGenerator = (
  ctx: CandidateCtx,
  rule: NormalizedRule,
) => readonly LunaCustomThemeKey[]

const RULES: Record<LunaThemeResolveRuleId, CandidateGenerator> = {
  exact: (ctx) => {
    const k = ctx.requested
    if (!k) return []
    return ctx.allowedSet.has(k) ? [k] : []
  },

  'same-variant': (ctx) => {
    const v = ctx.requestedVariant
    if (!v) return []
    // Preserve allowed order
    return ctx.allowed.filter(k => inferThemeVariant(k) === v)
  },

  'same-mode': (ctx) => {
    const m = ctx.requestedMode
    if (!m) return []
    // Preserve allowed order
    return ctx.allowed.filter(k => inferThemeMode(k) === m)
  },
}

/**
 * Infer known theme mode from key if possible.
 * Examples:
 *   "luna-light"          -> "light"
 *   "cosmic-night-dark"   -> "dark"
 *   "cosmic-night"        -> undefined
 */
export function inferThemeMode(
  key?: LunaCustomThemeKey,
): LunaThemeMode | undefined {
  if (!key) return undefined
  if (DARK_MODE_RE.test(key)) return 'dark'
  if (LIGHT_MODE_RE.test(key)) return 'light'
  return undefined
}

/**
 * Infer theme variant from key if possible.
 *
 * Notes:
 * - For known prefixes, we return canonical variants ('luna', 'lunaris').
 * - Otherwise we return the first hyphen-separated segment (lowercased).
 *
 * Examples:
 * - "luna-light"    -> "luna"
 * - "lunaris-dark"  -> "lunaris"
 * - "cosmic-night"  -> "cosmic"
 */
export function inferThemeVariant(
  key?: LunaCustomThemeKey,
): LunaCustomThemeVariant | undefined {
  if (!key) return undefined
  if (key.startsWith('luna-')) return 'luna'
  if (key.startsWith('lunaris-')) return 'lunaris'
  const lower = key.toLowerCase()
  const segments = lower.split('-')
  return segments[0]
}

/**
 * Options controlling theme resolution behavior.
 */
export interface LunaThemeResolverOptions {
  /**
   * Preferred default key.
   *
   * - When allowed list is non-empty and fallback is 'use-default':
   *   we use this key only if it exists in allowed;
   *   otherwise we fall back to allowed[0].
   *
   * - When allowed list is empty and onEmpty is 'use-default-key':
   *   we return this key as a placeholder.
   *
   * @defaultValue 'lunaris-dark'
   */
  defaultKey?: LunaCustomThemeKey

  /**
   * What to do when requested cannot be resolved from a non-empty allowed list.
   *
   * - `use-default`: prefer defaultKey if present in allowed, else first
   * - `use-first`: always first
   * - `error`: throw error
   *
   * @defaultValue 'use-default'
   */
  fallback?: LunaThemeResolverFallback

  /**
   * Ordered rules to generate candidates.
   *
   * Built-in rule ids:
   * - `exact`: use the requested key directly if it exists in the allowed list
   * - `same-variant`: match themes with the same variant as the requested key
   * - `same-mode`: match themes with the same mode (light/dark) as the requested key
   *
   * Rules are evaluated in order. Each rule may produce zero or more candidates
   * from the allowed list. The first candidate is selected.
   *
   * @defaultValue ['exact','same-variant','same-mode']
   */
  rules?: readonly LunaThemeResolveRuleSpec[]

  /**
   * What to do when allowed list is empty.
   *
   * - `error`: throw
   * - `use-default-key`: return defaultKey (placeholder)
   *
   * @defaultValue 'error'
   */
  onEmpty?: LunaThemeResolverOnEmpty
}

const DEFAULT_KEY = 'lunaris-dark' as LunaCustomThemeKey
const DEFAULT_FALLBACK: LunaThemeResolverFallback = 'use-default'
const DEFAULT_ON_EMPTY: LunaThemeResolverOnEmpty = 'error'

function assertNever(x: never): never {
  throw new Error(`[resolveThemeKey] Unexpected fallback value: ${String(x)}`)
}

/**
 * Resolve a theme key from a non-empty list of allowed keys.
 *
 * Rules are evaluated in order and the first matching candidate is selected.
 * If no match is found, the behavior is controlled by `options.fallback`.
 *
 * Advanced API: caller must guarantee `allowed` is non-empty.
 */
export function resolveThemeKey(
  /** Non-empty list of allowed theme keys */
  allowed: readonly [LunaCustomThemeKey, ...LunaCustomThemeKey[]],
  requested: LunaCustomThemeKey | undefined,
  options: LunaThemeResolverOptions = {},
): LunaCustomThemeKey {
  const defaultKey = options.defaultKey ?? DEFAULT_KEY
  const fallback = options.fallback ?? DEFAULT_FALLBACK

  const rules = normalizeRules(options.rules)
  const allowedSet = new Set(allowed)

  const ctx: CandidateCtx = {
    allowed,
    allowedSet,
    requested,
    requestedMode: inferThemeMode(requested),
    requestedVariant: inferThemeVariant(requested),
  }

  for (const rule of rules) {
    const gen = RULES[rule.id]
    const candidates = gen(ctx, rule)
    const first = candidates[0]
    if (first !== undefined) return first
  }

  switch (fallback) {
    case 'use-first':
      return allowed[0]
    case 'use-default':
      return allowedSet.has(defaultKey) ? defaultKey : allowed[0]
    case 'error':
      throw new Error(
        `Theme "${
          requested ?? '(undefined)'
        }" cannot be resolved from allowed list.`,
      )
    default: {
      assertNever(fallback)
    }
  }
}

/**
 * Resolve a theme key from a list of allowed keys.
 *
 * This is the recommended entry point.
 * Empty lists are handled according to `options.onEmpty`.
 */
export function resolveThemeKeyFromList(
  /** List of allowed theme keys (may be empty) */
  allowed: readonly LunaCustomThemeKey[],
  requested: LunaCustomThemeKey | undefined,
  options: LunaThemeResolverOptions = {},
): LunaCustomThemeKey {
  const defaultKey = options.defaultKey ?? DEFAULT_KEY
  const onEmpty = options.onEmpty ?? DEFAULT_ON_EMPTY

  if (allowed.length === 0) {
    if (onEmpty === 'error') {
      throw new Error(
        'resolveThemeKeyFromList requires a non-empty allowed list.',
      )
    }
    // use-default-key
    return defaultKey
  }

  return resolveThemeKey(
    allowed as unknown as NonEmptyArray<LunaCustomThemeKey>,
    requested,
    options,
  )
}

/**
 * Resolve a theme object from a list of theme-like objects.
 *
 * Resolution is key-based; the matching object is returned.
 * Empty lists follow `options.onEmpty`.
 */
export function resolveThemeObjectFromList<T extends LunaResolvableTheme>(
  /** List of theme objects (each must have a `key`) */
  themes: readonly T[],
  requested: LunaCustomThemeKey | undefined,
  options: LunaThemeResolverOptions = {},
): T | undefined {
  const onEmpty = options.onEmpty ?? DEFAULT_ON_EMPTY

  if (themes.length === 0) {
    if (onEmpty === 'error') {
      throw new Error(
        'resolveThemeObjectFromList requires a non-empty themes list.',
      )
    }
    return undefined
  }

  const keys = themes.map(t => t.key)
  const key = resolveThemeKey(
    keys as unknown as NonEmptyArray<LunaCustomThemeKey>,
    requested,
    options,
  )
  return themes.find(t => t.key === key)
}
