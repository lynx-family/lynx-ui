// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * @file component
 *
 * Component registry and definition.
 */
export type {
  ComponentDef,
  ComponentDefInput,
  ExtractId,
  NormalizedItem,
  NormalizedTuple,
  ReadyOf,
  ReadyIdOf,
  Registry,
  RegistryIds,
  RegistryDef,
} from './types.js'

// ---------- Constructors / Registry builders ----------
export {
  // Normalized by default; accepts string | ComponentDefInput | ComponentDef
  defineComponents,
  // Raw mode: exact-in/exact-out, no slugify/name defaults
  defineComponentsRaw,
} from './define.js'

// ---------- Utilities (public, handy in Studio/Stage) ----------
export {
  titleFromSlug, // "radio-group" -> "Radio Group"
  demoTitleFromSlug, // "radio-group" -> "RadioGroup"
} from './normalize.js'
