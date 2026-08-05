// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useCallback } from '@lynx-js/react'

import { parseLunaThemeKey } from '@lynx-js/luna-core'

import type { LunaThemeKey, StudioViewMode } from '../../types'
import type { onStudioEvent } from '../../types/event.js'
import { cn } from '../../utils'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { RadioGroup, RadioItem } from '../ui/radio-group'
import { Switch } from '../ui/switch'

interface ActMoonriseProps {
  studioViewMode: StudioViewMode
  studioThemeKey: LunaThemeKey
  studioAutoplay: boolean
}

function ActMoonrise(
  { studioViewMode = 'compare', studioThemeKey, studioAutoplay }:
    ActMoonriseProps,
) {
  const { variant: lunaVariant, mode } = parseLunaThemeKey(studioThemeKey)
  const lightsOn = mode === 'light'

  const emit = useCallback<onStudioEvent>(
    (event) => {
      NativeModules?.bridge?.call(
        'emitStudioEvent',
        event,
        () => undefined,
      )
    },
    [],
  )

  return (
    <view className='size-full flex flex-col justify-between items-center px-[16px] pt-[80px] pb-[48px] overflow-hidden'>
      <view
        className={cn(
          'w-full rounded-[16px] px-[20px] py-[32px] border border-line flex flex-col items-start gap-[24px] transition-transform duration-500 ease-in-out',
          studioViewMode !== 'compare' && 'transform-[translateY(-100vh)]',
        )}
      >
        {/* Headline */}
        <view className='w-full flex flex-col items-start gap-[2px]'>
          <text className='text-start text-xl text-content font-semibold'>
            Awaken your interface
          </text>
          <text className='text-start text-p2 text-content-2'>
            Generate your first Lynx UI theme. Step into the night and let your
            interface bloom.
          </text>
        </view>
        {/* Theme: Choose from Neutral & Signature Gradient */}
        <view className='w-full flex flex-col items-start gap-[10px]'>
          <view className='w-full flex flex-col items-start gap-[2px]'>
            <text className='text-start text-base text-content font-medium'>
              Theme
            </text>
            <text className='text-start text-p2 text-content-2'>
              Select the theme that best fits your needs.
            </text>
          </view>
          {/* Radio Group Demo */}
          <RadioGroup
            className='w-full grid-cols-2 gap-[10px]'
            value={lunaVariant}
          >
            <view
              className={cn(
                'rounded-[10px] p-[10px] border flex flex-row gap-[8px]',
                lunaVariant === 'luna' && 'bg-neutral-film',
                lunaVariant === 'luna'
                  ? 'border-neutral-veil'
                  : 'border-line',
              )}
              bindtap={() => {
                emit({
                  type: 'studioThemeVariant',
                  payload: 'luna',
                  source: 'moonrise-theme-picker',
                })
              }}
            >
              <RadioItem value={'luna'} />
              <view className='flex-1 flex flex-col items-start pr-[4px] pb-[4px]'>
                <text className='text-start text-base text-content font-medium'>
                  LUNA
                </text>
                <text className='text-start text-xs text-content-2'>
                  Default neutral theme
                </text>
              </view>
            </view>
            <view
              className={cn(
                'rounded-[10px] p-[10px] border flex flex-row gap-[8px]',
                lunaVariant === 'lunaris' && 'bg-neutral-film',
                lunaVariant === 'lunaris'
                  ? 'border-neutral-veil'
                  : 'border-line',
              )}
              bindtap={() => {
                emit({
                  type: 'studioThemeVariant',
                  payload: 'lunaris',
                  source: 'moonrise-theme-picker',
                })
              }}
            >
              <RadioItem value={'lunaris'} />
              <view className='flex-1 flex flex-col items-start pr-[4px] pb-[4px]'>
                <text className='text-start text-base text-content font-medium'>
                  Lunaris
                </text>
                <text className='text-start text-xs text-content-2'>
                  Signature gradient theme
                </text>
              </view>
            </view>
          </RadioGroup>
        </view>
        {/* Moodline: Potential Prompt for AI Gen */}
        <view className='w-full flex flex-col items-start gap-[10px]'>
          <text className='text-start text-base text-content font-medium'>
            Moodline
          </text>
          {/* Reserved for TextArea Demo */}
          <view className='w-full h-[52px] rounded-[10px] p-[10px] border border-line'>
            <text className='text-start text-sm text-content-muted'>
              Leave a trace of your dream
            </text>
          </view>
        </view>

        {/* Set the stage: App config */}
        <view className='w-full flex flex-col items-start gap-[16px]'>
          <view className='w-full flex flex-col items-start gap-[2px]'>
            <text className='text-start text-base text-content font-medium'>
              Set the stage
            </text>
            <text className='text-start text-p2 text-content-2'>
              Decide how you'll watch the next act unfold.
            </text>
          </view>
          <view className='w-full flex flex-col items-start gap-[10px]'>
            <view className='w-full flex flex-row items-center justify-between gap-[10px]'>
              <text className='text-start text-sm text-content-muted'>
                Lights on
              </text>
              <Switch
                size='sm'
                checked={lightsOn}
                onCheckedChange={(checked) => {
                  emit({
                    type: 'studioThemeMode',
                    payload: checked ? 'light' : 'dark',
                    source: 'moonrise-lights-on',
                  })
                }}
              />
            </view>
            <view className='w-full flex flex-row items-center justify-between gap-[10px]'>
              <text className='text-start text-sm text-content-muted'>
                Play itself
              </text>
              <Switch
                size='sm'
                checked={studioAutoplay}
                onCheckedChange={(checked) => {
                  emit({
                    type: 'studioAutoplay',
                    payload: checked,
                    source: 'moonrise-autoplay',
                  })
                }}
              />
            </view>
          </view>
        </view>

        {/* Acknowledgements */}
        <view className='w-full flex flex-col items-start gap-[10px] pt-[12px]'>
          {/* Checkbox Demo */}
          <view className='flex flex-row items-center gap-[10px]'>
            <Checkbox />
            <text className='text-p2 text-content'>
              I trust the rhythm of light and code
            </text>
          </view>
          <view className='flex flex-row items-center gap-[10px]'>
            <Checkbox defaultChecked />
            <text className='text-p2 text-content'>
              Let Lynx UI send me gentle updates
            </text>
          </view>
        </view>
      </view>
      {/* CTA: Call-To-Action */}
      <view
        className={cn(
          'w-full py-[16px] transition-all duration-500 ease-in-out overflow-hidden',
          studioViewMode !== 'compare' && 'transform-[translateY(-33vh)]',
          studioViewMode === 'compare' ? 'px-[16px]' : 'px-[32px]',
        )}
      >
        {/* Button Demo */}
        <view
          className={cn(
            'flex flex-col justify-end items-center w-full transition-all',
            studioViewMode === 'compare' ? 'gap-[8px]' : 'gap-[12px]',
          )}
        >
          <Button
            size='lg'
            variant={studioViewMode === 'compare' ? 'neutral' : 'primary'}
            bindtap={() => {
              emit({ type: 'requestViewModeChange', source: 'moonrise-cta' })
            }}
          >
            Let it bloom
          </Button>
          <Button size='lg' variant='secondary'>
            Stay asleep
          </Button>
        </view>
      </view>
    </view>
  )
}

export { ActMoonrise }
export type { ActMoonriseProps }
