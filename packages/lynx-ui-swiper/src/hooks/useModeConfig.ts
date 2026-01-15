// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo, useRef } from '@lynx-js/react'

import type {
  CompoundCustomModeConfig,
  CompoundModeConfig,
  CompoundNormalModeConfig,
  SwiperProps,
} from '../types'
import { comparePropsWithObject } from '../utils/compareProps'

/**
 * Handle mode and modeConfig
 * Only update reference when mode or content of modeConfig changes
 * This can prevent usage like this causing reRender every time.
 * ```
 * <Swiper mode="normal" modeConfig={{ align: 'center' }}></Swiper>
 * ```
 */
export function useModeConfig({
  mode = 'normal',
  modeConfig = {
    align: 'start',
    spaceBetween: 0,
  },
}: Pick<SwiperProps<unknown>, 'mode' | 'modeConfig'>) {
  const prevModeConfigRef = useRef<CompoundModeConfig | null>(null)

  const normalizedModeConfig = useMemo(() => {
    const newConfig: CompoundModeConfig = mode === 'custom'
      ? { mode, ...(modeConfig ?? {}) } as CompoundCustomModeConfig
      : {
        mode,
        ...(modeConfig ?? { align: 'start' }),
      } as CompoundNormalModeConfig

    // If previous config exists and is equal to new config, return cached version
    if (
      prevModeConfigRef.current
      && comparePropsWithObject(prevModeConfigRef.current, newConfig)
    ) {
      return prevModeConfigRef.current
    }

    // Update cache and return new config
    prevModeConfigRef.current = newConfig
    return newConfig
  }, [mode, modeConfig])

  const spaceBetween = (modeConfig.spaceBetween as number) ?? 0

  return { modeConfig: normalizedModeConfig, spaceBetween }
}
