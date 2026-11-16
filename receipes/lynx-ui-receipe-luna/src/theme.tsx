// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clsx } from 'clsx'

import type { LunaThemeScopeProps } from './types/index.docs.js'

export function LunaThemeScope({
  themeKey,
  children,
  className,
  style,
}: LunaThemeScopeProps) {
  return (
    <view className={clsx(themeKey, className)} style={style}>
      {children}
    </view>
  )
}
