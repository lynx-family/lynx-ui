// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LynxUIComponentsRegistry } from '../constants'

export type LynxUIComponentId = (typeof LynxUIComponentsRegistry.ids)[number]
export type LynxUIComponentDef = (typeof LynxUIComponentsRegistry.list)[number]
export type LynxUIComponentIdReady =
  (typeof LynxUIComponentsRegistry.readyIds)[number]

export type {
  LunaThemeKey,
  LunaThemeMode,
  LunaThemeVariant,
} from '@lynx-js/luna-core'

export type { StudioViewMode } from '@lynx-js/luna-studio'
