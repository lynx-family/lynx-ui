// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { runOnMainThread, useEffect, useRef } from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'
import type { NodesRef } from '@lynx-js/types'

import type {
  CompoundModeConfig,
  ResetOptions,
  SwiperProps,
  UpdateSwiperInnerContainerOptions,
} from '../types'

interface UseResetOpts extends
  Required<
    Pick<
      SwiperProps<unknown>,
      | 'swiperKey'
      | 'loop'
      | 'itemWidth'
      | 'itemHeight'
      | 'containerWidth'
      | 'initialIndex'
      | 'loopDuplicateCount'
    >
  >
{
  resetOnReuse: SwiperProps<unknown>['resetOnReuse']
  dataCount: number
  modeConfig: CompoundModeConfig
  spaceBetween: number
  resetOffsetMT: (fullReset: ResetOptions) => void
  updateSwiperInnerContainerSizeMT: (
    updateOptions: UpdateSwiperInnerContainerOptions,
  ) => void
  startAutoPlayMT: () => void
}

export function useReset({
  swiperKey,
  itemHeight,
  itemWidth,
  containerWidth,
  loop,
  dataCount,
  modeConfig,
  resetOffsetMT,
  resetOnReuse,
  initialIndex,
  updateSwiperInnerContainerSizeMT,
  loopDuplicateCount,
  startAutoPlayMT,
  spaceBetween,
}: UseResetOpts) {
  const prevSwiperKey = useRef<unknown>(swiperKey)
  const isFirstRun = useRef<boolean>(true)
  const containerRef = useRef<NodesRef | null>(null)

  function doResetMT(
    resetOptions: ResetOptions & UpdateSwiperInnerContainerOptions,
  ) {
    'main thread'
    // Get props from function args, instead of automatically captured, to avoid staled states
    const {
      fullReset,
      resetIndex,
      dataCount: _dataCount,
      itemWidth: _itemWidth,
      loop: _loop,
      loopDuplicateCount: _loopDuplicateCount,
      spaceBetween: _gap,
      itemHeight: _itemHeight,
    } = resetOptions
    resetOffsetMT({
      fullReset,
      resetIndex,
    })
    updateSwiperInnerContainerSizeMT({
      dataCount: _dataCount,
      itemWidth: _itemWidth,
      loop: _loop,
      loopDuplicateCount: _loopDuplicateCount,
      spaceBetween: _gap,
      itemHeight: _itemHeight,
      mode: modeConfig.mode,
    })
    startAutoPlayMT()
  }

  const doReset = useMemoizedFn((fullReset: boolean) => {
    runOnMainThread(doResetMT)({
      fullReset,
      resetIndex: fullReset ? initialIndex : undefined,
      dataCount,
      itemWidth,
      loop,
      loopDuplicateCount,
      spaceBetween,
      itemHeight,
      mode: modeConfig.mode,
    })
  })

  /**
   * When used in list, while Swiper Component is new, container element will be reused, causing old styles are applied.
   * When reused, ref setter will fire setRef with null, then with actual nodes
   * We use this as the sign of reuse, and doing a clean up.
   */
  const setContainerRef = useMemoizedFn(
    (ref: NodesRef) => {
      if (containerRef.current === null && ref !== null && resetOnReuse) {
        doReset(true)
      }
      containerRef.current = ref
    },
  )

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (prevSwiperKey.current === swiperKey) {
      doReset(false)
    } else {
      prevSwiperKey.current = swiperKey
      doReset(true)
    }
  }, [
    modeConfig,
    itemWidth,
    containerWidth,
    loop,
    dataCount,
    itemHeight,
    swiperKey,
    loopDuplicateCount,
  ])

  return { setContainerRef }
}
