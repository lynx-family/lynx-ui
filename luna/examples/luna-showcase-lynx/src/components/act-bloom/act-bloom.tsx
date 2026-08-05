// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useState } from '@lynx-js/react'

import { demoTitleFromSlug } from '@lynx-js/example-luna-showcase-catalog'
import { parseLunaThemeKey } from '@lynx-js/luna-core'

import { LyricBlock } from './lyric-block.js'
import { ThemeControl } from './theme-control.js'
import {
  ALL_LUNA_THEME_KEYS,
  LUNA_DEFAULT_COMPONENT,
  LUNA_OFFSTAGE_COMPONENTS,
  LUNA_SAVED_COMPONENT,
  LUNA_SAVED_THEME,
  LUNA_STAGE_COMPONENTS,
  LUNA_STAGE_DEFAULT_THEME,
  LUNA_STAGE_ONLY_COMPONENTS,
  LUNA_STUDIO_DEFAULT_THEME,
  LUNA_STUDIO_ONLY_COMPONENTS,
  LynxUIComponentsRegistry,
} from '../../constants'
import { explorerRead, explorerSave } from '../../native'
import type {
  LunaThemeKey,
  LynxUIComponentDef,
  LynxUIComponentId,
  StudioViewMode,
} from '../../types'
import { cn } from '../../utils'

const LynxUIComponents = LynxUIComponentsRegistry.list

const lyricLines: string[] = [
  'I saw it bloom,',
  'Like Tokyo in the spring,',
  'One afternoon,',
  'My Tokyo, happening,',
  'The baby blue skies,',
  'Broke \'em in for the first time,',
  'As it opened right before my very eyes.',
]

interface ComponentDisplay {
  data: LynxUIComponentDef
  checked: boolean
  onClick?: (id: LynxUIComponentId) => void
}

interface ActBloomProps {
  studioViewMode: StudioViewMode
  studioFocusKey: LynxUIComponentId
  lunaTheme: LunaThemeKey
}

