// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { normalizeDefs } from './normalize.js'
import { createComponentRegistry } from './registry.js'
import type {
  ComponentDef,
  ComponentDefInput,
  NormalizedTuple,
  Registry,
} from './types.js'

/**
 * Build a component registry.
 * - Accepts strings, ComponentDefInput, ComponentDef.
 * - Flattens groups automatically.
 * - **Normalizes by default** (auto TitleCase names, default demoReady=false).
 */
export function defineComponents<
  const T extends readonly (string | ComponentDefInput)[],
>(
  items: T,
  options?: { normalize?: true },
): Registry<NormalizedTuple<T>>

export function defineComponents<
  const T extends readonly ComponentDef[],
>(
  items: T,
  options: { normalize: false },
): Registry<T>

export function defineComponents(
  items: readonly unknown[],
  options?: { normalize?: boolean },
) {
  const normalize = options?.normalize ?? true
  if (normalize) {
    const defs = normalizeDefs(items as readonly ComponentDefInput[])
    return createComponentRegistry(defs)
  }
  return createComponentRegistry(items as readonly ComponentDef[])
}

/** Exact-in / exact-out. No normalization. */
export function defineComponentsRaw<
  const T extends readonly ComponentDef[],
>(items: T) {
  return defineComponents(items, { normalize: false })
}
