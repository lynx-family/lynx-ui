// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from '@lynx-js/react'

import type { CSSProperties } from '@lynx-js/types'

import type {
  CompoundModeConfig,
  OffsetLimitResult,
  SwiperProps,
} from '../types'
import { limiterForFirstScreen } from '../utils'

interface LayoutSwiperPropsType extends
  Pick<
    SwiperProps<unknown>,
    'itemWidth' | 'initialIndex' | 'itemHeight' | 'trackStyle'
  >,
  Required<
    Pick<
      SwiperProps<unknown>,
      | 'containerWidth'
      | 'loop'
      | 'loopDuplicateCount'
      | 'RTL'
      | 'swiperKey'
    >
  >
{
  spaceBetween: number
  dataCount: number
  modeConfig: CompoundModeConfig
  offsetLimit: OffsetLimitResult
}

interface EscapeProps
  extends
    Pick<SwiperProps<unknown>, 'itemWidth' | 'initialIndex'>,
    Required<
      Pick<
        SwiperProps<unknown>,
        'containerWidth' | 'loop' | 'RTL'
      >
    >
{
  spaceBetween: number
  dataCount: number
  modeConfig: CompoundModeConfig
  offsetLimit: OffsetLimitResult
}

function getOffset(props: EscapeProps) {
  const {
    modeConfig,
    itemWidth,
    initialIndex = 0,
    loop,
    dataCount,
    containerWidth,
    offsetLimit,
    RTL,
    spaceBetween,
  } = props
  let alignOffset = 0
  if (modeConfig.mode === 'normal') {
    if (modeConfig.align === 'center') {
      alignOffset = (containerWidth - itemWidth) / 2
    } else if (modeConfig.align === 'end') {
      alignOffset = containerWidth - itemWidth
    } else {
      alignOffset = 0
    }
  }

  const finalOffset = limiterForFirstScreen(
    -(itemWidth + spaceBetween) * initialIndex + alignOffset,
    dataCount,
    itemWidth,
    spaceBetween,
    loop,
    offsetLimit,
    alignOffset,
  )

  return RTL ? -finalOffset : finalOffset
}

export function getInnerContainerWidth(props: {
  itemWidth: number
  loopDuplicateCount?: number
  loop: boolean
  dataCount: number
  spaceBetween: number
}) {
  const {
    itemWidth,
    loopDuplicateCount = 0,
    loop,
    dataCount,
    spaceBetween,
  } = props
  const width = loop
    ? `${(dataCount + loopDuplicateCount * 2) * (itemWidth + spaceBetween)}px`
    : `${dataCount * (itemWidth + spaceBetween) - spaceBetween}px`
  return width
}

export function getInnerContainerWidthMT(props: {
  itemWidth: number
  loopDuplicateCount?: number
  loop: boolean
  dataCount: number
  spaceBetween: number
}) {
  'main thread'
  const {
    itemWidth,
    loopDuplicateCount = 0,
    loop,
    dataCount,
    spaceBetween,
  } = props
  const width = loop
    ? `${(dataCount + loopDuplicateCount * 2) * (itemWidth + spaceBetween)}px`
    : `${dataCount * (itemWidth + spaceBetween) - spaceBetween}px`

  return width
}

/**
 * MTS does not support first screen mutation.
 * We use `useMemo` hack to make firstScreen style correct.
 * When MTS is not ready, we use `useMemo` to get the style, and set it to view. Since there's no
 * dependency in `useMemo`, the view will only be set on firstScreen.
 * After that, all the updated are handled by MTS via `setStyleProperties`
 */
function useFirstScreenStyle(props: LayoutSwiperPropsType): {
  containerStyle: CSSProperties | undefined
} {
  const {
    itemWidth,
    spaceBetween,
    containerWidth,
    loop,
    initialIndex,
    dataCount,
    itemHeight,
    modeConfig,
    offsetLimit,
    loopDuplicateCount,
    RTL,
    swiperKey,
    trackStyle,
  } = props
  const escapeProps = {
    itemWidth,
    containerWidth,
    itemHeight,
    loop,
    initialIndex,
    dataCount,
    modeConfig,
    offsetLimit,
    RTL,
    spaceBetween,
  }

  const containerStyle = useMemo(() => {
    const insetInlineStartKey = RTL ? 'inset-inline-start' : 'left'
    if (modeConfig.mode === 'normal') {
      return {
        ...trackStyle,
        width: getInnerContainerWidth({
          itemWidth,
          loopDuplicateCount,
          loop,
          dataCount,
          spaceBetween,
        }),
        [insetInlineStartKey]: loop
          ? `${-loopDuplicateCount * (itemWidth + spaceBetween)}px`
          : '0px',
        transform: `translateX(${getOffset(escapeProps)}px)`,
        height: `${itemHeight}px`,
      }
    } else if (modeConfig.mode === 'custom') {
      return {
        height: `${itemHeight}px`,
      }
    }
  }, [swiperKey])

  return {
    containerStyle,
  }
}

export default useFirstScreenStyle
