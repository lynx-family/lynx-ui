// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { LunaThemeProvider, createLunaTheme } from '@lynx-js/luna-reactlynx'
import {
  lunaDarkTokens,
  lunaLightTokens,
  lunarisDarkTokens,
  lunarisLightTokens,
} from '@lynx-js/luna-tokens'
import { clsx } from 'clsx'

import type { ThemeProps } from '../types/index.docs.js'

const themes = {
  'luna-dark': createLunaTheme(lunaDarkTokens),
  'luna-light': createLunaTheme(lunaLightTokens),
  'lunaris-dark': createLunaTheme(lunarisDarkTokens),
  'lunaris-light': createLunaTheme(lunarisLightTokens),
}

export function Theme({
  themeKey,
  children,
  className,
  style,
}: ThemeProps) {
  return (
    <LunaThemeProvider theme={themes[themeKey]}>
      <view className={clsx(themeKey, className)} style={style}>
        {children}
      </view>
    </LunaThemeProvider>
  )
}
