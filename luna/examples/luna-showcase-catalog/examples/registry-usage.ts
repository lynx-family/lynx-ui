// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { RegistryDef, RegistryIds } from '../src/index.js'
import { defineComponents } from '../src/index.js'

const components = [
  { id: 'button', demoReady: true },
  { id: 'input', demoReady: false },
] as const

export const reg = defineComponents(components)

type Id = RegistryIds<typeof reg> // "button" | "input"
type Def = RegistryDef<typeof reg> // ComponentDef<"button", true> | ComponentDef<"input", false>
type Ids = typeof reg.ids // readonly ["button", "input"]
type Ready = typeof reg.ready //  readonly ComponentDef<"button", true>[]
type ReadyIds = typeof reg.readyIds // readonly "button"[]

export type { Id, Def, Ids, Ready, ReadyIds }