function ActBloom(
  { studioViewMode, studioFocusKey, lunaTheme }: ActBloomProps,
) {
  const [focused, setFocused] = useState<LynxUIComponentId>(getSavedComponent)
  const [innerTheme, setInnerTheme] = useState<LunaThemeKey>(getSavedTheme)

  const theme = __WEB__ ? lunaTheme : innerTheme

  const handleComponentClick = (id: LynxUIComponentId) => {
    setFocused(id)
    if (__WEB__) {
      NativeModules?.bridge?.call(
        'emitStudioEvent',
        {
          type: 'studioFocusKey',
          payload: { focusKey: id },
          source: 'bloom-focus',
        },
        () => undefined,
      )
    } else {
      saveComponent(id)
      const background = theme.endsWith('dark') ? '0d0d0d' : 'ffffff'
      NativeModules?.ExplorerModule?.openSchema(
        `${process.env
          .ASSET_PREFIX!}/${
          LUNA_OFFSTAGE_COMPONENTS.includes(id)
            ? `OffstageAct${demoTitleFromSlug(id)}`
            : (LUNA_STAGE_COMPONENTS.includes(id)
              ? `Act${demoTitleFromSlug(id)}`
              : 'ActSwitch')
        }.lynx.bundle?fullscreen=true&luna_theme=${theme}&bar_color=${background}&bg_color=${background}`,
      )
    }
  }

  const handleThemeChange = (themeKey: LunaThemeKey) => {
    if (__WEB__) {
      const { variant, mode } = parseLunaThemeKey(themeKey)
      NativeModules?.bridge?.call(
        'emitStudioEvent',
        { type: 'studioThemeVariant', payload: variant, source: 'bloom-theme' },
        () => undefined,
      )
      NativeModules?.bridge?.call(
        'emitStudioEvent',
        { type: 'studioThemeMode', payload: mode, source: 'bloom-theme' },
        () => undefined,
      )
    } else {
      setInnerTheme(themeKey)
      saveTheme(themeKey)
    }
  }

  return (
    <view
      className={cn(
        'relative size-full bg-canvas transition-colors duration-300 ease-in-out',
        theme,
      )}
    >
      <view className='absolute h-full w-full luna-gradient flex flex-col justify-center px-[48px]'>
        <LyricBlock
          lines={lyricLines}
          title='Tokyo'
          artist='Luna Shadows'
        />
      </view>
      <view
        className={cn(
          'absolute bottom-0 h-full w-full bg-canvas transition-all ease-in-out duration-300 overflow-hidden',
          studioViewMode === 'compare' && 'transform-[translateY(66.7%)]',
          studioViewMode === 'focus' && 'transform-[translateY(0%)]',
          studioViewMode === 'lineup' && 'transform-[translateY(100%)]',
          studioViewMode === 'compare' && 'rounded-t-[36px]',
        )}
      />

      <view
        className={cn(
          'size-full px-[72px] pt-[96px] transition-all ease-in-out duration-500',
          studioViewMode !== 'focus' && 'transform-[translateY(100%)]',
        )}
      >
        <view
          className={cn(
            'w-full flex flex-col items-start justify-start',
            __WEB__ ? 'gap-[72px]' : 'gap-[54px]',
          )}
        >
          {/* Headline */}
          <view className='w-full flex flex-col items-start justify-start'>
            <text className='text-start text-xl text-content font-semibold'>
              L.U.N.A Performance
            </text>
          </view>
          {/* Components */}
          <view
            className={cn(
              'w-full flex flex-col items-start justify-start',
              __WEB__ ? 'gap-[10px]' : 'gap-[6px]',
            )}
          >
            {LynxUIComponents.map(d => {
              if (__WEB__) {
                return (
                  LUNA_STAGE_ONLY_COMPONENTS.includes(d.id)
                    ? null
                    : (
                      <ComponentItem
                        key={d.id}
                        data={d}
                        onClick={handleComponentClick}
                        checked={studioFocusKey === d.id}
                      />
                    )
                )
              }
              return (
                LUNA_STUDIO_ONLY_COMPONENTS.includes(d.id)
                  ? null
                  : (
                    <ComponentItem
                      key={d.id}
                      data={d}
                      onClick={handleComponentClick}
                      checked={focused === d.id}
                    />
                  )
              )
            })}
          </view>
          {/* Theme Control */}
          {__WEB__
            ? (
              <ThemeControl
                theme={theme}
                onThemeChange={handleThemeChange}
              />
            )
            : (
              <ThemeControl
                defaultTheme={theme}
                onThemeChange={handleThemeChange}
              />
            )}
        </view>
      </view>
    </view>
  )
}

export { ActBloom }
export type { ActBloomProps }

function getSavedComponent(): LynxUIComponentId {
  const savedComponent: string | null = explorerRead(
    LUNA_SAVED_COMPONENT,
    null,
  )
  if (
    savedComponent
    && LynxUIComponents.some(component => component.id === savedComponent)
  ) {
    return savedComponent as LynxUIComponentId
  }
  return LUNA_DEFAULT_COMPONENT
}

function saveComponent(id: LynxUIComponentId) {
  explorerSave(LUNA_SAVED_COMPONENT, id)
}

/**
 * Load theme from Explorer's local storage with validation.
 */
function getSavedTheme(): LunaThemeKey {
  if (__WEB__) {
    return LUNA_STUDIO_DEFAULT_THEME
  }
  const saved: string | null = explorerRead(LUNA_SAVED_THEME, null)

  if (saved && ALL_LUNA_THEME_KEYS.includes(saved as LunaThemeKey)) {
    return saved as LunaThemeKey
  }
  return LUNA_STAGE_DEFAULT_THEME
}

/**
 * Persist theme key to Explorer local storage.
 */
function saveTheme(key: LunaThemeKey) {
  explorerSave(LUNA_SAVED_THEME, key)
}

function ComponentItem(
  { data, checked, onClick }: ComponentDisplay,
) {
  return (
    <text
      className={cn(
        'px-[8px] py-[2px] ui-checked:py-[12px] text-lg ui-checked:transform-[scale(1.2)] ui-checked:text-primary ui-checked:font-semibold active:text-primary-2 transition-all duration-300 ease-in-out',
        data.demoReady
          ? 'text-content hover:opacity-50'
          : 'text-content-muted opacity-50',
        checked && 'ui-checked',
      )}
      bindtap={data.demoReady ? () => onClick?.(data.id) : undefined}
    >
      {data.name}
    </text>
  )
}
