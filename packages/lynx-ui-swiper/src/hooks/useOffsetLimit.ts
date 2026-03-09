// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from '@lynx-js/react'

import type {
  CompoundModeConfig,
  OffsetLimitResult,
  SwiperProps,
} from '../types'

interface IOffsetLimit extends
  Required<
    Pick<SwiperProps<unknown>, 'loop' | 'itemWidth' | 'containerWidth'>
  >
{
  offsetLimit: SwiperProps<unknown>['offsetLimit']
  modeConfig: CompoundModeConfig
  dataCount: number
  spaceBetween: number
}

/**
 * `offsetLimit` is used to limit the range of offset. Useful for when setting `align='start'`,
 * the last item should align with right edge, instead of align to the left.
 * This can achieved by setting offsetLimit to `[0, containerWidth - itemWidth]`, which basically
 * prevent further scroll if the last item is bond to right edge.
 */
export function useOffsetLimit({
  offsetLimit,
  loop,
  modeConfig,
  itemWidth,
  containerWidth,
  spaceBetween,
  dataCount,
}: IOffsetLimit): OffsetLimitResult {
  const finalOffsetLimit = useMemo<OffsetLimitResult>(() => {
    const epsilon = 0.000001
    const fullSize = itemWidth + spaceBetween
    const totalContentWidth = fullSize * dataCount - spaceBetween

    if (loop) {
      return {
        startLimit: 0,
        endLimit: 0,
        isNotEnoughForScreen: false,
      }
    } else if (offsetLimit) {
      return {
        startLimit: offsetLimit[0],
        endLimit: offsetLimit[1],
        isNotEnoughForScreen: false,
      }
    } else {
      // If SwiperItem can not occupy the screen, do not apply offsetLimit.
      if (totalContentWidth <= containerWidth + epsilon) {
        return {
          startLimit: 0,
          // Lock both start/end to the same offset to disable scroll.
          endLimit: Math.max(fullSize * (dataCount - 1), 0),
          isNotEnoughForScreen: true,
        }
      }

      if (modeConfig.mode === 'normal' && modeConfig.align === 'start') {
        return {
          startLimit: 0,
          endLimit: containerWidth - itemWidth,
          isNotEnoughForScreen: false,
        }
      } else if (modeConfig.mode === 'normal' && modeConfig.align === 'end') {
        return {
          startLimit: containerWidth - itemWidth,
          endLimit: 0,
          isNotEnoughForScreen: false,
        }
      }
      return {
        startLimit: 0,
        endLimit: 0,
        isNotEnoughForScreen: false,
      }
    }
  }, [
    dataCount,
    offsetLimit?.[0],
    offsetLimit?.[1],
    modeConfig,
    loop,
    itemWidth,
    spaceBetween,
    containerWidth,
  ])

  return finalOffsetLimit
}
