// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import { clsx } from 'clsx'

import type { LunaThemeKey } from './types'

import './App.css'

interface AppThemeProps {
  preset?: LunaThemeKey
  children?: ReactNode
}

function AppTheme({ preset = 'luna-dark', children }: AppThemeProps) {
  return (
    <page
      className={clsx(
        'flex flex-col justify-center items-center bg-canvas text-content transition-colors duration-300 ease-in-out',
        preset,
      )}
    >
      {children}
    </page>
  )
}

export { AppTheme }
