// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ComponentDefInput, NormalizedItem } from './types.js'

/** Turn a kebab/underscore id into Title Case name: "radio-group" → "Radio Group" */
export function titleFromSlug(id: string): string {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map(w => w[0] ? w[0].toUpperCase() + w.slice(1) : w)
    .join(' ')
}

/** Turn a kebab/underscore id into Capitalized Camel Case name: "radio-group" → "RadioGroup" */
export function demoTitleFromSlug(id: string): string {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map(w => w[0] ? w[0].toUpperCase() + w.slice(1) : w)
    .join('')
}

/** Normalize mixed inputs into fully-specified definitions */
function normalizeDefs<
  const T extends readonly ComponentDefInput[],
>(items: T): { readonly [K in keyof T]: NormalizedItem<T[K]> } {
  const result = items.map((item) => {
    const id = typeof item === 'string' ? item : item.id
    const name = typeof item === 'string'
      ? titleFromSlug(id)
      : (item.name ?? titleFromSlug(id))
    const demoReady = typeof item === 'string'
      ? false
      : ('demoReady' in item ? item.demoReady : false)
    return { id, name, demoReady } as const
  })
  return result as { readonly [K in keyof T]: NormalizedItem<T[K]> }
}

export { normalizeDefs }
