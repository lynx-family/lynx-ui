// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { LUNA_COLOR_IDS } from '@lynx-js/luna-core'
import type { LunaColorId, LunaThemeTokens } from '@lynx-js/luna-core'
import {
  lunaDarkTokens,
  lunaLightTokens,
  lunarisDarkTokens,
  lunarisLightTokens,
} from '@lynx-js/luna-tokens'

export const themeTokens: readonly LunaThemeTokens[] = [
  lunaLightTokens,
  lunaDarkTokens,
  lunarisLightTokens,
  lunarisDarkTokens,
]

export const colorTokenIds: readonly LunaColorId[] = LUNA_COLOR_IDS

export const colorTokenCount = colorTokenIds.length
