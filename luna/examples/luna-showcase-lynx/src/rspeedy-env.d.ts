// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
/// <reference types="@lynx-js/rspeedy/client" />
import type { LunaThemeKey, LynxUIComponentId, StudioViewMode } from './types'

declare module '@lynx-js/types' {
  interface GlobalProps {
    /**
     * Define your global properties in this interface.
     * These types will be accessible through `lynx.__globalProps`.
     */
    lunaTheme: LunaThemeKey
    studioThemeKey: LunaThemeKey
    studioAutoplay: boolean
    studioViewMode: StudioViewMode
    studioFocusKey: LynxUIComponentId
    frontendTheme: 'light' | 'dark' | 'Light' | 'Dark'
  }
}

declare module '@lynx-js/types' {
  interface NativeModules {
    ExplorerModule: {
      openSchema(url: string): void
      saveToLocalStorage(key: string, value: string): void
      readFromLocalStorage(key: string): string | null
    }
  }
}

declare global {
  const __WEB__: boolean
  const process: {
    env: {
      ASSET_PREFIX?: string
      [key: string]: string | undefined
    }
  }
}
