// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useMemo } from 'react'

import type { LunaThemeMode, LunaThemeVariant } from '../../types'

export interface ThemeKeyboardAction {
  variant?: LunaThemeVariant
  mode?: LunaThemeMode
}

export type ThemeKeyboardMapping = Partial<Record<string, ThemeKeyboardAction>>

export interface ThemeKeyboardControlsOptions {
  enabled: boolean
  mapping?: ThemeKeyboardMapping
  onThemeVariantChange?: (variant: LunaThemeVariant) => void
  onThemeModeChange?: (mode: LunaThemeMode) => void
}

export const defaultThemeKeyboardMapping: ThemeKeyboardMapping = {
  a: { variant: 'luna' },
  s: { variant: 'lunaris' },
  j: { mode: 'light' },
  k: { mode: 'dark' },
}

export function useThemeKeyboardControls({
  enabled,
  mapping,
  onThemeVariantChange,
  onThemeModeChange,
}: ThemeKeyboardControlsOptions) {
  const mergedMapping = useMemo(() => {
    if (mapping === undefined) return defaultThemeKeyboardMapping
    return { ...defaultThemeKeyboardMapping, ...mapping }
  }, [mapping])

  useEffect(() => {
    if (!enabled) return
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target
      const isEditableTarget = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || (target instanceof HTMLElement && target.isContentEditable)
      if (isEditableTarget || e.metaKey || e.ctrlKey || e.altKey) return

      const action = mergedMapping[e.key.toLowerCase()]
      if (action?.variant !== undefined) onThemeVariantChange?.(action.variant)
      if (action?.mode !== undefined) onThemeModeChange?.(action.mode)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, mergedMapping, onThemeModeChange, onThemeVariantChange])
}
