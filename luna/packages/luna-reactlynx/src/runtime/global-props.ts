// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LunaCustomThemeKey } from '@lynx-js/luna-core'
import type { GlobalProps } from '@lynx-js/types'

declare module '@lynx-js/types' {
  interface GlobalProps {
    lunaTheme?: LunaCustomThemeKey
  }
}

export type { GlobalProps }
