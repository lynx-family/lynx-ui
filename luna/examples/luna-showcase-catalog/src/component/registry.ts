// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ComponentDef, ReadyOf, Registry } from './types.js'

/**
 * Helper: Extract ids as a tuple preserving literal types
 */
export function extractIds<const T extends readonly ComponentDef[]>(
  defs: T,
): { [K in keyof T]: T[K]['id'] } {
  return defs.map(d => d.id) as { [K in keyof T]: T[K]['id'] }
}
/**
 * Create a strongly typed component registry.
 * - Runtime: validated & helper-rich.
 * - Types: exposes branded Id/Def for extraction without hacks.
 */
export function createComponentRegistry<
  const T extends readonly ComponentDef[],
>(
  defs: T,
): Registry<T> {
  type Def = T[number]
  type Id = Def['id']
  type Ready = ReadyOf<T> // = Extract<Def, { demoReady: true }>

  // --- Validate duplicate IDs (runtime) ---
  const ids = defs.map(d => d.id) as { [K in keyof T]: T[K]['id'] }

  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`Duplicate component ID: ${id}`)
    seen.add(id)
  }

  // --- Core structures ---
  const list = defs
  const isReady = (d: Def): d is Ready => d.demoReady === true

  // --- Derived data ---
  const ready: readonly Ready[] = list.filter(d => isReady(d))
  const readyIds: readonly Ready['id'][] = ready.map(d => d.id)

  const names = list.map(d => d.name) as { [K in keyof T]: T[K]['name'] }

  // --- Helpers ---
  const idSet = new Set(ids as readonly string[]) as ReadonlySet<Id>
  const isId = (x: unknown): x is Id => typeof x === 'string' && idSet.has(x)

  // Build a typed dictionary once (cast is local, not in the return)
  const byId = Object.fromEntries(
    list.map(d => [d.id, d] as const),
  ) as {
    readonly [P in Id]: Extract<Def, { id: P }>
  }

  const getMeta = <K extends Id>(id: K) => byId[id]

  return {
    list,
    ids,
    names,
    ready,
    readyIds,
    isId,
    getMeta,
    [Symbol.toStringTag]: {
      _id: undefined as unknown as Id,
      _def: undefined as unknown as Def,
    },
  }
}
