// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Choreography } from '@lynx-js/luna-studio'
import type { InteractionParams } from '@lynx-js/luna-studio'
import { useState } from 'react'

import type {
  LunaThemeKey,
  LunaThemeMode,
  LunaThemeVariant,
  StudioViewMode,
} from '../../types'
import { cn } from '../../utils'
import { MenuBar } from '../menu-bar'
import { StudioFrame } from '../studio-frame'
import {
  buildStudioStageGlobalProps,
  DEFAULT_STUDIO_FOCUS_KEY as defaultStudioFocusKey,
  modeGrid,
  resolveStudioFocusKey,
  studioLayoutGridDraft,
} from './studio-layout-grid'
import { useThemeKeyboardControls } from './use-theme-keyboard-controls'

const viewModes: StudioViewMode[] = ['compare', 'focus', 'lineup']

interface StudioEvent {
  type:
    | 'studioThemeVariant'
    | 'studioThemeMode'
    | 'studioAutoplay'
    | 'requestViewModeChange'
  payload?: unknown
  source?: unknown
}

function isStudioEvent(data: unknown): data is StudioEvent {
  if (data === null || typeof data !== 'object') return false

  const event = data as { type?: unknown }
  return event.type === 'studioThemeVariant'
    || event.type === 'studioThemeMode'
    || event.type === 'studioAutoplay'
    || event.type === 'requestViewModeChange'
}

function Studio({ className }: { className?: string }) {
  const [viewMode, setViewMode] = useState<StudioViewMode>('compare')
  const [themeVariant, setThemeVariant] = useState<LunaThemeVariant>('lunaris')
  const [themeMode, setThemeMode] = useState<LunaThemeMode>('dark')
  const [studioAutoplay, setStudioAutoplay] = useState(false)

  const studioThemeKey: LunaThemeKey = `${themeVariant}-${themeMode}`

  function handleInteraction(interaction: InteractionParams) {
    if (interaction.target !== 'content') return
    const call = interaction.runtimeCall
    if (call === undefined) return
    if (call.name !== 'emitStudioEvent') return
    if (!isStudioEvent(call.data)) return
    const event = call.data
    if (event.type === 'studioThemeVariant') {
      if (event.payload === 'luna' || event.payload === 'lunaris') {
        setThemeVariant(event.payload)
      }
    } else if (event.type === 'studioThemeMode') {
      if (event.payload === 'light' || event.payload === 'dark') {
        setThemeMode(event.payload)
      }
    } else if (event.type === 'studioAutoplay') {
      if (typeof event.payload === 'boolean') {
        setStudioAutoplay(event.payload)
      }
    } else if (event.type === 'requestViewModeChange') {
      const suggestedViewMode = (() => {
        const payload = event.payload
        if (payload === null || typeof payload !== 'object') return undefined
        const candidate = (payload as { suggestedViewMode?: unknown })
          .suggestedViewMode
        return candidate === 'compare' || candidate === 'focus'
            || candidate === 'lineup'
          ? candidate
          : undefined
      })()

      if (suggestedViewMode !== undefined) {
        setViewMode(suggestedViewMode)
        return
      }

      setViewMode((prevMode) => {
        const index = viewModes.indexOf(prevMode)
        if (index < 0) return viewModes[0]
        return viewModes[(index + 1) % viewModes.length]
      })
    }
  }

  useThemeKeyboardControls({
    enabled: true,
    onThemeVariantChange: (variant) => {
      setThemeVariant(variant)
    },
    onThemeModeChange: (mode) => {
      setThemeMode(mode)
    },
  })

  return (
    <StudioFrame
      className={cn(
        'pointer-events-auto relative luna-studio transition-all duration-300 ease-in-out',
        themeMode === 'light' ? 'bg-[#f5f5f5]' : 'bg-[#000000]',
        className,
      )}
    >
      <Choreography
        layout={studioLayoutGridDraft}
        className='gap-4'
        modeGrid={modeGrid}
        viewMode={viewMode}
        defaultFocusKey={defaultStudioFocusKey}
        resolveFocusKey={resolveStudioFocusKey}
        buildStageGlobalProps={({ stage, viewMode, activeFocusKey }) => ({
          ...buildStudioStageGlobalProps({ stage, viewMode, activeFocusKey }),
          studioThemeKey,
          studioAutoplay,
        })}
        interactionTarget='content'
        onInteraction={handleInteraction}
        themeKey={studioThemeKey}
      />
      <MenuBar
        onViewModeChange={(i) => setViewMode(viewModes[i])}
        className='z-[1000]'
        themeMode={themeMode}
      />
    </StudioFrame>
  )
}

export { Studio }
