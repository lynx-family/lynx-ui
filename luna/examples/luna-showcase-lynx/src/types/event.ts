// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { StudioViewMode } from '@/types'

import type { LunaThemeMode, LunaThemeVariant } from '@lynx-js/luna-core'

type StudioEvent =
  | { type: 'studioThemeVariant', payload: LunaThemeVariant, source?: string }
  | { type: 'studioThemeMode', payload: LunaThemeMode, source?: string }
  | { type: 'studioFocusKey', payload: { focusKey: string }, source?: string }
  | { type: 'studioAutoplay', payload: boolean, source?: string }
  | {
    type: 'requestViewModeChange'
    payload?: { suggestedViewMode?: StudioViewMode }
    source?: string
  }

type onStudioEvent = (e: StudioEvent) => void

export type { onStudioEvent, StudioEvent }
