// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import type { LunaCustomThemeKey, LunaThemeKey } from '@lynx-js/luna-core'
import { resolveThemeKeyFromList } from '@lynx-js/luna-core'
import type { CSSProperties } from '@lynx-js/types'

interface LunaThemeProps {
  children?: ReactNode
  themes?: readonly LunaCustomThemeKey[]
  themeKey?: LunaCustomThemeKey
  as?: 'view' | 'page'
  className?: string
  style?: CSSProperties
}

const DEFAULT_THEMES: LunaThemeKey[] = [
  'lunaris-dark',
  'lunaris-light',
  'luna-dark',
  'luna-light',
]

const DEFAULT_VIEW_STYLE: CSSProperties = { width: '100%', height: '100%' }

const EMPTY_STYLE = {}

export function LunaTheme(
  {
    children,
    themes = DEFAULT_THEMES,
    themeKey,
    as = 'page',
    style = EMPTY_STYLE,
    className,
  }: LunaThemeProps,
) {
  const requested = themeKey ?? lynx?.__globalProps?.lunaTheme
  const resolved = resolveThemeKeyFromList(themes, requested)

  const viewStyle = useMemo(
    () =>
      style === EMPTY_STYLE
        ? DEFAULT_VIEW_STYLE
        : { ...DEFAULT_VIEW_STYLE, ...style },
    [style],
  )

  const finalClassName = className ? `${resolved} ${className}` : resolved

  return (as === 'page'
    ? <page className={finalClassName} style={style}>{children}</page>
    : (
      <view
        className={finalClassName}
        style={viewStyle}
      >
        {children}
      </view>
    ))
}
