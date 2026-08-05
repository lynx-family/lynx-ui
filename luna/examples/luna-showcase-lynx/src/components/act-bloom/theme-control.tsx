// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from '@lynx-js/react'

import { parseLunaThemeKey } from '@lynx-js/luna-core'

import { useControllable } from './use-controllable'
import type { LunaThemeKey, LunaThemeMode, LunaThemeVariant } from '../../types'

type ThemeControlProps =
  | {
    theme: LunaThemeKey
    onThemeChange: (key: LunaThemeKey) => void
    defaultTheme?: never
  }
  | {
    defaultTheme?: LunaThemeKey
    theme?: never
    onThemeChange?: (key: LunaThemeKey) => void
  }

function ThemeControl(
  { defaultTheme = 'lunaris-dark', theme: themeProp, onThemeChange }:
    ThemeControlProps,
) {
  const [themeKey, setThemeKey] = useControllable({
    value: themeProp,
    defaultValue: defaultTheme,
    onValueChange: onThemeChange,
  })
  const theme = useMemo(() => parseLunaThemeKey(themeKey), [themeKey])

  const { variant, mode } = theme

  const toggleVariant = () => {
    const nextVariant: LunaThemeVariant = variant === 'luna'
      ? 'lunaris'
      : 'luna'
    setThemeKey(`${nextVariant}-${mode}`)
  }

  const toggleMode = () => {
    const nextMode: LunaThemeMode = mode === 'light' ? 'dark' : 'light'
    setThemeKey(`${variant}-${nextMode}`)
  }

  return (
    <view className='w-full h-[48px] flex flex-row justify-end gap-[16px] items-center'>
      <view
        bindtap={toggleVariant}
        className='flex-1 border border-line rounded-[24px] px-[12px] py-[8px] flex flex-col items-center'
      >
        <text className='text-sm text-content-faint'>variant</text>
        <text className='font-semibold text-lg text-content'>
          {variant === 'luna' ? 'LUNA' : 'Lunaris'}
        </text>
      </view>
      <view
        bindtap={toggleMode}
        className='flex-1 border border-line rounded-[24px] px-[12px] py-[8px] flex flex-col items-center'
      >
        <text className='text-sm text-content-faint'>mode</text>
        <text className='font-semibold text-lg text-content'>
          {mode === 'dark' ? 'Dark' : 'Light'}
        </text>
      </view>
    </view>
  )
}

export { ThemeControl }
export type { ThemeControlProps }
