// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnBackground, useMainThreadRef } from '@lynx-js/react'

import { SwipeDirection } from '../types'
import type {
  CompoundModeConfig,
  OffsetLimitResult,
  SwiperProps,
} from '../types'
import { eqOrGtMT, eqOrLtMT, fixPrecisionMT, safeEqualMT } from '../utils'

interface UseChangeOpts extends
  Pick<
    SwiperProps<unknown>,
    'containerWidth' | 'onSwipeStart' | 'onSwipeStop'
  >
{
  onChange?: (offset: number) => void
  size: number
  spaceBetween: number
  dataCount: number
  offsetLimit: OffsetLimitResult
  'main-thread:onOffsetChange'?: (offset: number) => void
  modeConfig: CompoundModeConfig
}

/**
 * This hook handles change related things
 * Including `onChange` and `main-thread:onOffsetChange`
 */
export function useChange({
  onChange,
  size: _size,
  spaceBetween,
  dataCount,
  onSwipeStart,
  onSwipeStop,
  offsetLimit,
  'main-thread:onOffsetChange': onOffsetChange,
}: UseChangeOpts) {
  const prevIndexMTRef = useMainThreadRef<number>(0)
  const prevOffsetMTRef = useMainThreadRef<number>(0)
  const currentIndexMTRef = useMainThreadRef<number>(0)

  const size = _size + spaceBetween

  function callOnChange(currentIndex: number) {
    if (onChange) {
      onChange(currentIndex)
    }
  }

  function callOnSwipeStart(currentIndex: number) {
    if (onSwipeStart) {
      onSwipeStart(currentIndex)
    }
  }
  function callOnSwipeStop(currentIndex: number) {
    if (onSwipeStop) {
      onSwipeStop(currentIndex)
    }
  }

  function setChangeSwipeStopMT() {
    'main thread'
    runOnBackground(callOnSwipeStop)(currentIndexMTRef.current)
  }

  function setChangeSwipeStartMT() {
    'main thread'
    runOnBackground(callOnSwipeStart)(currentIndexMTRef.current)
  }

  function setChangeOffset(offset: number, direction: SwipeDirection) {
    'main thread'

    function mod(n: number, m: number) {
      return ((n % m) + m) % m
    }

    // Calculate raw index with proper sign handling
    const rawIndex = fixPrecisionMT(-offset / size)
    let currentIndex: number

    if (direction === SwipeDirection.NORMAL) {
      currentIndex = Math.floor(rawIndex)
    } else if (direction === SwipeDirection.REVERT) {
      currentIndex = Math.ceil(rawIndex)
    } else {
      currentIndex = currentIndexMTRef.current
    }

    currentIndex = mod(currentIndex, dataCount || Number.MAX_SAFE_INTEGER)

    // If offsetLimit is applied, swiper could not scroll to the end.
    // In this case, when it can no longer scroll, set index to 0 or max
    // offsetLimit is always 0 in loop mode, so code below will only work when loop is false
    if (
      !safeEqualMT(offsetLimit.startLimit, 0)
      && eqOrGtMT(offset, -offsetLimit.startLimit)
    ) {
      currentIndex = 0
    } else if (
      !safeEqualMT(offsetLimit.endLimit, 0)
      && eqOrLtMT(offset, -size * (dataCount - 1) + offsetLimit.endLimit)
    ) {
      currentIndex = dataCount - 1
    }

    currentIndexMTRef.current = currentIndex
    if (onOffsetChange && !safeEqualMT(offset, prevOffsetMTRef.current)) {
      onOffsetChange(offset)
    }

    if (!safeEqualMT(prevIndexMTRef.current, currentIndex)) {
      runOnBackground(callOnChange)(currentIndex)
      prevIndexMTRef.current = currentIndex
    }

    prevOffsetMTRef.current = offset
  }

  return {
    setChangeOffset,
    setChangeSwipeStartMT,
    setChangeSwipeStopMT,
  }
}
