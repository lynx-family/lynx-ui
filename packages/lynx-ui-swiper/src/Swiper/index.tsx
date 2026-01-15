// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  forwardRef,
  memo,
  useImperativeHandle,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'
import type { ForwardedRef } from '@lynx-js/react'

import { useTouchEmulation } from '@lynx-js/react-use'
import type { MainThread } from '@lynx-js/types'

import { LOOP_COUNT } from '../const'
import { useBounceConfig } from '../hooks/useBounceConfig'
import { useBounceView } from '../hooks/useBounceView'
import { useChange } from '../hooks/useChange'
import useFirstScreenStyle, {
  getInnerContainerWidthMT,
} from '../hooks/useFirstScreenStyle'
import { useModeConfig } from '../hooks/useModeConfig'
import { useOffset } from '../hooks/useOffset'
import { useOffsetLimit } from '../hooks/useOffsetLimit'
import { useReset } from '../hooks/useReset'
import { SwiperContext } from '../store'
import type {
  SwipeDirection,
  SwiperProps,
  SwiperRef,
  UpdateSwiperInnerContainerOptions,
} from '../types'
import { easeOut } from '../utils'
import { comparePropsWithObject } from '../utils/compareProps'

import './styles.css'

/**
 * Swiper Component
 */
const Swiper = forwardRef(
  <T,>(
    {
      data = [],
      itemWidth,
      containerWidth = lynx.__globalProps.screenWidth
        ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio,
      loop = false,
      mode,
      autoPlay = false,
      autoPlayInterval = 2000,
      duration = 500,
      itemHeight = 'auto',
      initialIndex = 0,
      onChange,
      onSwipeStart,
      onSwipeStop,
      modeConfig: _modeConfig,
      offsetLimit: _offsetLimit,
      bounceConfig,
      children,
      'main-thread:easing': easing = easeOut,
      'main-thread:customAnimation': customAnimation,
      'main-thread:onOffsetChange': onOffsetChange,
      customAnimationFirstScreen,
      swiperKey,
      resetOnReuse,
      trackStyle = {},
      style = {},
      loopDuplicateCount: rawLoopDuplicateCount = LOOP_COUNT,
      experimentalHorizontalSwipeOnly = false,
      consumeSlideEvent = [
        [-180, -135],
        [-45, 45],
        [135, 180],
      ],
      blockNativeEvent = false,
      RTL = false,
    }: SwiperProps<T> & { experimentalHorizontalSwipeOnly?: boolean },
    ref: ForwardedRef<SwiperRef>,
  ) => {
    const dataCount = data.length

    const loopDuplicateCount = Math.min(rawLoopDuplicateCount, dataCount)

    const containerRef = useMainThreadRef<MainThread.Element>(null)
    const childrenMapRef = useMainThreadRef<Record<number, MainThread.Element>>(
      {},
    )
    const { modeConfig, spaceBetween } = useModeConfig({
      mode,
      modeConfig: _modeConfig,
    })
    const offsetLimit = useOffsetLimit({
      offsetLimit: _offsetLimit,
      loop,
      itemWidth,
      containerWidth,
      modeConfig,
      dataCount,
      spaceBetween,
    })

    const {
      enableBounce,
      startBounceItem,
      endBounceItem,
      startBounceItemWidth,
      endBounceItemWidth,
      onStartBounceItemBounce,
      onEndBounceItemBounce,
    } = useBounceConfig(bounceConfig)

    function setChildrenRef(refI: MainThread.Element, key: number) {
      'main thread'
      childrenMapRef.current[key] = refI
    }

    const contextValue = useMemo(
      () => ({
        loop,
        itemWidth,
        itemHeight,
        setChildrenRef,
        modeConfig,
        initialIndex,
        customAnimationFirstScreen,
        spaceBetween,
        RTL,
      }),
      [loop, itemWidth, itemHeight, spaceBetween, RTL],
    )

    const { setChangeOffset, setChangeSwipeStartMT, setChangeSwipeStopMT } =
      useChange({
        onChange,
        size: itemWidth,
        spaceBetween,
        containerWidth,
        dataCount,
        modeConfig,
        offsetLimit,
        onSwipeStart,
        onSwipeStop,
        'main-thread:onOffsetChange': onOffsetChange,
      })

    function setOffset(offset: number) {
      'main thread'
      const container = containerRef.current
      if (container) {
        container.setStyleProperties({
          transform: `translate(${offset}px, 0)`,
          transition: 'none',
        })
      }
    }

    function updateSwiperInnerContainerSizeMT(
      updateOptions: UpdateSwiperInnerContainerOptions,
    ) {
      'main thread'
      const container = containerRef.current
      if (container) {
        const width = getInnerContainerWidthMT(updateOptions)
        // These values should get from function params, instead of closure, to make it is updated
        const {
          loop: _loop,
          loopDuplicateCount: _loopDuplicateCount,
          itemWidth: _itemWidth,
          spaceBetween: _spaceBetween,
          itemHeight: _itemHeight,
        } = updateOptions

        if (updateOptions.mode === 'custom') {
          // @ts-expect-error CSS types accepting number
          container.setStyleProperties({
            ...trackStyle,
            height: `${_itemHeight}px`,
          })
        } else {
          const insetInlineStartKey = RTL ? 'inset-inline-start' : 'left'
          // @ts-expect-error CSS types accepting number
          container.setStyleProperties({
            ...trackStyle,
            [insetInlineStartKey]: _loop
              ? `${-_loopDuplicateCount * (_itemWidth + _spaceBetween)}px`
              : '0px',
            width,
            height: `${_itemHeight}px`,
          })
        }
      }
    }

    function onChildrenOffsetUpdate(offset: number) {
      'main thread'
      const startCount = loop ? -loopDuplicateCount : 0
      const endCount = loop ? dataCount + loopDuplicateCount : dataCount
      for (let i = startCount; i < endCount; i++) {
        const child = childrenMapRef.current[i]
        const childOffset = offset + i * (itemWidth + spaceBetween)
        if (!customAnimation || !child) {
          return
        }
        const childStyles =
          customAnimation(childOffset / (itemWidth + spaceBetween), i)
          || {}
        child.setStyleProperties(childStyles as Record<string, string>)
      }
    }

    function onOffsetUpdate(offset: number, direction: SwipeDirection) {
      'main thread'
      if (modeConfig.mode === 'normal') {
        let effectiveOffset = offset
        if (modeConfig.align === 'center') {
          effectiveOffset = offset + (containerWidth - itemWidth) / 2
        } else if (modeConfig.align === 'end') {
          effectiveOffset = offset + containerWidth - itemWidth
        }
        setOffset(RTL ? -effectiveOffset : effectiveOffset)
        onChildrenOffsetUpdate(offset)
      } else {
        onChildrenOffsetUpdate(offset)
      }
      setChangeOffset(offset, direction)
    }

    function onSwipeStartMT() {
      'main thread'
      setChangeSwipeStartMT()
    }

    function onSwipeStopMT() {
      'main thread'
      setChangeSwipeStopMT()
    }

    // `containerStyle` is only used at firstScreen
    // After that, we use MTS to update styles imperatively
    const { containerStyle } = useFirstScreenStyle({
      itemWidth,
      containerWidth,
      loop,
      initialIndex,
      dataCount,
      modeConfig,
      itemHeight,
      offsetLimit,
      loopDuplicateCount,
      RTL,
      spaceBetween,
      swiperKey,
      trackStyle,
    })

    const {
      handleTouchMove,
      handleTouchStart,
      handleTouchEnd,
      swipeNext,
      swipePrev,
      swipeTo,
      resetOffsetMT,
      cancelAnimationJS,
      startAutoPlayMT,
    } = useOffset(
      {
        autoPlay,
        autoPlayInterval,
        loop,
        size: itemWidth,
        spaceBetween,
        dataCount,
        duration,
        easing,
        offsetLimit,
        initialIndex,
        modeConfig,
        containerWidth,
        enableBounce,
        startBounceItemWidth,
        endBounceItemWidth,
        onStartBounceItemBounce,
        onEndBounceItemBounce,
        experimentalHorizontalSwipeOnly,
        onSwipeStartMT,
        onSwipeStopMT,
        consumeSlideEvent,
        RTL,
      },
      onOffsetUpdate,
    )

    const { setContainerRef } = useReset({
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
      loopDuplicateCount,
      updateSwiperInnerContainerSizeMT,
      startAutoPlayMT,
      spaceBetween,
    })

    const touchHandlers = useTouchEmulation({
      onTouchCancelMT: handleTouchEnd,
      onTouchEndMT: handleTouchEnd,
      onTouchMoveMT: handleTouchMove,
      onTouchStartMT: handleTouchStart,
    })

    useImperativeHandle(ref, () => ({
      swipeNext,
      swipePrev,
      swipeTo,
      cancelAnimation: cancelAnimationJS,
    }))

    const { bounceStartView, bounceEndView } = useBounceView({
      startBounceItem,
      endBounceItem,
      loop,
      mode: modeConfig.mode,
      itemWidth,
      count: dataCount,
      RTL,
      containerWidth,
    })

    return (
      <SwiperContext.Provider value={contextValue}>
        <view
          class='swiper-root'
          style={{
            ...style,
            width: `${containerWidth}px`,
            height: `${itemHeight}px`,
            direction: RTL === 'lynx-rtl' ? 'lynx-rtl' : (RTL ? 'rtl' : 'ltr'),
          }}
          {...touchHandlers}
          consume-slide-event={consumeSlideEvent}
          block-native-event={blockNativeEvent}
        >
          <view
            class='swiper-track'
            style={containerStyle}
            ref={setContainerRef}
            main-thread:ref={containerRef}
            implicit-animation='false'
          >
            {bounceStartView}
            {loop
              ? (
                <>
                  {Array.from(
                    { length: loopDuplicateCount },
                    (_, i) => loopDuplicateCount - i - 1,
                  ).map((i) =>
                    children({
                      index: data.length - i - 1,
                      item: data[data.length - i - 1],
                      realIndex: -i - 1,
                    })
                  )}
                </>
              )
              : null}
            {data.map((item: T, index: number) =>
              children({
                index,
                item,
                realIndex: index,
              })
            )}
            {loop
              ? (
                <>
                  {Array.from({ length: loopDuplicateCount }, (_, i) => i).map((
                    i,
                  ) =>
                    children({
                      index: i,
                      item: data[i],
                      realIndex: data.length + i,
                    })
                  )}
                </>
              )
              : null}
            {bounceEndView}
          </view>
        </view>
      </SwiperContext.Provider>
    )
  },
)

const MemoizedSwiper = memo(
  Swiper,
  (prevProps, nextProps) =>
    comparePropsWithObject(prevProps, nextProps, ['modeConfig', 'bounces']),
) as typeof Swiper

export { MemoizedSwiper as Swiper }
